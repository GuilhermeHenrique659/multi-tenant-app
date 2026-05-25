import Id from "../../@common/Id.js";

export class Role {
    constructor(readonly value: string) { 
        if (value !== 'admin' && value !== 'member') {
            throw new Error("Invalid role");
        }
    }
}

type MembershipProps = {
    userId: Id;
    role: Role;
    tenantId: Id;
};

export default class Membership { 
    constructor (private readonly _props: MembershipProps) { }

    get userId(): Id {
        return this._props.userId;
    }
    
    get role(): Role {
        return this._props.role;
    }

    get tenantId(): Id {
        return this._props.tenantId;
    }

    changeRole(role: Role) {
        this._props.role = role;
    }   

    static create(userId: string, tenantId: string, role: string): Membership {
        return new Membership({
            userId: new Id(userId),
            role: new Role(role),
            tenantId: new Id(tenantId),
        });
    }
    
}