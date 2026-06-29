import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import RemoveUser from './RemoveUser.js';
import FakeUserRepository from '../repository/FakeUserRepository.js';
import User from '../domain/User.js';
import UserCriteria from '../repository/UserCriteria.js';

describe('RemoveUser', () => {
    let fakeUserRepo: FakeUserRepository;
    let removeUser: RemoveUser;

    beforeEach(() => {
        fakeUserRepo = new FakeUserRepository();
        removeUser = new RemoveUser(fakeUserRepo);
    });

    it('removes a user by email', async () => {
        const user = User.create('John', 'john@example.com');
        await fakeUserRepo.save(user);

        await removeUser.execute({ email: 'john@example.com' });

        const saved = await fakeUserRepo.get(new UserCriteria().email('john@example.com'));
        assert.equal(saved, null);
    });

    it('removes a user by id', async () => {
        const user = User.create('Jane', 'jane@example.com');
        await fakeUserRepo.save(user);

        await removeUser.execute({ id: user.id });

        const saved = await fakeUserRepo.get(new UserCriteria().id(user.id));
        assert.equal(saved, null);
    });

    it('throws when user is not found', async () => {
        await assert.rejects(
            () => removeUser.execute({ email: 'unknown@example.com' }),
            /User not found/,
        );
    });

    it('throws when user is active', async () => {
        const user = User.create('Active', 'active@example.com');
        user.active();
        await fakeUserRepo.save(user);

        await assert.rejects(
            () => removeUser.execute({ id: user.id }),
            /Cannot remove an active user/,
        );
    });
});
