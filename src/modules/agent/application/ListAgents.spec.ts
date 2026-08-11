import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import ListAgents from './ListAgents.js';
import AgentQuery from '../query/AgentQuery.js';
import { AgentListItem } from '../index.js';

class FakeAgentQuery {
    readonly asked: string[] = [];

    constructor(private readonly agents: AgentListItem[]) { }

    async listAgentsByTenantId(tenantId: string): Promise<AgentListItem[]> {
        this.asked.push(tenantId);
        return this.agents;
    }
}

describe('ListAgents', () => {
    it('lists the agents of the tenant with the action, the status and the order of each step', async () => {
        const query = new FakeAgentQuery([
            {
                id: 'agent-1',
                name: 'Bootstrap project',
                steps: [
                    { action: 'createProject', status: 'completed', order: 1 },
                    { action: 'addTask', status: 'pending', order: 2 },
                ],
            },
        ]);

        const result = await new ListAgents(query as unknown as AgentQuery).execute({
            tenantId: 'tenant-1',
            userId: 'user-1',
        });

        assert.deepEqual(result, [
            {
                id: 'agent-1',
                name: 'Bootstrap project',
                steps: [
                    { action: 'createProject', status: 'completed', order: 1 },
                    { action: 'addTask', status: 'pending', order: 2 },
                ],
            },
        ]);
        assert.deepEqual(query.asked, ['tenant-1']);
    });

    it('returns an empty list when the tenant has no agent', async () => {
        const query = new FakeAgentQuery([]);

        const result = await new ListAgents(query as unknown as AgentQuery).execute({
            tenantId: 'tenant-1',
            userId: 'user-1',
        });

        assert.deepEqual(result, []);
    });
});
