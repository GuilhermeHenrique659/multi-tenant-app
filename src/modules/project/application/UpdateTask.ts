import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import TaskCriteria from "../repository/TaskCriteria.js";
import TaskRepository from "../repository/TaskRepository.js";

export default class UpdateTask implements AuthorizerApplicationService<Input, Output> {
    constructor(private readonly _taskRepository: TaskRepository) { }

    public async execute(input: Input): Promise<Output> {
        const task = await this._taskRepository.get(new TaskCriteria().getById(input.id));

        if (!task) throw new Error('Task not found');

        task.rename(input.name);
        task.changeStatus(input.status);
        task.setDueDate(input.startAt, input.endAt);

        await this._taskRepository.save(task);

        return { taskId: task.id() };
    }
}

type Input = AuthorizedInput & {
    id: string;
    name?: string;
    startAt?: string;
    endAt?: string;
    status?: string;
};

type Output = {
    taskId: string;
};
