import Worker from "../domain/Worker.js";
import WorkerCriteria from "./WorkerCriteria.js";

export default interface WorkerRepository {
    save(worker: Worker): Promise<void>;
    get(criteria: WorkerCriteria): Promise<Worker | null>;
}