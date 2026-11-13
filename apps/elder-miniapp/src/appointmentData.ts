import serviceCatalog from '../../产品理解/90 原型与Mock素材/mock/统一服务目录.json';

export type AppointmentCategoryCode = string;

export type AppointmentCategory = {
  id: string;
  code: AppointmentCategoryCode;
  name: string;
  description: string;
  displayOrder: number;
  status: 'enabled' | 'disabled';
};

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
  categoryCode?: AppointmentCategoryCode;
  status: 'enabled' | 'disabled';
  displayOrder: number;
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

export const appointmentCategories = serviceCatalog.categories
  .map(category => ({
    ...category,
    description: category.description ?? '',
    displayOrder: Number(category.displayOrder),
    status: category.status === 'disabled' ? 'disabled' as const : 'enabled' as const,
  }))
  .sort((first, second) => first.displayOrder - second.displayOrder || first.code.localeCompare(second.code)) as AppointmentCategory[];
export const appointmentCategorySettings = serviceCatalog.categorySettings as { enabled: boolean; updatedAt: string };
export const appointmentCommunities = serviceCatalog.communities;
export const currentElderProfile = { id: 'elder-wang-jianguo', communityId: 'COM-001' } as const;
const communityNameById = new Map(appointmentCommunities.map(item => [item.id, item.name]));
const communityIdByProjectId = new Map(appointmentCommunities.map(item => [item.projectId, item.id]));
export const appointmentServices = serviceCatalog.services.map(service => ({
  ...service,
  status: service.status === 'disabled' ? 'disabled' : 'enabled',
  displayOrder: Number(service.displayOrder || 999),
  categoryCode: service.categoryId || service.category || '',
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
})).sort((first, second) => first.displayOrder - second.displayOrder || first.name.localeCompare(second.name)) as AppointmentService[];

export type AppointmentServiceDirectory = {
  categoryEnabled: boolean;
  categories: AppointmentCategory[];
  groups: Array<AppointmentCategory & { services: AppointmentService[] }>;
  services: AppointmentService[];
};

export const resolveAppointmentServiceDirectory = (options: {
  categoryEnabled?: boolean;
  categories?: AppointmentCategory[];
  services?: AppointmentService[];
} = {}): AppointmentServiceDirectory => {
  const categoryEnabled = options.categoryEnabled ?? appointmentCategorySettings.enabled;
  const availableServices = (options.services ?? appointmentServices)
    .filter(service => service.status === 'enabled')
    .filter(service => service.coverageMode === 'all' || service.coverageCommunityIds.includes(currentElderProfile.communityId))
    .slice()
    .sort((first, second) => first.displayOrder - second.displayOrder || first.name.localeCompare(second.name));
  if (!categoryEnabled) return { categoryEnabled, categories: [], groups: [], services: availableServices };
  const groups = (options.categories ?? appointmentCategories)
    .filter(category => category.status === 'enabled')
    .map(category => ({
      ...category,
      services: availableServices.filter(service => service.categoryId === category.code || service.categoryCode === category.code),
    }))
    .filter(category => category.services.length > 0);
  return {
    categoryEnabled,
    categories: groups.map(({ services: _services, ...category }) => category),
    groups,
    services: groups.flatMap(group => group.services),
  };
};

export type AppointmentServiceDirectoryContract = {
  categorySettings: { enabled: boolean; updatedAt?: string };
  categories: AppointmentCategory[];
  services: AppointmentService[];
};

export const normalizeAppointmentServiceDirectoryContract = (contract: {
  categorySettings?: { enabled?: boolean; updatedAt?: string };
  categories?: AppointmentCategory[];
  services?: Array<Omit<Partial<AppointmentService>, 'precautions'> & {
    id: string;
    precautions?: string | string[];
  }>;
}): AppointmentServiceDirectoryContract => {
  const staticServiceById = new Map(appointmentServices.map(service => [service.id, service]));
  return {
    categorySettings: {
      enabled: Boolean(contract.categorySettings?.enabled),
      updatedAt: contract.categorySettings?.updatedAt ?? '',
    },
    categories: (contract.categories ?? appointmentCategories)
      .map((category, index) => ({
        ...category,
        description: category.description ?? '',
        displayOrder: Number(category.displayOrder ?? index + 1),
        status: category.status === 'disabled' ? 'disabled' as const : 'enabled' as const,
      }))
      .sort((first, second) => first.displayOrder - second.displayOrder || first.code.localeCompare(second.code)),
    services: (contract.services ?? appointmentServices)
      .map((service, index) => {
        const fallback = staticServiceById.get(service.id) ?? appointmentServices[index] ?? appointmentServices[0];
        const categoryCode = service.categoryId || service.categoryCode || '';
        return {
          ...fallback,
          ...service,
          categoryId: categoryCode || null,
          categoryCode,
          status: service.status === 'disabled' ? 'disabled' as const : 'enabled' as const,
          displayOrder: Number(service.displayOrder ?? fallback.displayOrder ?? index + 1),
          legacyServiceIds: service.legacyServiceIds ?? fallback.legacyServiceIds ?? [],
          coverageCommunityIds: (service.coverageCommunityIds ?? fallback.coverageCommunityIds ?? [])
            .map(id => communityIdByProjectId.get(id) ?? id),
          serviceItems: service.serviceItems?.length ? service.serviceItems : fallback.serviceItems,
          precautions: Array.isArray(service.precautions)
            ? service.precautions
            : typeof service.precautions === 'string'
              ? service.precautions.split('\n').filter(Boolean)
              : fallback.precautions,
          coverImage: service.coverImage || fallback.coverImage,
          detailImages: service.detailImages?.length ? service.detailImages : fallback.detailImages,
        } as AppointmentService;
      })
      .sort((first, second) => first.displayOrder - second.displayOrder || first.name.localeCompare(second.name)),
  };
};

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

