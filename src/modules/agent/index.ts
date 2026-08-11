export type PlanAgentRequest = {
    userId: string;
    tenantId: string;
    userPrompt: string;
    file?: string;
}

export type PlanAgentOutput = {
    agentId: string;
}

export type RunAgentRequest = {
    userId: string;
    tenantId: string;
    agentId: string;
}

export type ResumeAgentRequest = {
    userId: string;
    tenantId: string;
    agentId: string;
}

export type AnswerStepRequest = {
    userId: string;
    tenantId: string;
    agentId: string;
    answer: {
        stepId: string;
        data: string;
    }
}

export type ListAgentsRequest = {
    userId: string;
    tenantId: string;
}

export type AgentListItem = {
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
