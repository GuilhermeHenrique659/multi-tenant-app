import { useState } from "react";
import Button from "../atoms/Button";
import Textarea from "../atoms/Textarea";

type AskStepFormProps = {
  question: string;
};

/**
 * Only the visual part: what is typed stays in the card, because sending the
 * answer back to the worker is not implemented yet.
 */
export default function AskStepForm({ question }: Readonly<AskStepFormProps>) {
  const [answer, setAnswer] = useState("");

  return (
    <div className="worker-step-ask">
      <p className="worker-step-question">{question}</p>
      <Textarea
        className="worker-step-answer"
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Type your answer..."
        rows={2}
      />
      <Button size="small" disabled>Answer</Button>
    </div>
  );
}
