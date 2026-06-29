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
    const updatedResult = TenantMod.RemoveUser(input.tenant, input.userId);

    if (updatedResult.isErr()) {
        return Result.Error(updatedResult.error);
    }

    const removeUserResult = await dependencies.tenantGateway.removeUser(input.tenant.props.id, { props: { id: input.userId, name: '', email: '' } });

    if (removeUserResult.isErr()) {
        return Result.Error(removeUserResult.error);
    }

    const tenantResult = await dependencies.tenantGateway.getById(input.tenant.props.id);

    if (tenantResult.isErr()) {
        return Result.Error(tenantResult.error);
    }

    if (!tenantResult.value) return Result.Ok(updatedResult.value);

    return Result.Ok(tenantResult.value);
}