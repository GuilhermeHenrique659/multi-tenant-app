import type AgentGateway from "../../gateway/agent/AgentGateway";
import type { Agent } from "../../model/Agent";
import { Result } from "../../util/Result";

type ListAgentsDependencies = {
    agentGateway: AgentGateway;
}

type ListAgentsInput = {
    tenantId: string;
}

export const ListAgents = (dependencies: ListAgentsDependencies) => async (input: ListAgentsInput): Promise<Result<Array<Agent>, Error>> => {
    return await dependencies.agentGateway.list(input.tenantId);
}
