import type ProjectGateway from "../../gateway/project/ProjectGateway";
import type { Task } from "../../model/Task";
import { Result } from "../../util/Result";

type GetTaskDependencies = {
    projectGateway: ProjectGateway;
}

type GetTaskInput = {
    tenantId: string;
    projectId: string;
    taskId: string;
}

export const GetTask = (dependencies: GetTaskDependencies) => async (input: GetTaskInput): Promise<Result<Task, Error>> => {
    return await dependencies.projectGateway.getTask(input.tenantId, input.projectId, input.taskId);
}
