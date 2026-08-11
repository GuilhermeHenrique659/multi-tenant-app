import { useCallback, useEffect, useState } from "react";
import FetchHttpClient from "../../gateway/FetchHttpClient";
import AgentHttpGateway from "../../gateway/agent/AgentHttpGateway";
import { PlanAgent } from "../../application/agent/PlanAgent";
import { ResumeAgent } from "../../application/agent/ResumeAgent";
import { AnswerStep } from "../../application/agent/Answer";
import { AgentEvents } from "../../application/agent/AgentEvents";
import { useAgentActions, useAgentIds } from "../../hook/useAgents";
import { unwrapOrElse } from "../../util/Result";
import { Publisher } from "../../application/pub/Publisher";
import Button from "../atoms/Button";
import EmptyState from "../atoms/EmptyState";
import Textarea from "../atoms/Textarea";
import AgentCard from "./AgentCard";

type AgentNavBarProps = {
  tenantId: string;
}

export default function AgentNavBar({ tenantId }: Readonly<AgentNavBarProps>) {
  const agentIds = useAgentIds();
  const agentActions = useAgentActions();
  const [userPrompt, setUserPrompt] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [resumingId, setResumingId] = useState<string | null>(null);

  const agentGateway = new AgentHttpGateway(new FetchHttpClient());

  const publisher = Publisher();

  /** The stream sends the current state on open and every step change after it. */
  useEffect(() => {
    const close = AgentEvents({
      agentGateway: new AgentHttpGateway(new FetchHttpClient()),
    })({
      tenantId,
      publisher,
      updateStep: agentActions.patchStep,
      setAgents: agentActions.setAgents,
    });

    return close;
  }, [tenantId]);

  const handlePlan = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userPrompt.trim() || isPlanning) return;

    setIsPlanning(true);

    const created = await PlanAgent({ agentGateway })({
      tenantId,
      userPrompt: userPrompt.trim(),
    }).then(unwrapOrElse(alert));

    setIsPlanning(false);

    if (created) setUserPrompt("");
  };

  /** Stable while nothing is resuming, so typing does not re-render the cards. */
  const handleResume = useCallback(
    async (agentId: string) => {
      if (resumingId) return;

      setResumingId(agentId);

      await ResumeAgent({ agentGateway: new AgentHttpGateway(new FetchHttpClient()) })({
        tenantId,
        agentId,
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
    async (agentId: string, stepId: string, answer: string) => {
      await AnswerStep({ agentGateway: new AgentHttpGateway(new FetchHttpClient()) })({
        tenantId,
        agentId,
        stepId,
        answer,
      }).then(unwrapOrElse(alert));
    },
    [tenantId],
  );

  return (
    <aside className="agent-sidebar">
      <div className="agent-sidebar-header">
        <h2>Assistant</h2>
      </div>

      <form className="agent-form" onSubmit={handlePlan}>
        <Textarea
          className="agent-textarea"
          placeholder="Describe what you want to get done"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          rows={5}
        />
        <div className="agent-form-actions">
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

      <div className="agent-list">
        {agentIds.length === 0 ? (
          <EmptyState>No agent yet</EmptyState>
        ) : (
          agentIds.map((agentId) => (
            <AgentCard
              key={agentId}
              agentId={agentId}
              isResuming={resumingId === agentId}
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
