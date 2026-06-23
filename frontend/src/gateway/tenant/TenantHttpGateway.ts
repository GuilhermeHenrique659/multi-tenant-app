import { From, type Tenant } from "../../model/Tenant";
import type { User } from "../../model/User";
import type HttpClient from "../HttpClient";
import type TenantGateway from "./TenantGateway";

export default class TenantHttpGateway implements TenantGateway {
    private readonly _httpClient: HttpClient

    constructor(httpClient: HttpClient) {
        this._httpClient = httpClient;
    }

    public async getList(): Promise<Array<Tenant>> {
        const tenants = await this._httpClient.get<Array<unknown>>('api/tenants');

        return tenants.map(tenant => From(tenant)).filter((item) => !!item);
    }

    public async getById(id: string): Promise<Tenant | null> {
        const tenant = await this._httpClient.get<any | null>(`api/tenants/${id}`, { headers: { 'x-tenant-id': id } });

        if (!tenant) return null;

        return From(tenant)
    }

    public async addUser(tenantId: string, user: User) {

    }

    public async removeUser(tenantId: string, user: User) {

    }
}