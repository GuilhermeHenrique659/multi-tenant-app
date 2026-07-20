import Id from "../../@common/Id.js"
import { Subject } from "../../@common/Observer.js";
import ChangeTrackingObserver from "../../@common/ChangeTrackingObserver.js";
import DueDate from "./DueDate.js";
import TaskStatus from "./TaskStatus.js";

type TaskProps = {
    id: Id;
    name: string;
    status: TaskStatus;
    projectId: Id;
    createdAt: Date;
    dueDate: DueDate | null;
    assignId: Id | null;
};

export default class Task extends Subject {
    private readonly _changeTracker = new ChangeTrackingObserver();

    constructor(private readonly _props: TaskProps) {
        super();
        this.subscribe(this._changeTracker);
    }

    readonly id = () => this._props.id.value;
    readonly name = () => this._props.name;
    readonly status = () => this._props.status.value;
    readonly createdAt = () => this._props.createdAt;
    readonly startAt = () => this._props.dueDate?.startAt;
    readonly endAt = () => this._props.dueDate?.endAt;
    readonly assignId = () => this._props.assignId?.value;
    readonly projectId = () => this._props.projectId.value;

    public rename(name?: string) {
        if (!name) return;
        this._props.name = name;
    }

    public assigneeTo(userId: string) {
        this._props.assignId = new Id(userId);
    }

    public changeStatus(status?: string) {
        if (!status) return;

        const newStatus = TaskStatus.create(status);

        if (newStatus.value === this._props.status.value) return;

        if (newStatus.value === 'done' && this._props.dueDate?.endAt) throw new Error('to set a task as done, must set due date');

        this._props.status = newStatus;
    }

    public setDueDate(startAt?: string, endAt?: string) {
        if (!startAt && !endAt) return;

        const resolvedStartAt = startAt ? new Date(startAt) : this._props.dueDate?.startAt;
        const resolvedEndAt = endAt ? new Date(endAt) : this._props.dueDate?.endAt;

        if (!resolvedStartAt) throw new Error('start must be required');

        this._props.dueDate = DueDate.create(resolvedStartAt, resolvedEndAt);
    }

    static create(name: string, projectId: string) {
        const task = new Task({
            id: Id.create(),
            projectId: new Id(projectId),
            status: TaskStatus.create('screen'),
            name,
            createdAt: new Date(),
            assignId: null,
            dueDate: null
        });

        task.notify({ event: "taskCreated", data: { id: task.id() } });

        return task;
    }
}