import { useEffect, useMemo, useState } from "react";
import { MonitorSmartphone, RefreshCw, Search } from "lucide-react";
import { AdminDrawer } from "./AdminOverlay";
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
    const latestExecution = history.find((item) => item.packageType === "APK");
    const latestRom = latestVersion(packages, "ROM", device.model);
    const latestApk = latestVersion(packages, "APK", device.model) || fleetLatestApk;
    const isLatest = !latestApk || compareVersion(device.apkVersion, latestApk) >= 0;
    const status = latestExecution?.status === "失败"
      ? "升级失败"
      : /下载|安装|执行|等待/.test(latestExecution?.status || "")
        ? "升级中"
        : isLatest
          ? "已是最新"
          : "待升级";
    const activeTarget = latestExecution && status !== "已是最新"
      ? `APK ${latestExecution.targetVersion}`
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
      failureReason: latestExecution?.status === "失败" ? latestExecution.message || "升级执行失败" : "",
    };
  });
}

function progressValue(status) {
  if (status === "成功") return 100;
  if (status === "安装中") return 72;
  if (status === "下载中") return 38;
  if (status === "失败") return 26;
  if (/待|等待/.test(status || "")) return 8;
  return 0;
}

function TabletDeviceDetailDrawer({ device, scope, onClose, onOpenOta, onManageTablet }) {
  const isPlatform = scope === "platform";
  const execution = device.latestExecution;
  const progress = progressValue(execution?.status);
  return <AdminDrawer title="平板设备详情" className="platform-device-drawer" onClose={onClose} footer={<><button className="secondary-button" onClick={onClose}>关闭</button>{!isPlatform && device.elderlyRecord && onManageTablet && <button className="primary-button" onClick={() => onManageTablet(device.elderlyRecord)}>管理绑定</button>}{isPlatform && execution && onOpenOta && <button className="primary-button" onClick={onOpenOta}>查看升级任务</button>}</>}>
    <section className="admin-detail-summary platform-device-summary">
      <span className="admin-detail-summary-icon"><MonitorSmartphone size={22}/><small>PAD</small></span>
      <div className="admin-detail-summary-primary"><span>设备编号</span><b>{device.id}</b><small>{device.model} · {device.sn}</small></div>
      {isPlatform ? <DeviceStatusTag status={device.upgradeStatus}/> : <OnlineStatusTag status={device.onlineStatus}/>}
    </section>
    <section className="admin-detail-section"><h3>设备信息</h3><div className="admin-detail-property-grid">
      <div><span>设备编号</span><b>{device.id}</b></div>
      <div><span>设备 SN</span><b>{device.sn || "—"}</b></div>
      <div><span>设备型号</span><b>{device.model || "—"}</b></div>
      <div><span>绑定老人</span><b>{device.elderlyName || "待绑定"}</b></div>
      <div><span>绑定状态</span><BindingStatusTag device={device}/></div>
      <div><span>绑定时间</span><b>{device.boundAt || "—"}</b></div>
      <div><span>当前 ROM</span><b>{device.romVersion || "—"}</b></div>
      <div><span>当前 APK</span><b>{device.apkVersion || "—"}</b></div>
      <div><span>在线状态</span><OnlineStatusTag status={device.onlineStatus}/></div>
      <div><span>最近上报</span><b>{device.lastOnline || "—"}</b></div>
      <div><span>联网方式</span><b>{device.networkType || "—"}</b></div>
      <div><span>IP 地址</span><b className="mono">{device.ipAddress || "—"}</b></div>
    </div></section>
    {isPlatform && <section className="admin-detail-section"><h3>项目与升级信息</h3><div className="admin-detail-property-grid">
      <div><span>所属项目 / 社区</span><b>{device.projectName}</b></div>
      <div><span>所在区域</span><b>{device.projectRegion}</b></div>
      <div><span>目标版本</span><b>{device.targetVersion}</b></div>
      <div><span>升级状态</span><DeviceStatusTag status={device.upgradeStatus}/></div>
      <div><span>最近升级时间</span><b>{device.lastUpgradeAt}</b></div>
    </div></section>}
    {isPlatform && <section className="admin-detail-section"><div className="admin-detail-section-heading"><h3>最近升级任务</h3><span>{execution ? "1 条" : "暂无"}</span></div>
      {execution ? <div className="platform-device-progress-card">
        <div><span>{execution.taskId}</span><ExecutionStatusTag status={execution.status}/></div>
        <b>{execution.packageType} {execution.targetVersion}</b>
        <div className="platform-device-progress"><i style={{ width: `${progress}%` }}/></div>
        <p>{execution.message || "任务已下发"}</p>
        <small>{execution.createdAt}</small>
      </div> : <div className="empty-table-state platform-device-empty">该设备暂无升级任务</div>}
      {device.failureReason && <div className="platform-device-failure"><b>失败原因</b><p>{device.failureReason}</p></div>}
    </section>}
    {isPlatform && <section className="admin-detail-section"><div className="admin-detail-section-heading"><h3>升级任务执行记录</h3><span>{device.history.length} 条</span></div><div className="table-scroll admin-compact-table"><table className="platform-device-history-table"><thead><tr><th>任务编号</th><th>升级版本</th><th>任务创建时间</th><th>设备执行结果</th><th>结果说明</th></tr></thead><tbody>
      {device.history.map((item) => <tr key={`${item.taskId}-${item.packageId}`}><td>{item.taskId}</td><td>{item.packageType} {item.targetVersion}</td><td>{item.createdAt}</td><td><ExecutionStatusTag status={item.status}/></td><td>{item.message || "—"}</td></tr>)}
      {!device.history.length && <tr><td colSpan="5"><div className="empty-table-state">暂无升级任务执行记录</div></td></tr>}
    </tbody></table></div></section>}
  </AdminDrawer>;
}

export function PlatformTabletDevicesPage({ devices, elderlyRecords, projects, scope = "platform", onOpenOta, onManageTablet }) {
  const isPlatform = scope === "platform";
  const [packages, setPackages] = useState(readOtaPackages);
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("全部项目");
  const [bindingStatus, setBindingStatus] = useState("全部绑定状态");
  const [onlineStatus, setOnlineStatus] = useState("全部在线状态");
  const [upgradeStatus, setUpgradeStatus] = useState("全部升级状态");
  const [romVersion, setRomVersion] = useState("全部 ROM 版本");
  const [apkVersion, setApkVersion] = useState("全部 APK 版本");
  const [selectedId, setSelectedId] = useState("");

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
  const romVersions = [...new Set(rows.map((item) => item.romVersion).filter(Boolean))];
  const apkVersions = [...new Set(rows.map((item) => item.apkVersion).filter(Boolean))];
  const filtered = rows.filter((device) => {
    const keyword = query.trim().toLowerCase();
    return (!keyword || `${device.id}${device.sn}${device.model}${device.elderlyName}${device.boundElderlyId || ""}`.toLowerCase().includes(keyword))
      && (!isPlatform || projectId === "全部项目" || (projectId === "未归属项目" ? !device.projectId : device.projectId === projectId))
      && (bindingStatus === "全部绑定状态" || (device.boundElderlyId ? "已绑定" : "待绑定") === bindingStatus)
      && (onlineStatus === "全部在线状态" || device.onlineStatus === onlineStatus)
      && (!isPlatform || upgradeStatus === "全部升级状态" || device.upgradeStatus === upgradeStatus)
      && (romVersion === "全部 ROM 版本" || device.romVersion === romVersion)
      && (apkVersion === "全部 APK 版本" || device.apkVersion === apkVersion);
  });
  const reset = () => {
    setQuery("");
    setProjectId("全部项目");
    setBindingStatus("全部绑定状态");
    setOnlineStatus("全部在线状态");
    setUpgradeStatus("全部升级状态");
    setRomVersion("全部 ROM 版本");
    setApkVersion("全部 APK 版本");
  };
  const selectedDevice = rows.find((item) => item.id === selectedId);

  return <>
    <div className="page-heading"><div><h1>平板设备</h1><p>{isPlatform ? "查看全部平板的基础信息、项目归属与升级结果" : "查看当前社区平板的基础信息、绑定关系与在线状态"}</p></div></div>
    {isPlatform && <div className="platform-metric-grid platform-device-metrics" aria-label="平板升级状态统计">
      <div className="platform-metric-card"><span>设备总数</span><b>{metrics.total}</b><p>全部自动上报平板</p></div>
      <div className="platform-metric-card"><span>已是最新</span><b className="metric-success">{metrics.latest}</b><p>APK 已是最新版本</p></div>
      <div className="platform-metric-card"><span>待升级</span><b className="metric-warning">{metrics.pending}</b><p>存在可用新版本</p></div>
      <div className="platform-metric-card"><span>升级中</span><b className="metric-running">{metrics.running}</b><p>任务正在执行</p></div>
      <div className="platform-metric-card"><span>升级失败</span><b className="metric-danger">{metrics.failed}</b><p>需要查看失败原因</p></div>
    </div>}
    <section className="panel management-panel platform-device-panel">
      <div className="filters platform-device-filters">
        <label><span>设备编号</span><div className="input-wrap"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="设备编号、SN 或型号"/></div></label>
        {isPlatform && <label><span>项目 / 社区</span><select className="select-control filter-select" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option>全部项目</option><option>未归属项目</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>}
        <label><span>绑定状态</span><select className="select-control filter-select" value={bindingStatus} onChange={(event) => setBindingStatus(event.target.value)}><option>全部绑定状态</option><option>已绑定</option><option>待绑定</option></select></label>
        <label><span>在线状态</span><select className="select-control filter-select" value={onlineStatus} onChange={(event) => setOnlineStatus(event.target.value)}><option>全部在线状态</option><option>在线</option><option>离线</option></select></label>
        {isPlatform && <label><span>升级状态</span><select className="select-control filter-select" value={upgradeStatus} onChange={(event) => setUpgradeStatus(event.target.value)}><option>全部升级状态</option><option>已是最新</option><option>待升级</option><option>升级中</option><option>升级失败</option></select></label>}
        <label><span>ROM 版本</span><select className="select-control filter-select" value={romVersion} onChange={(event) => setRomVersion(event.target.value)}><option>全部 ROM 版本</option>{romVersions.map((version) => <option key={version}>{version}</option>)}</select></label>
        <label><span>APK 版本</span><select className="select-control filter-select" value={apkVersion} onChange={(event) => setApkVersion(event.target.value)}><option>全部 APK 版本</option>{apkVersions.map((version) => <option key={version}>{version}</option>)}</select></label>
        <div className="filter-actions"><button className="primary-button"><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div>
      </div>
      <div className="table-scroll"><table className={`platform-device-table ${isPlatform ? "" : "community-tablet-device-table"}`.trim()}><thead><tr><th>设备编号 / 型号</th><th>绑定老人</th><th>绑定状态</th><th>当前 ROM / APK</th><th>在线状态 / 最近上报</th>{isPlatform && <><th>所属项目 / 社区</th><th>目标版本</th><th>升级状态</th><th>最近升级时间</th></>}<th className="sticky-right">操作</th></tr></thead><tbody>
        {filtered.map((device) => <tr key={device.id}><td><div className="device-name-cell"><span><MonitorSmartphone size={17}/></span><div><b>{device.id}</b><small>{device.model} · {device.sn}</small></div></div></td><td><div className="stacked-cell"><b>{device.elderlyName || "待绑定"}</b><small>{device.boundElderlyId || "尚未建立老人关系"}</small></div></td><td><BindingStatusTag device={device}/></td><td><div className="stacked-cell mono"><b>ROM {device.romVersion}</b><small>APK {device.apkVersion}</small></div></td><td><div className="stacked-cell"><OnlineStatusTag status={device.onlineStatus}/><small>{device.lastOnline}</small></div></td>{isPlatform && <><td><div className="stacked-cell"><b>{device.projectName}</b><small>{device.projectRegion}</small></div></td><td className="platform-device-target">{device.targetVersion}</td><td><DeviceStatusTag status={device.upgradeStatus}/></td><td>{device.lastUpgradeAt}</td></>}<td className="sticky-right"><button className="table-action" onClick={() => setSelectedId(device.id)}>查看详情</button>{!isPlatform && device.elderlyRecord && onManageTablet && <button className="table-action" onClick={() => onManageTablet(device.elderlyRecord)}>管理绑定</button>}</td></tr>)}
        {!filtered.length && <tr><td colSpan={isPlatform ? 10 : 6}><div className="empty-table-state">没有符合筛选条件的平板设备</div></td></tr>}
      </tbody></table></div>
      <div className="pagination"><span>当前展示 {filtered.length} 条数据</span></div>
    </section>
    {selectedDevice && <TabletDeviceDetailDrawer device={selectedDevice} scope={scope} onClose={() => setSelectedId("")} onManageTablet={onManageTablet} onOpenOta={onOpenOta ? () => { setSelectedId(""); onOpenOta(); } : undefined}/>}
  </>;
}
