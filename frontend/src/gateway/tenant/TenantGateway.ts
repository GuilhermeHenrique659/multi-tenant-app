import type { Tenant } from "../../model/Tenant";
import type { User } from "../../model/User";
import type { Result } from "../../util/Result";

export default interface TenantGateway {
    getList(): Promise<Result<Array<Tenant>, Error>>;
    getById(id: string): Promise<Result<Tenant, Error>>;
    removeUser(tenantId: string, user: User): Promise<Result<void, Error>>;
    addUser(tenantId: string, user: User, role: string): Promise<Result<void, Error>>;
}