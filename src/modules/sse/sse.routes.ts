import { Router, Request, Response } from "express";
import { Container } from "../@common/Container.js";
import Logger from "../@common/Logger.js";
import { Queue, QueueKey, Unsubscribe } from "../@common/queue/Queue.js";
import SseConnection from "./SseConnection.js";
import { EventStream, EventStreamsKey, StreamRequest } from "./index.js";

function getQuery(req: Request, name: string): string | null {
    const value = req.query[name];

    if (typeof value !== 'string' || !value) return null;

    return value;
}

/**
 * `GET /api/events/:stream?tenantId=&userId=`
 *
 * `EventSource` cannot send headers, so who is asking comes on the query string.
 * The errors are answered here because the error middleware of the app is
 * registered before the routers and would never see them.
 */
const SseRoutes = (container: Container) => {
    const sseRoutes = Router();
    const queue = container.get<Queue>(QueueKey);
    const streams = container.get<Map<string, EventStream>>(EventStreamsKey);

    sseRoutes.get('/:stream', async (req: Request, res: Response) => {
        const stream = streams.get(req.params.stream as string);

        if (!stream) {
            res.status(404).json({ error: `Unknown stream: ${req.params.stream}` });
            return;
        }

        const tenantId = getQuery(req, 'tenantId');
        const userId = getQuery(req, 'userId');

        if (!tenantId || !userId) {
            res.status(400).json({ error: 'tenantId and userId are required' });
            return;
        }

        const request: StreamRequest = { tenantId, userId };

        // Opening the stream is also the permission check of the module that owns it.
        let snapshot: unknown;
        try {
            snapshot = await stream.open(request);
        } catch (error) {
            Logger.error(`Failed to open the stream ${req.params.stream} of tenant ${tenantId}: ${(error as Error).message}`);
            res.status(403).json({ error: (error as Error).message });
            return;
        }

        const connection = SseConnection.open(res);

        connection.send('snapshot', snapshot);


        const unsubscribes: Unsubscribe[] = await stream.register(queue, connection, request);

        req.on('close', () => {
            unsubscribes.forEach(unsubscribe => unsubscribe());
            connection.close();
        });
    });

    return sseRoutes;
}

export default SseRoutes;
