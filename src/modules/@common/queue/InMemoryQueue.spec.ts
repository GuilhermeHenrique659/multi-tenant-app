import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as tick } from 'node:timers/promises';
import InMemoryQueue from './InMemoryQueue.js';

describe('InMemoryQueue', () => {
    it('delivers an event to every subscriber of that event', async () => {
        const queue = new InMemoryQueue();
        const handled: string[] = [];

        await queue.subscriber('AgentCreated', async data => { handled.push(`first:${data.agentId}`) });
        await queue.subscriber('AgentCreated', async data => { handled.push(`second:${data.agentId}`) });
        await queue.subscriber('OtherEvent', async () => { handled.push('other') });

        await queue.publish({ eventName: 'AgentCreated', data: { agentId: 'agent-1' } });
        await tick();

        assert.deepEqual(handled, ['first:agent-1', 'second:agent-1']);
    });

    it('does not wait for the subscriber to finish', async () => {
        const queue = new InMemoryQueue();
        let handled = false;

        await queue.subscriber('AgentCreated', async () => { handled = true });

        await queue.publish({ eventName: 'AgentCreated', data: {} });

        assert.equal(handled, false);

        await tick();

        assert.equal(handled, true);
    });

    it('does not propagate a failure of the subscriber to the publisher', async () => {
        const queue = new InMemoryQueue();

        await queue.subscriber('AgentCreated', async () => { throw new Error('run failed') });

        await queue.publish({ eventName: 'AgentCreated', data: {} });
        await tick();
    });

    it('ignores an event without subscribers', async () => {
        const queue = new InMemoryQueue();

        await queue.publish({ eventName: 'Unknown', data: {} });
        await tick();
    });
});
