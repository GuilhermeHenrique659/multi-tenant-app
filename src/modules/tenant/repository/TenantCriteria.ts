import Criteria from "../../@common/Criteria.js";

export default class TenantCriteria implements Criteria {
    constructor (
        readonly key: string,
        readonly value: string,
        readonly op: string
    ) {}

    static subdomain(value: string): TenantCriteria {
        return new TenantCriteria('subdomain', value, 'eq');
    }

    static id(value: string): TenantCriteria {
        return new TenantCriteria('id', value, 'eq');
    }

}