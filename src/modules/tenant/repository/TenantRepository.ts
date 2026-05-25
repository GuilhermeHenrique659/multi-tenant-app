import Criteria from "../../@common/Criteria.js";
import Tenant from "../domain/Tenant.js";

export default interface TenantRepository {
    save(tenant: Tenant): Promise<void>;
    has(criteria: Criteria): Promise<boolean>;
    get(criteria: Criteria): Promise<Tenant | null>;
}