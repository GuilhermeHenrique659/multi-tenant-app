import type { Task } from "../../model/Task";
import Badge from "../atoms/Badge";

type TaskCardProps = {
  task: Task;
  onClick: () => void;
};

export default function TaskCard({ task, onClick }: Readonly<TaskCardProps>) {
  return (
    <div className="task-card" onClick={onClick}>
      <div className="task-card-header">
        <span className="task-name">{task.props.name}</span>
        <Badge kind="task" tone={task.props.status}>{task.props.status}</Badge>
      </div>
    </div>
  );
}
