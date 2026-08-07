import { useSyncExternalStore } from "react";
import { workersStore, type Worker, type WorkerCollection } from "../model/Worker";
import { ModelCollection } from "../model/common/Collection";
import { ModelToMapFn } from "../util/ArrayUtil";

export const useWorkerStore = <T>(
    selector: (state: WorkerCollection) => T
) => {
    return useSyncExternalStore(
        workersStore.subscribe,
        () => selector(workersStore.getState())
    );
}

/**
 * Returns the collection, not `values()`: a new array on every snapshot read
 * makes useSyncExternalStore re-render forever.
 */
export const useWorkers = () => {
    return useWorkerStore(s => s.workers);
}

export const useWorkerActions = () => {
    return {
        setWorkers: (workers: Worker[]) => {
            workersStore.setState(() => ({
                workers: ModelCollection.from(workers, ModelToMapFn)
            }));
        },

        /**
         * Applies the status a single step reached. The state is kept the same
         * object when there is nothing to change, so no re-render is triggered.
         */
        patchStep: (workerId: string, order: number, status: string) => {
            workersStore.setState(state => {
                const worker = state.workers.get(workerId);

                if (!worker) return state;

                const steps = worker.props.steps.map(step => step.order === order ? { ...step, status } : step);
                const updated: Worker = { props: { ...worker.props, steps } };

                const workers = state.workers.values().map(item => item.props.id === workerId ? updated : item);

                return { workers: ModelCollection.from(workers, ModelToMapFn) };
            });
        }
    };
}
