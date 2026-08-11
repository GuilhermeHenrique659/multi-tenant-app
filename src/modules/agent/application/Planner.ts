import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import Logger from "../../@common/Logger.js";
import PlanService from "../domain/services/PlanService.js";
import StepCollection from "../domain/entity/StepCollection.js";
import Agent from "../domain/entity/Agent.js";
import AgentType from "../domain/entity/AgentType.js";
import { Queue } from "../../@common/queue/Queue.js";
import { AgentCreated } from "../domain/events/AgentEvents.js";
import AgentRepository from "../repository/AgentRepository.js";

export default class Planner implements AuthorizerApplicationService<Input, Output> {
    constructor(private readonly agentRepository: AgentRepository, private readonly planService: PlanService, private readonly _queue: Queue) { }

    public async execute(input: Input): Promise<Output> {
        const [planError, plan] = await this.planService.create({
            userPrompt: input.userPrompt,
            tenantId: input.tenantId,
            userId: input.userId,
        });

        if (planError) {
            Logger.error(`Planning failed: ${planError.message}`);

            throw planError;
        }

        Logger.info(`Planned "${plan.name}" with ${plan.steps.length} steps`);

        const agent = Agent.create(input.tenantId, plan.name, input.userPrompt, AgentType.create(plan.type), StepCollection.empty());

        agent.plan(plan.steps);

        await this.agentRepository.save(agent);

        await this._queue.publish(AgentCreated.from(agent, input.userId))

        return {
            agentId: agent.id
        }
    }
}

type Input = AuthorizedInput & {
    userPrompt: string;
    file?: string;
}

type Output = {
    agentId: string
}
