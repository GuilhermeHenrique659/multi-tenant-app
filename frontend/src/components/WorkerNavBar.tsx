import { useEffect, useState } from "react";
import FetchHttpClient from "../gateway/FetchHttpClient";
import WorkerHttpGateway from "../gateway/worker/WorkerHttpGateway";
import { PlanWorker } from "../application/worker/PlanWorker";
import { ResumeWorker } from "../application/worker/ResumeWorker";
import { StreamWorkers } from "../application/worker/StreamWorkers";
import { useWorkerActions, useWorkers } from "../hook/useWorkers";
import { unwrapOrElse } from "../util/Result";

interface WorkerNavBarProps {
  tenantId: string;
}

export default function WorkerNavBar({ tenantId }: WorkerNavBarProps) {
  const workers = useWorkers().values();
  const workerActions = useWorkerActions();
  const [userPrompt, setUserPrompt] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [resumingId, setResumingId] = useState<string | null>(null);

  const workerGateway = new WorkerHttpGateway(new FetchHttpClient());

  /** The stream sends the current state on open and every step change after it. */
  useEffect(() => {
    const close = StreamWorkers({
      workerGateway: new WorkerHttpGateway(new FetchHttpClient()),
    })({
      tenantId,
      setWorkers: workerActions.setWorkers,
      patchStep: workerActions.patchStep,
    });

    return close;
  }, [tenantId]);

  const handlePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userPrompt.trim() || isPlanning) return;

    setIsPlanning(true);

    const created = await PlanWorker({ workerGateway })({
      tenantId,
      userPrompt: userPrompt.trim(),
    }).then(unwrapOrElse(alert));

    setIsPlanning(false);

    if (created) setUserPrompt("");
  };

  const handleResume = async (workerId: string) => {
    if (resumingId) return;

    setResumingId(workerId);

    await ResumeWorker({ workerGateway })({ tenantId, workerId }).then(
      unwrapOrElse(alert),
    );

    setResumingId(null);
  };

  return (
    <aside className="worker-sidebar">
      <div className="worker-sidebar-header">
        <h2>Assistant</h2>
      </div>

      <form className="worker-form" onSubmit={handlePlan}>
        <textarea
          className="form-input worker-textarea"
          placeholder="Describe what you want to get done"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          rows={5}
        />
        <div className="worker-form-actions">
          <button
            className="btn btn--small"
            type="button"
            disabled
            title="File upload is not available yet"
          >
            Attach file
          </button>
          <button
            className="btn btn--primary btn--small"
            type="submit"
            disabled={isPlanning || !userPrompt.trim()}
          >
            {isPlanning ? "Planning..." : "Send"}
          </button>
        </div>
      </form>

      <div className="worker-list">
        {workers.length === 0 ? (
          <p className="empty-state">No worker yet</p>
        ) : (
          workers.map((worker) => {
            const hasFailed = worker.props.steps.some(
              (step) => step.status === "failed",
            );

            return (
              <article className="worker-card" key={worker.props.id}>
                <h3 className="worker-card-name">{worker.props.name}</h3>
                <ol className="worker-step-list">
                  {worker.props.steps.map((step) => (
                    <li className="worker-step" key={`${worker.props.id}-${step.order}`}>
                      <span className="worker-step-action">{step.action}</span>
                      <span className={`worker-step-status worker-step-status--${step.status}`}>
                        {step.status}
                      </span>
                    </li>
                  ))}
                </ol>
                {hasFailed ? (
                  <button
                    className="btn btn--small"
                    type="button"
                    onClick={() => handleResume(worker.props.id)}
                    disabled={resumingId !== null}
                  >
                    {resumingId === worker.props.id ? "Resuming..." : "Resume"}
                  </button>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </aside>
  );
}
