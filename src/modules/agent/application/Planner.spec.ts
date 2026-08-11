import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import FakeLLMGateway from '../gateway/FakeLLMGateway.js';
import PlanService from '../domain/services/PlanService.js';
import FakeAgentRepository from '../repository/FakeAgentRepository.js';
import AgentCriteria from '../repository/AgentCriteria.js';
import { DomainEvent, Queue, Unsubscribe } from '../../@common/queue/Queue.js';
import Planner from './Planner.js';

class FakeQueue implements Queue {
    readonly published: DomainEvent[] = [];

    async publish(event: DomainEvent): Promise<void> {
        this.published.push(event);
    }

    async subscriber(): Promise<Unsubscribe> {
        return () => { };
    }
}

describe('Planner', () => {
    it('saves a agent with the planned steps and publishes AgentCreated', async () => {
        const repository = new FakeAgentRepository();
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

        const agent = await repository.get(new AgentCriteria().getById(output.agentId));

        assert.ok(agent);
        assert.equal(agent.isDone(), false);
        assert.deepEqual(agent.steps.getAll().map(step => step.action), ['createProject', 'addTask']);
        assert.ok(agent.steps.getAll().every(step => step.agentId.value === output.agentId));
        assert.deepEqual(queue.published.map(event => event.eventName), ['AgentCreated']);
        assert.deepEqual(queue.published.map(event => event.data), [
            { agentId: output.agentId, tenantId: 'tenant-1', userId: 'user-1' },
        ]);
    });
});
