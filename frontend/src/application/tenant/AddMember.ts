import type TenantGateway from "../../gateway/tenant/TenantGateway";
import type UserGateway from "../../gateway/user/UserGateway";
import * as TenantMod from '../../model/Tenant';
import * as UserMod from '../../model/User';
import { Result, unwrapOr } from "../../util/Result";

type AddMemberDependencies = {
    tenantGateway: TenantGateway,
    userGateway: UserGateway
}

type AddMemberInput = {
    member: {
        user: { id?: string; name: string, email: string };
        role: string;
    };
    tenant: TenantMod.Tenant;
}

const GetUser = (dependencies: AddMemberDependencies) => async (user: AddMemberInput['member']['user']): Promise<Result<UserMod.User, Error>> => {
    if (user.id) return Result.Ok(UserMod.Create(user));

    const result = await dependencies.userGateway.getByName(user.name);

    if (result.isOk()) {
        return Result.Ok(result.value);
    }

    return Result.Ok(UserMod.Create({ name: user.name, email: user.email }));
}

export const AddMember = (dependencies: AddMemberDependencies) => async (input: AddMemberInput): Promise<Result<TenantMod.Tenant, Error>> => {
    const userResult = await GetUser(dependencies)(input.member.user);

    if (userResult.isErr()) return Result.Error(userResult.error);

    const user = userResult.unwrap();

    const updatedResult = TenantMod.AddUser(input.tenant, user, input.member.role);

    if (updatedResult.isErr()) return Result.Error(updatedResult.error);

    const addUserResult = await dependencies.tenantGateway.addUser(updatedResult.unwrap().props.id, user, input.member.role);

    if (addUserResult.isErr()) return Result.Error(addUserResult.error);


    const tenantUpdated = await dependencies.tenantGateway.getById(input.tenant.props.id).then(unwrapOr(updatedResult.unwrap()));

    return Result.Ok(tenantUpdated);
}