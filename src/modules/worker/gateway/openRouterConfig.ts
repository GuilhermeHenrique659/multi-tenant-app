import { envOr, optionalEnv, requiredEnv } from "../../@common/Env.js";

export type OpenRouterConfig = {
    apiKey: string;
    model: string;
    baseUrl: string;
    appUrl?: string;
    appTitle?: string;
};

export default function loadOpenRouterConfig(): OpenRouterConfig {
    const config: OpenRouterConfig = {
        apiKey: requiredEnv('OPENROUTER_API_KEY'),
        model: requiredEnv('OPENROUTER_MODEL'),
        baseUrl: envOr('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
    };

    const appUrl = optionalEnv('OPENROUTER_APP_URL');
    const appTitle = optionalEnv('OPENROUTER_APP_TITLE');

    if (appUrl) config.appUrl = appUrl;
    if (appTitle) config.appTitle = appTitle;

    return config;
}
