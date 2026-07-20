import express, { NextFunction, Request, Response } from 'express';
import Mediator from './modules/@common/Mediator.js';
import UserModuleImpl, { ProjectUserModuleKey } from './modules/user/user.module.js';

import { db } from './db/config.js';
import { tenantSubdomainMiddleware } from './modules/@common/Middleware.js';
import { AddMemberInput, CreateTenantInput } from './modules/tenant/index.js';
import routers from './modules/router.js';
import { Container } from './modules/@common/Container.js';
import Logger from './modules/@common/Logger.js';
import path from 'node:path';
import { dirname } from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CreateSuperAdmin = async () => {
    const userModule = new UserModuleImpl(db);

    try {
        await userModule.createSuperUser({ name: process.env.SUPER_ADMIN_NAME!, email: process.env.SUPER_ADMIN_EMAIL! });
        console.log('Super admin user created successfully');
    } catch (error) {
        console.error('Failed to create super admin user:', (error as any).message);
    }
}

async function main() {
    const app = express();

    app.use(express.json());
    const container = new Container(new Map());
    const mediator = new Mediator();
    container.register('mediator', mediator);

    const userModule = new UserModuleImpl(db);
    container.register(ProjectUserModuleKey, userModule);

    mediator.register('checkInUser', async (input: any) => {
        return userModule.checkInUser(input);
    });

    mediator.register('createTenantFail', async (input: CreateTenantInput) => {
        try {
            await userModule.removeUser({
                id: input.admin.userId,
                email: input.admin.email,
            })
        } catch (error) {
            Logger.error('Failed to rollback user creation after tenant creation failure:', (error as any).message);
        }
    });

    mediator.register('addMemberFail', async (input: AddMemberInput) => {
        try {
            await userModule.removeUser({
                id: input.userId,
                email: input.email,
            })
        } catch (error) {
            Logger.error('Failed to rollback user creation after member addition failure:', (error as any).message);
        }
    });

    await CreateSuperAdmin();
    //Error Handle middleware
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        console.log(err);

        Logger.error(`Error: ${req.method} ${req.url}: ${(err as any).message}`);

        if (err instanceof Error) {
            return res.status(400).json({ error: err.message });
        }

        res.status(500).json({ error: 'Internal Server Error' });
    });

    //Logger middleware
    app.use((req: Request, res: Response, next: NextFunction) => {
        Logger.info(`Incoming request: ${req.method} ${req.url}`);
        next();
    });

    routers.forEach((routerHandler, path) => {
        Logger.info(`Registering router for path: /api${path}`);
        app.use(`/api${path}`, routerHandler(container));
    });

    const frontendBuildPath = path.join(__dirname, '../frontend/dist');
    app.use(express.static(frontendBuildPath));

    app.get('/*splat', (req, res) => {
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });

    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
}

await main();