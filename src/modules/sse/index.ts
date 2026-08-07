export const EventStreamsKey = "EventStreams";

/** Who is asking for the stream; the same shape the authorizers expect. */
export type StreamRequest = {
    userId: string;
    tenantId: string;
}

/**
 * What a module has to provide to expose a stream of its events over SSE, so the
 * sse module never needs to know anything about that module.
 */
export interface EventStream {
    /** Names of the queue events forwarded to the client. */
    readonly events: string[];

    /**
     * Authorizes the caller and returns the state sent as the first event of the
     * stream. Throwing here closes the stream before it opens.
     */
    open(request: StreamRequest): Promise<unknown>;

    /** Whether the event belongs to the caller: the queue is shared by every tenant. */
    accepts(data: any, request: StreamRequest): boolean;

    /** What of the event goes on the wire. */
    payload(data: any): unknown;
}
