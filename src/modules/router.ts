import { Path, RouterHandler } from "./@common/RouterHandler.js";
import ProjectRoutes from "./project/project.routes.js";
import TetantRoutes from "./tenant/tenant.routes.js";
import UserRoutes from "./user/user.routes.js";
import WorkerRoutes from "./worker/worker.routes.js";

const routers: Map<Path, RouterHandler> = new Map([
    ['/users', UserRoutes],
    ['/tenants', TetantRoutes],
    ['/projects', ProjectRoutes],
    ['/workers', WorkerRoutes]
]);

export default routers;