import Id from "../../@common/Id.js";

type UserProps = { 
    id: Id;
    name: string;
    email: string;
    createdAt: Date;
}

export default class User {
    constructor (private readonly props: UserProps) {}
    
    get id(): string {
        return this.props.id.value;
    }

    get name(): string {
        return this.props.name;
    }
    
    get email(): string {
        return this.props.email;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    static create(name: string, email: string): User {
        return new User({
            id: Id.create(),
            name,
            email,
            createdAt: new Date(),
        });
    }
}