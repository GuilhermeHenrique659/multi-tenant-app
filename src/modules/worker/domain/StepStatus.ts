export default class StepStatus {
    constructor(private status: string) { }

    static pending() {
        return new StepStatus("pending");
    }

    static running() {
        return new StepStatus("running");
    }

    static completed() {
        return new StepStatus("completed");
    }

    static failed() {
        return new StepStatus("failed");
    }

    get value() {
        return this.status;
    }
}