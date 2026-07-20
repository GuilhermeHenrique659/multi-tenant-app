import Id from "../../@common/Id.js";
import { Subject } from "../../@common/Observer.js";
import StepStatus from "./StepStatus.js";

type StepProps = {
    id: Id;
    workerId: Id;
    action: string;
    input: any;
    order: number;
    status: StepStatus;
}

class Step extends Subject {
    constructor(private readonly props: StepProps) {
        super();
    }

    readonly id = () => this.props.id;
    readonly order = () => this.props.order;
    readonly status = () => this.props.status;
}

export default Step;