import type AgentGateway from "../../gateway/agent/AgentGateway";
import type { Result } from "../../util/Result";

type ResumeAgentDependencies = {
    agentGateway: AgentGateway;
}

type ResumeAgentInput = {
    tenantId: string;
    agentId: string;
}

/**
 * Asks the backend to plan again what is left of a agent that stopped. The new
 * steps and their statuses arrive through the stream.
 */
export const ResumeAgent = (dependencies: ResumeAgentDependencies) => async (input: ResumeAgentInput): Promise<Result<{ agentId: string }, Error>> => {
    return await dependencies.agentGateway.resume(input.tenantId, input.agentId);
}
