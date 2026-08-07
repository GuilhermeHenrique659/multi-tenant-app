import Mediator from "./@common/Mediator.js";
import ProjectModule from "./project/project.module.js";
import TenantModuleImpl from "./tenant/tenant.module.js";

/**
 * Every action a worker can dispatch, wired to the use case that runs it.
 * The keys must match `action` in worker/domain/ModuleCapabilities.ts, and the
 * module facades keep the permission check of each use case in place.
 */
export default async function registerCapabilities(
    mediator: Mediator,
    projectModule: ProjectModule,
    tenantModule: TenantModuleImpl,
): Promise<void> {
    await mediator.register('createProject', async (input: any) => projectModule.createProject(input));
    await mediator.register('listProjects', async (input: any) => projectModule.listProjects(input));
    await mediator.register('addTask', async (input: any) => projectModule.addTask(input));
    await mediator.register('updateTask', async (input: any) => projectModule.updateTask(input));
    await mediator.register('assignTask', async (input: any) => projectModule.assignTask(input));
    await mediator.register('listTasks', async (input: any) => projectModule.listTasks(input));
    await mediator.register('getTask', async (input: any) => projectModule.getTask(input));

    await mediator.register('addMember', async (input: any) => tenantModule.addMember(input));
    await mediator.register('updateMember', async (input: any) => tenantModule.updateMember(input));
    await mediator.register('removeMember', async (input: any) => tenantModule.removeMember(input));
    await mediator.register('getTenant', async (input: any) => tenantModule.getById(input));
}
