import { memo, useState } from "react";
import { useAgent } from "../../hook/useAgents";
import Button from "../atoms/Button";
import AgentStep from "../molecules/AgentStep";

type AgentCardProps = {
  agentId: string;
  isResuming: boolean;
  canResume: boolean;
  onResume: (agentId: string) => void;
  onAnswer: (agentId: string, stepId: string, answer: string) => Promise<void>;
}

/**
 * Subscribes to its own agent, so a step change only re-renders the card of
 * that agent. `memo` keeps the card still when the sidebar re-renders for its
 * own reasons, such as typing in the prompt.
 */
function AgentCard({ agentId, isResuming, canResume, onResume, onAnswer }: Readonly<AgentCardProps>) {
  const agent = useAgent(agentId);
  const [showSteps, setShowSteps] = useState(false);

  if (!agent) return null;

  const hasFailed = agent.props.steps.some((step) => step.status === "failed");

  return (
    <article className="agent-card">
      <button
        className="agent-card-header"
        type="button"
        onClick={() => setShowSteps((shown) => !shown)}
        aria-expanded={showSteps}
      >
        <span className={`agent-card-chevron${showSteps ? " agent-card-chevron--open" : ""}`}>
          ›
        </span>
        <h3 className="agent-card-name">{agent.props.name}</h3>
      </button>
      {showSteps ? (
        <ol className="agent-step-list">
          {agent.props.steps.map((step) => (
            <AgentStep key={step.id} step={step} agentId={agentId} onAnswer={onAnswer} />
          ))}
        </ol>
      ) : null}
      {hasFailed ? (
        <Button size="small" onClick={() => onResume(agentId)} disabled={!canResume}>
          {isResuming ? "Resuming..." : "Resume"}
        </Button>
      ) : null}
    </article>
  );
}

export default memo(AgentCard);
