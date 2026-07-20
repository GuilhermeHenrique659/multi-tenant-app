import AuthorizerApplicationService, { AuthorizedInput } from "../@common/AuthorizerApplicationService.js";
import SuperAdminAuthorizerApplicationService, { SuperAdminInput } from "../@common/SuperAdminAuthorizerApplicationService.js";

export const TenantUserModuleKey = "TenantUserModule";

export interface TenantUserModule {
    authorizer<I extends AuthorizedInput, O>(service: AuthorizerApplicationService<I, O>, permissions: Array<string>): AuthorizerApplicationService<I, O>;
    superAdminAuthorizer<I extends SuperAdminInput, O>(service: SuperAdminAuthorizerApplicationService<I, O>): SuperAdminAuthorizerApplicationService<I, O>;
    hasPermissions(userId: string, tenantId: string, permissions: Array<string>): Promise<boolean>;
    isSuperAdmin(userId: string): Promise<boolean>;
}
