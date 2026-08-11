export default class AgentType {
    constructor(private type: string) { }

    static create(type: string) {
        return new AgentType(type);
    }

    get value() {
        return this.type;
    }

}