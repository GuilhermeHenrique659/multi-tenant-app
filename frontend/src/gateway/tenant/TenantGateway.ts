import type { Tenant } from "../../model/Tenant";
import type { User } from "../../model/User";

export default interface TenantGateway {
    getList(): Promise<Array<Tenant>>;
    getById(id: string): Promise<Tenant | null>;
    removeUser(tenantId: string, user: User): Promise<void>;
    addUser(tenantId: string, user: User, role: string): Promise<void>;
}