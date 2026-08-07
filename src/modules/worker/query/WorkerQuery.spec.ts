import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toWorkerList } from './WorkerQuery.js';

describe('toWorkerList', () => {
    it('folds the rows of a worker into a single item keeping the step order of the query', () => {
        const workers = toWorkerList([
            { id: 'worker-1', name: 'Bootstrap project', stepAction: 'createProject', stepStatus: 'completed', stepOrder: 1 },
            { id: 'worker-1', name: 'Bootstrap project', stepAction: 'addTask', stepStatus: 'pending', stepOrder: 2 },
            { id: 'worker-2', name: 'Onboard member', stepAction: 'addMember', stepStatus: 'failed', stepOrder: 1 },
        ]);

        assert.deepEqual(workers, [
            {
                id: 'worker-1',
                name: 'Bootstrap project',
                steps: [
                    { action: 'createProject', status: 'completed', order: 1 },
                    { action: 'addTask', status: 'pending', order: 2 },
                ],
            },
            { id: 'worker-2', name: 'Onboard member', steps: [{ action: 'addMember', status: 'failed', order: 1 }] },
        ]);
    });

    it('keeps a worker without steps with an empty list', () => {
        const workers = toWorkerList([{ id: 'worker-1', name: 'Empty plan', stepAction: null, stepStatus: null, stepOrder: null }]);

        assert.deepEqual(workers, [{ id: 'worker-1', name: 'Empty plan', steps: [] }]);
    });

    it('returns an empty list when there is no row', () => {
        assert.deepEqual(toWorkerList([]), []);
    });
});
