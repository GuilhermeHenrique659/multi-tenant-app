import LLLMGateway from "../gateway/LLMGateway.js";
import WorkerRepository from "../repository/WorkerRepository.js";

class CreateWorker {
    constructor(private readonly workerRepository: WorkerRepository, private readonly llmGateway: LLLMGateway) {}

    public async execute(workerData: any): Promise<void> {
        
    
    }
}