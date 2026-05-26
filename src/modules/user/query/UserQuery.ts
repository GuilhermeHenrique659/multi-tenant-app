import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { UserTable } from "../db/UserTable.js";
import { eq } from "drizzle-orm";

export default class UserQuery {
    constructor (private readonly _db: NodePgDatabase) {}

    public async getById(id: string) {
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