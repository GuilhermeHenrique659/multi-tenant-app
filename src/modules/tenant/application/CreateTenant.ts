import Mediator from "../../@common/Mediator.js";
import * as UserModule from "../../user/UserModule.js";
import Tenant from "../domain/Tenant.js";
import TenantCriteria from "../repository/TenantCriteria.js";
import TenantRepository from "../repository/TenantRepository.js";

export default class CreateTenant {
    constructor(private readonly _tenantRepository: TenantRepository, private readonly _mediator: Mediator = new Mediator()) { }

    async execute(input: Input): Promise<Output> {
        const admin = await this._mediator.notify<UserModule.CheckInInput, UserModule.CheckInOutput>('checkInUser', {
            name: input.admin.name,
            email: input.admin.email,
            userId: input.admin.userId
        });

        const hasDuplicateSubdomain = await this._tenantRepository.has(new TenantCriteria().subdomain(input.subdomain));

        if (hasDuplicateSubdomain) {
            throw new Error("Subdomain already in use");
        }


        const tenant = Tenant.create(input.name, input.subdomain);
        tenant.addNewMember(admin.userId, 'admin');

        await this._tenantRepository.save(tenant);

        return {
            tenantId: tenant.id.value
        }
    }
}

type Input = {
    name: string;
    subdomain: string;
    admin: {
        userId: string;
        name: string;
        email: string;
    }
}

type Output = {
    tenantId: string;
}