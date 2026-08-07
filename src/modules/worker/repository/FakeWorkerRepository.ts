import Worker from "../domain/Worker.js";
import WorkerCriteria from "./WorkerCriteria.js";
import WorkerRepository from "./WorkerRepository.js";

export default class FakeWorkerRepository implements WorkerRepository {
    private readonly workers = new Map<string, Worker>();
    private _saveCount = 0;

    get saveCount(): number {
        return this._saveCount;
    }

    async save(worker: Worker): Promise<void> {
        this._saveCount++;
        this.workers.set(worker.id, worker);
    }

    async get(criteria: WorkerCriteria): Promise<Worker | null> {
        for (const worker of this.workers.values()) {
            if (this.matches(worker, criteria)) return worker;
        }
        return null;
    }

    private matches(worker: Worker, criteria: WorkerCriteria): boolean {
        const snapshot: Record<string, string> = { id: worker.id, tenantId: worker.tenantId };

        return criteria.criterias.every(c => {
            if (c.op !== 'eq') return false;
            const value = snapshot[c.key];
            return value !== undefined && value === String(c.value);
        });
    }

    clear(): void {
        this.workers.clear();
        this._saveCount = 0;
    }
}
