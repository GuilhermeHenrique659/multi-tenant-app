import { Observer } from "./Observer.js";

type Change = {
    event: string;
    data: any;
}

export default class ChangeTrackingObserver implements Observer {
    constructor(private readonly changeEvens: Change[] = []) { }

    get changes(): Change[] {
        return this.changeEvens;
    }

    findFindEvent(eventName: string): Change | undefined {
        return this.changeEvens.find(c => c.event === eventName);
    }

    hasEvent(eventName: string): boolean {
        return this.changeEvens.some(c => c.event === eventName);
    }

    update(data: any): void {
        if ('event' in data && 'data' in data) {
            this.changeEvens.push(data);
        }
    }
}