import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { CheckInInput, CheckInOutput, RemoveUserInput, UserModule } from "./index.js";
import CheckIn from "./application/CheckIn.js";
import UserRepositoryDatabase from "./repository/UserRepositoryDatabase.js";
import RemoveUser from "./application/RemoveUser.js";

export default class UserModuleImpl implements UserModule {
    constructor (private readonly _db: NodePgDatabase) {}

    async checkInUser(input: CheckInInput): Promise<CheckInOutput> {
        return this._db.transaction(async (tx) => {
            const userRepository = new UserRepositoryDatabase(tx);
            const checkIn = new CheckIn(userRepository);
            return checkIn.execute(input);
        });
    }

    async removeUser(input: RemoveUserInput): Promise<void> {
        return this._db.transaction(async (tx) => {
            const userRepository = new UserRepositoryDatabase(tx);
            const removeUser = new RemoveUser(userRepository);
            await removeUser.execute(input);
        });
    }
}