export const serviceAssistanceExpiryMessage = "家人暂未处理，您可以重新请家人帮忙。";
export const serviceAssistanceExpiryMs = 48 * 60 * 60 * 1000;
export const normalizeServiceAssistanceRecord = (record, now = Date.now()) => {
  const sentAt = Date.parse(record.requestedAt);
  if (["pending", "handling"].includes(record.status) && !record.resultSummary?.trim() && Number.isFinite(sentAt) && now - sentAt >= serviceAssistanceExpiryMs) {
    return { ...record, status: "expired", expiredAt: new Date(sentAt + serviceAssistanceExpiryMs).toISOString() };
  }
  return record;
};

export const getLatestServiceAssistanceRecord = (records, elderId, serviceId) => records
  .map((record) => normalizeServiceAssistanceRecord(record))
  .filter((record) => (!elderId || record.elder?.id === elderId) && record.service?.id === serviceId)
  .sort((first, second) => Number(isActiveServiceAssistance(second)) - Number(isActiveServiceAssistance(first)) || second.requestedAt.localeCompare(first.requestedAt))[0] ?? null;

export const getServiceAssistanceConfirmationCopy = (record) => {
  const defaultCopy = {
    title: "确认请家人帮忙？",
    confirmLabel: "确认发送",
    successMessage: "已通知家人",
    description: "确认发送后开始计时。家人将协助联系服务商，并提交处理结果。",
    hint: "48 小时内未处理将自动失效，您可以重新发起。",
  };
  if (!record || record.status === "cancelled") return defaultCopy;
  if (record.status === "expired") return { ...defaultCopy, hint: serviceAssistanceExpiryMessage };
  if (isActiveServiceAssistance(record)) return {
    title: "已通知过家人，要再提醒一次吗？",
    description: "将再次提醒家人处理当前事项。",
    hint: "沿用本次协助记录，处理时限不变。",
    confirmLabel: "再次提醒",
    successMessage: "已提醒家人",
  };
  return {
    title: "再次请家人帮忙？",
    confirmLabel: "确认发送",
    successMessage: "已通知家人",
    description: "再次确认会生成一条新的协助请求，上次处理结果仍保留在服务记录中。",
    hint: "新请求将从本次发送时间开始计时。",
  };
};

export const serviceAssistanceSharedStorageKey = "u2g-service-assistance-records-v2-shared-contract";

const cookieName = "u2g_service_assistance_records_v2";
const changeEventName = "u2g:service-assistance-records-changed";

const isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";

const parseRecords = (value) => {
  if (!value) return [];
  try {
    const records = JSON.parse(value);
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
};

const readCookie = () => {
  if (!isBrowser()) return [];
  const prefix = `${cookieName}=`;
  const value = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length);
  return parseRecords(value ? decodeURIComponent(value) : "");
};

const writeRecords = (records) => {
  if (!isBrowser()) return;
  const serialized = JSON.stringify(records);
  window.localStorage.setItem(serviceAssistanceSharedStorageKey, serialized);
  document.cookie = `${cookieName}=${encodeURIComponent(serialized)}; path=/; max-age=2592000; samesite=lax`;
  window.dispatchEvent(new CustomEvent(changeEventName));
};

export const readSharedServiceAssistanceRecords = () => {
  if (!isBrowser()) return [];
  const cookieRecords = readCookie();
  if (cookieRecords.length > 0) {
    window.localStorage.setItem(serviceAssistanceSharedStorageKey, JSON.stringify(cookieRecords));
    return cookieRecords.map(record => normalizeServiceAssistanceRecord(record));
  }
  return parseRecords(window.localStorage.getItem(serviceAssistanceSharedStorageKey)).map(record => normalizeServiceAssistanceRecord(record));
};

export const upsertSharedServiceAssistanceRecord = (record) => {
  const records = readSharedServiceAssistanceRecords();
  const duplicate = records.find((item) => item.id === record.id);
  if (duplicate) return duplicate;
  writeRecords([record, ...records]);
  return record;
};

export const updateSharedServiceAssistanceRecord = (recordId, updates) => {
  let updated = null;
  const records = readSharedServiceAssistanceRecords().map((record) => {
    if (record.id !== recordId || record.status === "expired") return record;
    if (updates.serviceStatus === "completed" && (record.status !== "handled" || !updates.completedBy || !updates.completedAt || record.serviceStatus === "completed")) return record;
    if (updates.review && (record.status !== "handled" || record.serviceStatus !== "completed" || !record.completedBy || !record.completedAt || record.review || updates.review.elderId !== record.elder.id)) return record;
    updated = { ...record, ...updates };
    return updated;
  });
  if (updated) writeRecords(records);
  return updated;
};

export const subscribeSharedServiceAssistanceRecords = (listener) => {
  if (!isBrowser()) return () => {};
  const handleStorage = (event) => {
    if (event.key === serviceAssistanceSharedStorageKey) listener();
  };
  window.addEventListener(changeEventName, listener);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(changeEventName, listener);
    window.removeEventListener("storage", handleStorage);
  };
};

// 联系结果与服务完成独立；仅显式确认完成后可评价。
export const confirmSharedServiceCompletion = (recordId, childName) => updateSharedServiceAssistanceRecord(recordId, {
  serviceStatus: "completed", completedAt: new Date().toISOString(), completedBy: childName,
});
export const canReviewServiceAssistance = (record, elderId) => Boolean(record && record.elder.id === elderId && record.status === "handled" && record.serviceStatus === "completed" && record.completedBy && record.completedAt && !record.review);
export const submitSharedServiceReview = (recordId, elderId, review) => {
  const record = readSharedServiceAssistanceRecords().find(item => item.id === recordId);
  if (!canReviewServiceAssistance(record, elderId) || !Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) return null;
  return updateSharedServiceAssistanceRecord(recordId, { review: { rating: review.rating, text: String(review.text || "").trim().slice(0, 100), elderId, submittedAt: new Date().toISOString(), edited: false } });
};

export const isActiveServiceAssistance = (record) => Boolean(record && ["pending", "handling", "handled"].includes(record.status) && record.serviceStatus !== "completed");

// 发起入口统一使用此方法；持久化原记录的 upsert 不触发提醒。
export const requestSharedServiceAssistance = (candidate) => {
  const records = readSharedServiceAssistanceRecords();
  const existing = records.filter(record => record.elder?.id === candidate.elder?.id && record.service?.id === candidate.service?.id && isActiveServiceAssistance(record))
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0];
  if (existing) {
    const remindedAt = new Date().toISOString();
    const updated = { ...existing, reminderTimes: [...(existing.reminderTimes || []), remindedAt], lastRemindedAt: remindedAt };
    writeRecords(records.map(record => record.id === existing.id ? updated : record));
    return { record: updated, reminded: true, message: "已提醒家人" };
  }
  const record = upsertSharedServiceAssistanceRecord(candidate);
  return { record, reminded: false, message: "已通知家人" };
};
