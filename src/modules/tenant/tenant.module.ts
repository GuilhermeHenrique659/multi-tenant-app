import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { AddMemberInput, CreateTenantInput, CreateTenantOutput, TenantData, TenantModule } from "./index.js";
import TenantRepository from "./repository/TenantRepository.js";
import TenantRepositoryDatabase from "./repository/TenantRepositoryDatabase.js";
import Mediator from "../@common/Mediator.js";
import CreateTenant from "./application/CreateTenant.js";
import AddUserToTenant from "./application/AddUserToTenant.js";
import RemoveMember from "./application/RemoveMember.js";
import UpdateMember from "./application/UpdateMember..js";
import TenantQuery from "./query/TenantQuery.js";

export default class TenantModuleImpl implements TenantModule {
    constructor(
        private readonly _db: NodePgDatabase,
        private readonly _mediator: Mediator,
        private readonly _tenantQuery: TenantQuery,
    ) { }

    async createTenant(input: CreateTenantInput): Promise<CreateTenantOutput> {
        return this._db.transaction(async (tx) => {
            const tenantRepository = new TenantRepositoryDatabase(tx);
            const createTenant = new CreateTenant(tenantRepository, this._mediator);
            try {
                return await createTenant.execute(input);
            } catch(err) {
                await this._mediator.notify('createTenantFail', input);

                throw err;
            }
        });
    }

    async addMember(input: AddMemberInput): Promise<AddMemberInput> {
        return this._db.transaction(async (tx) => {
            const tenantRepository = new TenantRepositoryDatabase(tx);
            const addUserToTenant = new AddUserToTenant(tenantRepository, this._mediator);
            try {
                await addUserToTenant.execute({
                    tenantId: input.tenantId,
                    user: {
                        id: input.userId,
                        name: input.name,
                        email: input.email,
                    },
                    role: input.role,
                });
                return input;
            } catch (err) {
                await this._mediator.notify('addMemberFail', input);
                throw err;
            }
        });

    }

    async removeMember(tenantId: string, userId: string): Promise<void> {
        return this._db.transaction(async (tx) => {
            const tenantRepository = new TenantRepositoryDatabase(tx);
            const removeMember = new RemoveMember(tenantRepository);
            await removeMember.execute({ tenantId, userId });
        });
    }

    async updateMember(tenantId: string, userId: string, role: string): Promise<void> {
        return this._db.transaction(async (tx) => {
            const tenantRepository = new TenantRepositoryDatabase(tx);
            const updateMember = new UpdateMember(tenantRepository);
            await updateMember.execute({ tenantId, userId, role });
        });
    }

    list(): Promise<Omit<TenantData, 'members'>[]> {
        return this._tenantQuery.getAllTenants();
    }

    getById(tenantId: string): Promise<TenantData | null> {
        return this._tenantQuery.getTenantDataById(tenantId);
    }

    getUserRole(tenantId: string, userId: string): Promise<string | null> {
        return this._tenantQuery.getUserRoleByTenantIdAndUserId(tenantId, userId);
    }
}