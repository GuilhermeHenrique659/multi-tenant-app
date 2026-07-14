import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import Task from "../domain/Task.js";
import TaskRepository from "../repository/TaskRepository.js";

export default class AddTask implements AuthorizerApplicationService<Input, Output> {
    constructor (private readonly _taskRepository: TaskRepository) {}

    public async execute(input: Input): Promise<Output> {
        const task = Task.create(input.name, input.projectId);

        return { taskId: task.id() };
    }
}

type Input = AuthorizedInput & {
    name: string;
    projectId: string;
}

type Output = {
    taskId: string;
}