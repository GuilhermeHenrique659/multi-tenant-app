import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { envOr, numberEnv, optionalEnv, requiredEnv } from './Env.js';

describe('Env', () => {
    const source = { FILLED: 'value', SPACED: '  value  ', EMPTY: '   ', NUMERIC: '42', NOT_NUMERIC: 'abc' };

    describe('optionalEnv', () => {
        it('trims the value', () => {
            assert.equal(optionalEnv('SPACED', source), 'value');
        });

        it('treats a blank value as absent', () => {
            assert.equal(optionalEnv('EMPTY', source), undefined);
            assert.equal(optionalEnv('MISSING', source), undefined);
        });
    });

    describe('requiredEnv', () => {
        it('returns the value when it is there', () => {
            assert.equal(requiredEnv('FILLED', source), 'value');
        });

        it('fails naming the variable when it is missing or blank', () => {
            assert.throws(() => requiredEnv('MISSING', source), /MISSING is required/);
            assert.throws(() => requiredEnv('EMPTY', source), /EMPTY is required/);
        });
    });

    describe('envOr', () => {
        it('falls back only when the variable is absent', () => {
            assert.equal(envOr('FILLED', 'fallback', source), 'value');
            assert.equal(envOr('MISSING', 'fallback', source), 'fallback');
        });
    });

    describe('numberEnv', () => {
        it('parses the value and falls back when absent', () => {
            assert.equal(numberEnv('NUMERIC', 1, source), 42);
            assert.equal(numberEnv('MISSING', 1, source), 1);
        });

        it('fails when the value is not a number', () => {
            assert.throws(() => numberEnv('NOT_NUMERIC', 1, source), /must be a number/);
        });
    });
});
