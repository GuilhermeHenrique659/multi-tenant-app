import { From as WorkerFrom, type Worker } from "../../model/Worker";
import type HttpClient from "../HttpClient";
import { currentUser } from "../currentUser";
import type WorkerGateway from "./WorkerGateway";
import type { CloseStream, WorkerStepEvent, WorkerStreamHandlers } from "./WorkerGateway";
import { Result } from "../../util/Result";

/** The events the backend publishes for every status a step reaches. */
const STEP_EVENTS = ['StepStarted', 'StepCompleted', 'StepFailed'];

/** The events that mean a worker got a new plan, so the list changed. */
const PLAN_EVENTS = ['WorkerCreated', 'WorkerResumed'];

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
     * string. It does not go through the `HttpClient` for the same reason.
     */
    public streamEvents(tenantId: string, handlers: WorkerStreamHandlers): CloseStream {
        const user = currentUser();
        const params = new URLSearchParams({ tenantId, userId: user?.id ?? '' });
        const source = new EventSource(`/api/events/workers?${params.toString()}`);

        source.addEventListener('snapshot', event => {
            const data = JSON.parse((event as MessageEvent).data) as Array<unknown>;
            const workers = data.map(item => WorkerFrom(item)).filter((item): item is Worker => !!item);

            handlers.onSnapshot(workers);
        });

        STEP_EVENTS.forEach(name => {
            source.addEventListener(name, event => {
                handlers.onStepChange(JSON.parse((event as MessageEvent).data) as WorkerStepEvent);
            });
        });

        PLAN_EVENTS.forEach(name => {
            source.addEventListener(name, () => handlers.onPlanChange());
        });

        return () => source.close();
    }
}
