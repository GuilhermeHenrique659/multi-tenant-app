import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import UpdateMember from './UpdateMember.js';
import FakeTenantRepository from '../repository/FakeTenantRepository.js';
import Tenant from '../domain/Tenant.js';
import TenantCriteria from '../repository/TenantCriteria.js';

describe('UpdateMember', () => {
    let fakeTenantRepo: FakeTenantRepository;
    let updateMember: UpdateMember;

    beforeEach(() => {
        fakeTenantRepo = new FakeTenantRepository();
        updateMember = new UpdateMember(fakeTenantRepo);
    });

    it('updates a member role', async () => {
        const tenant = Tenant.create('Corp', 'corp', 5);
        tenant.addNewMember('admin-id', 'admin');
        tenant.addNewMember('member-id', 'member');
        await fakeTenantRepo.save(tenant);

        const result = await updateMember.execute({
            userId: 'performer-id',
            tenantId: tenant.id,
            memberUserId: 'member-id',
            role: 'admin',
        });

        assert.equal(result.tenantId, tenant.id);
        assert.equal(result.userId, 'member-id');
        assert.equal(result.newRole, 'admin');

        const saved = await fakeTenantRepo.get(new TenantCriteria().id(tenant.id));
        const member = saved!.memberships.find(m => m.hasUserId('member-id'));
        assert.equal(member!.role.value, 'admin');
    });

    it('throws when tenant does not exist', async () => {
        await assert.rejects(
            () =>
                updateMember.execute({
                    userId: 'performer-id',
                    tenantId: 'nonexistent',
                    memberUserId: 'some-id',
                    role: 'admin',
                }),
            /Tenant n.*o encontrado/,
        );
    });
});
