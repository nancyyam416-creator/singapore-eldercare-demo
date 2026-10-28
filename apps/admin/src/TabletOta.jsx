import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, PackageOpen, Plus, RefreshCw, Search, Upload } from "lucide-react";
import { AdminConfirm, AdminDrawer } from "./AdminOverlay";

export const tabletOtaStorageKey = "u2g-tablet-ota-packages-v1";
export const tabletOtaPermissionKeys = {
  view: "tabletOta.view",
  upload: "tabletOta.uploadPackage",
  createTask: "tabletOta.createTask",
  retry: "tabletOta.retry",
};

const packageTypeLabels = { ROM: "ROM 固件包", APK: "APK 应用包" };
function parsePackageMetadata(fileName = "") {
  return {
    packageType: /\.apk$/i.test(fileName) ? "APK" : "ROM",
    model: "U2G Home 14",
  };
}
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

function initialPackages(devices) {
  const sampleDevices = devices.filter((device) => device.activationStatus === "已激活").slice(0, 2);
  const projectIds = [...new Set(sampleDevices.map((device) => device.projectId).filter(Boolean))];
  const projectNames = [...new Set(sampleDevices.map((device) => device.projectName).filter(Boolean))];
  return [
    {
      id: "OTA-ROM-001",
      targetVersion: "v1.6.0",
      model: "U2G Home 14",
      packageType: "ROM",
      resourceStatus: "可用",
      strategy: "可暂缓",
      effectiveMode: "指定时间",
      effectiveAt: "2026-10-27 02:00",
      dailyWindow: "02:00–05:00",
      minimumVersion: "v1.4.0",
      description: "系统稳定性升级",
      notes: "优化设备稳定性并修复夜间网络重连问题。",
      fileName: "u2g-home-14-rom-v1.6.0.zip",
      uploadedAt: "2026-10-25 16:20",
      tasks: sampleDevices.length ? [{
        id: "OTA-TASK-001",
        projectId: projectIds[0] || "",
        projectIds,
        projectNames,
        createdAt: "2026-10-26 09:30",
        status: "执行中",
        results: sampleDevices.map((device, index) => ({
          deviceId: device.id,
          projectId: device.projectId,
          projectName: device.projectName || "未归属项目",
          elderlyName: device.elderlyName || "未绑定老人",
          currentVersion: device.romVersion,
          status: index === sampleDevices.length - 1 ? "失败" : "安装中",
          message: index === sampleDevices.length - 1 ? "下载校验失败，可重新发起" : "升级包已下载，正在安装",
        })),
      }] : [],
    },
    {
      id: "OTA-APK-001",
      targetVersion: "v2.2.0",
      model: "U2G Home 14",
      packageType: "APK",
      resourceStatus: "可用",
      strategy: "强制",
      effectiveMode: "立即生效",
      effectiveAt: "立即生效",
      dailyWindow: "09:00–21:00",
      minimumVersion: "v2.0.0",
      description: "老人端体验升级",
      notes: "更新老人端首页与语音播报交互。",
      fileName: "u2g-elder-app-v2.2.0.apk",
      uploadedAt: "2026-10-24 11:08",
      tasks: [],
    },
  ];
}

function StatusTag({ children }) {
  const value = String(children);
  const tone = /可用|成功|在线/.test(value) ? "success" : /失败/.test(value) ? "danger" : /待执行|下载中|安装中|执行中/.test(value) ? "warning" : "neutral";
  return <span className={`status-tag ${tone}`}>{children}</span>;
}

function UploadPackageDrawer({ onClose, onSave }) {
  const [form, setForm] = useState({ fileName: "", targetVersion: "", description: "", notes: "", strategy: "可暂缓", minimumVersion: "", effectiveMode: "立即生效", effectiveAt: "", windowStart: "02:00", windowEnd: "05:00" });
  const [errors, setErrors] = useState({});
  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      if (key === "windowStart" || key === "windowEnd") delete next.dailyWindow;
      if (key === "effectiveMode" && value === "立即生效") delete next.effectiveAt;
      return next;
    });
  };
  const simulateFile = () => {
    setForm((current) => ({ ...current, fileName: "u2g-home-14-rom-v1.7.0.zip", targetVersion: "v1.7.0", description: "系统稳定性与网络恢复升级", notes: "提升系统稳定性并优化网络恢复。", minimumVersion: "v1.5.0" }));
    setErrors((current) => {
      const next = { ...current };
      ["fileName", "targetVersion", "notes", "minimumVersion"].forEach((key) => delete next[key]);
      return next;
    });
  };
  const submit = () => {
    const next = {};
    if (!form.fileName) next.fileName = "请先选择升级包";
    if (!form.targetVersion.trim()) next.targetVersion = "缺少目标版本";
    if (!form.notes.trim()) next.notes = "请输入更新说明";
    if (!form.minimumVersion.trim()) next.minimumVersion = "请输入最低可用版本";
    if (form.effectiveMode === "指定时间" && !form.effectiveAt) next.effectiveAt = "请选择生效时间";
    if (Boolean(form.windowStart) !== Boolean(form.windowEnd)) next.dailyWindow = "请同时填写每日升级开始和结束时间";
    else if (form.windowStart && form.windowEnd && form.windowStart >= form.windowEnd) next.dailyWindow = "每日升级结束时间必须晚于开始时间";
    setErrors(next);
    if (Object.keys(next).length) return;
    const metadata = parsePackageMetadata(form.fileName);
    onSave({
      id: `OTA-${metadata.packageType}-${Date.now()}`,
      targetVersion: form.targetVersion.trim(),
      model: metadata.model,
      packageType: metadata.packageType,
      resourceStatus: "可用",
      strategy: form.strategy,
      effectiveMode: form.effectiveMode,
      effectiveAt: form.effectiveMode === "立即生效" ? "立即生效" : form.effectiveAt.replace("T", " "),
      dailyWindow: `${form.windowStart}–${form.windowEnd}`,
      minimumVersion: form.minimumVersion.trim(),
      description: form.description.trim(),
      notes: form.notes.trim(),
      fileName: form.fileName,
      uploadedAt: "2026-10-26 14:20",
      tasks: [],
    });
  };
  return <AdminDrawer title="上传升级包" className="tablet-ota-drawer" onClose={onClose} footer={<><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={submit}>保存升级包</button></>}>
    <div className="form-section"><h3>上传升级包</h3><div className="ota-file-picker"><div><PackageOpen size={20}/><span><b>{form.fileName || "尚未选择升级包"}</b><small>{form.fileName ? `已识别为${packageTypeLabels[parsePackageMetadata(form.fileName).packageType]}` : "支持 ZIP / 系统包及 APK 文件，包类型由文件自动识别"}</small></span></div><button className="secondary-button" type="button" onClick={simulateFile}><Upload size={15}/>模拟选择文件</button></div>{errors.fileName && <small className="field-error">{errors.fileName}</small>}</div>
    <div className="form-section"><h3>解析结果</h3><div className="form-row"><label><span>目标版本 *</span><input value={form.targetVersion} onChange={(event) => update("targetVersion", event.target.value)}/>{errors.targetVersion && <small className="field-error">{errors.targetVersion}</small>}</label><label><span>升级描述</span><input value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="请输入本次升级的简要描述"/></label></div><label><span>更新说明 *</span><textarea rows="3" value={form.notes} onChange={(event) => update("notes", event.target.value)}/>{errors.notes && <small className="field-error">{errors.notes}</small>}</label></div>
    <div className="form-section"><h3>升级策略</h3><div className="form-row"><label><span>执行策略 *</span><select className="select-control form-select-native" value={form.strategy} onChange={(event) => update("strategy", event.target.value)}><option>可暂缓</option><option>强制</option></select></label><label><span>最低可用版本 *</span><input value={form.minimumVersion} onChange={(event) => update("minimumVersion", event.target.value)} placeholder="例如：v1.5.0"/>{errors.minimumVersion && <small className="field-error">{errors.minimumVersion}</small>}</label></div><label><span>生效方式 *</span><select className="select-control form-select-native" value={form.effectiveMode} onChange={(event) => update("effectiveMode", event.target.value)}><option>立即生效</option><option>指定时间</option></select></label>{form.effectiveMode === "指定时间" && <label><span>生效时间 *</span><input type="datetime-local" value={form.effectiveAt} onChange={(event) => update("effectiveAt", event.target.value)}/>{errors.effectiveAt && <small className="field-error">{errors.effectiveAt}</small>}</label>}<div className="form-row"><label><span>每日升级开始</span><input type="time" value={form.windowStart} onChange={(event) => update("windowStart", event.target.value)}/></label><label><span>每日升级结束</span><input type="time" value={form.windowEnd} onChange={(event) => update("windowEnd", event.target.value)}/></label></div>{errors.dailyWindow && <small className="field-error">{errors.dailyWindow}</small>}</div>
  </AdminDrawer>;
}

function CreateTaskDrawer({ otaPackage, devices, projects, onClose, onCreate }) {
  const [query, setQuery] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [error, setError] = useState("");
  const selectAllRef = useRef(null);
  const currentVersion = (device) => otaPackage.packageType === "ROM" ? device.romVersion : device.apkVersion;
  const deviceReason = (device) => {
    if (device.model !== otaPackage.model) return "设备型号不匹配";
    if (compareVersion(currentVersion(device), otaPackage.minimumVersion) < 0) return `版本过低，需先升级至 ${otaPackage.minimumVersion}`;
    if (compareVersion(currentVersion(device), otaPackage.targetVersion) >= 0) return "当前版本无需升级";
    return "";
  };
  const projectRows = useMemo(() => projects.map((project) => {
    const projectDevices = devices.filter((device) => device.projectId === project.id);
    const eligibleDevices = projectDevices.filter((device) => !deviceReason(device));
    const onlineDevices = eligibleDevices.filter((device) => device.onlineStatus === "在线");
    let disabledReason = "";
    if (!projectDevices.length) disabledReason = "暂无平板设备";
    else if (!eligibleDevices.length) disabledReason = "无符合当前升级包条件的设备";
    return { ...project, eligibleCount: eligibleDevices.length, onlineCount: onlineDevices.length, eligibleDevices, disabledReason };
  }), [devices, otaPackage, projects]);
  const rows = projectRows.filter((project) => `${project.name}${project.country || ""}${project.city || ""}${project.district || ""}${project.address || ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selectableRows = rows.filter((project) => !project.disabledReason);
  const visibleSelectedCount = selectableRows.filter((project) => selectedProjectIds.includes(project.id)).length;
  const allVisibleSelected = selectableRows.length > 0 && visibleSelectedCount === selectableRows.length;
  useEffect(() => { if (selectAllRef.current) selectAllRef.current.indeterminate = visibleSelectedCount > 0 && !allVisibleSelected; }, [allVisibleSelected, visibleSelectedCount]);
  const toggle = (project) => { if (project.disabledReason) return; setSelectedProjectIds((current) => current.includes(project.id) ? current.filter((id) => id !== project.id) : [...current, project.id]); setError(""); };
  const toggleAll = () => {
    const visibleIds = new Set(selectableRows.map((project) => project.id));
    setSelectedProjectIds((current) => allVisibleSelected ? current.filter((id) => !visibleIds.has(id)) : [...new Set([...current, ...visibleIds])]);
    setError("");
  };
  const selectedDeviceCount = projectRows.filter((project) => selectedProjectIds.includes(project.id)).reduce((total, project) => total + project.eligibleCount, 0);
  const submit = () => {
    if (!selectedProjectIds.length) return setError("请选择至少一个有可升级设备的项目/社区");
    onCreate(selectedProjectIds);
  };
  return <AdminDrawer title="创建升级任务" className="tablet-ota-drawer wide-drawer" onClose={onClose} footer={<><span className="ota-selection-count">已选择 <b>{selectedProjectIds.length}</b> 个社区，预计覆盖 {selectedDeviceCount} 台设备</span><div className="ota-footer-actions"><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" disabled={!selectedProjectIds.length} onClick={submit}>创建任务</button></div></>}>
    <section className="ota-package-summary"><div><span>包类型</span><b>{packageTypeLabels[otaPackage.packageType]}</b></div><div><span>目标版本</span><b>{otaPackage.targetVersion}</b></div><div><span>文件名</span><b title={otaPackage.fileName}>{otaPackage.fileName}</b></div><div><span>升级策略</span><b>{otaPackage.strategy}</b></div><div className="full"><span>生效时间</span><b>{otaPackage.effectiveAt} · {otaPackage.dailyWindow}</b></div></section>
    <section className="detail-section ota-device-selection"><div className="detail-section-title"><div><h3>选择升级范围</h3><p>任务将覆盖所选项目/社区内符合版本与型号条件的平板</p></div></div><div className="input-wrap ota-device-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索项目/社区名称或所在区域"/></div><div className="ota-select-all"><label><input ref={selectAllRef} type="checkbox" checked={allVisibleSelected} disabled={!selectableRows.length} onChange={toggleAll}/><span>全选当前筛选社区</span></label><small>可选 {selectableRows.length} 个社区 / 已选择 {selectedProjectIds.length} 个社区</small></div><div className="table-scroll ota-device-table-wrap"><table className="ota-device-table ota-project-scope-table"><thead><tr><th className="checkbox-column">选择</th><th>项目 / 社区</th><th>所在区域</th><th>可升级设备</th><th>在线设备</th></tr></thead><tbody>{rows.map((project) => <tr className={project.disabledReason ? "disabled" : ""} key={project.id}><td className="checkbox-column"><input type="checkbox" aria-label={`选择社区 ${project.name}`} disabled={Boolean(project.disabledReason)} checked={selectedProjectIds.includes(project.id)} onChange={() => toggle(project)}/></td><td><div className="stacked-cell"><b>{project.name}</b><small>{project.id}</small>{project.disabledReason && <small className="ota-disabled-reason">{project.disabledReason}</small>}</div></td><td><div className="stacked-cell"><b>{[project.country, project.city, project.district].filter(Boolean).join(" / ") || "未完善"}</b><small>{project.address || "未完善详细地址"}</small></div></td><td><b>{project.eligibleCount}</b> 台</td><td><b>{project.onlineCount}</b> 台</td></tr>)}{!rows.length && <tr><td colSpan="5"><div className="empty-table-state">没有符合关键字的项目/社区</div></td></tr>}</tbody></table></div>{error && <small className="field-error">{error}</small>}</section>
  </AdminDrawer>;
}

function PackageDetailDrawer({ otaPackage, onClose, onCreateTask, onRetry }) {
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const selectedTask = otaPackage.tasks.find((task) => task.id === selectedTaskId);
  const [retryTarget, setRetryTarget] = useState(null);
  const PackageTypeIcon = otaPackage.packageType === "ROM" ? PackageOpen : Upload;
  const taskStats = (task) => ({ success: task.results.filter((item) => item.status === "成功").length, failure: task.results.filter((item) => item.status === "失败").length });
  const taskScope = (task) => task.projectNames?.join("、") || task.projectIds?.join("、") || "未记录";
  useEffect(() => { if (selectedTaskId && !otaPackage.tasks.some((task) => task.id === selectedTaskId)) setSelectedTaskId(""); }, [otaPackage.tasks, selectedTaskId]);
  return <><AdminDrawer title="升级版本详情" className="tablet-ota-drawer wide-drawer" onClose={onClose} footer={<><button className="secondary-button" onClick={onClose}>关闭</button><button className="primary-button" disabled={otaPackage.resourceStatus !== "可用"} onClick={onCreateTask}><Plus size={15}/>创建升级任务</button></>}>
    {!selectedTask ? <><section className="ota-version-overview"><div className={`ota-version-icon ${otaPackage.packageType.toLowerCase()}`}><PackageTypeIcon size={22}/><small>{otaPackage.packageType}</small></div><div className="ota-version-primary"><span>目标版本</span><b>{otaPackage.targetVersion}</b><small>{otaPackage.model}</small></div><StatusTag>{otaPackage.resourceStatus}</StatusTag></section><section className="ota-package-properties"><h3>升级包信息</h3><div className="ota-property-grid"><div><span>包类型</span><b>{packageTypeLabels[otaPackage.packageType]}</b></div><div><span>升级策略</span><b>{otaPackage.strategy}</b></div><div><span>最低可用版本</span><b>{otaPackage.minimumVersion}</b></div><div><span>生效方式</span><b>{otaPackage.effectiveAt}</b></div><div><span>升级时段</span><b>{otaPackage.dailyWindow}</b></div><div><span>上传时间</span><b>{otaPackage.uploadedAt}</b></div></div></section>{otaPackage.description && <section className="ota-update-notes"><div className="ota-note-heading"><PackageOpen size={15}/><h3>升级描述</h3></div><p>{otaPackage.description}</p></section>}<section className="ota-update-notes"><div className="ota-note-heading"><PackageOpen size={15}/><h3>更新说明</h3></div><p>{otaPackage.notes}</p></section><section className="ota-task-history"><div className="detail-section-title"><h3>升级任务</h3><span className="ota-task-count">共 {otaPackage.tasks.length} 条</span></div><div className="table-scroll"><table className="ota-task-history-table"><thead><tr><th>任务编号 / 创建时间</th><th>项目 / 社区范围</th><th>目标设备数</th><th>成功</th><th>失败</th><th>任务状态</th><th>操作</th></tr></thead><tbody>{otaPackage.tasks.map((task) => { const stats = taskStats(task); return <tr key={task.id}><td><div className="stacked-cell"><b>{task.id}</b><small>{task.createdAt}</small></div></td><td className="ota-task-scope-cell">{taskScope(task)}</td><td>{task.results.length}</td><td className="success-text">{stats.success}</td><td className="danger-text">{stats.failure}</td><td><StatusTag>{task.status}</StatusTag></td><td><button className="table-action" onClick={() => setSelectedTaskId(task.id)}>查看</button></td></tr>; })}{!otaPackage.tasks.length && <tr><td colSpan="7"><div className="empty-table-state">当前升级包尚未创建任务</div></td></tr>}</tbody></table></div></section></> : <section className="ota-task-detail"><button className="ota-back-button" type="button" onClick={() => setSelectedTaskId("")}><ArrowLeft size={15}/>返回任务列表</button><div className="detail-section-title"><h3>任务详情</h3><StatusTag>{selectedTask.status}</StatusTag></div><div className="ota-task-scope-note"><span>项目/社区范围</span><b>{taskScope(selectedTask)}</b></div><div className="ota-task-summary"><div><span>目标设备</span><b>{selectedTask.results.length}</b></div><div><span>成功</span><b className="success-text">{taskStats(selectedTask).success}</b></div><div><span>失败</span><b className="danger-text">{taskStats(selectedTask).failure}</b></div><div><span>创建时间</span><b className="ota-task-time">{selectedTask.createdAt}</b></div></div><div className="table-scroll"><table className="ota-result-table"><thead><tr><th>设备 / 老人</th><th>项目 / 社区</th><th>升级前版本</th><th>执行状态</th><th>执行结果</th><th>操作</th></tr></thead><tbody>{selectedTask.results.map((item) => <tr key={item.deviceId}><td><div className="stacked-cell"><b>{item.deviceId}</b><small>{item.elderlyName}</small></div></td><td>{item.projectName || "未记录"}</td><td>{item.currentVersion}</td><td><StatusTag>{item.status}</StatusTag></td><td>{item.message}</td><td>{item.status === "失败" ? <button className="table-action" onClick={() => setRetryTarget(item)}>重试</button> : "—"}</td></tr>)}{!selectedTask.results.length && <tr><td colSpan="6"><div className="empty-table-state">该任务暂无设备执行记录</div></td></tr>}</tbody></table></div></section>}
  </AdminDrawer>{retryTarget && selectedTask && <AdminConfirm title={`重试设备 ${retryTarget.deviceId}？`} description="确认后将模拟完成本次重试，并同步更新平板台账中的版本。" confirmLabel="确认重试" onClose={() => setRetryTarget(null)} onConfirm={() => { onRetry(selectedTask.id, retryTarget.deviceId); setRetryTarget(null); }}/>}</>;
}

export function TabletOtaPage({ devices, projects = [], resetSignal, onApplyUpgrade }) {
  const [packages, setPackages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(tabletOtaStorageKey) || "null");
      return Array.isArray(saved) ? saved.map((item) => ({
        ...item,
        tasks: (item.tasks || []).map((task) => {
          const projectIds = task.projectIds?.length ? task.projectIds : [task.projectId].filter(Boolean);
          const projectNames = task.projectNames?.length ? task.projectNames : projectIds.map((id) => projects.find((project) => project.id === id)?.name || id);
          return {
            ...task,
            projectId: task.projectId || projectIds[0] || "",
            projectIds,
            projectNames,
            results: (task.results || []).map((result) => {
              const device = devices.find((entry) => entry.id === result.deviceId);
              const resultProjectId = result.projectId || device?.projectId || "";
              return { ...result, message: result.message === "等待 Mock 任务继续推进" ? "等待设备进入升级时段" : result.message, projectId: resultProjectId, projectName: result.projectName || projects.find((project) => project.id === resultProjectId)?.name || device?.projectName || "未归属项目" };
            }),
          };
        }),
      })) : initialPackages(devices);
    } catch {
      return initialPackages(devices);
    }
  });
  const [query, setQuery] = useState("");
  const [type, setType] = useState("全部类型");
  const [projectFilter, setProjectFilter] = useState("全部项目");
  const [drawer, setDrawer] = useState(null);
  const previousResetSignal = useRef(resetSignal);
  useEffect(() => localStorage.setItem(tabletOtaStorageKey, JSON.stringify(packages)), [packages]);
  useEffect(() => {
    if (previousResetSignal.current === resetSignal) return;
    previousResetSignal.current = resetSignal;
    const baseline = initialPackages(devices);
    setPackages(baseline);
    setDrawer(null);
  }, [devices, resetSignal]);
  const filtered = useMemo(() => packages.filter((item) => {
    const matchesKeyword = `${item.targetVersion}${item.model}${item.description || ""}${item.notes}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesType = type === "全部类型" || item.packageType === type;
    const matchesProject = projectFilter === "全部项目" || item.tasks.some((task) => task.projectIds?.includes(projectFilter) || task.projectId === projectFilter);
    return matchesKeyword && matchesType && matchesProject;
  }), [packages, projectFilter, query, type]);
  const selectedPackageRecord = drawer?.packageId ? packages.find((item) => item.id === drawer.packageId) : null;
  const selectedPackage = selectedPackageRecord;
  const reset = () => { setQuery(""); setType("全部类型"); setProjectFilter("全部项目"); };
  const savePackage = (record) => { setPackages((current) => [record, ...current]); setDrawer({ kind: "detail", packageId: record.id }); };
  const createTask = (packageId, selectedProjectIds) => {
    const otaPackage = packages.find((item) => item.id === packageId);
    const currentVersion = (device) => otaPackage.packageType === "ROM" ? device.romVersion : device.apkVersion;
    const eligibleDevices = devices.filter((device) => selectedProjectIds.includes(device.projectId)
      && device.model === otaPackage.model
      && compareVersion(currentVersion(device), otaPackage.minimumVersion) >= 0
      && compareVersion(currentVersion(device), otaPackage.targetVersion) < 0);
    const projectNames = selectedProjectIds.map((id) => projects.find((project) => project.id === id)?.name || id);
    const task = { id: `OTA-TASK-${Date.now()}`, projectId: selectedProjectIds[0] || "", projectIds: selectedProjectIds, projectNames, createdAt: new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-"), status: "执行中", results: eligibleDevices.map((device, index) => ({ deviceId: device.id, projectId: device.projectId, projectName: device.projectName || projects.find((project) => project.id === device.projectId)?.name || "未归属项目", elderlyName: device.elderlyName || "未绑定老人", currentVersion: currentVersion(device), status: index % 3 === 0 ? "下载中" : index % 3 === 1 ? "安装中" : "待执行", message: index % 3 === 2 ? "等待设备进入升级时段" : "升级任务已下发" })) };
    setPackages((current) => current.map((item) => item.id === packageId ? { ...item, tasks: [task, ...item.tasks] } : item));
    setDrawer({ kind: "detail", packageId });
  };
  const retry = (packageId, taskId, deviceId) => {
    const otaPackage = packages.find((item) => item.id === packageId);
    setPackages((current) => current.map((item) => item.id !== packageId ? item : {
      ...item,
      tasks: item.tasks.map((task) => {
        if (task.id !== taskId) return task;
        const results = task.results.map((result) => result.deviceId === deviceId ? { ...result, status: "成功", message: "重试成功，设备已完成升级并重新上线" } : result);
        return { ...task, results, status: results.every((result) => result.status === "成功") ? "成功" : results.some((result) => result.status === "失败") ? "部分失败" : "执行中" };
      }),
    }));
    if (otaPackage) {
      const device = devices.find((item) => item.id === deviceId);
      const nextRomVersion = otaPackage.packageType === "ROM" ? otaPackage.targetVersion : device?.romVersion;
      const nextApkVersion = otaPackage.packageType === "APK" ? otaPackage.targetVersion : device?.apkVersion;
      const latestVersion = (packageType) => packages.filter((item) => item.packageType === packageType && item.model === device?.model && item.resourceStatus === "可用").map((item) => item.targetVersion).sort((left, right) => compareVersion(right, left))[0];
      const romIsLatest = !latestVersion("ROM") || compareVersion(nextRomVersion, latestVersion("ROM")) >= 0;
      const apkIsLatest = !latestVersion("APK") || compareVersion(nextApkVersion, latestVersion("APK")) >= 0;
      onApplyUpgrade?.({ deviceId, packageType: otaPackage.packageType, targetVersion: otaPackage.targetVersion, versionStatus: romIsLatest && apkIsLatest ? "已最新" : "待更新" });
    }
  };
  const packageScopeLabel = (item) => {
    const names = [...new Set(item.tasks.flatMap((task) => task.projectNames || task.projectIds?.map((id) => projects.find((project) => project.id === id)?.name || id) || []))];
    return names.length ? names.join("、") : "尚未下发";
  };
  return <>
    <div className="page-heading"><div><h1>平板 OTA 升级</h1><p>统一管理平板 ROM 固件与 APK 应用版本，并向指定项目下发升级任务</p></div><button className="primary-button" onClick={() => setDrawer({ kind: "upload" })}><Upload size={16}/>上传升级包</button></div>
    <section className="panel management-panel tablet-ota-panel"><div className="filters ota-filters"><label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="版本号、升级描述或更新说明"/></div></label><label><span>项目 / 社区</span><select className="select-control filter-select" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option>全部项目</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label><label><span>包类型</span><select className="select-control filter-select" value={type} onChange={(event) => setType(event.target.value)}><option>全部类型</option><option value="ROM">ROM 固件包</option><option value="APK">APK 应用包</option></select></label><div className="filter-actions"><button className="primary-button"><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div></div><div className="table-scroll"><table className="tablet-ota-table"><thead><tr><th>目标版本 / 适用型号</th><th>包类型</th><th>资源状态</th><th>升级策略</th><th>生效方式 / 升级时段</th><th>最低可用版本</th><th>任务范围</th><th>更新说明</th><th>上传时间</th><th className="sticky-right">操作</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><div className="stacked-cell"><b>{item.targetVersion}</b><small>{item.model}</small></div></td><td>{packageTypeLabels[item.packageType]}</td><td><StatusTag>{item.resourceStatus}</StatusTag></td><td>{item.strategy}</td><td><div className="stacked-cell"><b>{item.effectiveAt}</b><small>{item.dailyWindow}</small></div></td><td>{item.minimumVersion}</td><td className="ota-task-scope-cell">{packageScopeLabel(item)}</td><td className="ota-notes-cell">{item.notes}</td><td>{item.uploadedAt}</td><td className="sticky-right"><button className="table-action" onClick={() => setDrawer({ kind: "detail", packageId: item.id })}>详情</button><button className="table-action" disabled={item.resourceStatus !== "可用"} onClick={() => setDrawer({ kind: "task", packageId: item.id })}>创建升级任务</button></td></tr>)}{!filtered.length && <tr><td colSpan="10"><div className="empty-table-state">没有符合条件的升级包</div></td></tr>}</tbody></table></div><div className="pagination"><span>当前展示 {filtered.length} 条数据</span></div></section>
    {drawer?.kind === "upload" && <UploadPackageDrawer onClose={() => setDrawer(null)} onSave={savePackage}/>} 
    {drawer?.kind === "task" && selectedPackage && <CreateTaskDrawer otaPackage={selectedPackage} devices={devices} projects={projects} onClose={() => setDrawer(null)} onCreate={(selectedProjectIds) => createTask(selectedPackage.id, selectedProjectIds)}/>} 
    {drawer?.kind === "detail" && selectedPackage && <PackageDetailDrawer otaPackage={selectedPackage} onClose={() => setDrawer(null)} onCreateTask={() => setDrawer({ kind: "task", packageId: selectedPackage.id })} onRetry={(taskId, deviceId) => retry(selectedPackage.id, taskId, deviceId)}/>} 
  </>;
}
