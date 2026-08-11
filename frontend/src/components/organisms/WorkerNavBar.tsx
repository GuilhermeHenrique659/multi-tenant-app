import { useCallback, useEffect, useState } from "react";
import FetchHttpClient from "../../gateway/FetchHttpClient";
import WorkerHttpGateway from "../../gateway/worker/WorkerHttpGateway";
import { PlanWorker } from "../../application/worker/PlanWorker";
import { ResumeWorker } from "../../application/worker/ResumeWorker";
import { AnswerStep } from "../../application/worker/Answer";
import { WorkerEvents } from "../../application/worker/WorkerEvents";
import { useWorkerActions, useWorkerIds } from "../../hook/useWorkers";
import { unwrapOrElse } from "../../util/Result";
import { Publisher } from "../../application/pub/Publisher";
import Button from "../atoms/Button";
import EmptyState from "../atoms/EmptyState";
import Textarea from "../atoms/Textarea";
import WorkerCard from "./WorkerCard";

type WorkerNavBarProps = {
  tenantId: string;
}

export default function WorkerNavBar({ tenantId }: Readonly<WorkerNavBarProps>) {
  const workerIds = useWorkerIds();
  const workerActions = useWorkerActions();
  const [userPrompt, setUserPrompt] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [resumingId, setResumingId] = useState<string | null>(null);

  const workerGateway = new WorkerHttpGateway(new FetchHttpClient());

  const publisher = Publisher();

  /** The stream sends the current state on open and every step change after it. */
  useEffect(() => {
    const close = WorkerEvents({
      workerGateway: new WorkerHttpGateway(new FetchHttpClient()),
    })({
      tenantId,
      publisher,
      updateStep: workerActions.patchStep,
      setWorkers: workerActions.setWorkers,
    });

    return close;
  }, [tenantId]);

  const handlePlan = async (event: React.SubmitEvent<HTMLFormElement>) => {
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

  /** Stable while nothing is resuming, so typing does not re-render the cards. */
  const handleResume = useCallback(
    async (workerId: string) => {
      if (resumingId) return;

      setResumingId(workerId);

      await ResumeWorker({ workerGateway: new WorkerHttpGateway(new FetchHttpClient()) })({
        tenantId,
        workerId,
      }).then(unwrapOrElse(alert));

      setResumingId(null);
    },
    [tenantId, resumingId],
  );

  /**
   * Stable while the tenant does not change, so typing in the prompt does not
   * re-render the cards. The card only learns the answer through the stream.
   */
  const handleAnswer = useCallback(
    async (workerId: string, stepId: string, answer: string) => {
      await AnswerStep({ workerGateway: new WorkerHttpGateway(new FetchHttpClient()) })({
        tenantId,
        workerId,
        stepId,
        answer,
      }).then(unwrapOrElse(alert));
    },
    [tenantId],
  );

  return (
    <aside className="worker-sidebar">
      <div className="worker-sidebar-header">
        <h2>Assistant</h2>
      </div>

      <form className="worker-form" onSubmit={handlePlan}>
        <Textarea
          className="worker-textarea"
          placeholder="Describe what you want to get done"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          rows={5}
        />
        <div className="worker-form-actions">
          <Button size="small" disabled title="File upload is not available yet">
            Attach file
          </Button>
          <Button
            variant="primary"
            size="small"
            type="submit"
            disabled={isPlanning || !userPrompt.trim()}
          >
            {isPlanning ? "Planning..." : "Send"}
          </Button>
        </div>
      </form>

      <div className="worker-list">
        {workerIds.length === 0 ? (
          <EmptyState>No worker yet</EmptyState>
        ) : (
          workerIds.map((workerId) => (
            <WorkerCard
              key={workerId}
              workerId={workerId}
              isResuming={resumingId === workerId}
              canResume={resumingId === null}
              onResume={handleResume}
              onAnswer={handleAnswer}
            />
          ))
        )}
      </div>
    </aside>
  );
}
