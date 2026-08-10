import { useEffect, useState } from "react";
import { useTask, useTaskActions } from "../hook/useProjects";
import { useForm } from "../hook/useForm";
import { AddTask } from "../application/project/AddTask";
import { UpdateTask } from "../application/project/UpdateTask";
import { GetTask } from "../application/project/GetTask";
import { AssignTask } from "../application/project/AssignTask";
import FetchHttpClient from "../gateway/FetchHttpClient";
import ProjectHttpGateway from "../gateway/project/ProjectHttpGateway";
import TenantHttpGateway from "../gateway/tenant/TenantHttpGateway";
import { validStatuses } from "../model/Task";
import { unwrapOrElse } from "../util/Result";

type TaskModalProps = {
  mode: 'create' | 'edit';
  tenantId: string;
  projectId: string;
  taskId?: string;
  onClose: () => void;
};

export default function TaskModal({ mode, tenantId, projectId, taskId, onClose }: Readonly<TaskModalProps>) {
  const task = useTask(taskId ?? null);
  const TaskActions = useTaskActions();
  const httpClient = new FetchHttpClient();
  const projectGateway = new ProjectHttpGateway(httpClient);
  const addTask = AddTask({ projectGateway });
  const updateTask = UpdateTask({ projectGateway });
  const getTask = GetTask({ projectGateway });
  const assignTask = AssignTask({ projectGateway });

  const [members, setMembers] = useState<Array<{
    user: { id: string; name: string; email: string };
    role: string;
  }>>([]);

  const form = useForm({
    name: task?.props.name ?? '',
    status: task?.props.status ?? 'screen',
    startAt: task?.props.startAt?.split('T')[0] ?? '',
    endAt: task?.props.endAt?.split('T')[0] ?? '',
  });

  useEffect(() => {
    if (mode !== 'edit') return;

    getTask({ tenantId, projectId, taskId: taskId! }).then(unwrapOrElse(alert));

    new TenantHttpGateway(httpClient).getById(tenantId).then((result) => {
      if (result.isOk()) {
        setMembers(result.unwrap().members as typeof members);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAssigneeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const assigneeId = e.target.value;
    if (!assigneeId || !task) return;

    const member = members.find(m => m.user.id === assigneeId);
    if (!member) return;

    const updated = await assignTask({
      tenantId,
      projectId,
      task,
      assignee: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
      },
    }).then(unwrapOrElse(alert));

    if (updated) {
      TaskActions.updateTask(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.values.name.trim();
    if (!name) return;

    if (mode === 'create') {
      const created = await addTask({ tenantId, projectId, name }).then(unwrapOrElse(alert));
      if (created) {
        TaskActions.updateTask(created);
        onClose();
      }
    } else if (task) {
      const updated = await updateTask({
        tenantId,
        projectId,
        task,
        name,
        status: form.values.status,
        startAt: form.values.startAt || undefined,
        endAt: form.values.endAt || undefined,
      }).then(unwrapOrElse(alert));

      if (updated) {
        TaskActions.updateTask(updated);
        onClose();
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <dialog className="modal" open onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{mode === 'create' ? 'Create Task' : 'Edit Task'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-section">
          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label">Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Task name"
                value={form.values.name}
                onChange={form.set('name')}
                required
                autoFocus
              />
            </div>
            {mode === 'edit' ? (
              <>
                <div className="form-field form-field--small">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.values.status} onChange={form.set('status')}>
                    {validStatuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field form-field--small">
                  <label className="form-label">Start At</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.values.startAt}
                    onChange={form.set('startAt')}
                  />
                </div>
                <div className="form-field form-field--small">
                  <label className="form-label">End At</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.values.endAt}
                    onChange={form.set('endAt')}
                  />
                </div>
              </>
            ) : null}
            <div>
              <button className="btn btn--primary" type="submit">{mode === 'create' ? 'Create' : 'Save'}</button>
            </div>
          </form>
        </div>

        {mode === 'edit' ? (
          <section className="modal-section">
            <h3 className="modal-section-title">Assignee</h3>
            {task?.assignee ? (
              <p className="task-assignee" style={{ marginBottom: 12 }}>
                {task.assignee.name} &lt;{task.assignee.email}&gt;
              </p>
            ) : (
              <p className="empty-state" style={{ marginBottom: 12, textAlign: 'left' }}>Not assigned</p>
            )}
            <div className="form-field">
              <label className="form-label">Change assignee</label>
              <select
                className="form-input"
                value={task?.props.assigneeId ?? ''}
                onChange={handleAssigneeChange}
              >
                <option value="">None</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>
          </section>
        ) : null}
      </dialog>
    </div>
  );
}
