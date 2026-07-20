import type ProjectGateway from "../../gateway/project/ProjectGateway";
import * as TaskMod from '../../model/Task';
import { Result } from "../../util/Result";

type AddTaskDependencies = {
    projectGateway: ProjectGateway;
}

type AddTaskInput = {
    tenantId: string;
    projectId: string;
    name: string;
}

export const AddTask = (dependencies: AddTaskDependencies) => async (input: AddTaskInput): Promise<Result<TaskMod.Task, Error>> => {
    const result = await dependencies.projectGateway.addTask(input.tenantId, input.projectId, input.name);

    if (result.isErr()) return Result.Error(result.error);

    const task = TaskMod.Create({
        id: result.unwrap().taskId,
        name: input.name,
        status: 'screen',
        projectId: input.projectId,
        createdAt: new Date().toISOString(),
    });

    return Result.Ok(task);
}
