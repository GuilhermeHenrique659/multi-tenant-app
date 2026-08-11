import { DomainEvent } from "../../../@common/queue/Queue.js";
import Step from "../entity/Step.js";
import Agent from "../entity/Agent.js";

/**
 * Domain events of a agent: one class for each one, so what an event carries is
 * built from the domain in a single place instead of at every publisher.
 */

/** What a run needs to start, so a subscriber runs the agent from the event alone. */
export type AgentRunData = {
    agentId: string;
    tenantId: string;
    userId: string;
}

export type AgentFinishedData = {
    agentId: string;
    tenantId: string;
}

export type StepEventData = {
    agentId: string;
    tenantId: string;
    stepId: string;
    order: number;
    action: string;
    status: string;
    /** Only the event of an answered step carries it. */
    answer?: string | undefined;
}

/** Every step event shows the same picture of the step. */
function stepData(agent: Agent, step: Step): StepEventData {
    return {
        agentId: agent.id,
        tenantId: agent.tenantId,
        stepId: step.id.value,
        order: step.order,
        action: step.action,
        status: step.status.value,
    };
}

export class AgentCreated implements DomainEvent {
    readonly eventName = 'AgentCreated';

    constructor(readonly data: AgentRunData) { }

    static from(agent: Agent, userId: string): AgentCreated {
        return new AgentCreated({ agentId: agent.id, tenantId: agent.tenantId, userId });
    }
}

export class AgentResumed implements DomainEvent {
    readonly eventName = 'AgentResumed';

    constructor(readonly data: AgentRunData) { }

    static from(agent: Agent, userId: string): AgentResumed {
        return new AgentResumed({ agentId: agent.id, tenantId: agent.tenantId, userId });
    }
}

export class AgentFinished implements DomainEvent {
    readonly eventName = 'AgentFinished';

    constructor(readonly data: AgentFinishedData) { }

    static from(agent: Agent): AgentFinished {
        return new AgentFinished({ agentId: agent.id, tenantId: agent.tenantId });
    }
}

export class StepStarted implements DomainEvent {
    readonly eventName = 'StepStarted';

    constructor(readonly data: StepEventData) { }

    static from(agent: Agent, step: Step): StepStarted {
        return new StepStarted(stepData(agent, step));
    }
}

export class StepCompleted implements DomainEvent {
    readonly eventName = 'StepCompleted';

    constructor(readonly data: StepEventData) { }

    static from(agent: Agent, step: Step): StepCompleted {
        return new StepCompleted(stepData(agent, step));
    }
}

export class StepFailed implements DomainEvent {
    readonly eventName = 'StepFailed';

    constructor(readonly data: StepEventData) { }

    static from(agent: Agent, step: Step): StepFailed {
        return new StepFailed(stepData(agent, step));
    }
}

export class StepAsked implements DomainEvent {
    readonly eventName = 'StepAsked';

    constructor(readonly data: StepEventData) { }

    static from(agent: Agent, step: Step): StepAsked {
        return new StepAsked(stepData(agent, step));
    }
}

export class StepAnswered implements DomainEvent {
    readonly eventName = 'StepAnswered';

    constructor(readonly data: StepEventData) { }

    /** The answer of the step is what makes this event different from the others. */
    static from(agent: Agent, step: Step): StepAnswered {
        const answer = step.answer;

        return new StepAnswered({
            ...stepData(agent, step),
            ...(answer === undefined ? {} : { answer }),
        });
    }
}