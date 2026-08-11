import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Mediator from '../../@common/Mediator.js';
import FakeLLMGateway from '../gateway/FakeLLMGateway.js';
import StepService from '../domain/services/StepService.js';
import StepType from '../domain/entity/StepType.js';
import StepCollection from '../domain/entity/StepCollection.js';
import Worker from '../domain/entity/Worker.js';
import WorkerType from '../domain/entity/WorkerType.js';
import FakeWorkerRepository from '../repository/FakeWorkerRepository.js';
import InMemoryQueue from '../../@common/queue/InMemoryQueue.js';
import WorkerMemoryRepositoryInMemory from '../repository/WorkerMemoryRepositoryInMemory.js';
import Orchestrator from './Orchestrator.js';

describe('Orchestrator', () => {
    let repository: FakeWorkerRepository;

    beforeEach(() => {
        repository = new FakeWorkerRepository();
    });

    function createWorker(steps = [
        { action: 'createProject', input: { name: 'App' }, order: 1, type: StepType.action() },
        { action: 'addTask', input: { name: 'First task', projectId: '<from step 1>' }, order: 2, type: StepType.action() },
    ]) {
        const worker = Worker.create('tenant-1', 'Bootstrap project', 'create a project named App with a first task', WorkerType.create('project'), StepCollection.empty());
        worker.plan(steps);
        return worker;
    }

    it('feeds the output of a step into the input of the next one', async () => {
        const worker = createWorker();
        await repository.save(worker);

        const gateway = new FakeLLMGateway([
            '{"input":{"name":"App","tenantId":"tenant-1","userId":"user-1"}}',
            '{"input":{"name":"First task","projectId":"project-1","tenantId":"tenant-1","userId":"user-1"}}',
        ]);

        const dispatched: Array<{ action: string, input: any }> = [];
        const mediator = new Mediator();
        mediator.register('createProject', async (input: any) => {
            dispatched.push({ action: 'createProject', input });
            return { projectId: 'project-1', tenantId: 'tenant-1', userId: 'user-1' };
        });
        mediator.register('addTask', async (input: any) => {
            dispatched.push({ action: 'addTask', input });
            return { taskId: 'task-1' };
        });

        await new Orchestrator(repository, new StepService(gateway), mediator, new InMemoryQueue(), new WorkerMemoryRepositoryInMemory()).execute({
            workerId: worker.id,
            tenantId: 'tenant-1',
            userId: 'user-1',
        });

        assert.deepEqual(dispatched.map(d => d.action), ['createProject', 'addTask']);
        assert.equal(dispatched[1]!.input.projectId, 'project-1');
        assert.ok(worker.isDone());

        const secondPrompt = JSON.parse(gateway.requests[1]!.messages[1]!.content);
        assert.deepEqual(secondPrompt.memory, [{
            order: 1,
            action: 'createProject',
            input: { name: 'App', tenantId: 'tenant-1', userId: 'user-1' },
            output: { projectId: 'project-1', tenantId: 'tenant-1', userId: 'user-1' },
        }]);
    });

    it('marks the step as failed, saves the worker and propagates when the action throws', async () => {
        const worker = createWorker();
        await repository.save(worker);

        const gateway = new FakeLLMGateway(['{"input":{"name":"App","tenantId":"tenant-1","userId":"user-1"}}']);

        const mediator = new Mediator();
        mediator.register('createProject', async () => { throw new Error('project name already taken') });

        const orchestrator = new Orchestrator(repository, new StepService(gateway), mediator, new InMemoryQueue(), new WorkerMemoryRepositoryInMemory());

        await assert.rejects(() => orchestrator.execute({
            workerId: worker.id,
            tenantId: 'tenant-1',
            userId: 'user-1',
        }), /project name already taken/);

        const steps = worker.steps.getAll();
        assert.equal(steps[0]!.status.value, 'failed');
        assert.equal(steps[1]!.status.value, 'pending');
        // setup + the save that marks the step running + the save of the failure
        assert.equal(repository.saveCount, 3);
    });

    it('saves the failed step when the llm cannot resolve the input', async () => {
        const worker = createWorker();
        await repository.save(worker);

        const gateway = new FakeLLMGateway([new Error('OpenRouter error 429: rate limited')]);

        const orchestrator = new Orchestrator(repository, new StepService(gateway), new Mediator(), new InMemoryQueue(), new WorkerMemoryRepositoryInMemory());

        await assert.rejects(() => orchestrator.execute({
            workerId: worker.id,
            tenantId: 'tenant-1',
            userId: 'user-1',
        }), /rate limited/);

        const steps = worker.steps.getAll();
        assert.equal(steps[0]!.status.value, 'failed');
        assert.equal(steps[1]!.status.value, 'pending');
        // setup + the save that marks the step running + the save of the failure
        assert.equal(repository.saveCount, 3);
    });

    it('keeps the step complete and saves when only the memory cannot be built', async () => {
        const worker = createWorker();
        await repository.save(worker);

        const gateway = new FakeLLMGateway([
            '{"input":{"name":"App","tenantId":"tenant-1","userId":"user-1"}}',
            new Error('OpenRouter error 500: boom'),
        ]);

        const mediator = new Mediator();
        mediator.register('createProject', async () => 'project project-1 created');

        const orchestrator = new Orchestrator(repository, new StepService(gateway), mediator, new InMemoryQueue(), new WorkerMemoryRepositoryInMemory());

        await assert.rejects(() => orchestrator.execute({
            workerId: worker.id,
            tenantId: 'tenant-1',
            userId: 'user-1',
        }), /boom/);

        const steps = worker.steps.getAll();
        assert.equal(steps[0]!.status.value, 'completed');
        assert.equal(steps[1]!.status.value, 'pending');
        // setup + the save that marks the step running + the save of the failure
        assert.equal(repository.saveCount, 3);
    });

    it('rejects a worker that does not exist', async () => {
        const orchestrator = new Orchestrator(repository, new StepService(new FakeLLMGateway([])), new Mediator(), new InMemoryQueue(), new WorkerMemoryRepositoryInMemory());

        await assert.rejects(() => orchestrator.execute({
            workerId: 'missing',
            tenantId: 'tenant-1',
            userId: 'user-1',
        }), /worker not found/);
    });

    it('does not run a worker that belongs to another tenant', async () => {
        const worker = createWorker();
        await repository.save(worker);

        const orchestrator = new Orchestrator(repository, new StepService(new FakeLLMGateway([])), new Mediator(), new InMemoryQueue(), new WorkerMemoryRepositoryInMemory());

        await assert.rejects(() => orchestrator.execute({
            workerId: worker.id,
            tenantId: 'tenant-2',
            userId: 'user-1',
        }), /worker not found/);
    });

    it('stops on an ask step, because it waits for the user', async () => {
        const worker = createWorker([
            { action: 'askUser', input: { question: 'which project?' }, order: 1, type: StepType.ask() },
        ]);
        await repository.save(worker);

        const queue = new InMemoryQueue();

        const orchestrator = new Orchestrator(repository, new StepService(new FakeLLMGateway([])), new Mediator(), queue, new WorkerMemoryRepositoryInMemory());

        await orchestrator.execute({
            workerId: worker.id,
            tenantId: 'tenant-1',
            userId: 'user-1',
        });

        assert.equal(worker.nextStep()?.order, 1);
        assert.ok(!worker.isDone());
    });

    /**
     * The whole point of keeping the memory: the run that starts again knows what
     * the completed steps produced, so nothing is created twice.
     */
    it('reads back the memory of the previous run', async () => {
        const worker = createWorker();
        await repository.save(worker);

        const memoryRepository = new WorkerMemoryRepositoryInMemory();

        const firstGateway = new FakeLLMGateway([
            '{"input":{"name":"App","tenantId":"tenant-1","userId":"user-1"}}',
            new Error('OpenRouter error 429: rate limited'),
        ]);

        const mediator = new Mediator();
        mediator.register('createProject', async () => ({ projectId: 'project-1' }));

        await assert.rejects(() => new Orchestrator(repository, new StepService(firstGateway), mediator, new InMemoryQueue(), memoryRepository).execute({
            workerId: worker.id,
            tenantId: 'tenant-1',
            userId: 'user-1',
        }), /rate limited/);

        assert.deepEqual((await memoryRepository.get(worker.id)).getAll(), [{
            order: 1,
            action: 'createProject',
            input: { name: 'App', tenantId: 'tenant-1', userId: 'user-1' },
            output: { projectId: 'project-1' },
        }]);

        const secondGateway = new FakeLLMGateway(['{"input":{"name":"First task","projectId":"project-1","tenantId":"tenant-1","userId":"user-1"}}']);
        mediator.register('addTask', async () => ({ taskId: 'task-1' }));

        await new Orchestrator(repository, new StepService(secondGateway), mediator, new InMemoryQueue(), memoryRepository).execute({
            workerId: worker.id,
            tenantId: 'tenant-1',
            userId: 'user-1',
        });

        // The second run resolves the input of the pending step with what the first one recorded.
        const prompt = JSON.parse(secondGateway.requests[0]!.messages[1]!.content);
        assert.deepEqual(prompt.memory.map((entry: any) => entry.output), [{ projectId: 'project-1' }]);
        assert.equal(prompt.step.action, 'addTask');
    });
});
