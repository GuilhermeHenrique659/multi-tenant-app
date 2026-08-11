import { Router, Request, Response } from "express";
import { Container } from "../@common/Container.js";
import { authenticationMiddleware } from "../@common/Middleware.js";
import AgentModule, { AgentModuleKey } from "./agent.module.js";

function getHeader(req: Request, name: string): string {
    const lowerName = name.toLowerCase();
    const value = req.headers[lowerName];
    if (!value) throw new Error(`${name} header is required`);
    const result = Array.isArray(value) ? value[0] : value;
    if (!result) throw new Error(`${name} header is required`);
    return result;
}

const AgentRoutes = (container: Container) => {
    const agentRoutes = Router();
    const agentModule = container.get<AgentModule>(AgentModuleKey);

    agentRoutes.post('/',
        authenticationMiddleware,
        async (req: Request, res: Response) => {
            const tenantId = getHeader(req, 'x-tenant-id');
            const userId = getHeader(req, 'x-user-id');

            const result = await agentModule.plan({
                tenantId,
                userId,
                userPrompt: req.body.userPrompt as string,
                ...(req.body.file ? { file: req.body.file as string } : {}),
            });

            res.status(201).json(result);
        }
    );

    agentRoutes.get('/',
        authenticationMiddleware,
        async (req: Request, res: Response) => {
            const tenantId = getHeader(req, 'x-tenant-id');
            const userId = getHeader(req, 'x-user-id');

            const result = await agentModule.listAgents({ tenantId, userId });

            res.status(200).json(result);
        }
    );

    agentRoutes.post('/:agentId/resume',
        authenticationMiddleware,
        async (req: Request, res: Response) => {
            const tenantId = getHeader(req, 'x-tenant-id');
            const userId = getHeader(req, 'x-user-id');

            const result = await agentModule.resume({
                tenantId,
                userId,
                agentId: req.params.agentId as string,
            });

            res.status(202).json(result);
        }
    );

    agentRoutes.post('/:agentId/answer',
        authenticationMiddleware,
        async (req: Request, res: Response) => {
            const tenantId = getHeader(req, 'x-tenant-id');
            const userId = getHeader(req, 'x-user-id');

            const result = await agentModule.answer({
                tenantId,
                userId,
                agentId: req.params.agentId as string,
                answer: {
                    stepId: req.body.stepId,
                    data: req.body.answer,
                }
            });

            res.status(202).json(result);
        }
    );

    return agentRoutes;
}

export default AgentRoutes;
