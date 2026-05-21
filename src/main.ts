import express from 'express';
import CreateTenant from './modules/tenant/application/CreateTenant.js';
import TenantRepositoryDatabase from './modules/tenant/repository/TenantRepositoryDatabase.js';
import { db } from './db/config.js';
import { TenantTable } from './modules/tenant/db/TenantTable.js';
import { eq } from 'drizzle-orm';

const tenantMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const host = req.headers.host; // ex: "empresa.meusistema.com" ou "empresa.lvh.me:3000"

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

async function main() {
    const app = express();

    app.use(express.json());

    const tenantRepository = new TenantRepositoryDatabase(db);

    app.post('/tenants', async (req, res) => {
        const createTenant = new CreateTenant(tenantRepository);
        try {
            const response = await createTenant.execute(req.body);
            
            res.status(201).json(response);
        } catch (error) {
            res.status(400).json({ error: (error as any).message  });
        }
    });

    app.get('/tenants', async (req, res) => {
        const tenants = await db.select().from(TenantTable);
        
        res.status(200).json(tenants);
    });

    app.get("/", tenantMiddleware, (req, res) => {
        res.status(200).json((req as any).tenant);
    });

    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
}

await main();