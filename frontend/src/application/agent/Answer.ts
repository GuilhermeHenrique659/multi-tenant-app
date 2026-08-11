import type AgentGateway from "../../gateway/agent/AgentGateway";
import type { Result } from "../../util/Result";

type AnswerStepDependencies = {
    agentGateway: AgentGateway;
}

type AnswerStepInput = {
    tenantId: string;
    agentId: string;
    stepId: string;
    answer: string;
}

/**
 * Sends what the user answered to a step that was waiting. The agent is planned
 * again from there, so the answer and the new steps arrive through the stream.
 */
export const AnswerStep = (dependencies: AnswerStepDependencies) => async (input: AnswerStepInput): Promise<Result<{ agentId: string }, Error>> => {
    return await dependencies.agentGateway.answer(input.tenantId, input.agentId, input.stepId, input.answer);
}
