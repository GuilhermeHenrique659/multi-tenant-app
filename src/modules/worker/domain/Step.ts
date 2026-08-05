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

    get order() {
        return this.props.order
    };

    get status() {
        return this.props.status
    };

    get type() {
        return this.props.type
    };

    public setAsComplete() {
        this.props.status = StepStatus.completed();
        this.notify({ event: 'StatusChanged', data: this.props.status.value })
    }

    public setAsError() {
        this.props.status = StepStatus.failed();
        this.notify({ event: 'StatusChanged', data: this.props.status.value })

    }
}

export default Step;