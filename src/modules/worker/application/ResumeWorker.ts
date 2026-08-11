import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import Logger from "../../@common/Logger.js";
import { Queue } from "../../@common/queue/Queue.js";
import PlanService from "../domain/services/PlanService.js";
import { WorkerResumed } from "../domain/events/WorkerEvents.js";
import WorkerCriteria from "../repository/WorkerCriteria.js";
import WorkerMemoryRepository from "../repository/WorkerMemoryRepository.js";
import WorkerRepository from "../repository/WorkerRepository.js";

/**
 * A worker that failed stops where it was. Here the llm reads the plan as it
 * stopped, decides what is still missing and the worker goes back to the queue
 * with those steps, so the orchestrator runs it from where it stopped.
 */
export default class ResumeWorker implements AuthorizerApplicationService<Input, Output> {
    constructor(
        private readonly workerRepository: WorkerRepository,
        private readonly planService: PlanService,
        private readonly _queue: Queue,
        private readonly _memoryRepository: WorkerMemoryRepository,
    ) { }

    public async execute(input: Input): Promise<Output> {
        const criteria = new WorkerCriteria().getById(input.workerId).getByTenantId(input.tenantId);

        const worker = await this.workerRepository.get(criteria);

        if (!worker) throw new Error('worker not found');

        if (worker.isDone()) throw new Error('worker is already done');

        const [planError, steps] = await this.planService.replan({
            worker,
            memory: await this._memoryRepository.get(worker.id),
            tenantId: input.tenantId,
            userId: input.userId,
        });

        if (planError) {
            Logger.error(`Worker ${worker.id}: replanning failed: ${planError.message}`);

            throw planError;
        }

        Logger.info(`Worker ${worker.id}: replanned with ${steps.length} steps`);

        worker.replan(steps);

        await this.workerRepository.save(worker);

        await this._queue.publish(WorkerResumed.from(worker, input.userId));

        return { workerId: worker.id };
    }
}

type Input = AuthorizedInput & {
    workerId: string;
}

type Output = {
    workerId: string;
}
