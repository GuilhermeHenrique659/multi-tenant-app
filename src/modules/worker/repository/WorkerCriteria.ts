import { BaseCriteria } from "../../@common/Criteria.js";

export default class WorkerCriteria extends BaseCriteria {
    public getById(id: string) {
        this.addCriteria({ op: 'eq', key: 'id', value: id})
        return this;
    }
}