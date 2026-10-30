export type AppointmentCategoryCode = 'electric' | 'water' | 'basic';

export type AppointmentService = {
  id: string;
  name: string;
  category: AppointmentCategoryCode;
  coverageMode: 'all' | 'specified';
  coverageCommunityIds: string[];
  provider: string;
  providerPhone: string;
  businessHours: string;
  serviceArea: string;
  priceRange: string;
  description: string;
  serviceContent: string;
  precautions: string[];
  coverImage: string;
  detailImages: string[];
};

export type ServiceAssistanceStatus = 'pending' | 'handled';

export type ServiceAssistanceRecord = {
  id: string;
  elder: { id: string; name: string; phone: string };
  service: { id: string; name: string; categoryName: string };
  provider: { name: string; phone: string };
  requestedAt: string;
  status: ServiceAssistanceStatus;
  recipientIds: string[];
  handledBy: string | null;
  handledAt: string | null;
  resultSummary: string | null;
  serviceStatus: 'not_completed' | 'completed';
  completedAt: string | null;
  review: { rating: number; text: string; submittedAt: string; edited: boolean } | null;
};

export const appointmentCategories = serviceCatalog.categories as { code: AppointmentCategoryCode; name: string; order: number }[];
export const appointmentCommunities = serviceCatalog.communities;
export const currentElderProfile = { id: 'elder-wang', communityId: 'COM-001' } as const;
const communityNameById = new Map(appointmentCommunities.map(item => [item.id, item.name]));
export const appointmentServices = serviceCatalog.services.map(service => ({
  ...service,
  serviceArea: service.coverageMode === 'all'
    ? '全部社区'
    : service.coverageCommunityIds.map(id => communityNameById.get(id) ?? '社区未设置').join('、'),
})) as AppointmentService[];

export const initialServiceAssistanceRecords: ServiceAssistanceRecord[] = [
  { id: 'HELP-20261029-01', elder: { id: 'elder-wang', name: '王奶奶', phone: '+65 8123 4567' }, service: { id: 'srv-water-1', name: '水龙头检修', categoryName: '水利维修' }, provider: { name: '安心到家水务服务站', phone: '+65 6123 8802' }, requestedAt: '2026-10-29T16:20:00+08:00', status: 'pending', recipientIds: ['child-zhang-xiaoyan', 'child-zhang-jianping'], handledBy: null, handledAt: null, resultSummary: null, serviceStatus: 'not_completed', completedAt: null, review: null },
  { id: 'HELP-20261027-01', elder: { id: 'elder-wang', name: '王奶奶', phone: '+65 8123 4567' }, service: { id: 'srv-basic-2', name: '家具小修', categoryName: '基础维修' }, provider: { name: '乐居综合维修服务站', phone: '+65 6123 8803' }, requestedAt: '2026-10-27T10:10:00+08:00', status: 'handled', recipientIds: ['child-zhang-xiaoyan', 'child-zhang-jianping'], handledBy: '张晓燕', handledAt: '2026-10-27T10:35:00+08:00', resultSummary: '已电话咨询服务商，约定 10 月 31 日上午再上门查看。', serviceStatus: 'not_completed', completedAt: null, review: null },
];

export const appointmentCategoryName = (code: AppointmentCategoryCode) => appointmentCategories.find(item => item.code === code)?.name ?? code;
import serviceCatalog from '../../产品理解/90 原型与Mock素材/mock/统一服务目录.json';

