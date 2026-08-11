import { asc, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { AgentStepTable } from "../db/AgentStepTable.js";
import { AgentTable } from "../db/AgentTable.js";
import { AgentListItem } from "../index.js";
import StepType from "../domain/entity/StepType.js";

export type AgentStepRow = {
    id: string;
    name: string;
    stepId: string | null
    stepAction: string | null;
    stepStatus: string | null;
    stepOrder: number | null;
    stepType: string | null;
    stepInput: unknown | null,
    stepError: string | null,
    stepAnswer: string | null,
};

/** One row per step, so the rows of a agent are folded into a single item. */
export function toAgentList(rows: AgentStepRow[]): AgentListItem[] {
    const agents = new Map<string, AgentListItem>();

    for (const row of rows) {
        const agent = agents.get(row.id) ?? { id: row.id, name: row.name, steps: [] };

        if (row.stepAction && row.stepType && row.stepId) agent.steps.push({
            id: row.stepId,
            action: row.stepAction,
            type: row.stepType,
            input: StepType.isAsk(row.stepType) ? row.stepInput : null,
            error: row.stepError,
            answer: row.stepAnswer,
            status: row.stepStatus ?? 'pending',
            order: row.stepOrder ?? 0,
        });

        agents.set(row.id, agent);
    }

    return [...agents.values()];
}

export default class AgentQuery {
    constructor(private readonly _db: NodePgDatabase) { }

    public async listAgentsByTenantId(tenantId: string): Promise<AgentListItem[]> {
        const rows = await this._db.select({
            id: AgentTable.id,
            name: AgentTable.name,
            stepId: AgentStepTable.id,
            stepAction: AgentStepTable.action,
            stepStatus: AgentStepTable.status,
            stepOrder: AgentStepTable.order,
            stepInput: AgentStepTable.input,
            stepType: AgentStepTable.type,
            stepError: AgentStepTable.error,
            stepAnswer: AgentStepTable.answer,
        })
            .from(AgentTable)
            .leftJoin(AgentStepTable, eq(AgentStepTable.agentId, AgentTable.id))
            .where(eq(AgentTable.tenantId, tenantId))
            .orderBy(asc(AgentTable.createdAt), asc(AgentStepTable.order));

        return toAgentList(rows);
    }
}
