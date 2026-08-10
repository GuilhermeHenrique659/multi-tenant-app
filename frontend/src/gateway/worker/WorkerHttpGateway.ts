import { From as WorkerFrom, type Worker } from "../../model/Worker";
import type HttpClient from "../HttpClient";
import { currentUser } from "../currentUser";
import type WorkerGateway from "./WorkerGateway";
import type { CloseStream } from "./WorkerGateway";
import { Result } from "../../util/Result";
import type { PublisherType } from "../../application/pub/Publisher";

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

    public async resume(tenantId: string, workerId: string): Promise<Result<{ workerId: string }, Error>> {
        const result = await this._httpClient.post<{ workerId: string }>(`/api/workers/${workerId}/resume`, {}, { headers: { 'x-tenant-id': tenantId } });

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

    /**
     * `EventSource` cannot send headers, so who is asking goes on the query
     * string. It does not go through the `HttpClient` for the same reason. Every
     * event comes with a name, and SSE only delivers a named event to a listener
     * of that name: `onmessage` only sees the ones without a name.
     */
    public streamEvents(tenantId: string, publisher: PublisherType): CloseStream {
        const user = currentUser();
        const params = new URLSearchParams({ tenantId, userId: user?.id ?? '' });
        const source = new EventSource(`/api/events/workers?${params.toString()}`);

        publisher.events().forEach(event =>
            source.addEventListener(event, message => publisher.pub(event, JSON.parse(message.data)))
        );

        return () => source.close();
    }
}
