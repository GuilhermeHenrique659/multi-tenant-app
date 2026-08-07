import { TupleResult } from "../../@common/TupleResult.js";

export type LLMMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};

export type LLMJsonSchema = {
    name: string;
    schema: object;
};

export type LLMRequest = {
    messages: LLMMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    jsonSchema?: LLMJsonSchema;
};

export type LLMUsage = {
    promptTokens: number;
    completionTokens: number;
};

export type LLMResponse = {
    content: string;
    model: string;
    usage?: LLMUsage;
    raw: unknown;
};

export default interface LLMGateway {
    /** Never throws: a provider or transport failure comes back as `[error, null]`. */
    chat(request: LLMRequest): Promise<TupleResult<LLMResponse>>;
}
