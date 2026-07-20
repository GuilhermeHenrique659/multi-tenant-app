import AuthorizerApplicationService, { AuthorizedInput } from "../@common/AuthorizerApplicationService.js";
import { UserTask } from "./domain/UserTask.js";

export const ProjectUserModuleKey = "ProjectUserModule";

export interface ProjectUserModule {
    getUser(userId: string, tenantId: string): Promise<UserTask | null>;
    authorizer<I extends AuthorizedInput, O>(service: AuthorizerApplicationService<I, O>, permissions: Array<string>): AuthorizerApplicationService<I, O>
}

export type { UserTask };