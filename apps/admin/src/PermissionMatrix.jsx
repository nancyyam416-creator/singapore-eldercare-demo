import { useEffect, useMemo, useRef } from "react";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import "./permission-matrix.css";

function MatrixCheckbox({ checked, indeterminate = false, disabled = false, label, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return <input ref={ref} type="checkbox" aria-label={label} checked={checked} disabled={disabled} onChange={(event) => onChange?.(event.target.checked)}/>;
}

function selectionState(ids, value) {
  if (!ids.length) return { checked: false, indeterminate: false };
  const selected = ids.filter((id) => value.has(id)).length;
  return { checked: selected === ids.length, indeterminate: selected > 0 && selected < ids.length };
}

export function PermissionMatrix({
  groups = [],
  actionLabels = {},
  value = {},
  onChange,
  onCancel,
  onSave,
  saveLabel = "保存权限配置",
  saving = false,
  readOnly = false,
  showReadOnlyNotice = true,
  disabled = false,
  protectedRole = false,
  permissionDenied = false,
  disabledReason = "当前状态不可修改权限",
  className = "",
}) {
  const locked = readOnly || disabled || protectedRole || permissionDenied || saving;
  const normalized = useMemo(() => Object.fromEntries(Object.entries(value).map(([rowId, actions]) => [rowId, new Set(actions)])), [value]);
  const selectedPairs = useMemo(() => new Set(groups.flatMap((group) => group.rows.flatMap((row) => row.actions.filter((actionId) => normalized[row.id]?.has(actionId)).map((actionId) => `${row.id}:${actionId}`)))), [groups, normalized]);

  const emit = (pairs) => {
    const next = {};
    groups.forEach((group) => group.rows.forEach((row) => {
      next[row.id] = row.actions.filter((actionId) => pairs.has(`${row.id}:${actionId}`));
    }));
    onChange?.(next);
  };
  const togglePairs = (pairIds, checked) => {
    if (locked) return;
    const next = new Set(selectedPairs);
    pairIds.forEach((id) => checked ? next.add(id) : next.delete(id));
    emit(next);
  };

  if (permissionDenied) return <section className={`permission-matrix permission-matrix-denied ${className}`}><ShieldAlert size={28}/><h3>无权限查看角色授权</h3><p>当前账号没有查看或配置该角色权限的权限。</p></section>;

  return <section className={`permission-matrix ${locked ? "is-locked" : ""} ${className}`}>
    {(protectedRole || (readOnly && showReadOnlyNotice) || disabled) && <div className="permission-matrix-notice"><LockKeyhole size={16}/><span>{protectedRole ? "内置角色权限受保护，仅支持查看。" : readOnly ? "当前为只读状态，不能修改权限。" : disabledReason}</span></div>}
    <div className="permission-matrix-scroll">
      <div className="permission-groups">{groups.map((group) => <section className="permission-group" key={group.id}><header><span>{group.label}</span></header><div className="permission-card-list">{group.rows.map((row) => { const rowPairs = row.actions.map((actionId) => `${row.id}:${actionId}`); const rowState = selectionState(rowPairs, selectedPairs); const rowDisabled = locked || row.disabled; return <article className={`permission-menu-card ${rowDisabled ? "is-disabled" : ""}`} key={row.id}><div className="permission-menu-card-head"><label><MatrixCheckbox label={`全选${row.label}`} checked={rowState.checked} indeterminate={rowState.indeterminate} disabled={rowDisabled || !rowPairs.length} onChange={(checked) => togglePairs(rowPairs, checked)}/><b>{row.label}</b></label></div><div className="permission-action-list">{row.actions.map((actionId) => <label key={actionId}><MatrixCheckbox label={`${row.label}：${actionLabels[actionId] || actionId}`} checked={normalized[row.id]?.has(actionId) || false} disabled={rowDisabled} onChange={(checked) => togglePairs([`${row.id}:${actionId}`], checked)}/><span>{actionLabels[actionId] || actionId}</span></label>)}</div></article>; })}</div></section>)}</div>
    </div>
    {onSave && !protectedRole && <footer>{onCancel && <button className="secondary-button" disabled={saving} onClick={onCancel}>取消</button>}<button className="primary-button" disabled={locked} onClick={onSave}>{saving ? "保存中…" : saveLabel}</button></footer>}
  </section>;
}
