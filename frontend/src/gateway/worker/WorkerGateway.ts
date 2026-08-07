import type { Worker } from "../../model/Worker";
import type { Result } from "../../util/Result";

/** A step of a worker changed its status. */
export type WorkerStepEvent = {
    workerId: string;
    stepId: string;
    order: number;
    action: string;
    status: string;
}

export type WorkerStreamHandlers = {
    /** The state of every worker of the tenant, sent when the stream opens. */
    onSnapshot: (workers: Array<Worker>) => void;
    onStepChange: (event: WorkerStepEvent) => void;
    /** A worker was planned again, so its steps have to be read again. */
    onPlanChange: () => void;
}

/** Closes the stream, so whoever opened it can clean up. */
export type CloseStream = () => void;

export default interface WorkerGateway {
    plan(tenantId: string, userPrompt: string): Promise<Result<{ workerId: string }, Error>>;
    resume(tenantId: string, workerId: string): Promise<Result<{ workerId: string }, Error>>;
    list(tenantId: string): Promise<Result<Array<Worker>, Error>>;
    streamEvents(tenantId: string, handlers: WorkerStreamHandlers): CloseStream;
}
