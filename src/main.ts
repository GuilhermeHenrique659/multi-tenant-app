import express from 'express';
import CreateTenant from './modules/tenant/application/CreateTenant.js';
import TenantRepositoryDatabase from './modules/tenant/repository/TenantRepositoryDatabase.js';
import { db } from './db/config.js';
import { TenantTable } from './modules/tenant/db/TenantTable.js';
import { eq } from 'drizzle-orm';
import AddUserToTenant from './modules/tenant/application/AddUserToTenant.js';
import { UserTable } from './modules/user/db/UserTable.js';
import User from './modules/user/domain/User.js';
import Mediator from './modules/@common/Mediator.js';
import TenantQuery from './modules/tenant/query/TenantQuery.js';
import { Permissions } from './modules/@common/Permissions.js';
import { permssionMiddleware, tenantSubdomainMiddleware } from './modules/@common/Middleware.js';

async function main() {
    const app = express();

    app.use(express.json());

    const mediator = new Mediator();
    mediator.register('checkInUser', async (data: any) => {
        const mockUser = User.create(data.name, data.email);
        const res = await db.insert(UserTable).values({
            id: data.userId ?? mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            createdAt: mockUser.createdAt,
        }).onConflictDoUpdate({
            target: UserTable.email, set: {
                id: data.userId ?? mockUser.id,
                name: mockUser.name,
                email: mockUser.email,
                createdAt: mockUser.createdAt,
            }
        }).returning().execute();
        console.log(res);

        return { userId: res[0]?.id! };
    });


    app.post('/tenants', async (req, res) => {
        const tenantRepository = new TenantRepositoryDatabase(db);

        const createTenant = new CreateTenant(tenantRepository, mediator);
        try {
            const response = await createTenant.execute(req.body);

            res.status(201).json(response);
        } catch (error) {
            res.status(400).json({ error: (error as any).message });
        }
    });


    app.post('/tenants/:id/users', permssionMiddleware(['tenant:user:read', 'tenant:user:add']), async (req, res) => {
        const tenantRepository = new TenantRepositoryDatabase(db);

        const addUserToTenant = new AddUserToTenant(tenantRepository, mediator);

        try {
            const response = await addUserToTenant.execute({
                tenantId: req.params.id as string,
                user: {
                    name: req.body.name,
                    email: req.body.email,
                    id: req.body.id,
                },
                role: req.body.role,
            });

            res.status(200).json(response);
        } catch (error) {
            res.status(400).json({ error: (error as any).message });
        }
    });

    app.get('/tenants/:id', async (req, res) => {
        const tenant = await new TenantQuery(db).getTenantDataById(req.params.id);

        if (!tenant) {
            return res.status(404).json({ error: "Tenant não encontrado" });
        }

        res.status(200).json(tenant);
    });

    app.get('/tenants', async (req, res) => {
        const tenants = await new TenantQuery(db).getAllTenants();

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