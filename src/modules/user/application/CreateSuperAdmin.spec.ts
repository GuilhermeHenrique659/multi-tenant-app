import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import CreateSuperAdmin from './CreateSuperAdmin.js';
import FakeUserRepository from '../repository/FakeUserRepository.js';
import UserCriteria from '../repository/UserCriteria.js';

describe('CreateSuperAdmin', () => {
    let fakeUserRepo: FakeUserRepository;
    let createSuperAdmin: CreateSuperAdmin;

    beforeEach(() => {
        fakeUserRepo = new FakeUserRepository();
        createSuperAdmin = new CreateSuperAdmin(fakeUserRepo);
    });

    it('creates a super admin user', async () => {
        await createSuperAdmin.execute('Super Admin', 'super@example.com');

        const saved = await fakeUserRepo.get(new UserCriteria().email('super@example.com'));
        assert.ok(saved);
        assert.equal(saved!.name, 'Super Admin');
        assert.ok(saved!.isSuperAdmin);
    });

    it('throws when email already exists', async () => {
        await createSuperAdmin.execute('First', 'dup@example.com');

        await assert.rejects(
            () => createSuperAdmin.execute('Second', 'dup@example.com'),
            /already exists/,
        );
    });
});
