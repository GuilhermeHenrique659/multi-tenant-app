import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";

export default class UpdateTask implements AuthorizerApplicationService<Input, Output> {
    public async execute(input: Input): Promise<Output> {
        return { taskId: input.id }
    }
}

type Input = AuthorizedInput & {
    id: string;
    name?: string;
    startAt?: string;
    endAt?: string;
    status?: string;
};

type Output = {
    taskId: string;
}