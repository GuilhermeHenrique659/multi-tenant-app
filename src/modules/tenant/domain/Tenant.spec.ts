import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Tenant from './Tenant.js';
import { Role } from './Membership.js';

describe('Tenant', () => {
    it('creates a tenant with default max members', () => {
        const tenant = Tenant.create('My Corp', 'my-corp');
        assert.ok(tenant.id);
        assert.equal(tenant.name, 'My Corp');
        assert.equal(tenant.subdomain, 'my-corp');
        assert.equal(tenant.maxNumberOfMembers, 5);
        assert.equal(tenant.memberships.length, 0);
        assert.ok(tenant.createdAt instanceof Date);
    });

    it('creates a tenant with custom max members', () => {
        const tenant = Tenant.create('Big Corp', 'big-corp', 10);
        assert.equal(tenant.maxNumberOfMembers, 10);
    });

    it('adds a new member', () => {
        const tenant = Tenant.create('Test', 'test', 3);
        tenant.addNewMember('user-1', 'admin');
        assert.equal(tenant.memberships.length, 1);
        assert.ok(tenant.memberships.some(m => m.hasUserId('user-1')));
    });

    it('throws when adding a duplicate member', () => {
        const tenant = Tenant.create('Test', 'test', 3);
        tenant.addNewMember('user-1', 'admin');
        assert.throws(
            () => tenant.addNewMember('user-1', 'member'),
            /already a member/,
        );
    });

    it('throws when exceeding max members', () => {
        const tenant = Tenant.create('Test', 'test', 2);
        tenant.addNewMember('user-1', 'admin');
        tenant.addNewMember('user-2', 'member');
        assert.throws(
            () => tenant.addNewMember('user-3', 'member'),
            /maximum number of members/,
        );
    });

    it('removes a member', () => {
        const tenant = Tenant.create('Test', 'test', 5);
        tenant.addNewMember('user-1', 'admin');
        tenant.addNewMember('user-2', 'member');
        tenant.removeMember('user-2');
        assert.equal(tenant.memberships.length, 1);
        assert.ok(!tenant.memberships.some(m => m.hasUserId('user-2')));
    });

    it('throws when removing a non-member', () => {
        const tenant = Tenant.create('Test', 'test', 5);
        assert.throws(
            () => tenant.removeMember('nonexistent'),
            /not a member/,
        );
    });

    it('throws when removing the last admin', () => {
        const tenant = Tenant.create('Test', 'test', 5);
        tenant.addNewMember('user-1', 'admin');
        assert.throws(
            () => tenant.removeMember('user-1'),
            /at least one admin/,
        );
    });

    it('allows removing an admin when another admin exists', () => {
        const tenant = Tenant.create('Test', 'test', 5);
        tenant.addNewMember('user-1', 'admin');
        tenant.addNewMember('user-2', 'admin');
        tenant.removeMember('user-1');
        assert.equal(tenant.memberships.length, 1);
    });

    it('changes a member role', () => {
        const tenant = Tenant.create('Test', 'test', 5);
        tenant.addNewMember('user-1', 'member');
        tenant.changeMemberRole('user-1', 'admin');
        const member = tenant.memberships.find(m => m.hasUserId('user-1'));
        assert.equal(member!.role.value, 'admin');
    });

    it('throws when changing role of a non-member', () => {
        const tenant = Tenant.create('Test', 'test', 5);
        assert.throws(
            () => tenant.changeMemberRole('nonexistent', 'admin'),
            /not a member/,
        );
    });

    it('increases max number of members', () => {
        const tenant = Tenant.create('Test', 'test', 5);
        tenant.increaseMaxNumberOfMembers(10);
        assert.equal(tenant.maxNumberOfMembers, 10);
    });

    it('throws when increasing max to same or lower value', () => {
        const tenant = Tenant.create('Test', 'test', 5);
        assert.throws(
            () => tenant.increaseMaxNumberOfMembers(5),
            /greater than/,
        );
        assert.throws(
            () => tenant.increaseMaxNumberOfMembers(3),
            /greater than/,
        );
    });

    it('updates tenant details as admin', () => {
        const tenant = Tenant.create('Old', 'old', 5);
        tenant.addNewMember('user-1', 'admin');
        tenant.updateTenant('New', 'new', 5, 'user-1');
        assert.equal(tenant.name, 'New');
        assert.equal(tenant.subdomain, 'new');
    });

    it('throws when non-admin tries to update tenant', () => {
        const tenant = Tenant.create('Test', 'test', 5);
        tenant.addNewMember('user-1', 'member');
        assert.throws(
            () => tenant.updateTenant('New', 'new', 5, 'user-1'),
            /not a member|admin/,
        );
    });

    it('throws when non-member tries to update tenant', () => {
        const tenant = Tenant.create('Test', 'test', 5);
        assert.throws(
            () => tenant.updateTenant('New', 'new', 5, 'nonexistent'),
            /not a member/,
        );
    });
});
