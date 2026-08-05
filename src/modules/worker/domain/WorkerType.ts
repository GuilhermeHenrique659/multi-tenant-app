export default class WorkerType {
    constructor(private type: string) { }

    static create(type: string) {
        return new WorkerType(type);
    }

    get value() {
        return this.type;
    }

}