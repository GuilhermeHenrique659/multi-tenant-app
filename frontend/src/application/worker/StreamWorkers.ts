import type { CloseStream } from "../../gateway/worker/WorkerGateway";
import type WorkerGateway from "../../gateway/worker/WorkerGateway";
import type { Worker } from "../../model/Worker";

type StreamWorkersDependencies = {
    workerGateway: WorkerGateway;
}

type StreamWorkersInput = {
    tenantId: string;
    setWorkers: (workers: Array<Worker>) => void;
    patchStep: (workerId: string, order: number, status: string) => void;
}

/**
 * Keeps the worker list up to date while the stream is open: the snapshot brings
 * the current state, every step event patches the status of one step and a new
 * plan makes the list be read again, because it comes with new steps.
 */
export const StreamWorkers = (dependencies: StreamWorkersDependencies) => (input: StreamWorkersInput): CloseStream => {
    const readAgain = () => dependencies.workerGateway
        .list(input.tenantId)
        .then(result => input.setWorkers(result.unwrapOr([])));

    return dependencies.workerGateway.streamEvents(input.tenantId, {
        onSnapshot: workers => input.setWorkers(workers),
        onStepChange: event => input.patchStep(event.workerId, event.order, event.status),
        onPlanChange: readAgain,
    });
}
