export default class Mediator {
    constructor(private readonly _handles: Map<string, (input: any) => Promise<any>> = new Map()) {}

    async notify<I, F>(event: string, input: I): Promise<F> {
        const handle = this._handles.get(event);
        if (!handle) {
            throw new Error(`No handler found for event: ${event}`);
        }
        return await handle(input);
    }

    async register<I,F>(event: string, handle: (input: I) => Promise<F>): Promise<void> {
        this._handles.set(event, handle);
    }
}