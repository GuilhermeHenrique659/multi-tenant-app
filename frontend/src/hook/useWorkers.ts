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
        }
    };
}
