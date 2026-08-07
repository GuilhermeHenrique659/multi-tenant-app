import { NodePgDatabase } from "drizzle-orm/node-postgres";
import Logger from "../@common/Logger.js";
import Mediator from "../@common/Mediator.js";
import ListWorkers from "./application/ListWorkers.js";
import Orchestrator from "./application/Orchestrator.js";
import Planner from "./application/Planner.js";
import PlanService from "./domain/PlanService.js";
import StepService from "./domain/StepService.js";
import LLMGateway from "./gateway/LLMGateway.js";
import WorkerQuery from "./query/WorkerQuery.js";
import DeferredQueue from "./queue/DeferredQueue.js";
import { Queue } from "./queue/Queue.js";
import WorkerRepositoryDatabase from "./repository/WorkerRepositoryDatabase.js";
import { WorkerUserModule } from "./UserModule.js";
import { ListWorkersRequest, PlanWorkerOutput, PlanWorkerRequest, RunWorkerRequest, WorkerListItem } from "./index.js";

export const WorkerModuleKey = "WorkerModule";

export default class WorkerModule {
    constructor(
        private readonly _db: NodePgDatabase,
        private readonly _llmGateway: LLMGateway,
        private readonly _queue: Queue,
        private readonly _mediator: Mediator,
        private readonly _userModule: WorkerUserModule,
    ) { }

    public async plan(input: PlanWorkerRequest): Promise<PlanWorkerOutput> {
        const deferredQueue = new DeferredQueue(this._queue);

        const output = await this._db.transaction(async (tx) => {
            const workerRepository = new WorkerRepositoryDatabase(tx);
            const planner = new Planner(workerRepository, new PlanService(this._llmGateway), deferredQueue);
            const authorizer = this._userModule.authorizer(planner, ['worker:create']);

            return authorizer.execute(input);
        });

        await deferredQueue.flush();

        return output;
    }

    public async listWorkers(input: ListWorkersRequest): Promise<WorkerListItem[]> {
        const listWorkers = new ListWorkers(new WorkerQuery(this._db));
        const authorizer = this._userModule.authorizer(listWorkers, ['worker:read']);

        return await authorizer.execute(input);
    }

    /**
     * Each step is dispatched to another module, which opens its own transaction,
     * so the run itself is not wrapped in one.
     */
    public async run(input: RunWorkerRequest): Promise<void> {
        const workerRepository = new WorkerRepositoryDatabase(this._db);
        const orchestrator = new Orchestrator(workerRepository, new StepService(this._llmGateway), this._mediator);

        await orchestrator.execute(input);
    }

    public async listen(): Promise<void> {
        await this._queue.subscriber('WorkerCreated', async (data: RunWorkerRequest) => {
            Logger.info(`Running worker ${data.workerId}`);

            await this.run(data);

            Logger.info(`Worker ${data.workerId} finished`);
        });
    }
}
