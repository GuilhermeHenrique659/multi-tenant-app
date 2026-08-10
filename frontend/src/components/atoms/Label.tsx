import type { LabelHTMLAttributes } from "react";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export default function Label({ className, ...rest }: Readonly<LabelProps>) {
  return <label className={className ? `form-label ${className}` : "form-label"} {...rest} />;
}
