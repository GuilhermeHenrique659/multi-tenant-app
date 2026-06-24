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

    public async addUser(tenantId: string, user: User, role: string) {
        const tenant = await this._httpClient.post<any | null>(`api/tenants/${tenantId}/users`, {
            userId: user.props.id,
            name: user.props.name,
            email: user.props.email,
            role: role,
        }, { headers: { 'x-tenant-id': tenantId } });

    }

    public async removeUser(tenantId: string, user: User) {

    }
}