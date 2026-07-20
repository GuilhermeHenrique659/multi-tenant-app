import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import ProjectQuery from "../query/ProjectQuery.js";
import { ListProjectsRequest, ProjectListItem } from "../index.js";

export default class ListProjects implements AuthorizerApplicationService<ListProjectsRequest, ProjectListItem[]> {
    constructor(private readonly _query: ProjectQuery) { }

    async execute(input: ListProjectsRequest): Promise<ProjectListItem[]> {
        return this._query.listProjectsByTenantId(input.tenantId);
    }
}