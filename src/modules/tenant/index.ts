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

export type CreateTenantInput = {
    name: string;
    subdomain: string;
    maxNumberOfMembers: number;
    admin: TenantMember
}

export type CreateTenantOutput = {
    tenantId: string;
}

export interface TenantModule {
    createTenant(input: CreateTenantInput): Promise<CreateTenantOutput>;
    addMember(input: AddMemberInput): Promise<AddMemberInput>;
    removeMember(tenantId: string, userId: string): Promise<void>;
    updateMember(tenantId: string, userId: string, role: string): Promise<void>;
    list(): Promise<Omit<TenantData, 'members'>[]>;
    getById(tenantId: string): Promise<TenantData | null>;
    getUserRole(tenantId: string, userId: string): Promise<string | null>;
}