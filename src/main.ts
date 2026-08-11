import express, { NextFunction, Request, Response } from 'express';
import InMemoryQueue from './modules/@common/queue/InMemoryQueue.js';
import loadOpenRouterConfig from './modules/worker/gateway/openRouterConfig.js';
import Logger from './modules/@common/Logger.js';
import Mediator from './modules/@common/Mediator.js';
import OpenRouterLLMGateway from './modules/worker/gateway/OpenRouterLLMGateway.js';
import ProjectModule from './modules/project/project.module.js';
import registerCapabilities from './modules/capabilities.js';
import routers from './modules/router.js';
import TenantModule from './modules/tenant/tenant.module.js';
import UserModule, { ProjectUserModuleKey } from './modules/user/user.module.js';
import WorkerEventStream from './modules/worker/WorkerEventStream.js';
import WorkerModule, { WorkerModuleKey } from './modules/worker/worker.module.js';
import { AddMemberInput, CreateTenantInput } from './modules/tenant/index.js';
import { Container } from './modules/@common/Container.js';
import { db } from './db/config.js';
import { dirname, join } from 'node:path';
import { EventStream, EventStreamsKey } from './modules/sse/index.js';
import { fileURLToPath } from 'node:url';
import { QueueKey } from './modules/@common/queue/Queue.js';
import { requiredEnv } from './modules/@common/Env.js';
import { TenantUserModuleKey } from './modules/tenant/UserModule.js';
import { WorkerUserModuleKey } from './modules/worker/UserModule.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CreateSuperAdmin = async () => {
    const userModule = new UserModule(db);

    try {
        await userModule.createSuperUser({ name: requiredEnv('SUPER_ADMIN_NAME'), email: requiredEnv('SUPER_ADMIN_EMAIL') });
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

    const userModule = new UserModule(db);
    container.register(ProjectUserModuleKey, userModule);
    container.register(TenantUserModuleKey, userModule);
    container.register(WorkerUserModuleKey, userModule);

    const projectModule = new ProjectModule(db, userModule);
    const tenantModule = new TenantModule(db, mediator, userModule);
    await registerCapabilities(mediator, projectModule, tenantModule);

    const workerQueue = new InMemoryQueue();
    const workerModule = new WorkerModule(db, new OpenRouterLLMGateway(loadOpenRouterConfig()), workerQueue, mediator, userModule);
    await workerModule.listen();

    container.register(WorkerModuleKey, workerModule);
    container.register(QueueKey, workerQueue);

    const eventStreams = new Map<string, EventStream>([
        ['workers', new WorkerEventStream(workerModule)],
    ]);
    container.register(EventStreamsKey, eventStreams);

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

    const frontendBuildPath = join(__dirname, '../frontend/dist');
    app.use(express.static(frontendBuildPath));

    app.get('/*splat', (req, res) => {
        res.sendFile(join(frontendBuildPath, 'index.html'));
    });

    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
}

await main();