import AuthorizerApplicationService from "../../@common/AuthorizerApplicationService.js";
import UserQuery from "../query/UserQuery.js";
import { Permissions } from "../../@common/Permissions.js";

export default class UserAuthorizer<O> implements AuthorizerApplicationService<Input, O> {
    constructor(private readonly _permissions: Array<string>,
        private readonly _app: AuthorizerApplicationService<Input, O>,
        private readonly _userQuery: UserQuery,
    ) { }

    public async execute(input: Input): Promise<O> {
        const userRole = await this._userQuery.getUserRoleByTenantIdAndUserId(input.tenantId, input.userId);

        if (!userRole) throw new Error('resource forbidden');

        const hasPermissions = this._permissions.every(permission => {
            const allowedRoles = Permissions.get(permission);
            return allowedRoles?.includes(userRole!) || false;
        });
        
        if (!hasPermissions) throw new Error('resource forbidden');

        return this._app.execute(input);
    }
}

type Input = {
    userId: string;
    tenantId: string;
}