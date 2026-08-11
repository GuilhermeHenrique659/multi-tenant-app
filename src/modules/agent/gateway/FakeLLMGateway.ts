import { Err, Ok, TupleResult } from "../../@common/TupleResult.js";
import LLMGateway, { LLMRequest, LLMResponse } from "./LLMGateway.js";

export default class FakeLLMGateway implements LLMGateway {
    private readonly _requests: LLMRequest[] = [];

    /** Each answer is either the raw content of the response or the failure to return. */
    constructor(private readonly responses: Array<string | Error> = [], private readonly model: string = 'fake-model') { }

    get requests(): LLMRequest[] {
        return this._requests;
    }

    get lastRequest(): LLMRequest | undefined {
        return this._requests.at(-1);
    }

    async chat(request: LLMRequest): Promise<TupleResult<LLMResponse>> {
        this._requests.push(request);

        const content = this.responses.shift();

        if (content === undefined) return Err('FakeLLMGateway has no response left');

        if (content instanceof Error) return Err(content);

        return Ok({
            content,
            model: request.model || this.model,
            raw: { content },
        });
    }
}
