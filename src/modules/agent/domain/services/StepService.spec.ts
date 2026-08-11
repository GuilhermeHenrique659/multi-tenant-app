import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import FakeLLMGateway from '../../gateway/FakeLLMGateway.js';
import Step from '../entity/Step.js';
import StepService from './StepService.js';
import StepType from '../entity/StepType.js';
import AgentMemory from '../entity/AgentMemory.js';

describe('StepService', () => {
    function createStep(action: string, input: any, order = 1) {
        return Step.create('agent-1', action, input, order, StepType.action());
    }

    describe('resolveInput', () => {
        it('sends the contract, the planned input and the memory to the llm', async () => {
            const gateway = new FakeLLMGateway(['{"input":{"name":"Task","projectId":"project-1"}}']);
            const service = new StepService(gateway);

            const memory = AgentMemory.empty();
            memory.record({ order: 1, action: 'createProject', input: {}, output: { projectId: 'project-1' } });

            const [error, input] = await service.resolveInput({
                step: createStep('addTask', { name: 'Task', projectId: '<from createProject>' }, 2),
                memory,
                tenantId: 'tenant-1',
                userId: 'user-1',
            });

            assert.equal(error, null);
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

        it('gives back the failure of the gateway instead of throwing', async () => {
            const service = new StepService(new FakeLLMGateway([new Error('OpenRouter error 429: rate limited')]));

            const [error, input] = await service.resolveInput({
                step: createStep('createProject', { name: 'App' }),
                memory: AgentMemory.empty(),
                tenantId: 'tenant-1',
                userId: 'user-1',
            });

            assert.match(error!.message, /rate limited/);
            assert.equal(input, null);
        });

        it('rejects an action that is not a module capability', async () => {
            const service = new StepService(new FakeLLMGateway([]));

            const [error] = await service.resolveInput({
                step: createStep('deleteEverything', {}),
                memory: AgentMemory.empty(),
                tenantId: 'tenant-1',
                userId: 'user-1',
            });

            assert.match(error!.message, /unknown action: deleteEverything/);
        });

        it('rejects an invalid json coming from the llm', async () => {
            const service = new StepService(new FakeLLMGateway(['not a json']));

            const [error] = await service.resolveInput({
                step: createStep('createProject', { name: 'App' }),
                memory: AgentMemory.empty(),
                tenantId: 'tenant-1',
                userId: 'user-1',
            });

            assert.match(error!.message, /invalid json for the step input/);
        });

        it('rejects a response without the input field', async () => {
            const service = new StepService(new FakeLLMGateway(['{"foo":1}']));

            const [error] = await service.resolveInput({
                step: createStep('createProject', { name: 'App' }),
                memory: AgentMemory.empty(),
                tenantId: 'tenant-1',
                userId: 'user-1',
            });

            assert.match(error!.message, /did not return a step input/);
        });
    });

    describe('interpretOutput', () => {
        it('keeps a structured output without calling the llm', async () => {
            const gateway = new FakeLLMGateway([]);
            const service = new StepService(gateway);

            const [error, facts] = await service.interpretOutput({
                step: createStep('createProject', { name: 'App' }),
                output: { projectId: 'project-1' },
            });

            assert.equal(error, null);
            assert.deepEqual(facts, { projectId: 'project-1' });
            assert.equal(gateway.requests.length, 0);
        });

        it('asks the llm to extract facts from a plain text output', async () => {
            const gateway = new FakeLLMGateway(['{"facts":{"projectId":"project-1"}}']);
            const service = new StepService(gateway);

            const [error, facts] = await service.interpretOutput({
                step: createStep('createProject', { name: 'App' }),
                output: 'project project-1 created',
            });

            assert.equal(error, null);
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

            const [error, facts] = await service.interpretOutput({
                step: createStep('listTasks', { projectId: 'project-1' }),
                output: [{ id: 'task-1', name: 'First task' }],
            });

            assert.equal(error, null);
            assert.deepEqual(facts, [{ id: 'task-1', name: 'First task' }]);
            assert.equal(gateway.requests.length, 0);
        });

        it('returns null when the step produced nothing', async () => {
            const gateway = new FakeLLMGateway([]);
            const service = new StepService(gateway);

            const [error, facts] = await service.interpretOutput({
                step: createStep('createProject', { name: 'App' }),
                output: undefined,
            });

            assert.equal(error, null);
            assert.equal(facts, null);
            assert.equal(gateway.requests.length, 0);
        });

        it('gives back the failure of the gateway instead of throwing', async () => {
            const service = new StepService(new FakeLLMGateway([new Error('OpenRouter error 500: boom')]));

            const [error, facts] = await service.interpretOutput({
                step: createStep('createProject', { name: 'App' }),
                output: 'project created',
            });

            assert.match(error!.message, /boom/);
            assert.equal(facts, null);
        });

        it('rejects a response without the facts field', async () => {
            const service = new StepService(new FakeLLMGateway(['{"foo":1}']));

            const [error] = await service.interpretOutput({
                step: createStep('createProject', { name: 'App' }),
                output: 'project created',
            });

            assert.match(error!.message, /did not return the step output facts/);
        });
    });
});
