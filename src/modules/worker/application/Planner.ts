import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import PlanService from "../domain/PlanService.js";
import StepCollection from "../domain/StepCollection.js";
import Worker from "../domain/Worker.js";
import WorkerType from "../domain/WorkerType.js";
import { Queue } from "../queue/Queue.js";
import WorkerRepository from "../repository/WorkerRepository.js";

export default class Planner implements AuthorizerApplicationService<Input, Output> {
    constructor(private readonly workerRepository: WorkerRepository, private readonly planService: PlanService, private readonly _queue: Queue) { }

    public async execute(input: Input): Promise<Output> {
        const plan = await this.planService.create({
            userPrompt: input.userPrompt,
            tenantId: input.tenantId,
            userId: input.userId,
        });

        const worker = Worker.create(input.tenantId, plan.name, WorkerType.create(plan.type), StepCollection.empty());

        worker.plan(plan.steps);

        await this.workerRepository.save(worker);

        await this._queue.publish({
            eventName: 'WorkerCreated',
            data: { workerId: worker.id, tenantId: input.tenantId, userId: input.userId },
        })

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
