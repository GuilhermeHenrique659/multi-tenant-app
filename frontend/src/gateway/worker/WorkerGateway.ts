import type { Worker } from "../../model/Worker";
import type { Result } from "../../util/Result";

export default interface WorkerGateway {
    plan(tenantId: string, userPrompt: string): Promise<Result<{ workerId: string }, Error>>;
    list(tenantId: string): Promise<Result<Array<Worker>, Error>>;
}
