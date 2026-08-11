import AuthorizerApplicationService from "../../@common/AuthorizerApplicationService.js";
import AgentQuery from "../query/AgentQuery.js";
import { ListAgentsRequest, AgentListItem } from "../index.js";

export default class ListAgents implements AuthorizerApplicationService<ListAgentsRequest, AgentListItem[]> {
    constructor(private readonly _query: AgentQuery) { }

    public async execute(input: ListAgentsRequest): Promise<AgentListItem[]> {
        return this._query.listAgentsByTenantId(input.tenantId);
    }
}
