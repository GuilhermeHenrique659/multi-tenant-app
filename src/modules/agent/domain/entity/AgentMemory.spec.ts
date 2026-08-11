import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import AgentMemory from './AgentMemory.js';

describe('AgentMemory', () => {
    it('returns the recorded entries ordered by step order', () => {
        const memory = AgentMemory.empty();

        memory.record({ order: 2, action: 'addTask', input: {}, output: { taskId: 'task-1' } });
        memory.record({ order: 1, action: 'createProject', input: {}, output: { projectId: 'project-1' } });

        assert.deepEqual(memory.getAll().map(entry => entry.action), ['createProject', 'addTask']);
    });

    it('starts empty', () => {
        assert.deepEqual(AgentMemory.empty().getAll(), []);
    });

    /** A step that runs again did not produce a second thing, it produced the same one. */
    it('replaces what a step had recorded when it runs again', () => {
        const memory = AgentMemory.empty();

        memory.record({ order: 1, action: 'createProject', input: {}, output: { projectId: 'project-1' } });
        memory.record({ order: 1, action: 'createProject', input: {}, output: { projectId: 'project-2' } });

        assert.equal(memory.getAll().length, 1);
        assert.deepEqual(memory.getAll()[0]!.output, { projectId: 'project-2' });
    });

    it('round trips through toJSON and restore', () => {
        const memory = AgentMemory.empty();
        memory.record({ order: 1, action: 'createProject', input: { name: 'App' }, output: { projectId: 'project-1' } });

        const restored = AgentMemory.restore(memory.toJSON());

        assert.deepEqual(restored.getAll(), memory.getAll());
    });

    it('does not let a restored memory mutate the source entries', () => {
        const memory = AgentMemory.empty();
        memory.record({ order: 1, action: 'createProject', input: {}, output: {} });

        const entries = memory.toJSON();
        const restored = AgentMemory.restore(entries);
        restored.record({ order: 2, action: 'addTask', input: {}, output: {} });

        assert.equal(memory.getAll().length, 1);
        assert.equal(restored.getAll().length, 2);
    });
});
