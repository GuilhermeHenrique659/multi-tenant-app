import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Every text field of the app shares the `form-input` look. */
export default function Input({ className, ...rest }: Readonly<InputProps>) {
  return <input className={className ? `form-input ${className}` : "form-input"} {...rest} />;
}
