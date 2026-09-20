import React, { useState, useEffect, useRef } from "react";
import TabletSimulator from "./components/TabletSimulator";
import ControlCenterHome from "./components/ControlCenterHome";
import EmergencyModal, { type EmergencyAcceptanceScenario } from "./components/EmergencyModal";
import SmartAssistantModal from "./components/SmartAssistantModal";
import MedicationCelebration from "./components/MedicationCelebration";
import HomeReminderAlert, { resetHomeReminderSpeechTracking } from "./components/HomeReminderAlert";
import ContactsPage, { type ServiceConversationAcceptanceScenario } from "./components/ContactsCommunicationPage";
import FamilyAlbumPage from "./components/FamilyAlbumPage";
import SchedulePage from "./components/SchedulePage";
import MoreFunctionsDrawer from "./components/MoreFunctionsDrawer";
import CommunityActivitiesPage, { type CommunityActivityAcceptanceScenario } from "./components/CommunityActivitiesPage";
import CommunityLifePage, { type CommunityLifeAcceptanceScenario } from "./components/CommunityLifePage";
import SecurityInformationPage from "./components/SecurityInformationPage";
import SpecialServicesPage, { type SpecialServicesAcceptanceScenario } from "./components/SpecialServicesPage";
import PersonalProfilePage from "./components/PersonalProfilePage";
import EntertainmentHubPage from "./components/EntertainmentHubPage";
import CommunityStaffPage, { type CommunityStaffAcceptanceScenario } from "./components/CommunityStaffPage";
import ActivationFlow from "./components/ActivationFlow";
import InteractionAcceptanceConsole, {
  type AcceptanceAlbumScenario,
  type AcceptanceHomeCommand,
  type AcceptanceHeartScenario,
  type AcceptanceReminderScenario,
  type AcceptanceRightContentScenario,
  type AcceptanceTaskContentScenario,
  type AcceptanceCommunityScenario,
} from "./components/InteractionAcceptanceConsole";
import {
  familyWeatherMockApi,
  type FamilyWeatherMockScenario,
} from "./weather/familyWeather";
import { MedicationReminder, HealthTelemetry, IoTSensor, FamilyPhoto, FamilyMessage, CommunityActivity, AntiScamTip, ChatMessage, FulfillmentRecord, SpecialServiceBooking } from "./types";
import { elderProfileMock, getActiveFamilyRelationshipCount, getActiveFamilyRelationships } from "./elder-profile";
import { SERVICE_COMMUNICATION_FIXTURES, secondsFromDuration } from "./service-communication-fixture";
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

const INITIAL_FAMILY_PHOTOS: FamilyPhoto[] = [
  {
    id: "photo-snowman-message",
    url: "./assets/snowman-photo-message.jpg",
    caption: "爸，这是昨天下雪拍的照片",
    date: "今天 09:12 · 女儿小敏上传",
    type: "photo",
    senderName: "女儿小敏",
    uploaderRelationshipId: "daughter",
    publishedAt: "2026-09-20T09:12:00+08:00",
    uploadTime: "今天 09:12",
    categoryNameSnapshot: "孩子成长",
    batchCaption: "昨天下雪，孩子们一起堆了一个大雪人。",
    initialHearts: 12,
    voiceDuration: 7,
    viewedAt: null,
  },
  {
    id: "video-1",
    url: "https://picsum.photos/seed/familygarden/600/450",
    caption: "重孙女在幼儿园录制了端午节儿歌祝福视频。",
    date: "今天 10:05 · 女儿小敏上传",
    type: "video",
    videoUrl: "./assets/family-video-mock.mp4",
    senderName: "女儿小敏",
    uploaderRelationshipId: "daughter",
    publishedAt: "2026-09-20T10:05:00+08:00",
    uploadTime: "今天 10:05",
    categoryNameSnapshot: "节日纪念",
    batchCaption: "幼儿园端午节活动，悦悦专门录给爷爷看。",
    initialHearts: 15,
    viewedAt: null,
  },
  {
    id: "photo-1",
    url: "https://picsum.photos/seed/familytree/600/450",
    caption: "孙女小雅给您画的父亲节贺卡，祝爷爷健康快乐！",
    date: "昨天 18:20 · 儿子小刚上传",
    type: "photo",
    senderName: "儿子小刚",
    uploaderRelationshipId: "son",
    publishedAt: "2026-09-19T18:20:00+08:00",
    uploadTime: "昨天 18:20",
    categoryNameSnapshot: "节日纪念",
    batchCaption: "小雅给爷爷准备的父亲节惊喜。",
    initialHearts: 9,
    voiceDuration: 8,
    viewedAt: "2026-09-19T18:25:00+08:00",
  },
  {
    id: "photo-2",
    url: "https://picsum.photos/seed/gardenstroll/600/450",
    caption: "周末带孩子们去公园散步了，下次我们陪您一起去。",
    date: "星期天 15:40 · 女儿小敏上传",
    type: "photo",
    senderName: "女儿小敏",
    uploaderRelationshipId: "daughter",
    publishedAt: "2026-09-14T15:40:00+08:00",
    uploadTime: "星期天 15:40",
    categoryNameSnapshot: "日常生活",
    batchCaption: "周末公园散步的一组照片。",
    initialHearts: 14,
    voiceDuration: 8,
    viewedAt: "2026-09-14T16:02:00+08:00",
  },
  {
    id: "video-2",
    url: "https://picsum.photos/seed/grandsonplay/600/450",
    caption: "外孙小杰参加学校钢琴大赛，获得了一等奖。",
    date: "上周五 19:45 · 儿子小刚上传",
    type: "video",
    videoUrl: "./assets/family-video-mock.mp4",
    senderName: "儿子小刚",
    uploaderRelationshipId: "son",
    publishedAt: "2026-09-12T19:45:00+08:00",
    uploadTime: "上周五 19:45",
    categoryNameSnapshot: "孩子成长",
    batchCaption: "小杰学校钢琴比赛现场记录。",
    initialHearts: 18,
    viewedAt: "2026-09-12T20:10:00+08:00",
  },
  {
    id: "photo-3",
    url: "https://picsum.photos/seed/birthdaycake/600/450",
    caption: "上个月寿宴的大合影，四世同堂，大家都笑得特别开心。",
    date: "05月22日 · 儿子小刚上传",
    type: "photo",
    senderName: "儿子小刚",
    uploaderRelationshipId: "son",
    publishedAt: "2026-05-22T18:10:00+08:00",
    uploadTime: "05月22日",
    categoryNameSnapshot: "家庭聚会",
    batchCaption: "八十寿诞家庭聚会影像。",
    initialHearts: 21,
    voiceDuration: 10,
    viewedAt: "2026-05-22T18:25:00+08:00",
  },
  {
    id: "photo-4",
    url: "https://picsum.photos/seed/mountain/600/450",
    caption: "整理旧照片时看到这张山顶日出，想起您以前讲的旅行故事。",
    date: "05月10日 · 女儿小敏上传",
    type: "photo",
    senderName: "女儿小敏",
    uploaderRelationshipId: "daughter",
    publishedAt: "2026-05-10T10:20:00+08:00",
    uploadTime: "05月10日",
    categoryNameSnapshot: "旅行风景",
    batchCaption: "一起回看以前旅行时留下的风景。",
    initialHearts: 17,
    voiceDuration: 10,
    viewedAt: "2026-05-10T11:00:00+08:00",
  },
];

const createInitialFamilyMediaViewedAt = () => Object.fromEntries(
  INITIAL_FAMILY_PHOTOS.map((photo) => [photo.id, photo.viewedAt ?? null]),
) as Record<string, string | null>;

const createDefaultReminders = (): MedicationReminder[] => [
  {
    id: "med-1",
    time: "08:00",
    scheduledAt: "2026-09-18T08:00:00+08:00",
    name: "复方降压片 + 维生素D片",
    dosage: "降压药1片，维生素D1片 (温水送服)",
    status: "completed",
    takenAt: "08:15",
  },
  {
    id: "med-2",
    time: "13:00",
    scheduledAt: "2026-09-18T13:00:00+08:00",
    name: "阿司匹林肠溶片 (保护心脏)",
    dosage: "1片 (饭后半小时服用)",
    status: "pending",
  },
  {
    id: "med-3",
    time: "19:30",
    scheduledAt: "2026-09-18T19:30:00+08:00",
    name: "阿托伐他汀钙片 + 血脂平胶囊",
    dosage: "他汀1片，血脂平2粒 (睡前服用)",
    status: "pending",
  },
  {
    id: "schedule-self-walk",
    time: "17:00",
    scheduledAt: "2026-09-18T17:00:00+08:00",
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
    photoUrl: "./assets/snowman-photo-message.jpg",
    familyMediaId: "photo-snowman-message",
    familyMediaType: "photo",
    duration: 7,
    timestamp: "刚刚",
    played: false,
  },
  {
    id: "msg-video-dragon-boat",
    sender: "女儿小敏",
    avatar: "https://picsum.photos/seed/xiaomin/120/120",
    type: "photo",
    content: "悦悦在幼儿园唱了端午节儿歌，专门录给爷爷看。",
    photoUrl: "https://picsum.photos/seed/familygarden/600/450",
    familyMediaId: "video-1",
    familyMediaType: "video",
    timestamp: "今天 10:05",
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
  ...SERVICE_COMMUNICATION_FIXTURES.flatMap((conversation) => conversation.messages
    .map((message): FamilyMessage => {
      const contactDisplayName = conversation.staffName || conversation.contactName;
      const isElderlyReply = message.sender === "elderly";
      return {
        id: message.id,
        sender: isElderlyReply ? "您 (我)" : contactDisplayName,
        recipient: isElderlyReply ? contactDisplayName : undefined,
        avatar: isElderlyReply
          ? "https://picsum.photos/seed/grandfather/120/120"
          : conversation.id === "CONV-CARE-001"
            ? "https://picsum.photos/seed/nurse/240/240"
            : "https://picsum.photos/seed/community-center/240/240",
        type: message.type === "audio" ? "voice" : "text",
        content: message.content ?? (isElderlyReply ? `给${contactDisplayName}的语音回复` : `来自${contactDisplayName}的语音留言`),
        duration: secondsFromDuration(message.duration),
        timestamp: message.sentAt,
        played: isElderlyReply || Boolean(message.elderViewedAt),
        loadFailed: message.deliveryStatus === "failed",
        deliveryStatus: message.deliveryStatus,
        elderViewedAt: message.elderViewedAt,
        replyToMessageId: message.replyToMessageId,
      };
    })),
];

export default function App() {
  const [isDeviceActivated, setIsDeviceActivated] = useState(() => {
    return window.localStorage.getItem("u2g-tablet-activated-v1") === "true";
  });
  const activeFamilyRelationshipCount = getActiveFamilyRelationshipCount();
  const hasBoundFamily = activeFamilyRelationshipCount > 0;

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
    source: "automatic" | "acceptance" | "manual";
    autoDismissMs?: number;
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
  const [familyMediaViewedAt, setFamilyMediaViewedAt] = useState<Record<string, string | null>>(createInitialFamilyMediaViewedAt);
  const [familyMediaFocusRequest, setFamilyMediaFocusRequest] = useState<{ id: number; contactId: string; mediaId: string } | null>(null);
  const [albumInitialMediaId, setAlbumInitialMediaId] = useState<string | null>(null);
  const [familyMediaOpenError, setFamilyMediaOpenError] = useState("");
  const [missedCallCount, setMissedCallCount] = useState(0);
  const [photoHeartStates, setPhotoHeartStates] = useState<Record<string, boolean>>({});

  // 1.10. Reminders & Schedule Secondary Page State
  const [isSchedulePageOpen, setIsSchedulePageOpen] = useState(false);
  const [isCommunityLifeOpen, setIsCommunityLifeOpen] = useState(false);
  const [isCommunityActivitiesOpen, setIsCommunityActivitiesOpen] = useState(false);
  const [isSecurityInformationOpen, setIsSecurityInformationOpen] = useState(false);
  const [securityInformationMode, setSecurityInformationMode] = useState<"security" | "alert">("security");
  const [returnToCommunityLife, setReturnToCommunityLife] = useState(false);
  const [communityActivityInitialId, setCommunityActivityInitialId] = useState<string | null>(null);
  const [communityAlertInitialId, setCommunityAlertInitialId] = useState<string | null>(null);
  const [autoPlaySafetyInformation, setAutoPlaySafetyInformation] = useState(false);
  const [safetyReadIds, setSafetyReadIds] = useState<string[]>(readStoredSafetyIds);
  const [isSpecialServicesOpen, setIsSpecialServicesOpen] = useState(false);
  const [serviceBookings, setServiceBookings] = useState<SpecialServiceBooking[]>(readStoredServiceBookings);
  const [isPersonalProfileOpen, setIsPersonalProfileOpen] = useState(false);
  const [isEntertainmentHubOpen, setIsEntertainmentHubOpen] = useState(false);
  const [isCommunityStaffOpen, setIsCommunityStaffOpen] = useState(false);
  const [homeRecommendationKind, setHomeRecommendationKind] = useState<"security" | "community" | "service" | "entertainment" | null>(null);
  const [fulfillmentRecords, setFulfillmentRecords] = useState<FulfillmentRecord[]>(createInitialFulfillmentRecords);

  // 1.11. More Modules bottom drawer popup state
  const [isMoreModulesOpen, setIsMoreModulesOpen] = useState(false);
  const [externalService, setExternalService] = useState<'meal' | 'clean' | 'repair' | null>(null);
  const [externalActiveApp, setExternalActiveApp] = useState<'tiktok' | 'music' | 'tv' | null>(null);

  // Demo-only interaction acceptance controls. These states never enter the elderly-facing UI.
  const [acceptanceTimeOverride, setAcceptanceTimeOverride] = useState<string | null>(null);
  const [acceptanceAlbumScenario, setAcceptanceAlbumScenario] = useState<AcceptanceAlbumScenario>("default");
  const [acceptanceHeartScenario, setAcceptanceHeartScenario] = useState<AcceptanceHeartScenario>("not-liked");
  const [acceptanceReminderScenario, setAcceptanceReminderScenario] = useState<AcceptanceReminderScenario>("default");
  const [acceptanceRightContentScenario, setAcceptanceRightContentScenario] = useState<AcceptanceRightContentScenario>("default");
  const [acceptanceCommunityScenario, setAcceptanceCommunityScenario] = useState<AcceptanceCommunityScenario>("default");
  const [acceptanceSpecialServicesScenario, setAcceptanceSpecialServicesScenario] = useState<SpecialServicesAcceptanceScenario>("default");
  const [acceptanceCommunityStaffScenario, setAcceptanceCommunityStaffScenario] = useState<CommunityStaffAcceptanceScenario>("multiple");
  const [acceptanceServiceConversationScenario, setAcceptanceServiceConversationScenario] = useState<ServiceConversationAcceptanceScenario>("off");
  const [communityLifeAcceptanceScenario, setCommunityLifeAcceptanceScenario] = useState<CommunityLifeAcceptanceScenario>("default");
  const [communityActivityAcceptanceScenario, setCommunityActivityAcceptanceScenario] = useState<CommunityActivityAcceptanceScenario>("default");
  const [acceptanceRightContentApplySignal, setAcceptanceRightContentApplySignal] = useState(0);
  const [acceptanceRightContentActionSignal, setAcceptanceRightContentActionSignal] = useState(0);
  const [acceptanceEntertainmentFailureSignal, setAcceptanceEntertainmentFailureSignal] = useState(0);
  const [acceptanceServiceConversationActionSignal, setAcceptanceServiceConversationActionSignal] = useState(0);
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
      resetHomeReminderSpeechTracking();
      setHomeReminderAlert(null);
    };
    const timer = window.setInterval(resetAtNewDay, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const resolveNow = () => {
      if (!acceptanceTimeOverride) return new Date();
      if (acceptanceTimeOverride.includes("T")) return new Date(acceptanceTimeOverride);
      const resolved = new Date("2026-09-18T00:00:00+08:00");
      const [hours, minutes] = acceptanceTimeOverride.split(":").map(Number);
      resolved.setHours(hours, minutes, 0, 0);
      return resolved;
    };

    const syncReminderExecutionStatuses = () => {
      const effectiveNow = resolveNow();
      setReminders((current) => {
        let changed = false;
        const next = current.map((reminder) => {
          if (!reminder.scheduledAt || reminder.status === "completed" || reminder.status === "expired") return reminder;
          const scheduledAt = new Date(reminder.scheduledAt);
          const nextDay = new Date(scheduledAt);
          nextDay.setDate(nextDay.getDate() + 1);
          nextDay.setHours(0, 0, 0, 0);
          let nextStatus = reminder.status;
          if (effectiveNow.getTime() >= nextDay.getTime()) nextStatus = "expired";
          else if (reminder.status === "pending" && effectiveNow.getTime() - scheduledAt.getTime() >= 30 * 60 * 1000) nextStatus = "unconfirmed";
          if (nextStatus === reminder.status) return reminder;
          changed = true;
          return { ...reminder, status: nextStatus };
        });
        return changed ? next : current;
      });
    };

    syncReminderExecutionStatuses();
    const timer = window.setInterval(syncReminderExecutionStatuses, 15_000);
    return () => window.clearInterval(timer);
  }, [acceptanceTimeOverride]);

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

  // 5. Digital Photo Album slides. This mirrors child-side published batch snapshots.
  const [photos] = useState<FamilyPhoto[]>(INITIAL_FAMILY_PHOTOS);
  const albumUnreadCount = photos.filter((photo) => !familyMediaViewedAt[photo.id]).length;

  // 6. Voice / Text message inbox state
  const [messages, setMessages] = useState<FamilyMessage[]>(createDefaultMessages);

  const markFamilyMediaViewed = (mediaId: string) => {
    setFamilyMediaViewedAt((current) => current[mediaId]
      ? current
      : { ...current, [mediaId]: new Date().toISOString() });
    setMessages((current) => current.map((message) => message.familyMediaId === mediaId
      ? { ...message, played: true }
      : message));
  };

  const setUnreadFamilyMedia = (mediaIds: string[]) => {
    const unreadIds = new Set(mediaIds);
    setFamilyMediaViewedAt(Object.fromEntries(photos.map((photo) => [
      photo.id,
      unreadIds.has(photo.id) ? null : (photo.viewedAt ?? "2026-09-20T08:00:00+08:00"),
    ])));
    setMessages((current) => current.map((message) => message.familyMediaId
      ? { ...message, played: !unreadIds.has(message.familyMediaId) }
      : message));
  };

  const openFamilyMediaReminder = () => {
    const firstUnread = photos
      .filter((photo) => !familyMediaViewedAt[photo.id])
      .sort((first, second) => (first.publishedAt ?? "").localeCompare(second.publishedAt ?? ""))[0];
    if (!firstUnread) return;

    const relationshipId = acceptanceRightContentScenario === "new-album-invalid-relation"
      ? "removed-family-relationship"
      : firstUnread.uploaderRelationshipId;
    const relationship = getActiveFamilyRelationships().find((item) => item.id === relationshipId);
    const mediaMessageExists = messages.some((message) => message.familyMediaId === firstUnread.id);
    if (!relationship || !mediaMessageExists) {
      setFamilyMediaOpenError("暂时无法打开这条家庭影像");
      window.setTimeout(() => setFamilyMediaOpenError(""), 3200);
      return;
    }

    setFamilyMediaOpenError("");
    setAlbumInitialMediaId(null);
    setFamilyMediaFocusRequest((current) => ({
      id: (current?.id ?? 0) + 1,
      contactId: relationship.id,
      mediaId: firstUnread.id,
    }));
    setIsContactsOpen(true);
  };

  const openFamilyMediaDetail = (mediaId: string) => {
    if (!photos.some((photo) => photo.id === mediaId)) return;
    markFamilyMediaViewed(mediaId);
    setAlbumInitialMediaId(mediaId);
    setFamilyMediaFocusRequest(null);
    setIsContactsOpen(false);
    setIsAlbumPageOpen(true);
  };

  // 7. Community physical Activities list state
  const [activities] = useState<CommunityActivity[]>([
    {
      id: "act-1",
      title: "社区剪纸活动",
      time: "明天上午 10:00 - 11:30",
      location: "社区多功能活动室",
      spotsLeft: 3,
      tag: "手工活动",
      imageUrl: "https://loremflickr.com/720/480/paper-cutting,craft?lock=31",
      description: "社区老师带大家完成一幅简单剪纸作品，材料由社区准备。",
      contact: "010-6258 8890",
      status: "registration",
      liveEnabled: false,
      liveStatus: "not_started",
    },
    {
      id: "act-2",
      title: "防范养老诈骗与智能手机技巧宣讲会",
      time: "明天下午 14:30 - 15:30",
      location: "居委会大楼二楼会议室",
      spotsLeft: 12,
      tag: "安全科普",
      imageUrl: "https://loremflickr.com/720/480/senior,smartphone,class?lock=32",
      description: "社区民警讲解常见养老诈骗，并演示手机来电识别和安全设置。",
      contact: "010-6258 8890",
      status: "registration",
      liveEnabled: false,
      liveStatus: "not_started",
    },
    {
      id: "act-3",
      title: "夏季中医老年膳食养生调理座谈",
      time: "今天上午 10:00 - 11:00",
      location: "社区多功能助老俱乐部（同步直播）",
      spotsLeft: 7,
      tag: "健康膳食",
      imageUrl: "https://loremflickr.com/720/480/senior,healthy-food,class?lock=33",
      description: "社区健康老师介绍夏季饮食搭配和常见食材选择。",
      contact: "010-6258 8890",
      status: "ongoing",
      liveEnabled: true,
      liveStatus: "live",
      scheduledLiveStartAt: "今天上午 10:00",
      liveAccessType: "url",
      playbackUrl: "https://live.example.test/community/act-3",
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
      coverUrl: "https://loremflickr.com/720/480/phone,security?lock=51",
      contactLabel: "联系家人核实",
    },
    {
      id: "tip-2",
      title: "提防“保健品理财讲座、免费送礼品”套路",
      summary: "先不付款、不签字，回家与家人商量后再决定。",
      description: "一些商家会以免费赠送鸡蛋、大米、小家电或者免费体检为由，邀请长者参加所谓的健康讲座。讲座中可能夸大产品功效，宣称某种保健品能够治疗多种疾病，并催促现场付款。\n\n保健食品不能代替药物，也不能治疗疾病。遇到需要支付大额费用、办理会员或者购买多年疗程的情况，请不要当场付款，不要签署自己没有看懂的文件。\n\n可以先把产品名称、宣传单和商家联系方式带回家，与家人、医生或社区工作人员商量后再决定。",
      category: "消费安全",
      source: "社区民警",
      coverUrl: "https://loremflickr.com/720/480/senior,seminar?lock=52",
      contactLabel: "联系家人商量",
    },
    {
      id: "tip-3",
      title: "冒充亲属熟人‘住院急需转账’紧急短信",
      summary: "不要着急汇款，先用家人原来的电话号码核实。",
      description: "如果突然收到自称儿女、孙辈或其他亲属的信息，对方说手机损坏、发生车祸、住院或者被拘留，并要求您立即向陌生账户转账，请先停下来核实。\n\n不要按照信息中的要求保持保密，也不要拨打对方临时提供的新号码。请直接拨打家人平时使用的电话号码，或者联系其他亲属确认情况。\n\n如果暂时联系不上家人，可以请社区工作人员协助。在确认对方真实身份之前，不要进行任何转账操作。",
      category: "亲情诈骗",
      source: "社区民警",
      coverUrl: "https://loremflickr.com/720/480/phone,message?lock=53",
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

  const openSafetyInformation = (autoPlay = false, mode: "security" | "alert" = "security") => {
    setSecurityInformationMode(mode);
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

  const handleCompleteReminder = (id: string, fallbackReminder?: MedicationReminder) => {
    const item = reminders.find((r) => r.id === id || r.name === id || id.includes(r.name) || r.name.includes(id))
      ?? fallbackReminder;
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

  const handleQuickCompleteReminder = (id: string, fallbackReminder?: MedicationReminder) => {
    handleCompleteReminder(id, fallbackReminder);
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
    setIsSchedulePageOpen(false);
    setIsCommunityLifeOpen(false);
    setIsCommunityActivitiesOpen(false);
    setIsSecurityInformationOpen(false);
    setIsSpecialServicesOpen(false);
    setIsEntertainmentHubOpen(false);
    setIsCommunityStaffOpen(false);
    setIsMoreModulesOpen(false);
    setHomeReminderAlert(null);
    setReturnToCommunityLife(false);
    setFamilyMediaFocusRequest(null);
    setFamilyMediaOpenError("");
    setAlbumInitialMediaId(null);
    sendAcceptanceCommand("reset-home-overlays");
  };

  const openAcceptanceHomeReminderAlert = (
    category: AcceptanceTaskContentScenario,
    minutesUntil = 0,
    autoDismissMs?: number,
  ) => {
    const targetId = category === "schedule" ? "schedule-self-walk" : "med-2";
    showHomeForAcceptance();
    const acceptanceReminderTime = acceptanceTimeOverride?.match(/^\d{2}:\d{2}$/)
      ? acceptanceTimeOverride
      : undefined;
    setReminders((current) => current.map((reminder) => (
      reminder.id === targetId
        ? (() => {
            const effectiveNow = acceptanceTimeOverride?.includes("T")
              ? new Date(acceptanceTimeOverride)
              : new Date("2026-09-18T00:00:00+08:00");
            const effectiveTime = acceptanceReminderTime
              ?? (acceptanceTimeOverride?.includes("T")
                ? `${String(effectiveNow.getHours()).padStart(2, "0")}:${String(effectiveNow.getMinutes()).padStart(2, "0")}`
                : reminder.time);
            const [hours, minutes] = effectiveTime.split(":").map(Number);
            effectiveNow.setHours(hours, minutes, 0, 0);
            const scheduledDate = [
              effectiveNow.getFullYear(),
              String(effectiveNow.getMonth() + 1).padStart(2, "0"),
              String(effectiveNow.getDate()).padStart(2, "0"),
            ].join("-");
            return {
              ...reminder,
              time: effectiveTime,
              scheduledAt: `${scheduledDate}T${effectiveTime}:00+08:00`,
              status: "pending" as const,
              takenAt: undefined,
              priority: "P0" as const,
            };
          })()
        : reminder
    )));
    setHomeReminderAlert({
      reminderId: targetId,
      minutesUntil,
      source: "acceptance",
      autoDismissMs,
    });
  };

  const handleAcceptanceWeatherScenario = (scenario: FamilyWeatherMockScenario) => {
    familyWeatherMockApi.reset();
    setFamilyWeatherScenario(scenario);
    setFamilyWeather(familyWeatherMockApi.getSnapshot(scenario));
  };

  const openAcceptanceWeatherScenario = (target: "home" | "detail") => {
    showHomeForAcceptance();
    if (target === "home") {
      sendAcceptanceCommand("reset-home-overlays");
      return;
    }
    sendAcceptanceCommand("open-weather");
  };

  const openAcceptanceEmergencyScenario = (scenario: EmergencyAcceptanceScenario) => {
    showHomeForAcceptance();
    setEmergencyAcceptanceScenario(scenario);
    setIsSOSOpen(true);
  };

  const handleAcceptanceAlbumScenario = (scenario: AcceptanceAlbumScenario) => {
    setAcceptanceAlbumScenario(scenario);
    if (scenario === "notice-photo") setUnreadFamilyMedia(["photo-snowman-message"]);
    if (scenario === "notice-video") setUnreadFamilyMedia(["video-1"]);
    showHomeForAcceptance();
  };

  const handleAcceptanceRightContentScenario = (scenario: AcceptanceRightContentScenario) => {
    const defaults = createDefaultReminders();
    const markMessagesRead = createDefaultMessages().map((message) => ({ ...message, played: true }));
    setAcceptanceRightContentScenario(scenario);
    setAcceptanceRightContentApplySignal(0);
    setAcceptanceRightContentActionSignal(0);
    setAcceptanceEntertainmentFailureSignal(0);
    setMissedCallCount(scenario === "missed-call" ? 2 : 0);
    setUnreadFamilyMedia(
      scenario === "new-album" || scenario === "new-album-invalid-relation"
        ? ["photo-snowman-message", "video-1"]
        : scenario === "time-and-family"
          ? ["photo-snowman-message"]
          : [],
    );
    setMessages(
      scenario === "new-message" || scenario === "interaction-locked"
        ? createDefaultMessages().map((message, index) => ({ ...message, played: index > 2 }))
        : scenario === "new-album" || scenario === "new-album-invalid-relation"
          ? markMessagesRead.map((message) => ({
              ...message,
              played: message.familyMediaId
                ? !["photo-snowman-message", "video-1"].includes(message.familyMediaId)
                : true,
            }))
        : scenario === "time-and-family"
          ? createDefaultMessages().map((message, index) => ({ ...message, played: index > 0 }))
          : markMessagesRead,
    );

    if (scenario === "p1-due") {
      setAcceptanceTimeOverride("13:00");
      setReminders(defaults);
    } else if (scenario === "medication-upcoming" || scenario === "medication-grouped") {
      setAcceptanceTimeOverride("12:40");
      setReminders(scenario === "medication-grouped"
        ? [
            ...defaults,
            {
              id: "med-2-companion",
              time: "13:00",
              scheduledAt: "2026-09-18T13:00:00+08:00",
              name: "维生素D片",
              dosage: "1片（饭后服用）",
              status: "pending",
            },
          ]
        : defaults);
    } else if (scenario === "medication-grace-period") {
      setAcceptanceTimeOverride("2026-09-18T13:29:59+08:00");
      setReminders(defaults);
    } else if (scenario === "medication-unconfirmed") {
      setAcceptanceTimeOverride("2026-09-18T13:30:00+08:00");
      setReminders(defaults.map((reminder) => reminder.id === "med-2"
        ? { ...reminder, status: "unconfirmed" as const }
        : reminder));
    } else if (scenario === "medication-expired") {
      setAcceptanceTimeOverride("2026-09-19T00:00:00+08:00");
      setReminders(defaults.map((reminder) => reminder.id === "med-2"
        ? { ...reminder, status: "expired" as const }
        : reminder));
    } else if (scenario === "schedule-due") {
      setAcceptanceTimeOverride("17:00");
      setReminders(defaults);
    } else if (scenario === "schedule-upcoming" || scenario === "schedule-grouped") {
      setAcceptanceTimeOverride("16:40");
      setReminders(scenario === "schedule-grouped"
        ? [
            ...defaults,
            {
              id: "schedule-water-plants",
              time: "17:00",
              scheduledAt: "2026-09-18T17:00:00+08:00",
              name: "给阳台花草浇水",
              dosage: "浇水后检查窗户",
              status: "pending",
              category: "schedule",
            },
          ]
        : defaults);
    } else if (scenario === "schedule-grace-period") {
      setAcceptanceTimeOverride("2026-09-18T17:29:59+08:00");
      setReminders(defaults);
    } else if (scenario === "schedule-unconfirmed") {
      setAcceptanceTimeOverride("2026-09-18T17:30:00+08:00");
      setReminders(defaults.map((reminder) => reminder.id === "schedule-self-walk"
        ? { ...reminder, status: "unconfirmed" as const }
        : reminder));
    } else if (scenario === "schedule-expired") {
      setAcceptanceTimeOverride("2026-09-19T00:00:00+08:00");
      setReminders(defaults.map((reminder) => reminder.id === "schedule-self-walk"
        ? { ...reminder, status: "expired" as const }
        : reminder));
    } else if (scenario === "activity-started") {
      setAcceptanceTimeOverride("13:10");
      setReminders(defaults);
    } else if (scenario === "activity-upcoming") {
      setAcceptanceTimeOverride("12:40");
      setReminders(defaults);
    } else if (scenario === "activity-updated" || scenario === "activity-cancelled") {
      setAcceptanceTimeOverride("13:10");
      setReminders(defaults.map((reminder) => ({ ...reminder, priority: "P1" as const })));
    } else if (scenario === "reminder-daytime") {
      setAcceptanceTimeOverride("14:00");
      setReminders(defaults.map((reminder) => ({ ...reminder, priority: "P1" as const })));
    } else if (scenario === "reminder-nighttime") {
      setAcceptanceTimeOverride("22:30");
      setReminders(defaults.map((reminder) => ({ ...reminder, priority: "P1" as const })));
    } else if (scenario === "next-day-exit") {
      setAcceptanceTimeOverride("2026-09-16T00:00:00+08:00");
      setReminders(defaults.map((reminder) => ({ ...reminder, priority: "P1" as const })));
    } else if (scenario === "time-and-family") {
      setAcceptanceTimeOverride("12:40");
      setReminders(defaults);
    } else {
      setAcceptanceTimeOverride("10:00");
      setReminders(defaults.map((reminder) => ({ ...reminder, priority: "P1" as const })));
    }
    setAcceptanceRevision((revision) => revision + 1);
    showHomeForAcceptance();
    if (scenario === "p1-due") {
      setHomeReminderAlert({
        reminderId: "med-2",
        minutesUntil: 0,
        source: "acceptance",
      });
    } else if (scenario === "schedule-due") {
      setHomeReminderAlert({
        reminderId: "schedule-self-walk",
        minutesUntil: 0,
        source: "acceptance",
      });
    }
  };

  const openAcceptanceCommunityScenario = (scenario: AcceptanceCommunityScenario) => {
    showHomeForAcceptance();
    setAcceptanceCommunityScenario(scenario);
    setHomeRecommendationKind(null);
    setReturnToCommunityLife(false);

    const activityScenarioMap: Partial<Record<AcceptanceCommunityScenario, CommunityActivityAcceptanceScenario>> = {
      "activity-ended-cancelled": "ended-cancelled",
      "activity-submit-failure": "submission-failure",
      "activity-live-unconfigured": "live-unconfigured",
      "activity-live-not-started": "live-not-started",
      "activity-live-active": "live-active",
      "activity-live-ended": "live-ended",
      "activity-live-cancelled-conflict": "live-cancelled-conflict",
      "activity-live-invalid-access": "live-invalid-access",
      "activity-live-load-failure": "live-load-failure",
      "activity-live-interrupted": "live-interrupted",
    };
    const activityScenario = activityScenarioMap[scenario];

    if (activityScenario) {
      setCommunityActivityAcceptanceScenario(activityScenario);
      setIsCommunityActivitiesOpen(true);
      return;
    }

    setCommunityActivityAcceptanceScenario("default");
    setCommunityLifeAcceptanceScenario(
      scenario === "empty"
        ? "empty"
        : scenario === "load-failure"
          ? "load-failure"
          : scenario.startsWith("topic-")
            ? scenario
            : "default",
    );
    setIsCommunityLifeOpen(true);
  };

  const openAcceptanceSpecialServicesScenario = (scenario: SpecialServicesAcceptanceScenario) => {
    showHomeForAcceptance();
    setAcceptanceSpecialServicesScenario(scenario);
    setHomeRecommendationKind(null);
    setIsSpecialServicesOpen(true);
  };

  const openAcceptanceCommunityStaffScenario = (scenario: CommunityStaffAcceptanceScenario) => {
    showHomeForAcceptance();
    setAcceptanceCommunityStaffScenario(scenario);
    setIsCommunityStaffOpen(true);
  };

  const resetAcceptanceState = () => {
    showHomeForAcceptance();
    setAcceptanceTimeOverride(null);
    setAcceptanceAlbumScenario("default");
    setFamilyMediaViewedAt(createInitialFamilyMediaViewedAt());
    setAcceptanceHeartScenario("not-liked");
    setAcceptanceReminderScenario("default");
    setAcceptanceRightContentScenario("default");
    setAcceptanceCommunityScenario("default");
    setAcceptanceSpecialServicesScenario("default");
    setAcceptanceCommunityStaffScenario("multiple");
    setAcceptanceServiceConversationScenario("off");
    setCommunityLifeAcceptanceScenario("default");
    setCommunityActivityAcceptanceScenario("default");
    setAcceptanceRightContentApplySignal(0);
    setAcceptanceRightContentActionSignal(0);
    setAcceptanceEntertainmentFailureSignal(0);
    setAcceptanceServiceConversationActionSignal(0);
    setMissedCallCount(0);
    setPhotoHeartStates({});
    setReminders(createDefaultReminders());
    setMessages(createDefaultMessages());
    setFulfillmentRecords(createInitialFulfillmentRecords());
    resetHomeReminderSpeechTracking();
    familyWeatherMockApi.reset();
    setFamilyWeatherScenario("default");
    setFamilyWeather(familyWeatherMockApi.getSnapshot("default"));
    setAcceptanceRevision((revision) => revision + 1);
  };

  const isHomeSurfaceActive = isDeviceActivated
    && !isSOSOpen
    && !isContactsOpen
    && !isAssistantOpen
    && !isCelebrationOpen
    && !isAlbumPageOpen
    && !isSchedulePageOpen
    && !isCommunityLifeOpen
    && !isCommunityActivitiesOpen
    && !isSecurityInformationOpen
    && !isSpecialServicesOpen
    && !isEntertainmentHubOpen
    && !isCommunityStaffOpen
    && !isMoreModulesOpen;

  useEffect(() => {
    const syncHomeReminderAlert = () => {
      if (!isHomeSurfaceActive) {
        setHomeReminderAlert((current) => current?.source === "automatic" ? null : current);
        return;
      }

      setHomeReminderAlert((current) => {
        if (current && current.source !== "automatic") return current;

        const now = new Date();
        const dayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        const nextReminder = reminders
          .filter((reminder) => reminder.status === "pending")
          .map((reminder) => {
            const reminderTime = reminder.scheduledAt
              ? new Date(reminder.scheduledAt)
              : (() => {
                  const fallback = new Date(now);
                  const [hours, minutes] = reminder.time.split(":").map(Number);
                  fallback.setHours(hours, minutes, 0, 0);
                  return fallback;
                })();
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

  const openHomeReminderFromRightContent = (reminderId: string, minutesUntil: number) => {
    setHomeReminderAlert({
      reminderId,
      minutesUntil,
      source: "manual",
    });
  };

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
            albumUnreadCount={albumUnreadCount}
            missedCallCount={missedCallCount}
            photoHeartStates={photoHeartStates}
            onTogglePhotoHeart={(photoKey, liked) => {
              setPhotoHeartStates((current) => ({
                ...current,
                [photoKey]: liked,
              }));
              setAcceptanceHeartScenario(liked ? "liked" : "not-liked");
            }}
            onVideoViewed={markFamilyMediaViewed}
            onCompleteReminder={handleQuickCompleteReminder}
            onOpenReminder={openHomeReminderFromRightContent}
            onOpenAlbum={() => {
              setAlbumInitialMediaId(null);
              setIsAlbumPageOpen(true);
            }}
            onOpenFamilyMediaReminder={openFamilyMediaReminder}
            onOpenMessages={() => setIsContactsOpen(true)}
            onOpenSchedule={() => setIsSchedulePageOpen(true)}
            onOpenCommunity={() => {
              setHomeRecommendationKind(null);
              setReturnToCommunityLife(false);
              setCommunityActivityAcceptanceScenario("default");
              setIsCommunityActivitiesOpen(true);
            }}
            onOpenRecommendation={(kind, contentId) => {
              setHomeRecommendationKind(kind);
              if (kind === "community") {
                setReturnToCommunityLife(false);
                setCommunityActivityAcceptanceScenario("default");
                setIsCommunityActivitiesOpen(true);
                return;
              }
              if (kind === "security") {
                openSafetyInformation(false);
                return;
              }
              if (kind === "service") {
                setIsSpecialServicesOpen(true);
                return;
              }
              setIsEntertainmentHubOpen(true);
            }}
            onOpenContacts={() => setIsContactsOpen(true)}
            onOpenAssistant={() => setIsAssistantOpen(true)}
            onOpenMore={() => setIsMoreModulesOpen(true)}
            onTriggerSOS={() => setIsSOSOpen(true)}
            acceptanceTimeOverride={acceptanceTimeOverride}
            acceptanceAlbumScenario={acceptanceAlbumScenario}
            acceptanceHeartScenario={acceptanceHeartScenario}
            acceptanceRightContentScenario={acceptanceRightContentScenario}
            acceptanceRightContentApplySignal={acceptanceRightContentApplySignal}
            acceptanceRightContentActionSignal={acceptanceRightContentActionSignal}
            acceptanceRevision={acceptanceRevision}
            acceptanceCommand={acceptanceCommand}
            familyWeather={familyWeather}
          />

        {activeHomeReminder && homeReminderAlert && (
          <HomeReminderAlert
            reminder={activeHomeReminder}
            minutesUntil={homeReminderAlert.minutesUntil}
            onComplete={() => handleCompleteReminder(activeHomeReminder.id)}
            onDismiss={dismissHomeReminderAlert}
            currentTime={(() => {
              if (!acceptanceTimeOverride) return new Date();
              if (acceptanceTimeOverride.includes("T")) return new Date(acceptanceTimeOverride);
              const currentTime = new Date();
              const [hours, minutes] = acceptanceTimeOverride.split(":").map(Number);
              currentTime.setHours(hours, minutes, 0, 0);
              return currentTime;
            })()}
            autoDismissMs={homeReminderAlert.source === "manual" ? null : homeReminderAlert.autoDismissMs}
            shouldSpeak={homeReminderAlert.source !== "manual"}
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
          onClose={() => {
            setIsContactsOpen(false);
            setFamilyMediaFocusRequest(null);
          }}
          hasBoundFamily={hasBoundFamily}
          messages={messages}
          missedCallCount={missedCallCount}
          acceptanceScenario={acceptanceServiceConversationScenario}
          acceptanceActionSignal={acceptanceServiceConversationActionSignal}
          familyMediaFocusRequest={familyMediaFocusRequest}
          onFamilyMediaViewed={markFamilyMediaViewed}
          onOpenFamilyMedia={openFamilyMediaDetail}
          onAddMessage={(newMessage) => setMessages((currentMessages) => [...currentMessages, newMessage])}
          onMarkRead={(messageId) => setMessages((currentMessages) => currentMessages.map((message) => message.id === messageId
            ? {
                ...message,
                played: true,
                ...(message.deliveryStatus ? { elderViewedAt: message.elderViewedAt ?? "刚刚" } : {}),
              }
            : message))}
          onClearMissedCalls={() => {
            setMissedCallCount(0);
            if (acceptanceRightContentScenario === "missed-call") setAcceptanceRightContentScenario("default");
          }}
        />

        {/* FAMILY ALBUM SECONDARY FULL SCREEN PAGE */}
        <FamilyAlbumPage
          isOpen={isAlbumPageOpen}
          onClose={() => setIsAlbumPageOpen(false)}
          photos={photos}
          viewedMediaIds={Object.keys(familyMediaViewedAt).filter((mediaId) => Boolean(familyMediaViewedAt[mediaId]))}
          initialMediaId={albumInitialMediaId}
          onMediaViewed={markFamilyMediaViewed}
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

        <CommunityLifePage
          isOpen={isCommunityLifeOpen}
          acceptanceScenario={communityLifeAcceptanceScenario}
          activities={activities}
          alerts={scamTips}
          alertReadIds={safetyReadIds}
          onClose={() => setIsCommunityLifeOpen(false)}
          onOpenActivity={(activityId) => {
            setIsCommunityLifeOpen(false);
            setReturnToCommunityLife(true);
            setCommunityActivityAcceptanceScenario("default");
            setCommunityActivityInitialId(activityId);
            setIsCommunityActivitiesOpen(true);
          }}
          onOpenAlert={(alertId) => {
            setIsCommunityLifeOpen(false);
            setReturnToCommunityLife(true);
            setCommunityAlertInitialId(alertId);
            openSafetyInformation(false, "alert");
          }}
        />

        <CommunityActivitiesPage
          isOpen={isCommunityActivitiesOpen}
          initialActivityId={communityActivityInitialId ?? (homeRecommendationKind === "community" ? "act-1" : null)}
          acceptanceScenario={communityActivityAcceptanceScenario}
          onClose={() => {
            setIsCommunityActivitiesOpen(false);
            setCommunityActivityAcceptanceScenario("default");
            setCommunityActivityInitialId(null);
            if (returnToCommunityLife) {
              setReturnToCommunityLife(false);
              setIsCommunityLifeOpen(true);
            } else if (homeRecommendationKind === "community") setHomeRecommendationKind(null);
          }}
          activities={activities}
        />

        <SecurityInformationPage
          isOpen={isSecurityInformationOpen}
          pageTitle={securityInformationMode === "alert" ? "警惕事项" : "安全资讯"}
          autoPlayFeatured={autoPlaySafetyInformation}
          initialTipId={communityAlertInitialId ?? (homeRecommendationKind === "security" ? "tip-1" : null)}
          tips={scamTips}
          readIds={safetyReadIds}
          onRead={handleReadSafetyTip}
          onClose={() => {
            setIsSecurityInformationOpen(false);
            setAutoPlaySafetyInformation(false);
            setSecurityInformationMode("security");
            setCommunityAlertInitialId(null);
            if (returnToCommunityLife) {
              setReturnToCommunityLife(false);
              setIsCommunityLifeOpen(true);
            } else if (homeRecommendationKind === "security") setHomeRecommendationKind(null);
          }}
          onContactFamily={() => {
            setIsSecurityInformationOpen(false);
            setAutoPlaySafetyInformation(false);
            setReturnToCommunityLife(false);
            setSecurityInformationMode("security");
            setIsContactsOpen(true);
          }}
        />

        <SpecialServicesPage
          isOpen={isSpecialServicesOpen}
          initialServiceId={homeRecommendationKind === "service" ? "cleaning" : null}
          acceptanceScenario={acceptanceSpecialServicesScenario}
          bookings={serviceBookings}
          onClose={() => {
            setIsSpecialServicesOpen(false);
            if (homeRecommendationKind === "service") setHomeRecommendationKind(null);
          }}
          onBook={handleBookService}
          onCancelBooking={handleCancelServiceBooking}
        />

        <EntertainmentHubPage
          isOpen={isEntertainmentHubOpen}
          onClose={() => setIsEntertainmentHubOpen(false)}
          forceEmpty={acceptanceRightContentScenario === "no-content"}
          openShouldFail={acceptanceEntertainmentFailureSignal > 0}
          failureSignal={acceptanceEntertainmentFailureSignal}
        />

        <CommunityStaffPage
          isOpen={isCommunityStaffOpen}
          onClose={() => setIsCommunityStaffOpen(false)}
          acceptanceScenario={acceptanceCommunityStaffScenario}
        />

        <PersonalProfilePage
          isOpen={isPersonalProfileOpen}
          onClose={() => setIsPersonalProfileOpen(false)}
          profile={elderProfileMock}
          boundFamilyCount={activeFamilyRelationshipCount}
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
          onOpenAlbum={() => {
            setAlbumInitialMediaId(null);
            setIsAlbumPageOpen(true);
          }}
          onOpenContacts={() => setIsContactsOpen(true)}
          onOpenReminders={() => setIsSchedulePageOpen(true)}
          onOpenCommunity={() => {
            setHomeRecommendationKind(null);
            setCommunityLifeAcceptanceScenario("default");
            setIsCommunityLifeOpen(true);
          }}
          onOpenSpecialServices={() => {
            setHomeRecommendationKind(null);
            setIsSpecialServicesOpen(true);
          }}
          onOpenEntertainment={() => {
            setHomeRecommendationKind(null);
            setIsEntertainmentHubOpen(true);
          }}
          onOpenCommunityStaff={() => {
            setAcceptanceCommunityStaffScenario("multiple");
            setIsCommunityStaffOpen(true);
          }}
          onOpenProfile={() => setIsPersonalProfileOpen(true)}
        />

        </div>
      </TabletSimulator>
      {familyMediaOpenError && (
        <div className="family-media-open-error" role="status" aria-live="polite">
          {familyMediaOpenError}
        </div>
      )}
      <InteractionAcceptanceConsole
        weatherScenario={familyWeatherScenario}
        albumScenario={acceptanceAlbumScenario}
        heartScenario={acceptanceHeartScenario}
        reminderScenario={acceptanceReminderScenario}
        rightContentScenario={acceptanceRightContentScenario}
        communityScenario={acceptanceCommunityScenario}
        serviceScenario={acceptanceSpecialServicesScenario}
        communityStaffScenario={acceptanceCommunityStaffScenario}
        serviceConversationScenario={acceptanceServiceConversationScenario}
        onShowHome={showHomeForAcceptance}
        onShowAlbum={() => {
          showHomeForAcceptance();
          setIsAlbumPageOpen(true);
        }}
        onShowReminders={() => {
          showHomeForAcceptance();
          setIsSchedulePageOpen(true);
        }}
        onShowCommunity={() => openAcceptanceCommunityScenario(acceptanceCommunityScenario)}
        onShowServices={() => openAcceptanceSpecialServicesScenario(acceptanceSpecialServicesScenario)}
        onShowCommunityStaff={() => openAcceptanceCommunityStaffScenario(acceptanceCommunityStaffScenario)}
        onShowContacts={(scenario) => {
          showHomeForAcceptance();
          setIsContactsOpen(true);
          if (scenario === "call-timeout") {
            setAcceptanceServiceConversationActionSignal((signal) => signal + 1);
          }
        }}
        onSetWeatherScenario={handleAcceptanceWeatherScenario}
        onOpenWeatherScenario={openAcceptanceWeatherScenario}
        onSetAlbumScenario={handleAcceptanceAlbumScenario}
        onSetHeartScenario={setAcceptanceHeartScenario}
        onSetReminderScenario={setAcceptanceReminderScenario}
        onSetRightContentScenario={handleAcceptanceRightContentScenario}
        onSetCommunityScenario={openAcceptanceCommunityScenario}
        onSetServiceScenario={openAcceptanceSpecialServicesScenario}
        onSetCommunityStaffScenario={openAcceptanceCommunityStaffScenario}
        onSetServiceConversationScenario={setAcceptanceServiceConversationScenario}
        onActivateRightContent={() => {
          setAcceptanceEntertainmentFailureSignal(0);
          setAcceptanceRightContentActionSignal((signal) => signal + 1);
        }}
        onOpenEntertainmentFailure={() => {
          handleAcceptanceRightContentScenario("third-party-entertainment");
          setAcceptanceEntertainmentFailureSignal((signal) => signal + 1);
          setIsEntertainmentHubOpen(true);
        }}
        onApplyRightContentUpdate={() => setAcceptanceRightContentApplySignal((signal) => signal + 1)}
        onOpenHomeReminderAlert={openAcceptanceHomeReminderAlert}
        onHomeCommand={sendAcceptanceCommand}
        onOpenEmergencyScenario={openAcceptanceEmergencyScenario}
        onOpenActivation={() => {
          window.localStorage.removeItem("u2g-tablet-activated-v1");
          setIsDeviceActivated(false);
        }}
        onReset={resetAcceptanceState}
      />
    </>
  );
}
