export type MemoryEntry = {
    order: number;
    action: string;
    input: any;
    output: any;
};

export default class WorkerMemory {
    constructor(private readonly entries: MemoryEntry[] = []) { }

    public record(entry: MemoryEntry): void {
        this.entries.push(entry);
    }

    public getAll(): MemoryEntry[] {
        return [...this.entries].sort((a, b) => a.order - b.order);
    }

    public toJSON(): MemoryEntry[] {
        return this.getAll();
    }

    static empty() {
        return new WorkerMemory([]);
    }

    static restore(entries: MemoryEntry[]) {
        return new WorkerMemory([...entries]);
    }
}
