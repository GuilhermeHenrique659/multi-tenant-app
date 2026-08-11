import Agent from "../domain/entity/Agent.js";
import AgentCriteria from "./AgentCriteria.js";
import AgentRepository from "./AgentRepository.js";

export default class FakeAgentRepository implements AgentRepository {
    private readonly agents = new Map<string, Agent>();
    private _saveCount = 0;

    get saveCount(): number {
        return this._saveCount;
    }

    async save(agent: Agent): Promise<void> {
        this._saveCount++;
        this.agents.set(agent.id, agent);
    }

    async get(criteria: AgentCriteria): Promise<Agent | null> {
        for (const agent of this.agents.values()) {
            if (this.matches(agent, criteria)) return agent;
        }
        return null;
    }

    private matches(agent: Agent, criteria: AgentCriteria): boolean {
        const snapshot: Record<string, string> = { id: agent.id, tenantId: agent.tenantId };

        return criteria.criterias.every(c => {
            if (c.op !== 'eq') return false;
            const value = snapshot[c.key];
            return value !== undefined && value === String(c.value);
        });
    }

    clear(): void {
        this.agents.clear();
        this._saveCount = 0;
    }
}
