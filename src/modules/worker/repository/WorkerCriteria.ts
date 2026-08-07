import { BaseCriteria } from "../../@common/Criteria.js";

export default class WorkerCriteria extends BaseCriteria {
    public getById(id: string) {
        this.addCriteria({ op: 'eq', key: 'id', value: id})
        return this;
    }

    public getByTenantId(tenantId: string) {
        this.addCriteria({ op: 'eq', key: 'tenantId', value: tenantId })
        return this;
    }
}