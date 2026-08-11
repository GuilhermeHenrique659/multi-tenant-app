import type AgentGateway from "../../gateway/agent/AgentGateway";
import type { Result } from "../../util/Result";

type PlanAgentDependencies = {
    agentGateway: AgentGateway;
}

type PlanAgentInput = {
    tenantId: string;
    userPrompt: string;
}

/**
 * Only asks for the plan: the agent and the status of its steps arrive through
 * the stream, so there is nothing to read back here.
 */
export const PlanAgent = (dependencies: PlanAgentDependencies) => async (input: PlanAgentInput): Promise<Result<{ agentId: string }, Error>> => {
    return await dependencies.agentGateway.plan(input.tenantId, input.userPrompt);
}
