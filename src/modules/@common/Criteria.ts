export type CriteriaOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin';

export default interface Criteria {
    key: string;
    value: string| number | string[] | number[];
    op: CriteriaOperator;
}

export abstract class BaseCriteria {
    constructor (private readonly _criterias: Criteria[] = []) { };

    protected addCriteria(criteria: Criteria) {
        this._criterias.push(criteria);
    }
    
    get criterias(): Criteria[] {
        return this._criterias;
    }
}