import unifiedMockSource from "../../产品理解/90 原型与Mock素材/mock/紧急协助跨端统一Mock.json";
import { elderProfileMock, getActiveFamilyRelationships } from "./elder-profile";

export type EmergencyAssistanceStatus = "待接听" | "未接通" | "待回拨" | "处理中" | "需跟进" | "已完成" | "已取消";

export type EmergencyAcceptanceScenario =
  | "normal-connected"
  | "waiting"
  | "no-answer"
  | "connected"
  | "cancelled"
  | "contacts-none"
  | "contacts-single"
  | "contacts-multiple";

export interface EmergencyCallTarget {
  id: string;
  name: string;
  relationship: string;
  maskedPhone: string;
  targetType: "contact" | "call-center";
}

export interface EmergencyCallContact extends EmergencyCallTarget {
  targetType: "contact";
}

export interface EmergencyCallAttempt {
  targetId: string;
  targetName: string;
  targetType: "contact" | "call-center";
  result: "未接通" | "已接通";
}

export interface EmergencyChildNotification {
  id: string;
  name: string;
  relation: string;
  deliveryStatus: "已送达" | "发送失败";
  viewedAt: string;
}

export interface EmergencyAssistanceEvent {
  id: string;
  elderlyId: string;
  elderlyName: string;
  startedAt: string;
  sourceDevice: string;
  sourceDeviceId: string;
  status: EmergencyAssistanceStatus;
  callCenter: {
    name: string;
    status: "待接听" | "已接听" | "未接通" | "待回拨" | "处理中" | "需跟进" | "已完成";
    agent: string;
    lastAttemptAt: string;
    answeredAt: string;
  };
  notifications: EmergencyChildNotification[];
  completedAt: string;
  resultSummary: string;
  resultNote: string;
  callRoute: {
    orderedTargets: EmergencyCallTarget[];
    orderedContacts: EmergencyCallContact[];
    attempts: EmergencyCallAttempt[];
    activeTargetType: "contact" | "call-center";
    activeTargetName: string;
    activeContactId: string | null;
    assumptionPendingConfirmation: true;
  };
}

interface UnifiedEmergencyMock {
  eventId: string;
  elderlyId: string;
  elderlyName: string;
  startedAt: string;
  sourceDevice: string;
  sourceDeviceId: string;
  callCenter: {
    name: string;
    agent: string;
    lastAttemptAt: string;
    answeredAt: string;
  };
  children: EmergencyChildNotification[];
}

const unifiedMock = unifiedMockSource as UnifiedEmergencyMock;
export const emergencyContactOrderStorageKey = "u2g-online-assistance-contact-order-v1";
export const emergencyCallSequenceAssumption = "原型假设（待确认）：按已保存顺序依次呼叫家人与官方乐龄呼叫中心；未接通时继续下一位。本原型不设置自动等待时长。";
export const emergencyCallCenterTarget: EmergencyCallTarget = {
  id: "call-center",
  name: "乐龄呼叫中心",
  relationship: "官方服务",
  maskedPhone: "网络电话",
  targetType: "call-center",
};

const isBrowser = () => typeof window !== "undefined";

export const getEmergencyCallContacts = (): EmergencyCallContact[] => {
  const contacts = getActiveFamilyRelationships().map((relationship) => ({
    id: relationship.id,
    name: relationship.displayName,
    relationship: relationship.relationship,
    maskedPhone: relationship.maskedPhone ?? "电话待完善",
    targetType: "contact" as const,
  }));
  if (elderProfileMock.emergencyContact && !contacts.some((contact) => contact.name === elderProfileMock.emergencyContact?.name)) {
    contacts.unshift({
      id: "profile-emergency-contact",
      name: elderProfileMock.emergencyContact.name,
      relationship: elderProfileMock.emergencyContact.relationship,
      maskedPhone: elderProfileMock.emergencyContact.maskedPhone,
      targetType: "contact",
    });
  }
  return contacts;
};

export const readEmergencyContactOrder = () => {
  if (!isBrowser()) return [] as string[];
  try {
    const value = JSON.parse(window.localStorage.getItem(emergencyContactOrderStorageKey) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [] as string[];
  }
};

export const saveEmergencyContactOrder = (contactIds: string[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(emergencyContactOrderStorageKey, JSON.stringify(contactIds));
};

export const getOrderedEmergencyCallContacts = () => {
  return getOrderedEmergencyCallTargets().filter((target): target is EmergencyCallContact => target.targetType === "contact");
};

export const getOrderedEmergencyCallTargets = (): EmergencyCallTarget[] => {
  const targets: EmergencyCallTarget[] = [...getEmergencyCallContacts(), emergencyCallCenterTarget];
  const order = readEmergencyContactOrder();
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...targets].sort((first, second) => (rank.get(first.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(second.id) ?? Number.MAX_SAFE_INTEGER));
};

export const getEmergencyScenarioContacts = (scenario: EmergencyAcceptanceScenario) => {
  const contacts = getOrderedEmergencyCallContacts();
  if (scenario === "contacts-none") return [];
  if (scenario === "contacts-single") return contacts.slice(0, 1);
  return contacts;
};

export const getEmergencyScenarioTargets = (scenario: EmergencyAcceptanceScenario): EmergencyCallTarget[] => {
  const targets = getOrderedEmergencyCallTargets();
  const contacts = targets.filter((target) => target.targetType === "contact");
  if (scenario === "contacts-none") return [emergencyCallCenterTarget];
  if (scenario === "contacts-single") {
    const allowedIds = new Set([contacts[0]?.id, emergencyCallCenterTarget.id]);
    return targets.filter((target) => allowedIds.has(target.id));
  }
  return targets;
};

export const emergencyScenarioDefinitions: Record<EmergencyAcceptanceScenario, { label: string; description: string }> = {
  "normal-connected": {
    label: "默认联系顺序",
    description: "从确认页查看并保存联系顺序，再手动模拟接通或未接通。",
  },
  waiting: {
    label: "Mock 呼叫中",
    description: "显示当前呼叫目标，可模拟接通、未接通或取消。",
  },
  "no-answer": {
    label: "连接失败，可重试",
    description: "网络电话暂时未能接通呼叫中心，老人可重新连接或返回首页。",
  },
  connected: {
    label: "当前目标已接听",
    description: "展示联系人或呼叫中心的 Mock 已接听状态。",
  },
  cancelled: {
    label: "老人已取消",
    description: "本次网络电话连接已取消，没有继续呼叫呼叫中心。",
  },
  "contacts-none": {
    label: "无紧急联系人",
    description: "没有可用紧急联系人时，直接进入乐龄呼叫中心 Mock 连接。",
  },
  "contacts-single": {
    label: "1位紧急联系人",
    description: "唯一家人与官方呼叫中心按已保存顺序呼叫。",
  },
  "contacts-multiple": {
    label: "多位紧急联系人",
    description: "多位家人与官方呼叫中心共同按已保存顺序呼叫。",
  },
};

export const onlineAssistanceCompletionResult = {
  summary: "工作人员已确认情况并完成本次处理",
  note: "呼叫中心已记录您的情况；如需进一步协助，工作人员会再次通过网络电话联系您。",
} as const;

export function createEmergencyAssistanceEvent(
  scenario: EmergencyAcceptanceScenario,
  status: EmergencyAssistanceStatus = "待接听",
  targets: EmergencyCallTarget[] = getEmergencyScenarioTargets(scenario),
): EmergencyAssistanceEvent {
  const notifications = unifiedMock.children.map((child) => ({
    ...child,
    deliveryStatus: "已送达" as const,
    viewedAt: child.viewedAt,
  }));
  const callCenterStatus: EmergencyAssistanceEvent["callCenter"]["status"] = status === "已取消"
    ? "待接听"
    : status;
  const activeTarget = targets[0] ?? emergencyCallCenterTarget;

  return {
    id: unifiedMock.eventId,
    elderlyId: unifiedMock.elderlyId,
    elderlyName: unifiedMock.elderlyName,
    startedAt: unifiedMock.startedAt,
    sourceDevice: unifiedMock.sourceDevice,
    sourceDeviceId: unifiedMock.sourceDeviceId,
    status,
    callCenter: {
      name: unifiedMock.callCenter.name,
      status: callCenterStatus,
      agent: unifiedMock.callCenter.agent,
      lastAttemptAt: unifiedMock.callCenter.lastAttemptAt,
      answeredAt: status === "待接听" || status === "待回拨" || status === "未接通" ? "" : unifiedMock.callCenter.answeredAt,
    },
    notifications,
    completedAt: status === "已完成" ? "2026-07-28 10:06:35" : "",
    resultSummary: status === "已完成" ? onlineAssistanceCompletionResult.summary : "",
    resultNote: status === "已完成" ? onlineAssistanceCompletionResult.note : "",
    callRoute: {
      orderedTargets: targets,
      orderedContacts: targets.filter((target): target is EmergencyCallContact => target.targetType === "contact"),
      attempts: [],
      activeTargetType: activeTarget.targetType,
      activeTargetName: activeTarget.name,
      activeContactId: activeTarget.targetType === "contact" ? activeTarget.id : null,
      assumptionPendingConfirmation: true,
    },
  };
}

export function isEmergencyAssistanceActive(event: EmergencyAssistanceEvent | null) {
  return Boolean(event && !["已完成", "已取消"].includes(event.status));
}
