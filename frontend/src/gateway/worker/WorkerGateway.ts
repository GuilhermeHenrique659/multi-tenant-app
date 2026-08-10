import type { PublisherType } from "../../application/pub/Publisher";
import type { Worker } from "../../model/Worker";
import type { Result } from "../../util/Result";


/** Closes the stream, so whoever opened it can clean up. */
export type CloseStream = () => void;

export default interface WorkerGateway {
    plan(tenantId: string, userPrompt: string): Promise<Result<{ workerId: string }, Error>>;
    resume(tenantId: string, workerId: string): Promise<Result<{ workerId: string }, Error>>;
    list(tenantId: string): Promise<Result<Array<Worker>, Error>>;
    streamEvents(tenantId: string, publisher: PublisherType): CloseStream;
}
