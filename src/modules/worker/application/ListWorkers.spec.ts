import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import ListWorkers from './ListWorkers.js';
import WorkerQuery from '../query/WorkerQuery.js';
import { WorkerListItem } from '../index.js';

class FakeWorkerQuery {
    readonly asked: string[] = [];

    constructor(private readonly workers: WorkerListItem[]) { }

    async listWorkersByTenantId(tenantId: string): Promise<WorkerListItem[]> {
        this.asked.push(tenantId);
        return this.workers;
    }
}

describe('ListWorkers', () => {
    it('lists the workers of the tenant with the action and the status of each step', async () => {
        const query = new FakeWorkerQuery([
            {
                id: 'worker-1',
                name: 'Bootstrap project',
                steps: [
                    { action: 'createProject', status: 'completed' },
                    { action: 'addTask', status: 'pending' },
                ],
            },
        ]);

        const result = await new ListWorkers(query as unknown as WorkerQuery).execute({
            tenantId: 'tenant-1',
            userId: 'user-1',
        });

        assert.deepEqual(result, [
            {
                id: 'worker-1',
                name: 'Bootstrap project',
                steps: [
                    { action: 'createProject', status: 'completed' },
                    { action: 'addTask', status: 'pending' },
                ],
            },
        ]);
        assert.deepEqual(query.asked, ['tenant-1']);
    });

    it('returns an empty list when the tenant has no worker', async () => {
        const query = new FakeWorkerQuery([]);

        const result = await new ListWorkers(query as unknown as WorkerQuery).execute({
            tenantId: 'tenant-1',
            userId: 'user-1',
        });

        assert.deepEqual(result, []);
    });
});
