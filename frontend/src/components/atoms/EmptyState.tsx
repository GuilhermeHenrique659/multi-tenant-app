import type { HTMLAttributes } from "react";

type EmptyStateProps = HTMLAttributes<HTMLParagraphElement>;

/** The line shown in place of a list that has nothing in it. */
export default function EmptyState({ className, ...rest }: Readonly<EmptyStateProps>) {
  return <p className={className ? `empty-state ${className}` : "empty-state"} {...rest} />;
}
