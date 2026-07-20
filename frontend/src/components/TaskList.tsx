import { useEffect, useState } from "react";
import { useTaskStore } from "../hook/useProjects";
import type { Project } from "../model/Project";
import { ListTasks } from "../application/project/ListTasks";
import FetchHttpClient from "../gateway/FetchHttpClient";
import ProjectHttpGateway from "../gateway/project/ProjectHttpGateway";
import { tasksStore } from "../model/Task";
import { ModelCollection } from "../model/common/Collection";
import { ModelToMapFn } from "../util/ArrayUtil";
import TaskModal from "./TaskModal";

interface TaskListProps {
  tenantId: string;
  project: Project;
}

export default function TaskList({ tenantId, project }: TaskListProps) {
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
        <span
          className={`project-status-label project-status-label--${project.props.status === "active" ? "active" : "closed"}`}
        >
          {project.props.status}
        </span>
      </div>
      <div className="task-section">
        <div className="task-section-header">
          <h3>Tasks</h3>
          <button className="btn btn--primary btn--small" onClick={() => setIsCreatingTask(true)}>Add Task</button>
        </div>
        <div className="task-list">
          {taskCollection.tasks.values().length === 0 ? (
            <p className="empty-state">No task yet</p>
          ) : (
            taskCollection.tasks.values().map((task) => (
              <div key={task.props.id} className="task-card" onClick={() => setEditTaskId(task.props.id)}>
                <div className="task-card-header">
                  <span className="task-name">{task.props.name}</span>
                  <span className={`task-status task-status--${task.props.status}`}>
                    {task.props.status}
                  </span>
                </div>
              </div>
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
