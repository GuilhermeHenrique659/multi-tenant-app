import AuthorizerApplicationService from "../../@common/AuthorizerApplicationService.js";
import WorkerQuery from "../query/WorkerQuery.js";
import { ListWorkersRequest, WorkerListItem } from "../index.js";

export default class ListWorkers implements AuthorizerApplicationService<ListWorkersRequest, WorkerListItem[]> {
    constructor(private readonly _query: WorkerQuery) { }

    public async execute(input: ListWorkersRequest): Promise<WorkerListItem[]> {
        return this._query.listWorkersByTenantId(input.tenantId);
    }
}
