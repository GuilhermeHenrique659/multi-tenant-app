import SseConnection from "../sse/SseConnection.js";
import WorkerModule from "./worker.module.js";

import { Queue } from "../@common/queue/Queue.js";
import { EventStream, createServerEventEmitter, StreamRequest } from "../sse/index.js";
import { StepEventData } from "./domain/events/WorkerEvents.js";

/**
 * Exposes the step status changes of a tenant as a stream. The snapshot is the
 * worker list, so the client gets the current state and the changes from the
 * same place.
 */
export default class WorkerEventStream implements EventStream {
    constructor(private readonly _workerModule: WorkerModule) { }

    public async open(request: StreamRequest): Promise<unknown> {
        return await this._workerModule.listWorkers(request);
    }

    public accepts(data: StepEventData, request: StreamRequest): boolean {
        return data.tenantId === request.tenantId;
    }

    public async register(queue: Queue, connection: SseConnection, request: StreamRequest) {
        const serverEventEmitter = createServerEventEmitter(connection, request, this);

        const unsubscribes = await Promise.all([
            queue.subscriber('WorkerCreated', serverEventEmitter('WorkerCreated')),
            queue.subscriber('WorkerResumed', serverEventEmitter('WorkerUpdated')),
            queue.subscriber('WorkerFinished', serverEventEmitter('WorkerUpdated')),

            queue.subscriber('StepStarted', serverEventEmitter('StepUpdated')),
            queue.subscriber('StepCompleted', serverEventEmitter('StepUpdated')),
            queue.subscriber('StepFailed', serverEventEmitter('StepUpdated')),
            queue.subscriber('StepAsked', serverEventEmitter('StepUpdated')),
            queue.subscriber('StepAnswered', serverEventEmitter('StepUpdated'))
        ]);

        return unsubscribes;
    }
}
