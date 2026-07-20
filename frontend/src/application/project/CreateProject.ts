import type ProjectGateway from "../../gateway/project/ProjectGateway";
import * as ProjectMod from '../../model/Project';
import { Result } from "../../util/Result";

type CreateProjectDependencies = {
    projectGateway: ProjectGateway;
}

type CreateProjectInput = {
    tenantId: string;
    name: string;
}

export const CreateProject = (dependencies: CreateProjectDependencies) => async (input: CreateProjectInput): Promise<Result<ProjectMod.Project, Error>> => {
    const result = await dependencies.projectGateway.create(input.tenantId, input.name);

    if (result.isErr()) return Result.Error(result.error);

    const project = ProjectMod.Create({
        id: result.unwrap().projectId,
        name: input.name,
        status: 'active',
        tenantId: input.tenantId,
        createdAt: new Date().toISOString(),
    });

    return Result.Ok(project);
}
