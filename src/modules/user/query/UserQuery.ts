import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { UserTable } from "../db/UserTable.js";
import { and, eq } from "drizzle-orm";
import { MembershipTable } from "../../tenant/db/MembershipTable.js";

export type UserType = {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    isActive: boolean;
    isSuperAdmin: boolean;
}

export default class UserQuery {
    constructor(private readonly _db: NodePgDatabase) { }


    public async getUserRoleByTenantIdAndUserId(tenantId: string, userId: string): Promise<string | null> {
        const [result] = await this._db.select()
            .from(MembershipTable)
            .where(and(eq(MembershipTable.tenantId, tenantId), eq(MembershipTable.userId, userId)));
            
        if (!result) return null;

        return result.role;
    }

    public async getById(id: string): Promise<UserType | null> {
        const [result] = await this._db.select().from(UserTable).where(eq(UserTable.id, id));

        if (!result) return null;

        return {
            id: result.id,
            name: result.name,
            email: result.email,
            createdAt: result.createdAt,
            isActive: result.isActive,
            isSuperAdmin: result.isSuperAdmin,
        };
    }
}