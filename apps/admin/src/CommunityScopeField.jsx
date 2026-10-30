import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";

export function CommunityScopeField({
  mode,
  selectedIds = [],
  communities = [],
  onModeChange,
  onSelectedIdsChange,
  error = "",
  label = "服务范围 *",
  disabled = false,
}) {
  const groupName = useId();
  const listboxId = useId();
  const pickerRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [panelStyle, setPanelStyle] = useState({ left: 12, top: 12, width: 320 });
  const activeError = mode === "specified" && error
    ? (selectedIds.length ? error : "请选择至少一个服务社区")
    : "";
  const selectedCommunities = communities.filter((community) => selectedIds.includes(community.id));
  const filteredCommunities = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return communities;
    return communities.filter((community) => [community.name, community.id, community.address, community.country]
      .some((value) => String(value || "").toLowerCase().includes(keyword)));
  }, [communities, query]);

  const updatePanelPosition = () => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 6;
    const width = Math.min(rect.width, window.innerWidth - viewportPadding * 2);
    const left = Math.min(Math.max(rect.left, viewportPadding), window.innerWidth - width - viewportPadding);
    const panelHeight = panel?.getBoundingClientRect().height || 300;
    const canOpenBelow = window.innerHeight - rect.bottom >= Math.min(panelHeight, 300) + gap + viewportPadding;
    const top = canOpenBelow ? rect.bottom + gap : Math.max(viewportPadding, rect.top - panelHeight - gap);
    setPanelStyle({ left, top, width });
  };

  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(updatePanelPosition);
    const handleOutside = (event) => {
      if (pickerRef.current?.contains(event.target) || panelRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (mode !== "specified" || disabled) {
      setOpen(false);
      setQuery("");
    }
  }, [disabled, mode]);

  const toggleCommunity = (communityId) => {
    if (disabled) return;
    onSelectedIdsChange?.(selectedIds.includes(communityId)
      ? selectedIds.filter((id) => id !== communityId)
      : [...selectedIds, communityId]);
  };
  const changeMode = (nextMode) => {
    if (disabled) return;
    onModeChange?.(nextMode);
  };
  const clearSelected = () => {
    if (!disabled) onSelectedIdsChange?.([]);
  };
  const selectAllFiltered = () => {
    if (disabled) return;
    onSelectedIdsChange?.([...new Set([...selectedIds, ...filteredCommunities.map((community) => community.id)])]);
  };

  return <div className={`community-scope-field${disabled ? " is-disabled" : ""}`}>
    <span className="community-scope-label">{label}</span>
    <div className="scope-radio-group">
      <label><input type="radio" name={groupName} value="all" checked={mode === "all"} disabled={disabled} onChange={() => changeMode("all")}/><span><b>全部社区</b><small>服务对所有社区可见</small></span></label>
      <label><input type="radio" name={groupName} value="specified" checked={mode === "specified"} disabled={disabled} onChange={() => changeMode("specified")}/><span><b>指定社区</b><small>仅对已选社区可见</small></span></label>
    </div>
    {mode === "specified" && <div className="community-scope-picker" ref={pickerRef}>
      <span className="community-scope-picker-label">选择社区</span>
      <button
        ref={triggerRef}
        type="button"
        className={`community-scope-trigger${open ? " is-open" : ""}${activeError ? " has-error" : ""}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-invalid={Boolean(activeError)}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={selectedCommunities.length ? "has-value" : "placeholder"}>
          {selectedCommunities.length ? `已选 ${selectedCommunities.length} 个社区` : "请选择服务社区"}
        </span>
        <ChevronDown size={16}/>
      </button>
      {selectedCommunities.length > 0 && <div className="community-scope-tags">
        {selectedCommunities.map((community) => <span key={community.id}>{community.name}<button type="button" disabled={disabled} aria-label={`移除${community.name}`} onClick={() => toggleCommunity(community.id)}><X size={12}/></button></span>)}
      </div>}
      {open && createPortal(
        <div ref={panelRef} className="community-scope-dropdown" style={panelStyle}>
          <div className="community-scope-dropdown-search">
            <Search size={16} aria-hidden="true"/>
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索社区名称、ID 或地址"/>
            {query && <button type="button" aria-label="清空社区搜索" onClick={() => setQuery("")}><X size={14}/></button>}
          </div>
          <div className="community-scope-dropdown-toolbar">
            <span>已选 {selectedCommunities.length} 个{query.trim() ? ` · 匹配 ${filteredCommunities.length} 个` : ""}</span>
            <div><button type="button" onClick={selectAllFiltered}>全选</button><button type="button" disabled={!selectedIds.length} onClick={clearSelected}>清空</button></div>
          </div>
          <div id={listboxId} role="listbox" aria-multiselectable="true" className="community-scope-dropdown-list">
            {filteredCommunities.map((community) => {
              const checked = selectedIds.includes(community.id);
              return <button key={community.id} type="button" role="option" aria-selected={checked} className={checked ? "is-selected" : ""} onClick={() => toggleCommunity(community.id)}>
                <span className="community-scope-option-check">{checked && <Check size={13}/>}</span>
                <span><b>{community.name}</b><small>{community.id}{community.address ? ` · ${community.address}` : ""}</small></span>
              </button>;
            })}
            {!filteredCommunities.length && <div className="community-scope-dropdown-empty">没有符合关键字的社区</div>}
          </div>
        </div>,
        document.body,
      )}
    </div>}
    <small className={`community-scope-error ${activeError ? "has-error" : ""}`} role={activeError ? "alert" : undefined}>{activeError || "\u00a0"}</small>
  </div>;
}
