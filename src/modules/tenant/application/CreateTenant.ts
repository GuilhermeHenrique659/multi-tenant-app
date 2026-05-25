import Tenant from "../domain/Tenant.js";
import TenantCriteria from "../repository/TenantCriteria.js";
import TenantRepository from "../repository/TenantRepository.js";

export default class CreateTenant {
    constructor (private readonly _tenantRepository: TenantRepository) {}

    async execute (input: Input): Promise<Output> {
        const tenant = Tenant.create(input.name, input.subdomain);
        
        const hasDuplicateSubdomain = await this._tenantRepository.has(new TenantCriteria().subdomain(input.subdomain));

        if (hasDuplicateSubdomain) {
            throw new Error("Subdomain already in use");
        }

        await this._tenantRepository.save(tenant);
        
        return {
            tenantId: tenant.id.value
        }
    }
}

type Input = {
    name: string;
    subdomain: string;
}

type Output = {
    tenantId: string;
}