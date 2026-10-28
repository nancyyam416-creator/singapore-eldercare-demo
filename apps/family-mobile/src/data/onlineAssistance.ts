export type AssistanceStatus = 'waiting' | 'processing' | 'completed';
export type AssistanceScenario = 'unread_processing' | 'read_processing' | 'completed' | 'notification_missing' | 'waiting' | 'single' | 'multiple' | 'mixed' | 'empty';
export interface AssistanceEvent {
  id: string;
  elderId: string;
  elderName: string;
  startedAt: string;
  status: AssistanceStatus;
  summary: string;
  updatedAt?: string;
  latestProgress?: string;
  result?: string;
  remarks?: string;
  completedAt?: string;
  notificationAvailable: boolean;
}
export type AssistanceViews = Record<string, string[]>;
export const assistanceStatusLabels: Record<AssistanceStatus, string> = {
  waiting: '待接听', processing: '呼叫中心处理中', completed: '已完成'
};
export function createAssistanceEvents(scenario: AssistanceScenario): AssistanceEvent[] {
  if (scenario === 'empty') return [];
  const events: AssistanceEvent[] = [
    { id: 'OA-20261027-001', elderId: 'elder-father', elderName: '张健康', startedAt: '2026-10-27T09:30:00+08:00',
      status: scenario === 'waiting' ? 'waiting' : scenario === 'completed' || scenario === 'notification_missing' ? 'completed' : 'processing',
      summary: '老人通过中控屏发起在线协助，希望了解上门服务安排。',
      updatedAt: '2026-10-27T09:35:00+08:00',
      latestProgress: scenario === 'waiting' ? '已发起呼叫，等待呼叫中心接听。' : '已联系服务人员，正在确认上门时间。',
      ...(scenario === 'completed' || scenario === 'notification_missing' ? { result: '已协助确认上门服务安排', remarks: '已向老人说明服务日期与准备事项，老人表示已了解。', completedAt: '2026-10-27T09:45:00+08:00' } : {}),
      notificationAvailable: scenario !== 'notification_missing' },
    { id: 'OA-20261026-008', elderId: 'elder-father', elderName: '张健康', startedAt: '2026-10-26T14:00:00+08:00', status: 'completed',
      summary: '老人咨询社区活动地点。', result: '已告知活动地点与到场时间', remarks: '呼叫中心已逐项说明活动安排，老人表示无需其他帮助。', completedAt: '2026-10-26T14:12:00+08:00', notificationAvailable: false },
    { id: 'OA-20261027-002', elderId: 'elder-mother', elderName: '李惠兰', startedAt: '2026-10-27T10:00:00+08:00', status: 'completed',
      summary: '老人通过中控屏咨询午餐配送安排。', result: '已协助确认午餐配送时间', remarks: '已向老人说明配送时段，并确认老人已了解。', completedAt: '2026-10-27T10:08:00+08:00', notificationAvailable: true }
  ];
  if (scenario === 'single') return [events[0]];
  if (scenario === 'multiple' || scenario === 'mixed') {
    const ongoing: AssistanceEvent[] = [events[0],
      { ...events[0], id: 'OA-20261027-003', startedAt: '2026-10-27T11:00:00+08:00', updatedAt: '2026-10-27T11:05:00+08:00', summary: '老人咨询午餐配送安排。', latestProgress: '已联系配送员，正在确认送达时间。' },
      { ...events[0], id: 'OA-20261027-004', status: 'waiting', startedAt: '2026-10-27T11:10:00+08:00', updatedAt: '2026-10-27T11:10:00+08:00', summary: '老人咨询社区活动安排。', latestProgress: '已发起呼叫，等待呼叫中心接听。' }
    ];
    return scenario === 'mixed' ? [...ongoing, ...events.slice(1)] : [...ongoing, events[2]];
  }
  return events;
}
export const assistanceUpdateTime = (event: AssistanceEvent) => event.completedAt ?? event.updatedAt ?? event.startedAt;
export const assistanceProgress = (event: AssistanceEvent) => event.status === 'completed' ? event.result || event.summary : event.latestProgress || event.summary;
export const assistanceRevision = (event: AssistanceEvent) => `${event.id}@${assistanceUpdateTime(event)}`;
export function sortAssistanceEvents(events: AssistanceEvent[]) {
  const rank: Record<AssistanceStatus, number> = { processing: 0, waiting: 1, completed: 2 };
  return [...events].sort((a, b) => rank[a.status] - rank[b.status] || Date.parse(assistanceUpdateTime(b)) - Date.parse(assistanceUpdateTime(a)) || a.id.localeCompare(b.id));
}
export function assistanceForElder(events: AssistanceEvent[], elderId?: string) {
  return sortAssistanceEvents(events.filter(event => event.elderId === elderId));
}
export function hasViewedAssistance(views: AssistanceViews, viewerId: string, eventId: string) {
  return (views[viewerId] ?? []).includes(eventId);
}
export function markAssistanceViewed(views: AssistanceViews, viewerId: string, eventId: string): AssistanceViews {
  return hasViewedAssistance(views, viewerId, eventId) ? views : { ...views, [viewerId]: [...(views[viewerId] ?? []), eventId] };
}
export function initialAssistanceViews(scenario: AssistanceScenario): AssistanceViews {
  const ids = scenario === 'read_processing' ? ['OA-20261026-008', 'OA-20261027-001'] : ['OA-20261026-008'];
  return { 'child-current': [...ids, ...createAssistanceEvents(scenario).filter(event => ids.includes(event.id)).map(assistanceRevision)] };
}
