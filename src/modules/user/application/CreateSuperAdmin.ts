import User from "../domain/User.js";
import UserCriteria from "../repository/UserCriteria.js";
import UserRepository from "../repository/UserRepository.js";

export default class CreateSuperAdmin {
    constructor (private readonly _userRepository: UserRepository) {}   
    
    public async execute(name: string, email: string) {
        const hasDuplicateEmail = await this._userRepository.get(new UserCriteria().email(email));

        if (hasDuplicateEmail) {
            throw new Error("User with this email already exists");
        }

        const user = User.createAsSuperAdmin(name, email);
        await this._userRepository.save(user);
    }
}