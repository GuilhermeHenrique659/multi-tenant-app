type StatusDotProps = {
  tone: string;
};

/** The coloured dot beside the name of a project in the sidebar. */
export default function StatusDot({ tone }: Readonly<StatusDotProps>) {
  return <span className={`project-status project-status--${tone}`} />;
}
