import { Err, Ok, TupleResult } from "../../@common/TupleResult.js";
import LLMGateway, { LLMRequest } from "../gateway/LLMGateway.js";
import { ModuleCapabilities } from "./ModuleCapabilities.js";
import parseLLMContent from "./parseLLMContent.js";
import Step from "./Step.js";
import WorkerMemory from "./WorkerMemory.js";

type ResolveInputParams = {
    step: Step;
    memory: WorkerMemory;
    tenantId: string;
    userId: string;
};

type InterpretOutputParams = {
    step: Step;
    output: unknown;
};

const RESOLVE_INPUT_INSTRUCTIONS = [
    'You build the input payload of the next step of an automation plan.',
    'The step contract is the json schema of the action: it tells you exactly which fields the input must have.',
    'Use only values present in `memory` or in `context`; never invent ids or names.',
    'When a field must come from a previous step, take it from the matching entry of `memory`.',
    'Answer only with { "input": { ... } }.',
].join(' ');

const INTERPRET_OUTPUT_INSTRUCTIONS = [
    'You normalize the raw result of an executed step into structured facts.',
    'The step contract is the json schema the action is expected to produce.',
    'Extract only facts present in the raw output; never invent values.',
    'Answer only with { "facts": { ... } }.',
].join(' ');

export default class StepService {
    constructor(private readonly llmGateway: LLMGateway) { }

    public async resolveInput({ step, memory, tenantId, userId }: ResolveInputParams): Promise<TupleResult<any>> {
        const [contractError, contract] = this.contractOf(step);

        if (contractError) return Err(contractError);

        const request: LLMRequest = {
            messages: [
                { role: 'system', content: RESOLVE_INPUT_INSTRUCTIONS },
                {
                    role: 'user',
                    content: JSON.stringify({
                        step: { action: step.action, order: step.order, plannedInput: step.input },
                        contract: { input: contract.input, output: contract.output },
                        memory: memory.getAll(),
                        context: { tenantId, userId },
                    }),
                },
            ],
            jsonSchema: {
                name: 'step_input',
                schema: {
                    type: 'object',
                    properties: { input: contract.input },
                    required: ['input'],
                    additionalProperties: false,
                },
            },
        };

        const [chatError, response] = await this.llmGateway.chat(request);

        if (chatError) return Err(chatError);

        const [parseError, parsed] = parseLLMContent(response.content, 'step input');

        if (parseError) return Err(parseError);

        if (!parsed.input || typeof parsed.input !== 'object') {
            return Err('llm did not return a step input');
        }

        return Ok(parsed.input);
    }

    public async interpretOutput({ step, output }: InterpretOutputParams): Promise<TupleResult<any>> {
        if (output === null || output === undefined) return Ok(null);

        if (typeof output === 'object') return Ok(output);

        const [contractError, contract] = this.contractOf(step);

        if (contractError) return Err(contractError);

        const rawOutput = typeof output === 'string' ? output : JSON.stringify(output);

        const request: LLMRequest = {
            messages: [
                { role: 'system', content: INTERPRET_OUTPUT_INSTRUCTIONS },
                {
                    role: 'user',
                    content: JSON.stringify({
                        step: { action: step.action, order: step.order },
                        contract: { output: contract.output },
                        rawOutput,
                    }),
                },
            ],
            jsonSchema: {
                name: 'step_output',
                schema: {
                    type: 'object',
                    properties: { facts: contract.output },
                    required: ['facts'],
                    additionalProperties: false,
                },
            },
        };

        const [chatError, response] = await this.llmGateway.chat(request);

        if (chatError) return Err(chatError);

        const [parseError, parsed] = parseLLMContent(response.content, 'step output');

        if (parseError) return Err(parseError);

        if (!parsed.facts || typeof parsed.facts !== 'object') {
            return Err('llm did not return the step output facts');
        }

        return Ok(parsed.facts);
    }

    private contractOf(step: Step): TupleResult<typeof ModuleCapabilities[number]> {
        const contract = ModuleCapabilities.find(capability => capability.action === step.action);

        if (!contract) return Err(`unknown action: ${step.action}`);

        return Ok(contract);
    }
}
