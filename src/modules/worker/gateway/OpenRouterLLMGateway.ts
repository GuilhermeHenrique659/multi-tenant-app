import elapsedSince from "../../@common/elapsedSince.js";
import Logger from "../../@common/Logger.js";
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

        // The json schema names each call (`worker_plan`, `step_input`, ...), so the logs
        // say which part of the run is waiting on the provider.
        const call = request.jsonSchema?.name || 'chat';
        const model = request.model || this.config.model;
        const startedAt = performance.now();

        Logger.info(`LLM ${call} -> ${model}: requesting (${this._promptSize(request)} prompt chars)`);

        try {
            const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: this._headers(),
                body: JSON.stringify(this._body(request)),
            });

            if (!response.ok) {
                const body = await response.text();

                Logger.error(`LLM ${call} -> ${model}: failed with ${response.status} in ${elapsedSince(startedAt)}ms: ${body}`);

                return Err(`OpenRouter error ${response.status}: ${body}`);
            }

            result = await response.json() as OpenRouterResult;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('OpenRouter request failed');

            Logger.error(`LLM ${call} -> ${model}: transport failed in ${elapsedSince(startedAt)}ms: ${error.message}`);

            return Err(error);
        }

        const elapsed = elapsedSince(startedAt);
        const content = result.choices?.[0]?.message?.content;

        if (!content) {
            Logger.error(`LLM ${call} -> ${model}: answered without content in ${elapsed}ms`);

            return Err('OpenRouter returned no content');
        }

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

        const usage = llmResponse.usage
            ? `${llmResponse.usage.promptTokens} prompt + ${llmResponse.usage.completionTokens} completion tokens`
            : 'usage not reported';

        Logger.info(`LLM ${call} -> ${llmResponse.model}: answered in ${elapsed}ms (${usage})`);

        return Ok(llmResponse);
    }

    private _promptSize(request: LLMRequest): number {
        return request.messages.reduce((total, message) => total + message.content.length, 0);
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
