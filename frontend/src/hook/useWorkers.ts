import { BuildWorkerIndex, workersStore, type Worker, type WorkerCollection } from "../model/Worker";
import { ModelCollection } from "../model/common/Collection";
import { ModelToMapFn } from "../util/ArrayUtil";
import { sameItems, useModelStore } from "./common/useModelStore";

export const useWorkerStore = <T>(
    selector: (state: WorkerCollection) => T,
    isEqual?: (previous: T, next: T) => boolean
) => {
    return useModelStore(workersStore, selector, isEqual);
}

/**
 * Returns the collection, not `values()`: a new array on every snapshot read
 * makes useSyncExternalStore re-render forever.
 */
export const useWorkers = () => {
    return useWorkerStore(s => s.workers);
}

/**
 * Only the ids, so a step change inside a worker does not re-render the list
 * that renders the cards.
 */
export const useWorkerIds = () => {
    return useWorkerStore(s => s.workers.keys(), sameItems);
}

/** Re-renders only when this worker is the one that changed. */
export const useWorker = (workerId: string) => {
    return useWorkerStore(s => s.workers.get(workerId));
}

export const useWorkerActions = () => {
    return {
        setWorkers: (workers: Worker[]) => {
            const collection = ModelCollection.from(workers, ModelToMapFn)
            workersStore.setState(() => ({
                workers: collection,
                index: BuildWorkerIndex(collection)
            }));
        },

        /**
         * Applies the status a single step reached, and the answer when the event
         * carries one. Only the patched worker gets a new identity: the collection
         * and the state stay the same object, so only the card reading this worker
         * re-renders. Nothing changes when the step already holds both.
         */
        patchStep: (stepId: string, order: number, status: string, answer?: string | null) => {
            workersStore.setState(state => {
                const workerId = state.index.FKStepId.get(stepId);

                if (!workerId) return state;

                const worker = state.workers.get(workerId);

                if (!worker) return state;

                const current = worker.props.steps.find(step => step.order === order);

                if (!current) return state;

                const nextAnswer = answer ?? current.answer;

                if (current.status === status && current.answer === nextAnswer) return state;

                const steps = worker.props.steps.map(step => step.order === order ? { ...step, status, answer: nextAnswer } : step);

                state.workers.set(workerId, { props: { ...worker.props, steps } });

                return state;
            });
        }
    };
}
