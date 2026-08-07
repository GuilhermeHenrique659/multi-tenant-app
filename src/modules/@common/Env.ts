import 'dotenv/config';

type EnvSource = Record<string, string | undefined>;

/**
 * Single place that talks to the environment: every config reads through here,
 * so a missing or empty variable fails with the same message everywhere.
 */
export function optionalEnv(key: string, source: EnvSource = process.env): string | undefined {
    const value = source[key];

    if (value === undefined) return undefined;

    const trimmed = value.trim();

    return trimmed === '' ? undefined : trimmed;
}

export function requiredEnv(key: string, source: EnvSource = process.env): string {
    const value = optionalEnv(key, source);

    if (value === undefined) throw new Error(`Environment variable ${key} is required`);

    return value;
}

export function envOr(key: string, fallback: string, source: EnvSource = process.env): string {
    return optionalEnv(key, source) ?? fallback;
}

export function numberEnv(key: string, fallback: number, source: EnvSource = process.env): number {
    const value = optionalEnv(key, source);

    if (value === undefined) return fallback;

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) throw new Error(`Environment variable ${key} must be a number, got "${value}"`);

    return parsed;
}
