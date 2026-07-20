import type ProjectGateway from "../../gateway/project/ProjectGateway";
import * as TaskMod from '../../model/Task';
import { Result } from "../../util/Result";

type AssignTaskDependencies = {
    projectGateway: ProjectGateway;
}

type AssignTaskInput = {
    tenantId: string;
    projectId: string;
    task: TaskMod.Task;
    assignee: { id: string; name: string; email: string };
}

export const AssignTask = (dependencies: AssignTaskDependencies) => async (input: AssignTaskInput): Promise<Result<TaskMod.Task, Error>> => {
    const updatedResult = TaskMod.AssignTo(input.task, input.assignee);
    if (updatedResult.isErr()) return Result.Error(updatedResult.error);

    const updatedTask = updatedResult.unwrap();

    const result = await dependencies.projectGateway.assignTask(input.tenantId, input.projectId, updatedTask.props.id, input.assignee.id);

    if (result.isErr()) return Result.Error(result.error);

    return Result.Ok(updatedTask);
}
