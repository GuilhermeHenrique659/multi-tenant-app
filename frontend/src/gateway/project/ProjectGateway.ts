import type { Project } from "../../model/Project";
import type { Task } from "../../model/Task";
import type { Result } from "../../util/Result";

export default interface ProjectGateway {
    create(tenantId: string, name: string): Promise<Result<{ projectId: string }, Error>>;
    list(tenantId: string): Promise<Result<Array<Project>, Error>>;
    addTask(tenantId: string, projectId: string, name: string): Promise<Result<{ taskId: string }, Error>>;
    listTasks(tenantId: string, projectId: string): Promise<Result<Array<Task>, Error>>;
    getTask(tenantId: string, projectId: string, taskId: string): Promise<Result<Task, Error>>;
    updateTask(tenantId: string, projectId: string, taskId: string, data: { name?: string; startAt?: string; endAt?: string; status?: string }): Promise<Result<{ taskId: string }, Error>>;
    assignTask(tenantId: string, projectId: string, taskId: string, assigneeId: string): Promise<Result<{ taskId: string }, Error>>;
}
