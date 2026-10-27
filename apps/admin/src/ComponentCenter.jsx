import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Boxes, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, Copy, Database, ImageOff, Layers3, Search, UserRound } from "lucide-react";
import { AdminConfirm, AdminDrawer, AdminModal } from "./AdminOverlay";
import { PermissionMatrix } from "./PermissionMatrix";
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

const permissionPreviewActionLabels = { view: "查看", create: "新增", edit: "编辑", delete: "删除", export: "导出" };
const permissionPreviewGroups = [
  { id: "elder-service", label: "老人服务", description: "老人资料与日常服务", rows: [
    { id: "elderly", label: "老人档案", description: "档案、关系与服务状态", actions: ["view", "create", "edit", "export"] },
    { id: "emergency", label: "在线协助", description: "事件处理与记录", actions: ["view", "edit"] },
  ] },
  { id: "community-life", label: "社区生活", rows: [
    { id: "announcement", label: "社区公告", actions: ["view", "create", "edit", "delete"] },
    { id: "activity", label: "社区活动", actions: ["view", "create", "edit", "delete", "export"] },
    { id: "staff", label: "社区人员", actions: ["view", "create", "edit"] },
  ] },
];

function PermissionMatrixPreview() {
  const [mode, setMode] = useState("editable");
  const [value, setValue] = useState({ elderly: ["view", "edit"], emergency: ["view"], announcement: ["view", "create"], activity: ["view", "create", "edit"], staff: ["view"] });
  return <div className="component-permission-preview"><div className="component-state-tabs">{[["editable", "可编辑"], ["readOnly", "只读"], ["protected", "内置角色"], ["denied", "权限不足"]].map(([id, label]) => <button className={mode === id ? "active" : ""} key={id} onClick={() => setMode(id)}>{label}</button>)}</div><PermissionMatrix groups={permissionPreviewGroups} actionLabels={permissionPreviewActionLabels} value={value} onChange={setValue} onSave={() => {}} readOnly={mode === "readOnly"} protectedRole={mode === "protected"} permissionDenied={mode === "denied"}/></div>;
}

function TablePreview() {
  const [state, setState] = useState("data");
  return <div className="component-table-preview"><div className="component-state-tabs">{[["data", "常规数据"], ["empty", "空状态"]].map(([id, label]) => <button className={state === id ? "active" : ""} key={id} onClick={() => setState(id)}>{label}</button>)}</div><div className="component-table-demo"><div className="table-scroll"><table><thead><tr><th>人员</th><th>联系方式</th><th>状态</th><th>更新时间</th><th className="sticky-right">操作</th></tr></thead><tbody>{state === "data" ? <><tr><td><div className="component-table-person"><span className="component-table-avatar"><UserRound size={20}/></span><span><b>示例人员</b><small>Example User</small></span></div></td><td><div className="stacked-cell"><b>+65 6123 4567</b><small>example@service.sg</small></div></td><td><span className="status-tag success">已启用</span></td><td>2026-10-23 10:30</td><td className="sticky-right"><button className="table-action">详情</button><button className="table-action">编辑</button></td></tr><tr><td><div className="component-table-person"><span className="component-table-avatar"><UserRound size={20}/></span><span><b>另一条记录</b><small>Secondary Text</small></span></div></td><td><div className="stacked-cell"><b>+65 6234 5678</b><small>未填写邮箱</small></div></td><td><span className="status-tag warning">待处理</span></td><td>2026-10-22 16:20</td><td className="sticky-right"><button className="table-action">详情</button><button className="table-action danger-text">停用</button></td></tr></> : <tr><td colSpan="5"><div className="empty-table-state component-table-empty"><Database size={26}/><b>当前筛选条件下暂无数据</b><span>请调整筛选条件后重试。</span></div></td></tr>}</tbody></table></div><div className="pagination"><span>当前展示 {state === "data" ? 2 : 0} 条数据</span><span>标准 Footer 信息区</span></div></div></div>;
}

function StaticPreview({ id, onOpenDrawer, onOpenDetailDrawer, onOpenModal, onOpenResultModal }) {
  if (id === "admin-drawer") return <div className="component-preview-stack"><div className="component-preview-callout"><Layers3 size={20}/><div><b>标准右侧抽屉</b><p>标题无副标题，Body 长内容独立滚动，Footer 保持可见。</p></div></div><button className="primary-button" onClick={onOpenDrawer}>打开真实 AdminDrawer</button></div>;
  if (id === "detail-drawer-layout") return <div className="component-preview-stack"><div className="component-preview-callout muted"><Layers3 size={20}/><div><b>克制的只读详情结构</b><p>摘要、属性、说明和关联记录保持单一层级，Footer 始终可见。</p></div></div><button className="primary-button" onClick={onOpenDetailDrawer}>打开详情抽屉示例</button></div>;
  if (id === "admin-modal") return <div className="component-preview-stack"><div className="component-preview-callout muted"><CircleDashed size={20}/><div><b>标准居中弹窗</b><p>Header、Body 与 Footer 分区统一，并包含焦点与关闭管理。</p></div></div><button className="secondary-button" onClick={onOpenModal}>打开真实 AdminModal</button></div>;
  if (id === "compact-result-modal") return <div className="component-preview-stack"><div className="component-preview-callout muted"><CheckCircle2 size={20}/><div><b>短结果集中展示</b><p>结果值、复制操作、提示和唯一完成按钮保持紧凑。</p></div></div><button className="primary-button" onClick={onOpenResultModal}>打开结果弹窗示例</button></div>;
  if (id === "form-layout") return <div className="component-form-demo form-section"><h3>基础信息</h3><label><span>名称 *</span><input placeholder="请输入名称"/></label><div className="form-row"><label><span>分类 *</span><select className="select-control form-select-native"><option>示例分类</option></select></label><label><span>展示顺序</span><input type="number" defaultValue="1"/></label></div><label><span>备注</span><textarea rows="3" placeholder="选填"/></label></div>;
  if (id === "filter-bar") return <div className="component-filter-demo filters"><label><span>关键字</span><div className="input-wrap"><Search size={16}/><input placeholder="名称或说明"/></div></label><label><span>状态</span><select className="select-control filter-select"><option>全部状态</option><option>已启用</option></select></label><div className="filter-actions"><button className="primary-button"><Search size={15}/>查询</button><button className="secondary-button">重置</button></div></div>;
  if (id === "empty-state") return <div className="empty-state component-empty-demo"><Database size={28}/><b>暂无组件数据</b><span>当前筛选条件下没有匹配结果，请调整条件后重试。</span></div>;
  if (id === "pagination") return <div className="pagination component-pagination-demo"><span>共 42 条数据</span><div><button className="select-button">10 条/页</button><button className="page-arrow" disabled><ChevronLeft size={15}/></button><button className="page-number active">1</button><button className="page-number">2</button><button className="page-arrow"><ChevronRight size={15}/></button></div></div>;
  if (id === "button-hierarchy") return <div className="component-button-preview"><div className="component-button-demo"><button className="primary-button">主操作</button><button className="secondary-button">次操作</button><button className="danger-button">危险操作</button><button className="danger-outline-button">解除绑定</button></div><div className="component-inline-action-demo"><header><b>表格行内操作</b><span>同一操作列只使用纯文字</span></header><div><span>常规账号</span><p><button className="table-action">详情</button><button className="table-action">编辑</button><button className="table-action">重置密码</button><button className="table-action danger-text">停用</button></p></div><div><span>锁定账号</span><p><button className="table-action">详情</button><button className="table-action">编辑</button><button className="table-action">解锁</button></p></div><div><span>disabled</span><p><button className="table-action" disabled>详情</button><button className="table-action danger-text" disabled>停用</button></p></div></div></div>;
  return null;
}

export function ComponentCenter() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("全部");
  const [selectedId, setSelectedId] = useState("admin-drawer");
  const [drawerDemo, setDrawerDemo] = useState("");
  const [modalDemo, setModalDemo] = useState("");
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
      <section className="component-center-detail"><div className="component-detail-scroll"><div className="component-detail-heading"><div><span>{selected.category} · {componentAssetTypeMeta[selected.assetType]}</span><h2>{selected.name}</h2></div><StatusChip status={selected.status}/></div><div className="component-detail-meta"><div><span>成熟度</span><b>{selected.maturity}</b></div><div><span>适用场景</span><b>{selected.scenarios}</b></div></div><section className="component-live-preview"><header><b>交互预览</b><span>全部为演示状态</span></header><div className="component-live-preview-body">{selected.id === "admin-confirm" ? <ConfirmPreview onOpen={setConfirmDemo}/> : selected.id === "single-image-upload" ? <UploadPreview/> : selected.id === "permission-matrix" ? <PermissionMatrixPreview/> : selected.id === "table-status" ? <TablePreview/> : <StaticPreview id={selected.id} onOpenDrawer={() => setDrawerDemo("standard")} onOpenDetailDrawer={() => setDrawerDemo("detail")} onOpenModal={() => setModalDemo("standard")} onOpenResultModal={() => setModalDemo("result")}/>}</div></section><section className="component-detail-section"><h3>关键规范</h3><ul>{selected.rules.map((item) => <li key={item}>{item}</li>)}</ul></section><section className="component-detail-section"><h3>支持状态</h3><div className="component-support-tags">{selected.support.map((item) => <span key={item}>{item}</span>)}</div></section><section className="component-coverage-grid"><div><h3>已覆盖页面</h3>{selected.migrated.length ? selected.migrated.map((item) => <span key={item}><CheckCircle2 size={13}/>{item}</span>) : <p>尚未完成业务页迁移</p>}</div><div><h3>待迁移 / 待处理</h3>{selected.pending.map((item) => <span key={item}><CircleDashed size={13}/>{item}</span>)}</div></section><section className="component-code-location"><div><span>源码位置</span><code>{selected.source}</code></div><div><span>规范位置</span><code>{selected.spec}</code></div></section></div></section>
    </main>
    {drawerDemo === "standard" && <AdminDrawer title="标准抽屉示例" className="component-demo-drawer" onClose={() => setDrawerDemo("")} footer={<><button className="secondary-button" onClick={() => setDrawerDemo("")}>取消</button><button className="primary-button" onClick={() => setDrawerDemo("")}>完成演示</button></>}><div className="form-section"><h3>基础信息</h3><label><span>名称 *</span><input defaultValue="演示数据"/></label><label><span>说明</span><textarea rows="4" defaultValue="Header 仅显示标题，Body 独立滚动，Footer 始终可见。"/></label>{Array.from({ length: 8 }, (_, index) => <label key={index}><span>演示字段 {index + 1}</span><input placeholder="用于验证长内容滚动"/></label>)}</div></AdminDrawer>}
    {drawerDemo === "detail" && <AdminDrawer title="详情抽屉示例" className="component-demo-drawer component-detail-drawer-demo" onClose={() => setDrawerDemo("")} footer={<><button className="secondary-button" onClick={() => setDrawerDemo("")}>关闭</button><button className="primary-button" onClick={() => setDrawerDemo("")}>创建关联任务</button></>}><section className="admin-detail-summary"><span className="admin-detail-summary-icon"><Boxes size={22}/><small>PKG</small></span><div className="admin-detail-summary-primary"><span>目标版本</span><b>V3.8.2</b><small>中控屏标准版</small></div><span className="status-tag success">已发布</span></section><section className="admin-detail-section"><h3>基础信息</h3><div className="admin-detail-property-grid">{[["包类型", "系统升级包"], ["文件大小", "128.6 MB"], ["最低版本", "V3.2.0"], ["创建人", "系统管理员"], ["发布时间", "2026-10-23 10:30"], ["校验状态", "校验通过"]].map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div></section><section className="admin-detail-note"><div><Layers3 size={16}/><h3>更新说明</h3></div><p>优化设备稳定性，并修复部分场景下的网络连接问题。说明区只承载完整文本，不再拆分多张卡片。</p></section><section className="admin-detail-section"><div className="admin-detail-section-heading"><h3>关联任务</h3><span>2 条</span></div><div className="table-scroll admin-compact-table"><table><thead><tr><th>任务名称</th><th>升级范围</th><th>状态</th></tr></thead><tbody><tr><td>10 月例行升级</td><td>32 台设备</td><td><span className="status-tag success">已完成</span></td></tr><tr><td>试点设备升级</td><td>6 台设备</td><td><span className="status-tag warning">进行中</span></td></tr></tbody></table></div></section></AdminDrawer>}
    {modalDemo === "standard" && <AdminModal title="标准 Modal 示例" onClose={() => setModalDemo("")} footer={<><button className="secondary-button" onClick={() => setModalDemo("")}>取消</button><button className="primary-button" onClick={() => setModalDemo("")}>确认</button></>}><p className="component-modal-copy">业务层只提供标题、内容与操作，公共组件统一遮罩、关闭、焦点和分区结构。</p></AdminModal>}
    {modalDemo === "result" && <AdminModal title="结果弹窗示例" className="admin-result-modal" onClose={() => setModalDemo("")} footer={<button className="primary-button" onClick={() => setModalDemo("")}>完成</button>}><div className="admin-result-field"><span>一次性结果</span><div className="admin-result-value"><code>U2G-482916</code><button type="button" className="admin-result-copy"><Copy size={15}/>复制</button></div></div><p className="admin-result-tip">请安全保存结果，关闭后不再重复展示。</p></AdminModal>}
    {confirmDemo && <AdminConfirm title="停用“演示组件”？" impacts={["演示页不会修改任何业务数据。", "关闭后仍可继续切换其他状态。"]} note="该提示仅用于展示 note 承载区。" severity={confirmDemo.severity} loading={demoLoading} loadingLabel="演示提交中…" error={confirmDemo.state === "error" ? "操作失败，弹窗已保留，请重试。" : ""} confirmLabel="确认停用" onClose={() => setConfirmDemo(null)} onConfirm={() => setConfirmDemo(null)}/>}
  </div>;
}
