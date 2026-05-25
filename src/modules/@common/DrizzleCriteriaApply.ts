import { Column, eq, sql, Table } from "drizzle-orm";

const GetOp = (op: string) => {
    switch (op) {
        case "eq":
            return eq;
        default:
            throw new Error(`Unsupported operator: ${op}`);
    }
}

export const DrizzleCriteriaApply = (criteria: { key: string; value: string; op: string }, table: Table) => {
    const column = table[criteria.key as keyof typeof table];
    
    if (!column) {
        throw new Error(`Column ${criteria.key} not found`);
    }



    return GetOp(criteria.op)(column as Column, criteria.value);
}