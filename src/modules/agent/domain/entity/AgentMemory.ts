export type MemoryEntry = {
    order: number;
    action: string;
    input: any;
    output: any;
};

export default class AgentMemory {
    constructor(private readonly entries: MemoryEntry[] = []) { }

    /** One entry per step: a step that runs again replaces what it had recorded. */
    public record(entry: MemoryEntry): void {
        const current = this.entries.findIndex(recorded => recorded.order === entry.order);

        if (current >= 0) {
            this.entries[current] = entry;
            return;
        }

        this.entries.push(entry);
    }

    public getAll(): MemoryEntry[] {
        return [...this.entries].sort((a, b) => a.order - b.order);
    }

    public toJSON(): MemoryEntry[] {
        return this.getAll();
    }

    static empty() {
        return new AgentMemory([]);
    }

    static restore(entries: MemoryEntry[]) {
        return new AgentMemory([...entries]);
    }
}
