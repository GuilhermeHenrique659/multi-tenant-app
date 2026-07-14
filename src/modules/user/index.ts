export type RemoveUserInput = {
    id: string;
} | {
    email: string;
}

export type CreateUserInput = {
    name: string;
    email: string;
}

export type CheckInInput = CreateUserInput & {
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

export type GetUserCriteria = {
    term: Record<'userId' | 'name', string>;
    includes: string[];
    query?: { tenantId?: string };
}