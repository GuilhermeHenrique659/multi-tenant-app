import { DomainEvent, Queue, Subscriber, Unsubscribe } from "./Queue.js";

/**
 * Buffers what is published inside a database transaction and only hands the
 * events to the real queue on `flush`, so a subscriber never sees a worker that
 * is not committed yet.
 */
export default class DeferredQueue implements Queue {
    private readonly events: DomainEvent[] = [];

    constructor(private readonly queue: Queue) { }

    async publish(event: DomainEvent): Promise<void> {
        this.events.push(event);
    }

    async subscriber(event: string, fn: Subscriber): Promise<Unsubscribe> {
        return await this.queue.subscriber(event, fn);
    }

    public async flush(): Promise<void> {
        const events = this.events.splice(0, this.events.length);

        for (const event of events) {
            await this.queue.publish(event);
        }
    }
}
