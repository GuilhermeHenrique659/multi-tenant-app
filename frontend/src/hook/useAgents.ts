import { BuildAgentIndex, agentsStore, type Agent, type AgentCollection } from "../model/Agent";
import { ModelCollection } from "../model/common/Collection";
import { ModelToMapFn } from "../util/ArrayUtil";
import { sameItems, useModelStore } from "./common/useModelStore";

export const useAgentStore = <T>(
    selector: (state: AgentCollection) => T,
    isEqual?: (previous: T, next: T) => boolean
) => {
    return useModelStore(agentsStore, selector, isEqual);
}

/**
 * Returns the collection, not `values()`: a new array on every snapshot read
 * makes useSyncExternalStore re-render forever.
 */
export const useAgents = () => {
    return useAgentStore(s => s.agents);
}

/**
 * Only the ids, so a step change inside a agent does not re-render the list
 * that renders the cards.
 */
export const useAgentIds = () => {
    return useAgentStore(s => s.agents.keys(), sameItems);
}

/** Re-renders only when this agent is the one that changed. */
export const useAgent = (agentId: string) => {
    return useAgentStore(s => s.agents.get(agentId));
}

export const useAgentActions = () => {
    return {
        setAgents: (agents: Agent[]) => {
            const collection = ModelCollection.from(agents, ModelToMapFn)
            agentsStore.setState(() => ({
                agents: collection,
                index: BuildAgentIndex(collection)
            }));
        },

        /**
         * Applies the status a single step reached, and the answer when the event
         * carries one. Only the patched agent gets a new identity: the collection
         * and the state stay the same object, so only the card reading this agent
         * re-renders. Nothing changes when the step already holds both.
         */
        patchStep: (stepId: string, order: number, status: string, answer?: string | null) => {
            agentsStore.setState(state => {
                const agentId = state.index.FKStepId.get(stepId);

                if (!agentId) return state;

                const agent = state.agents.get(agentId);

                if (!agent) return state;

                const current = agent.props.steps.find(step => step.order === order);

                if (!current) return state;

                const nextAnswer = answer ?? current.answer;

                if (current.status === status && current.answer === nextAnswer) return state;

                const steps = agent.props.steps.map(step => step.order === order ? { ...step, status, answer: nextAnswer } : step);

                state.agents.set(agentId, { props: { ...agent.props, steps } });

                return state;
            });
        }
    };
}
