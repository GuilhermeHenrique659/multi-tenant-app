import { Err, Ok, TupleResult } from "../../../@common/TupleResult.js";
import LLMGateway, { LLMRequest } from "../../gateway/LLMGateway.js";
import { ModuleCapabilities } from "./ModuleCapabilities.js";
import parseLLMContent from "./parseLLMContent.js";
import Step from "../entity/Step.js";
import StepType from "../entity/StepType.js";
import Agent, { PlannedStep } from "../entity/Agent.js";
import AgentMemory from "../entity/AgentMemory.js";

type CreatePlanParams = {
    userPrompt: string;
    tenantId: string;
    userId: string;
};

type ReplanParams = {
    agent: Agent;
    memory: AgentMemory;
    tenantId: string;
    userId: string;
};

type PlanFromAnswerParams = ReplanParams & {
    answeredStep: Step;
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

/** What the completed steps produced, which is what keeps a plan from redoing them. */
const MEMORY_INSTRUCTION = [
    'What each completed step produced is in `memory`, under the `order` of the step:',
    '`input` is what it ran with and `output` is what it created, with the ids of what now exists.',
    'Take every value you need from there and never create again anything a completed step created.',
    'Plan a read action only for what you need and `memory` does not have.',
].join(' ');

const RESUME_INSTRUCTIONS = [
    'You analyze again a plan that stopped before finishing and decide how to resume it.',
    'The steps already `completed` were executed: everything they created already exists in the system',
    'and must never be created again, even if the user request describes it.',
    MEMORY_INSTRUCTION,
    'The step that failed may have done part of its work, so read the current state before acting on it:',
    'plan a read step to check whether what it was creating is already there, and only then create what is missing.',
    'Its reason for failing is in `error`: fix the plan instead of repeating what cannot work.',
    'A step of type "ask" that is `completed` carries in `answer` what the user answered:',
    'take that answer as data the user already gave and never ask the same question again.',
    'Plan only what is still missing to fulfill `userPrompt`, from where the agent stopped.',
    'You may create as many steps as needed, replacing every step that is not completed.',
    'Use only the actions listed in `capabilities`; each step must reference one of them.',
    'The `input` json schema of the chosen capability defines the fields of the step input.',
    ASK_INSTRUCTION,
    'When a step needs a value produced by a previous step, describe where it comes from in its input;',
    'the concrete value is resolved at execution time, so a placeholder is expected.',
    '`order` starts at 1 and increases by 1.',
    'Answer only with { "steps": [ ... ] }; an empty list means there is nothing left to do.',
].join(' ');

const ANSWER_INSTRUCTIONS = [
    'You continue a plan that stopped to ask the user something, now that the answer arrived.',
    '`answeredStep` is the step of type "ask" that was asking, with the question in its `input`',
    'and in `answer` exactly what the user replied: that is the data the plan was missing.',
    'Take it as given, never ask that question again and never plan another "ask" for the same data.',
    'Plan the steps that were waiting for it, using the answer as the value they needed:',
    'write the value itself in the input of the step that uses it.',
    'The steps already `completed` were executed: everything they created already exists in the system',
    'and must never be created again, even if the user request describes it.',
    MEMORY_INSTRUCTION,
    'The steps that are not completed were only a sketch made before the answer existed:',
    'every one of them is replaced by what you return, so plan again what is still missing.',
    'Plan only what is left to fulfill `userPrompt`, from where the agent stopped.',
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
            jsonSchema: { name: 'agent_plan', schema: PLAN_SCHEMA },
        };

        const [chatError, response] = await this.llmGateway.chat(request);

        if (chatError) return Err(chatError);

        const [parseError, parsed] = parseLLMContent(response.content, 'agent plan');

        if (parseError) return Err(parseError);

        if (!parsed.name || !parsed.type || !Array.isArray(parsed.steps)) {
            return Err('llm did not return a valid agent plan');
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
     * Reads the agent as it stopped and plans what is left to do, so the run can
     * be resumed instead of started over.
     */
    public async replan({ agent, memory, tenantId, userId }: ReplanParams): Promise<TupleResult<PlannedStep[]>> {
        const request: LLMRequest = {
            messages: [
                { role: 'system', content: RESUME_INSTRUCTIONS },
                {
                    role: 'user',
                    content: JSON.stringify({
                        userPrompt: agent.userPrompt,
                        agent: this.toAgentContent(agent),
                        memory: memory.getAll(),
                        capabilities: ModuleCapabilities,
                        context: { tenantId, userId },
                    }),
                },
            ],
            jsonSchema: { name: 'agent_resume_plan', schema: RESUME_SCHEMA },
        };

        return this.plannedSteps(request, 'agent resume plan');
    }

    /**
     * Plans what is left once the user answers a step that was asking, so the
     * answer is the data the remaining steps take instead of a new question.
     */
    public async planFromAnswer({ agent, answeredStep, memory, tenantId, userId }: PlanFromAnswerParams): Promise<TupleResult<PlannedStep[]>> {
        const request: LLMRequest = {
            messages: [
                { role: 'system', content: ANSWER_INSTRUCTIONS },
                {
                    role: 'user',
                    content: JSON.stringify({
                        userPrompt: agent.userPrompt,
                        answeredStep: {
                            order: answeredStep.order,
                            action: answeredStep.action,
                            input: answeredStep.input,
                            answer: answeredStep.answer,
                        },
                        agent: this.toAgentContent(agent),
                        memory: memory.getAll(),
                        capabilities: ModuleCapabilities,
                        context: { tenantId, userId },
                    }),
                },
            ],
            jsonSchema: { name: 'agent_answer_plan', schema: RESUME_SCHEMA },
        };

        return this.plannedSteps(request, 'agent answer plan');
    }

    /** What the agent looks like right now, which is what both plans read. */
    private toAgentContent(agent: Agent) {
        return {
            name: agent.name,
            type: agent.type.value,
            steps: agent.steps.getAll().map(step => ({
                order: step.order,
                action: step.action,
                input: step.input,
                type: step.type.value,
                status: step.status.value,
                ...(step.answer ? { answer: step.answer } : {}),
                ...(step.error ? { error: step.error } : {}),
            })),
        };
    }

    private async plannedSteps(request: LLMRequest, name: string): Promise<TupleResult<PlannedStep[]>> {
        const [chatError, response] = await this.llmGateway.chat(request);

        if (chatError) return Err(chatError);

        const [parseError, parsed] = parseLLMContent(response.content, name);

        if (parseError) return Err(parseError);

        if (!Array.isArray(parsed.steps)) return Err('llm did not return the steps to resume the agent');

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
