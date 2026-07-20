import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import TenantQuery from "../query/TenantQuery.js";
import type { TenantData } from "../index.js";

export default class GetTenantById implements AuthorizerApplicationService<AuthorizedInput, TenantData> {
    constructor(private readonly _tenantQuery: TenantQuery) { }

    async execute(input: AuthorizedInput): Promise<TenantData> {
        const tenantData = await this._tenantQuery.getTenantDataById(input.tenantId);
        if (!tenantData) throw new Error("Tenant não encontrado");
        return tenantData;
    }
}
