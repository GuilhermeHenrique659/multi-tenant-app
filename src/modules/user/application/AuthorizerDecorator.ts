import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import UserQuery from "../query/UserQuery.js";
import { Permissions } from "../../@common/Permissions.js";

export default class AuthorizerDecorator<I extends AuthorizedInput, O> implements AuthorizerApplicationService<I, O> {
    constructor(
        private readonly _inner: AuthorizerApplicationService<I, O>,
        private readonly _permissions: Array<string>,
        private readonly _userQuery: UserQuery,
    ) {}

    async execute(input: I): Promise<O> {
        const userRole = await this._userQuery.getUserRoleByTenantIdAndUserId(input.tenantId, input.userId);
        if (!userRole) throw new Error('Forbidden');

        const hasPermissions = this._permissions.every(permission => {
            const allowedRoles = Permissions.get(permission);
            return allowedRoles?.includes(userRole) || false;
        });

        if (!hasPermissions) throw new Error('Forbidden');

        return this._inner.execute(input);
    }
}
