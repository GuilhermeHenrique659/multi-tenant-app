
export class Container {
    constructor (private readonly registryMap: Map<string, any>) {}

    register(key: string, value: any) {
        this.registryMap.set(key, value);
    }

    get<T>(key: string): T {
        const value = this.registryMap.get(key);
        
        if (!value) {
            throw new Error(`Dependency ${key} not found`);
        }


        return value as T;
    }
}
