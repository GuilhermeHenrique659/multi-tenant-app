import AuthorizerApplicationService, { AuthorizedInput } from "../../@common/AuthorizerApplicationService.js";
import PlanService from "../domain/PlanService.js";
import WorkerCriteria from "../repository/WorkerCriteria.js";
import WorkerRepository from "../repository/WorkerRepository.js";

export default class Answer implements AuthorizerApplicationService<Input, void> {
    constructor (private readonly _workerRepository: WorkerRepository, private readonly _planService: PlanService) {}
    
    public async execute(input: Input): Promise<void> {
        const worker = await this._workerRepository.get(new WorkerCriteria().getById(input.workerId));

        if (!worker) throw new Error('worker not found');



    }
}

type Input = AuthorizedInput & {
    workerId: string;
    answer: {
        stepId: string;
        data: string;
    }
}