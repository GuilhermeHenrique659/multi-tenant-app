import { BaseCriteria } from "../../@common/Criteria.js";

export default class ProjectCriteria extends BaseCriteria {
    public getById(id: string) {
        this.addCriteria({ op: 'eq', value: id, key: 'id' });
        return this;
    }

    public getByTenantId(tenantId: string) {
        this.addCriteria({ op: 'eq', value: tenantId, key: 'tenantId' });
        return this;
    }
}
