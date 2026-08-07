import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import OpenRouterLLMGateway from './OpenRouterLLMGateway.js';
import { OpenRouterConfig } from './openRouterConfig.js';

describe('OpenRouterLLMGateway', () => {
    const config: OpenRouterConfig = {
        apiKey: 'key-1',
        model: 'default-model',
        baseUrl: 'https://openrouter.test/api/v1',
    };

    const originalFetch = globalThis.fetch;

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    type Call = { url: string; init: any };

    function stubFetch(response: { ok?: boolean; status?: number; body?: any; text?: string }) {
        const calls: Call[] = [];

        globalThis.fetch = (async (url: any, init: any) => {
            calls.push({ url: String(url), init });

            return {
                ok: response.ok ?? true,
                status: response.status ?? 200,
                json: async () => response.body,
                text: async () => response.text ?? '',
            };
        }) as unknown as typeof fetch;

        return calls;
    }

    it('posts the chat completion and maps the answer', async () => {
        const calls = stubFetch({
            body: {
                model: 'used-model',
                choices: [{ message: { content: '{"input":{}}' } }],
                usage: { prompt_tokens: 12, completion_tokens: 3 },
            },
        });

        const response = await new OpenRouterLLMGateway(config).chat({
            messages: [{ role: 'user', content: 'hi' }],
            temperature: 0.2,
            maxTokens: 500,
        });

        assert.deepEqual(response, {
            content: '{"input":{}}',
            model: 'used-model',
            usage: { promptTokens: 12, completionTokens: 3 },
            raw: {
                model: 'used-model',
                choices: [{ message: { content: '{"input":{}}' } }],
                usage: { prompt_tokens: 12, completion_tokens: 3 },
            },
        });

        assert.equal(calls[0]!.url, 'https://openrouter.test/api/v1/chat/completions');
        assert.equal(calls[0]!.init.method, 'POST');
        assert.equal(calls[0]!.init.headers['Authorization'], 'Bearer key-1');
        assert.equal(calls[0]!.init.headers['HTTP-Referer'], undefined);
        assert.equal(calls[0]!.init.headers['X-Title'], undefined);

        const body = JSON.parse(calls[0]!.init.body);
        assert.equal(body.model, 'default-model');
        assert.equal(body.temperature, 0.2);
        assert.equal(body.max_tokens, 500);
        assert.equal(body.response_format, undefined);
    });

    it('translates the json schema into a response format', async () => {
        const calls = stubFetch({ body: { choices: [{ message: { content: '{}' } }] } });

        await new OpenRouterLLMGateway(config).chat({
            messages: [{ role: 'user', content: 'hi' }],
            model: 'other-model',
            jsonSchema: { name: 'step_input', schema: { type: 'object' } },
        });

        const body = JSON.parse(calls[0]!.init.body);
        assert.equal(body.model, 'other-model');
        assert.deepEqual(body.response_format, {
            type: 'json_schema',
            json_schema: { name: 'step_input', schema: { type: 'object' } },
        });
    });

    it('sends the attribution headers when they are configured', async () => {
        const calls = stubFetch({ body: { choices: [{ message: { content: '{}' } }] } });

        await new OpenRouterLLMGateway({ ...config, appUrl: 'http://localhost:3000', appTitle: 'Worker' })
            .chat({ messages: [{ role: 'user', content: 'hi' }] });

        assert.equal(calls[0]!.init.headers['HTTP-Referer'], 'http://localhost:3000');
        assert.equal(calls[0]!.init.headers['X-Title'], 'Worker');
    });

    it('fails with the status and the body when the request is rejected', async () => {
        stubFetch({ ok: false, status: 401, text: 'no credits' });

        await assert.rejects(
            () => new OpenRouterLLMGateway(config).chat({ messages: [{ role: 'user', content: 'hi' }] }),
            /OpenRouter error 401: no credits/,
        );
    });

    it('fails when the answer has no content', async () => {
        stubFetch({ body: { choices: [] } });

        await assert.rejects(
            () => new OpenRouterLLMGateway(config).chat({ messages: [{ role: 'user', content: 'hi' }] }),
            /returned no content/,
        );
    });
});
