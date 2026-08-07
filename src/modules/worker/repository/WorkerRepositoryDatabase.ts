import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import ChangeTrackingObserver from "../../@common/ChangeTrackingObserver.js";
import { DrizzleCriteriaApply } from "../../@common/DrizzleCriteriaApply.js";
import Step from "../domain/Step.js";
import Worker from "../domain/Worker.js";
import { WorkerStepTable } from "../db/WorkerStepTable.js";
import { WorkerTable } from "../db/WorkerTable.js";
import WorkerCriteria from "./WorkerCriteria.js";
import WorkerRepository from "./WorkerRepository.js";

export default class WorkerRepositoryDatabase implements WorkerRepository {
    constructor(private readonly _db: NodePgDatabase) { }

    public async save(worker: Worker): Promise<void> {
        const tracker = worker.findObserver<ChangeTrackingObserver>(o => o instanceof ChangeTrackingObserver);

        if (!tracker || tracker.hasEvent("workerCreated")) {
            await this._add(worker);
            return;
        }

        for (const step of worker.steps.getAll()) {
            const stepTracker = step.findObserver<ChangeTrackingObserver>(o => o instanceof ChangeTrackingObserver);

            if (!stepTracker?.hasEvent("StatusChanged")) continue;

            await this._db.update(WorkerStepTable).set({
                status: step.status.value,
            }).where(eq(WorkerStepTable.id, step.id.value));
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
            })),
        });
    }

    private async _add(worker: Worker): Promise<void> {
        await this._db.insert(WorkerTable).values({
            id: worker.id,
            name: worker.name,
            type: worker.type.value,
            tenantId: worker.tenantId,
            createdAt: worker.createdAt,
        });

        for (const step of worker.steps.getAll()) {
            await this._db.insert(WorkerStepTable).values({
                id: step.id.value,
                workerId: worker.id,
                action: step.action,
                input: step.input,
                order: step.order,
                type: step.type.value,
                status: step.status.value,
            });
        }
    }
}
