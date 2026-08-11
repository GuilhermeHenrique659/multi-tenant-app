import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import Logger from "../../@common/Logger.js";
import Mediator from "../../@common/Mediator.js";
import StepService from "../domain/services/StepService.js";
import Step from "../domain/entity/Step.js";
import AgentMemory from "../domain/entity/AgentMemory.js";
import Agent from "../domain/entity/Agent.js";
import { StepAsked, StepCompleted, StepFailed, StepStarted, AgentFinished } from "../domain/events/AgentEvents.js";
import { Queue } from "../../@common/queue/Queue.js";
import AgentCriteria from "../repository/AgentCriteria.js";
import AgentMemoryRepository from "../repository/AgentMemoryRepository.js";
import AgentRepository from "../repository/AgentRepository.js";

export default class Orchestrator implements AuthorizerApplicationService<Input, void> {
    constructor(
        private readonly agentRepository: AgentRepository,
        private readonly stepService: StepService,
        private readonly _mediator: Mediator = new Mediator(),
        private readonly _queue: Queue,
        private readonly _memoryRepository: AgentMemoryRepository,
    ) { }

    public async execute(input: Input): Promise<void> {
        const criteria = new AgentCriteria().getById(input.agentId).getByTenantId(input.tenantId);

        const agent = await this.agentRepository.get(criteria);

        if (!agent) throw new Error('agent not found');

        // What the previous runs already produced, so a resumed run does not need it again.
        const memory = await this._memoryRepository.get(agent.id);

        while (!agent.isDone()) {
            const step = agent.nextStep();

            if (!step) break;

            if (step.isAsk()) {
                await this._queue.publish(StepAsked.from(agent, step));

                break;
            } else if (step.isAction()) {
                // Saved before the event so whoever reloads the screen also sees the step running.
                step.setAsRunning();
                await this.agentRepository.save(agent);
                await this._queue.publish(StepStarted.from(agent, step));

                await this._executeActionStep(input, step, agent, memory)
            }
        }

        await this.agentRepository.save(agent);

        if (agent.isDone()) await this._queue.publish(AgentFinished.from(agent));
    }

    private async _executeActionStep(input: Input, step: Step, agent: Agent, memory: AgentMemory) {
        const [inputError, stepInput] = await this.stepService.resolveInput({
            step,
            memory,
            tenantId: input.tenantId,
            userId: input.userId,
        });

        if (inputError) {
            step.setAsError(inputError.message);
            return this._stop(agent, inputError, step);
        }

        let output: unknown;
        try {
            output = await this._mediator.notify(step.action, stepInput);
            step.setAsComplete();
        } catch (err) {
            const error = err instanceof Error ? err : new Error('step action failed');

            step.setAsError(error.message);
            return this._stop(agent, error, step);
        }

        // The action already ran, so the step stays complete even if the memory cannot be built.
        const [factsError, facts] = await this.stepService.interpretOutput({ step, output });

        // What it produced is recorded even when it could not be normalized, so a
        // run that starts again does not create the same thing twice.
        memory.record({ order: step.order, action: step.action, input: stepInput, output: factsError ? output : facts });
        await this._memoryRepository.save(agent.id, memory);

        if (factsError) {
            return this._stop(agent, factsError, step);
        }

        await this.agentRepository.save(agent);
        await this._queue.publish(StepCompleted.from(agent, step));

        Logger.info(`Agent ${agent.id} step ${step.order} ${step.action}: ran`);
    }

    /**
     * Persists what the steps reached before giving the failure back to the
     * caller. Every failure passes through here, so this is the only place that
     * reports one.
     */
    private async _stop(agent: Agent, error: Error, step?: Step): Promise<never> {
        await this.agentRepository.save(agent);

        Logger.error(`Agent ${agent.id} step ${step?.order ?? '?'} ${step?.action ?? ''}: failed: ${error.message}`);

        if (step) await this._queue.publish(StepFailed.from(agent, step));

        throw error;
    }
}

type Input = AuthorizedInput & {
    agentId: string
}
