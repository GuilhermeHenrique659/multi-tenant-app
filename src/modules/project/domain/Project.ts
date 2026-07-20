import Id from "../../@common/Id.js";
import { Subject } from "../../@common/Observer.js";
import ChangeTrackingObserver from "../../@common/ChangeTrackingObserver.js";
import ProjectStatus from "./ProjectStatus.js";

type ProjectProps = {
    id: Id;
    name: string;
    status: ProjectStatus;
    createdAt: Date;
    tenantId: Id;
}

export default class Project extends Subject {
    private readonly _changeTracker = new ChangeTrackingObserver();

    constructor(private readonly _props: ProjectProps) {
        super();
        this.subscribe(this._changeTracker);
    }

    readonly id = () => this._props.id.value;
    readonly name = () => this._props.name;
    readonly status = () => this._props.status.value;
    readonly createAt = () => this._props.createdAt;
    readonly tenantId = () => this._props.tenantId.value

    ensureIsActive() {
        if (this._props.status.value !== 'active') throw new Error('Project is not active');
    }

    static create(name: string, tenantId: string): Project {
        const project = new Project({ id: Id.create(), tenantId: new Id(tenantId), status: ProjectStatus.create('active'), createdAt: new Date(), name });

        project.notify({ event: "projectCreated", data: { id: project.id() } });

        return project
    }
}