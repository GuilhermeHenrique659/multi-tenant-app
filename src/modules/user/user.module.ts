import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { CheckInInput, CheckInOutput, CreateUserInput, GetUserCriteria, LoginInput, LoginOutput, RemoveUserInput } from "./index.js";
import CheckIn from "./application/CheckIn.js";
import UserRepositoryDatabase from "./repository/UserRepositoryDatabase.js";
import RemoveUser from "./application/RemoveUser.js";
import CreateSuperAdmin from "./application/CreateSuperAdmin.js";
import Login from "./application/Login.js";
import TenantQuery from "../tenant/query/TenantQuery.js";
import UserQuery from "./query/UserQuery.js";
import { db } from "../../db/config.js";
import { Permissions } from "../@common/Permissions.js";
import { ProjectUserModule, ProjectUserModuleKey, UserTask } from "../project/UserModule.js";
import AuthorizerApplicationService, { AuthorizedInput } from "../@common/AuthorizerApplicationService.js";

export default class UserModuleImpl implements ProjectUserModule {
    constructor(private readonly _db: NodePgDatabase) { }

    async getUser(userId: string, tenantId: string): Promise<UserTask | null> {
        const userRole = await new UserQuery(this._db).getUserRoleByTenantIdAndUserId(tenantId, userId);

        if (!userRole) return null;

        return { id: userId, role: userRole };
    }

    authorizer<I extends AuthorizedInput, O>(service: AuthorizerApplicationService<I, O>, permissions: Array<string>): AuthorizerApplicationService<I, O> {
        return {
            execute: async (input: I) => {
                const hasPermission = await this.hasPermissions(input.userId, input.tenantId, permissions);
                if (!hasPermission) {
                    throw new Error('Forbidden');
                }
                return service.execute(input);
            }
        };
    }

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

    async getUserBy(input: GetUserCriteria) {
        const user = input.term.userId
            ? await new UserQuery(this._db).getById(input.term.userId)
            : await new UserQuery(this._db).getByName(input.term.name);

        if (!user) return null;

        if (input.includes.includes('role') && input?.query?.tenantId) {
            const userRole = await new UserQuery(this._db).getUserRoleByTenantIdAndUserId(input?.query?.tenantId, user.id);

            return {
                ...user,
                role: userRole,
            }
        }

        return user;
    }

    async hasPermissions(userId: string, tenantId: string, permissions: Array<string>): Promise<boolean> {
        const userRole = await new UserQuery(this._db).getUserRoleByTenantIdAndUserId(tenantId, userId);

        if (!userRole) return false;

        return permissions.every(permission => {
            const allowedRoles = Permissions.get(permission);
            return allowedRoles?.includes(userRole!) || false;
        });
    }
}

export { ProjectUserModuleKey };