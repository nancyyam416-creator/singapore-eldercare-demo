export type HomeNotificationPriority = "P0" | "P1" | "P2";
export type HomeNotificationStatus = "pending" | "completed";

interface HomeNotificationQueueItemBase {
  id: string;
  priority: HomeNotificationPriority;
  triggerType: "event" | "content";
  createdAt: string;
  title: string;
  description: string;
  status: HomeNotificationStatus;
}

export interface HomeScheduleNotificationQueueItem extends HomeNotificationQueueItemBase {
  kind: "schedule";
  reminderId: string;
}

export interface HomeSecurityNotificationQueueItem extends HomeNotificationQueueItemBase {
  kind: "security";
  tipId: string;
}

export interface HomeActivityNotificationQueueItem extends HomeNotificationQueueItemBase {
  kind: "activity";
  activityId: string;
  reminderId: string;
  registrationId: string;
}

export type HomeNotificationQueueItem =
  | HomeScheduleNotificationQueueItem
  | HomeSecurityNotificationQueueItem
  | HomeActivityNotificationQueueItem;

const priorityRank: Record<HomeNotificationPriority, number> = {
  P0: 3,
  P1: 2,
  P2: 1,
};

const triggerRank: Record<HomeNotificationQueueItem["triggerType"], number> = {
  event: 2,
  content: 1,
};

export const orderHomeNotificationQueue = (items: HomeNotificationQueueItem[]) => [...items].sort((first, second) => {
  const priorityDifference = priorityRank[second.priority] - priorityRank[first.priority];
  if (priorityDifference !== 0) return priorityDifference;
  const triggerDifference = triggerRank[second.triggerType] - triggerRank[first.triggerType];
  if (triggerDifference !== 0) return triggerDifference;
  const createdAtDifference = new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
  if (createdAtDifference !== 0) return createdAtDifference;
  return first.id.localeCompare(second.id);
});

export const createSamePriorityNotificationQueue = (): HomeNotificationQueueItem[] => orderHomeNotificationQueue([
  {
    id: "queue-schedule-walk",
    kind: "schedule",
    reminderId: "schedule-self-walk",
    priority: "P0",
    triggerType: "event",
    createdAt: "2026-09-18T17:00:00+08:00",
    title: "傍晚散步",
    description: "日程到点事件",
    status: "pending",
  },
  {
    id: "queue-security-tip-1",
    kind: "security",
    tipId: "tip-1",
    priority: "P0",
    triggerType: "content",
    createdAt: "2026-09-18T17:00:00+08:00",
    title: "警惕“冒充公检法安全账户”巨额骗局",
    description: "社区警惕事项发布",
    status: "pending",
  },
]);

export const createActivityStartNotification = (): HomeActivityNotificationQueueItem => ({
  id: "queue-activity-act-1-registration-001",
  kind: "activity",
  activityId: "act-1",
  reminderId: "activity-start-act-1-registration-001",
  registrationId: "registration-act-1-001",
  priority: "P0",
  triggerType: "event",
  createdAt: "2026-09-19T09:30:00+08:00",
  title: "社区剪纸活动",
  description: "活动将在30分钟后开始",
  status: "pending",
});
