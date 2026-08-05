import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import Mediator from "../../@common/Mediator.js";
import LLMGateway from "../gateway/LLMGateway.js";
import WorkerCriteria from "../repository/WorkerCriteria.js";
import WorkerRepository from "../repository/WorkerRepository.js";

export default class Orchestrator implements AuthorizerApplicationService<Input, void> {
    constructor(private readonly workerRepository: WorkerRepository, private readonly llmGateway: LLMGateway, private readonly _mediator: Mediator = new Mediator()) { }

    private _interpret(llmOutput: any): any {
        return
    }

    public async execute(input: Input): Promise<void> {
        const worker = await this.workerRepository.get(new WorkerCriteria().getById(input.workerId));

        if (!worker) throw new Error('worker not found');

        while (!worker?.isDone()) {
            const nextStep = worker.nextStep();

            if (!nextStep) break;

            let output: unknown;
            try {
                output = await this._mediator.notify(nextStep.action, nextStep.input);
            } catch (err) {
                if (err instanceof Error) {
                    output = err;
                }

                throw new Error('Fail in run worker');
            }

            const llmOutput = await this.llmGateway.sendPrompt(output);

            const result = this._interpret(llmOutput);

            if (result.isOk) {
                nextStep.setAsComplete();
            } else {
                nextStep.setAsError();
            }
        }

        await this.workerRepository.save(worker);
    }
}

type Input = AuthorizedInput & {
    workerId: string
}