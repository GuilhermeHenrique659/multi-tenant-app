import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { AddMemberInput, AddmemberOutput, CreateTenantInput, CreateTenantOutput, TenantData, TenantListItem } from "./index.js";
import TenantRepositoryDatabase from "./repository/TenantRepositoryDatabase.js";
import Mediator from "../@common/Mediator.js";
import CreateTenant from "./application/CreateTenant.js";
import AddUserToTenant from "./application/AddUserToTenant.js";
import RemoveMember from "./application/RemoveMember.js";
import UpdateMember from "./application/UpdateMember.js";
import ListTenants from "./application/ListTenants.js";
import GetTenantById from "./application/GetTenantById.js";
import TenantQuery from "./query/TenantQuery.js";
import { TenantUserModule } from "./UserModule.js";

export default class TenantModule {
    constructor(
        private readonly _db: NodePgDatabase,
        private readonly _mediator: Mediator,
        private readonly _userModule: TenantUserModule,
    ) { }

    async createTenant(input: CreateTenantInput): Promise<CreateTenantOutput> {
        const createTenant = new CreateTenant(new TenantRepositoryDatabase(this._db), this._mediator);
        const authorizer = this._userModule.superAdminAuthorizer(createTenant);

        try {
            return await authorizer.execute(input);
        } catch (err) {
            await this._mediator.notify('createTenantFail', input);
            throw err;
        }
    }

    async addMember(input: AddMemberInput): Promise<AddmemberOutput> {
        const addUserToTenant = new AddUserToTenant(new TenantRepositoryDatabase(this._db), this._mediator);
        const authorizer = this._userModule.authorizer(addUserToTenant, ['tenant:user:add']);

        try {
            return await authorizer.execute({
                userId: input.userId,
                tenantId: input.tenantId,
                user: {
                    id: input.targetUserId,
                    name: input.name,
                    email: input.email,
                },
                role: input.role,
            });
        } catch (err) {
            await this._mediator.notify('addMemberFail', input);
            throw err;
        }
    }

    async removeMember(input: { tenantId: string; userId: string; memberUserId: string }): Promise<void> {
        const removeMember = new RemoveMember(new TenantRepositoryDatabase(this._db));
        const authorizer = this._userModule.authorizer(removeMember, ['tenant:user:remove']);

        await authorizer.execute({
            userId: input.userId,
            tenantId: input.tenantId,
            memberUserId: input.memberUserId,
        });
    }

    async updateMember(input: { tenantId: string; userId: string; memberUserId: string; role: string }): Promise<void> {
        const updateMember = new UpdateMember(new TenantRepositoryDatabase(this._db));
        const authorizer = this._userModule.authorizer(updateMember, ['tenant:user:edit']);

        await authorizer.execute({
            userId: input.userId,
            tenantId: input.tenantId,
            memberUserId: input.memberUserId,
            role: input.role,
        });
    }

    async list(input: { userId: string }): Promise<TenantListItem[]> {
        const tenantQuery = new TenantQuery(this._db);
        const listTenants = new ListTenants(tenantQuery, this._userModule);
        return await listTenants.execute(input);
    }

    async getById(input: { userId: string; tenantId: string }): Promise<TenantData> {
        const tenantQuery = new TenantQuery(this._db);
        const getTenantById = new GetTenantById(tenantQuery);
        const authorizer = this._userModule.authorizer(getTenantById, ['tenant:details:view']);
        return await authorizer.execute(input);
    }
}
