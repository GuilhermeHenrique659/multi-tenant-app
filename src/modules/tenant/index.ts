export type TenantData = {
    id: string;
    name: string;
    maxNumberOfMembers: number;
    members: {
        user: {
            id: string;
            name: string;
        };
        role: string;
    }[];
}

type TenantMember = {
    userId: string | undefined;
    name: string;
    email: string;
    role: string;
}

export type AddMemberInput = {
    tenantId: string;
} & TenantMember;

export type AddmemberOutput = {
    tenantId: string;
    userId: string;
}

export type CreateTenantInput = {
    name: string;
    subdomain: string;
    maxNumberOfMembers: number;
    admin: TenantMember
}

export type CreateTenantOutput = {
    tenantId: string;
}