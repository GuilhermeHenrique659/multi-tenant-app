import { BaseCriteria } from "../../@common/Criteria.js";

export default class TaskCriteria extends BaseCriteria {

    public getById(id: string) {
        this.addCriteria({ op: 'eq', value: id, key: 'id' });

        return this;
    }
}