import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleHelp } from "lucide-react";

export function MetricHelp({ content, label = "查看指标口径说明" }) {
  const tooltipId = useId();
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12, placement: "top" });
  const open = hovered || focused;

  useEffect(() => {
    if (!open) return undefined;
    const updatePosition = () => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;
      if (!trigger || !tooltip) return;
      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportPadding = 12;
      const gap = 8;
      const preferredLeft = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      const left = Math.min(Math.max(preferredLeft, viewportPadding), window.innerWidth - tooltipRect.width - viewportPadding);
      const hasTopSpace = triggerRect.top >= tooltipRect.height + gap + viewportPadding;
      const top = hasTopSpace ? triggerRect.top - tooltipRect.height - gap : triggerRect.bottom + gap;
      setPosition({ left, top, placement: hasTopSpace ? "top" : "bottom" });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return <>
    <button
      ref={triggerRef}
      type="button"
      className="admin-metric-help"
      aria-label={label}
      aria-describedby={open ? tooltipId : undefined}
      aria-expanded={open}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={(event) => { if (event.key === "Escape") { setHovered(false); setFocused(false); event.currentTarget.blur(); } }}
    >
      <CircleHelp size={15}/>
    </button>
    {open && createPortal(
      <span
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        className={`admin-tooltip placement-${position.placement}`}
        style={{ left: position.left, top: position.top }}
      >
        {content}
      </span>,
      document.body,
    )}
  </>;
}
