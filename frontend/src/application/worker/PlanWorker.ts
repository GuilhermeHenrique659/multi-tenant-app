import type WorkerGateway from "../../gateway/worker/WorkerGateway";
import type { Result } from "../../util/Result";

type PlanWorkerDependencies = {
    workerGateway: WorkerGateway;
}

type PlanWorkerInput = {
    tenantId: string;
    userPrompt: string;
}

/**
 * Only asks for the plan: the worker and the status of its steps arrive through
 * the stream, so there is nothing to read back here.
 */
export const PlanWorker = (dependencies: PlanWorkerDependencies) => async (input: PlanWorkerInput): Promise<Result<{ workerId: string }, Error>> => {
    return await dependencies.workerGateway.plan(input.tenantId, input.userPrompt);
}
