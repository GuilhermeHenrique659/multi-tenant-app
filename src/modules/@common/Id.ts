import { randomUUID } from "node:crypto";

export default class Id {
    constructor (private readonly _value: string) {}

    static create (value?: string): Id {
        return new Id(value || randomUUID());
    }

    get value (): string {
        return this._value;
    }
}   