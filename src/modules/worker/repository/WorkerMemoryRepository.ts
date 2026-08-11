import WorkerMemory from "../domain/entity/WorkerMemory.js";

/**
 * Where the facts a worker gathered while running are kept, so a run that starts
 * again knows what the completed steps already produced.
 */
export default interface WorkerMemoryRepository {
    get(workerId: string): Promise<WorkerMemory>;
    save(workerId: string, memory: WorkerMemory): Promise<void>;
}
