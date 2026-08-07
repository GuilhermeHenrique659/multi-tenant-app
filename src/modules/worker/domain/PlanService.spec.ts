import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import FakeLLMGateway from '../gateway/FakeLLMGateway.js';
import PlanService from './PlanService.js';

describe('PlanService', () => {
    const plan = JSON.stringify({
        name: 'Bootstrap project',
        type: 'project',
        steps: [
            { action: 'createProject', input: { name: 'App' }, type: 'action', order: 1 },
            { action: 'addTask', input: { name: 'First task', projectId: '<from step 1>' }, type: 'action', order: 2 },
        ],
    });

    it('turns the llm plan into planned steps', async () => {
        const gateway = new FakeLLMGateway([plan]);

        const [error, result] = await new PlanService(gateway).create({
            userPrompt: 'create a project named App with a first task',
            tenantId: 'tenant-1',
            userId: 'user-1',
        });

        assert.equal(error, null);
        assert.equal(result!.name, 'Bootstrap project');
        assert.equal(result!.type, 'project');
        assert.deepEqual(result!.steps.map(step => step.action), ['createProject', 'addTask']);
        assert.deepEqual(result!.steps.map(step => step.order), [1, 2]);
        assert.ok(result!.steps.every(step => step.type.isAction()));
    });

    it('sends the module capabilities as the available actions', async () => {
        const gateway = new FakeLLMGateway([plan]);

        await new PlanService(gateway).create({ userPrompt: 'anything', tenantId: 'tenant-1', userId: 'user-1' });

        const request = gateway.lastRequest!;
        assert.equal(request.jsonSchema?.name, 'worker_plan');

        const prompt = JSON.parse(request.messages[1]!.content);
        assert.equal(prompt.userPrompt, 'anything');
        assert.ok(prompt.capabilities.some((capability: any) => capability.action === 'createProject'));
        assert.deepEqual(prompt.context, { tenantId: 'tenant-1', userId: 'user-1' });
    });

    it('gives back the failure of the gateway instead of throwing', async () => {
        const gateway = new FakeLLMGateway([new Error('OpenRouter error 401: no credits')]);

        const [error, result] = await new PlanService(gateway)
            .create({ userPrompt: 'anything', tenantId: 'tenant-1', userId: 'user-1' });

        assert.match(error!.message, /no credits/);
        assert.equal(result, null);
    });

    it('rejects a plan with an action outside the module capabilities', async () => {
        const gateway = new FakeLLMGateway([JSON.stringify({
            name: 'Bad plan',
            type: 'project',
            steps: [{ action: 'dropDatabase', input: {}, type: 'action', order: 1 }],
        })]);

        const [error] = await new PlanService(gateway)
            .create({ userPrompt: 'anything', tenantId: 'tenant-1', userId: 'user-1' });

        assert.match(error!.message, /unknown action: dropDatabase/);
    });

    it('rejects a plan with an invalid step type', async () => {
        const gateway = new FakeLLMGateway([JSON.stringify({
            name: 'Bad plan',
            type: 'project',
            steps: [{ action: 'createProject', input: {}, type: 'dance', order: 1 }],
        })]);

        const [error] = await new PlanService(gateway)
            .create({ userPrompt: 'anything', tenantId: 'tenant-1', userId: 'user-1' });

        assert.match(error!.message, /invalid step type: dance/);
    });

    it('rejects a plan without steps', async () => {
        const gateway = new FakeLLMGateway([JSON.stringify({ name: 'Bad plan', type: 'project' })]);

        const [error] = await new PlanService(gateway)
            .create({ userPrompt: 'anything', tenantId: 'tenant-1', userId: 'user-1' });

        assert.match(error!.message, /did not return a valid worker plan/);
    });
});
