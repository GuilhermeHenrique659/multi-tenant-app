enum Type {
    ACTION = "action",
    ASK = "ask",
}

export default class StepType {
    constructor(private readonly type: Type) { }

    static action() {
        return new StepType(Type.ACTION);
    }

    static ask() {
        return new StepType(Type.ASK);
    }

    static create(type: string) {
        const value = Object.values(Type).find(candidate => candidate === type.toLowerCase());

        if (!value) throw new Error(`invalid step type: ${type}`);

        return new StepType(value);
    }

    static isAsk(type: string) {
        return Type.ASK === type;
    }

    get value() {
        return this.type;
    }

    public isAction() {
        return this.type === Type.ACTION;
    }

    public isAsk() {
        return this.type === Type.ASK;
    }
}
