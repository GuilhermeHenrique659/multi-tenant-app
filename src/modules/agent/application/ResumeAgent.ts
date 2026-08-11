import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import Logger from "../../@common/Logger.js";
import { Queue } from "../../@common/queue/Queue.js";
import PlanService from "../domain/services/PlanService.js";
import { AgentResumed } from "../domain/events/AgentEvents.js";
import AgentCriteria from "../repository/AgentCriteria.js";
import AgentMemoryRepository from "../repository/AgentMemoryRepository.js";
import AgentRepository from "../repository/AgentRepository.js";

/**
 * A agent that failed stops where it was. Here the llm reads the plan as it
 * stopped, decides what is still missing and the agent goes back to the queue
 * with those steps, so the orchestrator runs it from where it stopped.
 */
export default class ResumeAgent implements AuthorizerApplicationService<Input, Output> {
    constructor(
        private readonly agentRepository: AgentRepository,
        private readonly planService: PlanService,
        private readonly _queue: Queue,
        private readonly _memoryRepository: AgentMemoryRepository,
    ) { }

    public async execute(input: Input): Promise<Output> {
        const criteria = new AgentCriteria().getById(input.agentId).getByTenantId(input.tenantId);

        const agent = await this.agentRepository.get(criteria);

        if (!agent) throw new Error('agent not found');

        if (agent.isDone()) throw new Error('agent is already done');

        const [planError, steps] = await this.planService.replan({
            agent,
            memory: await this._memoryRepository.get(agent.id),
            tenantId: input.tenantId,
            userId: input.userId,
        });

        if (planError) {
            Logger.error(`Agent ${agent.id}: replanning failed: ${planError.message}`);

            throw planError;
        }

        Logger.info(`Agent ${agent.id}: replanned with ${steps.length} steps`);

        agent.replan(steps);

        await this.agentRepository.save(agent);

        await this._queue.publish(AgentResumed.from(agent, input.userId));

        return { agentId: agent.id };
    }
}

type Input = AuthorizedInput & {
    agentId: string;
}

type Output = {
    agentId: string;
}
