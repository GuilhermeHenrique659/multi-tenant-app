import type TenantGateway from "../../gateway/tenant/TenantGateway";
import type UserGateway from "../../gateway/user/UserGateway";
import * as TenantMod from '../../model/Tenant';
import * as UserMod from '../../model/User';

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

const GetUser = (dependencies: AddMemberDependencies) => async (user: AddMemberInput['member']['user']): Promise<UserMod.User> => {
    if (user.id) return UserMod.Create(user);

    const existingUser = await dependencies.userGateway.getByName(user.name);

    if (existingUser) return existingUser;

    return UserMod.Create({ name: user.name, email: user.email });
}

export const AddMember = (dependencies: AddMemberDependencies) => async (input: AddMemberInput): Promise<TenantMod.Tenant | Error> => {
    try {
        const user = await GetUser(dependencies)(input.member.user);

        const updated = TenantMod.AddUser(input.tenant, user, input.member.role);
        
        await dependencies.tenantGateway.addUser(updated.props.id, user, input.member.role);

        const tenant = await dependencies.tenantGateway.getById(input.tenant.props.id);

        if (!tenant) return updated;

        return tenant;
    } catch (err) {
        if (err instanceof Error) return err;

        return new Error('unknown error')
    }
}