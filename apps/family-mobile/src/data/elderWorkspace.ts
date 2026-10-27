import { ActivityLog, BoundElder, CareReminder, HealthStats, Medication, Order } from '../types';
import { initialActivities, initialHealthStats, initialMedications, initialOrders, initialParentProfile } from './mockData';

export type ElderDataState = 'ready' | 'loading' | 'empty' | 'forbidden';
export const currentElderStorageKey = 'u2g-child-current-elder-v1';
export interface ElderWorkspace {
  profile: typeof initialParentProfile;
  health: HealthStats;
  medications: Medication[];
  activities: ActivityLog[];
  orders: Order[];
  reminders: CareReminder[];
  hasDevices: boolean;
  contacts: [string, string][];
  advisor: string;
}
export function createElderWorkspace(elder: BoundElder): ElderWorkspace {
  const father = elder.id === 'elder-father';
  const mother = elder.id === 'elder-mother';
  const profile = father ? { ...initialParentProfile } : {
    name: elder.name, gender: mother ? '女' : '未填写', age: elder.age, avatar: elder.avatar,
    conditions: mother ? '暂无慢性病记录' : '暂无健康资料', contact: mother ? '+65 812****03' : '暂无联系电话',
    address: mother ? '新加坡武吉知马路 12 号' : elder.maskedAddress
  };
  const medications: Medication[] = father ? structuredClone(initialMedications) : mother ? [
    { id: 'mother-med-1', name: '维生素D滴剂', dosage: '遵医嘱', timeSlot: 'morning', timeStr: '09:00', status: 'taken', takenTime: '09:05', note: '早餐后' }
  ] : [];
  const activities: ActivityLog[] = father ? structuredClone(initialActivities) : mother ? [
    { id: 'mother-act-1', time: '16:00', content: '手机端确认晚间散步提醒', type: 'info' },
    { id: 'mother-act-2', time: '10:00', content: '社区送餐服务已完成', type: 'info' },
    { id: 'mother-act-3', time: '09:05', content: '维生素D滴剂已确认服用', type: 'medication' }
  ] : [];
  const orders: Order[] = father ? structuredClone(initialOrders) : mother ? [{
    id: 'mother-order-1', serviceId: 'srv-meal-1', serviceName: '社区午餐配送', categoryNameSnapshot: '助餐服务', price: 18, unit: '次',
    serviceDate: '2026-07-29', serviceTime: '10:00-11:00', parentName: elder.name, parentAddress: profile.address, status: 'completed',
    statusLogs: [{ time: '2026-07-29 10:00', text: '午餐已送达并确认收餐' }], orderTime: '2026-07-28 15:00', paymentMethod: '微信支付'
  } as Order] : [];
  const reminders: CareReminder[] = medications.map(medication => ({
    id: elder.id + '-rem-' + medication.id, elderId: elder.id, elderName: elder.name, type: 'medication',
    title: medication.name, detail: medication.dosage, date: '2026-07-29', time: medication.timeStr, repeat: 'daily'
  }));
  if (mother) reminders.push({ id: 'mother-rem-walk', elderId: elder.id, elderName: elder.name, type: 'daily',
    title: '晚间散步', detail: '慢走15分钟', date: '2026-07-29', time: '18:00', repeat: 'daily' });
  return { profile, health: father ? { ...initialHealthStats } : { heartRate: 68, heartRateStatus: 'normal', steps: 2100, stepsTarget: 4000,
    sleepHours: 8.1, sleepQuality: 'good', location: '暂无位置', batteryLevel: 0, controlScreenStatus: 'offline' },
    medications, activities, orders, reminders, hasDevices: father,
    contacts: father ? [['张大伟（长子）', '138-xxxx-8888'], ['张小静（次女）', '139-xxxx-6666']] : mother ? [['李女士（女儿）', '+65 812****67']] : [],
    advisor: father ? '李顾问' : mother ? '陈顾问' : '暂未分配' };
}
export function resolveCurrentElder(elders: BoundElder[], savedId: string | null) {
  // 保留已失效对象的选择以展示权限提示，不静默切换到另一位老人的数据。
  return elders.some(elder => elder.id === savedId) ? savedId : elders.find(elder => elder.relationshipStatus === 'active')?.id ?? null;
}
export function canViewElder(elder: BoundElder | undefined, state: ElderDataState) {
  return Boolean(elder && elder.relationshipStatus === 'active' && state === 'ready');
}
