export type SuperAdminInput = {
    userId: string;
}

export default interface SuperAdminAuthorizerApplicationService<I extends SuperAdminInput, O> {
    execute(input: I): Promise<O>
}
