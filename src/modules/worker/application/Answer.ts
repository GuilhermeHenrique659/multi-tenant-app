import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import Logger from "../../@common/Logger.js";
import { Queue } from "../../@common/queue/Queue.js";
import PlanService from "../domain/services/PlanService.js";
import { StepAnswered, WorkerResumed } from "../domain/events/WorkerEvents.js";
import WorkerCriteria from "../repository/WorkerCriteria.js";
import WorkerMemoryRepository from "../repository/WorkerMemoryRepository.js";
import WorkerRepository from "../repository/WorkerRepository.js";

/**
 * A worker that asks something stops on that step. Here the answer of the user
 * reaches it and the llm plans from it what was waiting for that data, so the
 * worker goes back to the queue instead of asking again.
 */
export default class Answer implements AuthorizerApplicationService<Input, Output> {
    constructor(
        private readonly _workerRepository: WorkerRepository,
        private readonly _planService: PlanService,
        private readonly _queue: Queue,
        private readonly _memoryRepository: WorkerMemoryRepository,
    ) { }

    public async execute(input: Input): Promise<Output> {
        const criteria = new WorkerCriteria().getById(input.workerId).getByTenantId(input.tenantId);

        const worker = await this._workerRepository.get(criteria);

        if (!worker) throw new Error('worker not found');

        const stepAnswered = worker.answer(input.answer);

        await this._queue.publish(StepAnswered.from(worker, stepAnswered));

        const [planError, steps] = await this._planService.planFromAnswer({
            worker,
            answeredStep: stepAnswered,
            memory: await this._memoryRepository.get(worker.id),
            tenantId: input.tenantId,
            userId: input.userId,
        });

        if (planError) {
            Logger.error(`Worker ${worker.id}: planning from the answer failed: ${planError.message}`);

            throw planError;
        }

        Logger.info(`Worker ${worker.id}: planned ${steps.length} steps from the answer of step ${stepAnswered.order}`);

        worker.replan(steps);

        await this._workerRepository.save(worker);

        await this._queue.publish(WorkerResumed.from(worker, input.userId));

        return { workerId: worker.id };
    }
}

type Input = AuthorizedInput & {
    workerId: string;
    answer: {
        stepId: string;
        data: string;
    }
}

type Output = {
    workerId: string;
}
