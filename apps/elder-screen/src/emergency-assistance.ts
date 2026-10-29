import unifiedMockSource from "../../产品理解/90 原型与Mock素材/mock/紧急协助跨端统一Mock.json";

export type EmergencyAssistanceStatus = "待接听" | "未接通" | "待回拨" | "处理中" | "需跟进" | "已完成" | "已取消";

export type EmergencyAcceptanceScenario =
  | "normal-connected"
  | "waiting"
  | "no-answer"
  | "connected"
  | "cancelled";

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

export const emergencyScenarioDefinitions: Record<EmergencyAcceptanceScenario, { label: string; description: string }> = {
  "normal-connected": {
    label: "确认并正常接通",
    description: "从确认页发起网络电话，先显示正在连接，再显示呼叫中心已接听。",
  },
  waiting: {
    label: "正在连接",
    description: "网络电话正在连接乐龄呼叫中心，老人可取消本次连接。",
  },
  "no-answer": {
    label: "连接失败，可重试",
    description: "网络电话暂时未能接通呼叫中心，老人可重新连接或返回首页。",
  },
  connected: {
    label: "呼叫中心已接听",
    description: "网络电话已经接通，老人可直接与呼叫中心工作人员说话。",
  },
  cancelled: {
    label: "老人已取消",
    description: "本次网络电话连接已取消，没有继续呼叫呼叫中心。",
  },
};

export const onlineAssistanceCompletionResult = {
  summary: "工作人员已确认情况并完成本次处理",
  note: "呼叫中心已记录您的情况；如需进一步协助，工作人员会再次通过网络电话联系您。",
} as const;

export function createEmergencyAssistanceEvent(
  scenario: EmergencyAcceptanceScenario,
  status: EmergencyAssistanceStatus = "待接听",
): EmergencyAssistanceEvent {
  const notifications = unifiedMock.children.map((child) => ({
    ...child,
    deliveryStatus: "已送达" as const,
    viewedAt: child.viewedAt,
  }));
  const callCenterStatus: EmergencyAssistanceEvent["callCenter"]["status"] = status === "已取消"
    ? "待接听"
    : status;

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
  };
}

export function isEmergencyAssistanceActive(event: EmergencyAssistanceEvent | null) {
  return Boolean(event && !["已完成", "已取消"].includes(event.status));
}
