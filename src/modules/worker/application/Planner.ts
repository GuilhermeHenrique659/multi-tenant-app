import AuthorizerApplicationService from "../../@common/AuthorizerApplicationService.js";
import StepCollection from "../domain/StepCollection.js";
import Worker from "../domain/Worker.js";
import WorkerType from "../domain/WorkerType.js";
import LLMGateway from "../gateway/LLMGateway.js";
import { Queue } from "../queue/Queue.js";
import WorkerRepository from "../repository/WorkerRepository.js";

class Planner implements AuthorizerApplicationService<Input, Output> {
    constructor(private readonly workerRepository: WorkerRepository, private readonly llmGateway: LLMGateway, private readonly _queue: Queue) { }

    public async execute(input: Input): Promise<Output> {
        const llmOutput = await this.llmGateway.sendPrompt(input.userPrompt);

        const worker = Worker.create(input.tenantId, llmOutput.name, WorkerType.create(llmOutput.type), StepCollection.empty());

        await this.workerRepository.save(worker);

        await this._queue.publish({ eventName: 'WorkerCreated', data: { workerId: worker.id } })

        return {
            workerId: worker.id
        }
    }
}

type Input = {
    userPrompt: string;
    userId: string;
    tenantId: string;
    file?: string;
}

type Output = {
    workerId: string
}