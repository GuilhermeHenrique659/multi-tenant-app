import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toWorkerList } from './WorkerQuery.js';

describe('toWorkerList', () => {
    it('folds the rows of a worker into a single item keeping the step order of the query', () => {
        const workers = toWorkerList([
            { id: 'worker-1', name: 'Bootstrap project', stepAction: 'createProject', stepStatus: 'completed' },
            { id: 'worker-1', name: 'Bootstrap project', stepAction: 'addTask', stepStatus: 'pending' },
            { id: 'worker-2', name: 'Onboard member', stepAction: 'addMember', stepStatus: 'failed' },
        ]);

        assert.deepEqual(workers, [
            {
                id: 'worker-1',
                name: 'Bootstrap project',
                steps: [
                    { action: 'createProject', status: 'completed' },
                    { action: 'addTask', status: 'pending' },
                ],
            },
            { id: 'worker-2', name: 'Onboard member', steps: [{ action: 'addMember', status: 'failed' }] },
        ]);
    });

    it('keeps a worker without steps with an empty list', () => {
        const workers = toWorkerList([{ id: 'worker-1', name: 'Empty plan', stepAction: null, stepStatus: null }]);

        assert.deepEqual(workers, [{ id: 'worker-1', name: 'Empty plan', steps: [] }]);
    });

    it('returns an empty list when there is no row', () => {
        assert.deepEqual(toWorkerList([]), []);
    });
});
