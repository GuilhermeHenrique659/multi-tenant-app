import { Router } from "express";
import UserModule from "./user.module.js";
import { db } from "../../db/config.js";
import { Container } from "../@common/Container.js";
import UserQuery from "./query/UserQuery.js";

const UserRoutes = (container: Container) => {

    const userRoutes = Router();
    const userModule = new UserModule(db);
    const userQuery = new UserQuery(db);

    userRoutes.post('/', async (req, res) => {        
        const result = await userModule.login({ email: req.body.email });

        res.status(200).json(result);

    });

    userRoutes.get('/search', async (req, res) => {
        const name = req.query.name as string;
        if (!name) {
            return res.status(400).json({ error: 'Name query parameter is required' });
        }

        const user = await userQuery.getByName(name);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    });

    return userRoutes;
}

export default UserRoutes;