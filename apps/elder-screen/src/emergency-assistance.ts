import unifiedMockSource from "./data/emergency-assistance-mock.json";

export type EmergencyAssistanceStatus = "待接听" | "未接通" | "待回拨" | "处理中" | "需跟进" | "已完成" | "已取消";

export type EmergencyAcceptanceScenario =
  | "normal-connected"
  | "no-answer"
  | "partial-notification-failure"
  | "processing"
  | "completed";

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
    label: "正常接通",
    description: "呼叫中心接听并与老人沟通，已绑定子女同步收到通知。",
  },
  "no-answer": {
    label: "呼叫中心未接听",
    description: "首次未接通，老人可重新联系，也可返回首页等待回拨。",
  },
  "partial-notification-failure": {
    label: "部分子女通知失败",
    description: "呼叫中心仍正常处理；单个子女通知失败不会中断在线协助事件。",
  },
  processing: {
    label: "呼叫中心处理中",
    description: "事件已存在且正在处理，重新打开时不重复创建。",
  },
  completed: {
    label: "已完成",
    description: "呼叫中心已完成本次在线协助，老人端只展示简单结果和返回首页。",
  },
};

export function createEmergencyAssistanceEvent(
  scenario: EmergencyAcceptanceScenario,
  status: EmergencyAssistanceStatus = "待接听",
): EmergencyAssistanceEvent {
  const partialFailure = scenario === "partial-notification-failure";
  const notifications = unifiedMock.children.map((child, index) => ({
    ...child,
    deliveryStatus: partialFailure && index === 1 ? "发送失败" as const : "已送达" as const,
    viewedAt: partialFailure && index === 1 ? "" : child.viewedAt,
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
  };
}

export function isEmergencyAssistanceActive(event: EmergencyAssistanceEvent | null) {
  return Boolean(event && !["已完成", "已取消"].includes(event.status));
}
