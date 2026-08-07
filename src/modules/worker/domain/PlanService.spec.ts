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

        const result = await new PlanService(gateway).create({
            userPrompt: 'create a project named App with a first task',
            tenantId: 'tenant-1',
            userId: 'user-1',
        });

        assert.equal(result.name, 'Bootstrap project');
        assert.equal(result.type, 'project');
        assert.deepEqual(result.steps.map(step => step.action), ['createProject', 'addTask']);
        assert.deepEqual(result.steps.map(step => step.order), [1, 2]);
        assert.ok(result.steps.every(step => step.type.isAction()));
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

    it('rejects a plan with an action outside the module capabilities', async () => {
        const gateway = new FakeLLMGateway([JSON.stringify({
            name: 'Bad plan',
            type: 'project',
            steps: [{ action: 'dropDatabase', input: {}, type: 'action', order: 1 }],
        })]);

        await assert.rejects(
            () => new PlanService(gateway).create({ userPrompt: 'anything', tenantId: 'tenant-1', userId: 'user-1' }),
            /unknown action: dropDatabase/,
        );
    });

    it('rejects a plan without steps', async () => {
        const gateway = new FakeLLMGateway([JSON.stringify({ name: 'Bad plan', type: 'project' })]);

        await assert.rejects(
            () => new PlanService(gateway).create({ userPrompt: 'anything', tenantId: 'tenant-1', userId: 'user-1' }),
            /did not return a valid worker plan/,
        );
    });
});
