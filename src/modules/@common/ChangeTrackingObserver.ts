import { Observer } from "./Observer.js";

export default class ChangeTrackingObserver implements Observer {
    constructor(private readonly changeEvens: { event: string, data: any }[] = []) { }

    get changes() {
        return this.changeEvens;
    }

    update(data: any): void {
        if ('event' in data && 'data' in data) {
            this.changeEvens.push(data);
        }
    }
}