import { From as WorkerFrom, type Worker } from "../../model/Worker";
import type HttpClient from "../HttpClient";
import type WorkerGateway from "./WorkerGateway";
import { Result } from "../../util/Result";

export default class WorkerHttpGateway implements WorkerGateway {
    private readonly _httpClient: HttpClient

    constructor(httpClient: HttpClient) {
        this._httpClient = httpClient;
    }

    public async plan(tenantId: string, userPrompt: string): Promise<Result<{ workerId: string }, Error>> {
        const result = await this._httpClient.post<{ workerId: string }>('/api/workers', { userPrompt }, { headers: { 'x-tenant-id': tenantId } });

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        return Result.Ok(result.unwrap());
    }

    public async list(tenantId: string): Promise<Result<Array<Worker>, Error>> {
        const result = await this._httpClient.get<Array<unknown>>('/api/workers', { headers: { 'x-tenant-id': tenantId } });

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        const workers = result.unwrap().map(item => WorkerFrom(item)).filter((item): item is Worker => !!item);
        return Result.Ok(workers);
    }
}
