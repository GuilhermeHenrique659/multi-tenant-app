import LLMGateway, { LLMRequest, LLMResponse } from "./LLMGateway.js";

export default class FakeLLMGateway implements LLMGateway {
    private readonly _requests: LLMRequest[] = [];

    constructor(private readonly responses: string[] = [], private readonly model: string = 'fake-model') { }

    get requests(): LLMRequest[] {
        return this._requests;
    }

    get lastRequest(): LLMRequest | undefined {
        return this._requests.at(-1);
    }

    async chat(request: LLMRequest): Promise<LLMResponse> {
        this._requests.push(request);

        const content = this.responses.shift();

        if (content === undefined) throw new Error('FakeLLMGateway has no response left');

        return {
            content,
            model: request.model || this.model,
            raw: { content },
        };
    }
}
