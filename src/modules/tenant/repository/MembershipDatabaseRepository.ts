import { NodePgDatabase } from "drizzle-orm/node-postgres";
import MembershipRepository from "./MembershipRepository.js";
import Membership, { Role } from "../domain/Membership.js";
import { MembershipTable } from "../db/MembershipTable.js";
import { BaseCriteria } from "../../@common/Criteria.js";
import { DrizzleCriteriaApply } from "../../@common/DrizzleCriteriaApply.js";
import Id from "../../@common/Id.js";

export default class MembershipDatabaseRepository implements MembershipRepository {
    constructor(private readonly _db: NodePgDatabase) { }

    async save(membership: Membership): Promise<void> {
        await this._db.insert(MembershipTable).values({
            userId: membership.userId.value,
            tenantId: membership.tenantId.value,
            role: membership.role.value,
        })
    }

    async has(criteria: BaseCriteria): Promise<boolean> {
        const result = await this._db.select().from(MembershipTable).where(DrizzleCriteriaApply(criteria, MembershipTable)).limit(1);
        return result.length > 0;
    }

    async get(criteria: BaseCriteria): Promise<Membership | null> {
        const [result] = await this._db.select().from(MembershipTable).where(DrizzleCriteriaApply(criteria, MembershipTable)).limit(1);

        if (result === undefined) return null;

        return new Membership({
            tenantId: new Id(result.tenantId),
            userId: new Id(result.userId),
            role: new Role(result.role),
        });
    }
}