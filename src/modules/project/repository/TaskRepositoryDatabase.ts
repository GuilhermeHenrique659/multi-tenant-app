import { NodePgDatabase } from "drizzle-orm/node-postgres";
import TaskRepository from "./TaskRepository.js";
import Task from "../domain/Task.js";
import { TaskTable } from "../db/TaskTable.js";
import { eq } from "drizzle-orm";
import { BaseCriteria } from "../../@common/Criteria.js";
import { DrizzleCriteriaApply } from "../../@common/DrizzleCriteriaApply.js";
import Id from "../../@common/Id.js";
import TaskStatus from "../domain/TaskStatus.js";
import DueDate from "../domain/DueDate.js";
import ChangeTrackingObserver from "../../@common/ChangeTrackingObserver.js";

export default class TaskRepositoryDatabase implements TaskRepository {
    constructor(private readonly _db: NodePgDatabase) { }

    public async save(task: Task): Promise<void> {
        const tracker = task.findObserver<ChangeTrackingObserver>(o => o instanceof ChangeTrackingObserver);

        if (!tracker || tracker.hasEvent("taskCreated")) {
            await this._db.insert(TaskTable).values({
                id: task.id(),
                name: task.name(),
                status: task.status(),
                createdAt: task.createdAt(),
                projectId: task.projectId(),
            });
        } else {
            await this._db.update(TaskTable).set({
                name: task.name(),
                startAt: task.startAt(),
                endAt: task.endAt(),
                assigneeId: task.assignId(),
                status: task.status(),
            }).where(eq(TaskTable.id, task.id()));
        }
    }

    public async has(criteria: BaseCriteria): Promise<boolean> {
        const result = await this._db.select().from(TaskTable).where(DrizzleCriteriaApply(criteria, TaskTable)).limit(1);

        return result.length > 0;
    }

    public async get(criteria: BaseCriteria): Promise<Task | null> {
        const [result] = await this._db.select().from(TaskTable).where(DrizzleCriteriaApply(criteria, TaskTable)).limit(1);

        if (!result) return null;

        const task = new Task({
            id: new Id(result.id),
            name: result.name,
            status: TaskStatus.create(result.status),
            dueDate: result.startAt ? DueDate.create(result.startAt, result.endAt ?? undefined) : null,
            createdAt: result.createdAt,
            projectId: new Id(result.projectId),
            assignId: result.assigneeId ? new Id(result.assigneeId) : null,
        });

        return task;
    }
}