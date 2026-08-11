import SseConnection from "../sse/SseConnection.js";
import AgentModule from "./agent.module.js";

import { Queue } from "../@common/queue/Queue.js";
import { EventStream, createServerEventEmitter, StreamRequest } from "../sse/index.js";
import { StepEventData } from "./domain/events/AgentEvents.js";

/**
 * Exposes the step status changes of a tenant as a stream. The snapshot is the
 * agent list, so the client gets the current state and the changes from the
 * same place.
 */
export default class AgentEventStream implements EventStream {
    constructor(private readonly _agentModule: AgentModule) { }

    public async open(request: StreamRequest): Promise<unknown> {
        return await this._agentModule.listAgents(request);
    }

    public accepts(data: StepEventData, request: StreamRequest): boolean {
        return data.tenantId === request.tenantId;
    }

    public async register(queue: Queue, connection: SseConnection, request: StreamRequest) {
        const serverEventEmitter = createServerEventEmitter(connection, request, this);

        const unsubscribes = await Promise.all([
            queue.subscriber('AgentCreated', serverEventEmitter('AgentCreated')),
            queue.subscriber('AgentResumed', serverEventEmitter('AgentUpdated')),
            queue.subscriber('AgentFinished', serverEventEmitter('AgentUpdated')),

            queue.subscriber('StepStarted', serverEventEmitter('StepUpdated')),
            queue.subscriber('StepCompleted', serverEventEmitter('StepUpdated')),
            queue.subscriber('StepFailed', serverEventEmitter('StepUpdated')),
            queue.subscriber('StepAsked', serverEventEmitter('StepUpdated')),
            queue.subscriber('StepAnswered', serverEventEmitter('StepUpdated'))
        ]);

        return unsubscribes;
    }
}
