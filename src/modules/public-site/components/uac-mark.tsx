interface UacMarkProps {
  className?: string;
  title?: string;
}

export function UacMark({ className, title }: UacMarkProps) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      className={className}
      role={title ? "img" : undefined}
      viewBox="0 0 48 48"
    >
      {title ? <title>{title}</title> : null}
      <path
        d="m24 3 5.2 14.1 15.1.6-11.9 9.4 4.1 14.6L24 33.3l-12.5 8.4 4.1-14.6-11.9-9.4 15.1-.6Z"
        fill="currentColor"
      />
    </svg>
  );
}
