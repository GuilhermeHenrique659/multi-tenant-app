import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import CreateTenant from './CreateTenant.js';
import FakeTenantRepository from '../repository/FakeTenantRepository.js';
import FakeUserRepository from '../../user/repository/FakeUserRepository.js';
import Mediator from '../../@common/Mediator.js';
import CheckIn from '../../user/application/CheckIn.js';
import TenantCriteria from '../repository/TenantCriteria.js';
import User from '../../user/domain/User.js';

describe('CreateTenant', () => {
    let fakeTenantRepo: FakeTenantRepository;
    let fakeUserRepo: FakeUserRepository;
    let createTenant: CreateTenant;

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
        createTenant = new CreateTenant(fakeTenantRepo, createMediator());
    });

    it('creates a tenant with an admin member', async () => {
        const result = await createTenant.execute({
            userId: 'super-admin-id',
            name: 'My Corp',
            subdomain: 'my-corp',
            maxNumberOfMembers: 10,
            admin: { userId: undefined, name: 'Admin', email: 'admin@example.com' },
        });

        assert.ok(result.tenantId);

        const saved = await fakeTenantRepo.get(new TenantCriteria().id(result.tenantId));
        assert.ok(saved);
        assert.equal(saved!.name, 'My Corp');
        assert.equal(saved!.memberships.length, 1);
        assert.equal(saved!.memberships[0]!.role.value, 'admin');
    });

    it('throws when subdomain is already in use', async () => {
        await createTenant.execute({
            userId: 'super-admin-id',
            name: 'First',
            subdomain: 'dup',
            maxNumberOfMembers: 5,
            admin: { userId: undefined, name: 'Admin', email: 'admin1@example.com' },
        });

        await assert.rejects(
            () =>
                createTenant.execute({
                    userId: 'super-admin-id',
                    name: 'Second',
                    subdomain: 'dup',
                    maxNumberOfMembers: 5,
                    admin: { userId: undefined, name: 'Other', email: 'admin2@example.com' },
                }),
            /Subdomain already in use/,
        );
    });

    it('reuses an existing user as the admin', async () => {
        const existingUser = User.create('Existing', 'existing@example.com');
        await fakeUserRepo.save(existingUser);

        const result = await createTenant.execute({
            userId: 'super-admin-id',
            name: 'Corp',
            subdomain: 'corp',
            maxNumberOfMembers: 5,
            admin: { userId: existingUser.id, name: 'Existing', email: 'existing@example.com' },
        });

        const saved = await fakeTenantRepo.get(new TenantCriteria().id(result.tenantId));
        assert.ok(saved);
        assert.ok(saved!.memberships.some(m => m.hasUserId(existingUser.id)));
    });
});
