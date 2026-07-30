import React, { useState, useEffect, useRef } from "react";
import TabletSimulator from "./components/TabletSimulator";
import ControlCenterHome from "./components/ControlCenterHome";
import EmergencyModal, { type EmergencyAcceptanceScenario } from "./components/EmergencyModal";
import SmartAssistantModal from "./components/SmartAssistantModal";
import MedicationCelebration from "./components/MedicationCelebration";
import HomeReminderAlert from "./components/HomeReminderAlert";
import ContactsPage from "./components/ContactsCommunicationPage";
import FamilyAlbumPage from "./components/FamilyAlbumPage";
import FamilyMessageBoxPage from "./components/FamilyMessageBoxPage";
import SchedulePage from "./components/SchedulePage";
import TodayOverviewPage from "./components/TodayOverviewPage";
import MoreFunctionsDrawer from "./components/MoreFunctionsDrawer";
import CommunityActivitiesPage from "./components/CommunityActivitiesPage";
import SecurityInformationPage from "./components/SecurityInformationPage";
import SpecialServicesPage from "./components/SpecialServicesPage";
import ActivationFlow from "./components/ActivationFlow";
import InteractionAcceptanceConsole, {
  type AcceptanceAlbumScenario,
  type AcceptanceCareMode,
  type AcceptanceCareRegion,
  type AcceptanceCareScenario,
  type AcceptanceCareTime,
  type AcceptanceDisasterScenario,
  type AcceptanceHomeCommand,
  type AcceptanceHeartScenario,
  type AcceptanceMessageScenario,
  type AcceptanceRecordScenario,
  type AcceptanceReminderScenario,
  type AcceptanceTaskContentScenario,
  type AcceptanceTaskScenario,
} from "./components/InteractionAcceptanceConsole";
import {
  familyWeatherMockApi,
  type FamilyWeatherMockScenario,
  type GenerateWeatherCareInput,
  type SendWeatherCareInput,
} from "./weather/familyWeather";
import { MedicationReminder, HealthTelemetry, IoTSensor, FamilyPhoto, FamilyMessage, CommunityActivity, AntiScamTip, ChatMessage, FulfillmentRecord, SpecialServiceBooking } from "./types";
import "./control-center.css";

const createInitialFulfillmentRecords = (): FulfillmentRecord[] => {
  const now = new Date();
  const morningMedicine = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 14);
  const yesterdayMessage = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 20, 32);
  return [
    { id: "initial-medicine", kind: "medication", title: "早上药已确认服用", occurredAt: morningMedicine.toISOString() },
    { id: "initial-message", kind: "message", title: "收听了女儿语音留言", occurredAt: yesterdayMessage.toISOString() },
  ];
};

const SAFETY_READ_STORAGE_KEY = "u2g-safety-read-ids-v1";
const SERVICE_BOOKINGS_STORAGE_KEY = "u2g-special-service-bookings-v1";

const readStoredSafetyIds = () => {
  try {
    const stored = window.localStorage.getItem(SAFETY_READ_STORAGE_KEY);
    return stored ? JSON.parse(stored) as string[] : [];
  } catch {
    return [];
  }
};

const readStoredServiceBookings = () => {
  try {
    const stored = window.localStorage.getItem(SERVICE_BOOKINGS_STORAGE_KEY);
    return stored ? JSON.parse(stored) as SpecialServiceBooking[] : [];
  } catch {
    return [];
  }
};

const createDefaultReminders = (): MedicationReminder[] => [
  {
    id: "med-1",
    time: "08:00",
    name: "复方降压片 + 维生素D片",
    dosage: "降压药1片，维生素D1片 (温水送服)",
    status: "completed",
    takenAt: "08:15",
  },
  {
    id: "med-2",
    time: "13:00",
    name: "阿司匹林肠溶片 (保护心脏)",
    dosage: "1片 (饭后半小时服用)",
    status: "pending",
  },
  {
    id: "med-3",
    time: "19:30",
    name: "阿托伐他汀钙片 + 血脂平胶囊",
    dosage: "他汀1片，血脂平2粒 (睡前服用)",
    status: "pending",
  },
  {
    id: "schedule-self-walk",
    time: "17:00",
    name: "傍晚散步",
    dosage: "天气合适时在楼下慢走20分钟",
    status: "pending",
    category: "schedule",
    ctaTitle: "该去散步啦",
  },
];

const createDefaultMessages = (): FamilyMessage[] => [
  {
    id: "msg-photo-snowman",
    sender: "女儿小敏",
    avatar: "https://picsum.photos/seed/xiaomin/120/120",
    type: "photo",
    content: "爸，这是昨天下雪拍的照片",
    photoUrl: "/assets/snowman-photo-message.jpg",
    duration: 7,
    timestamp: "刚刚",
    played: false,
  },
  {
    id: "msg-voice-3",
    sender: "女儿小敏",
    avatar: "https://picsum.photos/seed/xiaomin/120/120",
    type: "voice",
    content: "爸，我晚一点再给您打电话。",
    duration: 6,
    timestamp: "2分钟前",
    played: false,
  },
  {
    id: "msg-voice-2",
    sender: "女儿小敏",
    avatar: "https://picsum.photos/seed/xiaomin/120/120",
    type: "voice",
    content: "冰箱里有切好的水果，记得吃一点。",
    duration: 6,
    timestamp: "5分钟前",
    played: false,
  },
  {
    id: "msg-1",
    sender: "女儿小敏",
    avatar: "https://picsum.photos/seed/xiaomin/120/120",
    type: "voice",
    content: "爸，今天下午有冷空气降温，记得多加一件外套哦。周六我煲了黑鱼汤带杰杰去看您！",
    duration: 10,
    timestamp: "10分钟前",
    played: false,
  },
  {
    id: "msg-text-1",
    sender: "儿子小刚",
    avatar: "https://picsum.photos/seed/xiaogang/120/120",
    type: "text",
    content: "爸，北京今天晴热，中午日头毒，十一点到下午两点先别出去遛弯。给您网购的高速静音循环扇下午三点送货上门，师傅会直接拆箱安在客厅，有事叫我。",
    timestamp: "1小时前",
    played: true,
  },
];

export default function App() {
  const [isDeviceActivated, setIsDeviceActivated] = useState(() => {
    return window.localStorage.getItem("u2g-tablet-activated-v1") === "true";
  });
  const [hasBoundFamily, setHasBoundFamily] = useState(() => {
    return window.localStorage.getItem("u2g-tablet-activated-v1") === "true";
  });

  // 1. SOS Emergency State
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [emergencyAcceptanceScenario, setEmergencyAcceptanceScenario] = useState<EmergencyAcceptanceScenario>("default");

  // 1.2. Contacts Modal State
  const [isContactsOpen, setIsContactsOpen] = useState(false);

  // 1.5. Smart Voice Assistant Modal State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // 1.7. Medication Celebration State
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [celebrationReminder, setCelebrationReminder] = useState<MedicationReminder | null>(null);
  const [homeReminderAlert, setHomeReminderAlert] = useState<{
    reminderId: string;
    minutesUntil: number;
    source: "automatic" | "acceptance";
  } | null>(null);
  const dismissedHomeReminderAlertsRef = useRef(new Set<string>());

  // 1.8. Quick Apps & Remote triggers
  const [activeRightPanel, setActiveRightPanel] = useState<'family' | 'community'>('family');
  const [externalCallContact, setExternalCallContact] = useState<string | null>(null);
  const [externalOpenAlbum, setExternalOpenAlbum] = useState<boolean>(false);
  const [communityTab, setCommunityTab] = useState<'activity' | 'services' | 'scam'>('activity');
  const [communityModule, setCommunityModule] = useState<'courses' | 'services' | 'scam' | null>(null);
  const [highlightSchedule, setHighlightSchedule] = useState<boolean>(false);

  // 1.9. Family Album Secondary Page State
  const [isAlbumPageOpen, setIsAlbumPageOpen] = useState(false);
  const [albumUnreadCount, setAlbumUnreadCount] = useState(2);
  const [photoHeartStates, setPhotoHeartStates] = useState<Record<string, boolean>>({});

  // 1.9.2. Family Message Box Secondary Page State
  const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);

  // 1.10. Reminders & Schedule Secondary Page State
  const [isSchedulePageOpen, setIsSchedulePageOpen] = useState(false);
  const [isCommunityActivitiesOpen, setIsCommunityActivitiesOpen] = useState(false);
  const [isSecurityInformationOpen, setIsSecurityInformationOpen] = useState(false);
  const [autoPlaySafetyInformation, setAutoPlaySafetyInformation] = useState(false);
  const [safetyReadIds, setSafetyReadIds] = useState<string[]>(readStoredSafetyIds);
  const [isSpecialServicesOpen, setIsSpecialServicesOpen] = useState(false);
  const [serviceBookings, setServiceBookings] = useState<SpecialServiceBooking[]>(readStoredServiceBookings);
  const [isTodayOverviewOpen, setIsTodayOverviewOpen] = useState(false);
  const [overviewRecommendationKind, setOverviewRecommendationKind] = useState<"security" | "community" | "service" | "entertainment" | null>(null);
  const [fulfillmentRecords, setFulfillmentRecords] = useState<FulfillmentRecord[]>(createInitialFulfillmentRecords);

  // 1.11. More Modules bottom drawer popup state
  const [isMoreModulesOpen, setIsMoreModulesOpen] = useState(false);
  const [externalService, setExternalService] = useState<'meal' | 'clean' | 'repair' | null>(null);
  const [externalActiveApp, setExternalActiveApp] = useState<'tiktok' | 'music' | 'tv' | null>(null);

  // Demo-only interaction acceptance controls. These states never enter the elderly-facing UI.
  const [acceptanceTimeOverride, setAcceptanceTimeOverride] = useState<string | null>(null);
  const [acceptanceTaskScenario, setAcceptanceTaskScenario] = useState<AcceptanceTaskScenario>("unfinished");
  const [acceptanceTaskContentScenario, setAcceptanceTaskContentScenario] = useState<AcceptanceTaskContentScenario>("medicine");
  const [acceptanceRecordScenario, setAcceptanceRecordScenario] = useState<AcceptanceRecordScenario>("with-records");
  const [acceptanceCareRegion, setAcceptanceCareRegion] = useState<AcceptanceCareRegion>("domestic");
  const [acceptanceCareTime, setAcceptanceCareTime] = useState<AcceptanceCareTime>("morning");
  const [acceptanceCareMode, setAcceptanceCareMode] = useState<AcceptanceCareMode>("no-disaster");
  const [acceptanceCareScenario, setAcceptanceCareScenario] = useState<AcceptanceCareScenario>("daily");
  const [acceptanceDisasterScenario, setAcceptanceDisasterScenario] = useState<AcceptanceDisasterScenario>("rainstorm");
  const [acceptanceMessageScenario, setAcceptanceMessageScenario] = useState<AcceptanceMessageScenario>("multiple");
  const [acceptanceAlbumScenario, setAcceptanceAlbumScenario] = useState<AcceptanceAlbumScenario>("notice-mixed");
  const [acceptanceHeartScenario, setAcceptanceHeartScenario] = useState<AcceptanceHeartScenario>("not-liked");
  const [acceptanceReminderScenario, setAcceptanceReminderScenario] = useState<AcceptanceReminderScenario>("default");
  const [acceptanceRevision, setAcceptanceRevision] = useState(0);
  const [acceptanceCommand, setAcceptanceCommand] = useState<{ id: number; type: AcceptanceHomeCommand } | null>(null);
  const [familyWeatherScenario, setFamilyWeatherScenario] = useState<FamilyWeatherMockScenario>("default");
  const [familyWeather, setFamilyWeather] = useState(() => familyWeatherMockApi.getSnapshot("default"));

  const handleFocusSchedule = () => {
    setHighlightSchedule(true);
    setTimeout(() => {
      setHighlightSchedule(false);
    }, 4500); // Glow beautifully for 4.5s
  };

  const handleOpenServiceTab = () => {
    setCommunityTab('services');
    setCommunityModule('services');
  };

  // 2. Medication plan state
  const [reminders, setReminders] = useState<MedicationReminder[]>(createDefaultReminders);
  const currentDayRef = useRef(new Date().toDateString());

  useEffect(() => {
    const resetAtNewDay = () => {
      const nextDay = new Date().toDateString();
      if (nextDay === currentDayRef.current) return;
      currentDayRef.current = nextDay;
      dismissedHomeReminderAlertsRef.current.clear();
      setHomeReminderAlert(null);
      setReminders((current) => current.map((reminder) => ({ ...reminder, status: "pending", takenAt: undefined })));
    };
    const timer = window.setInterval(resetAtNewDay, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // 3. Live vitals index state
  const [telemetry, setTelemetry] = useState<HealthTelemetry>({
    heartRate: 68,
    systolic: 125,
    diastolic: 82,
    bloodOxygen: 98,
    bloodGlucose: 5.8,
    lastUpdated: "刚刚",
  });

  // Simulated slight vitals fluctuation over time to make the device feel live and real!
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const hrOffset = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const sysOffset = Math.floor(Math.random() * 3) - 1;
        const diaOffset = Math.floor(Math.random() * 3) - 1;

        const newHr = Math.max(64, Math.min(prev.heartRate + hrOffset, 74));
        const newSys = Math.max(121, Math.min(prev.systolic + sysOffset, 129));
        const newDia = Math.max(78, Math.min(prev.diastolic + diaOffset, 84));

        const now = new Date();
        const timeStr = now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        return {
          ...prev,
          heartRate: newHr,
          systolic: newSys,
          diastolic: newDia,
          lastUpdated: timeStr,
        };
      });
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  // 4. Household safety IoT sensors mock state
  const [sensors] = useState<IoTSensor[]>([
    { id: "iot-1", name: "厨房安全燃气阀", location: "厨房区域", status: "normal", lastSeen: "3分钟前" },
    { id: "iot-2", name: "智能防干烧灶具", location: "厨房灶台", status: "normal", lastSeen: "1分钟前" },
    { id: "iot-3", name: "微波毫米波雷达", location: "洗手间天花", status: "active", lastSeen: "刚刚" },
    { id: "iot-4", name: "入户智能门磁锁", location: "大门玄关", status: "normal", lastSeen: "5分钟前" },
  ]);

  // 5. Digital Photo Album slides
  const [photos] = useState<FamilyPhoto[]>([
    {
      id: "photo-snowman-message",
      url: "/assets/snowman-photo-message.jpg",
      caption: "爸，这是昨天下雪拍的照片",
      date: "刚刚 · 女儿小敏上传",
      type: "photo",
      senderName: "女儿小敏",
      uploadTime: "刚刚",
      categoryName: "孙辈成长",
      batchCaption: "昨天下雪，孩子们一起堆了一个大雪人。",
      initialHearts: 12,
    },
    {
      id: "photo-1",
      url: "https://picsum.photos/seed/familytree/600/450",
      caption: "孙女小雅给您画的父亲节贺卡！画里您精神抖擞呢，祝爷爷健康快乐！",
      date: "今天 09:12 · 儿子小刚上传",
      type: "photo",
      senderName: "儿子小刚",
      uploadTime: "今天 09:12",
      categoryName: "孙辈成长",
      batchCaption: "小雅给爷爷准备的父亲节惊喜。",
      initialHearts: 9,
    },
    {
      id: "video-1",
      url: "https://picsum.photos/seed/familygarden/600/450",
      caption: "重孙女小悦悦在幼儿园给爷爷录制的端午节儿歌祝福视频，快点开看看吧！",
      date: "昨天 18:20 · 女儿小敏上传",
      type: "video",
      videoUrl: "/assets/family-video-mock.mp4",
      senderName: "女儿小敏",
      uploadTime: "昨天 18:20",
      categoryName: "孙辈成长",
      batchCaption: "幼儿园端午节活动，悦悦专门录给爷爷看。",
      initialHearts: 15,
    },
    {
      id: "photo-2",
      url: "https://picsum.photos/seed/gardenstroll/600/450",
      caption: "孩子们带小杰去西湖赏樱花散步，小杰说周末一定要去给爷爷炖最爱喝的黑鱼汤！",
      date: "星期天 15:40 · 女儿小敏上传",
      type: "photo",
      senderName: "女儿小敏",
      uploadTime: "星期天 15:40",
      categoryName: "日常与花草",
      batchCaption: "周末公园散步的一组照片。",
      initialHearts: 14,
    },
    {
      id: "video-2",
      url: "https://picsum.photos/seed/grandsonplay/600/450",
      caption: "外孙小杰参加学校钢琴大赛，弹奏《献给爱丽丝》获得了一等奖！",
      date: "上周五 19:45 · 儿子小刚上传",
      type: "video",
      videoUrl: "/assets/family-video-mock.mp4",
      senderName: "儿子小刚",
      uploadTime: "上周五 19:45",
      categoryName: "孙辈成长",
      batchCaption: "小杰学校钢琴比赛现场记录。",
      initialHearts: 18,
    },
    {
      id: "photo-3",
      url: "https://picsum.photos/seed/birthdaycake/600/450",
      caption: "上个月在酒楼办的八十寿诞大合影，四世同堂，岁岁常欢愉，年年皆胜意！",
      date: "05月22日 · 全家大合影回忆",
      type: "photo",
      senderName: "全家",
      uploadTime: "05月22日",
      categoryName: "节日团聚",
      batchCaption: "八十寿诞家庭聚会影像。",
      initialHearts: 21,
    },
  ]);

  // 6. Voice / Text message inbox state
  const [messages, setMessages] = useState<FamilyMessage[]>(createDefaultMessages);

  // 7. Community physical Activities list state
  const [activities, setActivities] = useState<CommunityActivity[]>([
    {
      id: "act-1",
      title: "长者早操与太极剑法锻炼",
      time: "今天上午 10:00 - 11:30",
      location: "清华园小区文体广角",
      spotsLeft: 3,
      registered: false,
      tag: "活力运动",
      imageUrl: "https://loremflickr.com/720/480/tai-chi,senior?lock=31",
    },
    {
      id: "act-2",
      title: "防范养老诈骗与智能手机技巧宣讲会",
      time: "明天下午 14:30 - 15:30",
      location: "居委会大楼二楼会议室",
      spotsLeft: 12,
      registered: false,
      tag: "安全科普",
      imageUrl: "https://loremflickr.com/720/480/senior,smartphone,class?lock=32",
    },
    {
      id: "act-3",
      title: "夏季中医老年膳食养生调理座谈",
      time: "周四上午 09:30 - 11:00",
      location: "社区多功能助老俱乐部",
      spotsLeft: 7,
      registered: false,
      tag: "健康膳食",
      imageUrl: "https://loremflickr.com/720/480/senior,healthy-food,class?lock=33",
    },
  ]);

  // 8. Security anti-scam advisories
  const [scamTips] = useState<AntiScamTip[]>([
    {
      id: "tip-1",
      title: "警惕“冒充公检法安全账户”巨额骗局",
      summary: "只要对方要求转账到“安全账户”，立即挂断。",
      description: "近期有不法分子冒充公安、检察院或法院工作人员打电话，声称您的账户涉嫌洗钱、诈骗或其他违法行为，并要求您配合所谓的“资金核查”。\n\n请您记住，公安、检察院和法院不会通过电话要求群众转账，也没有所谓的“安全账户”。如果对方要求提供银行卡、身份证、短信验证码，或者要求您把钱转到指定账户，请立即挂断电话。\n\n挂断后，请使用平时保存的电话号码联系家人核实。确实存在资金损失或对方持续骚扰时，可以拨打 110 寻求帮助。不要拨打陌生人提供的任何联系电话。",
      category: "反诈防骗",
      source: "公安反诈中心",
      contactLabel: "联系家人核实",
    },
    {
      id: "tip-2",
      title: "提防“保健品理财讲座、免费送礼品”套路",
      summary: "先不付款、不签字，回家与家人商量后再决定。",
      description: "一些商家会以免费赠送鸡蛋、大米、小家电或者免费体检为由，邀请长者参加所谓的健康讲座。讲座中可能夸大产品功效，宣称某种保健品能够治疗多种疾病，并催促现场付款。\n\n保健食品不能代替药物，也不能治疗疾病。遇到需要支付大额费用、办理会员或者购买多年疗程的情况，请不要当场付款，不要签署自己没有看懂的文件。\n\n可以先把产品名称、宣传单和商家联系方式带回家，与家人、医生或社区工作人员商量后再决定。",
      category: "消费安全",
      source: "社区民警",
      contactLabel: "联系家人商量",
    },
    {
      id: "tip-3",
      title: "冒充亲属熟人‘住院急需转账’紧急短信",
      summary: "不要着急汇款，先用家人原来的电话号码核实。",
      description: "如果突然收到自称儿女、孙辈或其他亲属的信息，对方说手机损坏、发生车祸、住院或者被拘留，并要求您立即向陌生账户转账，请先停下来核实。\n\n不要按照信息中的要求保持保密，也不要拨打对方临时提供的新号码。请直接拨打家人平时使用的电话号码，或者联系其他亲属确认情况。\n\n如果暂时联系不上家人，可以请社区工作人员协助。在确认对方真实身份之前，不要进行任何转账操作。",
      category: "亲情诈骗",
      source: "社区民警",
      contactLabel: "联系家人核实",
    },
  ]);

  // 9. Smart assistant "小U" AI convo list
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: "assistant",
      text: "您好，爷爷！我是您的智能照护顾问小U。今天感觉怎么样？日程计划、药箱提醒、天气健康等随时都可以点击问我，我会立刻为您解答！",
      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Actions
  const appendFulfillmentRecord = (record: Omit<FulfillmentRecord, "id" | "occurredAt"> & { id?: string; occurredAt?: string }) => {
    setFulfillmentRecords((current) => [{
      ...record,
      id: record.id ?? `fulfillment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      occurredAt: record.occurredAt ?? new Date().toISOString(),
    }, ...current]);
  };

  const openSafetyInformation = (autoPlay = false) => {
    setAutoPlaySafetyInformation(autoPlay);
    setIsSecurityInformationOpen(true);
  };

  const handleReadSafetyTip = (tipId: string) => {
    if (safetyReadIds.includes(tipId)) return;
    const nextReadIds = [...safetyReadIds, tipId];
    setSafetyReadIds(nextReadIds);
    window.localStorage.setItem(SAFETY_READ_STORAGE_KEY, JSON.stringify(nextReadIds));
    const tip = scamTips.find((item) => item.id === tipId);
    if (tip) appendFulfillmentRecord({ kind: "content", title: `已阅读${tip.title}` });
  };

  const handleBookService = (booking: SpecialServiceBooking) => {
    const nextBookings = [booking, ...serviceBookings];
    setServiceBookings(nextBookings);
    window.localStorage.setItem(SERVICE_BOOKINGS_STORAGE_KEY, JSON.stringify(nextBookings));
    appendFulfillmentRecord({ kind: "service", title: `已预约${booking.serviceName}` });
  };

  const handleCancelServiceBooking = (bookingId: string) => {
    const nextBookings = serviceBookings.map((booking) => (
      booking.id === bookingId ? { ...booking, status: "cancelled" as const } : booking
    ));
    setServiceBookings(nextBookings);
    window.localStorage.setItem(SERVICE_BOOKINGS_STORAGE_KEY, JSON.stringify(nextBookings));
  };

  const handleCompleteReminder = (id: string) => {
    const item = reminders.find((r) => r.id === id || r.name === id || id.includes(r.name) || r.name.includes(id));
    if (!item || item.status === "completed") return;

    const finishedReminder = {
      ...item,
      status: "completed" as const,
      takenAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };

    setReminders((prev) =>
      prev.map((r) => (r.id === item.id ? finishedReminder : r))
    );
    setHomeReminderAlert(null);
    setCelebrationReminder(finishedReminder);
    setIsCelebrationOpen(true);
    appendFulfillmentRecord({
      kind: item.category === "schedule" ? "schedule" : "medication",
      title: item.category === "schedule" ? `${item.name}已确认` : `${item.time < "12:00" ? "早上" : item.time < "18:00" ? "中午" : "晚上"}药已确认服用`,
    });
  };

  const handleQuickCompleteReminder = (id: string) => {
    handleCompleteReminder(id);
  };

  const handlePlayMessage = (id: string) => {
    const message = messages.find((item) => item.id === id);
    if (message && !message.played && message.sender !== "您 (我)") {
      const sender = message.sender.includes("女儿") ? "女儿" : message.sender.includes("儿子") ? "儿子" : message.sender;
      appendFulfillmentRecord({ kind: "message", title: `收听了${sender}语音留言` });
    }
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, played: true } : m)));
  };

  const handleQuickReply = (recipient: string, content: string) => {
    setMessages((currentMessages) => [...currentMessages, {
      id: `home-quick-reply-${Date.now()}`,
      sender: "您 (我)",
      recipient,
      avatar: "https://picsum.photos/seed/grandfather/120/120",
      type: "text",
      content,
      timestamp: "刚刚",
      played: true,
    }]);
  };

  const handleRegisterActivity = (id: string) => {
    const activity = activities.find((item) => item.id === id);
    if (activity && !activity.registered) appendFulfillmentRecord({ kind: "activity", title: `已报名${activity.title}` });
    setActivities((prev) =>
      prev.map((act) =>
        act.id === id
          ? {
              ...act,
              registered: true,
              spotsLeft: Math.max(0, act.spotsLeft - 1),
            }
          : act
      )
    );
  };

  const handleSendMessage = async (text: string) => {
    const timestamp = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = { sender: "user", text, timestamp };

    setChatHistory((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error("API response error");
      }

      const data = await response.json();
      const aiMsg: ChatMessage = {
        sender: "assistant",
        text: data.text,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      };
      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        sender: "assistant",
        text: "抱歉爷爷，小U的网络开了一点小差，不过我已经通知了后台的社区服务中心，您的照护顾问会一直为您守候。您多喝水、按时吃药哦！",
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const sendAcceptanceCommand = (type: AcceptanceHomeCommand) => {
    setAcceptanceCommand((current) => ({ id: (current?.id ?? 0) + 1, type }));
  };

  const showHomeForAcceptance = () => {
    setIsSOSOpen(false);
    setIsContactsOpen(false);
    setIsAssistantOpen(false);
    setIsCelebrationOpen(false);
    setIsAlbumPageOpen(false);
    setIsMessageBoxOpen(false);
    setIsSchedulePageOpen(false);
    setIsCommunityActivitiesOpen(false);
    setIsSecurityInformationOpen(false);
    setIsSpecialServicesOpen(false);
    setIsTodayOverviewOpen(false);
    setIsMoreModulesOpen(false);
    setHomeReminderAlert(null);
    setOverviewRecommendationKind(null);
    sendAcceptanceCommand("reset-home-overlays");
  };

  const applyAcceptanceTaskState = (
    scenario: AcceptanceTaskScenario,
    contentScenario: AcceptanceTaskContentScenario,
  ) => {
    const defaults = createDefaultReminders();
    setAcceptanceTaskScenario(scenario);
    setAcceptanceTaskContentScenario(contentScenario);

    if (scenario === "overdue") {
      setAcceptanceTimeOverride("14:15");
      setReminders(defaults.map((item) => item.id === "med-2" ? { ...item, status: "expired" as const } : item));
    } else if (scenario === "all-done") {
      setAcceptanceTimeOverride("13:00");
      setReminders(defaults.map((item) => ({ ...item, status: "completed" as const, takenAt: item.takenAt ?? "已完成" })));
    } else if (scenario === "no-p0") {
      setAcceptanceTimeOverride("13:00");
      setReminders(defaults.map((item) => ({ ...item, priority: "P1" as const })));
    } else if (contentScenario === "schedule") {
      setAcceptanceTimeOverride("15:00");
      setReminders([
        ...defaults.map((item) => ({ ...item, priority: "P1" as const })),
        {
          id: "acceptance-schedule",
          time: "15:00",
          name: "下午测量血压",
          dosage: "使用家里的血压计测量并记录",
          status: "pending",
          priority: "P0",
          category: "schedule",
          ctaTitle: "该测量血压啦",
        },
      ]);
    } else {
      setAcceptanceTimeOverride("13:00");
      setReminders(defaults);
    }
    setAcceptanceRevision((revision) => revision + 1);
    showHomeForAcceptance();
  };

  const handleAcceptanceTaskScenario = (scenario: AcceptanceTaskScenario) => {
    const compatibleContent = scenario === "overdue" ? "medicine" : acceptanceTaskContentScenario;
    applyAcceptanceTaskState(scenario, compatibleContent);
  };

  const handleAcceptanceTaskContentScenario = (scenario: AcceptanceTaskContentScenario) => {
    applyAcceptanceTaskState("unfinished", scenario);
  };

  const handleAcceptanceRecordScenario = (scenario: AcceptanceRecordScenario) => {
    setAcceptanceRecordScenario(scenario);
    setFulfillmentRecords(scenario === "empty" ? [] : createInitialFulfillmentRecords());
    showHomeForAcceptance();
  };

  const openAcceptanceHomeReminderAlert = (category: AcceptanceTaskContentScenario) => {
    const targetId = category === "schedule" ? "schedule-self-walk" : "med-2";
    showHomeForAcceptance();
    setReminders((current) => current.map((reminder) => (
      reminder.id === targetId
        ? { ...reminder, status: "pending" as const, takenAt: undefined }
        : reminder
    )));
    setHomeReminderAlert({
      reminderId: targetId,
      minutesUntil: 5,
      source: "acceptance",
    });
  };

  const showAcceptanceCareCopy = (next: {
    region?: AcceptanceCareRegion;
    time?: AcceptanceCareTime;
    mode?: AcceptanceCareMode;
    scenario?: AcceptanceCareScenario;
    disaster?: AcceptanceDisasterScenario;
  }) => {
    const region = next.region ?? acceptanceCareRegion;
    const time = next.time ?? acceptanceCareTime;
    const mode = next.mode ?? acceptanceCareMode;
    const scenario = next.scenario ?? acceptanceCareScenario;
    const disaster = next.disaster ?? acceptanceDisasterScenario;
    setAcceptanceCareRegion(region);
    setAcceptanceCareTime(time);
    setAcceptanceCareMode(mode);
    setAcceptanceCareScenario(scenario);
    setAcceptanceDisasterScenario(disaster);
    applyAcceptanceTaskState("no-p0", acceptanceTaskContentScenario);
    const careTimes: Record<AcceptanceCareTime, string> = {
      morning: "08:00",
      noon: "12:00",
      afternoon: "15:00",
      evening: "19:00",
      "late-night": "23:00",
    };
    setAcceptanceTimeOverride(careTimes[time]);
  };

  const handleAcceptanceMessageScenario = (scenario: AcceptanceMessageScenario) => {
    const defaults = createDefaultMessages();
    const markAllRead = defaults.map((message) => ({ ...message, played: true }));
    setAcceptanceMessageScenario(scenario);

    if (scenario === "none") {
      setMessages(markAllRead);
    } else if (scenario === "single") {
      setMessages(markAllRead.map((message) => message.id === "msg-voice-3" ? { ...message, played: false } : message));
    } else if (scenario === "multiple") {
      const unreadIds = new Set(["msg-photo-snowman", "msg-voice-3", "msg-voice-2"]);
      setMessages(markAllRead.map((message) => unreadIds.has(message.id) ? { ...message, played: false } : message));
    } else if (scenario === "photo") {
      setMessages([
        {
          ...defaults[0],
          id: `acceptance-photo-${Date.now()}`,
          timestamp: "刚刚",
          played: false,
        },
        ...markAllRead.slice(1),
      ]);
    } else if (scenario === "photo-group") {
      setMessages([
        {
          ...defaults[0],
          id: `acceptance-photo-group-${Date.now()}`,
          content: "爸，这是我们周末一起拍的一组照片",
          photoUrls: [
            "/assets/snowman-photo-message.jpg",
            "/assets/family-dashboard-source.png",
            "/assets/snowman-photo-message.jpg?group=3",
          ],
          timestamp: "刚刚",
          played: false,
        },
        ...markAllRead.slice(1),
      ]);
    } else if (scenario === "load-failure") {
      setMessages([
        {
          ...defaults[1],
          id: `acceptance-message-failure-${Date.now()}`,
          content: "留言内容暂时无法加载",
          timestamp: "刚刚",
          played: false,
          loadFailed: true,
        },
        ...markAllRead.filter((message) => message.id !== defaults[1].id),
      ]);
    }

    setAcceptanceRevision((revision) => revision + 1);
  };

  const handleAcceptanceWeatherScenario = (scenario: FamilyWeatherMockScenario) => {
    familyWeatherMockApi.reset();
    setFamilyWeatherScenario(scenario);
    setFamilyWeather(familyWeatherMockApi.getSnapshot(scenario));
  };

  const openAcceptanceWeatherScenario = (target: "home" | "detail" | "care") => {
    showHomeForAcceptance();
    if (target === "home") {
      sendAcceptanceCommand("reset-home-overlays");
      return;
    }
    sendAcceptanceCommand(target === "care" ? "open-weather-care" : "open-weather");
  };

  const openAcceptanceEmergencyScenario = (scenario: EmergencyAcceptanceScenario) => {
    showHomeForAcceptance();
    setEmergencyAcceptanceScenario(scenario);
    setIsSOSOpen(true);
  };

  const handleAcceptanceAlbumScenario = (scenario: AcceptanceAlbumScenario) => {
    setAcceptanceAlbumScenario(scenario);
    if (scenario === "notice-photo") setAlbumUnreadCount(1);
    else if (scenario === "notice-video") setAlbumUnreadCount(1);
    else if (scenario === "notice-mixed") setAlbumUnreadCount(2);
    showHomeForAcceptance();
  };

  const resetAcceptanceState = () => {
    showHomeForAcceptance();
    setAcceptanceTimeOverride(null);
    setAcceptanceTaskScenario("unfinished");
    setAcceptanceTaskContentScenario("medicine");
    setAcceptanceRecordScenario("with-records");
    setAcceptanceCareRegion("domestic");
    setAcceptanceCareTime("morning");
    setAcceptanceCareMode("no-disaster");
    setAcceptanceCareScenario("daily");
    setAcceptanceDisasterScenario("rainstorm");
    setAcceptanceMessageScenario("multiple");
    setAcceptanceAlbumScenario("notice-mixed");
    setAlbumUnreadCount(2);
    setAcceptanceHeartScenario("not-liked");
    setAcceptanceReminderScenario("default");
    setPhotoHeartStates({});
    setReminders(createDefaultReminders());
    setMessages(createDefaultMessages());
    setFulfillmentRecords(createInitialFulfillmentRecords());
    familyWeatherMockApi.reset();
    setFamilyWeatherScenario("default");
    setFamilyWeather(familyWeatherMockApi.getSnapshot("default"));
    setAcceptanceRevision((revision) => revision + 1);
  };

  const generateWeatherCareDraft = (input: GenerateWeatherCareInput) => familyWeatherMockApi.generateDraft(input);

  const sendWeatherCare = async (input: SendWeatherCareInput) => {
    return familyWeatherMockApi.sendCareMessage(input);
  };

  const isHomeSurfaceActive = isDeviceActivated
    && !isSOSOpen
    && !isContactsOpen
    && !isAssistantOpen
    && !isCelebrationOpen
    && !isAlbumPageOpen
    && !isMessageBoxOpen
    && !isSchedulePageOpen
    && !isCommunityActivitiesOpen
    && !isSecurityInformationOpen
    && !isSpecialServicesOpen
    && !isTodayOverviewOpen
    && !isMoreModulesOpen;

  useEffect(() => {
    const syncHomeReminderAlert = () => {
      if (!isHomeSurfaceActive) {
        setHomeReminderAlert((current) => current?.source === "automatic" ? null : current);
        return;
      }

      setHomeReminderAlert((current) => {
        if (current?.source === "acceptance") return current;

        const now = new Date();
        const dayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        const nextReminder = reminders
          .filter((reminder) => reminder.status !== "completed")
          .map((reminder) => {
            const [hours, minutes] = reminder.time.split(":").map(Number);
            const reminderTime = new Date(now);
            reminderTime.setHours(hours, minutes, 0, 0);
            return {
              reminder,
              millisecondsUntil: reminderTime.getTime() - now.getTime(),
            };
          })
          .filter(({ reminder, millisecondsUntil }) => (
            millisecondsUntil >= 0
            && millisecondsUntil <= 5 * 60 * 1000
            && !dismissedHomeReminderAlertsRef.current.has(`${dayKey}:${reminder.id}`)
          ))
          .sort((first, second) => first.millisecondsUntil - second.millisecondsUntil)[0];

        if (!nextReminder) return null;
        return {
          reminderId: nextReminder.reminder.id,
          minutesUntil: Math.max(0, Math.ceil(nextReminder.millisecondsUntil / 60_000)),
          source: "automatic",
        };
      });
    };

    syncHomeReminderAlert();
    const timer = window.setInterval(syncHomeReminderAlert, 15_000);
    return () => window.clearInterval(timer);
  }, [isHomeSurfaceActive, reminders]);

  const activeHomeReminder = homeReminderAlert
    ? reminders.find((reminder) => reminder.id === homeReminderAlert.reminderId) ?? null
    : null;

  const dismissHomeReminderAlert = () => {
    if (activeHomeReminder && homeReminderAlert?.source === "automatic") {
      const now = new Date();
      const dayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      dismissedHomeReminderAlertsRef.current.add(`${dayKey}:${activeHomeReminder.id}`);
    }
    setHomeReminderAlert(null);
  };

  if (!isDeviceActivated) {
    return (
      <TabletSimulator>
        <ActivationFlow
          onComplete={() => {
            window.localStorage.setItem("u2g-tablet-activated-v1", "true");
            setHasBoundFamily(false);
            setIsDeviceActivated(true);
          }}
        />
      </TabletSimulator>
    );
  }

  return (
    <>
      <TabletSimulator>
        <div className="relative w-full h-full overflow-hidden">
          <ControlCenterHome
            reminders={reminders}
            messages={messages}
            albumPhotos={photos.slice(0, 30)}
            fulfillmentRecords={fulfillmentRecords}
            photoHeartStates={photoHeartStates}
            securityUnreadCount={Math.max(0, scamTips.length - safetyReadIds.length)}
            onTogglePhotoHeart={(photoKey, liked) => {
              setPhotoHeartStates((current) => ({
                ...current,
                [photoKey]: liked,
              }));
              setAcceptanceHeartScenario(liked ? "liked" : "not-liked");
            }}
            onVideoViewed={() => setAlbumUnreadCount((count) => Math.max(0, count - 1))}
            onCompleteReminder={handleQuickCompleteReminder}
            onPlayMessage={handlePlayMessage}
            onQuickReply={handleQuickReply}
            onOpenAlbum={() => setIsAlbumPageOpen(true)}
            onOpenMessageBox={() => setIsMessageBoxOpen(true)}
            onOpenSchedule={() => setIsSchedulePageOpen(true)}
            onOpenTodayOverview={() => setIsTodayOverviewOpen(true)}
            onOpenCommunity={() => setIsCommunityActivitiesOpen(true)}
            onOpenSpecialServices={() => setIsSpecialServicesOpen(true)}
            onOpenRecommendation={(kind) => {
              if (kind === "community") {
                setIsCommunityActivitiesOpen(true);
                return;
              }
              if (kind === "security") {
                openSafetyInformation(true);
                return;
              }
              if (kind === "service") {
                setIsSpecialServicesOpen(true);
                return;
              }
              setOverviewRecommendationKind(kind);
              setIsTodayOverviewOpen(true);
            }}
            onOpenContacts={() => setIsContactsOpen(true)}
            onOpenAssistant={() => setIsAssistantOpen(true)}
            onOpenMore={() => setIsMoreModulesOpen(true)}
            onTriggerSOS={() => setIsSOSOpen(true)}
            acceptanceTimeOverride={acceptanceTimeOverride}
            acceptanceAlbumScenario={acceptanceAlbumScenario}
            acceptanceHeartScenario={acceptanceHeartScenario}
            acceptanceCareRegion={acceptanceCareRegion}
            acceptanceCareTime={acceptanceCareTime}
            acceptanceCareMode={acceptanceCareMode}
            acceptanceCareScenario={acceptanceCareScenario}
            acceptanceDisasterScenario={acceptanceDisasterScenario}
            acceptanceRevision={acceptanceRevision}
            acceptanceCommand={acceptanceCommand}
            familyWeather={familyWeather}
            onGenerateWeatherCareDraft={generateWeatherCareDraft}
            onSendWeatherCare={sendWeatherCare}
          />

        {activeHomeReminder && homeReminderAlert && (
          <HomeReminderAlert
            reminder={activeHomeReminder}
            minutesUntil={homeReminderAlert.minutesUntil}
            onComplete={() => handleCompleteReminder(activeHomeReminder.id)}
            onDismiss={dismissHomeReminderAlert}
          />
        )}

        {/* SOS OVERLAY PORTAL */}
        <EmergencyModal
          isOpen={isSOSOpen}
          scenario={emergencyAcceptanceScenario}
          onDismiss={() => {
            setIsSOSOpen(false);
            setEmergencyAcceptanceScenario("default");
          }}
        />

        {/* CONTACTS LIST PAGE */}
        <ContactsPage
          isOpen={isContactsOpen}
          onClose={() => setIsContactsOpen(false)}
          hasBoundFamily={hasBoundFamily}
          messages={messages}
          onAddMessage={(newMessage) => setMessages((currentMessages) => [...currentMessages, newMessage])}
          onMarkRead={(messageId) => setMessages((currentMessages) => currentMessages.map((message) => message.id === messageId ? { ...message, played: true } : message))}
        />

        {/* FAMILY ALBUM SECONDARY FULL SCREEN PAGE */}
        <FamilyAlbumPage
          isOpen={isAlbumPageOpen}
          onClose={() => setIsAlbumPageOpen(false)}
          onUnreadCountChange={(count) => setAlbumUnreadCount(count)}
          acceptanceScenario={acceptanceAlbumScenario}
          acceptanceHeartScenario={acceptanceHeartScenario}
          heartStates={photoHeartStates}
          onToggleHeart={(photoKey, liked) => {
            setPhotoHeartStates((current) => ({
              ...current,
              [photoKey]: liked,
            }));
            setAcceptanceHeartScenario(liked ? "liked" : "not-liked");
          }}
        />

        {/* FAMILY MESSAGE BOX SECONDARY FULL SCREEN PAGE */}
        <FamilyMessageBoxPage
          isOpen={isMessageBoxOpen}
          onClose={() => setIsMessageBoxOpen(false)}
          backLabel={isContactsOpen ? "返回通讯录" : "返回首页"}
          messages={messages}
          onAddMessage={(newMsg) => setMessages((prev) => [...prev, newMsg])}
          onMarkRead={(messageId) => setMessages((currentMessages) => currentMessages.map((message) => message.id === messageId ? { ...message, played: true } : message))}
          onStartCall={(name) => {
            setIsMessageBoxOpen(false);
            setIsContactsOpen(false);
            setActiveRightPanel('family');
            setExternalCallContact(name);
          }}
        />

        {/* REMINDERS & SCHEDULE SECONDARY FULL SCREEN PAGE */}
        <SchedulePage
          isOpen={isSchedulePageOpen}
          onClose={() => setIsSchedulePageOpen(false)}
          reminders={reminders}
          acceptanceScenario={acceptanceReminderScenario}
          onCompleteExternal={(name) => {
            // Check if there is a medication with this name and trigger completed
            const matched = reminders.find(r => r.name.includes(name) || name.includes(r.name));
            if (matched) {
              handleCompleteReminder(matched.id);
            }
          }}
        />

        <CommunityActivitiesPage
          isOpen={isCommunityActivitiesOpen}
          onClose={() => setIsCommunityActivitiesOpen(false)}
          activities={activities}
          onRegister={handleRegisterActivity}
        />

        <SecurityInformationPage
          isOpen={isSecurityInformationOpen}
          autoPlayFeatured={autoPlaySafetyInformation}
          tips={scamTips}
          readIds={safetyReadIds}
          onRead={handleReadSafetyTip}
          onClose={() => {
            setIsSecurityInformationOpen(false);
            setAutoPlaySafetyInformation(false);
          }}
          onContactFamily={() => {
            setIsSecurityInformationOpen(false);
            setAutoPlaySafetyInformation(false);
            setIsContactsOpen(true);
          }}
        />

        <SpecialServicesPage
          isOpen={isSpecialServicesOpen}
          bookings={serviceBookings}
          onClose={() => setIsSpecialServicesOpen(false)}
          onBook={handleBookService}
          onCancelBooking={handleCancelServiceBooking}
        />

        <TodayOverviewPage
          isOpen={isTodayOverviewOpen}
          initialRecommendationKind={overviewRecommendationKind}
          onFulfillment={appendFulfillmentRecord}
          isSecurityRead={safetyReadIds.includes("tip-1")}
          onOpenSecurity={() => {
            setIsTodayOverviewOpen(false);
            setOverviewRecommendationKind(null);
            openSafetyInformation(false);
          }}
          isServiceBooked={serviceBookings.some((booking) => booking.status !== "cancelled")}
          onOpenService={() => {
            setIsTodayOverviewOpen(false);
            setOverviewRecommendationKind(null);
            setIsSpecialServicesOpen(true);
          }}
          onClose={() => {
            setIsTodayOverviewOpen(false);
            setOverviewRecommendationKind(null);
          }}
        />

        {/* SMART ASSISTANT INTERACTIVE VOICE DIALOG LAYER */}
        <SmartAssistantModal
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          chatHistory={chatHistory}
          onSendMessage={handleSendMessage}
          isChatLoading={isChatLoading}
        />

        {/* MEDICATION CELEBRATION OVERLAY */}
        <MedicationCelebration
          isOpen={isCelebrationOpen}
          onClose={() => setIsCelebrationOpen(false)}
          reminder={celebrationReminder}
          totalCompleted={reminders.filter((r) => (
            r.status === "completed"
            && ((celebrationReminder?.category === "schedule")
              ? r.category === "schedule"
              : r.category !== "schedule")
          )).length}
          totalReminders={reminders.filter((r) => (
            (celebrationReminder?.category === "schedule")
              ? r.category === "schedule"
              : r.category !== "schedule"
          )).length}
        />

        <MoreFunctionsDrawer
          isOpen={isMoreModulesOpen}
          onClose={() => setIsMoreModulesOpen(false)}
          onOpenAlbum={() => setIsAlbumPageOpen(true)}
          onOpenContacts={() => setIsContactsOpen(true)}
          onOpenReminders={() => setIsSchedulePageOpen(true)}
          onOpenCommunity={() => {
            setIsCommunityActivitiesOpen(true);
          }}
          onOpenSpecialServices={() => {
            setIsSpecialServicesOpen(true);
          }}
          onOpenInformation={() => {
            openSafetyInformation(false);
          }}
          onOpenEntertainment={() => {
            setOverviewRecommendationKind("entertainment");
            setIsTodayOverviewOpen(true);
          }}
        />

        </div>
      </TabletSimulator>
      <InteractionAcceptanceConsole
        timeOverride={acceptanceTimeOverride}
        taskScenario={acceptanceTaskScenario}
        taskContentScenario={acceptanceTaskContentScenario}
        recordScenario={acceptanceRecordScenario}
        careRegion={acceptanceCareRegion}
        careTime={acceptanceCareTime}
        careMode={acceptanceCareMode}
        careScenario={acceptanceCareScenario}
        disasterScenario={acceptanceDisasterScenario}
        messageScenario={acceptanceMessageScenario}
        weatherScenario={familyWeatherScenario}
        albumScenario={acceptanceAlbumScenario}
        heartScenario={acceptanceHeartScenario}
        reminderScenario={acceptanceReminderScenario}
        onShowHome={showHomeForAcceptance}
        onShowAlbum={() => {
          showHomeForAcceptance();
          setIsAlbumPageOpen(true);
        }}
        onShowReminders={() => {
          showHomeForAcceptance();
          setIsSchedulePageOpen(true);
        }}
        onSetTaskScenario={handleAcceptanceTaskScenario}
        onSetTaskContentScenario={handleAcceptanceTaskContentScenario}
        onSetRecordScenario={handleAcceptanceRecordScenario}
        onSetCareRegion={(region) => showAcceptanceCareCopy({ region })}
        onSetCareTime={(time) => showAcceptanceCareCopy({ time })}
        onSetCareMode={(mode) => showAcceptanceCareCopy({ mode })}
        onSetCareScenario={(scenario) => showAcceptanceCareCopy({ scenario })}
        onSetDisasterScenario={(disaster) => showAcceptanceCareCopy({ disaster })}
        onSetMessageScenario={handleAcceptanceMessageScenario}
        onSetWeatherScenario={handleAcceptanceWeatherScenario}
        onOpenWeatherScenario={openAcceptanceWeatherScenario}
        onSetAlbumScenario={handleAcceptanceAlbumScenario}
        onSetHeartScenario={setAcceptanceHeartScenario}
        onSetReminderScenario={setAcceptanceReminderScenario}
        onOpenHomeReminderAlert={openAcceptanceHomeReminderAlert}
        onHomeCommand={sendAcceptanceCommand}
        onOpenEmergencyScenario={openAcceptanceEmergencyScenario}
        onOpenActivation={() => {
          window.localStorage.removeItem("u2g-tablet-activated-v1");
          setHasBoundFamily(false);
          setIsDeviceActivated(false);
        }}
        onReset={resetAcceptanceState}
      />
    </>
  );
}
