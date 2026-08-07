import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import ChangeTrackingObserver from '../../@common/ChangeTrackingObserver.js';
import Step from './Step.js';
import StepCollection from './StepCollection.js';
import StepType from './StepType.js';
import Worker from './Worker.js';
import WorkerType from './WorkerType.js';

describe('Worker', () => {
    function createPlannedWorker() {
        const worker = Worker.create('tenant-1', 'Bootstrap project', WorkerType.create('project'), StepCollection.empty());

        worker.plan([
            { action: 'createProject', input: { name: 'App' }, order: 1, type: StepType.action() },
            { action: 'addTask', input: { name: 'First task' }, order: 2, type: StepType.action() },
        ]);

        return worker;
    }

    function trackerOf(worker: Worker) {
        return worker.findObserver<ChangeTrackingObserver>(o => o instanceof ChangeTrackingObserver)!;
    }

    it('tracks its own creation so the repository can tell an insert from an update', () => {
        const worker = createPlannedWorker();

        assert.ok(trackerOf(worker).hasEvent('workerCreated'));
    });

    it('gives the planned steps the id of the worker', () => {
        const worker = createPlannedWorker();

        assert.ok(worker.steps.getAll().every(step => step.workerId.value === worker.id));
        assert.ok(worker.steps.getAll().every(step => step.status.value === 'pending'));
    });

    it('walks the steps in order and stops at the end', () => {
        const worker = createPlannedWorker();

        assert.equal(worker.nextStep()?.action, 'createProject');
        assert.equal(worker.nextStep()?.action, 'addTask');
        assert.equal(worker.nextStep(), undefined);
    });

    it('rebuilds a worker coming from the database', () => {
        const restored = Worker.restore({
            id: 'worker-1',
            tenantId: 'tenant-1',
            name: 'Bootstrap project',
            type: 'project',
            createdAt: new Date('2026-08-07T10:00:00.000Z'),
            steps: [
                Step.restore({ id: 'step-2', workerId: 'worker-1', action: 'addTask', input: { name: 'First task' }, order: 2, type: 'action', status: 'pending' }),
                Step.restore({ id: 'step-1', workerId: 'worker-1', action: 'createProject', input: { name: 'App' }, order: 1, type: 'action', status: 'completed' }),
            ],
        });

        assert.equal(restored.id, 'worker-1');
        assert.equal(restored.tenantId, 'tenant-1');
        assert.equal(restored.type.value, 'project');
        assert.deepEqual(restored.steps.getAll().map(step => step.action), ['createProject', 'addTask']);
        assert.equal(restored.isDone(), false);
        assert.equal(restored.nextStep()?.id.value, 'step-1');
    });

    it('does not report itself as created when it comes from the database', () => {
        const restored = Worker.restore({
            id: 'worker-1',
            tenantId: 'tenant-1',
            name: 'Bootstrap project',
            type: 'project',
            createdAt: new Date('2026-08-07T10:00:00.000Z'),
            steps: [],
        });

        assert.equal(trackerOf(restored).hasEvent('workerCreated'), false);
    });

    it('is done once every step is completed', () => {
        const worker = createPlannedWorker();

        worker.steps.getAll().forEach(step => step.setAsComplete());

        assert.ok(worker.isDone());
    });
});
