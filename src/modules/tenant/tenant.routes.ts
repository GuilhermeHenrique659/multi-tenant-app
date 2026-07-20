import { Router, Request, Response } from "express";
import { authenticationMiddleware } from "../@common/Middleware.js";
import { db } from "../../db/config.js";
import TenantModuleImpl from "./tenant.module.js";
import { Container } from "../@common/Container.js";
import { TenantUserModule, TenantUserModuleKey } from "./UserModule.js";
function getHeader(req: Request, name: string): string {
    const lowerName = name.toLowerCase();
    const value = req.headers[lowerName];
    if (!value) throw new Error(`${name} header is required`);
    const result = Array.isArray(value) ? value[0] : value;
    if (!result) throw new Error(`${name} header is required`);
    return result;
}

const TetantRoutes = (container: Container) => {
    const userModule = container.get<TenantUserModule>(TenantUserModuleKey);
    const tenantModule = new TenantModuleImpl(db, container.get('mediator'), userModule);
    const tenantRouter = Router();

    tenantRouter.post('/', 
        authenticationMiddleware,
        async (req: Request, res: Response) => {
            const userId = getHeader(req, 'x-user-id');
            const response = await tenantModule.createTenant({ userId, ...req.body });
            res.status(201).json(response);
        }
    );

    tenantRouter.post('/:id/users', 
        authenticationMiddleware,
        async (req: Request, res: Response) => {
            const userId = getHeader(req, 'x-user-id');
            const response = await tenantModule.addMember({
                tenantId: req.params.id as string,
                userId,
                targetUserId: req.body.userId as string | undefined,
                name: req.body.name as string,
                email: req.body.email as string,
                role: req.body.role as string,
            });
            res.status(200).json(response);
        }
    );

    tenantRouter.delete('/:tenantId/users/:userId', 
        authenticationMiddleware,
        async (req: Request, res: Response) => {
            const performerUserId = getHeader(req, 'x-user-id');
            await tenantModule.removeMember({
                tenantId: req.params.tenantId as string,
                userId: performerUserId,
                memberUserId: req.params.userId as string,
            });
            res.status(204).send();
        }
    );

    tenantRouter.patch('/:tenantId/users/:userId', 
        authenticationMiddleware,
        async (req: Request, res: Response) => {
            const performerUserId = getHeader(req, 'x-user-id');
            await tenantModule.updateMember({
                tenantId: req.params.tenantId as string,
                userId: performerUserId,
                memberUserId: req.params.userId as string,
                role: req.body.role as string,
            });
            res.status(204).send();
        }
    );

    tenantRouter.get('/:id', 
        authenticationMiddleware,
        async (req: Request, res: Response) => {
            const userId = getHeader(req, 'x-user-id');
            const tenant = await tenantModule.getById({ userId, tenantId: req.params.id as string });
            res.status(200).json(tenant);
        }
    );

    tenantRouter.get('/', 
        authenticationMiddleware,
        async (req: Request, res: Response) => {
            const userId = getHeader(req, 'x-user-id');
            const tenants = await tenantModule.list({ userId });
            res.status(200).json(tenants);
        }
    );

    return tenantRouter;
}

export default TetantRoutes;
