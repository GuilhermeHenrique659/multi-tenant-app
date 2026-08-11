import { NextFunction, Request, Response } from "express";
import { TenantTable } from "../tenant/db/TenantTable.js";
import { db } from "../../db/config.js";
import { eq } from "drizzle-orm";
import TenantQuery from "../tenant/query/TenantQuery.js";
import { Permissions } from "./Permissions.js";
import UserQuery, { UserType } from "../user/query/UserQuery.js";
import UserModule from "../user/user.module.js";

export const tenantSubdomainMiddleware = async (req: Request, res: Response, next: NextFunction) => {
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

export const authenticationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ error: "User ID is required in x-user-id header" });
    }

    const user = await new UserQuery(db).getById(String(userId) as string);

    if (!user) {
        return res.status(401).json({ error: "User not found" });
    }

    (req as unknown as Record<string, unknown>).user = user;
    next();
}

export const superAdminPermissionMidleware = () => async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as unknown as Record<string, unknown>).user as UserType;

    if (user.isSuperAdmin) return next();

    return res.status(403).json({
        error: "User does not have permission to access this resource"
    });
}

export const permssionMiddleware = (permisssions: string[]) => async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as unknown as Record<string, unknown>).user as UserType;

    const tenant = req.headers['x-tenant-id'];

    if (!tenant) {
        return res.status(400).json({ error: "Tenant ID is required in x-tenant-id header" });
    }

    if (user.isSuperAdmin) return next();

    const hasAllPermissions = await new UserModule(db).hasPermissions(String(tenant) as string, String(user.id) as string, permisssions);

    if (!hasAllPermissions) {
        return res.status(403).json({
            error: "User does not have permission to access this resource"
        });
    }

    next();
}