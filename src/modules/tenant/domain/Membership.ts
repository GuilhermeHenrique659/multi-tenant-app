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
};

export default class Membership { 
    constructor (private readonly _props: MembershipProps) { }

    get userId(): Id {
        return this._props.userId;
    }
    
    get role(): Role {
        return this._props.role;
    }

    hasUserId(userId: string): boolean {
        return this._props.userId.value === userId;
    }

    changeRole(role: string) {
        this._props.role = new Role(role);
    }   

    static create(userId: string, tenantId: string, role: string): Membership {
        return new Membership({
            userId: new Id(userId),
            role: new Role(role),
        });
    }   
}