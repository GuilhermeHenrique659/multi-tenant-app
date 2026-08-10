import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Shares the `form-input` look with the single line fields. */
export default function Textarea({ className, ...rest }: Readonly<TextareaProps>) {
  return <textarea className={className ? `form-input ${className}` : "form-input"} {...rest} />;
}
