import { Err, Ok, TupleResult } from "../../@common/TupleResult.js";
import LLMGateway, { LLMRequest } from "../gateway/LLMGateway.js";
import { ModuleCapabilities } from "./ModuleCapabilities.js";
import parseLLMContent from "./parseLLMContent.js";
import StepType from "./StepType.js";
import Worker, { PlannedStep } from "./Worker.js";

type CreatePlanParams = {
    userPrompt: string;
    tenantId: string;
    userId: string;
};

type ReplanParams = {
    worker: Worker;
    tenantId: string;
    userId: string;
};

type Plan = {
    name: string;
    type: string;
    steps: PlannedStep[];
};

const ASK_INSTRUCTION = [
    'A step of type "ask" always carries the question in its input, under the key `question`, as a string:',
    '{ "question": "..." }, written for the user to read and answer in free text.',
].join(' ');

const PLAN_INSTRUCTIONS = [
    'You break a user request into an ordered plan of steps.',
    'Use only the actions listed in `capabilities`; each step must reference one of them.',
    'The `input` json schema of the chosen capability defines the fields of the step input.',
    'A step of type "action" is executed by the system, a step of type "ask" asks the user for missing data.',
    ASK_INSTRUCTION,
    'When a step needs a value produced by a previous step, describe where it comes from in its input;',
    'the concrete value is resolved at execution time, so a placeholder is expected.',
    '`order` starts at 1 and increases by 1.',
].join(' ');

const RESUME_INSTRUCTIONS = [
    'You analyze again a plan that stopped before finishing and decide how to resume it.',
    'The steps already `completed` were executed: everything they created already exists in the system',
    'and must never be created again, even if the user request describes it.',
    'What those steps produced was not kept, so you do not know the ids of what already exists:',
    'start the plan with the read actions needed to find it again (for example `listProjects` to find',
    'the project a completed `createProject` created) and let the later steps take the ids from them.',
    'The step that failed may have done part of its work, so read the current state before acting on it:',
    'plan a read step to check whether what it was creating is already there, and only then create what is missing.',
    'Its reason for failing is in `error`: fix the plan instead of repeating what cannot work.',
    'A step of type "ask" that is `running` and carries an `answer` was already answered by the user:',
    'take that answer as the data it was asking for, never ask the same question again,',
    'and plan from it the steps that were waiting for that data, describing in their input that the value comes from it.',
    'Plan only what is still missing to fulfill `userPrompt`, from where the worker stopped.',
    'You may create as many steps as needed, replacing every step that is not completed.',
    'Use only the actions listed in `capabilities`; each step must reference one of them.',
    'The `input` json schema of the chosen capability defines the fields of the step input.',
    ASK_INSTRUCTION,
    'When a step needs a value produced by a previous step, describe where it comes from in its input;',
    'the concrete value is resolved at execution time, so a placeholder is expected.',
    '`order` starts at 1 and increases by 1.',
    'Answer only with { "steps": [ ... ] }; an empty list means there is nothing left to do.',
].join(' ');

const STEP_SCHEMA = {
    type: 'object',
    properties: {
        action: { type: 'string' },
        input: { type: 'object' },
        type: { type: 'string', enum: ['action', 'ask'] },
        order: { type: 'number' },
    },
    required: ['action', 'input', 'type', 'order'],
    additionalProperties: false,
};

const PLAN_SCHEMA = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        type: { type: 'string' },
        steps: {
            type: 'array',
            items: STEP_SCHEMA,
        },
    },
    required: ['name', 'type', 'steps'],
    additionalProperties: false,
};

const RESUME_SCHEMA = {
    type: 'object',
    properties: {
        steps: {
            type: 'array',
            items: STEP_SCHEMA,
        },
    },
    required: ['steps'],
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

    /**
     * Reads the worker as it stopped and plans what is left to do, so the run can
     * be resumed instead of started over.
     */
    public async replan({ worker, tenantId, userId }: ReplanParams): Promise<TupleResult<PlannedStep[]>> {
        const request: LLMRequest = {
            messages: [
                { role: 'system', content: RESUME_INSTRUCTIONS },
                {
                    role: 'user',
                    content: JSON.stringify({
                        userPrompt: worker.userPrompt,
                        worker: {
                            name: worker.name,
                            type: worker.type.value,
                            steps: worker.steps.getAll().map(step => ({
                                order: step.order,
                                action: step.action,
                                input: step.input,
                                type: step.type.value,
                                status: step.status.value,
                                ...(step.answer ? { answer: step.answer } : {}),
                                ...(step.error ? { error: step.error } : {}),
                            })),
                        },
                        capabilities: ModuleCapabilities,
                        context: { tenantId, userId },
                    }),
                },
            ],
            jsonSchema: { name: 'worker_resume_plan', schema: RESUME_SCHEMA },
        };

        const [chatError, response] = await this.llmGateway.chat(request);

        if (chatError) return Err(chatError);

        const [parseError, parsed] = parseLLMContent(response.content, 'worker resume plan');

        if (parseError) return Err(parseError);

        if (!Array.isArray(parsed.steps)) return Err('llm did not return the steps to resume the worker');

        const steps: PlannedStep[] = [];

        for (const step of parsed.steps) {
            const [stepError, plannedStep] = this.toPlannedStep(step);

            if (stepError) return Err(stepError);

            steps.push(plannedStep);
        }

        return Ok(steps);
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
