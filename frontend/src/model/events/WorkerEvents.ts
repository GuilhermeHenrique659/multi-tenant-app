/** A step of a worker changed its status. */
export type WorkerStepEvent = {
    workerId: string;
    stepId: string;
    order: number;
    action: string;
    status: string;
    /** Only comes with the event of a step that was answered. */
    answer?: string | null;
}
