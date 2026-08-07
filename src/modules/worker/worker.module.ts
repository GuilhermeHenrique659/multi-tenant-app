import { NodePgDatabase } from "drizzle-orm/node-postgres";
import Logger from "../@common/Logger.js";
import Mediator from "../@common/Mediator.js";
import Orchestrator from "./application/Orchestrator.js";
import Planner from "./application/Planner.js";
import PlanService from "./domain/PlanService.js";
import StepService from "./domain/StepService.js";
import LLMGateway from "./gateway/LLMGateway.js";
import DeferredQueue from "./queue/DeferredQueue.js";
import { Queue } from "./queue/Queue.js";
import WorkerRepositoryDatabase from "./repository/WorkerRepositoryDatabase.js";
import { PlanWorkerOutput, PlanWorkerRequest, RunWorkerRequest } from "./index.js";

export const WorkerModuleKey = "WorkerModule";

export default class WorkerModule {
    constructor(
        private readonly _db: NodePgDatabase,
        private readonly _llmGateway: LLMGateway,
        private readonly _queue: Queue,
        private readonly _mediator: Mediator,
    ) { }

    public async plan(input: PlanWorkerRequest): Promise<PlanWorkerOutput> {
        const deferredQueue = new DeferredQueue(this._queue);

        const output = await this._db.transaction(async (tx) => {
            const workerRepository = new WorkerRepositoryDatabase(tx);
            const planner = new Planner(workerRepository, new PlanService(this._llmGateway), deferredQueue);

            return planner.execute(input);
        });

        await deferredQueue.flush();

        return output;
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
