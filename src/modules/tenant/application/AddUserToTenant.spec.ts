import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import AddUserToTenant from './AddUserToTenant.js';
import FakeTenantRepository from '../repository/FakeTenantRepository.js';
import FakeUserRepository from '../../user/repository/FakeUserRepository.js';
import Mediator from '../../@common/Mediator.js';
import Tenant from '../domain/Tenant.js';
import CheckIn from '../../user/application/CheckIn.js';
import TenantCriteria from '../repository/TenantCriteria.js';

describe('AddUserToTenant', () => {
    let fakeTenantRepo: FakeTenantRepository;
    let fakeUserRepo: FakeUserRepository;
    let addUserToTenant: AddUserToTenant;

    function createMediator(): Mediator {
        const mediator = new Mediator();
        mediator.register('checkInUser', async (input: any) => {
            const checkIn = new CheckIn(fakeUserRepo);
            return checkIn.execute(input);
        });
        return mediator;
    }

    beforeEach(() => {
        fakeTenantRepo = new FakeTenantRepository();
        fakeUserRepo = new FakeUserRepository();
        addUserToTenant = new AddUserToTenant(fakeTenantRepo, createMediator());
    });

    it('adds a user to an existing tenant', async () => {
        const tenant = Tenant.create('Corp', 'corp', 5);
        tenant.addNewMember('admin-id', 'admin');
        await fakeTenantRepo.save(tenant);

        const result = await addUserToTenant.execute({
            userId: 'performer-id',
            tenantId: tenant.id,
            user: { id: undefined, name: 'New Member', email: 'member@example.com' },
            role: 'member',
        });

        assert.equal(result.tenantId, tenant.id);
        assert.ok(result.userId);
        assert.equal(result.role, 'member');

        const saved = await fakeTenantRepo.get(new TenantCriteria().id(tenant.id));
        assert.equal(saved!.memberships.length, 2);
        assert.ok(saved!.memberships.some(m => m.hasUserId(result.userId)));
    });

    it('throws when tenant does not exist', async () => {
        await assert.rejects(
            () =>
                addUserToTenant.execute({
                    userId: 'performer-id',
                    tenantId: 'nonexistent',
                    user: { id: undefined, name: 'User', email: 'user@example.com' },
                    role: 'member',
                }),
            /Tenant does not exist/,
        );
    });
});
