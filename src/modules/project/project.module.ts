import { NodePgDatabase } from "drizzle-orm/node-postgres";
import AddTask from "./application/AddTask.js";
import ProjectRepositoryDatabase from "./repository/ProjectRepositoryDatabase.js";
import CreateProject from "./application/CreateProject.js";
import { AddTaskRequest, CreateProjectRequest, AssignTaskInput, ListProjectsRequest, ListTasksRequest, GetTaskRequest } from "./index.js";
import TaskRepositoryDatabase from "./repository/TaskRepositoryDatabase.js";
import { AssignTask } from "./application/AssignTask.js";
import UpdateTask from "./application/UpdateTask.js";
import ListProjects from "./application/ListProjects.js";
import ListTasks from "./application/ListTasks.js";
import GetTask from "./application/GetTask.js";
import ProjectQuery from "./query/ProjectQuery.js";
import { ProjectUserModule } from "./UserModule.js";

export default class ProjectModule {
    constructor(private readonly _db: NodePgDatabase, private readonly _userModule: ProjectUserModule) { }

    public async createProject(input: CreateProjectRequest) {
        return this._db.transaction(async (tx) => {
            const projectRepository = new ProjectRepositoryDatabase(tx);
            const createProject = new CreateProject(projectRepository);
            const authorizer = this._userModule.authorizer(createProject, ["project:create"]);

            return await authorizer.execute(input)
        });
    }

    public async addTask(input: AddTaskRequest) {
        return this._db.transaction(async (tx) => {
            const taskRepository = new TaskRepositoryDatabase(tx);
            const projectRepository = new ProjectRepositoryDatabase(tx);
            const addTask = new AddTask(taskRepository, projectRepository);
            const authorizer = this._userModule.authorizer(addTask, ['task:assign']);

            return await authorizer.execute(input);
        });
    }

    public async assignTask(input: AssignTaskInput) {
        return this._db.transaction(async (tx) => {
            const taskRepository = new TaskRepositoryDatabase(tx);
            const assignTask = new AssignTask(taskRepository, this._userModule);
            const authorizer = this._userModule.authorizer(assignTask, ['task:assign']);

            return await authorizer.execute(input);
        });
    }

    public async updateTask(input: any) {
        return this._db.transaction(async (tx) => {
            const taskRepository = new TaskRepositoryDatabase(tx);
            const updateTask = new UpdateTask(taskRepository);
            const authorizer = this._userModule.authorizer(updateTask, ['task:update']);

            return await authorizer.execute(input);
        });
    }

    public async listProjects(input: ListProjectsRequest) {
        const query = new ProjectQuery(this._db);
        const listProjects = new ListProjects(query);
        const authorizer = this._userModule.authorizer(listProjects, ['project:read']);

        return await authorizer.execute(input);
    }

    public async listTasks(input: ListTasksRequest) {
        const query = new ProjectQuery(this._db);
        const listTasks = new ListTasks(query);
        const authorizer = this._userModule.authorizer(listTasks, ['task:read']);

        return await authorizer.execute(input);
    }

    public async getTask(input: GetTaskRequest) {
        const query = new ProjectQuery(this._db);
        const getTask = new GetTask(query);
        const authorizer = this._userModule.authorizer(getTask, ['task:read']);

        return await authorizer.execute(input);
    }
}