import type WorkerGateway from "../../gateway/worker/WorkerGateway";
import type { Result } from "../../util/Result";

type AnswerStepDependencies = {
    workerGateway: WorkerGateway;
}

type AnswerStepInput = {
    tenantId: string;
    workerId: string;
    stepId: string;
    answer: string;
}

/**
 * Sends what the user answered to a step that was waiting. The worker is planned
 * again from there, so the answer and the new steps arrive through the stream.
 */
export const AnswerStep = (dependencies: AnswerStepDependencies) => async (input: AnswerStepInput): Promise<Result<{ workerId: string }, Error>> => {
    return await dependencies.workerGateway.answer(input.tenantId, input.workerId, input.stepId, input.answer);
}
