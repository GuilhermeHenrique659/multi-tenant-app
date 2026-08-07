import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import FakeLLMGateway from '../gateway/FakeLLMGateway.js';
import PlanService from '../domain/PlanService.js';
import FakeWorkerRepository from '../repository/FakeWorkerRepository.js';
import WorkerCriteria from '../repository/WorkerCriteria.js';
import { DomainEvent, Queue } from '../queue/Queue.js';
import Planner from './Planner.js';

class FakeQueue implements Queue {
    readonly published: DomainEvent[] = [];

    async publish(event: DomainEvent): Promise<void> {
        this.published.push(event);
    }

    async subscriber(): Promise<void> { }
}

describe('Planner', () => {
    it('saves a worker with the planned steps and publishes WorkerCreated', async () => {
        const repository = new FakeWorkerRepository();
        const queue = new FakeQueue();
        const gateway = new FakeLLMGateway([JSON.stringify({
            name: 'Bootstrap project',
            type: 'project',
            steps: [
                { action: 'createProject', input: { name: 'App' }, type: 'action', order: 1 },
                { action: 'addTask', input: { name: 'First task', projectId: '<from step 1>' }, type: 'action', order: 2 },
            ],
        })]);

        const output = await new Planner(repository, new PlanService(gateway), queue).execute({
            userPrompt: 'create a project named App with a first task',
            tenantId: 'tenant-1',
            userId: 'user-1',
        });

        const worker = await repository.get(new WorkerCriteria().getById(output.workerId));

        assert.ok(worker);
        assert.equal(worker.isDone(), false);
        assert.deepEqual(worker.steps.getAll().map(step => step.action), ['createProject', 'addTask']);
        assert.ok(worker.steps.getAll().every(step => step.workerId.value === output.workerId));
        assert.deepEqual(queue.published, [{
            eventName: 'WorkerCreated',
            data: { workerId: output.workerId, tenantId: 'tenant-1', userId: 'user-1' },
        }]);
    });
});
