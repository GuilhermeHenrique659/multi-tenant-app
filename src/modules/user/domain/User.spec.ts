import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import User from './User.js';

describe('User', () => {
    it('creates a regular user with static factory', () => {
        const user = User.create('John Doe', 'john@example.com');
        assert.ok(user.id);
        assert.equal(user.name, 'John Doe');
        assert.equal(user.email, 'john@example.com');
        assert.ok(!user.isActive);
        assert.ok(!user.isSuperAdmin);
        assert.ok(user.createdAt instanceof Date);
    });

    it('creates a super admin user', () => {
        const user = User.createAsSuperAdmin('Admin', 'admin@example.com');
        assert.ok(user.isSuperAdmin);
        assert.ok(!user.isActive);
    });

    it('activates a user', () => {
        const user = User.create('Test', 'test@example.com');
        assert.ok(!user.isActive);
        user.active();
        assert.ok(user.isActive);
    });

    it('generates different ids for different users', () => {
        const user1 = User.create('A', 'a@example.com');
        const user2 = User.create('B', 'b@example.com');
        assert.notEqual(user1.id, user2.id);
    });
});
