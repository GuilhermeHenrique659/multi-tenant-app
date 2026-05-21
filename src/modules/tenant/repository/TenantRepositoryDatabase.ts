import { NodePgDatabase } from "drizzle-orm/node-postgres";
import TenantRepository from "./TenantRepository.js";
import Tenant from "../domain/Tenant.js";
import { TenantTable } from "../db/TenantTable.js";
import { eq } from "drizzle-orm";
import Id from "../../@common/Id.js";

export default class TenantRepositoryDatabase implements TenantRepository {
    constructor (private readonly _db: NodePgDatabase) {}

    async save(tenant: Tenant): Promise<void> {
        await this._db.insert(TenantTable).values({
            id: tenant.id.value,
            name: tenant.name,
            subdomain: tenant.subdomain,
            createdAt: tenant.createdAt
        });
    }

    async hasDuplicateSubdomain(subdomain: string): Promise<boolean> {
        const result = await this._db.select().from(TenantTable).where(eq(TenantTable.subdomain, subdomain)).limit(1);

        return result.length > 0;
    }

    async getById(id: string): Promise<Tenant | null> {
        const [result] = await this._db.select().from(TenantTable).where(eq(TenantTable.id, id));

        if (!result) return null;

        return new Tenant({
            id: Id.create(result.id),
            name: result.name,
            subdomain: result.subdomain,
            createdAt: result.createdAt
        });
    }
}