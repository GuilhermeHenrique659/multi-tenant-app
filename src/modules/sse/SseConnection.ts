import { Response } from "express";

/** Keeps the connection alive through proxies that drop an idle stream. */
const HEARTBEAT_MS = 15_000;

/**
 * One open SSE response: owns the headers, the wire format and the heartbeat, so
 * a stream only decides what to send.
 */
export default class SseConnection {
    private readonly _heartbeat: NodeJS.Timeout;

    private constructor(private readonly _response: Response) {
        this._heartbeat = setInterval(() => this._response.write(': ping\n\n'), HEARTBEAT_MS);
    }

    static open(response: Response): SseConnection {
        response.status(200).set({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        });

        response.flushHeaders();

        return new SseConnection(response);
    }

    public send(event: string, data: unknown): void {
        this._response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }

    public close(): void {
        clearInterval(this._heartbeat);
        this._response.end();
    }
}
