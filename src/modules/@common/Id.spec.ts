import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Id from './Id.js';

describe('Id', () => {
    it('creates an Id with a provided value', () => {
        const id = new Id('abc-123');
        assert.equal(id.value, 'abc-123');
    });

    it('creates an Id with a random UUID via static create', () => {
        const id = Id.create();
        assert.ok(id.value);
        assert.match(id.value, /^[0-9a-f-]+$/);
    });

    it('creates an Id with a custom value via static create', () => {
        const id = Id.create('custom-id');
        assert.equal(id.value, 'custom-id');
    });

    it('generates unique values', () => {
        const id1 = Id.create();
        const id2 = Id.create();
        assert.notEqual(id1.value, id2.value);
    });
});
