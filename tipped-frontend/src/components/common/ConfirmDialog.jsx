import { useEffect, useId, useRef } from "react";
import { Button } from "./UI";
export default function ConfirmDialog({
  title,
  children,
  onClose,
  actions,
  className = "",
}) {
  const ref = useRef(null),
    titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
      className={`fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-lg border border-line bg-white p-5 text-ink backdrop:bg-slate-900/50 sm:p-7 ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <h2 id={titleId} className="text-xl font-bold">
          {title}
        </h2>
        <Button
          variant="text"
          className="dialog-close-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          ×
        </Button>
      </div>
      {children}
      {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
    </dialog>
  );
}
