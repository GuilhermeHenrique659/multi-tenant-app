import type { WorkerStep as Step } from "../../model/Worker";
import Badge from "../atoms/Badge";
import AskStepForm from "./AskStepForm";

type WorkerStepProps = {
  step: Step;
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

export default function WorkerStep({ step }: Readonly<WorkerStepProps>) {
  return (
    <li className="worker-step">
      <div className="worker-step-row">
        <span className="worker-step-action">{step.action}</span>
        <Badge kind="step" tone={step.status}>{step.status}</Badge>
      </div>
      {isWaitingForAnswer(step) ? <AskStepForm question={questionOf(step)} /> : null}
    </li>
  );
}
