import Mediator from "../../@common/Mediator.js";
import * as UserModule from "../../user/UserModule.js";
import Membership from "../domain/Membership.js";
import { MembershipCriteria } from "../repository/MembershipCriteria.js";
import MembershipRepository from "../repository/MembershipRepository.js";

export default class AddUserToTenant {
    constructor(private readonly membershipRepository: MembershipRepository, private readonly _mediator: Mediator = new Mediator()) { }

    async execute(input: Input): Promise<Output> {
        const userExists = await this._mediator.notify<UserModule.CheckInInput, UserModule.CheckInOutput>("checkInUser", {
            name: input.user.name,
            email: input.user.email,
            userId: input.user.id,
        });

        if (!userExists) {
            throw new Error("User does not exist");
        }

        const hasMembership = await this.membershipRepository.has(new MembershipCriteria().userId(userExists.userId).tenantId(input.tenantId));

        if (hasMembership) {
            throw new Error("User is already a member of this tenant");
        }

        const membership = Membership.create(userExists.userId, input.tenantId, input.role);
        await this.membershipRepository.save(membership);
        
        return { userId: userExists.userId, tenantId: input.tenantId, role: input.role };
    }
}

type Output = {
    userId: string;
    tenantId: string;
    role: 'admin' | 'member';
}

type Input = {
    tenantId: string;
    user: {
        id?: string;
        name: string;
        email: string;
    }
    role: 'admin' | 'member';
}