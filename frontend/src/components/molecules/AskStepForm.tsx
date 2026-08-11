import { useState } from "react";
import Button from "../atoms/Button";
import Textarea from "../atoms/Textarea";

type AskStepFormProps = {
  question: string;
  onAnswer: (answer: string) => Promise<void>;
};

/**
 * Asks the question of a step that is waiting and sends back what was typed. The
 * step leaves `pending` through the stream, which is what takes the form away.
 */
export default function AskStepForm({ question, onAnswer }: Readonly<AskStepFormProps>) {
  const [answer, setAnswer] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);

  const handleAnswer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!answer.trim() || isAnswering) return;

    setIsAnswering(true);

    await onAnswer(answer.trim());

    setIsAnswering(false);
  };

  return (
    <form className="worker-step-ask" onSubmit={handleAnswer}>
      <p className="worker-step-question">{question}</p>
      <Textarea
        className="worker-step-answer"
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Type your answer..."
        rows={2}
        disabled={isAnswering}
      />
      <Button size="small" type="submit" disabled={isAnswering || !answer.trim()}>
        {isAnswering ? "Answering..." : "Answer"}
      </Button>
    </form>
  );
}
