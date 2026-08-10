import { useRef, useSyncExternalStore } from "react";
import type { Store } from "../../model/common/Storage";

/** Same items, same order: enough to keep a derived array snapshot stable. */
export const sameItems = <T>(previous: Array<T>, next: Array<T>) =>
    previous.length === next.length && previous.every((item, index) => item === next[index]);

/**
 * The store notifies every listener on each change, so what decides a re-render
 * is the selector. `isEqual` lets a selector derive a new object (an ids array,
 * for instance) without looping forever: when it matches the previous snapshot
 * the previous value is handed back, so React sees no change.
 */
export const useModelStore = <S, T>(
    store: Store<S>,
    selector: (state: S) => T,
    isEqual: (previous: T, next: T) => boolean = Object.is
) => {
    const cache = useRef<{ value: T } | null>(null);

    const getSnapshot = () => {
        const next = selector(store.getState());
        const previous = cache.current;

        if (previous && isEqual(previous.value, next)) return previous.value;

        cache.current = { value: next };
        return next;
    };

    return useSyncExternalStore(store.subscribe, getSnapshot);
};
