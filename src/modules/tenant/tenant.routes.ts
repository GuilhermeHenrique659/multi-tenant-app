import { Router } from "express";
import { permssionMiddleware, superAdminPermissionMidleware } from "../@common/Middleware.js";
import { db } from "../../db/config.js";
import TenantQuery from "./query/TenantQuery.js";
import TenantModuleImpl from "./tenant.module.js";
import { Container } from "../@common/Container.js";

const TetantRoutes = (Container: Container) => {
    const tenantModule = new TenantModuleImpl(db, Container.get('mediator'), new TenantQuery(db));

    const tenantRouter = Router();

    tenantRouter.post('/', superAdminPermissionMidleware(), async (req, res) => {
        const response = await tenantModule.createTenant(req.body);

        res.status(201).json(response);

    });

    tenantRouter.post('//:id/users', permssionMiddleware(['tenant:user:read', 'tenant:user:add']), async (req, res) => {
        const response = await tenantModule.addMember({
            tenantId: req.params.id as string,
            userId: req.body.id as string,
            name: req.body.name as string,
            email: req.body.email as string,
            role: req.body.role as string,
        });

        res.status(200).json(response);

    });

    tenantRouter.delete('/:tenantId/users/:userId', permssionMiddleware(['tenant:user:read', 'tenant:user:remove']), async (req, res) => {
        await tenantModule.removeMember(req.params.tenantId as string, req.params.userId as string);
        res.status(204).send();
    });

    tenantRouter.patch('/:tenantId/users/:userId', permssionMiddleware(['tenant:user:read', 'tenant:user:edit']), async (req, res) => {
        await tenantModule.updateMember(req.params.tenantId as string, req.params.userId as string, req.body.role as string);
        res.status(204).send();

    });

    tenantRouter.patch('/:tenantId/users/:userId', permssionMiddleware(['tenant:user:read', 'tenant:user:edit']), async (req, res) => {
        await tenantModule.updateMember(req.params.tenantId as string, req.params.userId as string, req.body.role as string);
        res.status(204).send();

    });

    tenantRouter.get('/:id', permssionMiddleware(['tenant:details:view']), async (req, res) => {
        const tenant = await tenantModule.getById(req.params.id as string);

        if (!tenant) {
            return res.status(404).json({ error: "Tenant não encontrado" });
        }

        res.status(200).json(tenant);
    });

    tenantRouter.get('/', superAdminPermissionMidleware(), async (req, res) => {
        const tenants = await tenantModule.list();

        res.status(200).json(tenants);
    });

    return tenantRouter;
}

export default TetantRoutes;