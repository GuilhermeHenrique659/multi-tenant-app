export type CreateProjectRequest = {
    userId: string;
    tenantId: string;
    name: string;
}

export type AddTaskRequest = {
    userId: string;
    tenantId: string;
    projectId: string;
    name: string;
}

export type AssignTaskInput = {
    userId: string;
    tenantId: string;
    taskId: string;
    assigneeId: string;
}

export type UpdateTaskRequest = {
    userId: string;
    tenantId: string;
    projectId: string;
    id: string;
    name?: string;
    startAt?: string;
    endAt?: string;
    status?: string;
}

export type ListProjectsRequest = {
    userId: string;
    tenantId: string;
}

export type ListTasksRequest = {
    userId: string;
    tenantId: string;
    projectId: string;
}

export type GetTaskRequest = {
    userId: string;
    tenantId: string;
    taskId: string;
}

export type ProjectListItem = {
    id: string;
    name: string;
    status: string;
    tenantId: string;
    createdAt: Date;
}

export type TaskListItem = {
    id: string;
    name: string;
    status: string;
    startAt: Date | null;
    endAt: Date | null;
    projectId: string;
    assigneeId: string | null;
    createdAt: Date;
}

export type TaskWithAssignee = TaskListItem & {
    assignee: {
        id: string;
        name: string;
        email: string;
    } | null;
};