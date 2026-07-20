import SuperAdminAuthorizerApplicationService, { SuperAdminInput } from "../../@common/SuperAdminAuthorizerApplicationService.js";
import UserQuery from "../query/UserQuery.js";

export default class SuperAdminAuthorizerDecorator<I extends SuperAdminInput, O> implements SuperAdminAuthorizerApplicationService<I, O> {
    constructor(
        private readonly _inner: SuperAdminAuthorizerApplicationService<I, O>,
        private readonly _userQuery: UserQuery,
    ) {}

    async execute(input: I): Promise<O> {
        const user = await this._userQuery.getById(input.userId);
        if (!user?.isSuperAdmin) throw new Error('Forbidden');

        return this._inner.execute(input);
    }
}
