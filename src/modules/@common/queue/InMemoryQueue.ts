import Logger from "../Logger.js";
import { DomainEvent, Queue, Subscriber, Unsubscribe } from "./Queue.js";

/**
 * In process queue: `publish` returns as soon as the event is queued and the
 * subscribers run out of band, so the caller never waits for the agent run.
 */
export default class InMemoryQueue implements Queue {
    private readonly subscribers = new Map<string, Subscriber[]>();

    async publish(event: DomainEvent): Promise<void> {
        const subscribers = this.subscribers.get(event.eventName);

        if (!subscribers?.length) {
            Logger.info(`No subscriber for event: ${event.eventName}`);
            return;
        }

        // Copied: a subscriber may unsubscribe while the loop is still running.
        for (const subscriber of [...subscribers]) {
            setImmediate(() => {
                subscriber(event.data).catch(err => {
                    Logger.error(`Failed to handle event ${event.eventName}: ${(err as Error).message}`);
                });
            });
        }
    }

    async subscriber(event: string, fn: Subscriber): Promise<Unsubscribe> {
        const subscribers = this.subscribers.get(event) ?? [];

        subscribers.push(fn);

        this.subscribers.set(event, subscribers);

        return () => this._remove(event, fn);
    }

    /** Safe to call more than once: the second call finds nothing to remove. */
    private _remove(event: string, fn: Subscriber): void {
        const subscribers = this.subscribers.get(event);

        if (!subscribers) return;

        const index = subscribers.indexOf(fn);

        if (index === -1) return;

        subscribers.splice(index, 1);
    }
}
