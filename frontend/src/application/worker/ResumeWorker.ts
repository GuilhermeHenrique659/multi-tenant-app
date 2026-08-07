import type WorkerGateway from "../../gateway/worker/WorkerGateway";
import type { Result } from "../../util/Result";

type ResumeWorkerDependencies = {
    workerGateway: WorkerGateway;
}

type ResumeWorkerInput = {
    tenantId: string;
    workerId: string;
}

/**
 * Asks the backend to plan again what is left of a worker that stopped. The new
 * steps and their statuses arrive through the stream.
 */
export const ResumeWorker = (dependencies: ResumeWorkerDependencies) => async (input: ResumeWorkerInput): Promise<Result<{ workerId: string }, Error>> => {
    return await dependencies.workerGateway.resume(input.tenantId, input.workerId);
}
