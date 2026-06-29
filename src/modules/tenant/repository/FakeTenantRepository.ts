import { BaseCriteria } from "../../@common/Criteria.js";
import Id from "../../@common/Id.js";
import Membership, { Role } from "../domain/Membership.js";
import Tenant from "../domain/Tenant.js";
import TenantRepository from "./TenantRepository.js";

type TenantSnapshot = {
    id: string;
    name: string;
    subdomain: string;
    maxNumberOfMembers: number;
    createdAt: Date;
    memberships: Array<{ userId: string; role: string }>;
};

export default class FakeTenantRepository implements TenantRepository {
    private tenants = new Map<string, TenantSnapshot>();

    async save(tenant: Tenant): Promise<void> {
        this.tenants.set(tenant.id, {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            maxNumberOfMembers: tenant.maxNumberOfMembers,
            createdAt: tenant.createdAt,
            memberships: tenant.memberships.map(m => ({
                userId: m.userId.value,
                role: m.role.value,
            })),
        });
    }

    async has(criteria: BaseCriteria): Promise<boolean> {
        for (const snapshot of this.tenants.values()) {
            if (this.matches(snapshot, criteria)) return true;
        }
        return false;
    }

    async get(criteria: BaseCriteria): Promise<Tenant | null> {
        for (const snapshot of this.tenants.values()) {
            if (this.matches(snapshot, criteria)) {
                return new Tenant({
                    id: new Id(snapshot.id),
                    name: snapshot.name,
                    subdomain: snapshot.subdomain,
                    maxNumberOfMembers: snapshot.maxNumberOfMembers,
                    createdAt: snapshot.createdAt,
                    memberships: snapshot.memberships.map(
                        m => new Membership({ userId: new Id(m.userId), role: new Role(m.role) })
                    ),
                });
            }
        }
        return null;
    }

    private matches(snapshot: TenantSnapshot, criteria: BaseCriteria): boolean {
        return criteria.criterias.every(c => {
            if (c.op !== 'eq') return false;
            const value = snapshot[c.key as keyof TenantSnapshot];
            return String(value) === String(c.value);
        });
    }

    clear(): void {
        this.tenants.clear();
    }
}
