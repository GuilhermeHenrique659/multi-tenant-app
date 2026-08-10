import type { ReactNode } from "react";

/**
 * Each kind of badge has its own family of classes in the stylesheet, and the
 * tone is the value being shown, such as a task status or a member role.
 */
const BASE_CLASS = {
  task: "task-status",
  step: "worker-step-status",
  project: "project-status-label",
  role: "member-role",
} as const;

type BadgeProps = {
  kind: keyof typeof BASE_CLASS;
  tone: string;
  children: ReactNode;
};

export default function Badge({ kind, tone, children }: Readonly<BadgeProps>) {
  const base = BASE_CLASS[kind];

  return <span className={`${base} ${base}--${tone}`}>{children}</span>;
}
