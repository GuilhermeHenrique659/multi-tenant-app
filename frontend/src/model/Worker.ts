import { z } from "zod";
import { createStore } from "./common/Storage";
import { ModelCollection } from "./common/Collection";

/** The input only comes for a step of type `ask`, so it is optional here. */
const AskInputSchema = z.looseObject({
    question: z.string().optional(),
});

const WorkerStepSchema = z.object({
    action: z.string(),
    status: z.string(),
    order: z.number(),
    type: z.string(),
    input: AskInputSchema.nullable().default(null),
    error: z.string().nullable().default(null),
});

const WorkerSchema = z.object({
    id: z.string(),
    name: z.string(),
    steps: z.array(WorkerStepSchema),
});

type WorkerProps = z.infer<typeof WorkerSchema>;

export type WorkerStep = z.infer<typeof WorkerStepSchema>;

export type Worker = Readonly<{
    props: Readonly<WorkerProps>;
}>;

type WorkerId = string;

export type WorkerCollection = {
    workers: ModelCollection<WorkerId, Worker>;
};

export const Create = (data: Record<string, unknown>): Worker => {
    const props = WorkerSchema.parse(data);
    return { props };
};

export const From = (data: unknown): Worker | null => {
    const result = WorkerSchema.safeParse(data);
    if (!result.success) return null;
    return { props: result.data };
};

/** Whatever does not parse is dropped, so a bad item does not lose the list. */
export const FromList = (data: unknown): Array<Worker> => {
    if (!Array.isArray(data)) return [];

    return data.map(From).filter((worker): worker is Worker => !!worker);
};

export const workersStore = createStore<WorkerCollection>({ workers: new ModelCollection(new Map()) });
