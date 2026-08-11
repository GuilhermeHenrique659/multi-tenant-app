/** A step of a agent changed its status. */
export type AgentStepEvent = {
    agentId: string;
    stepId: string;
    order: number;
    action: string;
    status: string;
    /** Only comes with the event of a step that was answered. */
    answer?: string | null;
}
