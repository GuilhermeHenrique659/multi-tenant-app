import { eq, inArray } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import ChangeTrackingObserver from "../../@common/ChangeTrackingObserver.js";
import { DrizzleCriteriaApply } from "../../@common/DrizzleCriteriaApply.js";
import Step from "../domain/entity/Step.js";
import Worker from "../domain/entity/Worker.js";
import { WorkerStepTable } from "../db/WorkerStepTable.js";
import { WorkerTable } from "../db/WorkerTable.js";
import WorkerCriteria from "./WorkerCriteria.js";
import WorkerRepository from "./WorkerRepository.js";

type ReplanChange = {
    removed: string[];
    added: string[];
}

export default class WorkerRepositoryDatabase implements WorkerRepository {
    constructor(private readonly _db: NodePgDatabase) { }

    public async save(worker: Worker): Promise<void> {
        const tracker = worker.findObserver<ChangeTrackingObserver>(o => o instanceof ChangeTrackingObserver);

        if (!tracker || tracker.hasEvent("workerCreated")) {
            await this._add(worker);
            return;
        }

        const replanned = tracker.findFindEvent("stepsReplanned");

        if (replanned) await this._applyReplan(worker, replanned.data as ReplanChange);

        for (const step of worker.steps.getAll()) {
            const stepTracker = step.findObserver<ChangeTrackingObserver>(o => o instanceof ChangeTrackingObserver);

            if (stepTracker?.hasEvent("StepUpdated")) {
                await this._db.update(WorkerStepTable).set({
                    status: step.status.value,
                    error: step.error ?? null,
                    answer: step.answer,
                }).where(eq(WorkerStepTable.id, step.id.value));
            }
        }
    }

    public async get(criteria: WorkerCriteria): Promise<Worker | null> {
        const [worker] = await this._db
            .select()
            .from(WorkerTable)
            .where(DrizzleCriteriaApply(criteria, WorkerTable))
            .limit(1);

        if (!worker) return null;

        const steps = await this._db
            .select()
            .from(WorkerStepTable)
            .where(eq(WorkerStepTable.workerId, worker.id))
            .orderBy(WorkerStepTable.order);

        return Worker.restore({
            id: worker.id,
            tenantId: worker.tenantId,
            name: worker.name,
            userPrompt: worker.userPrompt,
            type: worker.type,
            createdAt: worker.createdAt,
            steps: steps.map(step => Step.restore({
                id: step.id,
                workerId: step.workerId,
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
    private async _applyReplan(worker: Worker, change: ReplanChange): Promise<void> {
        if (change.removed.length) {
            await this._db.delete(WorkerStepTable).where(inArray(WorkerStepTable.id, change.removed));
        }

        const added = worker.steps.getAll().filter(step => change.added.includes(step.id.value));

        for (const step of added) {
            await this._insertStep(worker, step);
        }
    }

    private async _add(worker: Worker): Promise<void> {
        await this._db.insert(WorkerTable).values({
            id: worker.id,
            name: worker.name,
            userPrompt: worker.userPrompt,
            type: worker.type.value,
            tenantId: worker.tenantId,
            createdAt: worker.createdAt,
        });

        for (const step of worker.steps.getAll()) {
            await this._insertStep(worker, step);
        }
    }

    private async _insertStep(worker: Worker, step: Step): Promise<void> {
        await this._db.insert(WorkerStepTable).values({
            id: step.id.value,
            workerId: worker.id,
            action: step.action,
            input: step.input,
            order: step.order,
            type: step.type.value,
            status: step.status.value,
            error: step.error ?? null,
        });
    }
}
