import { Permissions } from "../../@common/Permissions.js";
import Task from "./Task.js";
import { UserTask } from "./UserTask.js";

export class TaskService {
    static assignUser(task: Task, user: UserTask, permissions: Array<string>) {
        const hasPermission = permissions.every(permission => {
            const allowedRoles = Permissions.get(permission);
            return allowedRoles?.includes(user.role) || false;
        });

        if (!hasPermission) throw new Error('user not has permission to be assign for a task');

        task.assigneeTo(user.id);
    }
}
