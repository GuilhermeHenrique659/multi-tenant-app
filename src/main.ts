import express from 'express';
import Mediator from './modules/@common/Mediator.js';
import UserModuleImpl from './modules/user/user.module.js';
import TenantQuery from './modules/tenant/query/TenantQuery.js';
import TenantModuleImpl from './modules/tenant/tenant.module.js';

import { db } from './db/config.js';
import { permssionMiddleware, tenantSubdomainMiddleware } from './modules/@common/Middleware.js';
import { AddMemberInput, CreateTenantInput } from './modules/tenant/index.js';

async function main() {
    const app = express();

    app.use(express.json());

    const mediator = new Mediator();
    const userModule = new UserModuleImpl(db);

    mediator.register('checkInUser', async (input: any) => {
        return userModule.checkInUser(input);
    });

    mediator.register('createTenantFail', async (input: CreateTenantInput) => userModule.removeUser({
        id: input.admin.userId,
        email: input.admin.email,
    }));

    mediator.register('addMemberFail', async (input: AddMemberInput) => userModule.removeUser({
        id: input.userId,
        email: input.email,
    }));

    const tenantModule = new TenantModuleImpl(db, mediator, new TenantQuery(db));

    app.post('/tenants', async (req, res) => {
        try {
            const response = await tenantModule.createTenant(req.body);

            res.status(201).json(response);
        } catch (error) {
            res.status(400).json({ error: (error as any).message });
        }
    });

    app.post('/tenants/:id/users', permssionMiddleware(['tenant:user:read', 'tenant:user:add']), async (req, res) => {
        try {
            const response = await tenantModule.addMember({
                tenantId: req.params.id as string,
                userId: req.body.id as string,
                name: req.body.name as string,
                email: req.body.email as string,
                role: req.body.role as string,
            });

            res.status(200).json(response);
        } catch (error) {
            res.status(400).json({ error: (error as any).message });
        }
    });

    app.delete('/tenants/:tenantId/users/:userId', permssionMiddleware(['tenant:user:read', 'tenant:user:remove']), async (req, res) => {
        try {
            await tenantModule.removeMember(req.params.tenantId as string, req.params.userId as string);
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ error: (error as any).message });
        }
    });

    app.patch('/tenants/:tenantId/users/:userId', permssionMiddleware(['tenant:user:read', 'tenant:user:edit']), async (req, res) => {
        try {
            await tenantModule.updateMember(req.params.tenantId as string, req.params.userId as string, req.body.role as string);
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ error: (error as any).message });
        }
    });

    app.patch('/tenants/:tenantId/users/:userId', permssionMiddleware(['tenant:user:read', 'tenant:user:edit']), async (req, res) => {
        try {
            await tenantModule.updateMember(req.params.tenantId as string, req.params.userId as string, req.body.role as string);
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ error: (error as any).message });
        }
    });

    app.get('/tenants/:id', permssionMiddleware(['tenant:details:view']), async (req, res) => {
        const tenant = await tenantModule.getById(req.params.id as string);

        if (!tenant) {
            return res.status(404).json({ error: "Tenant não encontrado" });
        }

        res.status(200).json(tenant);
    });

    app.get('/tenants', async (req, res) => {
        const tenants = await tenantModule.list();

        res.status(200).json(tenants);
    });

    app.get("/", tenantSubdomainMiddleware, (req, res) => {
        res.status(200).json((req as any).tenant);
    });

    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
}

await main();