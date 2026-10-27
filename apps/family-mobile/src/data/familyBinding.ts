import { BoundElder, ElderBindingScenario, ElderRelation } from '../types';
import { initialBoundElders } from './mockData';

// L3 本地演示：账号、档案和关系均不关联设备或套餐。刷新恢复基线。
export const mockApplicantId = 'child-current';
export interface BindingCandidate extends Omit<BoundElder, 'relation' | 'relationshipStatus'> {
  countryCode: '+65' | '+86';
  phone: string;
  maskedName: string;
}
export const bindingCandidates: BindingCandidate[] = [
  { ...initialBoundElders[0], countryCode: '+86', phone: '13800005678', maskedName: '张*康' },
  { ...initialBoundElders[1], countryCode: '+65', phone: '81230003', maskedName: '李*兰' },
  { id: 'elder-wang-jianguo', name: '王建国', maskedName: '王*国', age: 76,
    avatar: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=150&h=150&q=80',
    project: '清华园社区养老服务项目', maskedAddress: '清华园社区 · **室', countryCode: '+65', phone: '81230001' },
  { id: 'elder-lin', name: '林秀英', maskedName: '林*英', age: 73,
    avatar: initialBoundElders[0].avatar, project: '社区居家养老服务', maskedAddress: '新加坡 · **街区', countryCode: '+65', phone: '81230002' }
];
export type BindingRequestStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
export type BindingConfirmationChannel = 'elder_mobile' | 'elder_tablet';
export interface BindingRequest {
  id: string;
  applicantId: string;
  elderId: string;
  relation: ElderRelation;
  status: BindingRequestStatus;
  reminders: number;
  confirmationChannel?: BindingConfirmationChannel;
}
export interface FamilyRelationship {
  id: string;
  applicantId: string;
  elderId: string;
  relation: ElderRelation;
  status: 'active' | 'removed';
}
export interface BindingState {
  requests: BindingRequest[];
  relationships: FamilyRelationship[];
  sequence: number;
}
export type BindingAction =
  | { type: 'reset'; scenario: ElderBindingScenario }
  | { type: 'submit'; elderId: string; relation: ElderRelation; applicantId: string }
  | { type: 'resolve'; requestId: string; status: Exclude<BindingRequestStatus, 'pending'>; channel?: BindingConfirmationChannel }
  | { type: 'remind'; requestId: string };

export const bindingStatusLabels: Record<BindingRequestStatus, string> = {
  pending: '待老人确认', accepted: '绑定成功', rejected: '老人已拒绝', expired: '申请已过期', cancelled: '申请已取消'
};

export function createBindingState(scenario: ElderBindingScenario = 'bound'): BindingState {
  const relationships: FamilyRelationship[] = [
    // 另一家人的关系不妨碍当前账号申请同一老人。
    { id: 'relation-other-wang', applicantId: 'child-other', elderId: 'elder-wang-jianguo', relation: '儿子', status: 'active' },
    ...(scenario === 'no_elder' ? [] : initialBoundElders.map(elder => ({ id: 'relation-current-' + elder.id, applicantId: mockApplicantId,
      elderId: elder.id, relation: elder.relation, status: scenario === 'relationship_removed' ? 'removed' as const : 'active' as const })))
  ];
  const status = scenario === 'pending' || scenario === 'rejected' || scenario === 'expired' ? scenario : null;
  return { relationships, sequence: status ? 1 : 0, requests: status ? [{ id: 'request-1', applicantId: mockApplicantId,
    elderId: 'elder-wang-jianguo', relation: '女儿', status, reminders: 0,
    confirmationChannel: status === 'rejected' ? 'elder_mobile' : undefined }] : [] };
}

export function getBoundElders(state: BindingState, applicantId = mockApplicantId): BoundElder[] {
  return state.relationships.filter(item => item.applicantId === applicantId).flatMap(item => {
    const elder = bindingCandidates.find(candidate => candidate.id === item.elderId);
    return elder ? [{ id: elder.id, name: elder.name, age: elder.age, avatar: elder.avatar, project: elder.project,
      maskedAddress: elder.maskedAddress, relation: item.relation, relationshipStatus: item.status }] : [];
  });
}

export function familyBindingReducer(state: BindingState, action: BindingAction): BindingState {
  if (action.type === 'reset') return createBindingState(action.scenario);
  if (action.type === 'submit') {
    if (!bindingCandidates.some(elder => elder.id === action.elderId)) return state;
    const samePair = (item: { applicantId: string; elderId: string }) => item.applicantId === action.applicantId && item.elderId === action.elderId;
    if (state.relationships.some(item => samePair(item) && item.status === 'active') ||
        state.requests.some(item => samePair(item) && item.status === 'pending')) return state;
    const sequence = state.sequence + 1;
    return { ...state, sequence, requests: [...state.requests, { id: `request-${sequence}`, applicantId: action.applicantId,
      elderId: action.elderId, relation: action.relation, status: 'pending', reminders: 0 }] };
  }
  const request = state.requests.find(item => item.id === action.requestId);
  // 取消、拒绝、过期的申请不接受迟到的确认，也不能产生部分关系。
  if (!request || request.status !== 'pending') return state;
  if (action.type === 'remind') return { ...state, requests: state.requests.map(item => item.id === request.id ? { ...item, reminders: item.reminders + 1 } : item) };
  if ((action.status === 'accepted' || action.status === 'rejected') && !action.channel) return state;
  const relationships = [...state.relationships];
  if (action.status === 'accepted') {
    const index = relationships.findIndex(item => item.applicantId === request.applicantId && item.elderId === request.elderId);
    const relationship: FamilyRelationship = { id: index >= 0 ? relationships[index].id : `relation-${request.id}`,
      applicantId: request.applicantId, elderId: request.elderId, relation: request.relation, status: 'active' };
    if (index >= 0) relationships[index] = relationship;
    else relationships.push(relationship);
  }
  return { ...state, relationships, requests: state.requests.map(item => item.id === request.id ? { ...item, status: action.status,
    confirmationChannel: action.status === 'accepted' || action.status === 'rejected' ? action.channel : undefined } : item) };
}

export function lookupBindingCandidate(countryCode: '+65' | '+86', phone: string) {
  const valid = countryCode === '+65' ? /^[89]\d{7}$/.test(phone) : /^1[3-9]\d{9}$/.test(phone);
  if (!valid) return { error: countryCode === '+65' ? '请输入正确的8位新加坡手机号' : '请输入正确的11位中国大陆手机号' };
  const candidate = bindingCandidates.find(item => item.countryCode === countryCode && item.phone === phone);
  return candidate ? { candidate } : { error: '该手机号尚未注册老人账号，请老人先在手机端注册，再重新查找。' };
}
