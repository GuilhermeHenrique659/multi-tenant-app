import { z } from 'zod';

const UserSchema = z.object({
    id: z.uuid().optional(),
    name: z.string().max(100),
    email: z.email({ message: 'Invalid email address' }),
})

export type UserProps = z.infer<typeof UserSchema>;

export class User {
    readonly props: UserProps

    constructor(props: UserProps) {
        this.props = props;
    }

    static create(props: Record<string, unknown>): User {
        const validatedProps = UserSchema.parse({
            email: props.email,
            name: props.name || 'Default Name',
        });

        return new User(validatedProps);
    }

    public performLogin(user: UserProps) {
        this.props.id = user.id;
        this.props.name = user.name;
        this.props.email = user.email;
    }
}