import { useEffect, useState } from "react";
import { useTask, useTaskActions } from "../../hook/useProjects";
import { useForm } from "../../hook/useForm";
import { AddTask } from "../../application/project/AddTask";
import { UpdateTask } from "../../application/project/UpdateTask";
import { GetTask } from "../../application/project/GetTask";
import { AssignTask } from "../../application/project/AssignTask";
import FetchHttpClient from "../../gateway/FetchHttpClient";
import ProjectHttpGateway from "../../gateway/project/ProjectHttpGateway";
import TenantHttpGateway from "../../gateway/tenant/TenantHttpGateway";
import { validStatuses } from "../../model/Task";
import { unwrapOrElse } from "../../util/Result";
import Button from "../atoms/Button";
import EmptyState from "../atoms/EmptyState";
import Input from "../atoms/Input";
import Select from "../atoms/Select";
import FormField from "../molecules/FormField";
import Modal from "../molecules/Modal";

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
    <Modal title={mode === 'create' ? 'Create Task' : 'Edit Task'} onClose={onClose}>
      <div className="modal-section">
        <form className="modal-form" onSubmit={handleSubmit}>
          <FormField label="Name">
            <Input
              type="text"
              placeholder="Task name"
              value={form.values.name}
              onChange={form.set('name')}
              required
              autoFocus
            />
          </FormField>
          {mode === 'edit' ? (
            <>
              <FormField label="Status" size="small">
                <Select value={form.values.status} onChange={form.set('status')}>
                  {validStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Start At" size="small">
                <Input type="date" value={form.values.startAt} onChange={form.set('startAt')} />
              </FormField>
              <FormField label="End At" size="small">
                <Input type="date" value={form.values.endAt} onChange={form.set('endAt')} />
              </FormField>
            </>
          ) : null}
          <div>
            <Button variant="primary" type="submit">{mode === 'create' ? 'Create' : 'Save'}</Button>
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
            <EmptyState style={{ marginBottom: 12, textAlign: 'left' }}>Not assigned</EmptyState>
          )}
          <FormField label="Change assignee">
            <Select value={task?.props.assigneeId ?? ''} onChange={handleAssigneeChange}>
              <option value="">None</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name}
                </option>
              ))}
            </Select>
          </FormField>
        </section>
      ) : null}
    </Modal>
  );
}
