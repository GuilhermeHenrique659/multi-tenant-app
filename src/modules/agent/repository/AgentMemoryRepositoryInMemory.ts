import AgentMemory, { MemoryEntry } from "../domain/entity/AgentMemory.js";
import AgentMemoryRepository from "./AgentMemoryRepository.js";

/**
 * Keeps the memory of each agent in the process, which is enough for a run that
 * stops and starts again while the server is up. A database implementation takes
 * its place when the memory has to survive a restart.
 */
export default class AgentMemoryRepositoryInMemory implements AgentMemoryRepository {
    private readonly _entries = new Map<string, MemoryEntry[]>();

    public async get(agentId: string): Promise<AgentMemory> {
        return AgentMemory.restore(this._entries.get(agentId) ?? []);
    }

    public async save(agentId: string, memory: AgentMemory): Promise<void> {
        this._entries.set(agentId, memory.toJSON());
    }
}
