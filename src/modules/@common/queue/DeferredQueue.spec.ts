import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import DeferredQueue from './DeferredQueue.js';
import { DomainEvent, Queue, Unsubscribe } from './Queue.js';

class SpyQueue implements Queue {
    readonly published: DomainEvent[] = [];
    readonly subscribed: string[] = [];
    unsubscribed = false;

    async publish(event: DomainEvent): Promise<void> {
        this.published.push(event);
    }

    async subscriber(event: string): Promise<Unsubscribe> {
        this.subscribed.push(event);

        return () => { this.unsubscribed = true };
    }
}

describe('DeferredQueue', () => {
    it('holds the events until it is flushed', async () => {
        const inner = new SpyQueue();
        const queue = new DeferredQueue(inner);

        await queue.publish({ eventName: 'AgentCreated', data: { agentId: 'agent-1' } });

        assert.deepEqual(inner.published, []);

        await queue.flush();

        assert.deepEqual(inner.published, [{ eventName: 'AgentCreated', data: { agentId: 'agent-1' } }]);
    });

    it('keeps the order of the events and flushes each one only once', async () => {
        const inner = new SpyQueue();
        const queue = new DeferredQueue(inner);

        await queue.publish({ eventName: 'First', data: {} });
        await queue.publish({ eventName: 'Second', data: {} });

        await queue.flush();
        await queue.flush();

        assert.deepEqual(inner.published.map(event => event.eventName), ['First', 'Second']);
    });

    it('subscribes straight on the real queue', async () => {
        const inner = new SpyQueue();
        const queue = new DeferredQueue(inner);

        const unsubscribe = await queue.subscriber('AgentCreated', async () => { });

        assert.deepEqual(inner.subscribed, ['AgentCreated']);

        unsubscribe();

        assert.equal(inner.unsubscribed, true);
    });
});
