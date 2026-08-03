enum Type {
    ACTION,
    ASK,
}

export default class StepType {
    constructor(private readonly type: Type) { }

    static action() {
        return new StepType(Type.ACTION);
    }

    static ask() {
        return new StepType(Type.ASK);
    }

    get value() {
        return this.type;
    }

}
