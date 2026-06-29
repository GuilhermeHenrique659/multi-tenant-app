import type { User } from "../../model/User";
import type HttpClient from "../HttpClient";
import type UserGateway from "./UserGateway";
import { Result } from "../../util/Result";
import { Create } from "../../model/User";

export default class UserHttpGateway implements UserGateway {
    private readonly _httpClient: HttpClient

    constructor(httpClient: HttpClient) {
        this._httpClient = httpClient;
    }

    public async getByName(name: string): Promise<Result<User, Error>> {
        const result = await this._httpClient.get<Record<string, unknown>>(`api/users/search?name=${encodeURIComponent(name)}`);

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        return Result.Ok(Create(result.unwrap()));
    }
}
