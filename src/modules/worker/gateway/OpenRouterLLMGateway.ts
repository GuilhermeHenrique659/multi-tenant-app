import { Err, Ok, TupleResult } from "../../@common/TupleResult.js";
import LLMGateway, { LLMRequest, LLMResponse } from "./LLMGateway.js";
import { OpenRouterConfig } from "./openRouterConfig.js";

type OpenRouterBody = {
    model: string;
    messages: LLMRequest['messages'];
    temperature?: number;
    max_tokens?: number;
    response_format?: {
        type: 'json_schema';
        json_schema: { name: string; schema: object };
    };
};

type OpenRouterResult = {
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
};

export default class OpenRouterLLMGateway implements LLMGateway {
    constructor(private readonly config: OpenRouterConfig) { }

    public async chat(request: LLMRequest): Promise<TupleResult<LLMResponse>> {
        let result: OpenRouterResult;

        try {
            const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: this._headers(),
                body: JSON.stringify(this._body(request)),
            });

            if (!response.ok) {
                return Err(`OpenRouter error ${response.status}: ${await response.text()}`);
            }

            result = await response.json() as OpenRouterResult;
        } catch (err) {
            return Err(err instanceof Error ? err : new Error('OpenRouter request failed'));
        }

        const content = result.choices?.[0]?.message?.content;

        if (!content) return Err('OpenRouter returned no content');

        const llmResponse: LLMResponse = {
            content,
            model: result.model || request.model || this.config.model,
            raw: result,
        };

        if (result.usage) {
            llmResponse.usage = {
                promptTokens: result.usage.prompt_tokens ?? 0,
                completionTokens: result.usage.completion_tokens ?? 0,
            };
        }

        return Ok(llmResponse);
    }

    private _headers(): Record<string, string> {
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
        };

        if (this.config.appUrl) headers['HTTP-Referer'] = this.config.appUrl;
        if (this.config.appTitle) headers['X-Title'] = this.config.appTitle;

        return headers;
    }

    private _body(request: LLMRequest): OpenRouterBody {
        const body: OpenRouterBody = {
            model: request.model || this.config.model,
            messages: request.messages,
        };

        if (request.temperature !== undefined) body.temperature = request.temperature;
        if (request.maxTokens !== undefined) body.max_tokens = request.maxTokens;

        if (request.jsonSchema) {
            // no `strict: true`: some capability inputs have optional fields, which strict mode rejects.
            body.response_format = {
                type: 'json_schema',
                json_schema: {
                    name: request.jsonSchema.name,
                    schema: request.jsonSchema.schema,
                },
            };
        }

        return body;
    }
}
