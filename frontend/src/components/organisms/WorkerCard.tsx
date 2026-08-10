import { memo, useState } from "react";
import { useWorker } from "../../hook/useWorkers";
import Button from "../atoms/Button";
import WorkerStep from "../molecules/WorkerStep";

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
            <WorkerStep key={`${workerId}-${step.order}`} step={step} />
          ))}
        </ol>
      ) : null}
      {hasFailed ? (
        <Button size="small" onClick={() => onResume(workerId)} disabled={!canResume}>
          {isResuming ? "Resuming..." : "Resume"}
        </Button>
      ) : null}
    </article>
  );
}

export default memo(WorkerCard);
