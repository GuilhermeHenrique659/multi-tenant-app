import Mediator from "../../@common/Mediator.js";
import * as UserModule from "../../user/UserModule.js";
import Membership from "../domain/Membership.js";
import TenantCriteria from "../repository/TenantCriteria.js";
import TenantRepository from "../repository/TenantRepository.js";

export default class AddUserToTenant {
    constructor(private readonly tenantRepository: TenantRepository, private readonly _mediator: Mediator = new Mediator()) { }

    async execute(input: Input): Promise<Output> {
        const userExists = await this._mediator.notify<UserModule.CheckInInput, UserModule.CheckInOutput>("checkInUser", {
            name: input.user.name,
            email: input.user.email,
            userId: input.user.id,
        });

        if (!userExists) {
            throw new Error("User does not exist");
        }

        const tentent = await this.tenantRepository.get(new TenantCriteria().id(input.tenantId));

        if (!tentent) {
            throw new Error("Tenant does not exist");
        }

        tentent.addNewMember(userExists.userId, input.tenantId, input.role);

        this.tenantRepository.save(tentent);
        
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