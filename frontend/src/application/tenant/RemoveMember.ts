import type TenantGateway from "../../gateway/tenant/TenantGateway";
import * as TenantMod from '../../model/Tenant';
import { Result } from "../../util/Result";

type RemoveMemberDependencies = {
    tenantGateway: TenantGateway,
}

type RemoveMemberInput = {
    tenant: TenantMod.Tenant;
    userId: string;
}

export const RemoveMember = (dependencies: RemoveMemberDependencies) => async (input: RemoveMemberInput): Promise<Result<TenantMod.Tenant, Error>> => {
    const member = input.tenant.members.find(m => m.user.id === input.userId);
    if (!member) return Result.Error(new Error('User is not in this tenant'));

    if (member.role === 'admin') {
        const adminCount = input.tenant.members.filter(m => m.role === 'admin').length;
        if (adminCount <= 1) return Result.Error(new Error('Tenant must have at least one admin'));
    }

    const updatedResult = TenantMod.RemoveUser(input.tenant, input.userId);

    if (updatedResult.isErr()) return Result.Error(updatedResult.error);

    const removeUserResult = await dependencies.tenantGateway.removeUser(input.tenant.props.id, { props: { id: input.userId, name: '', email: '' } });

    if (removeUserResult.isErr()) return Result.Error(removeUserResult.error);

    const tenantResult = await dependencies.tenantGateway.getById(input.tenant.props.id);

    if (tenantResult.isErr()) return Result.Error(tenantResult.error);

    return tenantResult;
}