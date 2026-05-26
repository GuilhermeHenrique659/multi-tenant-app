import UserCriteria from "../repository/UserCriteria.js";
import UserRepository from "../repository/UserRepository.js";

export default class RemoveUser {
    constructor(private readonly _userRepository: UserRepository) { }

    public async execute(input: Input): Promise<void> {
        const criteria = new UserCriteria();

        if ('email' in input) criteria.email(input.email);
        else criteria.id(input.id);

        const user = await this._userRepository.get(criteria);
        if (!user) throw new Error("User not found");

        if (user.isActive) throw new Error("Cannot remove an active user");

        await this._userRepository.delete(user);
    }
}

type Input = {
    email: string;
} | {
    id: string

}