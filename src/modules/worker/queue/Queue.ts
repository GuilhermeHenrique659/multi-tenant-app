export interface Queue {
    publish(event: DomainEvent): Promise<void>
    subscriber(event: string, fn: (data: any) => Promise<void>): Promise<void>;
}

export interface DomainEvent { 
    eventName: string;
    data: any;
}