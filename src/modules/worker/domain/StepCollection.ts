import Step from "./Step.js";

export default class StepCollection {
    constructor(private readonly steps: Step[]) { }

    public getAll(): Step[] {
        return [...this.steps].sort((a, b) => a.order - b.order);
    }

    static empty() {
        return new StepCollection([]);
    }
}