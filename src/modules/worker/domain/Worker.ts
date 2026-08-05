import Id from "../../@common/Id.js";
import { Subject } from "../../@common/Observer.js";
import Step from "./Step.js";
import StepCollection from "./StepCollection.js";
import WorkerType from "./WorkerType.js";

type WorkerProps = {
    id: Id;
    tenantId: Id;
    name: string;
    type: WorkerType;
    steps: StepCollection;
}

export default class Worker extends Subject {
    private step?: Step;

    constructor(private readonly props: WorkerProps) {
        super();
    }

    get id() {
        return this.props.id.value;
    }

    public nextStep() {
        if (!this.step) return this.props.steps.getAll().at(0)

        return this.props.steps.getNext(this.step);
    }

    public isDone() {
        return this.props.steps.getAll().every(step => step.status.value === "completed");
    }

    static create(tenantId: string, name: string, type: WorkerType, steps: StepCollection) {
        return new Worker({
            tenantId: new Id(tenantId),
            name,
            type,
            steps,
            id: Id.create(),
        })
    }
}