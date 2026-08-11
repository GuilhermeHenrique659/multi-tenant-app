import WorkerMemory, { MemoryEntry } from "../domain/entity/WorkerMemory.js";
import WorkerMemoryRepository from "./WorkerMemoryRepository.js";

/**
 * Keeps the memory of each worker in the process, which is enough for a run that
 * stops and starts again while the server is up. A database implementation takes
 * its place when the memory has to survive a restart.
 */
export default class WorkerMemoryRepositoryInMemory implements WorkerMemoryRepository {
    private readonly _entries = new Map<string, MemoryEntry[]>();

    public async get(workerId: string): Promise<WorkerMemory> {
        return WorkerMemory.restore(this._entries.get(workerId) ?? []);
    }

    public async save(workerId: string, memory: WorkerMemory): Promise<void> {
        this._entries.set(workerId, memory.toJSON());
    }
}
