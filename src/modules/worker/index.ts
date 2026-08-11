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

export type ResumeWorkerRequest = {
    userId: string;
    tenantId: string;
    workerId: string;
}

export type AnswerStepRequest = {
    userId: string;
    tenantId: string;
    workerId: string;
    answer: {
        stepId: string;
        data: string;
    }
}

export type ListWorkersRequest = {
    userId: string;
    tenantId: string;
}

export type WorkerListItem = {
    id: string;
    name: string;
    steps: {
        id: string;
        action: string;
        status: string;
        order: number;
        input: unknown | null,
        type: string,
        error: string | null,
        answer: string | null
    }[];
}
