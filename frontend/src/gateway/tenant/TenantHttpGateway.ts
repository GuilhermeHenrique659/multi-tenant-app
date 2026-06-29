import { From, type Tenant } from "../../model/Tenant";
import type { User } from "../../model/User";
import type HttpClient from "../HttpClient";
import type TenantGateway from "./TenantGateway";
import { Result } from "../../util/Result";

export default class TenantHttpGateway implements TenantGateway {
    private readonly _httpClient: HttpClient

    constructor(httpClient: HttpClient) {
        this._httpClient = httpClient;
    }

    public async getList(): Promise<Result<Array<Tenant>, Error>> {
        const result = await this._httpClient.get<Array<unknown>>('api/tenants');

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        const tenants = result.unwrap().map(tenant => From(tenant)).filter((item) => !!item) as Array<Tenant>;
        return Result.Ok(tenants);
    }

    public async getById(id: string): Promise<Result<Tenant, Error>> {
        const result = await this._httpClient.get<any>(`api/tenants/${id}`, { headers: { 'x-tenant-id': id } });

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        const tenant = From(result.unwrap());

        if (!tenant) return Result.Error(new Error('Failed to parser'))

        return Result.Ok(tenant);
    }

    public async addUser(tenantId: string, user: User, role: string): Promise<Result<void, Error>> {
        const result = await this._httpClient.post<any | null>(`api/tenants/${tenantId}/users`, {
            userId: user.props.id,
            name: user.props.name,
            email: user.props.email,
            role: role,
        }, { headers: { 'x-tenant-id': tenantId } });

        if (result.isErr()) {
            return Result.Error(result.error);
        }

        return Result.Ok(undefined);
    }

    public async removeUser(_tenantId: string, _user: User): Promise<Result<void, Error>> {
        return Result.Ok(undefined);
    }
}