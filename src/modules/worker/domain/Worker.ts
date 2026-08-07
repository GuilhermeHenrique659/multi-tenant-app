import ChangeTrackingObserver from "../../@common/ChangeTrackingObserver.js";
import Id from "../../@common/Id.js";
import { Subject } from "../../@common/Observer.js";
import Step from "./Step.js";
import StepCollection from "./StepCollection.js";
import StepType from "./StepType.js";
import WorkerType from "./WorkerType.js";

type WorkerProps = {
    id: Id;
    tenantId: Id;
    name: string;
    type: WorkerType;
    steps: StepCollection;
    createdAt: Date;
}

export type PlannedStep = {
    action: string;
    input: any;
    order: number;
    type: StepType;
}

export default class Worker extends Subject {
    private readonly _event = new ChangeTrackingObserver();
    private step?: Step;

    constructor(private readonly props: WorkerProps) {
        super();
        this.subscribe(this._event);
    }

    get id() {
        return this.props.id.value;
    }

    get tenantId() {
        return this.props.tenantId.value;
    }

    get name() {
        return this.props.name;
    }

    get type() {
        return this.props.type;
    }

    get steps() {
        return this.props.steps;
    }

    get createdAt() {
        return this.props.createdAt;
    }

    public nextStep() {
        const next = this.step ? this.props.steps.getNext(this.step) : this.props.steps.getAll().at(0);

        if (next) this.step = next;

        return next;
    }

    public plan(steps: PlannedStep[]) {
        this.props.steps = new StepCollection(
            steps.map(step => Step.create(this.props.id.value, step.action, step.input, step.order, step.type))
        );

        this.notify({ event: 'stepsPlanned', data: { workerId: this.id } });
    }

    public isDone() {
        return this.props.steps.getAll().every(step => step.status.value === "completed");
    }

    static create(tenantId: string, name: string, type: WorkerType, steps: StepCollection) {
        const worker = new Worker({
            tenantId: new Id(tenantId),
            name,
            type,
            steps,
            id: Id.create(),
            createdAt: new Date(),
        });

        worker.notify({ event: 'workerCreated', data: { workerId: worker.id } });

        return worker;
    }

    static restore(props: { id: string; tenantId: string; name: string; type: string; steps: Step[]; createdAt: Date }) {
        return new Worker({
            id: new Id(props.id),
            tenantId: new Id(props.tenantId),
            name: props.name,
            type: WorkerType.create(props.type),
            steps: new StepCollection(props.steps),
            createdAt: props.createdAt,
        });
    }
}
