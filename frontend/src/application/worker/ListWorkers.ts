import type WorkerGateway from "../../gateway/worker/WorkerGateway";
import type { Worker } from "../../model/Worker";
import { Result } from "../../util/Result";

type ListWorkersDependencies = {
    workerGateway: WorkerGateway;
}

type ListWorkersInput = {
    tenantId: string;
}

export const ListWorkers = (dependencies: ListWorkersDependencies) => async (input: ListWorkersInput): Promise<Result<Array<Worker>, Error>> => {
    return await dependencies.workerGateway.list(input.tenantId);
}
