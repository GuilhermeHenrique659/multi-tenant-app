import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { TenantTable } from "../db/TenantTable.js";
import { MembershipTable } from "../db/MembershipTable.js";
import { and, eq } from "drizzle-orm";

type TenantData = {
    id: string;
    name: string;
    maxNumberOfMembers: number;
    createdAt: Date;
    memberships: {
        userId: string;
        role: string;
    }[];
}

class TenantMapper {
    static toTenantData(tenant: any, memberships: any[]): TenantData {
        return {
            id: tenant.id,
            name: tenant.name,
            maxNumberOfMembers: tenant.maxNumberOfMembers,
            createdAt: tenant.createdAt,
            memberships: memberships.map(m => ({
                userId: m.userId,
                role: m.role,
            })),
        };
    }

    static toTenantDataWithoutMemberships(tenant: any): Omit<TenantData, 'memberships'> {
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
        const result = await this._db.select({ tenant: TenantTable, membership: MembershipTable }).from(TenantTable).leftJoin(MembershipTable, eq(TenantTable.id, MembershipTable.tenantId)).where(eq(TenantTable.id, tenantId));
        
        const tenant = result[0]?.tenant;
        if (!tenant) return null;
        
        if (result.length === 0) {
            return null;
        }

        const memberships = result.map(r => r.membership).filter((m): m is any => !!m);
        const tenantData: TenantData = TenantMapper.toTenantData(tenant, memberships);

        return tenantData;
    }

    public async getUserRoleByTenantIdAndUserId(tenantId: string, userId: string): Promise<string | null> {
        const [result] = await this._db.select().from(MembershipTable).where(and(eq(MembershipTable.tenantId, tenantId), eq(MembershipTable.userId, userId)));
        
        if (!result) return null;
        
        return result.role;
    }

    public async getTenantDataBySubdomain(subdomain: string): Promise<TenantData | null> {
        const result = await this._db.select({ tenant: TenantTable, membership: MembershipTable }).from(TenantTable).leftJoin(MembershipTable, eq(TenantTable.id, MembershipTable.tenantId)).where(eq(TenantTable.subdomain, subdomain));
        
        const tenant = result[0]?.tenant;
        if (!tenant) return null;
        
        if (result.length === 0) {
            return null;
        }

        const memberships = result.map(r => r.membership).filter((m): m is any => !!m);
        const tenantData: TenantData = TenantMapper.toTenantData(tenant, memberships);

        return tenantData;
    }


    public async getAllTenants(): Promise<Omit<TenantData, 'memberships'>[]> {
        const result = await this._db.select().from(TenantTable);
        
        return result.map(tenant => TenantMapper.toTenantDataWithoutMemberships(tenant));
    }
}