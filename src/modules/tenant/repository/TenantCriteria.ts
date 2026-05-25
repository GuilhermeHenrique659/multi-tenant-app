import Criteria, { BaseCriteria } from "../../@common/Criteria.js";

export default class TenantCriteria extends BaseCriteria {
    constructor () {
        super();
    }

    public subdomain(value: string): TenantCriteria {
        this.addCriteria({
            key: 'subdomain',
            value,
            op: 'eq',
        });

        return this;
    }

    public id(value: string): TenantCriteria {
        this.addCriteria({
            key: 'id',
            value,
            op: 'eq',
        });
        return this;
    }

}