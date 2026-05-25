export type CheckInInput = {
    userId: string | undefined;
    name: string;
    email: string;
}

export type CheckInOutput = {
    userId: string;
}

export interface UserModule {
    checkInUser(input: CheckInInput): Promise<CheckInOutput>;
}
