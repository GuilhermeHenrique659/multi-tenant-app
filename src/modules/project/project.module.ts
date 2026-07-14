import { NodePgDatabase } from "drizzle-orm/node-postgres";
import ProjectRepositoryDatabase from "./repository/ProjectRepositoryDatabase.js";
import CreateProject from "./application/CreateProject.js";
import { CreateProjectRequest } from "./index.js";
import TaskRepositoryDatabase from "./repository/TaskRepositoryDatabase.js";
import { AssignTask } from "./application/AssignTask.js";
import { UserModule } from "./UserModule.js";

export default class ProjectModule {
    constructor(private readonly _db: NodePgDatabase, private readonly _userModule: UserModule) { }

    public async createProject(input: CreateProjectRequest) {
        return this._db.transaction(async (tx) => {
            const projectRepository = new ProjectRepositoryDatabase(tx);
            const createProject = new CreateProject(projectRepository);
            const authorizer = this._userModule.authorizer(createProject, ["project:create"]);

            return await authorizer.execute(input)
        });
    }

    public async assignTask(input: any) {
        return this._db.transaction(async (tx) => {
            const taskRepository = new TaskRepositoryDatabase(tx);
            const assignTask = new AssignTask(taskRepository, this._userModule);
            const authorizer = this._userModule.authorizer(assignTask, ['task:assign']);

            return await authorizer.execute(input);
        });
    }
}