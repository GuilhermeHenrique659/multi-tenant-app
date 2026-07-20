import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { ProjectTable } from "../db/ProjectTable.js";
import { TaskTable } from "../db/TaskTable.js";
import { UserTable } from "../../user/db/UserTable.js";
import { and, eq } from "drizzle-orm";
import { ProjectListItem, TaskListItem, TaskWithAssignee } from "../index.js";

export default class ProjectQuery {
    constructor(private readonly _db: NodePgDatabase) { }

    public async listProjectsByTenantId(tenantId: string): Promise<ProjectListItem[]> {
        const results = await this._db.select()
            .from(ProjectTable)
            .where(eq(ProjectTable.tenantId, tenantId));

        return results.map(row => ({
            id: row.id,
            name: row.name,
            status: row.status,
            tenantId: row.tenantId,
            createdAt: row.createdAt,
        }));
    }

    public async listTasksByProjectId(projectId: string): Promise<TaskListItem[]> {
        const results = await this._db.select()
            .from(TaskTable)
            .where(eq(TaskTable.projectId, projectId));

        return results.map(row => ({
            id: row.id,
            name: row.name,
            status: row.status,
            startAt: row.startAt,
            endAt: row.endAt,
            projectId: row.projectId,
            assigneeId: row.assigneeId,
            createdAt: row.createdAt,
        }));
    }

    public async getTaskWithAssignee(taskId: string): Promise<TaskWithAssignee | null> {
        const results = await this._db.select({
            id: TaskTable.id,
            name: TaskTable.name,
            status: TaskTable.status,
            startAt: TaskTable.startAt,
            endAt: TaskTable.endAt,
            projectId: TaskTable.projectId,
            assigneeId: TaskTable.assigneeId,
            createdAt: TaskTable.createdAt,
            assigneeName: UserTable.name,
            assigneeEmail: UserTable.email,
        })
            .from(TaskTable)
            .leftJoin(UserTable, eq(TaskTable.assigneeId, UserTable.id))
            .where(eq(TaskTable.id, taskId));

        if (!results[0]) return null;

        const row = results[0];
        return {
            id: row.id,
            name: row.name,
            status: row.status,
            startAt: row.startAt,
            endAt: row.endAt,
            projectId: row.projectId,
            assigneeId: row.assigneeId,
            createdAt: row.createdAt,
            assignee: row.assigneeName ? {
                id: row.assigneeId!,
                name: row.assigneeName,
                email: row.assigneeEmail!,
            } : null,
        };
    }
}