export default interface AuthorizerApplicationService<I extends Input, O> {
    execute(input: I): Promise<O>
}

type Input = {
    userId: string;
    tenantId: string;
}