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

    public async create({ userPrompt, tenantId, userId }: CreatePlanParams): Promise<Plan> {
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

        const response = await this.llmGateway.chat(request);
        const parsed = parseLLMContent(response.content, 'worker plan');

        if (!parsed.name || !parsed.type || !Array.isArray(parsed.steps)) {
            throw new Error('llm did not return a valid worker plan');
        }

        return {
            name: parsed.name,
            type: parsed.type,
            steps: parsed.steps.map((step: any) => this.toPlannedStep(step)),
        };
    }

    private toPlannedStep(step: any): PlannedStep {
        const type = StepType.create(step.type);

        const isKnownAction = ModuleCapabilities.some(capability => capability.action === step.action);

        if (type.isAction() && !isKnownAction) throw new Error(`unknown action: ${step.action}`);

        return {
            action: step.action,
            input: step.input,
            order: Number(step.order),
            type,
        };
    }
}
