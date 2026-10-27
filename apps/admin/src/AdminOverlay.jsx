import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

function useOverlayLifecycle(onClose, { closeDisabled = false, containerRef } = {}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !closeDisabled) onClose?.();
      if (event.key !== "Tab" || !containerRef?.current) return;
      const focusable = [...containerRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement && document.contains(previousFocus)) previousFocus.focus();
    };
  }, [closeDisabled, containerRef, onClose]);
}

export function AdminDrawer({ title, ariaLabel, className = "", onClose, children, footer }) {
  const titleId = useId();
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);
  useOverlayLifecycle(onClose, { containerRef: drawerRef });
  useEffect(() => closeButtonRef.current?.focus(), []);

  return <div className="drawer-layer" role="presentation">
    <button className="drawer-backdrop" aria-label="关闭抽屉" onClick={onClose}/>
    <aside ref={drawerRef} className={`drawer ${className}`.trim()} role="dialog" aria-modal="true" aria-label={ariaLabel} aria-labelledby={ariaLabel ? undefined : titleId}>
      <header className="admin-overlay-header">
        <h2 id={titleId}>{title}</h2>
        <button ref={closeButtonRef} type="button" className="icon-button" aria-label="关闭" onClick={onClose}><X size={19}/></button>
      </header>
      <div className="drawer-body">{children}</div>
      {footer && <footer className="admin-overlay-footer">{footer}</footer>}
    </aside>
  </div>;
}

export function AdminModal({ title, ariaLabel, className = "", onClose, children, footer }) {
  const titleId = useId();
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);
  useOverlayLifecycle(onClose, { containerRef: dialogRef });
  useEffect(() => closeButtonRef.current?.focus(), []);

  return <div className={`modal-layer ${className}`.trim()}>
    <button className="modal-backdrop" aria-label="关闭弹窗" onClick={onClose}/>
    <section ref={dialogRef} className="admin-modal-dialog" role="dialog" aria-modal="true" aria-label={ariaLabel} aria-labelledby={ariaLabel ? undefined : titleId}>
      <header className="admin-overlay-header">
        <h2 id={titleId}>{title}</h2>
        <button ref={closeButtonRef} type="button" className="icon-button" aria-label="关闭" onClick={onClose}><X size={19}/></button>
      </header>
      <div className="admin-modal-body">{children}</div>
      {footer && <footer className="admin-overlay-footer">{footer}</footer>}
    </section>
  </div>;
}

export function AdminConfirm({
  title,
  description,
  impacts = [],
  note,
  severity,
  danger = true,
  onClose,
  confirmLabel = "确认",
  cancelLabel = "取消",
  loading = false,
  loadingLabel = "提交中…",
  error = "",
  onConfirm,
  icon,
  className = "",
}) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef(null);
  const dialogRef = useRef(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState("");
  const activeLoading = loading || internalLoading;
  const activeError = error || internalError;
  const activeSeverity = severity || (danger ? "danger" : "default");
  useOverlayLifecycle(onClose, { closeDisabled: activeLoading, containerRef: dialogRef });
  useEffect(() => cancelButtonRef.current?.focus(), []);
  const close = () => { if (!activeLoading) onClose?.(); };
  const submit = async () => {
    if (!onConfirm || activeLoading) return;
    setInternalError("");
    setInternalLoading(true);
    try {
      await onConfirm();
    } catch (submitError) {
      setInternalError(submitError instanceof Error ? submitError.message : "操作失败，请重试。");
    } finally {
      setInternalLoading(false);
    }
  };

  return <div className={`modal-layer ${className}`.trim()}>
    <button className="modal-backdrop" aria-label="关闭确认弹窗" disabled={activeLoading} onClick={close}/>
    <section ref={dialogRef} className={`confirm-dialog severity-${activeSeverity}`} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={activeLoading}>
      <span className={`confirm-icon ${activeSeverity}`}>{icon || <AlertTriangle size={20}/>}</span>
      <h3 id={titleId}>{title}</h3>
      <div className="confirm-content" id={descriptionId}>
        {description && <p>{description}</p>}
        {impacts.length > 0 && <ul>{impacts.map((item, index) => <li key={index}>{item}</li>)}</ul>}
        {note && <div className="confirm-note">{note}</div>}
        {activeError && <div className="confirm-error" role="alert">{activeError}</div>}
      </div>
      <div className="confirm-actions">
        <button ref={cancelButtonRef} type="button" className="secondary-button" disabled={activeLoading} onClick={close}>{cancelLabel}</button>
        {onConfirm && <button type="button" className={activeSeverity === "danger" ? "danger-button" : "primary-button"} disabled={activeLoading} onClick={submit}>{activeLoading ? loadingLabel : confirmLabel}</button>}
      </div>
    </section>
  </div>;
}

export function AdminToast({ message, actionLabel, onAction, onClose, tone = "success" }) {
  return <div className={`admin-toast tone-${tone}`} role="status" aria-live="polite">
    <CheckCircle2 size={17}/>
    <span>{message}</span>
    {actionLabel && onAction && <button type="button" onClick={onAction}>{actionLabel}</button>}
    {onClose && <button type="button" className="admin-toast-close" aria-label="关闭提示" onClick={onClose}><X size={15}/></button>}
  </div>;
}
