import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleHelp } from "lucide-react";
import "./AdminTooltip.css";

export function AdminTooltip({ content, label = "查看补充说明", iconSize = 15, className = "" }) {
  const tooltipId = useId();
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12, placement: "top" });
  const open = Boolean(content) && !dismissed && (hovered || focused || pinned);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const updatePosition = () => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;
      if (!trigger || !tooltip) return;
      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportPadding = 12;
      const gap = 8;
      const maxLeft = Math.max(viewportPadding, window.innerWidth - tooltipRect.width - viewportPadding);
      const preferredLeft = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      const left = Math.min(Math.max(preferredLeft, viewportPadding), maxLeft);
      const hasTopSpace = triggerRect.top >= tooltipRect.height + gap + viewportPadding;
      const preferredTop = hasTopSpace ? triggerRect.top - tooltipRect.height - gap : triggerRect.bottom + gap;
      const maxTop = Math.max(viewportPadding, window.innerHeight - tooltipRect.height - viewportPadding);
      const top = Math.min(Math.max(preferredTop, viewportPadding), maxTop);
      setPosition({ left, top, placement: hasTopSpace ? "top" : "bottom" });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, content]);

  useEffect(() => {
    if (!open) return undefined;
    const closeFromOutside = (event) => {
      if (triggerRef.current?.contains(event.target) || tooltipRef.current?.contains(event.target)) return;
      setPinned(false);
      setHovered(false);
      setFocused(false);
      setDismissed(true);
    };
    const closeFromEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setPinned(false);
      setHovered(false);
      setFocused(false);
      setDismissed(true);
    };
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape, true);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape, true);
    };
  }, [open]);

  if (!content) return null;

  return <>
    <button
      ref={triggerRef}
      type="button"
      className={`admin-tooltip-trigger ${className}`.trim()}
      aria-label={label}
      aria-describedby={open ? tooltipId : undefined}
      aria-expanded={open}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        if (pinned) {
          setPinned(false);
          setHovered(false);
          setFocused(false);
          setDismissed(true);
          return;
        }
        setDismissed(false);
        setPinned(true);
      }}
      onMouseEnter={() => { setDismissed(false); setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => { setDismissed(false); setFocused(true); }}
      onBlur={() => setFocused(false)}
    >
      <CircleHelp size={iconSize}/>
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
