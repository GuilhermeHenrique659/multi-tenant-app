export type TenantData = {
    id: string;
    name: string;
    maxNumberOfMembers: number;
    createdAt: Date;
    members: {
        user: {
            id: string;
            name: string;
        };
        role: string;
    }[];
}

export type TenantListItem = {
    id: string;
    name: string;
    subdomain: string;
    maxNumberOfMembers: number;
    createdAt: Date;
    memberCount: number;
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