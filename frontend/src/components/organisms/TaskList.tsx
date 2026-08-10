import { useEffect, useState } from "react";
import { useTaskStore } from "../../hook/useProjects";
import type { Project } from "../../model/Project";
import { ListTasks } from "../../application/project/ListTasks";
import FetchHttpClient from "../../gateway/FetchHttpClient";
import ProjectHttpGateway from "../../gateway/project/ProjectHttpGateway";
import { tasksStore } from "../../model/Task";
import { ModelCollection } from "../../model/common/Collection";
import { ModelToMapFn } from "../../util/ArrayUtil";
import Badge from "../atoms/Badge";
import Button from "../atoms/Button";
import EmptyState from "../atoms/EmptyState";
import TaskCard from "../molecules/TaskCard";
import TaskModal from "./TaskModal";

type TaskListProps = {
  tenantId: string;
  project: Project;
}

export default function TaskList({ tenantId, project }: Readonly<TaskListProps>) {
  const taskCollection = useTaskStore((s) => s);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const projectGateway = new ProjectHttpGateway(new FetchHttpClient());
  const listTasks = ListTasks({ projectGateway });

  useEffect(() => {
    listTasks({ tenantId, projectId: project.props.id }).then((task) =>
      tasksStore.setState(() => ({
        tasks: ModelCollection.from(task.unwrapOr([]), ModelToMapFn),
      })),
    );
  }, [project.props.id, tenantId]);

  return (
    <div className="projects-content">
      <div className="projects-content-header">
        <h2>{project.props.name}</h2>
        <Badge kind="project" tone={project.props.status === "active" ? "active" : "closed"}>
          {project.props.status}
        </Badge>
      </div>
      <div className="task-section">
        <div className="task-section-header">
          <h3>Tasks</h3>
          <Button variant="primary" size="small" onClick={() => setIsCreatingTask(true)}>Add Task</Button>
        </div>
        <div className="task-list">
          {taskCollection.tasks.values().length === 0 ? (
            <EmptyState>No task yet</EmptyState>
          ) : (
            taskCollection.tasks.values().map((task) => (
              <TaskCard key={task.props.id} task={task} onClick={() => setEditTaskId(task.props.id)} />
            ))
          )}
        </div>
      </div>

      {isCreatingTask ? (
        <TaskModal
          mode="create"
          tenantId={tenantId}
          projectId={project.props.id}
          onClose={() => setIsCreatingTask(false)}
        />
      ) : null}

      {editTaskId ? (
        <TaskModal
          mode="edit"
          tenantId={tenantId}
          projectId={project.props.id}
          taskId={editTaskId}
          onClose={() => setEditTaskId(null)}
        />
      ) : null}
    </div>
  );
}
