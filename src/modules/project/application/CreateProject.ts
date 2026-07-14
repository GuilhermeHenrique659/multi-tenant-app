import AuthorizerApplicationService from "../../@common/AuthorizerApplicationService.js";
import Project from "../domain/Project.js";
import ProjectRepository from "../repository/ProjectRepository.js";

export default class CreateProject implements AuthorizerApplicationService<Input, Output> {
    constructor(private readonly _projectRepository: ProjectRepository) { }

    public async execute(input: Input): Promise<Output> {
        const project = Project.create(input.name, input.tenantId);

        await this._projectRepository.save(project);

        return { projectId: project.id() }
    }
}

type Input = {
    tenantId: string;
    name: string;
    userId: string;
}

type Output = {
    projectId: string;
}