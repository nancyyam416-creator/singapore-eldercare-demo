import serviceCatalog from '../../产品理解/90 原型与Mock素材/mock/统一服务目录.json';

export type AppointmentCategoryCode = 'electric' | 'water' | 'basic';

export type AppointmentServiceItem = {
  id: string;
  legacyServiceId?: string;
  name: string;
  content: string;
  priceText: string;
};

export type AppointmentService = {
  id: string;
  name: string;
  category?: AppointmentCategoryCode | '';
  categoryId?: AppointmentCategoryCode | null;
  legacyServiceIds: string[];
  coverageMode: 'all' | 'specified';
  coverageCommunityIds: string[];
  provider: string;
  providerPhone: string;
  businessHours: string;
  serviceArea: string;
  priceRange: string;
  description: string;
  serviceContent: string;
  serviceItems: AppointmentServiceItem[];
  precautions: string[];
  coverImage: string;
  detailImages: string[];
};

export type ServiceAssistanceStatus = 'pending' | 'handling' | 'handled' | 'cancelled' | 'expired';

export type ServiceAssistanceRecord = {
  id: string;
  elder: { id: string; name: string; phone: string };
  service: { id: string; name: string; categoryName: string };
  provider: { name: string; phone: string };
  requestReason: string;
  requestedAt: string;
  status: ServiceAssistanceStatus;
  expiredAt?: string | null;
  recipientIds: string[];
  handledBy: string | null;
  handledAt: string | null;
  resultSummary: string | null;
  familyContactStatus?: 'contacting' | 'appointment_confirmed' | 'not_appointed' | null;
  familyContactBy?: { type: string; id?: string | null; name?: string | null } | null;
  familyContactResult?: 'appointment_confirmed' | 'not_appointed' | null;
  familyContactResultAt?: string | null;
  appointmentAt?: string;
  feeText?: string;
  lastFamilyContactBy?: { type: string; id?: string | null; name?: string | null } | null;
  lastFamilyContactAt?: string | null;
  familyHandlingStatus?: 'not_completed' | 'completed';
  handlingCompletedAt?: string | null;
  handlingCompletedBy?: string | null;
  /** 迁移期旧字段，同样只表示家人协助工单完成。 */
  serviceStatus: 'not_completed' | 'completed';
  completedAt: string | null;
  completedBy?: string | null;
  reminderTimes?: string[];
  lastRemindedAt?: string;
  review: { rating: number; text: string; elderId?: string; submittedAt: string; edited: boolean } | null;
  workflowStage?: 'contact_pending_confirmation' | 'appointment_confirmed' | 'family_help_pending' | 'family_help_handling' | 'family_help_handled' | 'family_help_completed' | 'cancelled' | 'expired';
  contactStartedAt?: string;
  appointmentOutcome?: 'appointment_confirmed' | 'family_help_requested' | null;
  appointmentOutcomeAt?: string | null;
  familyHelpRequestedAt?: string | null;
  familyHelpInquiry?: { askedAt: string; askedBy: { type: string; id?: string | null; name?: string | null } };
  workflowEvents?: Array<{ id: string; type: string; createdAt: string; actorType: string; actorId?: string | null; actorName?: string | null; payload?: Record<string, unknown> }>;
};

export const appointmentCategories = serviceCatalog.categories as { code: AppointmentCategoryCode; name: string; order: number }[];
export const appointmentCommunities = serviceCatalog.communities;
export const currentElderProfile = { id: 'elder-wang-jianguo', communityId: 'COM-001' } as const;
const communityNameById = new Map(appointmentCommunities.map(item => [item.id, item.name]));
export const appointmentServices = serviceCatalog.services.map(service => ({
  ...service,
  legacyServiceIds: service.legacyServiceIds ?? [],
  serviceItems: service.serviceItems?.length ? service.serviceItems : [{
    id: `${service.id}-item-1`,
    legacyServiceId: service.id,
    name: service.name,
    content: service.serviceContent,
    priceText: service.priceRange,
  }],
  serviceArea: service.coverageMode === 'all'
    ? '全部社区'
    : service.coverageCommunityIds.map(id => communityNameById.get(id) ?? '社区未设置').join('、'),
})) as AppointmentService[];

export const initialServiceAssistanceRecords: ServiceAssistanceRecord[] = [
  { id: 'HELP-20261029-01', elder: { id: 'elder-wang-jianguo', name: '王建国', phone: '+65 8603 2918' }, service: { id: 'srv-water-1', name: '水龙头检修', categoryName: '水利维修' }, provider: { name: '安心到家水务服务站', phone: '+65 6123 8802' }, requestReason: '请家人协助联系服务商', requestedAt: '2026-10-29T16:20:00+08:00', status: 'pending', recipientIds: ['child-zhang-xiaoyan', 'child-zhang-jianping'], handledBy: null, handledAt: null, resultSummary: null, serviceStatus: 'not_completed', completedAt: null, review: null },
  { id: 'HELP-20261027-01', elder: { id: 'elder-wang-jianguo', name: '王建国', phone: '+65 8603 2918' }, service: { id: 'srv-basic-2', name: '家具小修', categoryName: '基础维修' }, provider: { name: '乐居综合维修服务站', phone: '+65 6123 8803' }, requestReason: '请家人协助联系服务商', requestedAt: '2026-10-27T10:10:00+08:00', status: 'handled', recipientIds: ['child-zhang-xiaoyan', 'child-zhang-jianping'], handledBy: '张晓燕', handledAt: '2026-10-27T10:35:00+08:00', resultSummary: '已电话咨询服务商，约定 10 月 31 日上午再上门查看。', serviceStatus: 'not_completed', completedAt: null, review: null },
];

export const appointmentCategoryName = (code?: AppointmentCategoryCode | '') => code ? appointmentCategories.find(item => item.code === code)?.name ?? code : '';

const appointmentServiceAliases = new Map(appointmentServices.flatMap(service => (
  service.legacyServiceIds.map(legacyId => [legacyId, service.id] as const)
)));

export const resolveAppointmentServiceId = (serviceId: string) => appointmentServiceAliases.get(serviceId) ?? serviceId;
export const getAppointmentServiceById = (serviceId: string) => appointmentServices.find(service => service.id === resolveAppointmentServiceId(serviceId));

