import AuthorizerApplicationService from "../../@common/AuthorizerApplicationService.js";
import ProjectQuery from "../query/ProjectQuery.js";
import { GetTaskRequest, TaskWithAssignee } from "../index.js";

export default class GetTask implements AuthorizerApplicationService<GetTaskRequest, TaskWithAssignee> {
    constructor(private readonly _query: ProjectQuery) { }

    async execute(input: GetTaskRequest): Promise<TaskWithAssignee> {
        const task = await this._query.getTaskWithAssignee(input.taskId);
        if (!task) throw new Error("Task not found");
        return task;
    }
}