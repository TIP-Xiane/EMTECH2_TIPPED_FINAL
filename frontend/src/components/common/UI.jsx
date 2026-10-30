export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn ${variant === "secondary" ? "btn-secondary" : variant === "text" ? "btn-text" : ""} ${className}`}
      {...props}
    />
  );
}
export function PageHeading({
  eyebrow = "T.I.P. MANILA / CAMPUS SERVICES",
  title,
  children,
  action,
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold tracking-widest text-burgundy">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
        {children && (
          <p className="mt-2 max-w-3xl leading-6 text-muted">{children}</p>
        )}
      </div>
      {action}
    </div>
  );
}
export function EmptyState({ title = "No records yet", children, action }) {
  return (
    <div className="panel py-12 text-center">
      <h3 className="font-bold">{title}</h3>
      <p className="mx-auto my-3 max-w-md leading-6 text-muted">{children}</p>
      {action}
    </div>
  );
}
export function LoadingState() {
  return (
    <div role="status" className="p-8 text-muted">
      Loading the TIPPED preview…
    </div>
  );
}
export function DashboardCounter({ label, value }) {
  return (
    <div className="min-w-0 border-r border-line pr-6 last:border-0">
      <strong className="mr-2 text-2xl font-bold">{value}</strong>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
