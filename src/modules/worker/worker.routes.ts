import { Router, Request, Response } from "express";
import { Container } from "../@common/Container.js";
import { authenticationMiddleware } from "../@common/Middleware.js";
import WorkerModule, { WorkerModuleKey } from "./worker.module.js";

function getHeader(req: Request, name: string): string {
    const lowerName = name.toLowerCase();
    const value = req.headers[lowerName];
    if (!value) throw new Error(`${name} header is required`);
    const result = Array.isArray(value) ? value[0] : value;
    if (!result) throw new Error(`${name} header is required`);
    return result;
}

const WorkerRoutes = (container: Container) => {
    const workerRoutes = Router();
    const workerModule = container.get<WorkerModule>(WorkerModuleKey);

    workerRoutes.post('/',
        authenticationMiddleware,
        async (req: Request, res: Response) => {
            const tenantId = getHeader(req, 'x-tenant-id');
            const userId = getHeader(req, 'x-user-id');

            const result = await workerModule.plan({
                tenantId,
                userId,
                userPrompt: req.body.userPrompt as string,
                ...(req.body.file ? { file: req.body.file as string } : {}),
            });

            res.status(201).json(result);
        }
    );

    workerRoutes.get('/',
        authenticationMiddleware,
        async (req: Request, res: Response) => {
            const tenantId = getHeader(req, 'x-tenant-id');
            const userId = getHeader(req, 'x-user-id');

            const result = await workerModule.listWorkers({ tenantId, userId });

            res.status(200).json(result);
        }
    );

    workerRoutes.post('/:workerId/resume',
        authenticationMiddleware,
        async (req: Request, res: Response) => {
            const tenantId = getHeader(req, 'x-tenant-id');
            const userId = getHeader(req, 'x-user-id');

            const result = await workerModule.resume({
                tenantId,
                userId,
                workerId: req.params.workerId as string,
            });

            res.status(202).json(result);
        }
    );

    workerRoutes.post('/:workerId/answer',
        authenticationMiddleware,
        async (req: Request, res: Response) => {
            const tenantId = getHeader(req, 'x-tenant-id');
            const userId = getHeader(req, 'x-user-id');

            const result = await workerModule.answer({
                tenantId,
                userId,
                workerId: req.params.workerId as string,
                answer: {
                    stepId: req.body.stepId,
                    data: req.body.answer,
                }
            });

            res.status(202).json(result);
        }
    );

    return workerRoutes;
}

export default WorkerRoutes;
