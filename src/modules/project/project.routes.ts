import { Router } from "express";
import { db } from "../../db/config.js";
import { Container } from "../@common/Container.js";
import ProjectModule from "./project.module.js";

const ProjectRoutes = (container: Container) => {
    const projectRoutes = Router();
    const projectModule = new ProjectModule(db);

    projectRoutes.post('/', async (req, res) => {        
        const tenantId = req.headers['x-tenant-id'] as string;
        const userId = req.headers['x-user-id'] as string;

        const result = await projectModule.createProject({ tenantId, userId, ...req.body });

        res.status(201).json(result);

    });

    return projectRoutes;
}

export default ProjectRoutes;