import { BaseCriteria } from "../../@common/Criteria.js";
import Project from "../domain/Project.js";

export default interface ProjectRepository {
    save(project: Project): Promise<void>;
    get(criteria: BaseCriteria): Promise<Project | null>;
    has(criteria: BaseCriteria): Promise<boolean>;
}