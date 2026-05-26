import Id from "../../@common/Id.js";
import { Subject } from "../../@common/Observer.js";
import Membership from "./Membership.js";

type TenantProps = {
    id: Id;
    name: string;
    subdomain: string;
    maxNumberOfMembers: number;
    memberships: Membership[];
    createdAt: Date;
}

export default class Tenant extends Subject {
    constructor(private readonly _props: TenantProps) {
        super();
    }

    get id(): Id {
        return this._props.id;
    }

    get name(): string {
        return this._props.name;
    }

    get subdomain(): string {
        return this._props.subdomain;
    }

    get maxNumberOfMembers(): number {
        return this._props.maxNumberOfMembers;
    }

    get memberships(): Membership[] {
        return this._props.memberships;
    }

    get createdAt(): Date {
        return this._props.createdAt;
    }

    public addNewMember(userId: string, tenantId: string, role: string) {
        const hasMembership = this._props.memberships.some(membership => membership.hasUserId(userId));

        if (hasMembership) {
            throw new Error("User is already a member of this tenant");
        }

        if (this._props.memberships.length >= this._props.maxNumberOfMembers) {
            throw new Error("Tenant has reached the maximum number of members");
        }

        this._props.memberships.push(Membership.create(userId, tenantId, role));

        this.notify({ event: "memberAdded", data: { userId, tenantId, role } });
    }

    public removeMember(userId: string) {
        const membershipIndex = this._props.memberships.findIndex(membership => membership.hasUserId(userId));

        if (membershipIndex === -1) {
            throw new Error("User is not a member of this tenant");
        }

        this._props.memberships.splice(membershipIndex, 1);

        this.notify({ event: "memberRemoved", data: { userId } });
    }

    public changeMemberRole(userId: string, role: string) {
        const membership = this._props.memberships.find(membership => membership.hasUserId(userId));

        if (!membership) {
            throw new Error("User is not a member of this tenant");
        }

        membership.changeRole(role);

        this.notify({ event: "memberRoleChanged", data: { userId, role } });
    }

    public increaseMaxNumberOfMembers(newMaxNumberOfMembers: number) {
        if (newMaxNumberOfMembers <= this._props.maxNumberOfMembers) {
            throw new Error("New maximum number of members must be greater than the current value");
        }

        this._props.maxNumberOfMembers = newMaxNumberOfMembers;

        this.notify({ event: "tenantUpdated", data: { id: this._props.id.value, maxNumberOfMembers: newMaxNumberOfMembers } });
    }

    public updateTenant(name: string, subdomain: string, maxNumberOfMembers: number, userId: string) {
        const membership = this._props.memberships.find(membership => membership.hasUserId(userId));

        if (!membership || membership.role.value !== 'admin') {
            throw new Error("User is not a member of this tenant");
        }

        this._props.name = name;
        this._props.subdomain = subdomain;

        this.notify({ event: "tenantUpdated", data: { id: this._props.id.value, name, subdomain } });
    }

    static create(name: string, subdomain: string, maxNumberOfMembers = 5): Tenant {
        return new Tenant({
            id: Id.create(),
            name,
            subdomain,
            maxNumberOfMembers,
            createdAt: new Date(),
            memberships: [],
        });
    }

}