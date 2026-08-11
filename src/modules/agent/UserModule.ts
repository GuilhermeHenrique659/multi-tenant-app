import AuthorizerApplicationService, { AuthorizedInput } from "../@common/AuthorizerApplicationService.js";

export const AgentUserModuleKey = "AgentUserModule";

export interface AgentUserModule {
    authorizer<I extends AuthorizedInput, O>(service: AuthorizerApplicationService<I, O>, permissions: Array<string>): AuthorizerApplicationService<I, O>;
}
