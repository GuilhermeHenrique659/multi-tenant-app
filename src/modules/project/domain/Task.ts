import Id from "../../@common/Id.js"
import { Subject } from "../../@common/Observer.js";
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
    constructor(private readonly _props: TaskProps) {
        super();
    }

    readonly id = () => this._props.id.value;
    readonly name = () => this._props.name;
    readonly status = () => this._props.status.value;
    readonly createdAt = () => this._props.createdAt;
    readonly startAt = () => this._props.dueDate?.startAt;
    readonly endAt = () => this._props.dueDate?.endAt;
    readonly assignId = () => this._props.assignId?.value;
    readonly projectId = () => this._props.projectId.value;

    public assigneeTo(userId: string) {
        this._props.assignId = new Id(userId);
    }

    public changeStatus(status: string) {
        const newStatus = TaskStatus.create(status);

        if (newStatus.value === this._props.status.value) return;

        if (newStatus.value === 'done' && this._props.dueDate?.endAt) throw new Error('to set a task as done, must set due date');

        this._props.status = newStatus;
    }

    public setDueDate(startAt?: Date, endAt?: Date) {
        const newStartAt = startAt || this._props.dueDate?.startAt;

        if (!newStartAt) throw new Error('start must be required');

        const dueDate = DueDate.create(newStartAt, endAt || this._props.dueDate?.endAt);

        this._props.dueDate = dueDate;
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

        return task;
    }
}