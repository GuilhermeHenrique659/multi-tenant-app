import ChangeTrackingObserver from "../../@common/ChangeTrackingObserver.js";
import Id from "../../@common/Id.js";
import { Subject } from "../../@common/Observer.js";
import StepStatus from "./StepStatus.js";
import StepType from "./StepType.js";

type StepProps = {
    id: Id;
    workerId: Id;
    action: string;
    input: any;
    order: number;
    type: StepType;
    status: StepStatus;
}

class Step extends Subject {
    private readonly _event = new ChangeTrackingObserver();

    constructor(private readonly props: StepProps) {
        super();
        this.subscribe(this._event);
    }

    get action() {
        return this.props.action;
    }

    get input() {
        return this.props.input;
    }

    get id() {
        return this.props.id
    };

    get workerId() {
        return this.props.workerId
    };

    get order() {
        return this.props.order
    };

    get status() {
        return this.props.status
    };

    get type() {
        return this.props.type
    };

    get changes() {
        return this._event.changes;
    }

    public setAsComplete() {
        this.props.status = StepStatus.completed();
        this.notify({ event: 'StatusChanged', data: this.props.status.value })
    }

    public setAsError() {
        this.props.status = StepStatus.failed();
        this.notify({ event: 'StatusChanged', data: this.props.status.value })

    }

    static create(workerId: string, action: string, input: any, order: number, type: StepType) {
        return new Step({
            id: Id.create(),
            workerId: new Id(workerId),
            action,
            input,
            order,
            type,
            status: StepStatus.pending(),
        })
    }

    static restore(props: { id: string; workerId: string; action: string; input: any; order: number; type: string; status: string }) {
        return new Step({
            id: new Id(props.id),
            workerId: new Id(props.workerId),
            action: props.action,
            input: props.input,
            order: props.order,
            type: StepType.create(props.type),
            status: StepStatus.create(props.status),
        })
    }
}

export default Step;
