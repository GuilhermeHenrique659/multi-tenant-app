import Id from "../../@common/Id.js";
import { Subject } from "../../@common/Observer.js";
import StepCollection from "./StepCollection.js";

type WorkerProps = {
    id: Id;
    tenantId: Id;
    name: string;
    type: WorkerType;
    steps: StepCollection;
}

class Worker extends Subject {
    constructor(private readonly props: WorkerProps) {
        super();
    }

    public isDone() {
        return this.props.steps.getAll().every(step => step.status().value === "completed");
    }
}