import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import CheckIn from './CheckIn.js';
import FakeUserRepository from '../repository/FakeUserRepository.js';
import User from '../domain/User.js';
import UserCriteria from '../repository/UserCriteria.js';

describe('CheckIn', () => {
    let fakeUserRepo: FakeUserRepository;
    let checkIn: CheckIn;

    beforeEach(() => {
        fakeUserRepo = new FakeUserRepository();
        checkIn = new CheckIn(fakeUserRepo);
    });

    it('returns existing user when found by userId', async () => {
        const user = User.create('John', 'john@example.com');
        await fakeUserRepo.save(user);

        const result = await checkIn.execute({
            userId: user.id,
            name: 'John',
            email: 'john@example.com',
        });

        assert.equal(result.userId, user.id);
    });

    it('returns existing user when found by email', async () => {
        const user = User.create('Jane', 'jane@example.com');
        await fakeUserRepo.save(user);

        const result = await checkIn.execute({
            userId: undefined,
            name: 'Jane',
            email: 'jane@example.com',
        });

        assert.equal(result.userId, user.id);
    });

    it('creates a new user when not found', async () => {
        const result = await checkIn.execute({
            userId: undefined,
            name: 'New User',
            email: 'new@example.com',
        });

        assert.ok(result.userId);
        const saved = await fakeUserRepo.get(new UserCriteria().id(result.userId));
        assert.ok(saved);
        assert.equal(saved!.name, 'New User');
    });

    it('throws when email is already in use by a different user', async () => {
        const user = User.create('Existing', 'existing@example.com');
        await fakeUserRepo.save(user);

        await assert.rejects(
            () =>
                checkIn.execute({
                    userId: 'some-other-id',
                    name: 'Another',
                    email: 'existing@example.com',
                }),
            /Email already in use/,
        );
    });
});
