import TenantCriteria from "../repository/TenantCriteria.js";
import TenantRepository from "../repository/TenantRepository.js";

export default class UpdateMember {
    constructor (private readonly _tenantRepository: TenantRepository) {}

    public async execute(input: Input): Promise<Output> {
        const tenant = await this._tenantRepository.get(new TenantCriteria().id(input.tenantId));
        
        if (!tenant) throw new Error("Tenant não encontrado");

        tenant.changeMemberRole(input.userId, input.role);

        await this._tenantRepository.save(tenant);

        return {
            tenantId: tenant.id.value,
            userId: input.userId,
            newRole: input.role,
        }
    }
}

type Input = {
    tenantId: string;
    userId: string;
    role: 'admin' | 'member';
}

type Output = {
    tenantId: string;
    userId: string;
    newRole: 'admin' | 'member';
}