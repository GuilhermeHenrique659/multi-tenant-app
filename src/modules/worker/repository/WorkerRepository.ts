export default interface WorkerRepository {
    save(worker: Worker): Promise<void>;
}