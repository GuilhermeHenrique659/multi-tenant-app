import { asc, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { WorkerStepTable } from "../db/WorkerStepTable.js";
import { WorkerTable } from "../db/WorkerTable.js";
import { WorkerListItem } from "../index.js";
import StepType from "../domain/StepType.js";

export type WorkerStepRow = {
    id: string;
    name: string;
    stepAction: string | null;
    stepStatus: string | null;
    stepOrder: number | null;
    stepType: string | null;
    stepInput: unknown | null,
    stepError: string | null,
};

/** One row per step, so the rows of a worker are folded into a single item. */
export function toWorkerList(rows: WorkerStepRow[]): WorkerListItem[] {
    const workers = new Map<string, WorkerListItem>();

    for (const row of rows) {
        const worker = workers.get(row.id) ?? { id: row.id, name: row.name, steps: [] };

        if (row.stepAction && row.stepType) worker.steps.push({
            action: row.stepAction,
            type: row.stepType,
            input: StepType.isAsk(row.stepType) ? row.stepInput : null,
            error: row.stepError,
            status: row.stepStatus ?? 'pending',
            order: row.stepOrder ?? 0,
        });

        workers.set(row.id, worker);
    }

    return [...workers.values()];
}

export default class WorkerQuery {
    constructor(private readonly _db: NodePgDatabase) { }

    public async listWorkersByTenantId(tenantId: string): Promise<WorkerListItem[]> {
        const rows = await this._db.select({
            id: WorkerTable.id,
            name: WorkerTable.name,
            stepAction: WorkerStepTable.action,
            stepStatus: WorkerStepTable.status,
            stepOrder: WorkerStepTable.order,
            stepInput: WorkerStepTable.input,
            stepType: WorkerStepTable.type,
            stepError: WorkerStepTable.error,
        })
            .from(WorkerTable)
            .leftJoin(WorkerStepTable, eq(WorkerStepTable.workerId, WorkerTable.id))
            .where(eq(WorkerTable.tenantId, tenantId))
            .orderBy(asc(WorkerTable.createdAt), asc(WorkerStepTable.order));

        return toWorkerList(rows);
    }
}
