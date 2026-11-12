export const serviceAssistanceExpiryMessage = "家人暂未处理，您可以重新请家人帮忙。";
export const serviceAssistanceExpiryMs = 48 * 60 * 60 * 1000;

export const serviceContactAnswers = {
  appointmentConfirmed: "appointment_confirmed",
  familyHelpRequested: "family_help_requested",
};

export const servicePhoneActionTypes = {
  phoneViewed: "phone_viewed",
  callStarted: "call_started",
};

export const serviceContactActorTypes = {
  elder: "elder",
  child: "child",
};

export const familyServiceContactResults = {
  appointmentConfirmed: "appointment_confirmed",
  notAppointed: "not_appointed",
};

export const serviceContactEventTypes = {
  servicePhoneViewed: "service_phone_viewed",
  serviceCallStarted: "service_call_started",
  familyHelpInquirySent: "family_help_inquiry_sent",
  elderAppointmentConfirmed: "elder_appointment_confirmed",
  elderFamilyHelpRequested: "elder_family_help_requested",
  familyHelpRequested: "family_help_requested",
  familyHelpReminded: "family_help_reminded",
  familyHelpClaimed: "family_help_claimed",
  familyServiceContactStarted: "family_service_contact_started",
  familyServiceContactResultSubmitted: "family_service_contact_result_submitted",
};

export const shouldCreateServiceContactRecord = (phoneActionType) => [
  servicePhoneActionTypes.phoneViewed,
  servicePhoneActionTypes.callStarted,
].includes(phoneActionType);

const familyWorkflowStages = new Set([
  "family_help_pending",
  "family_help_handling",
  "family_help_handled",
  "family_help_completed",
  "cancelled",
  "expired",
]);

const createWorkflowEvent = (type, actor = {}, createdAt = new Date().toISOString(), payload = {}) => ({
  id: `SERVICE-EVENT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
  type,
  actorType: actor.type || "system",
  actorId: actor.id || null,
  actorName: actor.name || null,
  createdAt,
  payload,
});

const appendWorkflowEvent = (record, event) => ({
  ...record,
  workflowEvents: [...(Array.isArray(record.workflowEvents) ? record.workflowEvents : []), event],
});

const familyStageFromRecord = (record) => {
  if ((record.familyHandlingStatus ?? (record.serviceStatus === "completed" ? "completed" : "not_completed")) === "completed") return "family_help_completed";
  if (record.status === "expired") return "expired";
  if (record.status === "cancelled") return "cancelled";
  if (record.status === "handled") return "family_help_handled";
  if (record.status === "handling") return "family_help_handling";
  return "family_help_pending";
};

export const isFamilyAssistanceRecord = (record) => Boolean(record && (
  record.familyHelpRequestedAt
  || familyWorkflowStages.has(record.workflowStage)
  // 没有新流程字段的是历史家人协助记录，继续按旧契约读取。
  || (!record.workflowStage && !record.contactStartedAt)
));

export const isPendingServiceContact = (record) => Boolean(record
  && !isFamilyAssistanceRecord(record)
  && record.workflowStage === "contact_pending_confirmation"
  && !record.appointmentOutcome);

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
  const isFamilyAssistance = isFamilyAssistanceRecord(record);
  const workflowStage = isFamilyAssistance
    ? familyStageFromRecord(record)
    : record.appointmentOutcome === serviceContactAnswers.appointmentConfirmed
      ? "appointment_confirmed"
      : "contact_pending_confirmation";
  record = { ...record, workflowStage };
  const sentAt = Date.parse(record.familyHelpRequestedAt || record.requestedAt);
  if (isFamilyAssistance && ["pending", "handling"].includes(record.status) && !record.resultSummary?.trim() && Number.isFinite(sentAt) && now - sentAt >= serviceAssistanceExpiryMs) {
    return { ...record, status: "expired", expiredAt: new Date(sentAt + serviceAssistanceExpiryMs).toISOString() };
  }
  return record;
};

export const getLatestServiceAssistanceRecord = (records, elderId, serviceId) => records
  .map((record) => normalizeServiceAssistanceRecord(record))
  .filter((record) => isFamilyAssistanceRecord(record) && (!elderId || record.elder?.id === elderId) && record.service?.id === serviceId)
  .sort((first, second) => Number(isActiveServiceAssistance(second)) - Number(isActiveServiceAssistance(first)) || second.requestedAt.localeCompare(first.requestedAt))[0] ?? null;

export const getServiceAssistanceConfirmationCopy = (record) => {
  const defaultCopy = {
    title: "确认请家人帮忙？",
    confirmLabel: "确认发送",
    successMessage: "已通知家人",
    description: "确认发送后开始计时。家人将协助联系服务商，并提交处理结果。",
    hint: "48 小时内未处理将自动失效，您可以重新发起。",
  };
  if (!record || record.status === "cancelled" || !isFamilyAssistanceRecord(record)) return defaultCopy;
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
    // 旧消费者即使误读到拨号待确认记录，也不能把它直接接手或提交为家人协助结果。
    if (!isFamilyAssistanceRecord(record) && (["handling", "handled"].includes(updates.status) || updates.familyHandlingStatus === "completed" || updates.review)) return record;
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

export const isActiveServiceAssistance = (record) => Boolean(record
  && isFamilyAssistanceRecord(record)
  && ["pending", "handling", "handled"].includes(record.status)
  && (record.familyHandlingStatus ?? (record.serviceStatus === "completed" ? "completed" : "not_completed")) !== "completed");

// 查看号码只记录联系意向；点击拨号只记录“已发起联系”。两者都不代表接通或已预约。
export const startSharedServiceContact = (candidate) => {
  const phoneActionType = candidate.phoneActionType || servicePhoneActionTypes.callStarted;
  if (!shouldCreateServiceContactRecord(phoneActionType)) return { record: null, created: false, reason: "unsupported_phone_action" };
  const records = readSharedServiceAssistanceRecords();
  const duplicate = records.find((record) => record.id === candidate.id);
  if (duplicate) return { record: duplicate, created: false };
  if (phoneActionType === servicePhoneActionTypes.phoneViewed) {
    const pendingIntent = records.find((record) => isPendingServiceContact(record)
      && record.phoneActionType === servicePhoneActionTypes.phoneViewed
      && record.elder?.id === candidate.elder?.id
      && record.service?.id === candidate.service?.id);
    if (pendingIntent) return { record: pendingIntent, created: false, reason: "contact_intent_exists" };
  }
  const contactStartedAt = candidate.contactStartedAt || candidate.requestedAt || new Date().toISOString();
  const actor = candidate.contactStartedBy || { type: "elder", id: candidate.elder?.id, name: candidate.elder?.name };
  const eventType = phoneActionType === servicePhoneActionTypes.phoneViewed
    ? serviceContactEventTypes.servicePhoneViewed
    : serviceContactEventTypes.serviceCallStarted;
  const record = appendWorkflowEvent({
    ...candidate,
    requestedAt: candidate.requestedAt || contactStartedAt,
    contactStartedAt,
    contactStartedBy: actor,
    phoneActionType,
    contactSource: candidate.contactSource || actor.type || serviceContactActorTypes.elder,
    workflowStage: "contact_pending_confirmation",
    appointmentOutcome: null,
    appointmentOutcomeAt: null,
    familyHelpRequestedAt: null,
    familyHelpRequestedBy: null,
    status: "pending",
    familyHandlingStatus: "not_completed",
    serviceStatus: "not_completed",
  }, createWorkflowEvent(eventType, actor, contactStartedAt, { phone: candidate.provider?.phone || "", phoneActionType }));
  writeRecords([record, ...records]);
  return { record, created: true };
};

// 老人答复只有两种；不调用本接口即继续保持待确认，待确认阶段不启动 48 小时计时。
export const answerSharedServiceContact = (recordId, answer, actor = {}) => {
  if (![serviceContactAnswers.appointmentConfirmed, serviceContactAnswers.familyHelpRequested].includes(answer)) return { record: null, updated: false, reason: "invalid_answer" };
  const records = readSharedServiceAssistanceRecords();
  const current = records.find((record) => record.id === recordId);
  if (!current) return { record: null, updated: false, reason: "not_found" };
  const normalized = normalizeServiceAssistanceRecord(current);
  if (!isPendingServiceContact(normalized)) return { record: normalized, updated: false, reason: "already_resolved" };
  const answeredAt = new Date().toISOString();
  const responder = { type: actor.type || "elder", id: actor.id || current.elder?.id, name: actor.name || current.elder?.name };
  const eventType = answer === serviceContactAnswers.appointmentConfirmed ? "elder_appointment_confirmed" : "elder_family_help_requested";
  const next = appendWorkflowEvent(answer === serviceContactAnswers.appointmentConfirmed ? {
    ...current,
    workflowStage: "appointment_confirmed",
    appointmentOutcome: answer,
    appointmentOutcomeAt: answeredAt,
    appointmentOutcomeBy: responder,
    status: "handled",
    handledAt: answeredAt,
    resultSummary: "老人确认已约好",
  } : {
    ...current,
    workflowStage: "family_help_pending",
    appointmentOutcome: answer,
    appointmentOutcomeAt: answeredAt,
    appointmentOutcomeBy: responder,
    familyHelpRequestedAt: answeredAt,
    familyHelpRequestedBy: responder,
    requestReason: current.requestReason || "没约好，请家人帮忙",
    status: "pending",
    handledBy: null,
    handledAt: null,
    resultSummary: null,
    familyHandlingStatus: "not_completed",
    serviceStatus: "not_completed",
  }, createWorkflowEvent(eventType, responder, answeredAt));
  writeRecords(records.map((record) => record.id === recordId ? next : record));
  return { record: next, updated: true, familyHelpRequested: answer === serviceContactAnswers.familyHelpRequested };
};

// 多位家人共享同一询问结果；待老人答复期间只保留一条未决询问，避免重复打扰。
export const askSharedElderIfFamilyHelpNeeded = (recordId, actor = {}) => {
  const records = readSharedServiceAssistanceRecords();
  const current = records.find((record) => record.id === recordId);
  if (!current) return { record: null, asked: false, reason: "not_found" };
  const normalized = normalizeServiceAssistanceRecord(current);
  if (!isPendingServiceContact(normalized)) return { record: normalized, asked: false, reason: "already_resolved" };
  const existingInquiry = [...(current.workflowEvents || [])].reverse().find((event) => event.type === "family_help_inquiry_sent");
  if (existingInquiry) return { record: normalized, asked: false, reason: "inquiry_already_sent", inquiry: existingInquiry };
  const askedAt = new Date().toISOString();
  const asker = { type: "child", id: actor.id || null, name: actor.name || null };
  const inquiry = createWorkflowEvent("family_help_inquiry_sent", asker, askedAt);
  const next = appendWorkflowEvent({ ...current, familyHelpInquiry: { askedAt, askedBy: asker } }, inquiry);
  writeRecords(records.map((record) => record.id === recordId ? next : record));
  return { record: next, asked: true, inquiry };
};

const normalizeFamilyContactActor = (actor = {}) => ({
  type: serviceContactActorTypes.child,
  id: actor.id || null,
  name: actor.name || "",
});

const isSameFamilyContactActor = (first, second) => Boolean(first && second && (
  (first.id && second.id && first.id === second.id)
  || ((!first.id || !second.id) && first.name && first.name === second.name)
));

const acquireServiceRecordLock = (recordId) => {
  if (!isBrowser()) return () => {};
  const key = `u2g-service-record-lock:${recordId}`;
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const now = Date.now();
  try {
    const current = JSON.parse(window.localStorage.getItem(key) || "null");
    if (current?.expiresAt > now) return null;
    window.localStorage.setItem(key, JSON.stringify({ token, expiresAt: now + 5000 }));
    const acquired = JSON.parse(window.localStorage.getItem(key) || "null");
    if (acquired?.token !== token) return null;
    return () => {
      try {
        const latest = JSON.parse(window.localStorage.getItem(key) || "null");
        if (latest?.token === token) window.localStorage.removeItem(key);
      } catch {
        // 锁会在 5 秒后自动过期，不影响记录继续使用。
      }
    };
  } catch {
    return null;
  }
};

// 子女点击“打电话帮忙约”时原子进入联系状态；不再要求先执行独立接手动作。
const startSharedFamilyServiceContactUnlocked = (recordId, actor = {}) => {
  const records = readSharedServiceAssistanceRecords();
  const current = records.find((record) => record.id === recordId);
  if (!current) return { record: null, started: false, reason: "not_found" };
  const normalized = normalizeServiceAssistanceRecord(current);
  const contactActor = normalizeFamilyContactActor(actor);
  if (!contactActor.id && !contactActor.name) return { record: normalized, started: false, reason: "invalid_actor" };
  if (!isActiveServiceAssistance(normalized)) return { record: normalized, started: false, reason: "not_contactable" };
  if (normalized.status === "handling" || normalized.familyContactStatus === "contacting") {
    const currentActor = normalized.familyContactBy || { id: normalized.claimedById || null, name: normalized.handledBy || "" };
    if (isSameFamilyContactActor(currentActor, contactActor)) return { record: normalized, started: true, reused: true, reason: "already_contacting_by_self", currentContact: { actor: currentActor, startedAt: normalized.familyContactStartedAt || normalized.claimedAt || null } };
    return { record: normalized, started: false, reason: "contacting_by_other", currentContact: { actor: currentActor, startedAt: normalized.familyContactStartedAt || normalized.claimedAt || null } };
  }
  if (normalized.status !== "pending") return { record: normalized, started: false, reason: "not_contactable" };
  const startedAt = new Date().toISOString();
  const next = appendWorkflowEvent({
    ...current,
    workflowStage: "family_help_handling",
    status: "handling",
    familyContactStatus: "contacting",
    familyContactBy: contactActor,
    familyContactStartedAt: startedAt,
    familyContactResult: null,
    familyContactResultAt: null,
    appointmentAt: "",
    feeText: "",
    // 兼容历史接手字段；新流程不再单独展示接手动作。
    handledBy: contactActor.name || "家人",
    claimedById: contactActor.id,
    claimedAt: startedAt,
    handledAt: null,
    resultSummary: null,
  }, createWorkflowEvent(serviceContactEventTypes.familyServiceContactStarted, contactActor, startedAt));
  writeRecords(records.map((record) => record.id === recordId ? next : record));
  return { record: next, started: true, reused: false, currentContact: { actor: contactActor, startedAt } };
};

export const startSharedFamilyServiceContact = (recordId, actor = {}) => {
  const release = acquireServiceRecordLock(recordId);
  if (!release) return { record: readSharedServiceAssistanceRecords().find((record) => record.id === recordId) || null, started: false, reason: "record_busy" };
  try {
    return startSharedFamilyServiceContactUnlocked(recordId, actor);
  } finally {
    release();
  }
};

// 家人拨号后手动回填联系结果；拨号本身不会自动提交结果或完成工单。
const submitSharedFamilyServiceContactResultUnlocked = (recordId, result, actor = {}, details = {}) => {
  if (![familyServiceContactResults.appointmentConfirmed, familyServiceContactResults.notAppointed].includes(result)) return { record: null, submitted: false, reason: "invalid_result" };
  const records = readSharedServiceAssistanceRecords();
  const current = records.find((record) => record.id === recordId);
  if (!current) return { record: null, submitted: false, reason: "not_found" };
  const normalized = normalizeServiceAssistanceRecord(current);
  const contactActor = normalizeFamilyContactActor(actor);
  if (!contactActor.id && !contactActor.name) return { record: normalized, submitted: false, reason: "invalid_actor" };
  const currentActor = normalized.familyContactBy || { id: normalized.claimedById || null, name: normalized.handledBy || "" };
  if (normalized.status !== "handling" && normalized.familyContactStatus !== "contacting") return { record: normalized, submitted: false, reason: "not_contacting" };
  if (!isSameFamilyContactActor(currentActor, contactActor)) return { record: normalized, submitted: false, reason: "not_current_contact_actor", currentContact: { actor: currentActor, startedAt: normalized.familyContactStartedAt || normalized.claimedAt || null } };
  const submittedAt = new Date().toISOString();
  const appointmentAt = String(details.appointmentAt || "").trim().slice(0, 80);
  const feeText = String(details.feeText || "").trim().slice(0, 80);
  const note = String(details.note || "").trim().slice(0, 300);
  const attempt = {
    id: `FAMILY-CONTACT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    actor: contactActor,
    startedAt: normalized.familyContactStartedAt || normalized.claimedAt || submittedAt,
    result,
    submittedAt,
    appointmentAt,
    feeText,
    note,
  };
  const appointmentConfirmed = result === familyServiceContactResults.appointmentConfirmed;
  const resultSummary = note || ["已联系服务商并约好", appointmentAt && `时间：${appointmentAt}`, feeText && `费用：${feeText}`].filter(Boolean).join("；");
  const next = appendWorkflowEvent(appointmentConfirmed ? {
    ...current,
    workflowStage: "family_help_handled",
    status: "handled",
    familyContactStatus: result,
    familyContactBy: contactActor,
    familyContactResult: result,
    familyContactResultAt: submittedAt,
    appointmentAt,
    feeText,
    familyContactAttempts: [...(current.familyContactAttempts || []), attempt],
    handledBy: contactActor.name || "家人",
    handledAt: submittedAt,
    resultSummary,
  } : {
    ...current,
    workflowStage: "family_help_pending",
    status: "pending",
    familyContactStatus: result,
    familyContactBy: contactActor,
    familyContactResult: result,
    familyContactResultAt: submittedAt,
    appointmentAt,
    feeText,
    familyContactAttempts: [...(current.familyContactAttempts || []), attempt],
    lastFamilyContactBy: contactActor,
    lastFamilyContactAt: submittedAt,
    handledBy: null,
    claimedById: null,
    claimedAt: null,
    handledAt: null,
    resultSummary: null,
  }, createWorkflowEvent(serviceContactEventTypes.familyServiceContactResultSubmitted, contactActor, submittedAt, { result, appointmentAt, feeText, note }));
  writeRecords(records.map((record) => record.id === recordId ? next : record));
  return { record: next, submitted: true, appointmentConfirmed };
};

export const submitSharedFamilyServiceContactResult = (recordId, result, actor = {}, details = {}) => {
  const release = acquireServiceRecordLock(recordId);
  if (!release) return { record: readSharedServiceAssistanceRecords().find((record) => record.id === recordId) || null, submitted: false, reason: "record_busy" };
  try {
    return submitSharedFamilyServiceContactResultUnlocked(recordId, result, actor, details);
  } finally {
    release();
  }
};

// 旧版独立接手接口保留历史兼容；新流程使用 startSharedFamilyServiceContact。
export const claimSharedServiceAssistance = (recordId, actor = {}) => {
  const records = readSharedServiceAssistanceRecords();
  const current = records.find((record) => record.id === recordId);
  if (!current) return { record: null, claimed: false, reason: "not_found" };
  const normalized = normalizeServiceAssistanceRecord(current);
  if (!isActiveServiceAssistance(normalized) || normalized.status !== "pending") return { record: normalized, claimed: false, reason: normalized.status === "handling" ? "claimed_by_other" : "not_claimable" };
  const claimedAt = new Date().toISOString();
  const handler = { type: "child", id: actor.id || null, name: actor.name || "家人" };
  const next = appendWorkflowEvent({ ...current, workflowStage: "family_help_handling", status: "handling", handledBy: handler.name, claimedById: handler.id, claimedAt }, createWorkflowEvent("family_help_claimed", handler, claimedAt));
  writeRecords(records.map((record) => record.id === recordId ? next : record));
  return { record: next, claimed: true };
};

// 发起入口统一使用此方法；持久化原记录的 upsert 不触发提醒。
export const requestSharedServiceAssistance = (candidate) => {
  const records = readSharedServiceAssistanceRecords();
  const contactRecordId = candidate.contactRecordId || candidate.id;
  const contactRecord = records.find((record) => record.id === contactRecordId && isPendingServiceContact(normalizeServiceAssistanceRecord(record)));
  if (contactRecord) {
    const result = answerSharedServiceContact(contactRecord.id, serviceContactAnswers.familyHelpRequested, candidate.familyHelpRequestedBy || { type: "elder", id: contactRecord.elder?.id, name: contactRecord.elder?.name });
    return { record: result.record, reminded: false, message: "已通知家人", transitionedFromContact: true };
  }
  const existing = records.filter(record => record.elder?.id === candidate.elder?.id && record.service?.id === candidate.service?.id && isActiveServiceAssistance(record))
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0];
  if (existing) {
    const remindedAt = new Date().toISOString();
    const actor = candidate.familyHelpRequestedBy || { type: "elder", id: candidate.elder?.id, name: candidate.elder?.name };
    const updated = appendWorkflowEvent({ ...existing, reminderTimes: [...(existing.reminderTimes || []), remindedAt], lastRemindedAt: remindedAt }, createWorkflowEvent("family_help_reminded", actor, remindedAt));
    writeRecords(records.map(record => record.id === existing.id ? updated : record));
    return { record: updated, reminded: true, message: "已提醒家人" };
  }
  const familyHelpRequestedAt = candidate.familyHelpRequestedAt || candidate.requestedAt || new Date().toISOString();
  const actor = candidate.familyHelpRequestedBy || { type: "elder", id: candidate.elder?.id, name: candidate.elder?.name };
  const record = upsertSharedServiceAssistanceRecord(appendWorkflowEvent({ ...candidate, requestedAt: candidate.requestedAt || familyHelpRequestedAt, familyHelpRequestedAt, familyHelpRequestedBy: actor, workflowStage: "family_help_pending" }, createWorkflowEvent("family_help_requested", actor, familyHelpRequestedAt)));
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
