import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import FakeLLMGateway from '../../gateway/FakeLLMGateway.js';
import PlanService from './PlanService.js';
import StepCollection from '../entity/StepCollection.js';
import StepType from '../entity/StepType.js';
import Agent from '../entity/Agent.js';
import AgentMemory from '../entity/AgentMemory.js';
import AgentType from '../entity/AgentType.js';

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
        assert.equal(request.jsonSchema?.name, 'agent_plan');

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

        assert.match(error!.message, /did not return a valid agent plan/);
    });

    /** The replan only stops redoing work if it sees what the completed steps produced. */
    it('sends the memory of the completed steps when it plans again', async () => {
        const gateway = new FakeLLMGateway([JSON.stringify({
            steps: [{ action: 'addTask', input: { name: 'First task', projectId: 'project-1' }, type: 'action', order: 1 }],
        })]);

        const agent = Agent.create('tenant-1', 'Bootstrap project', 'create a project with a task', AgentType.create('project'), StepCollection.empty());
        agent.plan([
            { action: 'createProject', input: { name: 'App' }, order: 1, type: StepType.action() },
            { action: 'addTask', input: { name: 'First task' }, order: 2, type: StepType.action() },
        ]);
        agent.steps.getAll()[0]!.setAsComplete();
        agent.steps.getAll()[1]!.setAsError('rate limited');

        const memory = AgentMemory.empty();
        memory.record({ order: 1, action: 'createProject', input: { name: 'App' }, output: { projectId: 'project-1' } });

        const [error, steps] = await new PlanService(gateway).replan({
            agent,
            memory,
            tenantId: 'tenant-1',
            userId: 'user-1',
        });

        assert.equal(error, null);
        assert.deepEqual(steps!.map(step => step.action), ['addTask']);

        const prompt = JSON.parse(gateway.lastRequest!.messages[1]!.content);
        assert.deepEqual(prompt.memory, [{ order: 1, action: 'createProject', input: { name: 'App' }, output: { projectId: 'project-1' } }]);
        assert.equal(prompt.agent.steps[1]!.error, 'rate limited');
    });

    /** The answer only helps if the llm reads it as the data that was missing. */
    it('sends the question and the answer of the step that was asking', async () => {
        const gateway = new FakeLLMGateway([JSON.stringify({
            steps: [{ action: 'createProject', input: { name: 'App' }, type: 'action', order: 1 }],
        })]);

        const agent = Agent.create('tenant-1', 'Bootstrap project', 'create a project', AgentType.create('project'), StepCollection.empty());
        agent.plan([
            { action: 'askUser', input: { question: 'What is the name of the project?' }, order: 1, type: StepType.ask() },
            { action: 'createProject', input: { name: '<from step 1>' }, order: 2, type: StepType.action() },
        ]);
        const answeredStep = agent.answer({ stepId: agent.steps.getAll()[0]!.id.value, data: 'App' });

        const [error, steps] = await new PlanService(gateway).planFromAnswer({
            agent,
            answeredStep,
            memory: AgentMemory.empty(),
            tenantId: 'tenant-1',
            userId: 'user-1',
        });

        assert.equal(error, null);
        assert.deepEqual(steps!.map(step => step.action), ['createProject']);

        const request = gateway.lastRequest!;
        assert.equal(request.jsonSchema?.name, 'agent_answer_plan');

        const prompt = JSON.parse(request.messages[1]!.content);
        assert.equal(prompt.answeredStep.answer, 'App');
        assert.equal(prompt.answeredStep.input.question, 'What is the name of the project?');
        assert.equal(prompt.agent.steps[0]!.status, 'completed');
        assert.equal(prompt.agent.steps[0]!.answer, 'App');
    });
});
