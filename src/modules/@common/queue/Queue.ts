export const QueueKey = "Queue";

export type Subscriber = (data: any) => Promise<void>;

/** Removes the subscriber from the queue, so a short lived subscriber does not leak. */
export type Unsubscribe = () => void;

export interface Queue {
    publish(event: DomainEvent): Promise<void>
    subscriber(event: string, fn: Subscriber): Promise<Unsubscribe>;
}

export interface DomainEvent {
    eventName: string;
    data: any;
}
