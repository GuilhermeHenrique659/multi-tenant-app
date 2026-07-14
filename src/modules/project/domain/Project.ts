import Id from "../../@common/Id.js";
import { Subject } from "../../@common/Observer.js";
import ProjectStatus from "./ProjectStatus.js";

type ProjectProps = {
    id: Id;
    name: string;
    status: ProjectStatus;
    createdAt: Date;
    tenantId: Id;
}

export default class Project extends Subject {
    constructor(private readonly _props: ProjectProps) {
        super();
    }

    readonly id = () => this._props.id.value;
    readonly name = () => this._props.name;
    readonly status = () => this._props.status.value;
    readonly createAt = () => this._props.createdAt;
    readonly tenantId = () => this._props.tenantId.value

    static create(name: string, tenantId: string): Project {
        const project = new Project({ id: Id.create(), tenantId: new Id(tenantId), status: ProjectStatus.create('active'), createdAt: new Date(), name });

        return project
    }
}