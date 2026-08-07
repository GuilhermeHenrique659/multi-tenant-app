import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import WorkerMemory from './WorkerMemory.js';

describe('WorkerMemory', () => {
    it('returns the recorded entries ordered by step order', () => {
        const memory = WorkerMemory.empty();

        memory.record({ order: 2, action: 'addTask', input: {}, output: { taskId: 'task-1' } });
        memory.record({ order: 1, action: 'createProject', input: {}, output: { projectId: 'project-1' } });

        assert.deepEqual(memory.getAll().map(entry => entry.action), ['createProject', 'addTask']);
    });

    it('starts empty', () => {
        assert.deepEqual(WorkerMemory.empty().getAll(), []);
    });

    it('round trips through toJSON and restore', () => {
        const memory = WorkerMemory.empty();
        memory.record({ order: 1, action: 'createProject', input: { name: 'App' }, output: { projectId: 'project-1' } });

        const restored = WorkerMemory.restore(memory.toJSON());

        assert.deepEqual(restored.getAll(), memory.getAll());
    });

    it('does not let a restored memory mutate the source entries', () => {
        const memory = WorkerMemory.empty();
        memory.record({ order: 1, action: 'createProject', input: {}, output: {} });

        const entries = memory.toJSON();
        const restored = WorkerMemory.restore(entries);
        restored.record({ order: 2, action: 'addTask', input: {}, output: {} });

        assert.equal(memory.getAll().length, 1);
        assert.equal(restored.getAll().length, 2);
    });
});
