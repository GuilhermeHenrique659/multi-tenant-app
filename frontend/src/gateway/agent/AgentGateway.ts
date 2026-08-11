import type { PublisherType } from "../../application/pub/Publisher";
import type { Agent } from "../../model/Agent";
import type { Result } from "../../util/Result";


/** Closes the stream, so whoever opened it can clean up. */
export type CloseStream = () => void;

export default interface AgentGateway {
    plan(tenantId: string, userPrompt: string): Promise<Result<{ agentId: string }, Error>>;
    resume(tenantId: string, agentId: string): Promise<Result<{ agentId: string }, Error>>;
    list(tenantId: string): Promise<Result<Array<Agent>, Error>>;
    streamEvents(tenantId: string, publisher: PublisherType): CloseStream;
    answer(tenantId: string, agentId: string, stepId: string, answer: string): Promise<Result<{ agentId: string }, Error>>;
}
