import TenantQuery from "../query/TenantQuery.js";
import { TenantUserModule } from "../UserModule.js";
import type { TenantListItem } from "../index.js";

export default class ListTenants {
    constructor(
        private readonly _tenantQuery: TenantQuery,
        private readonly _userModule: TenantUserModule,
    ) { }

    async execute(input: { userId: string }): Promise<TenantListItem[]> {
        const tenants = await this._tenantQuery.getAllTenants();

        const isSuper = await this._userModule.isSuperAdmin(input.userId);
        if (isSuper) return tenants;

        const tenantsToShow: TenantListItem[] = [];
        for (const tenant of tenants) {
            const hasPermission = await this._userModule.hasPermissions(input.userId, tenant.id, ['tenant:details:view']);
            if (hasPermission) tenantsToShow.push(tenant);
        }
        return tenantsToShow;
    }
}
