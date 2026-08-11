import AgentMemory from "../domain/entity/AgentMemory.js";

/**
 * Where the facts a agent gathered while running are kept, so a run that starts
 * again knows what the completed steps already produced.
 */
export default interface AgentMemoryRepository {
    get(agentId: string): Promise<AgentMemory>;
    save(agentId: string, memory: AgentMemory): Promise<void>;
}
