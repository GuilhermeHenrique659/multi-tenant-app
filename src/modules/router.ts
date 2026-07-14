import { Path, RouterHandler } from "./@common/RouterHandler.js";
import ProjectRoutes from "./project/project.routes.js";
import TetantRoutes from "./tenant/tenant.routes.js";
import UserRoutes from "./user/user.routes.js";

const routers: Map<Path, RouterHandler> = new Map([
    ['/users', UserRoutes],
    ['/tenants', TetantRoutes],
    ['/projects', ProjectRoutes]
]);

export default routers;