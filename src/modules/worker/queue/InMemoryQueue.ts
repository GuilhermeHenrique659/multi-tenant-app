import Logger from "../../@common/Logger.js";
import { DomainEvent, Queue } from "./Queue.js";

type Subscriber = (data: any) => Promise<void>;

/**
 * In process queue: `publish` returns as soon as the event is queued and the
 * subscribers run out of band, so the caller never waits for the worker run.
 */
export default class InMemoryQueue implements Queue {
    private readonly subscribers = new Map<string, Subscriber[]>();

    async publish(event: DomainEvent): Promise<void> {
        const subscribers = this.subscribers.get(event.eventName);

        if (!subscribers?.length) {
            Logger.info(`No subscriber for event: ${event.eventName}`);
            return;
        }

        for (const subscriber of subscribers) {
            setImmediate(() => {
                subscriber(event.data).catch(err => {
                    Logger.error(`Failed to handle event ${event.eventName}: ${(err as Error).message}`);
                });
            });
        }
    }

    async subscriber(event: string, fn: Subscriber): Promise<void> {
        const subscribers = this.subscribers.get(event) ?? [];

        subscribers.push(fn);

        this.subscribers.set(event, subscribers);
    }
}
