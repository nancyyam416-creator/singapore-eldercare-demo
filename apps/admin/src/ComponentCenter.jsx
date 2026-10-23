import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Boxes, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, Database, ImageOff, Layers3, Search } from "lucide-react";
import { AdminConfirm, AdminDrawer } from "./AdminOverlay";
import { SingleImageUpload } from "./SingleImageUpload";
import { componentAssetTypeMeta, componentCatalog, componentCategories, componentStatusMeta } from "./componentCatalog";
import youtubeIcon from "./entertainment-youtube.svg";
import "./component-center.css";

const statusFilters = [{ id: "all", label: "全部" }, { id: "stable", label: "已稳定" }, { id: "migrating", label: "迁移中" }, { id: "pending", label: "待处理" }];

function StatusChip({ status }) {
  const meta = componentStatusMeta[status];
  return <span className={`component-status ${meta.tone}`}>{meta.label}</span>;
}

function ConfirmPreview({ onOpen }) {
  const [severity, setSeverity] = useState("danger");
  const [state, setState] = useState("normal");
  return <div className="component-preview-stack">
    <div className="component-preview-controls"><label><span>危险级别</span><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="default">default</option><option value="warning">warning</option><option value="danger">danger</option></select></label><label><span>提交状态</span><select value={state} onChange={(event) => setState(event.target.value)}><option value="normal">正常</option><option value="loading">loading</option><option value="error">失败</option></select></label></div>
    <div className="component-preview-callout"><AlertTriangle size={20}/><div><b>高影响操作使用统一弹窗</b><p>演示只切换本地状态，不修改任何业务数据。</p></div></div>
    <button className="primary-button" onClick={() => onOpen({ severity, state })}>打开真实 AdminConfirm</button>
  </div>;
}

function UploadPreview() {
  const [state, setState] = useState("empty");
  const [localImage, setLocalImage] = useState("");
  const value = localImage || (state === "uploaded" ? youtubeIcon : "");
  const error = state === "format" ? "仅支持 PNG、JPG 或 WebP 图片" : state === "oversize" ? "图片大小不能超过 1MB" : "";
  const read = (file) => { const reader = new FileReader(); reader.onload = () => { setLocalImage(String(reader.result || "")); setState("uploaded"); }; reader.readAsDataURL(file); };
  return <div className="component-preview-stack"><div className="component-state-tabs">{[["empty", "未上传"], ["uploaded", "已上传"], ["format", "格式错误"], ["oversize", "超限错误"]].map(([id, label]) => <button className={state === id ? "active" : ""} key={id} onClick={() => { setState(id); setLocalImage(""); }}>{label}</button>)}</div><SingleImageUpload value={value} alt="展示图标预览" accept="image/png,image/jpeg,image/webp" hint="支持 PNG、JPG、WebP，大小不超过 1MB" error={error} loadFailed={false} onFileSelect={read} onRemove={() => { setLocalImage(""); setState("empty"); }}/></div>;
}

function StaticPreview({ id, onOpenDrawer, onOpenModal }) {
  if (id === "admin-drawer") return <div className="component-preview-stack"><div className="component-preview-callout"><Layers3 size={20}/><div><b>标准右侧抽屉</b><p>标题无副标题，Body 长内容独立滚动，Footer 保持可见。</p></div></div><button className="primary-button" onClick={onOpenDrawer}>打开真实 AdminDrawer</button></div>;
  if (id === "admin-modal") return <div className="component-preview-stack"><div className="component-preview-callout muted"><CircleDashed size={20}/><div><b>当前仅有 Modal 公共样式</b><p>可预览现有 modal-layer 外观，但 AdminModal 组件尚未抽取。</p></div></div><button className="secondary-button" onClick={onOpenModal}>打开现有 Modal 样式</button></div>;
  if (id === "form-layout") return <div className="component-form-demo form-section"><h3>基础信息</h3><label><span>名称 *</span><input placeholder="请输入名称"/></label><div className="form-row"><label><span>分类 *</span><select className="select-control form-select-native"><option>示例分类</option></select></label><label><span>展示顺序</span><input type="number" defaultValue="1"/></label></div><label><span>备注</span><textarea rows="3" placeholder="选填"/></label></div>;
  if (id === "filter-bar") return <div className="component-filter-demo filters"><label><span>关键字</span><div className="input-wrap"><Search size={16}/><input placeholder="名称或说明"/></div></label><label><span>状态</span><select className="select-control filter-select"><option>全部状态</option><option>已启用</option></select></label><div className="filter-actions"><button className="primary-button"><Search size={15}/>查询</button><button className="secondary-button">重置</button></div></div>;
  if (id === "table-status") return <div className="component-table-demo"><div className="table-scroll"><table><thead><tr><th>组件</th><th>资产类型</th><th>状态</th><th className="sticky-right">操作</th></tr></thead><tbody><tr><td>AdminDrawer</td><td>公共组件</td><td><span className="status-tag success">已稳定</span></td><td className="sticky-right"><button className="table-action">详情</button></td></tr><tr><td>AdminConfirm</td><td>公共组件</td><td><span className="status-tag warning">迁移中</span></td><td className="sticky-right"><button className="table-action">详情</button></td></tr></tbody></table></div></div>;
  if (id === "empty-state") return <div className="empty-state component-empty-demo"><Database size={28}/><b>暂无组件数据</b><span>当前筛选条件下没有匹配结果，请调整条件后重试。</span></div>;
  if (id === "pagination") return <div className="pagination component-pagination-demo"><span>共 42 条数据</span><div><button className="select-button">10 条/页</button><button className="page-arrow" disabled><ChevronLeft size={15}/></button><button className="page-number active">1</button><button className="page-number">2</button><button className="page-arrow"><ChevronRight size={15}/></button></div></div>;
  if (id === "button-hierarchy") return <div className="component-button-demo"><button className="primary-button">主操作</button><button className="secondary-button">次操作</button><button className="danger-button">危险操作</button><button className="danger-outline-button">解除绑定</button><button className="table-action">行内操作</button></div>;
  return null;
}

export function ComponentCenter() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("全部");
  const [selectedId, setSelectedId] = useState("admin-drawer");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  useEffect(() => {
    if (confirmDemo?.state !== "loading") { setDemoLoading(false); return; }
    setDemoLoading(true);
    const timer = window.setTimeout(() => setDemoLoading(false), 1600);
    return () => window.clearTimeout(timer);
  }, [confirmDemo]);
  const rows = useMemo(() => componentCatalog.filter((item) => {
    const keyword = query.trim().toLowerCase();
    return (status === "all" || item.status === status) && (category === "全部" || item.category === category) && (!keyword || `${item.name}${item.category}${item.scenarios}${item.source}`.toLowerCase().includes(keyword));
  }), [category, query, status]);
  const selected = rows.find((item) => item.id === selectedId) || rows[0] || componentCatalog.find((item) => item.id === selectedId) || componentCatalog[0];
  const counts = { stable: componentCatalog.filter((item) => item.status === "stable").length, migrating: componentCatalog.filter((item) => item.status === "migrating").length, pending: componentCatalog.filter((item) => item.status === "pending").length };
  const coveredPages = new Set(componentCatalog.flatMap((item) => item.migrated)).size;
  return <div className="component-center-shell admin-style-theme">
    <header className="component-center-header"><div><a href="?acceptance" aria-label="返回验收页面"><ArrowLeft size={18}/></a><span className="component-center-mark"><Boxes size={20}/></span><div><h1>后台组件中心</h1><p>仅在 acceptance 模式可见 · 数据口径与组件规范及迁移清单一致</p></div></div><code>?acceptance&amp;component-center</code></header>
    <section className="component-center-metrics">{[["组件总数", componentCatalog.length, Boxes], ["已稳定", counts.stable, CheckCircle2], ["迁移中", counts.migrating, Layers3], ["待沉淀", counts.pending, CircleDashed], ["已覆盖页面", coveredPages, Database]].map(([label, value, Icon]) => <article key={label}><span><Icon size={18}/></span><div><b>{value}</b><small>{label}</small></div></article>)}</section>
    <div className="component-center-toolbar"><div className="component-center-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索组件、场景或源码位置"/></div><div className="component-center-status-tabs">{statusFilters.map((item) => <button className={status === item.id ? "active" : ""} key={item.id} onClick={() => setStatus(item.id)}>{item.label}<span>{item.id === "all" ? componentCatalog.length : counts[item.id]}</span></button>)}</div></div>
    <main className="component-center-main">
      <aside className="component-center-categories"><div className="component-center-pane-title"><b>组件分类</b><span>按真实资产裁剪</span></div><nav>{componentCategories.map((item) => { const count = item === "全部" ? componentCatalog.length : componentCatalog.filter((component) => component.category === item).length; return <button className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}><span>{item}</span><em>{count}</em></button>; })}</nav><div className="component-center-source-note"><b>口径来源</b><span>后台通用组件规范.md</span><span>后台组件迁移清单.md</span></div></aside>
      <section className="component-center-catalog"><div className="component-center-pane-title"><b>组件清单</b><span>当前 {rows.length} 项</span></div><div className="component-card-list">{rows.map((item) => <button className={selected.id === item.id ? "active" : ""} key={item.id} onClick={() => setSelectedId(item.id)}><div><span className="component-asset-type">{componentAssetTypeMeta[item.assetType]}</span><StatusChip status={item.status}/></div><h3>{item.name}</h3><p>{item.scenarios}</p><small>{item.source}</small></button>)}{!rows.length && <div className="component-list-empty"><ImageOff size={25}/><b>没有匹配的组件</b><span>请调整搜索、状态或分类条件。</span></div>}</div></section>
      <section className="component-center-detail"><div className="component-detail-scroll"><div className="component-detail-heading"><div><span>{selected.category} · {componentAssetTypeMeta[selected.assetType]}</span><h2>{selected.name}</h2></div><StatusChip status={selected.status}/></div><div className="component-detail-meta"><div><span>成熟度</span><b>{selected.maturity}</b></div><div><span>适用场景</span><b>{selected.scenarios}</b></div></div><section className="component-live-preview"><header><b>交互预览</b><span>全部为演示状态</span></header><div className="component-live-preview-body">{selected.id === "admin-confirm" ? <ConfirmPreview onOpen={setConfirmDemo}/> : selected.id === "single-image-upload" ? <UploadPreview/> : <StaticPreview id={selected.id} onOpenDrawer={() => setDrawerOpen(true)} onOpenModal={() => setModalOpen(true)}/>}</div></section><section className="component-detail-section"><h3>关键规范</h3><ul>{selected.rules.map((item) => <li key={item}>{item}</li>)}</ul></section><section className="component-detail-section"><h3>支持状态</h3><div className="component-support-tags">{selected.support.map((item) => <span key={item}>{item}</span>)}</div></section><section className="component-coverage-grid"><div><h3>已覆盖页面</h3>{selected.migrated.length ? selected.migrated.map((item) => <span key={item}><CheckCircle2 size={13}/>{item}</span>) : <p>尚未完成业务页迁移</p>}</div><div><h3>待迁移 / 待处理</h3>{selected.pending.map((item) => <span key={item}><CircleDashed size={13}/>{item}</span>)}</div></section><section className="component-code-location"><div><span>源码位置</span><code>{selected.source}</code></div><div><span>规范位置</span><code>{selected.spec}</code></div></section></div></section>
    </main>
    {drawerOpen && <AdminDrawer title="标准抽屉示例" className="component-demo-drawer" onClose={() => setDrawerOpen(false)} footer={<><button className="secondary-button" onClick={() => setDrawerOpen(false)}>取消</button><button className="primary-button" onClick={() => setDrawerOpen(false)}>完成演示</button></>}><div className="form-section"><h3>基础信息</h3><label><span>名称 *</span><input defaultValue="演示数据"/></label><label><span>说明</span><textarea rows="4" defaultValue="Header 仅显示标题，Body 独立滚动，Footer 始终可见。"/></label>{Array.from({ length: 8 }, (_, index) => <label key={index}><span>演示字段 {index + 1}</span><input placeholder="用于验证长内容滚动"/></label>)}</div></AdminDrawer>}
    {modalOpen && <div className="modal-layer"><button className="modal-backdrop" aria-label="关闭 Modal 示例" onClick={() => setModalOpen(false)}/><section className="component-demo-modal" role="dialog" aria-modal="true" aria-label="Modal 现有样式示例"><header><h2>Modal 现有样式示例</h2></header><div><p>该示例使用现有 modal-layer 公共样式。AdminModal 尚未抽取，因此组件中心明确标记为“待沉淀”。</p></div><footer><button className="secondary-button" onClick={() => setModalOpen(false)}>关闭</button></footer></section></div>}
    {confirmDemo && <AdminConfirm title="停用“演示组件”？" impacts={["演示页不会修改任何业务数据。", "关闭后仍可继续切换其他状态。"]} note="该提示仅用于展示 note 承载区。" severity={confirmDemo.severity} loading={demoLoading} loadingLabel="演示提交中…" error={confirmDemo.state === "error" ? "操作失败，弹窗已保留，请重试。" : ""} confirmLabel="确认停用" onClose={() => setConfirmDemo(null)} onConfirm={() => setConfirmDemo(null)}/>}
  </div>;
}
