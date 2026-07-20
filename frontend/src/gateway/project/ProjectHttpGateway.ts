import { From as ProjectFrom, type Project } from "../../model/Project";
import { From as TaskFrom, type Task } from "../../model/Task";
import type HttpClient from "../HttpClient";
import type ProjectGateway from "./ProjectGateway";
import { Result } from "../../util/Result";

export default class ProjectHttpGateway implements ProjectGateway {
    private readonly _httpClient: HttpClient

    constructor(httpClient: HttpClient) {
        this._httpClient = httpClient;
    }

    public async create(tenantId: string, name: string): Promise<Result<{ projectId: string }, Error>> {
        const result = await this._httpClient.post<{ projectId: string }>('/api/projects', { name }, { headers: { 'x-tenant-id': tenantId } });

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        return Result.Ok(result.unwrap());
    }

    public async list(tenantId: string): Promise<Result<Array<Project>, Error>> {
        const result = await this._httpClient.get<Array<unknown>>('/api/projects', { headers: { 'x-tenant-id': tenantId } });

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        const projects = result.unwrap().map(item => ProjectFrom(item)).filter((item): item is Project => !!item);
        return Result.Ok(projects);
    }

    public async addTask(tenantId: string, projectId: string, name: string): Promise<Result<{ taskId: string }, Error>> {
        const result = await this._httpClient.post<{ taskId: string }>(`/api/projects/${projectId}/tasks`, { name }, { headers: { 'x-tenant-id': tenantId } });

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        return Result.Ok(result.unwrap());
    }

    public async listTasks(tenantId: string, projectId: string): Promise<Result<Array<Task>, Error>> {
        const result = await this._httpClient.get<Array<unknown>>(`/api/projects/${projectId}/tasks`, { headers: { 'x-tenant-id': tenantId } });

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        const tasks = result.unwrap().map(item => TaskFrom(item)).filter((item): item is Task => !!item);
        return Result.Ok(tasks);
    }

    public async getTask(tenantId: string, projectId: string, taskId: string): Promise<Result<Task, Error>> {
        const result = await this._httpClient.get<unknown>(`/api/projects/${projectId}/tasks/${taskId}`, { headers: { 'x-tenant-id': tenantId } });

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        const task = TaskFrom(result.unwrap());

        if (!task) return Result.Error(new Error('Failed to parse task'));

        return Result.Ok(task);
    }

    public async updateTask(tenantId: string, projectId: string, taskId: string, data: { name?: string; startAt?: string; endAt?: string; status?: string }): Promise<Result<{ taskId: string }, Error>> {
        const result = await this._httpClient.patch<{ taskId: string }>(`/api/projects/${projectId}/tasks/${taskId}`, data, { headers: { 'x-tenant-id': tenantId } });

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        return Result.Ok(result.unwrap());
    }

    public async assignTask(tenantId: string, projectId: string, taskId: string, assigneeId: string): Promise<Result<{ taskId: string }, Error>> {
        const result = await this._httpClient.patch<{ taskId: string }>(`/api/projects/${projectId}/tasks/${taskId}/assign`, { assigneeId }, { headers: { 'x-tenant-id': tenantId } });

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        return Result.Ok(result.unwrap());
    }
}
