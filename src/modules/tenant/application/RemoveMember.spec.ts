import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import RemoveMember from './RemoveMember.js';
import FakeTenantRepository from '../repository/FakeTenantRepository.js';
import Tenant from '../domain/Tenant.js';
import TenantCriteria from '../repository/TenantCriteria.js';

describe('RemoveMember', () => {
    let fakeTenantRepo: FakeTenantRepository;
    let removeMember: RemoveMember;

    beforeEach(() => {
        fakeTenantRepo = new FakeTenantRepository();
        removeMember = new RemoveMember(fakeTenantRepo);
    });

    it('removes a member from a tenant', async () => {
        const tenant = Tenant.create('Corp', 'corp', 5);
        tenant.addNewMember('admin-id', 'admin');
        tenant.addNewMember('member-id', 'member');
        await fakeTenantRepo.save(tenant);

        await removeMember.execute({
            userId: 'performer-id',
            tenantId: tenant.id,
            memberUserId: 'member-id',
        });

        const saved = await fakeTenantRepo.get(new TenantCriteria().id(tenant.id));
        assert.equal(saved!.memberships.length, 1);
        assert.ok(saved!.memberships[0]!.hasUserId('admin-id'));
    });

    it('throws when tenant does not exist', async () => {
        await assert.rejects(
            () => removeMember.execute({ userId: 'performer-id', tenantId: 'nonexistent', memberUserId: 'some-id' }),
            /Tenant n.*o encontrado/,
        );
    });
});
