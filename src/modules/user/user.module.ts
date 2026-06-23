import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { CheckInInput, CheckInOutput, CreateUserInput, LoginInput, LoginOutput, RemoveUserInput, UserModule } from "./index.js";
import CheckIn from "./application/CheckIn.js";
import UserRepositoryDatabase from "./repository/UserRepositoryDatabase.js";
import RemoveUser from "./application/RemoveUser.js";
import CreateSuperAdmin from "./application/CreateSuperAdmin.js";
import Login from "./application/Login.js";
import TenantQuery from "../tenant/query/TenantQuery.js";
import UserQuery from "./query/UserQuery.js";
import { db } from "../../db/config.js";
import { Permissions } from "../@common/Permissions.js";

export default class UserModuleImpl implements UserModule {
    constructor(private readonly _db: NodePgDatabase) { }

    async login(input: LoginInput): Promise<LoginOutput> {
        return await this._db.transaction(async (tx) => {
            const userRepository = new UserRepositoryDatabase(tx);
            return new Login(userRepository).execute(input.email);
        })
    }

    async checkInUser(input: CheckInInput): Promise<CheckInOutput> {
        return this._db.transaction(async (tx) => {
            const userRepository = new UserRepositoryDatabase(tx);
            const checkIn = new CheckIn(userRepository);
            return checkIn.execute(input);
        });
    }

    async removeUser(input: RemoveUserInput): Promise<void> {
        return this._db.transaction(async (tx) => {
            const userRepository = new UserRepositoryDatabase(tx);
            const removeUser = new RemoveUser(userRepository);
            await removeUser.execute(input);
        });
    }

    async createSuperUser(input: CreateUserInput): Promise<void> {
        return this._db.transaction(async (tx) => {
            const userRepository = new UserRepositoryDatabase(tx);
            await new CreateSuperAdmin(userRepository).execute(input.name, input.email);
        });
    }

    async hasPermissions(userId: string, tenantId: string, permissions: Array<string>): Promise<boolean> {
        const userRole = await new UserQuery(db).getUserRoleByTenantIdAndUserId(tenantId, userId);

        if (!userRole) return false;

        return permissions.every(permission => {
            const allowedRoles = Permissions.get(permission);
            return allowedRoles?.includes(userRole!) || false;
        });
    }
}