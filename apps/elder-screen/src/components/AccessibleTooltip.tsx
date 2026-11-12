import { useEffect, useRef, useState, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";

interface AccessibleTooltipProps {
  id: string;
  label: string;
  children: ReactNode;
}

export default function AccessibleTooltip({ id, label, children }: AccessibleTooltipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeWhenOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeWhenOutside);
    return () => document.removeEventListener("pointerdown", closeWhenOutside);
  }, [open]);

  return (
    <span ref={rootRef} className="accessible-tooltip" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="accessible-tooltip__trigger"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            event.currentTarget.blur();
          }
        }}
      >
        <CircleHelp aria-hidden="true" />
      </button>
      {open && <span id={id} className="accessible-tooltip__content" role="tooltip">{children}</span>}
    </span>
  );
}
