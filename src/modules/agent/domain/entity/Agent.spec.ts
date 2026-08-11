import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import ChangeTrackingObserver from '../../../@common/ChangeTrackingObserver.js';
import Step from './Step.js';
import StepCollection from './StepCollection.js';
import StepType from './StepType.js';
import Agent from './Agent.js';
import AgentType from './AgentType.js';

describe('Agent', () => {
    function createPlannedAgent() {
        const agent = Agent.create('tenant-1', 'Bootstrap project', 'create a project named App with a first task', AgentType.create('project'), StepCollection.empty());

        agent.plan([
            { action: 'createProject', input: { name: 'App' }, order: 1, type: StepType.action() },
            { action: 'addTask', input: { name: 'First task' }, order: 2, type: StepType.action() },
        ]);

        return agent;
    }

    /** A agent whose first step asks the user, which is where an answer arrives. */
    function createAskingAgent() {
        const agent = Agent.create('tenant-1', 'Bootstrap project', 'create a project', AgentType.create('project'), StepCollection.empty());

        agent.plan([
            { action: 'askUser', input: { question: 'What is the name of the project?' }, order: 1, type: StepType.ask() },
            { action: 'createProject', input: { name: '<from step 1>' }, order: 2, type: StepType.action() },
        ]);

        return agent;
    }

    function trackerOf(agent: Agent) {
        return agent.findObserver<ChangeTrackingObserver>(o => o instanceof ChangeTrackingObserver)!;
    }

    it('tracks its own creation so the repository can tell an insert from an update', () => {
        const agent = createPlannedAgent();

        assert.ok(trackerOf(agent).hasEvent('agentCreated'));
    });

    it('gives the planned steps the id of the agent', () => {
        const agent = createPlannedAgent();

        assert.ok(agent.steps.getAll().every(step => step.agentId.value === agent.id));
        assert.ok(agent.steps.getAll().every(step => step.status.value === 'pending'));
    });

    it('walks the steps in order and stops at the end', () => {
        const agent = createPlannedAgent();

        const first = agent.nextStep();
        assert.equal(first?.action, 'createProject');

        first?.setAsComplete();

        const second = agent.nextStep();
        assert.equal(second?.action, 'addTask');

        second?.setAsComplete();

        assert.equal(agent.nextStep(), undefined);
    });

    it('rebuilds a agent coming from the database', () => {
        const restored = Agent.restore({
            id: 'agent-1',
            tenantId: 'tenant-1',
            name: 'Bootstrap project',
            userPrompt: 'create a project named App with a first task',
            type: 'project',
            createdAt: new Date('2026-08-07T10:00:00.000Z'),
            steps: [
                Step.restore({ id: 'step-2', agentId: 'agent-1', action: 'addTask', input: { name: 'First task' }, order: 2, type: 'action', status: 'pending' }),
                Step.restore({ id: 'step-1', agentId: 'agent-1', action: 'createProject', input: { name: 'App' }, order: 1, type: 'action', status: 'completed' }),
            ],
        });

        assert.equal(restored.id, 'agent-1');
        assert.equal(restored.tenantId, 'tenant-1');
        assert.equal(restored.type.value, 'project');
        assert.deepEqual(restored.steps.getAll().map(step => step.action), ['createProject', 'addTask']);
        assert.equal(restored.isDone(), false);
        // The completed step is skipped, so a resumed agent does not repeat it.
        assert.equal(restored.nextStep()?.id.value, 'step-2');
    });

    it('does not report itself as created when it comes from the database', () => {
        const restored = Agent.restore({
            id: 'agent-1',
            tenantId: 'tenant-1',
            name: 'Bootstrap project',
            userPrompt: 'create a project named App with a first task',
            type: 'project',
            createdAt: new Date('2026-08-07T10:00:00.000Z'),
            steps: [],
        });

        assert.equal(trackerOf(restored).hasEvent('agentCreated'), false);
    });

    it('is done once every step is completed', () => {
        const agent = createPlannedAgent();

        agent.steps.getAll().forEach(step => step.setAsComplete());

        assert.ok(agent.isDone());
    });

    /** The answer is data the plan already has, so the step that asked is finished. */
    it('completes the step that asked when the user answers it', () => {
        const agent = createAskingAgent();
        const asking = agent.steps.getAll()[0]!;

        const answered = agent.answer({ stepId: asking.id.value, data: 'App' });

        assert.equal(answered.id.value, asking.id.value);
        assert.equal(answered.answer, 'App');
        assert.ok(answered.status.isCompleted());
        assert.notEqual(agent.nextStep()?.id.value, asking.id.value);
    });

    it('keeps the answered step and its answer when the plan is made again from it', () => {
        const agent = createAskingAgent();
        const asking = agent.steps.getAll()[0]!;

        agent.answer({ stepId: asking.id.value, data: 'App' });
        agent.replan([{ action: 'createProject', input: { name: 'App' }, order: 1, type: StepType.action() }]);

        const steps = agent.steps.getAll();

        assert.deepEqual(steps.map(step => step.action), ['askUser', 'createProject']);
        assert.equal(steps[0]!.answer, 'App');
        assert.equal(agent.nextStep()?.action, 'createProject');
    });

    it('does not accept an answer for a step that is not asking anymore', () => {
        const agent = createAskingAgent();
        const asking = agent.steps.getAll()[0]!;

        agent.answer({ stepId: asking.id.value, data: 'App' });

        assert.throws(() => agent.answer({ stepId: asking.id.value, data: 'Other' }), /Step must be pending/);
    });
});
