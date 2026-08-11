import ChangeTrackingObserver from "../../../@common/ChangeTrackingObserver.js";
import Id from "../../../@common/Id.js";
import { Subject } from "../../../@common/Observer.js";
import Step from "./Step.js";
import StepCollection from "./StepCollection.js";
import StepType from "./StepType.js";
import AgentType from "./AgentType.js";

type AgentProps = {
    id: Id;
    tenantId: Id;
    name: string;
    userPrompt: string;
    type: AgentType;
    steps: StepCollection;
    createdAt: Date;
}

export type PlannedStep = {
    action: string;
    input: any;
    order: number;
    type: StepType;
}

export default class Agent extends Subject {
    private readonly _event = new ChangeTrackingObserver();

    constructor(private readonly props: AgentProps) {
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

    /** What the user asked for, kept for when the plan has to be analysed again. */
    get userPrompt() {
        return this.props.userPrompt;
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

    public step(id: string) {
        return this.props.steps.getById(id);
    }

    /** The first step that is not completed yet, so a resumed agent does not repeat work. */
    public nextStep() {
        return this.props.steps.getAll().find(step => !step.status.isCompleted());
    }

    public plan(steps: PlannedStep[]) {
        this.props.steps = new StepCollection(
            steps.map(step => Step.create(this.props.id.value, step.action, step.input, step.order, step.type))
        );

        this.notify({ event: 'stepsPlanned', data: { agentId: this.id } });
    }

    public answer(answer: { stepId: string, data: string}) {
        const step = this.steps.getById(answer.stepId);

        if (!step) throw new Error('Step not found');

        if (!step.status.isPending()) throw new Error('Step must be pending');

        const previous = this.steps.getPrevious(step.order);

        if (previous?.status.isPending()) throw new Error('Step must be answer after previous steps finish');

        step.answerStep(answer.data);

        return step;
    }

    /**
     * Keeps what is already completed and replaces everything the agent did not
     * finish with the steps of the new plan, whose order continues from there.
     */
    public replan(steps: PlannedStep[]) {
        const current = this.props.steps.getAll();
        const completed = current.filter(step => step.status.isCompleted());
        const discarded = current.filter(step => !step.status.isCompleted());
        const lastOrder = completed.at(-1)?.order ?? 0;

        const added = [...steps]
            .sort((a, b) => a.order - b.order)
            .map((step, index) => Step.create(this.props.id.value, step.action, step.input, lastOrder + index + 1, step.type));

        this.props.steps = new StepCollection([...completed, ...added]);

        this.notify({
            event: 'stepsReplanned',
            data: {
                agentId: this.id,
                removed: discarded.map(step => step.id.value),
                added: added.map(step => step.id.value),
            },
        });
    }

    public isDone() {
        return this.props.steps.getAll().every(step => step.status.isCompleted());
    }

    static create(tenantId: string, name: string, userPrompt: string, type: AgentType, steps: StepCollection) {
        const agent = new Agent({
            tenantId: new Id(tenantId),
            name,
            userPrompt,
            type,
            steps,
            id: Id.create(),
            createdAt: new Date(),
        });

        agent.notify({ event: 'agentCreated', data: { agentId: agent.id } });

        return agent;
    }

    static restore(props: { id: string; tenantId: string; name: string; userPrompt: string; type: string; steps: Step[]; createdAt: Date }) {
        return new Agent({
            id: new Id(props.id),
            tenantId: new Id(props.tenantId),
            name: props.name,
            userPrompt: props.userPrompt,
            type: AgentType.create(props.type),
            steps: new StepCollection(props.steps),
            createdAt: props.createdAt,
        });
    }
}
