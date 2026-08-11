import { From as AgentFrom, type Agent } from "../../model/Agent";
import type HttpClient from "../HttpClient";
import { currentUser } from "../currentUser";
import type AgentGateway from "./AgentGateway";
import type { CloseStream } from "./AgentGateway";
import { Result } from "../../util/Result";
import type { PublisherType } from "../../application/pub/Publisher";

export default class AgentHttpGateway implements AgentGateway {
    private readonly _httpClient: HttpClient

    constructor(httpClient: HttpClient) {
        this._httpClient = httpClient;
    }

    public async plan(tenantId: string, userPrompt: string): Promise<Result<{ agentId: string }, Error>> {
        const result = await this._httpClient.post<{ agentId: string }>('/api/agents', { userPrompt }, { headers: { 'x-tenant-id': tenantId } });

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        return Result.Ok(result.unwrap());
    }

    public async resume(tenantId: string, agentId: string): Promise<Result<{ agentId: string }, Error>> {
        const result = await this._httpClient.post<{ agentId: string }>(`/api/agents/${agentId}/resume`, {}, { headers: { 'x-tenant-id': tenantId } });

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        return Result.Ok(result.unwrap());
    }

    public async list(tenantId: string): Promise<Result<Array<Agent>, Error>> {
        const result = await this._httpClient.get<Array<unknown>>('/api/agents', { headers: { 'x-tenant-id': tenantId } });

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        const agents = result.unwrap().map(item => AgentFrom(item)).filter((item): item is Agent => !!item);
        return Result.Ok(agents);
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
        const source = new EventSource(`/api/events/agents?${params.toString()}`);

        publisher.events().forEach(event =>
            source.addEventListener(event, message => publisher.pub(event, JSON.parse(message.data)))
        );

        return () => source.close();
    }

    public async answer(tenantId: string, agentId: string, stepId: string, answer: string): Promise<Result<{ agentId: string }, Error>> {
        const result = await this._httpClient.post<{ agentId: string }>(`/api/agents/${agentId}/answer`, {
            stepId,
            answer,
        }, { headers: { 'x-tenant-id': tenantId } });

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        return Result.Ok(result.unwrap());
    }
}
