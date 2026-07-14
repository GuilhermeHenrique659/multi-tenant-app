import AuthorizerApplicationService, { AuthorizedInput } from "../@common/AuthorizerApplicationService.js";
import { UserTask } from "./domain/UserTask.js";

export interface UserModule {
    getUser(userId: string, tenantId: string): Promise<UserTask | null>;
    authorizer<I extends AuthorizedInput, O>(service: AuthorizerApplicationService<I, O>, permissions: Array<string>): AuthorizerApplicationService<I, O>
}