import { Path, RouterHandler } from "./@common/RouterHandler.js";
import ProjectRoutes from "./project/project.routes.js";
import SseRoutes from "./sse/sse.routes.js";
import TetantRoutes from "./tenant/tenant.routes.js";
import UserRoutes from "./user/user.routes.js";
import AgentRoutes from "./agent/agent.routes.js";

const routers: Map<Path, RouterHandler> = new Map([
    ['/users', UserRoutes],
    ['/tenants', TetantRoutes],
    ['/projects', ProjectRoutes],
    ['/agents', AgentRoutes],
    ['/events', SseRoutes]
]);

export default routers;