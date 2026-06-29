import Id from "../../@common/Id.js";
import User from "../domain/User.js";
import UserCriteria from "./UserCriteria.js";
import UserRepository from "./UserRepository.js";

type UserSnapshot = {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    isActive: boolean;
    isSuperAdmin: boolean;
};

export default class FakeUserRepository implements UserRepository {
    private users = new Map<string, UserSnapshot>();

    async has(criteria: UserCriteria): Promise<boolean> {
        for (const snapshot of this.users.values()) {
            if (this.matches(snapshot, criteria)) return true;
        }
        return false;
    }

    async get(criteria: UserCriteria): Promise<User | null> {
        for (const snapshot of this.users.values()) {
            if (this.matches(snapshot, criteria)) {
                return this.reconstruct(snapshot);
            }
        }
        return null;
    }

    async save(user: User): Promise<void> {
        this.users.set(user.id, {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            isActive: user.isActive,
            isSuperAdmin: user.isSuperAdmin,
        });
    }

    async delete(user: User): Promise<void> {
        this.users.delete(user.id);
    }

    private reconstruct(snapshot: UserSnapshot): User {
        return new User({
            id: new Id(snapshot.id),
            name: snapshot.name,
            email: snapshot.email,
            createdAt: snapshot.createdAt,
            isActive: snapshot.isActive,
            isSuperAdmin: snapshot.isSuperAdmin,
        });
    }

    private matches(snapshot: UserSnapshot, criteria: UserCriteria): boolean {
        return criteria.criterias.every(c => {
            if (c.op !== 'eq') return false;
            const value = snapshot[c.key as keyof UserSnapshot];
            return String(value) === String(c.value);
        });
    }

    clear(): void {
        this.users.clear();
    }
}
