import { EventStream, StreamRequest } from "../sse/index.js";
import { StepEventData, StepEvents, WorkerFinished, WorkerPlanEvents } from "./domain/WorkerEvents.js";
import WorkerModule from "./worker.module.js";

/**
 * Exposes the step status changes of a tenant as a stream. The snapshot is the
 * worker list, so the client gets the current state and the changes from the
 * same place.
 */
export default class WorkerEventStream implements EventStream {
    readonly events = [...WorkerPlanEvents, ...StepEvents, WorkerFinished];

    constructor(private readonly _workerModule: WorkerModule) { }

    public async open(request: StreamRequest): Promise<unknown> {
        return await this._workerModule.listWorkers(request);
    }

    public accepts(data: StepEventData, request: StreamRequest): boolean {
        return data.tenantId === request.tenantId;
    }

    /** The tenant is already filtered, so it does not need to reach the client. */
    public payload(data: StepEventData): unknown {
        const { tenantId: _tenantId, ...payload } = data;

        return payload;
    }
}
