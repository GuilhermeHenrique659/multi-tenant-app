import Answer from "./application/Answer.js";
import DeferredQueue from "../@common/queue/DeferredQueue.js";
import ListWorkers from "./application/ListWorkers.js";
import LLMGateway from "./gateway/LLMGateway.js";
import Logger from "../@common/Logger.js";
import Mediator from "../@common/Mediator.js";
import Orchestrator from "./application/Orchestrator.js";
import Planner from "./application/Planner.js";
import PlanService from "./domain/services/PlanService.js";
import ResumeWorker from "./application/ResumeWorker.js";
import StepService from "./domain/services/StepService.js";
import WorkerMemoryRepositoryInMemory from "./repository/WorkerMemoryRepositoryInMemory.js";
import WorkerQuery from "./query/WorkerQuery.js";
import WorkerRepositoryDatabase from "./repository/WorkerRepositoryDatabase.js";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Queue } from "../@common/queue/Queue.js";
import { WorkerUserModule } from "./UserModule.js";
import { AnswerStepRequest, ListWorkersRequest, PlanWorkerOutput, PlanWorkerRequest, ResumeWorkerRequest, RunWorkerRequest, WorkerListItem } from "./index.js";

export const WorkerModuleKey = "WorkerModule";

export default class WorkerModule {
    /**
     * One instance for the whole module, so what a run recorded is still there
     * when the same worker runs again. It lives only in the process for now.
     */
    private readonly _memoryRepository = new WorkerMemoryRepositoryInMemory();

    constructor(
        private readonly _db: NodePgDatabase,
        private readonly _llmGateway: LLMGateway,
        private readonly _queue: Queue,
        private readonly _mediator: Mediator,
        private readonly _userModule: WorkerUserModule,
    ) { }

    private async runWorkerSubscriber(data: RunWorkerRequest) {
        Logger.info(`Running worker ${data.workerId}`);

        await this.run(data);

        Logger.info(`Worker ${data.workerId} finished`);
    }

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

    /**
     * The llm plans again what is left of a worker that stopped, and the run goes
     * back to the queue with the new steps.
     */
    public async resume(input: ResumeWorkerRequest): Promise<PlanWorkerOutput> {
        const deferredQueue = new DeferredQueue(this._queue);

        const output = await this._db.transaction(async (tx) => {
            const workerRepository = new WorkerRepositoryDatabase(tx);
            const resumeWorker = new ResumeWorker(workerRepository, new PlanService(this._llmGateway), deferredQueue, this._memoryRepository);
            const authorizer = this._userModule.authorizer(resumeWorker, ['worker:resume']);

            return authorizer.execute(input);
        });

        await deferredQueue.flush();

        return output;
    }

    /**
     * The answer of the user reaches the step that was asking, the llm plans what
     * was waiting for it and the run goes back to the queue.
     */
    public async answer(input: AnswerStepRequest): Promise<PlanWorkerOutput> {
        const deferredQueue = new DeferredQueue(this._queue);

        const output = await this._db.transaction(async (tx) => {
            const workerRepository = new WorkerRepositoryDatabase(tx);
            const answerStep = new Answer(workerRepository, new PlanService(this._llmGateway), deferredQueue, this._memoryRepository);
            const authorizer = this._userModule.authorizer(answerStep, ['worker:resume']);

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
     * so the run itself is not wrapped in one. The step events go straight to the
     * queue for the same reason: there is no commit to wait for.
     */
    public async run(input: RunWorkerRequest): Promise<void> {
        const workerRepository = new WorkerRepositoryDatabase(this._db);
        const orchestrator = new Orchestrator(workerRepository, new StepService(this._llmGateway), this._mediator, this._queue, this._memoryRepository);

        await orchestrator.execute(input);
    }

    /** A worker runs when it is created and every time it is resumed. */
    public async listen(): Promise<void> {
        await this._queue.subscriber('WorkerCreated', (data) => this.runWorkerSubscriber(data));
        await this._queue.subscriber('WorkerResumed', (data) => this.runWorkerSubscriber(data));
    }
}
