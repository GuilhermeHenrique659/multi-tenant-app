// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SubFn = (input: any) => void;

export type PublisherType = {
    sub(event: string, fn: SubFn): void;
    pub<T>(event: string, input: T): void;
    /** The names already subscribed, so a transport can listen to each one. */
    events(): Array<string>;
}

export const Publisher = (): PublisherType => {
    const eventsRegistered = new Map<string, SubFn>();

    return {
        sub: (event, fn) => eventsRegistered.set(event, fn),
        pub: (event, input) => eventsRegistered.get(event)?.(input),
        events: () => Array.from(eventsRegistered.keys()),
    }
}