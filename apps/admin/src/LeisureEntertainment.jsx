import { CheckCircle2, ChevronLeft, ChevronRight, ImageOff, Link2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminConfirm, AdminDrawer } from "./AdminOverlay";
import { SingleImageUpload } from "./SingleImageUpload";
import youtubeIcon from "./entertainment-youtube.svg";
import spotifyIcon from "./entertainment-spotify.svg";
import meRadioIcon from "./entertainment-meradio.svg";

export const leisureEntertainmentStorageKey = "u2g-leisure-entertainment-entries-v4";

export const initialLeisureEntertainmentEntries = [
  { id: "ENT-001", name: "YouTube", category: "视频", description: "观看精选视频与生活内容", iconData: youtubeIcon, entryUrl: "https://www.youtube.com/", whitelist: ["https://www.youtube.com", "https://youtu.be"], displayOrder: 1, enabled: true, updatedAt: "2026-10-23 10:00" },
  { id: "ENT-002", name: "Spotify", category: "音乐/电台", description: "收听音乐、播客与怀旧歌曲", iconData: spotifyIcon, entryUrl: "https://open.spotify.com/", whitelist: ["https://open.spotify.com"], displayOrder: 2, enabled: true, updatedAt: "2026-10-23 10:00" },
  { id: "ENT-003", name: "MeRadio", category: "音乐/电台", description: "收听新加坡本地广播节目", iconData: meRadioIcon, entryUrl: "https://www.melisten.sg/radio", whitelist: ["https://www.melisten.sg/radio"], displayOrder: 3, enabled: true, updatedAt: "2026-10-23 10:00" },
];

const cloneEntries = (entries) => entries.map((entry) => ({ ...entry, whitelist: [...entry.whitelist] }));
const isHttpUrl = (value) => {
  try { return ["http:", "https:"].includes(new URL(value.trim()).protocol); } catch { return false; }
};
const normalizeUrl = (value) => {
  try {
    const url = new URL(value.trim());
    return `${url.origin}${url.pathname.replace(/\/$/, "")}${url.search}`.toLowerCase();
  } catch { return value.trim().toLowerCase(); }
};
const whitelistCoversEntry = (entryUrl, whitelist) => {
  if (!isHttpUrl(entryUrl)) return false;
  const entry = new URL(entryUrl.trim());
  return whitelist.some((value) => {
    if (!isHttpUrl(value)) return false;
    const allowed = new URL(value.trim());
    const allowedPath = allowed.pathname.replace(/\/$/, "") || "/";
    return entry.origin === allowed.origin && (allowedPath === "/" || entry.pathname === allowedPath || entry.pathname.startsWith(`${allowedPath}/`));
  });
};

export function readLeisureEntertainmentEntries() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(leisureEntertainmentStorageKey) || "null");
    if (!Array.isArray(saved)) return cloneEntries(initialLeisureEntertainmentEntries);
    return cloneEntries(saved).map((entry) => {
      const preset = initialLeisureEntertainmentEntries.find((item) => item.id === entry.id);
      const invalidLegacyIcon = !entry.iconData || entry.iconData.includes("/@fs/") || entry.iconData.includes("/assets/entertainment-");
      return preset && invalidLegacyIcon ? { ...entry, iconData: preset.iconData } : entry;
    });
  } catch { return cloneEntries(initialLeisureEntertainmentEntries); }
}

function getScenarioEntries(scenario, entries) {
  const saved = cloneEntries(entries);
  const base = saved.length ? saved : cloneEntries(initialLeisureEntertainmentEntries);
  if (scenario === "empty") return [];
  if (scenario === "invalidUrl") return base.map((item, index) => index ? item : { ...item, entryUrl: "youtube.com" });
  if (scenario === "whitelistNotCover") return base.map((item, index) => index ? item : { ...item, whitelist: ["https://example.com"] });
  if (scenario === "duplicateEntry") return [...base, { ...base[0], id: "ENT-DUP", displayOrder: base.length + 1 }];
  if (scenario === "inactive") return base.map((item, index) => index === 1 ? { ...item, enabled: false } : item);
  return saved;
}

function StatusTag({ children }) {
  return <span className={`status-tag ${children === "启用" ? "success" : "neutral"}`}>{children}</span>;
}

function EntryIcon({ src, name }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <span className="entertainment-entry-icon">{src && !failed ? <img src={src} alt={`${name}图标`} onError={() => setFailed(true)}/> : <ImageOff size={17} aria-label="图标不可用"/>}</span>;
}

function validateEntry(form, entries, currentId) {
  const errors = { whitelist: {} };
  if (!form.name.trim()) errors.name = "请输入娱乐名称";
  else if (form.name.trim().length > 30) errors.name = "娱乐名称不能超过 30 个字";
  else if (entries.some((item) => item.id !== currentId && item.name.trim().toLowerCase() === form.name.trim().toLowerCase())) errors.name = "已存在同名娱乐入口";
  if (!form.category.trim()) errors.category = "请输入内容分类";
  else if (form.category.trim().length > 20) errors.category = "内容分类不能超过 20 个字";
  if (!form.description.trim()) errors.description = "请输入简短说明";
  else if (form.description.trim().length > 60) errors.description = "简短说明不能超过 60 个字";
  if (!form.iconData) errors.iconData = "请上传展示图标";
  if (!form.entryUrl.trim()) errors.entryUrl = "请输入入口 URL";
  else if (!isHttpUrl(form.entryUrl)) errors.entryUrl = "请输入合法的 http/https URL";
  else if (entries.some((item) => item.id !== currentId && normalizeUrl(item.entryUrl) === normalizeUrl(form.entryUrl))) errors.entryUrl = "该入口 URL 已被其他娱乐入口使用";
  const normalized = form.whitelist.map(normalizeUrl);
  form.whitelist.forEach((value, index) => {
    if (!value.trim()) errors.whitelist[index] = "请输入白名单地址";
    else if (!isHttpUrl(value)) errors.whitelist[index] = "请输入合法的 http/https 地址";
    else if (normalized.filter((item) => item === normalized[index]).length > 1) errors.whitelist[index] = "该地址与其他白名单地址重复";
  });
  if (form.enabled && !form.whitelist.length) errors.whitelistGeneral = "启用记录至少需要 1 条白名单地址";
  else if (form.entryUrl && form.whitelist.length && !whitelistCoversEntry(form.entryUrl, form.whitelist)) errors.whitelistGeneral = "入口 URL 未被当前白名单覆盖，请添加同域名及对应路径";
  if (!Number.isInteger(Number(form.displayOrder)) || Number(form.displayOrder) < 1) errors.displayOrder = "请输入正整数";
  return errors;
}

function EntertainmentEntryDrawer({ record, entries, onClose, onSave, onDirtyChange }) {
  const baseline = useMemo(() => ({ name: "", category: "", description: "", iconData: "", entryUrl: "", displayOrder: Math.max(0, ...entries.map((item) => Number(item.displayOrder) || 0)) + 1, enabled: true, ...record, whitelist: [...(record?.whitelist || [])] }), [entries, record]);
  const [form, setForm] = useState(baseline);
  const [errors, setErrors] = useState({ whitelist: {} });
  const [iconLoadFailed, setIconLoadFailed] = useState(false);
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [baseline, form]);

  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);
  useEffect(() => {
    const warn = (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const update = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: "" })); };
  const chooseIcon = (file) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setErrors((current) => ({ ...current, iconData: "仅支持 PNG、JPG 或 WebP 图片" })); return; }
    if (file.size > 1024 * 1024) { setErrors((current) => ({ ...current, iconData: "图片大小不能超过 1MB" })); return; }
    const reader = new FileReader();
    reader.onload = () => { update("iconData", String(reader.result || "")); setIconLoadFailed(false); };
    reader.onerror = () => setErrors((current) => ({ ...current, iconData: "图片读取失败，请重新上传" }));
    reader.readAsDataURL(file);
  };
  const updateWhitelist = (index, value) => { setForm((current) => ({ ...current, whitelist: current.whitelist.map((item, itemIndex) => itemIndex === index ? value : item) })); setErrors((current) => ({ ...current, whitelistGeneral: "", whitelist: { ...current.whitelist, [index]: "" } })); };
  const removeWhitelist = (index) => { setForm((current) => ({ ...current, whitelist: current.whitelist.filter((_, itemIndex) => itemIndex !== index) })); setErrors((current) => ({ ...current, whitelistGeneral: "", whitelist: {} })); };
  const save = () => {
    const nextErrors = validateEntry(form, entries, record?.id);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).some((key) => key !== "whitelist" && nextErrors[key]) || Object.values(nextErrors.whitelist).some(Boolean)) return;
    onSave({ ...form, id: record?.id, name: form.name.trim(), category: form.category.trim(), description: form.description.trim(), entryUrl: form.entryUrl.trim(), whitelist: form.whitelist.map((item) => item.trim()), displayOrder: Number(form.displayOrder) });
  };
  return <AdminDrawer
    title={record ? "编辑娱乐入口" : "新增娱乐入口"}
    className="entertainment-entry-drawer"
    onClose={onClose}
    footer={<><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={save}>保存入口</button></>}
  ><div className="form-section">
      <h3>基本信息</h3>
      <label><span>娱乐名称 *</span><input value={form.name} maxLength={30} onChange={(event) => update("name", event.target.value)} placeholder="例如：YouTube"/>{errors.name && <small className="field-error">{errors.name}</small>}</label>
      <div className="form-row"><label><span>内容分类 *</span><input value={form.category} maxLength={20} onChange={(event) => update("category", event.target.value)} placeholder="例如：视频"/>{errors.category && <small className="field-error">{errors.category}</small>}</label><label><span>展示顺序 *</span><input type="number" min="1" value={form.displayOrder} onChange={(event) => update("displayOrder", event.target.value)}/>{errors.displayOrder && <small className="field-error">{errors.displayOrder}</small>}</label></div>
      <label><span>简短说明 *</span><textarea rows="3" maxLength={60} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="用于老人端娱乐卡片说明"/><small className="field-count">{form.description.length}/60</small>{errors.description && <small className="field-error">{errors.description}</small>}</label>
      <div className="single-image-form-item"><span>展示图标 *</span><SingleImageUpload value={form.iconData} alt="展示图标预览" accept="image/png,image/jpeg,image/webp" hint="支持 PNG、JPG、WebP，大小不超过 1MB" error={errors.iconData} loadFailed={iconLoadFailed} onLoadError={() => setIconLoadFailed(true)} onFileSelect={chooseIcon} onRemove={() => { update("iconData", ""); setIconLoadFailed(false); }}/></div>
      <h3>访问配置</h3>
      <label><span>入口 URL *</span><input type="url" value={form.entryUrl} onChange={(event) => update("entryUrl", event.target.value)} placeholder="https://example.com/"/>{errors.entryUrl && <small className="field-error">{errors.entryUrl}</small>}</label>
      <div className="entertainment-whitelist-heading"><div><b>白名单地址</b><span>入口 URL 必须被自身白名单覆盖</span></div><button type="button" className="secondary-button" onClick={() => setForm((current) => ({ ...current, whitelist: [...current.whitelist, ""] }))}><Plus size={14}/>添加地址</button></div>
      <div className="entertainment-whitelist-list">{form.whitelist.map((value, index) => <div key={index}><span>{index + 1}</span><label><input aria-label={`白名单地址 ${index + 1}`} value={value} onChange={(event) => updateWhitelist(index, event.target.value)} placeholder="https://example.com"/>{errors.whitelist[index] && <small className="field-error">{errors.whitelist[index]}</small>}</label><button type="button" className="icon-button" aria-label={`删除白名单地址 ${index + 1}`} onClick={() => removeWhitelist(index)}><Trash2 size={15}/></button></div>)}</div>
      {!form.whitelist.length && <div className="entertainment-whitelist-empty">暂无白名单地址</div>}{errors.whitelistGeneral && <small className="field-error entertainment-general-error">{errors.whitelistGeneral}</small>}
      <h3>启用状态</h3>
      <div className="strategy-enable-options"><button type="button" className={form.enabled ? "active" : ""} onClick={() => update("enabled", true)}><b>启用</b><small>所有社区老人端可展示</small></button><button type="button" className={!form.enabled ? "active" : ""} onClick={() => update("enabled", false)}><b>停用</b><small>保留配置但不再展示</small></button></div>
    </div></AdminDrawer>;
}

export function LeisureEntertainmentPage({ entries, onChange, scenario = "normal", resetSignal = 0, onDirtyChange }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部分类");
  const [status, setStatus] = useState("全部状态");
  const [editing, setEditing] = useState(undefined);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [disableTarget, setDisableTarget] = useState(null);
  const [feedback, setFeedback] = useState("");
  useEffect(() => { setEditing(undefined); setDeleteTarget(null); setDisableTarget(null); setQuery(""); setCategory("全部分类"); setStatus("全部状态"); setFeedback(scenario === "saveSuccess" ? "娱乐入口已保存" : ""); onDirtyChange?.(false); }, [onDirtyChange, resetSignal, scenario]);
  const scenarioEntries = useMemo(() => getScenarioEntries(scenario, entries), [entries, scenario]);
  const categoryOptions = useMemo(() => [...new Set(scenarioEntries.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN")), [scenarioEntries]);
  const rows = scenarioEntries.filter((item) => { const keyword = query.trim().toLowerCase(); return (!keyword || `${item.name}${item.description}${item.entryUrl}`.toLowerCase().includes(keyword)) && (category === "全部分类" || item.category === category) && (status === "全部状态" || (item.enabled ? "启用" : "停用") === status); }).sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder) || a.name.localeCompare(b.name));
  const persist = (next, message) => { onChange(next.sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder) || a.name.localeCompare(b.name))); setFeedback(message); };
  const saveEntry = (entry) => {
    const now = "2026-10-23 15:30";
    if (entry.id) persist(entries.map((item) => item.id === entry.id ? { ...item, ...entry, updatedAt: now } : item), "娱乐入口已保存");
    else { const nextNumber = Math.max(0, ...entries.map((item) => Number(item.id.split("-").pop()) || 0)) + 1; persist([...entries, { ...entry, id: `ENT-${String(nextNumber).padStart(3, "0")}`, updatedAt: now }], "娱乐入口已新增"); }
    setEditing(undefined); onDirtyChange?.(false);
  };
  const move = (id, offset) => {
    const sorted = [...entries].sort((a, b) => a.displayOrder - b.displayOrder); const index = sorted.findIndex((item) => item.id === id); const targetIndex = index + offset;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;
    const currentOrder = sorted[index].displayOrder; sorted[index] = { ...sorted[index], displayOrder: sorted[targetIndex].displayOrder, updatedAt: "2026-10-23 15:30" }; sorted[targetIndex] = { ...sorted[targetIndex], displayOrder: currentOrder, updatedAt: "2026-10-23 15:30" }; persist(sorted, "展示顺序已更新");
  };
  return <>
    <div className="page-heading"><div><h1>休闲娱乐</h1><p>统一维护所有社区老人端的娱乐入口</p></div><button className="primary-button" onClick={() => setEditing(null)}><Plus size={16}/>新增娱乐入口</button></div>
    <section className="panel management-panel entertainment-management">
      <div className="filters entertainment-filters"><label><span>关键字</span><div className="input-wrap"><Link2 size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="娱乐名称、说明或入口 URL"/></div></label><label><span>内容分类</span><select className="select-control filter-select" value={category} onChange={(event) => setCategory(event.target.value)}><option>全部分类</option>{categoryOptions.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>启用状态</span><select className="select-control filter-select" value={status} onChange={(event) => setStatus(event.target.value)}><option>全部状态</option><option>启用</option><option>停用</option></select></label></div>
      <div className="table-scroll"><table className="entertainment-table"><thead><tr><th>娱乐名称</th><th>内容分类</th><th>入口 URL</th><th>白名单数量</th><th>展示顺序</th><th>启用状态</th><th>最后更新</th><th className="sticky-right">操作</th></tr></thead><tbody>
        {rows.map((item, index) => <tr key={item.id}><td><div className="entertainment-name-cell"><EntryIcon src={item.iconData} name={item.name}/><div><b>{item.name}</b><small>{item.description}</small></div></div></td><td>{item.category}</td><td><span className="entertainment-url" title={item.entryUrl}>{item.entryUrl}</span></td><td>{item.whitelist.length} 条</td><td><div className="recommendation-order-control"><button aria-label={`${item.name}上移`} disabled={index === 0 || scenario !== "normal"} onClick={() => move(item.id, -1)}><ChevronLeft size={14}/></button><b>{item.displayOrder}</b><button aria-label={`${item.name}下移`} disabled={index === rows.length - 1 || scenario !== "normal"} onClick={() => move(item.id, 1)}><ChevronRight size={14}/></button></div></td><td><StatusTag>{item.enabled ? "启用" : "停用"}</StatusTag></td><td>{item.updatedAt}</td><td className="sticky-right"><button className="table-action" onClick={() => setEditing(item)}>编辑</button><button className="table-action" onClick={() => item.enabled ? setDisableTarget(item) : setEditing({ ...item, enabled: true })}>{item.enabled ? "停用" : "启用"}</button><button className="table-action danger-text" onClick={() => setDeleteTarget(item)}>删除</button></td></tr>)}
        {!rows.length && <tr><td colSpan="8"><div className="empty-table-state">暂无娱乐入口，可点击“新增娱乐入口”建立所有社区共用的内容。</div></td></tr>}
      </tbody></table></div><div className="pagination"><span>当前展示 {rows.length} 条数据</span><span>所有社区共用同一份清单</span></div>
    </section>
    {feedback && <div className="reminder-feedback leisure-save-feedback" role="status"><CheckCircle2 size={16}/>{feedback}</div>}
    {editing !== undefined && <EntertainmentEntryDrawer key={editing?.id || "new-entertainment-entry"} record={editing} entries={entries} onClose={() => { setEditing(undefined); onDirtyChange?.(false); }} onSave={saveEntry} onDirtyChange={onDirtyChange}/>}
    {deleteTarget && <AdminConfirm title={`删除“${deleteTarget.name}”？`} description="删除后，所有社区老人端都不再展示该入口；已有历史打开记录不受影响。" confirmLabel="确认删除" onClose={() => setDeleteTarget(null)} onConfirm={() => { persist(entries.filter((item) => item.id !== deleteTarget.id), "娱乐入口已删除"); setDeleteTarget(null); }}/>}
    {disableTarget && <AdminConfirm title={`停用“${disableTarget.name}”？`} description="停用后，所有社区老人端将停止展示该入口，相关推荐不再生效，但平台配置和历史记录保留。" confirmLabel="确认停用" onClose={() => setDisableTarget(null)} onConfirm={() => { persist(entries.map((item) => item.id === disableTarget.id ? { ...item, enabled: false, updatedAt: "2026-10-23 15:30" } : item), "娱乐入口已停用"); setDisableTarget(null); }}/>}
  </>;
}
