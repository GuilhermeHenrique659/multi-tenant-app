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
    answer?: string;
    type: StepType;
    status: StepStatus;
    error?: string | undefined;
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

    get answer() {
        return this.props.answer;
    }

    get order() {
        return this.props.order
    };

    get status() {
        return this.props.status
    };

    get type() {
        return this.props.type
    };

    /** Why the step failed, when it did. */
    get error() {
        return this.props.error
    };

    get changes() {
        return this._event.changes;
    }

    public isAsk() {
        return this.type.isAsk();
    }

    public isAction() {
        return this.type.isAction();
    }

    public setAsRunning() {
        this.props.status = StepStatus.running();
        this.notify({ event: 'StepUpdated', data: this.props.status.value })
    }

    public setAsComplete() {
        this.props.status = StepStatus.completed();
        this.notify({ event: 'StepUpdated', data: this.props.status.value })
    }

    /** The reason is kept so a resume can be planned knowing what went wrong. */
    public setAsError(reason?: string) {
        this.props.status = StepStatus.failed();
        this.props.error = reason;
        this.notify({ event: 'StepUpdated', data: this.props.status.value })
    }

    /**
     * The work of an `ask` step is getting the data, so it is complete once the
     * user answers: it is not asked again and the plan keeps it with the answer.
     */
    public answerStep(answer: string) {
        this.props.answer = answer;
        this.setAsComplete();
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

    static restore(props: { id: string; workerId: string; action: string; input: any; order: number; type: string; status: string; error?: string | null; answer?: string | null }) {
        return new Step({
            id: new Id(props.id),
            workerId: new Id(props.workerId),
            action: props.action,
            input: props.input,
            order: props.order,
            type: StepType.create(props.type),
            status: StepStatus.create(props.status),
            ...(props.error ? { error: props.error } : {}),
            ...(props.answer ? { answer: props.answer } : {}),
        })
    }
}

export default Step;
