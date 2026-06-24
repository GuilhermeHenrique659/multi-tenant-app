export class ModelCollection<K, V> {
    private readonly collection: Map<K, V>
    constructor(collection: Map<K, V>) {
        this.collection = collection;
    }

    public get(key: K) {
        return this.collection.get(key);
    }

    public set(key: K, val: V) {
        this.collection.set(key, val);
        return this;
    }

    public delete(key: K) {
        this.collection.delete(key);
        return this;
    }

    public values() {
        return Array.from(this.collection.values());
    }

    public entries() {
        return Array.from(this.collection.entries());
    }

    static from<K, T>(array: Array<T>, fn: (item: T) => [K, T] | undefined) {
        return new ModelCollection(new Map(array.map(fn).filter(data => !!data)));
    }
}