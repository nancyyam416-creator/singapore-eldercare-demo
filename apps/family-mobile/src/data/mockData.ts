/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Medication, HealthStats, ServiceProduct, ActivityLog, Order, FamilyConversation, FamilyMessage, PublishedPhotoBatch, BoundElder } from '../types';

export const initialParentProfile = {
  name: "张健康",
  gender: "男",
  age: 78,
  conditions: "高血压、II型糖尿病、轻度膝关节退化",
  avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
  contact: "138-xxxx-5678",
  address: "上海市静安区万航渡路888号302室"
};

export const initialChildResidenceAddress = '新加坡中区乌节路 88 号';

export const initialBoundElders: BoundElder[] = [
  {
    id: 'elder-father',
    name: '张健康',
    age: 78,
    avatar: initialParentProfile.avatar,
    relation: '女儿',
    project: '孝心关怀中心 · 静安社区',
    maskedAddress: '上海市静安区万航渡路***号',
    relationshipStatus: 'active'
  }
];

export const mockBindingCandidate: Omit<BoundElder, 'relation' | 'relationshipStatus'> = {
  id: 'elder-mother-binding',
  name: '李桂芳',
  age: 75,
  avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=150&h=150&q=80',
  project: '孝心关怀中心 · 长宁社区',
  maskedAddress: '上海市长宁区江苏路***号'
};

export const initialFamilyConversations: FamilyConversation[] = [
  {
    id: 'conversation-father',
    elderId: 'elder-father',
    elderName: '爸爸',
    relationLabel: '父亲',
    avatar: initialParentProfile.avatar,
    relationshipStatus: 'active'
  },
  {
    id: 'conversation-mother',
    elderId: 'elder-mother',
    elderName: '妈妈',
    relationLabel: '母亲',
    avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=150&h=150&q=80',
    relationshipStatus: 'active'
  }
];

export const initialFamilyMessages: FamilyMessage[] = [
  {
    id: 'family-text-elder-1',
    conversationId: 'conversation-father',
    sender: 'elder',
    senderName: '爸爸',
    text: '知道啦，你也要注意休息。',
    sentAtUtc: '2026-07-28T08:55:00+08:00',
    status: 'delivered',
    type: 'text'
  },
  {
    id: 'family-voice-elder-1',
    conversationId: 'conversation-father',
    sender: 'elder',
    senderName: '爸爸',
    text: '我今天去听讲座啦，挺好的。',
    sentAtUtc: '2026-07-28T08:42:00+08:00',
    status: 'delivered',
    type: 'voice',
    durationSeconds: 18
  },
  {
    id: 'family-text-child-1',
    conversationId: 'conversation-father',
    sender: 'child',
    senderName: '我',
    text: '爸，今天外面有点热，出门记得带水。',
    sentAtUtc: '2026-07-28T08:30:00+08:00',
    status: 'viewed',
    type: 'text'
  },
  {
    id: 'weather-care-text',
    conversationId: 'conversation-father',
    sender: 'elder',
    senderName: '爸爸',
    text: '今天有阵雨，出门记得带伞，路上慢一点。',
    sentAtUtc: '2026-07-27T08:42:00+08:00',
    status: 'viewed',
    type: 'text'
  },
  {
    id: 'family-voice-child-1',
    conversationId: 'conversation-father',
    sender: 'child',
    senderName: '我',
    sentAtUtc: '2026-07-27T08:35:00+08:00',
    status: 'listened',
    type: 'voice',
    durationSeconds: 9
  },
  {
    id: 'family-text-mother-1',
    conversationId: 'conversation-mother',
    sender: 'elder',
    senderName: '妈妈',
    text: '晚上吃过饭了，你们不用惦记。',
    sentAtUtc: '2026-07-28T07:50:00+08:00',
    status: 'delivered',
    type: 'text'
  }
];

const createFamilyPhoto = (start: string, end: string, title: string, subtitle: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 420 420"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${start}"/><stop offset="1" stop-color="${end}"/></linearGradient></defs><rect width="420" height="420" rx="36" fill="url(#g)"/><circle cx="210" cy="154" r="68" fill="white" fill-opacity=".2"/><path d="M132 292c18-62 138-62 156 0" fill="white" fill-opacity=".2"/><text x="210" y="344" text-anchor="middle" fill="white" font-family="sans-serif" font-size="30" font-weight="700">${title}</text><text x="210" y="378" text-anchor="middle" fill="white" fill-opacity=".78" font-family="sans-serif" font-size="18">${subtitle}</text></svg>`)}`;

export const initialPublishedPhotoBatches: PublishedPhotoBatch[] = [
  {
    id: 'photo-batch-family-dinner',
    elderName: '爸爸',
    category: '家庭聚会',
    message: '周末大家一起吃饭，拍了几张照片给你看看。',
    publishedAt: '2026-07-26T12:18:00+08:00',
    feedback: 'liked',
    items: [
      ...[
        ['family-1', '全家合影', '#FB923C', '#E11D48'],
        ['family-2', '一起吃饭', '#F59E0B', '#EA580C'],
        ['family-4', '开心合照', '#F43F5E', '#7C3AED']
      ].map(([id, title, start, end]) => ({ id, name: `${title}.jpg`, type: 'photo' as const, previewUrl: createFamilyPhoto(start, end, title, '家庭聚会') })),
      { id: 'family-video-1', name: '饭后散步.mp4', type: 'video' as const, previewUrl: createFamilyPhoto('#F97316', '#BE123C', '饭后散步', '视频 · 00:18'), videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', durationSeconds: 18 }
    ]
  },
  {
    id: 'photo-batch-travel',
    elderName: '爸爸',
    category: '旅行风景',
    message: '这是上周去海边拍的风景。',
    publishedAt: '2026-07-23T16:35:00+08:00',
    feedback: 'viewed',
    items: [
      ['travel-1', '海边日落', '#38BDF8', '#4F46E5'],
      ['travel-2', '山间步道', '#34D399', '#0F766E'],
      ['travel-3', '城市夜景', '#818CF8', '#312E81']
    ].map(([id, title, start, end]) => ({ id, name: `${title}.jpg`, type: 'photo' as const, previewUrl: createFamilyPhoto(start, end, title, '旅行风景') }))
  },
  {
    id: 'photo-batch-growth',
    elderName: '爸爸',
    category: '孩子成长',
    message: '孩子参加学校活动的照片。',
    publishedAt: '2026-07-18T10:06:00+08:00',
    feedback: 'published',
    items: [
      ['growth-1', '校园活动', '#60A5FA', '#7C3AED'],
      ['growth-2', '获奖合影', '#A78BFA', '#DB2777']
    ].map(([id, title, start, end]) => ({ id, name: `${title}.jpg`, type: 'photo' as const, previewUrl: createFamilyPhoto(start, end, title, '孩子成长') }))
  }
];

export const initialMedications: Medication[] = [
  {
    id: "med-1",
    name: "苯磺酸氨氯地平片 (降压药)",
    dosage: "5mg / 1片",
    timeSlot: "morning",
    timeStr: "08:00",
    status: "taken",
    takenTime: "08:12",
    note: "饭后服用，温水送服"
  },
  {
    id: "med-2",
    name: "盐酸二甲双胍缓释片 (降糖药)",
    dosage: "0.5g / 2片",
    timeSlot: "noon",
    timeStr: "12:30",
    status: "taken",
    takenTime: "12:45",
    note: "随餐服用"
  },
  {
    id: "med-3",
    name: "阿司匹林肠溶片 (抗血小板)",
    dosage: "100mg / 1片",
    timeSlot: "evening",
    timeStr: "19:00",
    status: "untaken",
    note: "晚餐后或睡前服用，忌空腹"
  }
];

export const initialHealthStats: HealthStats = {
  heartRate: 72,
  heartRateStatus: "normal",
  steps: 4215,
  stepsTarget: 6000,
  sleepHours: 7.2,
  sleepQuality: "good",
  location: "客厅",
  batteryLevel: 85
};

export const initialActivities: ActivityLog[] = [
  {
    id: "act-1",
    time: "07:30",
    content: "07:30 卧室设备结束持续在场状态，随后客厅检测到活动",
    type: "info"
  },
  {
    id: "act-2",
    time: "08:00",
    content: "在中控屏确认：早餐前空腹血糖 6.2 mmol/L (正常)",
    type: "health"
  },
  {
    id: "act-3",
    time: "08:12",
    content: "长辈取出药盒，中控屏播报：早上降压药已服用 ✅",
    type: "medication"
  },
  {
    id: "act-4",
    time: "09:30",
    content: "手环监测到长辈在小区散步30分钟，心率 95 次/分",
    type: "info"
  },
  {
    id: "act-5",
    time: "12:45",
    content: "中控屏感应到餐后用药：二甲双胍已服用 ✅",
    type: "medication"
  },
  {
    id: "act-6",
    time: "14:00",
    content: "14:00 卧室设备检测到人体活动",
    type: "info"
  },
  {
    id: "act-7",
    time: "15:30",
    content: "手环同步今日累计步数 4215 步",
    type: "info"
  },
  {
    id: "act-8",
    time: "17:15",
    content: "17:15 厨房设备检测到人体活动；燃气报警器在线",
    type: "info"
  }
];

export const serviceCatalog: ServiceProduct[] = [
  {
    id: "srv-care-1",
    name: "专业长辈上门助浴服务",
    category: "care",
    price: 158,
    unit: "次",
    description: "专业护理员双人上门，专为行动不便或关节退化的长辈提供安全舒缓的洗浴协助。含安全检查、血压测量及皮肤状况记录。",
    longDescription: "本服务专门针对高龄、中风后遗症、关节炎、骨折恢复期或轻度失能、失智等洗浴有困难或安全隐患的长辈。由两名经过专业急救与护理培训的持证护理员上门服务。包含服务前的基础生命体征测量、浴室安全排查、专业助浴设备搭建、洗头/擦浴/淋浴/泡浴（视老人身体情况而定）、浴后指甲修剪、润肤按摩等。为长辈的个人卫生提供尊严和安全的双重保障，避免滑倒等严重家庭意外。",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&h=400&q=80",
    rating: 4.9,
    sales: 1240,
    features: ["持证专业护理师", "双人安全防护", "赠送浴室防滑垫", "赠皮肤评估报告"]
  },
  {
    id: "srv-care-2",
    name: "温情陪伴/棋牌聊天/户外散步",
    category: "care",
    price: 198,
    unit: "半天 (4小时)",
    description: "温暖耐心的养老护理员上门，陪长辈聊天看报、读信、下棋、散步晒太阳，提供精神慰藉与安全陪护。",
    longDescription: "长辈长期在家，缺乏精神沟通容易产生抑郁或认知退化。我们的陪伴照护员均通过心理疏导与老年沟通技巧认证，秉承温情、爱心与耐心。服务内容包括：陪长辈聊天倾听、看报读新闻、打牌下棋娱乐、安全陪伴在小区及附近公园散步晒太阳，进行轻度的手脑益智活动。全程关注长辈的精神与情绪变化，让远在职场的子女彻底放心。",
    image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=600&h=400&q=80",
    rating: 4.8,
    sales: 850,
    features: ["资深温情陪护员", "精神慰藉与益智", "安全散步陪同", "生成情绪与精神反馈"]
  },
  {
    id: "srv-food-1",
    name: "长辈专属营养餐制作/配餐上门",
    category: "food",
    price: 68,
    unit: "餐",
    description: "由金牌健康烹饪师上门，根据长辈的慢性病（高血压、高血糖等）量身定制三菜一汤低盐低脂健康餐，并打扫厨房。",
    longDescription: "长辈单独在家，做饭成了大难题，往往省吃俭用，导致营养不良或血糖波动。我们的配餐/做饭服务，专门配置了持有“公共营养师”或“长辈健康配餐”证书的师傅。服务内容包括：可协助代买新鲜食材（实报实销）、上门为长辈现做健康温热的餐食。餐食严格遵循“低盐、低油、低糖、质地软烂易消化”的原则。服务结束后，师傅会彻底清理厨房台面及餐具，倒垃圾，确保长辈吃得开心、住得干净。",
    image: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=600&h=400&q=80",
    rating: 4.7,
    sales: 2410,
    features: ["持证营养膳食师", "低糖低脂低盐定制", "代买新鲜食材", "包含厨房餐后清洁"]
  },
  {
    id: "srv-med-1",
    name: "三甲名医远程视频问诊+处方代配",
    category: "medical",
    price: 99,
    unit: "次",
    description: "协助长辈在家庭中控屏/手机上发起与三甲大医院医生的1对1视频问诊，协助解读体检报告、慢病调药及电子处方配药送药上门。",
    longDescription: "免去长辈去医院排队折腾、交叉感染的烦恼。本服务安排专属健康管家指导长辈（或子女在APP协助），在中控屏端发起与知名三甲医院专科医生的视频面对面问诊。医生可在线解答长辈的各种身体不适、解读最新检验/体检报告、指导高血压/糖尿病等慢性病的用药调整。问诊结束后，医生可开具正规电子处方，我们提供全国处方药品代配、快递冷链送药到家的一站式服务。",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&h=400&q=80",
    rating: 4.9,
    sales: 1890,
    features: ["名牌三甲医院专家", "面对面视频高清流畅", "代解读体检报告", "代开处方送药到家"]
  },
  {
    id: "srv-med-2",
    name: "持证专业护士上门换药/抽血/导尿",
    category: "medical",
    price: 180,
    unit: "次",
    description: "专业持证注册护士上门，提供术后伤口换药、留置胃管/尿管更换、静脉采血送检等专业临床护理服务。",
    longDescription: "对于术后出院或瘫痪在床的长辈，频繁去医院进行基础护理极其不便。我们的护理团队由具备执业资格的在职或资深退休护士组成。严格执行三查七对和无菌操作规范。服务范围包含：外科术后切口/压疮/褥疮的清洁换药、留置尿管与胃管的定期更换和冲洗、上门静脉抽血并协助代送正规化验所检测。让长辈在家就能享受到医院同等标准的临床技术护理，避免家属非专业操作带来的二次伤害和感染。",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&h=400&q=80",
    rating: 4.9,
    sales: 540,
    features: ["医院执业护士上门", "全套无菌器械用品", "临床标准无菌操作", "化验报告直达APP"]
  },
  {
    id: "srv-safe-1",
    name: "卫生间高强度防摔安全扶手安装",
    category: "safety",
    price: 350,
    unit: "套 (含2个扶手+上门安装)",
    description: "专业适老化改造工程师上门评估，在马桶旁、淋浴区精准打孔安装2个航天级防滑不锈钢承重拉手（单个承重200kg）。",
    longDescription: "据统计，超过50%的老年人跌倒发生在潮湿的卫生间，容易导致股骨头骨折或脑血管意外。我们的适老化改造工程师提供上门防跌倒评估，精选通过国家质检的高强度304不锈钢，外覆抗菌防滑ABS材质的工程扶手。工程师会根据长辈的身高、关节屈伸程度，在浴室和马桶两侧测算黄金安装位置，采用专业澎涨螺栓无尘打孔固定。单个扶手可瞬间承受200公斤垂直拉力，为起身上厕所、洗澡起立提供坚实的安全抓手。",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&h=400&q=80",
    rating: 4.9,
    sales: 1120,
    features: ["防滑抗菌ABS握把", "304不锈钢安全承重芯", "适老高度专业定位", "防碎瓷砖精细钻孔"]
  },
  {
    id: "srv-safe-2",
    name: "一键式紧急无线SOS呼救呼叫器",
    category: "safety",
    price: 580,
    unit: "套 (含设备+1年24小时专座服务)",
    description: "包含1台无线网关、2个挂墙大按钮、1个挂脖随身SOS按钮。按下瞬间直达中控屏、子女手机和24小时人工呼叫中心。",
    longDescription: "长辈万一在家滑倒、突发心梗，往往无法挣扎去够手机，黄金求救时间转瞬即逝。本紧急呼救器方案采用超低功耗Zigbee技术，信号穿墙能力强。挂脖按钮仅重15g，IP67防水，洗澡亦可佩戴；另提供床头、洗手间挂墙大按钮。长辈在发生紧急状况时仅需轻轻一按，中控屏将瞬间拉响高分贝警报、家属手机App收到震动电话弹窗、同时全天候24小时养老紧急救助中心席位会立刻介入，协助呼叫120急救，挽救生命。",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&h=400&q=80",
    rating: 4.8,
    sales: 920,
    features: ["IP67全身防浸水佩戴", "一键极速拨号通知", "双网断电备份传输", "1年24H客服紧急求救呼叫"]
  }
];

export const initialOrders: Order[] = [
  {
    id: "ord-1",
    serviceId: "srv-care-1",
    serviceName: "专业长辈上门助浴服务",
    price: 158,
    serviceDate: "2026-07-03",
    serviceTime: "14:00-16:00",
    parentName: "张健康",
    parentAddress: "上海市静安区万航渡路888号302室",
    status: "paid",
    statusLogs: [
      { time: "2026-07-01 10:20", text: "订单创建成功，子女已在线支付" },
      { time: "2026-07-01 10:21", text: "客服已确认款项，正在匹配专业助浴护理师" }
    ],
    orderTime: "2026-07-01 10:20:00",
    paymentMethod: "微信支付"
  }
];
