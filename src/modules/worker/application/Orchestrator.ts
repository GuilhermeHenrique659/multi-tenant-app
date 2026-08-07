import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import elapsedSince from "../../@common/elapsedSince.js";
import Logger from "../../@common/Logger.js";
import Mediator from "../../@common/Mediator.js";
import StepService from "../domain/StepService.js";
import Step from "../domain/Step.js";
import WorkerMemory from "../domain/WorkerMemory.js";
import Worker from "../domain/Worker.js";
import { StepCompleted, StepEventData, StepFailed, StepStarted, WorkerFinished } from "../domain/WorkerEvents.js";
import { Queue } from "../../@common/queue/Queue.js";
import WorkerCriteria from "../repository/WorkerCriteria.js";
import WorkerRepository from "../repository/WorkerRepository.js";

export default class Orchestrator implements AuthorizerApplicationService<Input, void> {
    constructor(
        private readonly workerRepository: WorkerRepository,
        private readonly stepService: StepService,
        private readonly _mediator: Mediator = new Mediator(),
        private readonly _queue?: Queue,
    ) { }

    public async execute(input: Input): Promise<void> {
        const criteria = new WorkerCriteria().getById(input.workerId).getByTenantId(input.tenantId);

        const worker = await this.workerRepository.get(criteria);

        if (!worker) throw new Error('worker not found');

        const memory = WorkerMemory.empty();
        const workerStartedAt = performance.now();

        Logger.info(`Worker ${worker.id}: starting with ${worker.steps.getAll().length} steps`);

        while (!worker.isDone()) {
            const step = worker.nextStep();

            if (!step) break;

            if (!step.type.isAction()) {
                return this._stop(worker, new Error(`step type not supported yet: ${step.type.value}`));
            }

            const stepStartedAt = performance.now();

            Logger.info(`Worker ${worker.id} step ${step.order} ${step.action}: starting`);

            // Saved before the event so whoever reloads the screen also sees the step running.
            step.setAsRunning();
            await this.workerRepository.save(worker);
            await this._publishStep(worker, step, StepStarted);

            const [inputError, stepInput] = await this.stepService.resolveInput({
                step,
                memory,
                tenantId: input.tenantId,
                userId: input.userId,
            });

            if (inputError) {
                Logger.error(`Worker ${worker.id} step ${step.order} ${step.action}: input not resolved after ${elapsedSince(stepStartedAt)}ms: ${inputError.message}`);
                step.setAsError(inputError.message);
                return this._stop(worker, inputError, step);
            }

            const actionStartedAt = performance.now();

            let output: unknown;
            try {
                output = await this._mediator.notify(step.action, stepInput);
                step.setAsComplete();

                Logger.info(`Worker ${worker.id} step ${step.order} ${step.action}: action ran in ${elapsedSince(actionStartedAt)}ms`);
            } catch (err) {
                const error = err instanceof Error ? err : new Error('step action failed');

                Logger.error(`Worker ${worker.id} step ${step.order} ${step.action}: action failed after ${elapsedSince(actionStartedAt)}ms: ${error.message}`);
                step.setAsError(error.message);
                return this._stop(worker, error, step);
            }

            // The action already ran, so the step stays complete even if the memory cannot be built.
            const [factsError, facts] = await this.stepService.interpretOutput({ step, output });

            if (factsError) {
                Logger.error(`Worker ${worker.id} step ${step.order} ${step.action}: output not interpreted after ${elapsedSince(stepStartedAt)}ms: ${factsError.message}`);
                return this._stop(worker, factsError, step);
            }

            memory.record({ order: step.order, action: step.action, input: stepInput, output: facts });

            await this.workerRepository.save(worker);
            await this._publishStep(worker, step, StepCompleted);

            Logger.info(`Worker ${worker.id} step ${step.order} ${step.action}: completed in ${elapsedSince(stepStartedAt)}ms`);
        }

        await this.workerRepository.save(worker);
        await this._publish(WorkerFinished, { workerId: worker.id, tenantId: worker.tenantId });

        Logger.info(`Worker ${worker.id}: finished in ${elapsedSince(workerStartedAt)}ms`);
    }

    /** Persists what the steps reached before giving the failure back to the caller. */
    private async _stop(worker: Worker, error: Error, step?: Step): Promise<never> {
        await this.workerRepository.save(worker);

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

        await this._publish(eventName, data);
    }

    private async _publish(eventName: string, data: unknown): Promise<void> {
        await this._queue?.publish({ eventName, data });
    }
}

type Input = AuthorizedInput & {
    workerId: string
}
