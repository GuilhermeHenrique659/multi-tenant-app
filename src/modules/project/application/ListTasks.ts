import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import ProjectQuery from "../query/ProjectQuery.js";
import { ListTasksRequest, TaskListItem } from "../index.js";

export default class ListTasks implements AuthorizerApplicationService<ListTasksRequest, TaskListItem[]> {
    constructor(private readonly _query: ProjectQuery) { }

    async execute(input: ListTasksRequest): Promise<TaskListItem[]> {
        return this._query.listTasksByProjectId(input.projectId);
    }
}