import ChangeTrackingObserver from "../../@common/ChangeTrackingObserver.js";
import Id from "../../@common/Id.js";
import Project from "../domain/Project.js";
import ProjectRepository from "./ProjectRepository.js";
import ProjectStatus from "../domain/ProjectStatus.js";
import { BaseCriteria } from "../../@common/Criteria.js";
import { DrizzleCriteriaApply } from "../../@common/DrizzleCriteriaApply.js";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { ProjectTable } from "../db/ProjectTable.js";

export default class ProjectRepositoryDatabase implements ProjectRepository {
    constructor(private readonly _db: NodePgDatabase, private readonly _changeTracking = new Map<string, ChangeTrackingObserver>()) { }

    async save(project: Project): Promise<void> {
        if (this._changeTracking.has(project.id())) {
            await this._db.update(ProjectTable).set({
                name: project.name(),
                status: project.status(),
            })
                .where(eq(ProjectTable.id, project.id()));
        } else {
            await this._db.insert(ProjectTable).values({
                id: project.id(),
                name: project.name(),
                status: project.status(),
                createdAt: project.createAt(),
                tenantId: project.tenantId(),
            });
        }
    }

    async has(criteria: BaseCriteria): Promise<boolean> {
        const result = await this._db.select().from(ProjectTable).where(DrizzleCriteriaApply(criteria, ProjectTable)).limit(1);

        return result.length > 0;
    }

    async get(criteria: BaseCriteria): Promise<Project | null> {
        const [result] = await this._db.select().from(ProjectTable).where(DrizzleCriteriaApply(criteria, ProjectTable)).limit(1);

        if (!result) return null;

        const project = new Project({
            id: new Id(result.id),
            name: result.name,
            status: ProjectStatus.create(result.status),
            tenantId: new Id(result.tenantId),
            createdAt: result.createdAt,
        });

        const changeTracking = new ChangeTrackingObserver();
        project.subscribe(changeTracking);
        this._changeTracking.set(project.id(), changeTracking);

        return project;
    }
}