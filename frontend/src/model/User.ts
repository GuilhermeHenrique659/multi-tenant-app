import { z } from 'zod';

const UserSchema = z.object({
    id: z.uuid().optional(),
    name: z.string().max(100),
    email: z.email({ message: 'Invalid email address' }),
})

export type UserProps = z.infer<typeof UserSchema>;

export type User = Readonly<{
    props: Readonly<UserProps>;
}>;

export const Create = (props: Record<string, unknown>): User => {
    const validatedProps = UserSchema.parse({
        id: props.id,
        email: props.email,
        name: props.name || 'Default Name',
    });

    return { props: validatedProps };
}

export const Update = (props: UserProps): User => {
    return { props: props };
}
