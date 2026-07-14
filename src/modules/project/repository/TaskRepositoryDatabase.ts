import { NodePgDatabase } from "drizzle-orm/node-postgres";
import TaskRepository from "./TaskRepository.js";
import ChangeTrackingObserver from "../../@common/ChangeTrackingObserver.js";
import Task from "../domain/Task.js";
import { TaskTable } from "../db/TaskTable.js";
import { eq } from "drizzle-orm";
import { BaseCriteria } from "../../@common/Criteria.js";
import { DrizzleCriteriaApply } from "../../@common/DrizzleCriteriaApply.js";
import Id from "../../@common/Id.js";
import TaskStatus from "../domain/TaskStatus.js";
import DueDate from "../domain/DueDate.js";

export default class TaskRepositoryDatabase implements TaskRepository {
    constructor(private readonly _db: NodePgDatabase, private readonly _changeTracking = new Map<string, ChangeTrackingObserver>()) { }

    public async save(task: Task): Promise<void> {
        if (this._changeTracking.has(task.id())) {
            await this._db.update(TaskTable).set({
                name: task.name(),
                startAt: task.startAt(),
                endAt: task.endAt(),
                assigneeId: task.assignId(),
                status: task.status(),
            }).where(eq(TaskTable.id, task.id()));
        } else {
            await this._db.insert(TaskTable).values({
                id: task.id(),
                name: task.name(),
                status: task.status(),
                createdAt: task.createdAt(),
                projectId: task.projectId(),
            })
        }
    }

    public async has(criteria: BaseCriteria): Promise<boolean> {
        const result = await this._db.select().from(TaskTable).where(DrizzleCriteriaApply(criteria, TaskTable)).limit(1);

        return result.length > 0;
    }

    public async get(criteria: BaseCriteria): Promise<Task | null> {
        const [result] = await this._db.select().from(TaskTable).where(DrizzleCriteriaApply(criteria, TaskTable)).limit(1);

        if (!result) return null;

        const changeTracking = new ChangeTrackingObserver();

        const task = new Task({
            id: new Id(result.id),
            name: result.name,
            status: TaskStatus.create(result.status),
            dueDate: result.startAt ? DueDate.create(result.startAt, result.endAt ?? undefined) : null,
            createdAt: result.createdAt,
            projectId: new Id(result.projectId),
            assignId: result.assigneeId ? new Id(result.assigneeId) : null,
        });

        task.subscribe(changeTracking);

        return task;
    }
}