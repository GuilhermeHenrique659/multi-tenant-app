import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import Logger from "../../@common/Logger.js";
import Mediator from "../../@common/Mediator.js";
import StepService from "../domain/StepService.js";
import Step from "../domain/Step.js";
import WorkerMemory from "../domain/WorkerMemory.js";
import Worker from "../domain/Worker.js";
import { StepAsked, StepCompleted, StepEventData, StepFailed, StepStarted, WorkerFinished } from "../domain/WorkerEvents.js";
import { Queue } from "../../@common/queue/Queue.js";
import WorkerCriteria from "../repository/WorkerCriteria.js";
import WorkerMemoryRepository from "../repository/WorkerMemoryRepository.js";
import WorkerRepository from "../repository/WorkerRepository.js";

export default class Orchestrator implements AuthorizerApplicationService<Input, void> {
    constructor(
        private readonly workerRepository: WorkerRepository,
        private readonly stepService: StepService,
        private readonly _mediator: Mediator = new Mediator(),
        private readonly _queue: Queue,
        private readonly _memoryRepository: WorkerMemoryRepository,
    ) { }

    public async execute(input: Input): Promise<void> {
        const criteria = new WorkerCriteria().getById(input.workerId).getByTenantId(input.tenantId);

        const worker = await this.workerRepository.get(criteria);

        if (!worker) throw new Error('worker not found');

        // What the previous runs already produced, so a resumed run does not need it again.
        const memory = await this._memoryRepository.get(worker.id);

        while (!worker.isDone()) {
            const step = worker.nextStep();

            if (!step) break;

            if (step.isAsk()) {
                await this._publishStep(worker, step, StepAsked);

                break;
            } else if (step.isAction()) {
                // Saved before the event so whoever reloads the screen also sees the step running.
                step.setAsRunning();
                await this.workerRepository.save(worker);
                await this._publishStep(worker, step, StepStarted);

                await this._executeActionStep(input, step, worker, memory)
            }
        }

        await this.workerRepository.save(worker);

        if (worker.isDone()) await this._queue.publish({ eventName: WorkerFinished, data: { workerId: worker.id, tenantId: worker.tenantId } });
    }

    private async _executeActionStep(input: Input, step: Step, worker: Worker, memory: WorkerMemory) {
        const [inputError, stepInput] = await this.stepService.resolveInput({
            step,
            memory,
            tenantId: input.tenantId,
            userId: input.userId,
        });

        if (inputError) {
            step.setAsError(inputError.message);
            return this._stop(worker, inputError, step);
        }

        let output: unknown;
        try {
            output = await this._mediator.notify(step.action, stepInput);
            step.setAsComplete();
        } catch (err) {
            const error = err instanceof Error ? err : new Error('step action failed');

            step.setAsError(error.message);
            return this._stop(worker, error, step);
        }

        // The action already ran, so the step stays complete even if the memory cannot be built.
        const [factsError, facts] = await this.stepService.interpretOutput({ step, output });

        // What it produced is recorded even when it could not be normalized, so a
        // run that starts again does not create the same thing twice.
        memory.record({ order: step.order, action: step.action, input: stepInput, output: factsError ? output : facts });
        await this._memoryRepository.save(worker.id, memory);

        if (factsError) {
            return this._stop(worker, factsError, step);
        }

        await this.workerRepository.save(worker);
        await this._publishStep(worker, step, StepCompleted);

        Logger.info(`Worker ${worker.id} step ${step.order} ${step.action}: ran`);
    }

    /**
     * Persists what the steps reached before giving the failure back to the
     * caller. Every failure passes through here, so this is the only place that
     * reports one.
     */
    private async _stop(worker: Worker, error: Error, step?: Step): Promise<never> {
        await this.workerRepository.save(worker);

        Logger.error(`Worker ${worker.id} step ${step?.order ?? '?'} ${step?.action ?? ''}: failed: ${error.message}`);

        if (step) await this._publishStep(worker, step, StepFailed);

        throw error;
    }

    private async _publishStep(worker: Worker, step: Step, eventName: string): Promise<void> {
        const data: StepEventData = {
            workerId: worker.id,
            tenantId: worker.tenantId,
            stepId: step.id.value,
            order: step.order,
            action: step.action,
            status: step.status.value,
        };

        await this._queue.publish({ eventName, data });
    }
}

type Input = AuthorizedInput & {
    workerId: string
}
