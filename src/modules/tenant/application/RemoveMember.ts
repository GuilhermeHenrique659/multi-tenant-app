import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import TenantCriteria from "../repository/TenantCriteria.js";
import TenantRepository from "../repository/TenantRepository.js";

export default class RemoveMember implements AuthorizerApplicationService<Input, Output> {
    constructor (private readonly _tenantRepository: TenantRepository) {}

    public async execute(input: Input): Promise<Output> {
        const tenant = await this._tenantRepository.get(new TenantCriteria().id(input.tenantId));

        if (!tenant) throw new Error("Tenant não encontrado");

        tenant.removeMember(input.memberUserId);

        await this._tenantRepository.save(tenant);

        return { tenantId: tenant.id, userId: input.memberUserId };
    }
}

type Input = AuthorizedInput & {
    memberUserId: string;
}

type Output = {
    tenantId: string;
    userId: string;
}
