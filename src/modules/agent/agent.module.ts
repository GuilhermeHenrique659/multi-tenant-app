import Answer from "./application/Answer.js";
import DeferredQueue from "../@common/queue/DeferredQueue.js";
import ListAgents from "./application/ListAgents.js";
import LLMGateway from "./gateway/LLMGateway.js";
import Logger from "../@common/Logger.js";
import Mediator from "../@common/Mediator.js";
import Orchestrator from "./application/Orchestrator.js";
import Planner from "./application/Planner.js";
import PlanService from "./domain/services/PlanService.js";
import ResumeAgent from "./application/ResumeAgent.js";
import StepService from "./domain/services/StepService.js";
import AgentMemoryRepositoryInMemory from "./repository/AgentMemoryRepositoryInMemory.js";
import AgentQuery from "./query/AgentQuery.js";
import AgentRepositoryDatabase from "./repository/AgentRepositoryDatabase.js";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Queue } from "../@common/queue/Queue.js";
import { AgentUserModule } from "./UserModule.js";
import { AnswerStepRequest, ListAgentsRequest, PlanAgentOutput, PlanAgentRequest, ResumeAgentRequest, RunAgentRequest, AgentListItem } from "./index.js";

export const AgentModuleKey = "AgentModule";

export default class AgentModule {
    /**
     * One instance for the whole module, so what a run recorded is still there
     * when the same agent runs again. It lives only in the process for now.
     */
    private readonly _memoryRepository = new AgentMemoryRepositoryInMemory();

    constructor(
        private readonly _db: NodePgDatabase,
        private readonly _llmGateway: LLMGateway,
        private readonly _queue: Queue,
        private readonly _mediator: Mediator,
        private readonly _userModule: AgentUserModule,
    ) { }

    private async runAgentSubscriber(data: RunAgentRequest) {
        Logger.info(`Running agent ${data.agentId}`);

        await this.run(data);

        Logger.info(`Agent ${data.agentId} finished`);
    }

    public async plan(input: PlanAgentRequest): Promise<PlanAgentOutput> {
        const deferredQueue = new DeferredQueue(this._queue);

        const output = await this._db.transaction(async (tx) => {
            const agentRepository = new AgentRepositoryDatabase(tx);
            const planner = new Planner(agentRepository, new PlanService(this._llmGateway), deferredQueue);
            const authorizer = this._userModule.authorizer(planner, ['agent:create']);

            return authorizer.execute(input);
        });

        await deferredQueue.flush();

        return output;
    }

    /**
     * The llm plans again what is left of a agent that stopped, and the run goes
     * back to the queue with the new steps.
     */
    public async resume(input: ResumeAgentRequest): Promise<PlanAgentOutput> {
        const deferredQueue = new DeferredQueue(this._queue);

        const output = await this._db.transaction(async (tx) => {
            const agentRepository = new AgentRepositoryDatabase(tx);
            const resumeAgent = new ResumeAgent(agentRepository, new PlanService(this._llmGateway), deferredQueue, this._memoryRepository);
            const authorizer = this._userModule.authorizer(resumeAgent, ['agent:resume']);

            return authorizer.execute(input);
        });

        await deferredQueue.flush();

        return output;
    }

    /**
     * The answer of the user reaches the step that was asking, the llm plans what
     * was waiting for it and the run goes back to the queue.
     */
    public async answer(input: AnswerStepRequest): Promise<PlanAgentOutput> {
        const deferredQueue = new DeferredQueue(this._queue);

        const output = await this._db.transaction(async (tx) => {
            const agentRepository = new AgentRepositoryDatabase(tx);
            const answerStep = new Answer(agentRepository, new PlanService(this._llmGateway), deferredQueue, this._memoryRepository);
            const authorizer = this._userModule.authorizer(answerStep, ['agent:resume']);

            return authorizer.execute(input);
        });

        await deferredQueue.flush();

        return output;
    }

    public async listAgents(input: ListAgentsRequest): Promise<AgentListItem[]> {
        const listAgents = new ListAgents(new AgentQuery(this._db));
        const authorizer = this._userModule.authorizer(listAgents, ['agent:read']);

        return await authorizer.execute(input);
    }

    /**
     * Each step is dispatched to another module, which opens its own transaction,
     * so the run itself is not wrapped in one. The step events go straight to the
     * queue for the same reason: there is no commit to wait for.
     */
    public async run(input: RunAgentRequest): Promise<void> {
        const agentRepository = new AgentRepositoryDatabase(this._db);
        const orchestrator = new Orchestrator(agentRepository, new StepService(this._llmGateway), this._mediator, this._queue, this._memoryRepository);

        await orchestrator.execute(input);
    }

    /** A agent runs when it is created and every time it is resumed. */
    public async listen(): Promise<void> {
        await this._queue.subscriber('AgentCreated', (data) => this.runAgentSubscriber(data));
        await this._queue.subscriber('AgentResumed', (data) => this.runAgentSubscriber(data));
    }
}
