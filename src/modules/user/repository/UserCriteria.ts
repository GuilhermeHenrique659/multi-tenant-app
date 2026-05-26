import { BaseCriteria } from "../../@common/Criteria.js";

export default class UserCriteria extends BaseCriteria {
    constructor() {
        super();
    }

    id(id: string) {
        this.addCriteria({ key: 'id', value: id, op: 'eq' });
        return this;
    }

    email(email: string) {
        this.addCriteria({ key: 'email', value: email, op: 'eq' });
        return this;
    }
}