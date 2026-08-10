import { memo, useState } from "react";
import { useWorker } from "../hook/useWorkers";

type WorkerCardProps = {
  workerId: string;
  isResuming: boolean;
  canResume: boolean;
  onResume: (workerId: string) => void;
}

/**
 * Subscribes to its own worker, so a step change only re-renders the card of
 * that worker. `memo` keeps the card still when the sidebar re-renders for its
 * own reasons, such as typing in the prompt.
 */
function WorkerCard({ workerId, isResuming, canResume, onResume }: Readonly<WorkerCardProps>) {
  const worker = useWorker(workerId);
  const [showSteps, setShowSteps] = useState(false);

  if (!worker) return null;

  const hasFailed = worker.props.steps.some((step) => step.status === "failed");

  return (
    <article className="worker-card">
      <button
        className="worker-card-header"
        type="button"
        onClick={() => setShowSteps((shown) => !shown)}
        aria-expanded={showSteps}
      >
        <span className={`worker-card-chevron${showSteps ? " worker-card-chevron--open" : ""}`}>
          ›
        </span>
        <h3 className="worker-card-name">{worker.props.name}</h3>
      </button>
      {showSteps ? (
        <ol className="worker-step-list">
          {worker.props.steps.map((step) => (
            <li className="worker-step" key={`${workerId}-${step.order}`}>
              <span className="worker-step-action">{step.action}</span>
              <span className={`worker-step-status worker-step-status--${step.status}`}>
                {step.status}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
      {hasFailed ? (
        <button
          className="btn btn--small"
          type="button"
          onClick={() => onResume(workerId)}
          disabled={!canResume}
        >
          {isResuming ? "Resuming..." : "Resume"}
        </button>
      ) : null}
    </article>
  );
}

export default memo(WorkerCard);
