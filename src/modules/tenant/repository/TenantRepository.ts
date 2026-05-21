import Tenant from "../domain/Tenant.js";

export default interface TenantRepository {
    save(tenant: Tenant): Promise<void>;
    hasDuplicateSubdomain(subdomain: string): Promise<boolean>;
    getById(id: string): Promise<Tenant | null>;
}