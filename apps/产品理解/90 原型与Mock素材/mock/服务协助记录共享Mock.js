export const serviceAssistanceExpiryMessage = "家人暂未处理，您可以重新请家人帮忙。";
export const serviceAssistanceExpiryMs = 48 * 60 * 60 * 1000;

// 新发起记录保存服务项的展示快照；后续目录编辑不得反写历史记录。
export const createServiceAssistanceSnapshot = (service, serviceItem) => ({
  id: service?.id || "",
  name: service?.name || "",
  categoryName: service?.categoryName || service?.category || "",
  itemId: serviceItem?.id || "",
  itemName: serviceItem?.name || "",
  itemContent: serviceItem?.content || "",
  itemPriceText: serviceItem?.priceText || "",
});

export const normalizeServiceAssistanceRecord = (record, now = Date.now()) => {
  // 旧字段是家人确认动作的历史命名，不代表服务商履约证据。
  record = { ...record, familyHandlingStatus: record.familyHandlingStatus ?? (record.serviceStatus === "completed" ? "completed" : "not_completed"), handlingCompletedAt: record.handlingCompletedAt ?? record.completedAt ?? null, handlingCompletedBy: record.handlingCompletedBy ?? record.completedBy ?? null };
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

const cookieValue = (name) => document.cookie.split(";").map(item => item.trim()).find(item => item.startsWith(`${name}=`))?.slice(name.length + 1);
const readCookie = () => {
  if (!isBrowser()) return [];
  const manifest = cookieValue(`${cookieName}_manifest`);
  try {
    if (manifest) {
      const [revision, countText] = manifest.split(":");
      const count = Number(countText);
      if (!Number.isInteger(count) || count < 1 || count > 64) return [];
      const chunks = Array.from({ length: count }, (_, index) => cookieValue(`${cookieName}_${revision}_${index}`));
      if (chunks.some(chunk => chunk === undefined)) return [];
      return parseRecords(decodeURIComponent(chunks.join("")));
    }
    const legacy = cookieValue(cookieName);
    return parseRecords(legacy ? decodeURIComponent(legacy) : "");
  } catch { return []; }
};

const writeRecords = (records) => {
  if (!isBrowser()) return;
  const serialized = JSON.stringify(records);
  const encoded = encodeURIComponent(serialized);
  // 单个 cookie 有容量限制；分片后再发布清单，避免读到半条跨端记录。
  const chunks = encoded.match(/.{1,3000}/g) || [""];
  if (chunks.length > 64) throw new Error("协助记录存储空间不足");
  const previous = cookieValue(`${cookieName}_manifest`);
  const revision = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  chunks.forEach((chunk, index) => {
    const name = `${cookieName}_${revision}_${index}`;
    document.cookie = `${name}=${chunk}; path=/; max-age=2592000; samesite=lax`;
    if (cookieValue(name) !== chunk) throw new Error("协助记录保存失败，请重试");
  });
  document.cookie = `${cookieName}_manifest=${revision}:${chunks.length}; path=/; max-age=2592000; samesite=lax`;
  window.localStorage.setItem(serviceAssistanceSharedStorageKey, serialized);
  if (previous) {
    const [oldRevision, oldCount] = previous.split(":");
    for (let index = 0; index < Math.min(Number(oldCount) || 0, 64); index++) document.cookie = `${cookieName}_${oldRevision}_${index}=; path=/; max-age=0`;
  }
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
    if (updates.familyHandlingStatus === "completed" && (record.status !== "handled" || !updates.handlingCompletedBy || !updates.handlingCompletedAt || record.familyHandlingStatus === "completed")) return record;
    if (updates.review && (record.status !== "handled" || record.familyHandlingStatus !== "completed" || !record.handlingCompletedBy || !record.handlingCompletedAt || record.review || updates.review.elderId !== record.elder.id)) return record;
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

// 完成的是家人协助工单。评价暂保留已有授权门槛，评价对象待产品确认。
export const confirmSharedFamilyHandlingCompletion = (recordId, childName) => {
  const now = new Date().toISOString();
  return updateSharedServiceAssistanceRecord(recordId, {
    familyHandlingStatus: "completed", handlingCompletedAt: now, handlingCompletedBy: childName,
    // 迁移期兼容旧消费者；这些别名同样仅表示家人处理完成。
    serviceStatus: "completed", completedAt: now, completedBy: childName,
  });
};
export const confirmSharedServiceCompletion = confirmSharedFamilyHandlingCompletion;
export const canReviewServiceAssistance = (input, elderId) => {
  const record = input && normalizeServiceAssistanceRecord(input);
  return Boolean(record && record.elder.id === elderId && record.status === "handled" && record.familyHandlingStatus === "completed" && record.handlingCompletedBy && record.handlingCompletedAt && !record.review);
};
export const submitSharedServiceReview = (recordId, elderId, review) => {
  const record = readSharedServiceAssistanceRecords().find(item => item.id === recordId);
  if (!canReviewServiceAssistance(record, elderId) || !Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) return null;
  return updateSharedServiceAssistanceRecord(recordId, { review: { rating: review.rating, text: String(review.text || "").trim().slice(0, 100), elderId, submittedAt: new Date().toISOString(), edited: false } });
};

export const isActiveServiceAssistance = (record) => Boolean(record && ["pending", "handling", "handled"].includes(record.status) && (record.familyHandlingStatus ?? (record.serviceStatus === "completed" ? "completed" : "not_completed")) !== "completed");

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

// 按当前服务 ID 及其明确的历史别名汇总评价；不做名称或分类模糊匹配，避免评价串入其他服务。
export const getServiceReviewSummary = (serviceId, records = readSharedServiceAssistanceRecords()) => {
  const serviceIds = new Set(Array.isArray(serviceId) ? serviceId.filter(Boolean) : [serviceId].filter(Boolean));
  const seen = new Set();
  const reviews = records.filter(record => {
    if (!serviceIds.has(record.service?.id) || !record.review || seen.has(record.id)) return false;
    if (!Number.isInteger(record.review.rating) || record.review.rating < 1 || record.review.rating > 5) return false;
    if (record.review.elderId && record.review.elderId !== record.elder?.id) return false;
    seen.add(record.id);
    return true;
  }).map(record => ({ recordId: record.id, serviceId: record.service?.id || '', rating: record.review.rating, text: record.review.text || '', reviewerName: record.elder?.name || '老人', submittedAt: record.review.submittedAt }));
  return { count: reviews.length, average: reviews.length ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)) : null, reviews };
};
