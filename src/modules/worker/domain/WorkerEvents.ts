/** Domain events of a worker: the name and the payload of each one live here. */
export const WorkerCreated = 'WorkerCreated';
export const WorkerResumed = 'WorkerResumed';
export const WorkerFinished = 'WorkerFinished';

export const StepStarted = 'StepStarted';
export const StepCompleted = 'StepCompleted';
export const StepFailed = 'StepFailed';
export const StepAsked = 'StepAsked';
export const StepAnswered = 'StepAnswered';

/** Names of every event that comes with a new plan, so the list has to be read again. */
export const WorkerPlanEvents = [WorkerCreated, WorkerResumed];

/** Names of every event that carries a step status change. */
export const StepEvents = [StepStarted, StepCompleted, StepFailed, StepAsked, StepAnswered];

export type StepEventData = {
    workerId: string;
    tenantId: string;
    stepId: string;
    order: number;
    action: string;
    status: string;
    /** Only the event of an answered step carries it. */
    answer?: string | undefined;
}

export type WorkerFinishedData = {
    workerId: string;
    tenantId: string;
}
