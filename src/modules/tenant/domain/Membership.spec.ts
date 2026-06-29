import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Membership, { Role } from './Membership.js';
import Id from '../../@common/Id.js';

describe('Role', () => {
    it('creates a valid admin role', () => {
        const role = new Role('admin');
        assert.equal(role.value, 'admin');
    });

    it('creates a valid member role', () => {
        const role = new Role('member');
        assert.equal(role.value, 'member');
    });

    it('throws for invalid role', () => {
        assert.throws(() => new Role('owner'), /Invalid role/);
    });

    it('throws for empty string role', () => {
        assert.throws(() => new Role(''), /Invalid role/);
    });
});

describe('Membership', () => {
    const userId = 'user-1';
    const tenantId = 'tenant-1';

    it('creates a membership with static factory', () => {
        const membership = Membership.create(userId, tenantId, 'admin');
        assert.equal(membership.userId.value, userId);
        assert.equal(membership.role.value, 'admin');
    });

    it('checks ownership by userId', () => {
        const membership = Membership.create(userId, tenantId, 'member');
        assert.ok(membership.hasUserId(userId));
        assert.ok(!membership.hasUserId('other-user'));
    });

    it('changes role', () => {
        const membership = Membership.create(userId, tenantId, 'member');
        membership.changeRole('admin');
        assert.equal(membership.role.value, 'admin');
    });

    it('throws when changing to invalid role', () => {
        const membership = Membership.create(userId, tenantId, 'member');
        assert.throws(() => membership.changeRole('invalid'), /Invalid role/);
    });
});
