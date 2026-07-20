import type ProjectGateway from "../../gateway/project/ProjectGateway";
import type { Task } from "../../model/Task";
import { Result } from "../../util/Result";

type ListTasksDependencies = {
    projectGateway: ProjectGateway;
}

type ListTasksInput = {
    tenantId: string;
    projectId: string;
}

export const ListTasks = (dependencies: ListTasksDependencies) => async (input: ListTasksInput): Promise<Result<Array<Task>, Error>> => {
    return await dependencies.projectGateway.listTasks(input.tenantId, input.projectId);
}
