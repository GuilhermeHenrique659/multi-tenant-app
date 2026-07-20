import type ProjectGateway from "../../gateway/project/ProjectGateway";
import type { Project } from "../../model/Project";
import { Result } from "../../util/Result";

type ListProjectsDependencies = {
    projectGateway: ProjectGateway;
}

type ListProjectsInput = {
    tenantId: string;
}

export const ListProjects = (dependencies: ListProjectsDependencies) => async (input: ListProjectsInput): Promise<Result<Array<Project>, Error>> => {
    return await dependencies.projectGateway.list(input.tenantId);
}
