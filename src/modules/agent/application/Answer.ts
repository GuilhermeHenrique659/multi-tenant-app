import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import Logger from "../../@common/Logger.js";
import { Queue } from "../../@common/queue/Queue.js";
import PlanService from "../domain/services/PlanService.js";
import { StepAnswered, AgentResumed } from "../domain/events/AgentEvents.js";
import AgentCriteria from "../repository/AgentCriteria.js";
import AgentMemoryRepository from "../repository/AgentMemoryRepository.js";
import AgentRepository from "../repository/AgentRepository.js";

/**
 * A agent that asks something stops on that step. Here the answer of the user
 * reaches it and the llm plans from it what was waiting for that data, so the
 * agent goes back to the queue instead of asking again.
 */
export default class Answer implements AuthorizerApplicationService<Input, Output> {
    constructor(
        private readonly _agentRepository: AgentRepository,
        private readonly _planService: PlanService,
        private readonly _queue: Queue,
        private readonly _memoryRepository: AgentMemoryRepository,
    ) { }

    public async execute(input: Input): Promise<Output> {
        const criteria = new AgentCriteria().getById(input.agentId).getByTenantId(input.tenantId);

        const agent = await this._agentRepository.get(criteria);

        if (!agent) throw new Error('agent not found');

        const stepAnswered = agent.answer(input.answer);

        await this._queue.publish(StepAnswered.from(agent, stepAnswered));

        const [planError, steps] = await this._planService.planFromAnswer({
            agent,
            answeredStep: stepAnswered,
            memory: await this._memoryRepository.get(agent.id),
            tenantId: input.tenantId,
            userId: input.userId,
        });

        if (planError) {
            Logger.error(`Agent ${agent.id}: planning from the answer failed: ${planError.message}`);

            throw planError;
        }

        Logger.info(`Agent ${agent.id}: planned ${steps.length} steps from the answer of step ${stepAnswered.order}`);

        agent.replan(steps);

        await this._agentRepository.save(agent);

        await this._queue.publish(AgentResumed.from(agent, input.userId));

        return { agentId: agent.id };
    }
}

type Input = AuthorizedInput & {
    agentId: string;
    answer: {
        stepId: string;
        data: string;
    }
}

type Output = {
    agentId: string;
}
