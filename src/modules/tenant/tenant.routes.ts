import { Router } from "express";
import { authenticationMiddleware, permssionMiddleware, superAdminPermissionMidleware } from "../@common/Middleware.js";
import { db } from "../../db/config.js";
import TenantQuery from "./query/TenantQuery.js";
import TenantModuleImpl from "./tenant.module.js";
import { Container } from "../@common/Container.js";
import UserModuleImpl from "../user/user.module.js";
import { UserType } from "../user/query/UserQuery.js";
import type { TenantListItem } from "./index.js";

const TetantRoutes = (container: Container) => {
    const tenantModule = new TenantModuleImpl(db, container.get('mediator'), new TenantQuery(db));

    const tenantRouter = Router();

    tenantRouter.post('/', authenticationMiddleware, superAdminPermissionMidleware(), async (req, res) => {
        const response = await tenantModule.createTenant(req.body);

        res.status(201).json(response);

    });

    tenantRouter.post('/:id/users', authenticationMiddleware, permssionMiddleware(['tenant:user:read', 'tenant:user:add']), async (req, res) => {
        const response = await tenantModule.addMember({
            tenantId: req.params.id as string,
            userId: req.body.id as string | undefined,
            name: req.body.name as string,
            email: req.body.email as string,
            role: req.body.role as string,
        });

        res.status(200).json(response);

    });

    tenantRouter.delete('/:tenantId/users/:userId', authenticationMiddleware, permssionMiddleware(['tenant:user:read', 'tenant:user:remove']), async (req, res) => {
        await tenantModule.removeMember(req.params.tenantId as string, req.params.userId as string);
        res.status(204).send();
    });

    tenantRouter.patch('/:tenantId/users/:userId', authenticationMiddleware, permssionMiddleware(['tenant:user:read', 'tenant:user:edit']), async (req, res) => {
        await tenantModule.updateMember(req.params.tenantId as string, req.params.userId as string, req.body.role as string);
        res.status(204).send();

    });

    tenantRouter.patch('/:tenantId/users/:userId', authenticationMiddleware, permssionMiddleware(['tenant:user:read', 'tenant:user:edit']), async (req, res) => {
        await tenantModule.updateMember(req.params.tenantId as string, req.params.userId as string, req.body.role as string);
        res.status(204).send();

    });

    tenantRouter.get('/:id', authenticationMiddleware, permssionMiddleware(['tenant:details:view']), async (req, res) => {
        const tenant = await tenantModule.getById(req.params.id as string);

        if (!tenant) {
            return res.status(404).json({ error: "Tenant não encontrado" });
        }

        res.status(200).json(tenant);
    });

    tenantRouter.get('/', authenticationMiddleware, async (req, res) => {
        const user = (req as unknown as Record<string, unknown>).user as UserType;

        //TODO: Add filter on query
        const tenants = await tenantModule.list();
        if (user.isSuperAdmin) {
            return res.status(200).json(tenants);
        }

        const tenantsToShow = []
        for (const tenant of tenants) {
            const hasPermission = await new UserModuleImpl(db).hasPermissions(user.id, tenant.id, ['tenant:details:view']);
            console.log(hasPermission);

            if (hasPermission) tenantsToShow.push(tenant);
        }

        return res.status(200).json(tenantsToShow);
    });

    return tenantRouter;
}

export default TetantRoutes;