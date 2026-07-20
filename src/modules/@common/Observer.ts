export interface Observer {
    update(data: any): void;
}

export abstract class Subject {
    private observers: Observer[] = [];
    
    subscribe(observer: Observer) {
        this.observers.push(observer);
    }

    unsubscribe(observer: Observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }
    
    notify(data: any) {
        this.observers.forEach(observer => observer.update(data));
    }

    findObserver<T extends Observer>(predicate: (observer: Observer) => boolean): T | undefined {
        return this.observers.find(predicate) as T | undefined;
    }
}