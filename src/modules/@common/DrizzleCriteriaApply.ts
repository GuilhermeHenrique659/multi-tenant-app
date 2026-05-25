import { and, Column, eq, gt, sql, Table } from "drizzle-orm";
import { BaseCriteria } from "./Criteria.js";

const GetOp = (op: string) => {
    switch (op) {
        case "eq":
            return eq;
        case "gt":
            return gt;
        default:
            throw new Error(`Unsupported operator: ${op}`);
    }
}

export const DrizzleCriteriaApply = (criteria: BaseCriteria, table: Table) => {
    const andConditions = criteria.criterias.map(c => {
        const column = table[c.key as keyof typeof table];
        
        if (!column) {
            throw new Error(`Column ${c.key} not found`);
        }

        const operator = GetOp(c.op);
        
        return operator(column as Column, c.value);
    });

    return and(...andConditions);
}