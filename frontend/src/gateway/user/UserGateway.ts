import type { User } from "../../model/User";
import type { Result } from "../../util/Result";

export default interface UserGateway {
    getByName(name: string): Promise<Result<User, Error>>;
}