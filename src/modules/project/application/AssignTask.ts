import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import { TaskService } from "../domain/TaskService.js";
import TaskCriteria from "../repository/TaskCriteria.js";
import TaskRepository from "../repository/TaskRepository.js";
import { ProjectUserModule } from "../UserModule.js";

export class AssignTask implements AuthorizerApplicationService<Input, Output> {
    constructor(private readonly _taskRepository: TaskRepository, private readonly _userModule: ProjectUserModule) { }

    public async execute(input: Input): Promise<Output> {
        const task = await this._taskRepository.get(new TaskCriteria().getById(input.taskId));

        if (!task) throw new Error('Task not found');

        const user = await this._userModule.getUser(input.assigneeId, input.tenantId);

        if (!user) throw new Error('User to assign not found');

        TaskService.assignUser(task, user, ["task:update", "task:read"]);

        await this._taskRepository.save(task);

        return { taskId: task.id() }
    }
}

type Input = AuthorizedInput & {
    taskId: string;
    assigneeId: string;
}

type Output = {
    taskId: string
}
