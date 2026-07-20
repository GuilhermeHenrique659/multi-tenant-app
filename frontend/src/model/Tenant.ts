import { z } from "zod";
import type { User } from "./User";
import { createStore } from "./common/Storage";
import { ModelCollection } from "./common/Collection";
import { Result } from "../util/Result";

const Role = ['member', 'admin'];

const TenantSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    maxNumberOfMembers: z.number(),
    createdAt: z.string(),
    memberCount: z.number().optional(),
});

const TenantMemberSchema = z.object({
    role: z.literal(Role),
    user: z.object({
        id: z.uuid().optional(),
        name: z.string(),
        email: z.email(),
    }),
})

export type TenantBaseProp = Readonly<z.infer<typeof TenantSchema>>;
type TenantMember = z.infer<typeof TenantMemberSchema>;

export type Tenant = Readonly<{
    props: TenantBaseProp;
    members: ReadonlyArray<TenantMember>;
}>

type TenantId = string;

export type TenantCollection = {
    tenants: ModelCollection<TenantId, Tenant>;
};

export const AddUser = (tenent: Tenant, user: User, role: string): Result<Tenant, Error> => {
    if (tenent.members.length >= tenent.props.maxNumberOfMembers) return Result.Error(new Error('Tenant max user reached'));
    if (tenent.members.some(member => member.user.id === user.props.id)) return Result.Error(new Error('User already add in Tenant'));

    const newMember = TenantMemberSchema.safeParse({
        role: role,
        user: {
            id: user.props.id,
            name: user.props.name,
            email: user.props.email,
        }
    });

    if (!newMember.success) return Result.Error(new Error('Invalid member data'));

    return Result.Ok({
        props: tenent.props,
        members: [...tenent.members, newMember.data]
    });
}

export const RemoveUser = (tenent: Tenant, userId: string): Result<Tenant, Error> => {
    if (!tenent.members.some(member => member.user.id === userId)) {
        return Result.Error(new Error('User is not in this tenant'));
    }

    return Result.Ok({
        props: tenent.props,
        members: tenent.members.filter((member) => member.user.id !== userId),
    });
}

export const From = (data: any): Tenant | null => {
    const props = TenantSchema.safeParse(data);

    const members = 'members' in data ? (data.members as any[]).map((member) => TenantMemberSchema.safeParse(member)) : [];

    if (!props.success) return null;

    return {
        props: props.data,
        members: members.filter(m => m.success).map((m) => m.data),
    };
}

export const tenantsStore = createStore<TenantCollection>({ tenants: new ModelCollection(new Map()) });