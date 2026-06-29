import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { TenantTable } from "../db/TenantTable.js";
import { MembershipTable } from "../db/MembershipTable.js";
import { and, eq } from "drizzle-orm";
import { UserTable } from "../../user/db/UserTable.js";

type TenantData = {
    id: string;
    name: string;
    maxNumberOfMembers: number;
    createdAt: Date;
    members: {
        user: {
            id: string;
            name: string;
        };
        role: string;
    }[];
}

class TenantMapper {
    static toTenantData(tenant: any, memberships: any[], users: Map<string, any>): TenantData {
        return {
            id: tenant.id,
            name: tenant.name,
            maxNumberOfMembers: tenant.maxNumberOfMembers,
            createdAt: tenant.createdAt,
            members: memberships.map(m => ({
                user: users.get(m.userId)!,
                role: m.role,
            })),
        };
    }

    static toTenantDataWithoutMemberships(tenant: any): Omit<TenantData, 'members'> {
        return {
            id: tenant.id,
            name: tenant.name,
            maxNumberOfMembers: tenant.maxNumberOfMembers,
            createdAt: tenant.createdAt,
        };
    }
}

export default class TenantQuery {
    constructor(private readonly _db: NodePgDatabase) { }

    public async getTenantDataById(tenantId: string): Promise<TenantData | null> {
        const result = await this._db.select({ tenant: TenantTable, membership: MembershipTable, user: UserTable }).from(TenantTable)
            .leftJoin(MembershipTable, eq(TenantTable.id, MembershipTable.tenantId))
            .leftJoin(UserTable, eq(MembershipTable.userId, UserTable.id))
            .where(eq(TenantTable.id, tenantId));

        const tenant = result[0]?.tenant;
        if (!tenant) return null;

        if (result.length === 0) {
            return null;
        }

        const memberships = result.map(r => r.membership).filter((m): m is any => !!m);
        const users = new Map(result.map(r => r.user).filter((u) => !!u).map((u => [u.id, u])));
        const tenantData: TenantData = TenantMapper.toTenantData(tenant, memberships, users);

        return tenantData;
    }

    public async getTenantDataBySubdomain(subdomain: string): Promise<TenantData | null> {
        const result = await this._db.select({ tenant: TenantTable, membership: MembershipTable, user: UserTable })
            .from(TenantTable)
            .leftJoin(MembershipTable, eq(TenantTable.id, MembershipTable.tenantId))
            .innerJoin(UserTable, eq(MembershipTable.userId, UserTable.id))
            .where(eq(TenantTable.subdomain, subdomain));

        const tenant = result[0]?.tenant;
        if (!tenant) return null;

        if (result.length === 0) {
            return null;
        }

        const memberships = result.map(r => r.membership).filter((m): m is any => !!m);
        const users = new Map(result.map(r => r.user).filter((u) => !!u).map((u => [u.id, u])));
        const tenantData: TenantData = TenantMapper.toTenantData(tenant, memberships, users);

        return tenantData;
    }


    public async getAllTenants(): Promise<Omit<TenantData, 'members'>[]> {
        const result = await this._db.select().from(TenantTable);

        return result.map(tenant => TenantMapper.toTenantDataWithoutMemberships(tenant));
    }
}