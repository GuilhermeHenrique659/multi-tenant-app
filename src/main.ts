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
import {Permissions} from './modules/@common/Permissions.js';

const tenantSubdomainMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const host = req.headers.host;

    if (!host) {
        return res.status(400).json({ error: "Host header is required" });
    }

    const hostWithoutPort = host.split(':')[0];

    const parts = hostWithoutPort?.split('.');

    if (parts && parts.length <= 2) {
        return res.status(400).json({ error: "Nenhum tenant especificado no subdomínio" });
    }

    const [subdomain] = parts as string[];

    if (subdomain === 'www') {
        return res.status(400).json({ error: "Acesso inválido" });
    }

    const [tenant] = await db.select().from(TenantTable).where(eq(TenantTable.subdomain, subdomain as string));

    if (!tenant) {
        return res.status(404).json({ error: "Tenant não encontrado" });
    }

    (req as any).tenant = tenant;
    next();
}

const permssionMiddleware = (permisssions: string[]) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = req.headers['x-user-id'];

    if (!user) {
        return res.status(401).json({ error: "User ID is required in x-user-id header" });
    }

    const tenant = req.headers['x-tenant-id'];

    if (!tenant) {
        return res.status(400).json({ error: "Tenant ID is required in x-tenant-id header" });
    }


    const userRole = await new TenantQuery(db).getUserRoleByTenantIdAndUserId(tenant as string, user as string);

    if (!userRole) {
        return res.status(403).json({ error: "User does not have access to this tenant" });
    }

    for (const permisssion of permisssions) {
        Permissions.get(permisssion)?.includes(userRole) ? next() : res.status(403).json({ error: "User does not have permission to access this resource" });
    }
}


async function main() {
    const app = express();

    app.use(express.json());

    const mockUser = User.create("Guilherme", "guilherme@example.com");
    await db.insert(UserTable).values({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
    });

    const mediator = new Mediator();
    mediator.register('checkInUser', async (data: any) => ({ userId: mockUser.id }));


    app.post('/tenants', async (req, res) => {
        const tenantRepository = new TenantRepositoryDatabase(db);

        const createTenant = new CreateTenant(tenantRepository);
        try {
            const response = await createTenant.execute(req.body);

            res.status(201).json(response);
        } catch (error) {
            res.status(400).json({ error: (error as any).message });
        }
    });


    app.get('/tenants/:id/users', permssionMiddleware(['tenant:users:read', 'tenant:users:add']), async (req, res) => {
        const tenantRepository = new TenantRepositoryDatabase(db);

        const addUserToTenant = new AddUserToTenant(tenantRepository, mediator);

        try {
            const response = await addUserToTenant.execute({
                tenantId: req.params.id as string,
                user: {
                    name: "Guilherme",
                    email: "guilherme@example.com"
                },
                role: 'admin',
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