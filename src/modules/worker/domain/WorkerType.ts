enum Type {
    SCHEDULER,
    VIEW,
    ONCE,
}

export default class WorkerType {
    constructor(private type: Type) { }

    static scheduler() {
        return new WorkerType(Type.SCHEDULER);
    }

    static view() {
        return new WorkerType(Type.VIEW);
    }

    static once() {
        return new WorkerType(Type.ONCE);
    }

    get value() {
        return this.type;
    }

}