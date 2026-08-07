import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import Mediator from "../../@common/Mediator.js";
import StepService from "../domain/StepService.js";
import WorkerMemory from "../domain/WorkerMemory.js";
import Worker from "../domain/Worker.js";
import WorkerCriteria from "../repository/WorkerCriteria.js";
import WorkerRepository from "../repository/WorkerRepository.js";

export default class Orchestrator implements AuthorizerApplicationService<Input, void> {
    constructor(private readonly workerRepository: WorkerRepository, private readonly stepService: StepService, private readonly _mediator: Mediator = new Mediator()) { }

    public async execute(input: Input): Promise<void> {
        const criteria = new WorkerCriteria().getById(input.workerId).getByTenantId(input.tenantId);

        const worker = await this.workerRepository.get(criteria);

        if (!worker) throw new Error('worker not found');

        const memory = WorkerMemory.empty();

        while (!worker.isDone()) {
            const step = worker.nextStep();

            if (!step) break;

            if (!step.type.isAction()) {
                return this._stop(worker, new Error(`step type not supported yet: ${step.type.value}`));
            }

            const [inputError, stepInput] = await this.stepService.resolveInput({
                step,
                memory,
                tenantId: input.tenantId,
                userId: input.userId,
            });

            if (inputError) {
                step.setAsError();
                return this._stop(worker, inputError);
            }

            let output: unknown;
            try {
                output = await this._mediator.notify(step.action, stepInput);
                step.setAsComplete();
            } catch (err) {
                step.setAsError();
                return this._stop(worker, err instanceof Error ? err : new Error('step action failed'));
            }

            // The action already ran, so the step stays complete even if the memory cannot be built.
            const [factsError, facts] = await this.stepService.interpretOutput({ step, output });

            if (factsError) return this._stop(worker, factsError);

            memory.record({ order: step.order, action: step.action, input: stepInput, output: facts });
        }

        await this.workerRepository.save(worker);
    }

    /** Persists what the steps reached before giving the failure back to the caller. */
    private async _stop(worker: Worker, error: Error): Promise<never> {
        await this.workerRepository.save(worker);

        throw error;
    }
}

type Input = AuthorizedInput & {
    workerId: string
}
