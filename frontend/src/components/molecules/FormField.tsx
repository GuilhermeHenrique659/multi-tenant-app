import type { ReactNode } from "react";
import Label from "../atoms/Label";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  size?: "default" | "small";
  children: ReactNode;
};

/** A label above its field, which is the shape every form of the app uses. */
export default function FormField({ label, htmlFor, size = "default", children }: Readonly<FormFieldProps>) {
  return (
    <div className={size === "small" ? "form-field form-field--small" : "form-field"}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
