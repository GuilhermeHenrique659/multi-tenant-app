import Step from "./Step.js";

export default class StepCollection {
    constructor(private readonly steps: Step[]) { }

    public getAll(): Step[] {
        return [...this.steps].sort((a, b) => a.order - b.order);
    }

    public getById(id: string) {
        return this.steps.find(step => step.id.value === id);
    }

    public getPrevious(stepOrder: number) {
        if (stepOrder === 0) return;

        return this.steps.find(step => step.order === stepOrder - 1);
    }

    static empty() {
        return new StepCollection([]);
    }
}