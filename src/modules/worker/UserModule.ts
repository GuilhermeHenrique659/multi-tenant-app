import AuthorizerApplicationService, { AuthorizedInput } from "../@common/AuthorizerApplicationService.js";

export const WorkerUserModuleKey = "WorkerUserModule";

export interface WorkerUserModule {
    authorizer<I extends AuthorizedInput, O>(service: AuthorizerApplicationService<I, O>, permissions: Array<string>): AuthorizerApplicationService<I, O>;
}
