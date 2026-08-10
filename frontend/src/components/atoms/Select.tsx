import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Shares the `form-input` look; the options come as children. */
export default function Select({ className, ...rest }: Readonly<SelectProps>) {
  return <select className={className ? `form-input ${className}` : "form-input"} {...rest} />;
}
