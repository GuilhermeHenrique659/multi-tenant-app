import { z } from "zod";
import { createStore } from "./common/Storage";
import { ModelCollection } from "./common/Collection";
import { Result } from "../util/Result";

const TaskSchema = z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    startAt: z.string().nullable().optional(),
    endAt: z.string().nullable().optional(),
    projectId: z.string(),
    assigneeId: z.string().nullable().optional(),
    createdAt: z.string(),
});

const AssigneeSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
});

type TaskProps = z.infer<typeof TaskSchema>;

export type Task = Readonly<{
    props: Readonly<TaskProps>;
    assignee: Readonly<{ id: string; name: string; email: string }> | null;
}>;

type TaskId = string;

export type TaskCollection = {
    tasks: ModelCollection<TaskId, Task>;
};

export const Create = (data: Record<string, unknown>): Task => {
    const props = TaskSchema.parse(data);
    const assigneeResult = AssigneeSchema.safeParse(data.assignee);
    return { props, assignee: assigneeResult.success ? assigneeResult.data : null };
};

export const From = (data: unknown): Task | null => {
    const result = TaskSchema.safeParse(data);
    if (!result.success) return null;
    const assigneeResult = AssigneeSchema.safeParse((data as Record<string, unknown>).assignee);
    return { props: result.data, assignee: assigneeResult.success ? assigneeResult.data : null };
};

export const validStatuses = ['screen', 'working', 'review', 'done'] as const;

export const UpdateStatus = (task: Task, status: string): Result<Task, Error> => {
    if (!validStatuses.includes(status as typeof validStatuses[number])) {
        return Result.Error(new Error('Invalid task status'));
    }
    return Result.Ok({ props: { ...task.props, status }, assignee: task.assignee });
};

export const SetDueDate = (task: Task, startAt?: string, endAt?: string): Result<Task, Error> => {
    if (endAt && startAt && new Date(startAt) > new Date(endAt)) {
        return Result.Error(new Error('startAt must be less than endAt'));
    }
    return Result.Ok({
        props: { ...task.props, startAt: startAt ?? task.props.startAt, endAt: endAt ?? task.props.endAt },
        assignee: task.assignee,
    });
};

export const AssignTo = (task: Task, assignee: { id: string; name: string; email: string }): Result<Task, Error> => {
    if (task.props.assigneeId === assignee.id) {
        return Result.Error(new Error('User already assigned to this task'));
    }
    return Result.Ok({ props: { ...task.props, assigneeId: assignee.id }, assignee });
};

export const tasksStore = createStore<TaskCollection>({ tasks: new ModelCollection(new Map()) });
