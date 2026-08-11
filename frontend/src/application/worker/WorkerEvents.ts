import type { CloseStream } from "../../gateway/worker/WorkerGateway";
import type WorkerGateway from "../../gateway/worker/WorkerGateway";
import type { WorkerStepEvent } from "../../model/events/WorkerEvents";
import { FromList, type Worker } from "../../model/Worker";
import type { PublisherType } from "../pub/Publisher";

type StreamWorkersDependencies = {
    workerGateway: WorkerGateway;
}

type WorkersEventInput = {
    tenantId: string;
    publisher: PublisherType;
    updateStep: (workerId: string, order: number, status: string, answer?: string | null) => void;
    setWorkers: (input: Array<Worker>) => void
}

/**
 * Keeps the worker list up to date while the stream is open: the snapshot brings
 * the current state, every step event patches the status of one step and a new
 * plan makes the list be read again, because it comes with new steps.
 */
export const WorkerEvents = (dependencies: StreamWorkersDependencies) => ({ publisher, tenantId, updateStep, setWorkers }: WorkersEventInput): CloseStream => {
    const readAgain = () => dependencies.workerGateway
        .list(tenantId)
        .then(result => setWorkers(result.unwrapOr([])));


    const onStepUpdated = (event: WorkerStepEvent) => updateStep(event.stepId, event.order, event.status, event.answer);
    publisher.sub('StepUpdated', onStepUpdated);

    publisher.sub('snapshot', (data) => {
        const workers = FromList(data);
        setWorkers(workers);
    });

    publisher.sub('WorkerCreated', readAgain);
    publisher.sub('WorkerUpdated', readAgain);


    return dependencies.workerGateway.streamEvents(tenantId, publisher);
}
