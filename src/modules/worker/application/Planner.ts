import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import Logger from "../../@common/Logger.js";
import PlanService from "../domain/services/PlanService.js";
import StepCollection from "../domain/entity/StepCollection.js";
import Worker from "../domain/entity/Worker.js";
import WorkerType from "../domain/entity/WorkerType.js";
import { Queue } from "../../@common/queue/Queue.js";
import { WorkerCreated } from "../domain/events/WorkerEvents.js";
import WorkerRepository from "../repository/WorkerRepository.js";

export default class Planner implements AuthorizerApplicationService<Input, Output> {
    constructor(private readonly workerRepository: WorkerRepository, private readonly planService: PlanService, private readonly _queue: Queue) { }

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

        const worker = Worker.create(input.tenantId, plan.name, input.userPrompt, WorkerType.create(plan.type), StepCollection.empty());

        worker.plan(plan.steps);

        await this.workerRepository.save(worker);

        await this._queue.publish(WorkerCreated.from(worker, input.userId))

        return {
            workerId: worker.id
        }
    }
}

type Input = AuthorizedInput & {
    userPrompt: string;
    file?: string;
}

type Output = {
    workerId: string
}
