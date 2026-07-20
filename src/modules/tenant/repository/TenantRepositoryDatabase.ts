import { NodePgDatabase } from "drizzle-orm/node-postgres";
import TenantRepository from "./TenantRepository.js";
import Tenant from "../domain/Tenant.js";
import { TenantTable } from "../db/TenantTable.js";
import Id from "../../@common/Id.js";
import { BaseCriteria } from "../../@common/Criteria.js";
import { DrizzleCriteriaApply } from "../../@common/DrizzleCriteriaApply.js";
import { MembershipTable } from "../db/MembershipTable.js";
import { and, eq } from "drizzle-orm";
import Membership, { Role } from "../domain/Membership.js";
import ChangeTrackingObserver from "../../@common/ChangeTrackingObserver.js";

export default class TenantRepositoryDatabase implements TenantRepository {
    constructor(private readonly _db: NodePgDatabase) { }

    private async _addTenent(tenant: Tenant): Promise<void> {
        await this._db.insert(TenantTable).values({
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            maxNumberOfMembers: tenant.maxNumberOfMembers,
            createdAt: tenant.createdAt
        });

        for (const membership of tenant.memberships) {
            await this._db.insert(MembershipTable).values({
                tenantId: tenant.id,
                userId: membership.userId.value,
                role: membership.role.value,
            });
        }
    }

    async save(tenant: Tenant): Promise<void> {
        const tracker = tenant.findObserver<ChangeTrackingObserver>(o => o instanceof ChangeTrackingObserver);

        if (!tracker || tracker.hasEvent("tenantCreated")) {
            await this._addTenent(tenant);
            return;
        }

        for (const change of tracker.changes) {
            switch (change.event) {
                case "memberAdded": {
                    await this._db.insert(MembershipTable).values({
                        tenantId: tenant.id,
                        userId: change.data.userId,
                        role: change.data.role,
                    });
                    break;
                }
                case "memberRoleChanged": {
                    await this._db.update(MembershipTable).set({
                        role: change.data.role,
                    }).where(
                        and(
                            eq(MembershipTable.tenantId, tenant.id),
                            eq(MembershipTable.userId, change.data.userId)
                        )
                    );
                    break;
                }
                case "memberRemoved": {
                    await this._db.delete(MembershipTable).where(
                        and(
                            eq(MembershipTable.tenantId, tenant.id),
                            eq(MembershipTable.userId, change.data.userId)
                        )
                    );
                    break;
                }
                case "tenantUpdated": {
                    await this._db.update(TenantTable).set({
                        name: change.data.name,
                        subdomain: change.data.subdomain,
                        maxNumberOfMembers: change.data.maxNumberOfMembers,
                    }).where(
                        eq(TenantTable.id, change.data.id)
                    );
                    break;
                }
            }
        }
    }

    async has(criteria: BaseCriteria): Promise<boolean> {
        const result = await this._db.select({ id: TenantTable.id }).from(TenantTable).where(DrizzleCriteriaApply(criteria, TenantTable));

        return result.length > 0;
    }

    async get(criteria: BaseCriteria): Promise<Tenant | null> {
        const [tenant] = await this._db.select().from(TenantTable).where(DrizzleCriteriaApply(criteria, TenantTable));

        if (!tenant) return null;
        const memberships = await this._db.select().from(MembershipTable).where(eq(MembershipTable.tenantId, tenant.id));

        const entity = new Tenant({
            id: Id.create(tenant.id),
            name: tenant.name,
            subdomain: tenant.subdomain,
            maxNumberOfMembers: tenant.maxNumberOfMembers,
            memberships: memberships.map(membership => new Membership({
                userId: new Id(membership.userId),
                role: new Role(membership.role),
            })),
            createdAt: tenant.createdAt,
        });

        return entity
    }
}