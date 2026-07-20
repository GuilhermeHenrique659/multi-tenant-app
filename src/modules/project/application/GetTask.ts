import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import ProjectQuery from "../query/ProjectQuery.js";
import { GetTaskRequest, TaskWithAssignee } from "../index.js";

export default class GetTask implements AuthorizerApplicationService<GetTaskRequest, TaskWithAssignee | null> {
    constructor(private readonly _query: ProjectQuery) { }

    async execute(input: GetTaskRequest): Promise<TaskWithAssignee | null> {
        return this._query.getTaskWithAssignee(input.taskId);
    }
}