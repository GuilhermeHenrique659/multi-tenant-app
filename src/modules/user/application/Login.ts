import UserCriteria from "../repository/UserCriteria.js";
import UserRepository from "../repository/UserRepository.js";

export default class Login {
    constructor(private readonly _userRepository: UserRepository) { }

    public async execute(email: string) {
        const user = await this._userRepository.get(new UserCriteria().email(email));

        if (!user) throw new Error("User not found");

        if (!user.isActive) user.active();

        await this._userRepository.save(user);

        //TODO: ADD JWT TOKEN
        return { userId: user.id, name: user.name, isSuperAdmin: user.isSuperAdmin };
    }
}