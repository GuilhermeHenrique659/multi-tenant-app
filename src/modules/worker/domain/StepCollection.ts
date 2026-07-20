import Step from "./Step.js";

export default class StepCollection {
    constructor(private readonly steps: Step[]) { }

    public getAll(): Step[] {
        return this.steps.sort((a, b) => a.order() - b.order());
    }

    public getNext(currentStep: Step): Step | undefined {
        const sortedSteps = this.getAll();
        const currentIndex = sortedSteps.findIndex(step => step.id() === currentStep.id());
        if (currentIndex === -1 || currentIndex === sortedSteps.length - 1) {
            return undefined;
        }
        return sortedSteps[currentIndex + 1];
    }
}