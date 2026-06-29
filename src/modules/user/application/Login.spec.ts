import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Login from './Login.js';
import FakeUserRepository from '../repository/FakeUserRepository.js';
import User from '../domain/User.js';
import UserCriteria from '../repository/UserCriteria.js';

describe('Login', () => {
    let fakeUserRepo: FakeUserRepository;
    let login: Login;

    beforeEach(() => {
        fakeUserRepo = new FakeUserRepository();
        login = new Login(fakeUserRepo);
    });

    it('returns user data on successful login', async () => {
        const user = User.create('John', 'john@example.com');
        await fakeUserRepo.save(user);

        const result = await login.execute('john@example.com');

        assert.equal(result.userId, user.id);
        assert.equal(result.name, 'John');
        assert.equal(result.isSuperAdmin, false);
    });

    it('activates an inactive user on login', async () => {
        const user = User.create('John', 'john@example.com');
        await fakeUserRepo.save(user);
        assert.ok(!user.isActive);

        await login.execute('john@example.com');

        const saved = await fakeUserRepo.get(new UserCriteria().id(user.id));
        assert.ok(saved!.isActive);
    });

    it('throws when user is not found', async () => {
        await assert.rejects(
            () => login.execute('unknown@example.com'),
            /User not found/,
        );
    });
});
