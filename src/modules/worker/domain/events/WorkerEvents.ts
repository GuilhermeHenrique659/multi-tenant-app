import { DomainEvent } from "../../../@common/queue/Queue.js";
import Step from "../entity/Step.js";
import Worker from "../entity/Worker.js";

/**
 * Domain events of a worker: one class for each one, so what an event carries is
 * built from the domain in a single place instead of at every publisher.
 */

/** What a run needs to start, so a subscriber runs the worker from the event alone. */
export type WorkerRunData = {
    workerId: string;
    tenantId: string;
    userId: string;
}

export type WorkerFinishedData = {
    workerId: string;
    tenantId: string;
}

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

/** Every step event shows the same picture of the step. */
function stepData(worker: Worker, step: Step): StepEventData {
    return {
        workerId: worker.id,
        tenantId: worker.tenantId,
        stepId: step.id.value,
        order: step.order,
        action: step.action,
        status: step.status.value,
    };
}

export class WorkerCreated implements DomainEvent {
    readonly eventName = 'WorkerCreated';

    constructor(readonly data: WorkerRunData) { }

    static from(worker: Worker, userId: string): WorkerCreated {
        return new WorkerCreated({ workerId: worker.id, tenantId: worker.tenantId, userId });
    }
}

export class WorkerResumed implements DomainEvent {
    readonly eventName = 'WorkerResumed';

    constructor(readonly data: WorkerRunData) { }

    static from(worker: Worker, userId: string): WorkerResumed {
        return new WorkerResumed({ workerId: worker.id, tenantId: worker.tenantId, userId });
    }
}

export class WorkerFinished implements DomainEvent {
    readonly eventName = 'WorkerFinished';

    constructor(readonly data: WorkerFinishedData) { }

    static from(worker: Worker): WorkerFinished {
        return new WorkerFinished({ workerId: worker.id, tenantId: worker.tenantId });
    }
}

export class StepStarted implements DomainEvent {
    readonly eventName = 'StepStarted';

    constructor(readonly data: StepEventData) { }

    static from(worker: Worker, step: Step): StepStarted {
        return new StepStarted(stepData(worker, step));
    }
}

export class StepCompleted implements DomainEvent {
    readonly eventName = 'StepCompleted';

    constructor(readonly data: StepEventData) { }

    static from(worker: Worker, step: Step): StepCompleted {
        return new StepCompleted(stepData(worker, step));
    }
}

export class StepFailed implements DomainEvent {
    readonly eventName = 'StepFailed';

    constructor(readonly data: StepEventData) { }

    static from(worker: Worker, step: Step): StepFailed {
        return new StepFailed(stepData(worker, step));
    }
}

export class StepAsked implements DomainEvent {
    readonly eventName = 'StepAsked';

    constructor(readonly data: StepEventData) { }

    static from(worker: Worker, step: Step): StepAsked {
        return new StepAsked(stepData(worker, step));
    }
}

export class StepAnswered implements DomainEvent {
    readonly eventName = 'StepAnswered';

    constructor(readonly data: StepEventData) { }

    /** The answer of the step is what makes this event different from the others. */
    static from(worker: Worker, step: Step): StepAnswered {
        const answer = step.answer;

        return new StepAnswered({
            ...stepData(worker, step),
            ...(answer === undefined ? {} : { answer }),
        });
    }
}