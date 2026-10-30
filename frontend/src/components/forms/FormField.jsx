import { useId } from "react";
export default function FormField({
  label,
  error,
  hint,
  as = "input",
  children,
  required = false,
  id: explicitId,
  ...props
}) {
  const generated = useId(),
    id = explicitId || generated,
    Tag = as;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-semibold">
        {label}
        {required ? " *" : ""}
      </label>
      <Tag
        id={id}
        className="input"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        {...props}
      >
        {children}
      </Tag>
      {hint && (
        <p id={`${id}-hint`} className="mt-2 text-xs leading-5 text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-xs text-rose-800">
          {error}
        </p>
      )}
    </div>
  );
}
