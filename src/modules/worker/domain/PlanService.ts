import { Err, Ok, TupleResult } from "../../@common/TupleResult.js";
import LLMGateway, { LLMRequest } from "../gateway/LLMGateway.js";
import { ModuleCapabilities } from "./ModuleCapabilities.js";
import parseLLMContent from "./parseLLMContent.js";
import StepType from "./StepType.js";
import { PlannedStep } from "./Worker.js";

type CreatePlanParams = {
    userPrompt: string;
    tenantId: string;
    userId: string;
};

type Plan = {
    name: string;
    type: string;
    steps: PlannedStep[];
};

const PLAN_INSTRUCTIONS = [
    'You break a user request into an ordered plan of steps.',
    'Use only the actions listed in `capabilities`; each step must reference one of them.',
    'The `input` json schema of the chosen capability defines the fields of the step input.',
    'A step of type "action" is executed by the system, a step of type "ask" asks the user for missing data.',
    'When a step needs a value produced by a previous step, describe where it comes from in its input;',
    'the concrete value is resolved at execution time, so a placeholder is expected.',
    '`order` starts at 1 and increases by 1.',
].join(' ');

const PLAN_SCHEMA = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        type: { type: 'string' },
        steps: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    action: { type: 'string' },
                    input: { type: 'object' },
                    type: { type: 'string', enum: ['action', 'ask'] },
                    order: { type: 'number' },
                },
                required: ['action', 'input', 'type', 'order'],
                additionalProperties: false,
            },
        },
    },
    required: ['name', 'type', 'steps'],
    additionalProperties: false,
};

export default class PlanService {
    constructor(private readonly llmGateway: LLMGateway) { }

    public async create({ userPrompt, tenantId, userId }: CreatePlanParams): Promise<TupleResult<Plan>> {
        const request: LLMRequest = {
            messages: [
                { role: 'system', content: PLAN_INSTRUCTIONS },
                {
                    role: 'user',
                    content: JSON.stringify({
                        userPrompt,
                        capabilities: ModuleCapabilities,
                        context: { tenantId, userId },
                    }),
                },
            ],
            jsonSchema: { name: 'worker_plan', schema: PLAN_SCHEMA },
        };

        const [chatError, response] = await this.llmGateway.chat(request);

        if (chatError) return Err(chatError);

        const [parseError, parsed] = parseLLMContent(response.content, 'worker plan');

        if (parseError) return Err(parseError);

        if (!parsed.name || !parsed.type || !Array.isArray(parsed.steps)) {
            return Err('llm did not return a valid worker plan');
        }

        const steps: PlannedStep[] = [];

        for (const step of parsed.steps) {
            const [stepError, plannedStep] = this.toPlannedStep(step);

            if (stepError) return Err(stepError);

            steps.push(plannedStep);
        }

        return Ok({ name: parsed.name, type: parsed.type, steps });
    }

    private toPlannedStep(step: any): TupleResult<PlannedStep> {
        const isKnownAction = ModuleCapabilities.some(capability => capability.action === step.action);

        try {
            const type = StepType.create(step.type);

            if (type.isAction() && !isKnownAction) return Err(`unknown action: ${step.action}`);

            return Ok({
                action: step.action,
                input: step.input,
                order: Number(step.order),
                type,
            });
        } catch (err) {
            return Err(err instanceof Error ? err : new Error('invalid planned step'));
        }
    }
}
