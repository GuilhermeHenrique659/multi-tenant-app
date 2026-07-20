import { Router, Request, Response } from "express";
import { db } from "../../db/config.js";
import { Container } from "../@common/Container.js";
import ProjectModule from "./project.module.js";
import { ProjectUserModule, ProjectUserModuleKey } from "./UserModule.js";
import { authenticationMiddleware } from "../@common/Middleware.js";
import asyncHandler from "express-async-handler";

function getHeader(req: Request, name: string): string {
    const lowerName = name.toLowerCase();
    const value = req.headers[lowerName];
    if (!value) throw new Error(`${name} header is required`);
    const result = Array.isArray(value) ? value[0] : value;
    if (!result) throw new Error(`${name} header is required`);
    return result;
}

const ProjectRoutes = (container: Container) => {
    const projectRoutes = Router();
    const userModule = container.get<ProjectUserModule>(ProjectUserModuleKey);
    const projectModule = new ProjectModule(db, userModule);

    projectRoutes.post('/', 
        authenticationMiddleware,
        asyncHandler(async (req: Request, res: Response) => {        
            const tenantId = getHeader(req, 'x-tenant-id');
            const userId = getHeader(req, 'x-user-id');

            const result = await projectModule.createProject({ tenantId, userId, ...req.body });

            res.status(201).json(result);
        })
    );

    projectRoutes.get('/',
        authenticationMiddleware,
        asyncHandler(async (req: Request, res: Response) => {
            const tenantId = getHeader(req, 'x-tenant-id');
            const userId = getHeader(req, 'x-user-id');

            const result = await projectModule.listProjects({ tenantId, userId });

            res.status(200).json(result);
        })
    );

    projectRoutes.post('/:projectId/tasks', 
        authenticationMiddleware,
        asyncHandler(async (req: Request, res: Response) => {
            const tenantId = getHeader(req, 'x-tenant-id');
            const userId = getHeader(req, 'x-user-id');
            const projectId = req.params.projectId as string;

            const result = await projectModule.addTask({ tenantId, userId, projectId, ...req.body });

            res.status(201).json(result);
        })
    );

    projectRoutes.get('/:projectId/tasks',
        authenticationMiddleware,
        asyncHandler(async (req: Request, res: Response) => {
            const tenantId = getHeader(req, 'x-tenant-id');
            const userId = getHeader(req, 'x-user-id');
            const projectId = req.params.projectId as string;

            const result = await projectModule.listTasks({ tenantId, userId, projectId });

            res.status(200).json(result);
        })
    );

    projectRoutes.get('/:projectId/tasks/:taskId',
        authenticationMiddleware,
        asyncHandler(async (req: Request, res: Response) => {
            const tenantId = getHeader(req, 'x-tenant-id');
            const userId = getHeader(req, 'x-user-id');
            const taskId = req.params.taskId as string;

            const result = await projectModule.getTask({ tenantId, userId, taskId });

            if (!result) {
                res.status(404).json({ error: 'Task not found' });
                return;
            }

            res.status(200).json(result);
        })
    );

    projectRoutes.patch('/:projectId/tasks/:taskId', 
        authenticationMiddleware,
        asyncHandler(async (req: Request, res: Response) => {
            const tenantId = getHeader(req, 'x-tenant-id');
            const userId = getHeader(req, 'x-user-id');
            const projectId = req.params.projectId as string;
            const taskId = req.params.taskId as string;

            const result = await projectModule.updateTask({ tenantId, userId, projectId, id: taskId, ...req.body });

            res.status(200).json(result);
        })
    );

    projectRoutes.patch('/:projectId/tasks/:taskId/assign', 
        authenticationMiddleware,
        asyncHandler(async (req: Request, res: Response) => {
            const tenantId = getHeader(req, 'x-tenant-id');
            const userId = getHeader(req, 'x-user-id');
            const taskId = req.params.taskId as string;
            const assigneeId = req.body.assigneeId as string;

            const result = await projectModule.assignTask({ tenantId, userId, taskId, assigneeId });

            res.status(200).json(result);
        })
    );

    return projectRoutes;
}

export default ProjectRoutes;