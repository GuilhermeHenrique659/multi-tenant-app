const status = new Set(['active', 'closed'])

export default class ProjectStatus {
    private constructor (private readonly _value: string) {}

    static create(val: string) {
        if (!status.has(val)) throw new Error('Invalid Status');

        return new ProjectStatus(val);
    }

    public get value() {
        return this._value;
    }
}