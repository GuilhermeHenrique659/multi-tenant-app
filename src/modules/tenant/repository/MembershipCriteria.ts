import Criteria, { BaseCriteria } from "../../@common/Criteria.js";

export class MembershipCriteria extends BaseCriteria {
    constructor () { 
        super();
    }
    
    userId(value: string): MembershipCriteria {
        this.addCriteria({ key: 'userId', value, op: 'eq' });
        return this;
    }

    tenantId(value: string): MembershipCriteria {
        this.addCriteria({ key: 'tenantId', value, op: 'eq' });
        return this;
    }
}