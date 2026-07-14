const taskStatus = new Set(['screen', 'working', 'review', 'done']);

export default class TaskStatus {
    private constructor(private readonly _value: string) { }

    public get value() {
        return this._value;
    }

    static create(val: string) {
        if (!taskStatus.has(val)) throw new Error('Task status not valid');

        return new TaskStatus(val);
    }
}