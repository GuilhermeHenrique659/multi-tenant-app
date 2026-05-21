import Id from "../../@common/Id.js";

type TenantProps = {
    id: Id;
    name: string;
    subdomain: string;
    createdAt: Date;
}


export default class Tenant {
    constructor(private readonly _props: TenantProps) { }

    get id(): Id {
        return this._props.id;
    }

    get name(): string {
        return this._props.name;
    }

    get subdomain(): string {
        return this._props.subdomain;
    }

    get createdAt(): Date {
        return this._props.createdAt;
    }

    static create(name: string, subdomain: string): Tenant {
        return new Tenant({
            id: Id.create(),
            name,
            subdomain,
            createdAt: new Date(),
        })
    }

}