import { z } from "zod";
import { createStore } from "./common/Storage";
import { ModelCollection } from "./common/Collection";

/** The input only comes for a step of type `ask`, so it is optional here. */
const AskInputSchema = z.looseObject({
    question: z.string().optional(),
});

const AgentStepSchema = z.object({
    id: z.string(),
    action: z.string(),
    status: z.string(),
    order: z.number(),
    type: z.string(),
    input: AskInputSchema.nullable().default(null),
    error: z.string().nullable().default(null),
    /** What the user answered, which only a step of type `ask` has. */
    answer: z.string().nullable().default(null),
});

const AgentSchema = z.object({
    id: z.string(),
    name: z.string(),
    steps: z.array(AgentStepSchema),
});

type AgentProps = z.infer<typeof AgentSchema>;

export type AgentStep = z.infer<typeof AgentStepSchema>;

export type Agent = Readonly<{
    props: Readonly<AgentProps>;
}>;

type AgentId = string;

export type AgentCollection = {
    index: AgentIndex,
    agents: ModelCollection<AgentId, Agent>;
};

export const Create = (data: Record<string, unknown>): Agent => {
    const props = AgentSchema.parse(data);
    return { props };
};

export const From = (data: unknown): Agent | null => {
    const result = AgentSchema.safeParse(data);
    if (!result.success) return null;
    return { props: result.data };
};

/** Whatever does not parse is dropped, so a bad item does not lose the list. */
export const FromList = (data: unknown): Array<Agent> => {
    if (!Array.isArray(data)) return [];

    return data.map(From).filter((agent): agent is Agent => !!agent);
};



export type AgentIndex = {
    FKStepId: Map<string, string>;
};

export const BuildAgentIndex = (collection: AgentCollection['agents']) => {
    const FKStepId = collection.values().reduce((acc, crr) => {
        crr.props.steps.forEach(step => acc.set(step.id, crr.props.id));

        return acc;
    }, new Map<string, string>());

    return {
        FKStepId,
    }
}

export const agentsStore = createStore<AgentCollection>({ agents: new ModelCollection(new Map()), index: BuildAgentIndex(new ModelCollection(new Map())) });
