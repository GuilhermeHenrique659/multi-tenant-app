import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import ProjectCriteria from "../repository/ProjectCriteria.js";
import ProjectRepository from "../repository/ProjectRepository.js";
import Task from "../domain/Task.js";
import TaskRepository from "../repository/TaskRepository.js";

export default class AddTask implements AuthorizerApplicationService<Input, Output> {
    constructor(
        private readonly _taskRepository: TaskRepository,
        private readonly _projectRepository: ProjectRepository
    ) {}

    public async execute(input: Input): Promise<Output> {
        const criteria = new ProjectCriteria()
            .getById(input.projectId)
            .getByTenantId(input.tenantId);

        const project = await this._projectRepository.get(criteria);
        if (!project) throw new Error('Project not found');
        project.ensureIsActive();

        const task = Task.create(input.name, input.projectId);
        task.assigneeTo(input.userId);

        await this._taskRepository.save(task);

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