import type { CloseStream } from "../../gateway/agent/AgentGateway";
import type AgentGateway from "../../gateway/agent/AgentGateway";
import type { AgentStepEvent } from "../../model/events/AgentEvents";
import { FromList, type Agent } from "../../model/Agent";
import type { PublisherType } from "../pub/Publisher";

type StreamAgentsDependencies = {
    agentGateway: AgentGateway;
}

type AgentsEventInput = {
    tenantId: string;
    publisher: PublisherType;
    updateStep: (agentId: string, order: number, status: string, answer?: string | null) => void;
    setAgents: (input: Array<Agent>) => void
}

/**
 * Keeps the agent list up to date while the stream is open: the snapshot brings
 * the current state, every step event patches the status of one step and a new
 * plan makes the list be read again, because it comes with new steps.
 */
export const AgentEvents = (dependencies: StreamAgentsDependencies) => ({ publisher, tenantId, updateStep, setAgents }: AgentsEventInput): CloseStream => {
    const readAgain = () => dependencies.agentGateway
        .list(tenantId)
        .then(result => setAgents(result.unwrapOr([])));


    const onStepUpdated = (event: AgentStepEvent) => updateStep(event.stepId, event.order, event.status, event.answer);
    publisher.sub('StepUpdated', onStepUpdated);

    publisher.sub('snapshot', (data) => {
        const agents = FromList(data);
        setAgents(agents);
    });

    publisher.sub('AgentCreated', readAgain);
    publisher.sub('AgentUpdated', readAgain);


    return dependencies.agentGateway.streamEvents(tenantId, publisher);
}
