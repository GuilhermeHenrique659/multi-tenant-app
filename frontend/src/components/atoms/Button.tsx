import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "primary" | "danger";

type ButtonSize = "default" | "small";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * Holds the `btn` classes, so a caller picks a variant instead of writing the
 * class names again. `type` defaults to "button" to not submit a form by accident.
 */
export default function Button({
  variant = "default",
  size = "default",
  type = "button",
  className,
  ...rest
}: Readonly<ButtonProps>) {
  const classes = ["btn"];

  if (variant !== "default") classes.push(`btn--${variant}`);
  if (size !== "default") classes.push(`btn--${size}`);
  if (className) classes.push(className);

  return <button className={classes.join(" ")} type={type} {...rest} />;
}
