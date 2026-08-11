import { eq, inArray } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import ChangeTrackingObserver from "../../@common/ChangeTrackingObserver.js";
import { DrizzleCriteriaApply } from "../../@common/DrizzleCriteriaApply.js";
import Step from "../domain/entity/Step.js";
import Agent from "../domain/entity/Agent.js";
import { AgentStepTable } from "../db/AgentStepTable.js";
import { AgentTable } from "../db/AgentTable.js";
import AgentCriteria from "./AgentCriteria.js";
import AgentRepository from "./AgentRepository.js";

type ReplanChange = {
    removed: string[];
    added: string[];
}

export default class AgentRepositoryDatabase implements AgentRepository {
    constructor(private readonly _db: NodePgDatabase) { }

    public async save(agent: Agent): Promise<void> {
        const tracker = agent.findObserver<ChangeTrackingObserver>(o => o instanceof ChangeTrackingObserver);

        if (!tracker || tracker.hasEvent("agentCreated")) {
            await this._add(agent);
            return;
        }

        const replanned = tracker.findFindEvent("stepsReplanned");

        if (replanned) await this._applyReplan(agent, replanned.data as ReplanChange);

        for (const step of agent.steps.getAll()) {
            const stepTracker = step.findObserver<ChangeTrackingObserver>(o => o instanceof ChangeTrackingObserver);

            if (stepTracker?.hasEvent("StepUpdated")) {
                await this._db.update(AgentStepTable).set({
                    status: step.status.value,
                    error: step.error ?? null,
                    answer: step.answer,
                }).where(eq(AgentStepTable.id, step.id.value));
            }
        }
    }

    public async get(criteria: AgentCriteria): Promise<Agent | null> {
        const [agent] = await this._db
            .select()
            .from(AgentTable)
            .where(DrizzleCriteriaApply(criteria, AgentTable))
            .limit(1);

        if (!agent) return null;

        const steps = await this._db
            .select()
            .from(AgentStepTable)
            .where(eq(AgentStepTable.agentId, agent.id))
            .orderBy(AgentStepTable.order);

        return Agent.restore({
            id: agent.id,
            tenantId: agent.tenantId,
            name: agent.name,
            userPrompt: agent.userPrompt,
            type: agent.type,
            createdAt: agent.createdAt,
            steps: steps.map(step => Step.restore({
                id: step.id,
                agentId: step.agentId,
                action: step.action,
                input: step.input,
                order: step.order,
                type: step.type,
                status: step.status,
                error: step.error,
                answer: step.answer,
            })),
        });
    }

    /** The steps the new plan dropped leave the table and the ones it created enter it. */
    private async _applyReplan(agent: Agent, change: ReplanChange): Promise<void> {
        if (change.removed.length) {
            await this._db.delete(AgentStepTable).where(inArray(AgentStepTable.id, change.removed));
        }

        const added = agent.steps.getAll().filter(step => change.added.includes(step.id.value));

        for (const step of added) {
            await this._insertStep(agent, step);
        }
    }

    private async _add(agent: Agent): Promise<void> {
        await this._db.insert(AgentTable).values({
            id: agent.id,
            name: agent.name,
            userPrompt: agent.userPrompt,
            type: agent.type.value,
            tenantId: agent.tenantId,
            createdAt: agent.createdAt,
        });

        for (const step of agent.steps.getAll()) {
            await this._insertStep(agent, step);
        }
    }

    private async _insertStep(agent: Agent, step: Step): Promise<void> {
        await this._db.insert(AgentStepTable).values({
            id: step.id.value,
            agentId: agent.id,
            action: step.action,
            input: step.input,
            order: step.order,
            type: step.type.value,
            status: step.status.value,
            error: step.error ?? null,
        });
    }
}
