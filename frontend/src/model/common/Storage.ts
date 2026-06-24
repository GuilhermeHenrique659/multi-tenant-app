type Listener = () => void;

export const createStore = <T>(initialState: T) => {
    let state = initialState;
    const listeners = new Set<Listener>();

    const api = {
        getState: () => state,
        setState: (fn: (s: T) => T) => {
            state = fn(state);
            listeners.forEach(l => l());
        },
        subscribe: (l: Listener) => {
            listeners.add(l);
            return () => listeners.delete(l);
        }
    };

    return api;
}