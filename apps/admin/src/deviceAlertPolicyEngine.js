export const DEFAULT_OFFLINE_POLICY = {
  enabled: false,
  thresholdValue: "",
  thresholdUnit: "分钟",
  monitoringPeriod: "全天",
};

const unitMinutes = { 分钟: 1, 小时: 60 };

export function validateOfflinePolicy(policy) {
  if (!policy.enabled) return "";
  const value = Number(policy.thresholdValue);
  if (!Number.isInteger(value) || value <= 0) return "请输入大于 0 的整数时长";
  if (!unitMinutes[policy.thresholdUnit]) return "请选择有效的时长单位";
  return "";
}

export function reconcileDeviceOfflineEvents({ events = [], devices = [], policy, projectId, now }) {
  if (!policy.enabled || validateOfflinePolicy(policy)) return events;
  const nowMs = new Date(now).getTime();
  const thresholdMs = Number(policy.thresholdValue) * unitMinutes[policy.thresholdUnit] * 60000;
  const eligible = devices.filter((device) => device.projectId === projectId && device.installed && device.bound && !device.disabled);
  const eligibleIds = new Set(eligible.map((device) => device.id));
  const next = events.map((event) => ({ ...event }));

  for (const event of next) {
    if (event.projectId !== projectId || event.type !== "device-offline" || event.status !== "进行中") continue;
    const device = eligible.find((item) => item.id === event.deviceId);
    const reportedAt = device?.heartbeatAt || device?.lastReportAt;
    if (!device || !reportedAt || nowMs - new Date(reportedAt).getTime() < thresholdMs) {
      event.status = "已恢复";
      event.recoveredAt = now;
    }
  }

  for (const device of eligible) {
    const reportedAt = device.heartbeatAt || device.lastReportAt;
    if (!reportedAt) continue;
    const reportMs = new Date(reportedAt).getTime();
    if (!Number.isFinite(reportMs) || nowMs - reportMs < thresholdMs) continue;
    const exists = next.some((event) => event.projectId === projectId && event.deviceId === device.id && event.type === "device-offline" && event.status === "进行中");
    if (!exists) next.push({ id: `offline:${projectId}:${device.id}:${now}`, projectId, deviceId: device.id, type: "device-offline", status: "进行中", triggeredAt: now, lastReportAt: reportedAt, recoveredAt: "" });
  }

  return next.filter((event) => event.projectId !== projectId || event.status !== "进行中" || eligibleIds.has(event.deviceId));
}

export function canFormInactivityConclusion({ sensors = [], projectId }) {
  const eligible = sensors.filter((sensor) => sensor.projectId === projectId && sensor.installed && sensor.bound && !sensor.disabled);
  return eligible.length > 0 && eligible.every((sensor) => sensor.onlineStatus !== "离线");
}
