import TenantCriteria from "../repository/TenantCriteria.js";
import TenantRepository from "../repository/TenantRepository.js";

export default class RemoveMember {
    constructor (private readonly _tenantRepository: TenantRepository) {}

    public async execute(input: Input): Promise<void> {
        const tenant = await this._tenantRepository.get(new TenantCriteria().id(input.tenantId));

        if (!tenant) throw new Error("Tenant não encontrado");

        tenant.removeMember(input.userId);

        await this._tenantRepository.save(tenant);
    }
}

type Input = {
    tenantId: string;
    userId: string;
}