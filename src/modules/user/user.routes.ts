import { Router } from "express";
import UserModuleImpl from "./user.module.js";
import { db } from "../../db/config.js";
import { Container } from "../@common/Container.js";

const UserRoutes = (container: Container) => {

    const userRoutes = Router();
    const userModule = new UserModuleImpl(db);

    userRoutes.post('/', async (req, res) => {
        const result = await userModule.login({ email: req.body.email });

        res.status(200).json(result);

    });

    return userRoutes;
}

export default UserRoutes;