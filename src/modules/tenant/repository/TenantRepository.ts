import Criteria, { BaseCriteria } from "../../@common/Criteria.js";
import Tenant from "../domain/Tenant.js";

export default interface TenantRepository {
    save(tenant: Tenant): Promise<void>;
    has(criteria: BaseCriteria): Promise<boolean>;
    get(criteria: BaseCriteria): Promise<Tenant | null>;
}