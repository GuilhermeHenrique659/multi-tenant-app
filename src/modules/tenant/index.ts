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

export type AddMemberInput = {
    tenantId: string;
    userId: string;
    targetUserId?: string | undefined;
    name: string;
    email: string;
    role: string;
}

export type AddmemberOutput = {
    tenantId: string;
    userId: string;
}

export type CreateTenantInput = {
    userId: string;
    name: string;
    subdomain: string;
    maxNumberOfMembers: number;
    admin: {
        userId: string | undefined;
        name: string;
        email: string;
    }
}

export type CreateTenantOutput = {
    tenantId: string;
}
