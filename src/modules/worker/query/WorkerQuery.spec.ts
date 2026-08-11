import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toWorkerList } from './WorkerQuery.js';

describe('toWorkerList', () => {
    it('folds the rows of a worker into a single item keeping the step order of the query', () => {
        const workers = toWorkerList([
            { id: 'worker-1', name: 'Bootstrap project', stepId: 'step-1', stepAction: 'createProject', stepStatus: 'completed', stepOrder: 1, stepType: 'action', stepInput: { name: 'App' }, stepError: null, stepAnswer: null },
            { id: 'worker-1', name: 'Bootstrap project', stepId: 'step-2', stepAction: 'addTask', stepStatus: 'pending', stepOrder: 2, stepType: 'action', stepInput: {}, stepError: null, stepAnswer: null },
            { id: 'worker-2', name: 'Onboard member', stepId: 'step-3', stepAction: 'addMember', stepStatus: 'failed', stepOrder: 1, stepType: 'action', stepInput: {}, stepError: 'no seat left', stepAnswer: null },
        ]);

        assert.deepEqual(workers, [
            {
                id: 'worker-1',
                name: 'Bootstrap project',
                steps: [
                    { id: 'step-1', action: 'createProject', status: 'completed', order: 1, type: 'action', input: null, error: null, answer: null },
                    { id: 'step-2', action: 'addTask', status: 'pending', order: 2, type: 'action', input: null, error: null, answer: null },
                ],
            },
            {
                id: 'worker-2',
                name: 'Onboard member',
                steps: [{ id: 'step-3', action: 'addMember', status: 'failed', order: 1, type: 'action', input: null, error: 'no seat left', answer: null }],
            },
        ]);
    });

    it('keeps the input of a step that asks the user, because the question is in it', () => {
        const workers = toWorkerList([
            { id: 'worker-1', name: 'Bootstrap project', stepId: 'step-1', stepAction: 'createProject', stepStatus: 'pending', stepOrder: 1, stepType: 'ask', stepInput: { question: 'What is the name of the project?' }, stepError: null, stepAnswer: null },
        ]);

        assert.deepEqual(workers, [
            {
                id: 'worker-1',
                name: 'Bootstrap project',
                steps: [{
                    id: 'step-1',
                    action: 'createProject',
                    status: 'pending',
                    order: 1,
                    type: 'ask',
                    input: { question: 'What is the name of the project?' },
                    error: null,
                    answer: null,
                }],
            },
        ]);
    });

    /** The answer of a step that was already answered comes with the list. */
    it('keeps the answer of a step that the user answered', () => {
        const workers = toWorkerList([
            { id: 'worker-1', name: 'Bootstrap project', stepId: 'step-1', stepAction: 'createProject', stepStatus: 'completed', stepOrder: 1, stepType: 'ask', stepInput: { question: 'What is the name of the project?' }, stepError: null, stepAnswer: 'App' },
        ]);

        assert.equal(workers[0]?.steps[0]?.answer, 'App');
    });

    it('keeps a worker without steps with an empty list', () => {
        const workers = toWorkerList([{ id: 'worker-1', name: 'Empty plan', stepId: null, stepAction: null, stepStatus: null, stepOrder: null, stepType: null, stepInput: null, stepError: null, stepAnswer: null }]);

        assert.deepEqual(workers, [{ id: 'worker-1', name: 'Empty plan', steps: [] }]);
    });

    it('returns an empty list when there is no row', () => {
        assert.deepEqual(toWorkerList([]), []);
    });
});
