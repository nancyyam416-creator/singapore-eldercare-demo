export type AppointmentCategoryCode = 'electric' | 'water' | 'basic';

export type AppointmentService = {
  id: string;
  name: string;
  category: AppointmentCategoryCode;
  provider: string;
  providerPhone: string;
  businessHours: string;
  serviceArea: string;
  priceRange: string;
  description: string;
  longDescription: string;
  features: string[];
};

export type PhoneAppointmentConfirmationStatus = 'pending' | 'confirmed' | 'failed' | 'no_guardian';

export type PhoneAppointmentRecord = {
  id: string;
  elder: { id: string; name: string; phone: string };
  service: { id: string; name: string; categoryName: string };
  provider: { name: string; phone: string };
  calledAt: string;
  confirmationStatus: PhoneAppointmentConfirmationStatus;
  appointmentTime: string | null;
  note: string | null;
  childNotification: { recipientIds: string[]; sentAt: string | null };
};

export const appointmentCategories = [
  { code: 'electric', name: '电力维修', order: 1 },
  { code: 'water', name: '水利维修', order: 2 },
  { code: 'basic', name: '基础维修', order: 3 },
] satisfies { code: AppointmentCategoryCode; name: string; order: number }[];

export const appointmentServices: AppointmentService[] = [
  { id: 'srv-electric-1', name: '灯具与开关检查', category: 'electric', provider: '社区安心电工服务站', providerPhone: '+65 6123 8801', businessHours: '周一至周六 08:30–18:00', serviceArea: '红山、女皇镇及周边社区', priceRange: 'S$35–90', description: '检查常用灯具、插座或开关的简单故障。', longDescription: '服务人员上门检查常用灯具、插座与开关，确认故障位置并说明处理方案；如需更换材料，将在维修前单独确认。', features: ['灯具故障检查', '开关插座检查', '维修方案说明', '材料费用先确认'] },
  { id: 'srv-electric-2', name: '家庭电路排查', category: 'electric', provider: '社区安心电工服务站', providerPhone: '+65 6123 8801', businessHours: '周一至周六 08:30–18:00', serviceArea: '红山、女皇镇及周边社区', priceRange: 'S$80–220', description: '排查跳闸、局部断电等常见家庭电路问题。', longDescription: '由专业电工上门排查跳闸、局部断电或线路异常，复杂施工与材料费用在确认方案后另行报价。', features: ['跳闸原因排查', '局部断电检查', '安全用电建议', '复杂施工另报价'] },
  { id: 'srv-water-1', name: '水龙头检修', category: 'water', provider: '安心到家水务服务站', providerPhone: '+65 6123 8802', businessHours: '每天 08:00–20:00', serviceArea: '红山、武吉美拉及周边社区', priceRange: 'S$30–80', description: '检查漏水、松动和出水异常。', longDescription: '上门检查水龙头漏水、松动和出水异常，根据现场情况完成基础检修；需要更换配件时会先说明费用。', features: ['漏水位置检查', '基础紧固处理', '出水异常排查', '配件费用先确认'] },
  { id: 'srv-water-2', name: '水管漏水检查', category: 'water', provider: '安心到家水务站', providerPhone: '+65 6123 8802', businessHours: '每天 08:00–20:00', serviceArea: '红山、武吉美拉及周边社区', priceRange: 'S$50–150', description: '检查可见水管、接口及常见渗漏问题。', longDescription: '服务人员上门检查可见水管和接口，判断常见渗漏位置；如涉及暗管或复杂施工，将提供进一步处理建议。', features: ['可见管路检查', '接口渗漏排查', '基础止漏处理', '复杂施工先确认'] },
  { id: 'srv-basic-1', name: '门锁与把手维修', category: 'basic', provider: '乐居综合维修服务站', providerPhone: '+65 6123 8803', businessHours: '周一至周六 09:00–18:00', serviceArea: '红山、女皇镇及周边社区', priceRange: 'S$40–120', description: '检查门锁、把手松动或开合不顺等问题。', longDescription: '上门检查门锁、门把手松动、异响或开合不顺等常见问题，并根据现场情况完成调整或基础维修。', features: ['门锁状态检查', '把手紧固调整', '开合问题处理', '更换配件先确认'] },
  { id: 'srv-basic-2', name: '家具小修', category: 'basic', provider: '乐居综合维修服务站', providerPhone: '+65 6123 8803', businessHours: '周一至周六 09:00–18:00', serviceArea: '红山、女皇镇及周边社区', priceRange: 'S$45–160', description: '处理桌椅松动、柜门偏移等常见小型维修。', longDescription: '处理桌椅松动、柜门偏移、抽屉开合不顺等常见小型维修，实际服务范围与材料费用由师傅现场确认。', features: ['桌椅松动处理', '柜门位置调整', '抽屉滑轨检查', '现场范围确认'] },
];

export const initialPhoneAppointmentRecords: PhoneAppointmentRecord[] = [
  { id: 'CALL-20261020-01', elder: { id: 'elder-wang', name: '王奶奶', phone: '+65 8123 4567' }, service: { id: 'srv-water-1', name: '水龙头检修', categoryName: '水利维修' }, provider: { name: '安心到家水务服务站', phone: '+65 6123 8802' }, calledAt: '2026-10-20T10:20:00+08:00', confirmationStatus: 'confirmed', appointmentTime: '2026-10-30 14:00–16:00', note: '子女已确认服务机构安排上门。', childNotification: { recipientIds: ['child-zhang-xiaoyan', 'child-zhang-jianping'], sentAt: '2026-10-20T10:20:10+08:00' } },
  { id: 'CALL-20261018-01', elder: { id: 'elder-wang', name: '王奶奶', phone: '+65 8123 4567' }, service: { id: 'srv-basic-2', name: '家具小修', categoryName: '基础维修' }, provider: { name: '乐居综合维修服务站', phone: '+65 6123 8803' }, calledAt: '2026-10-18T15:40:00+08:00', confirmationStatus: 'failed', appointmentTime: null, note: '服务机构暂未安排本次上门。', childNotification: { recipientIds: ['child-zhang-xiaoyan', 'child-zhang-jianping'], sentAt: '2026-10-18T15:40:10+08:00' } },
];

export const appointmentCategoryName = (code: AppointmentCategoryCode) => appointmentCategories.find(item => item.code === code)?.name ?? code;
