import { useEffect, useMemo, useRef, useState } from "react";
import { MonitorSmartphone, Plus, RefreshCw, Search } from "lucide-react";
import { AdminDrawer, AdminToast } from "./AdminOverlay";
import { tabletOtaStorageKey } from "./TabletOta";

function compareVersion(left = "", right = "") {
  const a = String(left).match(/\d+/g)?.map(Number) || [];
  const b = String(right).match(/\d+/g)?.map(Number) || [];
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const delta = (a[index] || 0) - (b[index] || 0);
    if (delta) return delta;
  }
  return 0;
}

function readOtaPackages() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(tabletOtaStorageKey) || "null");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function statusTone(status) {
  if (status === "已是最新") return "success";
  if (status === "升级失败") return "danger";
  if (status === "升级中" || status === "待升级") return "warning";
  return "neutral";
}

function executionTone(status) {
  if (status === "成功") return "success";
  if (status === "失败") return "danger";
  if (/下载|安装|执行|等待/.test(status)) return "warning";
  return "neutral";
}

function DeviceStatusTag({ status }) {
  return <span className={`status-tag ${statusTone(status)}`}>{status}</span>;
}

function ExecutionStatusTag({ status }) {
  return <span className={`status-tag ${executionTone(status)}`}>{status}</span>;
}

function OnlineStatusTag({ status }) {
  return <span className={`status-tag ${status === "在线" ? "success" : "neutral"}`}>{status}</span>;
}

function BindingStatusTag({ device }) {
  const bound = Boolean(device.boundElderlyId);
  return <span className={`status-tag ${bound ? "success" : "warning"}`}>{bound ? "已绑定" : "待绑定"}</span>;
}

function latestVersion(packages, type, model) {
  return packages
    .filter((item) => item.resourceStatus === "可用" && item.packageType === type && item.model === model)
    .map((item) => item.targetVersion)
    .sort((left, right) => compareVersion(right, left))[0] || "";
}

function buildDeviceRows(devices, projects, elderlyRecords, packages) {
  const executions = packages.flatMap((otaPackage) => (otaPackage.tasks || []).flatMap((task) => (task.results || []).map((result) => ({
    ...result,
    message: result.message === "等待 Mock 任务继续推进" ? "等待设备进入升级时段" : result.message,
    taskId: task.id,
    taskStatus: task.status,
    createdAt: task.createdAt,
    packageId: otaPackage.id,
    packageType: otaPackage.packageType,
    targetVersion: otaPackage.targetVersion,
  }))));
  const fleetLatestApk = devices.map((device) => device.apkVersion).filter(Boolean).sort((left, right) => compareVersion(right, left))[0] || "";

  return devices.map((device) => {
    const project = projects.find((item) => item.id === device.projectId);
    const elderly = elderlyRecords.find((item) => item.id === device.boundElderlyId);
    const history = executions
      .filter((item) => item.deviceId === device.id)
      .sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
    const latestExecution = history[0];
    const latestRom = latestVersion(packages, "ROM", device.model);
    const latestApk = latestVersion(packages, "APK", device.model) || fleetLatestApk;
    const hasVersionReport = Boolean(device.romVersion && device.apkVersion);
    const isLatest = hasVersionReport && (!latestApk || compareVersion(device.apkVersion, latestApk) >= 0);
    const status = !hasVersionReport
      ? "待上报"
      : latestExecution?.status === "失败"
      ? "升级失败"
      : /下载|安装|执行|等待/.test(latestExecution?.status || "")
        ? "升级中"
        : isLatest
          ? "已是最新"
          : "待升级";
    const activeTarget = !hasVersionReport
      ? "待上报当前版本"
      : latestExecution && status !== "已是最新"
      ? `${latestExecution.packageType} ${latestExecution.targetVersion}`
      : latestApk ? `APK ${latestApk}` : "暂无可用 APK 版本";
    return {
      ...device,
      projectName: project?.name || "未归属项目",
      projectRegion: project?.district || project?.city || "区域待补充",
      elderlyName: elderly?.name || "",
      elderlyRecord: elderly || null,
      latestRom,
      latestApk,
      latestExecution,
      history,
      upgradeStatus: status,
      targetVersion: activeTarget,
      lastUpgradeAt: latestExecution?.createdAt || "暂无任务",
    };
  });
}

export function TabletDeviceDetailDrawer({ device, scope, onClose, onOpenOta, onManageTablet }) {
  const isPlatform = scope === "platform";
  const execution = device.latestExecution;
  return <AdminDrawer title="平板设备详情" className="platform-device-drawer" onClose={onClose} footer={<><button className="secondary-button" onClick={onClose}>关闭</button>{!isPlatform && device.elderlyRecord && onManageTablet && <button className="primary-button" onClick={() => onManageTablet(device.elderlyRecord)}>管理绑定</button>}{isPlatform && execution && onOpenOta && <button className="primary-button" onClick={onOpenOta}>查看升级任务</button>}</>}>
    <section className="admin-detail-summary platform-device-summary">
      <span className="admin-detail-summary-icon"><MonitorSmartphone size={22}/><small>PAD</small></span>
      <div className="admin-detail-summary-primary"><span>设备编号</span><b>{device.id}</b><small>{device.model} · {device.sn}</small></div>
      <div className="platform-device-summary-status"><BindingStatusTag device={device}/><OnlineStatusTag status={device.onlineStatus}/></div>
    </section>
    <section className="admin-detail-section"><h3>设备信息</h3><div className="admin-detail-property-grid">
      <div><span>设备编号</span><b>{device.id}</b></div>
      <div><span>设备 SN</span><b>{device.sn || "—"}</b></div>
      <div><span>设备型号</span><b>{device.model || "—"}</b></div>
      <div><span>绑定老人</span><b>{device.elderlyName || "待绑定"}</b></div>
      <div><span>绑定状态</span><BindingStatusTag device={device}/></div>
      <div><span>绑定时间</span><b>{device.boundAt || "—"}</b></div>
      <div><span>当前 ROM</span><b>{device.romVersion || "待上报"}</b></div>
      <div><span>当前 APK</span><b>{device.apkVersion || "待上报"}</b></div>
      <div><span>在线状态</span><OnlineStatusTag status={device.onlineStatus}/></div>
      <div><span>最近上报</span><b>{device.lastOnline || "—"}</b></div>
      <div><span>联网方式</span><b>{device.networkType || "待上报"}</b></div>
      <div><span>IP 地址</span><b className="mono">{device.ipAddress || "待上报"}</b></div>
    </div></section>
    {isPlatform && <section className="admin-detail-section"><h3>项目与升级信息</h3><div className="admin-detail-property-grid">
      <div><span>所属项目 / 社区</span><b>{device.projectName}</b></div>
      <div><span>所在区域</span><b>{device.projectRegion}</b></div>
      <div><span>目标版本</span><b>{device.targetVersion}</b></div>
      <div><span>更新状态</span><DeviceStatusTag status={device.upgradeStatus}/></div>
      <div><span>最近升级时间</span><b>{device.lastUpgradeAt}</b></div>
    </div></section>}
    {isPlatform && <section className="admin-detail-section"><div className="admin-detail-section-heading"><h3>升级任务执行记录</h3><span>{device.history.length} 条</span></div><div className="table-scroll admin-compact-table"><table className="platform-device-history-table"><thead><tr><th>任务编号</th><th>升级版本</th><th>任务创建时间</th><th>设备执行结果</th></tr></thead><tbody>
      {device.history.map((item) => <tr key={`${item.taskId}-${item.packageId}`}><td>{item.taskId}</td><td>{item.packageType} {item.targetVersion}</td><td>{item.createdAt}</td><td><ExecutionStatusTag status={item.status}/></td></tr>)}
      {!device.history.length && <tr><td colSpan="4"><div className="empty-table-state">暂无升级任务执行记录</div></td></tr>}
    </tbody></table></div></section>}
  </AdminDrawer>;
}

function nextDeviceNumber(devices) {
  return Math.max(0, ...devices.map((device) => Number(String(device.id || "").match(/(\d+)$/)?.[1]) || 0)) + 1;
}

function TabletDeviceCreateDrawer({ devices, projects, scenario, onClose, onSave }) {
  const suggestedNumber = String(nextDeviceNumber(devices)).padStart(5, "0");
  const hasScenarioPreset = ["platformCreate", "platformCreateFailure"].includes(scenario);
  const [form, setForm] = useState({
    id: hasScenarioPreset ? `TAB-SG-${suggestedNumber}` : "",
    sn: hasScenarioPreset ? `SN-TAB-${suggestedNumber.slice(-6)}` : "",
    model: hasScenarioPreset ? "U2G Home 14" : "",
    projectId: hasScenarioPreset ? projects[0]?.id || "" : "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitError("");
  };
  const submit = async () => {
    if (submittingRef.current) return;
    const normalizedId = form.id.trim().toUpperCase();
    const normalizedSn = form.sn.trim().toUpperCase();
    const nextErrors = {};
    if (!normalizedId) nextErrors.id = "请输入设备编号";
    else if (devices.some((device) => String(device.id).toUpperCase() === normalizedId)) nextErrors.id = "设备编号已存在";
    if (!normalizedSn) nextErrors.sn = "请输入设备 SN";
    else if (devices.some((device) => String(device.sn).toUpperCase() === normalizedSn)) nextErrors.sn = "设备 SN 已存在";
    if (!form.model.trim()) nextErrors.model = "请输入设备型号";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      await onSave({
        id: normalizedId,
        sn: normalizedSn,
        model: form.model.trim(),
        projectId: form.projectId,
        operator: "赵亚男",
        bindingStatus: "待绑定",
        onlineStatus: "离线",
        boundElderlyId: null,
        boundAt: "",
        lastOnline: "尚未上线",
        usageRecords: [],
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "新增失败，请重试。已填写内容将继续保留。");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };
  return <AdminDrawer title="新增平板" ariaLabel="新增平板" className="platform-device-create-drawer" onClose={() => !submitting && onClose()} footer={<><button className="secondary-button" disabled={submitting} onClick={onClose}>取消</button><button className="primary-button" disabled={submitting} onClick={submit}>{submitting ? "保存中..." : "保存平板"}</button></>}>
    <div className="form-section"><h3>设备信息</h3><div className="form-row"><label><span>设备编号 *</span><input value={form.id} onChange={(event) => update("id", event.target.value)} placeholder="例如 TAB-SG-20260034"/>{errors.id && <small className="field-error">{errors.id}</small>}</label><label><span>设备 SN *</span><input value={form.sn} onChange={(event) => update("sn", event.target.value)} placeholder="例如 SN-TAB-260034"/>{errors.sn && <small className="field-error">{errors.sn}</small>}</label></div><div className="form-row"><label><span>设备型号 *</span><input value={form.model} onChange={(event) => update("model", event.target.value)} placeholder="例如 U2G Home 14"/>{errors.model && <small className="field-error">{errors.model}</small>}</label><label><span>所属项目 / 社区（选填）</span><select className="select-control form-select-native" value={form.projectId} onChange={(event) => update("projectId", event.target.value)}><option value="">暂不归属项目</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label></div>{submitError && <div className="form-error-banner" role="alert">{submitError}</div>}</div>
  </AdminDrawer>;
}

export function PlatformTabletDevicesPage({ devices, elderlyRecords, projects, scope = "platform", detailScenario = "normal", onOpenOta, onManageTablet, onCreate }) {
  const isPlatform = scope === "platform";
  const [packages, setPackages] = useState(readOtaPackages);
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("全部项目");
  const [bindingStatus, setBindingStatus] = useState("全部绑定状态");
  const [onlineStatus, setOnlineStatus] = useState("全部在线状态");
  const [upgradeStatus, setUpgradeStatus] = useState("全部更新状态");
  const [selectedId, setSelectedId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createdDeviceId, setCreatedDeviceId] = useState("");
  const [toast, setToast] = useState("");
  const autoCreateScenarioRef = useRef("");
  const previousDetailScenarioRef = useRef("");

  useEffect(() => {
    const refresh = () => setPackages(readOtaPackages());
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const rows = useMemo(() => buildDeviceRows(devices, projects, elderlyRecords, packages), [devices, elderlyRecords, packages, projects]);
  const metrics = useMemo(() => ({
    total: rows.length,
    latest: rows.filter((item) => item.upgradeStatus === "已是最新").length,
    pending: rows.filter((item) => item.upgradeStatus === "待升级").length,
    running: rows.filter((item) => item.upgradeStatus === "升级中").length,
    failed: rows.filter((item) => item.upgradeStatus === "升级失败").length,
  }), [rows]);
  const filtered = rows.filter((device) => {
    const keyword = query.trim().toLowerCase();
    return (!keyword || `${device.id}${device.sn}${device.model}${device.elderlyName}${device.boundElderlyId || ""}`.toLowerCase().includes(keyword))
      && (!isPlatform || projectId === "全部项目" || (projectId === "未归属项目" ? !device.projectId : device.projectId === projectId))
      && (bindingStatus === "全部绑定状态" || (device.boundElderlyId ? "已绑定" : "待绑定") === bindingStatus)
      && (onlineStatus === "全部在线状态" || device.onlineStatus === onlineStatus)
      && (!isPlatform || upgradeStatus === "全部更新状态" || device.upgradeStatus === upgradeStatus);
  });
  const reset = () => {
    setQuery("");
    setProjectId("全部项目");
    setBindingStatus("全部绑定状态");
    setOnlineStatus("全部在线状态");
    setUpgradeStatus("全部更新状态");
  };
  const selectedDevice = rows.find((item) => item.id === selectedId);

  useEffect(() => {
    if (!createdDeviceId || !rows.some((item) => item.id === createdDeviceId)) return;
    setSelectedId(createdDeviceId);
    setCreatedDeviceId("");
  }, [createdDeviceId, rows]);

  useEffect(() => {
    const scenarioChanged = previousDetailScenarioRef.current !== detailScenario;
    previousDetailScenarioRef.current = detailScenario;
    const matchesScope = isPlatform
      ? detailScenario === "platformDetail"
      : detailScenario === "communityDetail";
    if (isPlatform && ["platformCreate", "platformCreateFailure", "platformCreateValidation"].includes(detailScenario)) {
      if (autoCreateScenarioRef.current !== detailScenario) {
        autoCreateScenarioRef.current = detailScenario;
        setSelectedId("");
        setCreateOpen(true);
      }
      return;
    }
    autoCreateScenarioRef.current = "";
    if (!matchesScope) {
      if (scenarioChanged) setSelectedId("");
      return;
    }
    const target = isPlatform
      ? rows.find((item) => item.latestExecution) || rows[0]
      : rows.find((item) => item.boundElderlyId) || rows[0];
    setSelectedId(target?.id || "");
  }, [detailScenario, isPlatform, rows]);

  return <>
    <div className="page-heading"><div><h1>平板设备</h1><p>{isPlatform ? "查看全部平板的基础信息、项目归属与升级结果" : "查看当前社区平板的基础信息、绑定关系与在线状态"}</p></div>{isPlatform && onCreate && <button className="primary-button" onClick={() => setCreateOpen(true)}><Plus size={16}/>新增平板</button>}</div>
    {isPlatform && <div className="platform-metric-grid platform-device-metrics" aria-label="平板更新状态统计">
      <div className="platform-metric-card"><span>设备总数</span><b>{metrics.total}</b><p>全部自动上报平板</p></div>
      <div className="platform-metric-card"><span>已是最新</span><b className="metric-success">{metrics.latest}</b><p>APK 已是最新版本</p></div>
      <div className="platform-metric-card"><span>待升级</span><b className="metric-warning">{metrics.pending}</b><p>存在可用新版本</p></div>
      <div className="platform-metric-card"><span>升级中</span><b className="metric-running">{metrics.running}</b><p>任务正在执行</p></div>
      <div className="platform-metric-card"><span>升级失败</span><b className="metric-danger">{metrics.failed}</b><p>需要查看失败原因</p></div>
    </div>}
    <section className="panel management-panel platform-device-panel">
      <div className={`filters platform-device-filters ${isPlatform ? "is-platform" : "is-community"}`}>
        <label><span>设备编号</span><div className="input-wrap"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="设备编号、SN 或型号"/></div></label>
        {isPlatform && <label><span>项目 / 社区</span><select className="select-control filter-select" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option>全部项目</option><option>未归属项目</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>}
        <label><span>绑定状态</span><select className="select-control filter-select" value={bindingStatus} onChange={(event) => setBindingStatus(event.target.value)}><option>全部绑定状态</option><option>已绑定</option><option>待绑定</option></select></label>
        <label><span>在线状态</span><select className="select-control filter-select" value={onlineStatus} onChange={(event) => setOnlineStatus(event.target.value)}><option>全部在线状态</option><option>在线</option><option>离线</option></select></label>
        {isPlatform && <label><span>更新状态</span><select className="select-control filter-select" value={upgradeStatus} onChange={(event) => setUpgradeStatus(event.target.value)}><option>全部更新状态</option><option>已是最新</option><option>待升级</option><option>升级中</option><option>升级失败</option></select></label>}
        <div className="filter-actions"><button className="primary-button"><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div>
      </div>
      <div className="table-scroll"><table className={`platform-device-table ${isPlatform ? "" : "community-tablet-device-table"}`.trim()}><thead><tr><th>设备编号 / 型号</th><th>绑定老人</th><th>绑定状态</th><th>当前 ROM / APK</th><th>在线状态 / 最近上报</th>{isPlatform && <><th>所属项目 / 社区</th><th>目标版本</th><th>更新状态</th></>}<th className="sticky-right">操作</th></tr></thead><tbody>
        {filtered.map((device) => <tr key={device.id}><td><div className="device-name-cell"><span><MonitorSmartphone size={17}/></span><div><b>{device.id}</b><small>{device.model} · {device.sn}</small></div></div></td><td><div className="stacked-cell"><b>{device.elderlyName || "待绑定"}</b><small>{device.boundElderlyId || "尚未建立老人关系"}</small></div></td><td><BindingStatusTag device={device}/></td><td><div className="stacked-cell mono"><b>ROM {device.romVersion || "待上报"}</b><small>APK {device.apkVersion || "待上报"}</small></div></td><td><div className="stacked-cell"><OnlineStatusTag status={device.onlineStatus}/><small>{device.lastOnline}</small></div></td>{isPlatform && <><td><div className="stacked-cell"><b>{device.projectName}</b><small>{device.projectRegion}</small></div></td><td className="platform-device-target">{device.targetVersion}</td><td><DeviceStatusTag status={device.upgradeStatus}/></td></>}<td className="sticky-right"><button className="table-action" onClick={() => setSelectedId(device.id)}>查看详情</button>{!isPlatform && device.elderlyRecord && onManageTablet && <button className="table-action" onClick={() => onManageTablet(device.elderlyRecord)}>管理绑定</button>}</td></tr>)}
        {!filtered.length && <tr><td colSpan={isPlatform ? 9 : 6}><div className="empty-table-state">没有符合筛选条件的平板设备</div></td></tr>}
      </tbody></table></div>
      <div className="pagination"><span>当前展示 {filtered.length} 条数据</span></div>
    </section>
    {selectedDevice && <TabletDeviceDetailDrawer device={selectedDevice} scope={scope} onClose={() => setSelectedId("")} onManageTablet={onManageTablet} onOpenOta={onOpenOta ? () => { setSelectedId(""); onOpenOta(); } : undefined}/>}
    {isPlatform && createOpen && onCreate && <TabletDeviceCreateDrawer key={`${detailScenario}-${nextDeviceNumber(devices)}`} devices={devices} projects={projects} scenario={detailScenario} onClose={() => setCreateOpen(false)} onSave={async (device) => { const created = await onCreate(device); setCreateOpen(false); setCreatedDeviceId(created.id); setToast("平板新增成功"); }}/>}
    {toast && <AdminToast message={toast} onClose={() => setToast("")}/>}
  </>;
}
