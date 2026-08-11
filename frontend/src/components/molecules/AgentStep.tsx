import type { AgentStep as Step } from "../../model/Agent";
import Badge from "../atoms/Badge";
import AskStepForm from "./AskStepForm";

type AgentStepProps = {
  step: Step;
  agentId: string;
  onAnswer: (agentId: string, stepId: string, answer: string) => Promise<void>;
};

/** A step of type `ask` waits for the user, so it only asks while it is pending. */
function isWaitingForAnswer(step: Step) {
  return step.type === "ask" && step.status === "pending";
}

/**
 * The question is written by the planner in the input of the step, which only
 * comes for `ask`; without it the action is the closest thing to a question.
 */
function questionOf(step: Step) {
  return step.input?.question ?? step.action;
}

export default function AgentStep({ step, agentId, onAnswer }: Readonly<AgentStepProps>) {
  return (
    <li className="agent-step">
      <div className="agent-step-row">
        <span className="agent-step-action">{step.action}</span>
        <Badge kind="step" tone={step.status}>{step.status}</Badge>
      </div>
      {isWaitingForAnswer(step) ? (
        <AskStepForm
          question={questionOf(step)}
          onAnswer={(answer) => onAnswer(agentId, step.id, answer)}
        />
      ) : null}
      {/* An answered step keeps the question next to what was answered. */}
      {step.answer ? (
        <div className="agent-step-ask">
          <p className="agent-step-question">{questionOf(step)}</p>
          <p className="agent-step-answered">{step.answer}</p>
        </div>
      ) : null}
    </li>
  );
}
