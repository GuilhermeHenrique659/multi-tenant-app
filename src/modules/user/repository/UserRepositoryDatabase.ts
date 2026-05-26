import User from "../domain/User.js";
import UserCriteria from "./UserCriteria.js";
import UserRepository from "./UserRepository.js";
import Id from "../../@common/Id.js";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { UserTable } from "../db/UserTable.js";
import { DrizzleCriteriaApply } from "../../@common/DrizzleCriteriaApply.js";
import { eq } from "drizzle-orm";

export default class UserRepositoryDatabase implements UserRepository {
    constructor (private readonly _db: NodePgDatabase) {}

    async has(criteria: UserCriteria): Promise<boolean> {
        const result = await this._db.select({ id: UserTable.id }).from(UserTable).where(DrizzleCriteriaApply(criteria, UserTable));
        return result.length > 0;
    }

    async get(criteria: UserCriteria): Promise<User | null> {
        const [user] = await this._db.select().from(UserTable).where(DrizzleCriteriaApply(criteria, UserTable));

        if (!user) return null;

        return new User({
            id: new Id(user.id),
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            isActive: user.isActive,
            isSuperAdmin: user.isSuperAdmin,
        });
    }

    async save(user: User): Promise<void> {
        await this._db.insert(UserTable).values({
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            isActive: user.isActive,
            isSuperAdmin: user.isSuperAdmin,
        }).onConflictDoUpdate({
            target: UserTable.id,
            set: {
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
                isActive: user.isActive,
                isSuperAdmin: user.isSuperAdmin,
            }
        });
    }
    
    async delete(user: User): Promise<void> {
        await this._db.delete(UserTable).where(eq(UserTable.id, user.id));
    }
}