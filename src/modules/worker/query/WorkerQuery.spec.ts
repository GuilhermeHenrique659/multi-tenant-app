import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toWorkerList } from './WorkerQuery.js';

describe('toWorkerList', () => {
    it('folds the rows of a worker into a single item keeping the step order of the query', () => {
        const workers = toWorkerList([
            { id: 'worker-1', name: 'Bootstrap project', stepAction: 'createProject', stepStatus: 'completed', stepOrder: 1, stepType: 'action', stepInput: { name: 'App' }, stepError: null },
            { id: 'worker-1', name: 'Bootstrap project', stepAction: 'addTask', stepStatus: 'pending', stepOrder: 2, stepType: 'action', stepInput: {}, stepError: null },
            { id: 'worker-2', name: 'Onboard member', stepAction: 'addMember', stepStatus: 'failed', stepOrder: 1, stepType: 'action', stepInput: {}, stepError: 'no seat left' },
        ]);

        assert.deepEqual(workers, [
            {
                id: 'worker-1',
                name: 'Bootstrap project',
                steps: [
                    { action: 'createProject', status: 'completed', order: 1, type: 'action', input: null, error: null },
                    { action: 'addTask', status: 'pending', order: 2, type: 'action', input: null, error: null },
                ],
            },
            {
                id: 'worker-2',
                name: 'Onboard member',
                steps: [{ action: 'addMember', status: 'failed', order: 1, type: 'action', input: null, error: 'no seat left' }],
            },
        ]);
    });

    it('keeps the input of a step that asks the user, because the question is in it', () => {
        const workers = toWorkerList([
            { id: 'worker-1', name: 'Bootstrap project', stepAction: 'createProject', stepStatus: 'pending', stepOrder: 1, stepType: 'ask', stepInput: { question: 'What is the name of the project?' }, stepError: null },
        ]);

        assert.deepEqual(workers, [
            {
                id: 'worker-1',
                name: 'Bootstrap project',
                steps: [{
                    action: 'createProject',
                    status: 'pending',
                    order: 1,
                    type: 'ask',
                    input: { question: 'What is the name of the project?' },
                    error: null,
                }],
            },
        ]);
    });

    it('keeps a worker without steps with an empty list', () => {
        const workers = toWorkerList([{ id: 'worker-1', name: 'Empty plan', stepAction: null, stepStatus: null, stepOrder: null, stepType: null, stepInput: null, stepError: null }]);

        assert.deepEqual(workers, [{ id: 'worker-1', name: 'Empty plan', steps: [] }]);
    });

    it('returns an empty list when there is no row', () => {
        assert.deepEqual(toWorkerList([]), []);
    });
});
