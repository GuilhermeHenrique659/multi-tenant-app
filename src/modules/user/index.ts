export type RemoveUserInput = {
    id: string;
} | {
    email: string;
}

export type CreateUserInput = {
    name: string;
    email: string;
}

export type CheckInInput = CreateUserInput &{
    userId: string | undefined;
}

export type CheckInOutput = {
    userId: string;
}

export type LoginInput = { 
    email: string;
}

export type LoginOutput = {
    userId: string;
    name: string;
    isSuperAdmin: boolean;
}

export interface UserModule {
    checkInUser(input: CheckInInput): Promise<CheckInOutput>;
    removeUser(input: RemoveUserInput): Promise<void>;
    createSuperUser(input: CreateUserInput): Promise<void>;
    login(input: LoginInput): Promise<LoginOutput>;
    hasPermissions(userId: string, tenantId: string, permission: Array<string>): Promise<boolean>;
}