import User from "../domain/User.js";
import UserCriteria from "../repository/UserCriteria.js";
import UserRepository from "../repository/UserRepository.js";

export default class CheckIn {
    constructor(private readonly _userRepository: UserRepository) { }

    async execute(input: Input): Promise<Output> {
        const existingUser = input.userId
            ? await this._userRepository.get(new UserCriteria().id(input.userId))
            : await this._userRepository.get(new UserCriteria().email(input.email));

        if (existingUser) return { userId: existingUser.id };

        const hasDuplicateEmail = await this._userRepository.has(new UserCriteria().email(input.email));
        if (hasDuplicateEmail) throw new Error("Email already in use");

        const user = User.create(input.name, input.email);
        await this._userRepository.save(user);

        return { userId: user.id };
    }
}

type Input = {
    userId: string | undefined;
    name: string;
    email: string;
}

type Output = {
    userId: string;
}