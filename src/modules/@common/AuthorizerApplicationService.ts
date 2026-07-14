export default interface AuthorizerApplicationService<I extends AuthorizedInput, O> {
    execute(input: I): Promise<O>
}

export type AuthorizedInput = {
    userId: string;
    tenantId: string;
}