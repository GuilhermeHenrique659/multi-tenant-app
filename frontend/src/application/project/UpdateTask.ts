import type ProjectGateway from "../../gateway/project/ProjectGateway";
import * as TaskMod from '../../model/Task';
import { Result } from "../../util/Result";

type UpdateTaskDependencies = {
    projectGateway: ProjectGateway;
}

type UpdateTaskInput = {
    tenantId: string;
    projectId: string;
    task: TaskMod.Task;
    name?: string;
    startAt?: string;
    endAt?: string;
    status?: string;
}

export const UpdateTask = (dependencies: UpdateTaskDependencies) => async (input: UpdateTaskInput): Promise<Result<TaskMod.Task, Error>> => {
    let task = input.task;

    if (input.name) {
        task = { props: { ...task.props, name: input.name }, assignee: task.assignee };
    }

    if (input.status) {
        const updated = TaskMod.UpdateStatus(task, input.status);
        if (updated.isErr()) return Result.Error(updated.error);
        task = updated.unwrap();
    }

    if (input.startAt || input.endAt) {
        const updated = TaskMod.SetDueDate(task, input.startAt, input.endAt);
        if (updated.isErr()) return Result.Error(updated.error);
        task = updated.unwrap();
    }

    const result = await dependencies.projectGateway.updateTask(input.tenantId, input.projectId, task.props.id, {
        name: input.name,
        startAt: input.startAt,
        endAt: input.endAt,
        status: input.status,
    });

    if (result.isErr()) return Result.Error(result.error);

    return Result.Ok(task);
}
