export type PlanWorkerRequest = {
    userId: string;
    tenantId: string;
    userPrompt: string;
    file?: string;
}

export type PlanWorkerOutput = {
    workerId: string;
}

export type RunWorkerRequest = {
    userId: string;
    tenantId: string;
    workerId: string;
}
