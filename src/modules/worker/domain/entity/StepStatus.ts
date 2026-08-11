const stepStatus = new Set(['pending', 'running', 'completed', 'failed']);

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

    static create(status: string) {
        if (!stepStatus.has(status)) throw new Error(`invalid step status: ${status}`);

        return new StepStatus(status);
    }

    get value() {
        return this.status;
    }

    public isCompleted() {
        return this.status === "completed";
    }

    public isPending(){
        return this.status === 'pending';
    }
}