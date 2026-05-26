import User from "../domain/User.js";
import UserCriteria from "./UserCriteria.js";

export default interface UserRepository {
    has(criteria: UserCriteria): Promise<boolean>;
    get(criteria: UserCriteria): Promise<User | null>;
    save(user: User): Promise<void>;
    delete(user: User): Promise<void>;
}