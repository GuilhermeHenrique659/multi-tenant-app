import { NodePgDatabase } from "drizzle-orm/node-postgres";
import ProjectRepositoryDatabase from "./repository/ProjectRepositoryDatabase.js";
import CreateProject from "./application/CreateProject.js";
import UserAuthorizer from "../user/application/UserAuthorizer.js";
import UserQuery from "../user/query/UserQuery.js";
import { CreateProjectRequest } from "./index.js";

export default class ProjectModule {
    constructor(private readonly _db: NodePgDatabase) { }

    public async createProject(input: CreateProjectRequest) {
        return this._db.transaction(async (tx) => {
            const projectRepository = new ProjectRepositoryDatabase(tx);
            const createProject = new CreateProject(projectRepository);
            const authorizer = new UserAuthorizer(["project:create"], createProject, new UserQuery(tx));

            return await authorizer.execute(input)
        })
    }
}