import type WorkerGateway from "../../gateway/worker/WorkerGateway";
import type { Worker } from "../../model/Worker";
import { Result } from "../../util/Result";

type PlanWorkerDependencies = {
    workerGateway: WorkerGateway;
}

type PlanWorkerInput = {
    tenantId: string;
    userPrompt: string;
}

/**
 * The plan is built by the backend, so the created worker is read back from the
 * list to get its name and steps.
 */
export const PlanWorker = (dependencies: PlanWorkerDependencies) => async (input: PlanWorkerInput): Promise<Result<Array<Worker>, Error>> => {
    const created = await dependencies.workerGateway.plan(input.tenantId, input.userPrompt);

    if (created.isErr()) return Result.Error(created.error);

    return await dependencies.workerGateway.list(input.tenantId);
}
