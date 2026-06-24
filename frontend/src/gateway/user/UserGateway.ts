import type { User } from "../../model/User";

export default interface UserGateway {
    getByName(name: string): Promise<User | null>;
}