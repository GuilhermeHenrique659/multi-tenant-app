import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import FakeLLMGateway from '../gateway/FakeLLMGateway.js';
import Step from './Step.js';
import StepService from './StepService.js';
import StepType from './StepType.js';
import WorkerMemory from './WorkerMemory.js';

describe('StepService', () => {
    function createStep(action: string, input: any, order = 1) {
        return Step.create('worker-1', action, input, order, StepType.action());
    }

    describe('resolveInput', () => {
        it('sends the contract, the planned input and the memory to the llm', async () => {
            const gateway = new FakeLLMGateway(['{"input":{"name":"Task","projectId":"project-1"}}']);
            const service = new StepService(gateway);

            const memory = WorkerMemory.empty();
            memory.record({ order: 1, action: 'createProject', input: {}, output: { projectId: 'project-1' } });

            const input = await service.resolveInput({
                step: createStep('addTask', { name: 'Task', projectId: '<from createProject>' }, 2),
                memory,
                tenantId: 'tenant-1',
                userId: 'user-1',
            });

            assert.deepEqual(input, { name: 'Task', projectId: 'project-1' });

            const request = gateway.lastRequest!;
            assert.equal(request.jsonSchema?.name, 'step_input');
            assert.equal(request.messages[0]!.role, 'system');

            const schema = request.jsonSchema!.schema as any;
            assert.deepEqual(schema.properties.input.required, ['name', 'projectId', 'tenantId', 'userId']);
            assert.deepEqual(Object.keys(schema.properties.input.properties), ['name', 'projectId', 'tenantId', 'userId']);

            const prompt = JSON.parse(request.messages[1]!.content);
            assert.equal(prompt.step.action, 'addTask');
            assert.equal(prompt.step.plannedInput.projectId, '<from createProject>');
            assert.deepEqual(prompt.contract.input.required, ['name', 'projectId', 'tenantId', 'userId']);
            assert.deepEqual(prompt.memory[0].output, { projectId: 'project-1' });
            assert.deepEqual(prompt.context, { tenantId: 'tenant-1', userId: 'user-1' });
        });

        it('rejects an action that is not a module capability', async () => {
            const service = new StepService(new FakeLLMGateway([]));

            await assert.rejects(() => service.resolveInput({
                step: createStep('deleteEverything', {}),
                memory: WorkerMemory.empty(),
                tenantId: 'tenant-1',
                userId: 'user-1',
            }), /unknown action: deleteEverything/);
        });

        it('rejects an invalid json coming from the llm', async () => {
            const service = new StepService(new FakeLLMGateway(['not a json']));

            await assert.rejects(() => service.resolveInput({
                step: createStep('createProject', { name: 'App' }),
                memory: WorkerMemory.empty(),
                tenantId: 'tenant-1',
                userId: 'user-1',
            }), /invalid json for the step input/);
        });

        it('rejects a response without the input field', async () => {
            const service = new StepService(new FakeLLMGateway(['{"foo":1}']));

            await assert.rejects(() => service.resolveInput({
                step: createStep('createProject', { name: 'App' }),
                memory: WorkerMemory.empty(),
                tenantId: 'tenant-1',
                userId: 'user-1',
            }), /did not return a step input/);
        });
    });

    describe('interpretOutput', () => {
        it('keeps a structured output without calling the llm', async () => {
            const gateway = new FakeLLMGateway([]);
            const service = new StepService(gateway);

            const facts = await service.interpretOutput({
                step: createStep('createProject', { name: 'App' }),
                output: { projectId: 'project-1' },
            });

            assert.deepEqual(facts, { projectId: 'project-1' });
            assert.equal(gateway.requests.length, 0);
        });

        it('asks the llm to extract facts from a plain text output', async () => {
            const gateway = new FakeLLMGateway(['{"facts":{"projectId":"project-1"}}']);
            const service = new StepService(gateway);

            const facts = await service.interpretOutput({
                step: createStep('createProject', { name: 'App' }),
                output: 'project project-1 created',
            });

            assert.deepEqual(facts, { projectId: 'project-1' });
            assert.equal(gateway.requests.length, 1);

            const prompt = JSON.parse(gateway.lastRequest!.messages[1]!.content);
            assert.equal(prompt.rawOutput, 'project project-1 created');
            assert.deepEqual(prompt.contract.output.required, ['projectId']);
            assert.deepEqual(
                (gateway.lastRequest!.jsonSchema!.schema as any).properties.facts.required,
                ['projectId'],
            );
        });

        it('keeps a list output as it is', async () => {
            const gateway = new FakeLLMGateway([]);
            const service = new StepService(gateway);

            const facts = await service.interpretOutput({
                step: createStep('listTasks', { projectId: 'project-1' }),
                output: [{ id: 'task-1', name: 'First task' }],
            });

            assert.deepEqual(facts, [{ id: 'task-1', name: 'First task' }]);
            assert.equal(gateway.requests.length, 0);
        });

        it('returns null when the step produced nothing', async () => {
            const gateway = new FakeLLMGateway([]);
            const service = new StepService(gateway);

            const facts = await service.interpretOutput({
                step: createStep('createProject', { name: 'App' }),
                output: undefined,
            });

            assert.equal(facts, null);
            assert.equal(gateway.requests.length, 0);
        });

        it('rejects a response without the facts field', async () => {
            const service = new StepService(new FakeLLMGateway(['{"foo":1}']));

            await assert.rejects(() => service.interpretOutput({
                step: createStep('createProject', { name: 'App' }),
                output: 'project created',
            }), /did not return the step output facts/);
        });
    });
});
