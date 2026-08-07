import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import loadOpenRouterConfig from './openRouterConfig.js';

describe('loadOpenRouterConfig', () => {
    const keys = ['OPENROUTER_API_KEY', 'OPENROUTER_MODEL', 'OPENROUTER_BASE_URL', 'OPENROUTER_APP_URL', 'OPENROUTER_APP_TITLE'];
    const original = new Map<string, string | undefined>();

    beforeEach(() => {
        keys.forEach(key => {
            original.set(key, process.env[key]);
            delete process.env[key];
        });
    });

    afterEach(() => {
        keys.forEach(key => {
            const value = original.get(key);
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        });
    });

    it('defaults the base url and leaves the attribution out when it is not set', () => {
        process.env.OPENROUTER_API_KEY = 'key-1';
        process.env.OPENROUTER_MODEL = 'model-1';

        assert.deepEqual(loadOpenRouterConfig(), {
            apiKey: 'key-1',
            model: 'model-1',
            baseUrl: 'https://openrouter.ai/api/v1',
        });
    });

    it('reads the base url and the attribution when they are set', () => {
        process.env.OPENROUTER_API_KEY = 'key-1';
        process.env.OPENROUTER_MODEL = 'model-1';
        process.env.OPENROUTER_BASE_URL = 'https://openrouter.test/api/v1';
        process.env.OPENROUTER_APP_URL = 'http://localhost:3000';
        process.env.OPENROUTER_APP_TITLE = 'Worker';

        assert.deepEqual(loadOpenRouterConfig(), {
            apiKey: 'key-1',
            model: 'model-1',
            baseUrl: 'https://openrouter.test/api/v1',
            appUrl: 'http://localhost:3000',
            appTitle: 'Worker',
        });
    });

    it('fails when the key or the model is missing', () => {
        assert.throws(() => loadOpenRouterConfig(), /OPENROUTER_API_KEY is required/);

        process.env.OPENROUTER_API_KEY = 'key-1';

        assert.throws(() => loadOpenRouterConfig(), /OPENROUTER_MODEL is required/);
    });
});
