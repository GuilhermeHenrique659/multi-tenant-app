import { BaseCriteria } from "../../@common/Criteria.js";
import Task from "../domain/Task.js";

export default interface TaskRepository {
    save(task: Task): Promise<void>;
    has(criteria: BaseCriteria): Promise<boolean>;
    get(criteria: BaseCriteria): Promise<Task | null>;
}