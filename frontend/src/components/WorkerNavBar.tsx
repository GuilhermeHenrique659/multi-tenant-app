import { useEffect, useState } from "react";
import FetchHttpClient from "../gateway/FetchHttpClient";
import WorkerHttpGateway from "../gateway/worker/WorkerHttpGateway";
import { ListWorkers } from "../application/worker/ListWorkers";
import { PlanWorker } from "../application/worker/PlanWorker";
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

  const workerGateway = new WorkerHttpGateway(new FetchHttpClient());

  useEffect(() => {
    ListWorkers({ workerGateway })({ tenantId }).then((result) =>
      workerActions.setWorkers(result.unwrapOr([])),
    );
  }, [tenantId]);

  const handlePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userPrompt.trim() || isPlanning) return;

    setIsPlanning(true);

    const updated = await PlanWorker({ workerGateway })({
      tenantId,
      userPrompt: userPrompt.trim(),
    }).then(unwrapOrElse(alert));

    setIsPlanning(false);

    if (updated) {
      workerActions.setWorkers(updated);
      setUserPrompt("");
    }
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
          workers.map((worker) => (
            <article className="worker-card" key={worker.props.id}>
              <h3 className="worker-card-name">{worker.props.name}</h3>
              <ol className="worker-step-list">
                {worker.props.steps.map((step, index) => (
                  <li className="worker-step" key={`${worker.props.id}-${index}`}>
                    <span className="worker-step-action">{step.action}</span>
                    <span className={`worker-step-status worker-step-status--${step.status}`}>
                      {step.status}
                    </span>
                  </li>
                ))}
              </ol>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}
