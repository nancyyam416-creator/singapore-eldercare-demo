import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  AlarmClock,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleEllipsis,
  CloudOff,
  CloudSun,
  Clock3,
  DatabaseBackup,
  Heart,
  HandHeart,
  Image,
  Landmark,
  MapPinOff,
  MessageCircleHeart,
  Mic,
  PanelRightClose,
  PanelRightOpen,
  Pill,
  Play,
  PhoneCall,
  RefreshCcw,
  ShieldAlert,
  Siren,
  Sparkles,
  TabletSmartphone,
  UserMinus,
  UserRoundCheck,
  UsersRound,
  Video,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import type { FamilyWeatherMockScenario } from "../weather/familyWeather";
import type { EmergencyAcceptanceScenario } from "./EmergencyModal";
import { emergencyScenarioDefinitions } from "../emergency-assistance";
import type { SpecialServicesAcceptanceScenario } from "./SpecialServicesPage";
import type { CommunityStaffAcceptanceScenario } from "./CommunityStaffPage";
import type { ServiceConversationAcceptanceScenario } from "./ContactsCommunicationPage";
import type {
  FamilyRelationshipRequestCondition,
  FamilyRelationshipRequestScenario,
} from "./FamilyRelationshipRequestsModal";
import {
  activationScenarioDefinitions,
  type ActivationAcceptanceScenario,
  type ActivationContractState,
} from "../activation-contract";
import "./interaction-acceptance-console.css";

export type AcceptanceTaskContentScenario = "medicine" | "schedule";
export type AcceptanceAlbumScenario =
  | "default"
  | "notice-photo"
  | "notice-video"
  | "video-failure"
  | "empty"
  | "single"
  | "load-failure";
export type AcceptanceHeartScenario = "not-liked" | "sending" | "liked" | "failure";
export type AcceptanceReminderScenario =
  | "default"
  | "due-popup"
  | "due"
  | "not-yet"
  | "empty"
  | "all-completed"
  | "unconfirmed-today"
  | "expired-history"
  | "elder-created"
  | "other-created"
  | "medication-validation"
  | "external-repeat"
  | "action-failure";
export type AcceptanceRightContentScenario =
  | "default"
  | "recommendations-only"
  | "new-message"
  | "new-album"
  | "missed-call"
  | "time-and-family"
  | "p1-due"
  | "medication-upcoming"
  | "medication-grace-period"
  | "medication-unconfirmed"
  | "medication-grouped"
  | "medication-expired"
  | "schedule-due"
  | "schedule-upcoming"
  | "schedule-grace-period"
  | "schedule-unconfirmed"
  | "schedule-grouped"
  | "schedule-expired"
  | "activity-started"
  | "activity-upcoming"
  | "activity-updated"
  | "activity-cancelled"
  | "activity-reminder-valid"
  | "activity-reminder-registration-cancelled"
  | "activity-reminder-activity-cancelled"
  | "reminder-daytime"
  | "reminder-nighttime"
  | "next-day-exit"
  | "recommendation-order"
  | "single-recommendation"
  | "third-party-entertainment"
  | "third-party-entertainment-failure"
  | "no-content"
  | "ai-assistant-fallback"
  | "interaction-locked"
  | "same-priority-event-content";
export type AcceptanceRightContentCondition = "relationship-valid" | "relationship-invalid";
export type AcceptanceCommunityScenario =
  | "default"
  | "empty"
  | "load-failure"
  | "topic-normal"
  | "topic-elder"
  | "topic-backend"
  | "topic-standalone"
  | "topic-reference"
  | "topic-no-comments"
  | "topic-multiple-comments"
  | "topic-reference-expired"
  | "topic-closed"
  | "topic-publish-failure"
  | "topic-comment-failure"
  | "topic-empty"
  | "topic-load-failure"
  | "activity-ended-cancelled"
  | "activity-submit-failure"
  | "activity-live-unconfigured"
  | "activity-live-not-started"
  | "activity-live-active"
  | "activity-live-ended"
  | "activity-live-cancelled-conflict"
  | "activity-live-invalid-access"
  | "activity-live-load-failure"
  | "activity-live-interrupted";
export type AcceptanceHomeCommand =
  | "reset-home-overlays"
  | "previous-photo"
  | "next-photo"
  | "show-photo-controls"
  | "open-weather";

interface InteractionAcceptanceConsoleProps {
  weatherScenario: FamilyWeatherMockScenario;
  albumScenario: AcceptanceAlbumScenario;
  heartScenario: AcceptanceHeartScenario;
  reminderScenario: AcceptanceReminderScenario;
  rightContentScenario: AcceptanceRightContentScenario;
  rightContentCondition: AcceptanceRightContentCondition;
  communityScenario: AcceptanceCommunityScenario;
  serviceScenario: SpecialServicesAcceptanceScenario;
  communityStaffScenario: CommunityStaffAcceptanceScenario;
  serviceConversationScenario: ServiceConversationAcceptanceScenario;
  familyRequestScenario: FamilyRelationshipRequestScenario;
  familyRequestCondition: FamilyRelationshipRequestCondition;
  activationScenario: ActivationAcceptanceScenario;
  activationContractState: ActivationContractState;
  emergencyScenario: EmergencyAcceptanceScenario;
  onShowHome: () => void;
  onShowAlbum: () => void;
  onShowReminders: () => void;
  onShowCommunity: () => void;
  onShowServices: () => void;
  onShowCommunityStaff: () => void;
  onShowContacts: (scenario?: ServiceConversationAcceptanceScenario) => void;
  onShowFamilyRequests: () => void;
  onSetWeatherScenario: (scenario: FamilyWeatherMockScenario) => void;
  onOpenWeatherScenario: (target: WeatherAcceptanceTarget) => void;
  onSetAlbumScenario: (scenario: AcceptanceAlbumScenario) => void;
  onSetHeartScenario: (scenario: AcceptanceHeartScenario) => void;
  onSetReminderScenario: (scenario: AcceptanceReminderScenario) => void;
  onSetRightContentScenario: (scenario: AcceptanceRightContentScenario) => void;
  onSetRightContentCondition: (condition: AcceptanceRightContentCondition) => void;
  onSetCommunityScenario: (scenario: AcceptanceCommunityScenario) => void;
  onSetServiceScenario: (scenario: SpecialServicesAcceptanceScenario) => void;
  onSetCommunityStaffScenario: (scenario: CommunityStaffAcceptanceScenario) => void;
  onSetServiceConversationScenario: (scenario: ServiceConversationAcceptanceScenario) => void;
  onSetFamilyRequestScenario: (scenario: FamilyRelationshipRequestScenario) => void;
  onSetFamilyRequestCondition: (condition: FamilyRelationshipRequestCondition) => void;
  onSetActivationScenario: (scenario: ActivationAcceptanceScenario) => void;
  onActivateRightContent: () => void;
  onOpenEntertainmentFailure: () => void;
  onApplyRightContentUpdate: () => void;
  onOpenHomeReminderAlert: (category: AcceptanceTaskContentScenario, minutesUntil?: number, autoDismissMs?: number) => void;
  onHomeCommand: (command: AcceptanceHomeCommand) => void;
  onSetEmergencyScenario: (scenario: EmergencyAcceptanceScenario) => void;
  onOpenEmergencyScenario: (scenario: EmergencyAcceptanceScenario) => void;
  onOpenActivation: () => void;
  onResetActivation: () => void;
  onReset: () => void;
}

type AcceptanceConsoleSection = "weather" | "emergency" | "album" | "task-progress" | "reminders" | "community-life" | "special-services" | "community-staff" | "family-requests" | "service-messages" | "activation";
type AcceptanceConsolePage = "home" | "family-album" | "reminders" | "community-life" | "special-services" | "community-staff" | "contacts" | "activation";
type WeatherAcceptanceTarget = "home" | "detail";
type RightContentAcceptanceObject = "family" | "medication" | "schedule" | "activity" | "recommendation" | "queue";

const acceptanceSectionOptions: Array<{ id: AcceptanceConsoleSection; label: string }> = [
  { id: "weather", label: "家庭天气" },
  { id: "emergency", label: "在线协助" },
  { id: "album", label: "家庭影像" },
  { id: "task-progress", label: "首页右侧" },
  { id: "reminders", label: "今日提醒" },
  { id: "community-life", label: "社区生活" },
  { id: "special-services", label: "特约服务" },
  { id: "community-staff", label: "社区人员" },
  { id: "family-requests", label: "家人申请" },
  { id: "service-messages", label: "通讯录与家庭互动" },
  { id: "activation", label: "激活流程" },
];

const acceptancePageOptions: Array<{ id: AcceptanceConsolePage; label: string; sections: AcceptanceConsoleSection[] }> = [
  { id: "home", label: "首页", sections: ["weather", "emergency", "album", "task-progress"] },
  { id: "family-album", label: "家庭相册", sections: ["album"] },
  { id: "reminders", label: "提醒事项", sections: ["reminders"] },
  { id: "community-life", label: "社区生活", sections: ["community-life"] },
  { id: "special-services", label: "特约服务", sections: ["special-services"] },
  { id: "community-staff", label: "社区人员", sections: ["community-staff"] },
  { id: "contacts", label: "通讯录", sections: ["family-requests", "service-messages"] },
  { id: "activation", label: "设备激活", sections: ["activation"] },
];

interface AcceptanceConsoleDragState {
  pointerId: number;
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
  startLeft: number;
  startTop: number;
  width: number;
  height: number;
}

const rightContentScenarioLabels: Record<AcceptanceRightContentScenario, { label: string; description: string }> = {
  default: { label: "默认单按钮", description: "合并时间提醒、家庭互动和内容推荐，只展示当前最高优先级内容。" },
  "recommendations-only": { label: "查看推荐内容", description: "点击右侧推荐，进入对应内容。" },
  "new-message": { label: "家人给您留言了", description: "右侧显示未读数量；点击后进入通讯录查看留言，已查看内容不再计数。" },
  "new-album": { label: "家人分享了新影像", description: "点击后进入上传人的一对一会话，并定位最早一条未查看影像记录；打开对应影像详情后更新该条状态。" },
  "missed-call": { label: "您有未接来电", description: "右侧显示未接次数；点击后进入通讯录查看通话记录。" },
  "time-and-family": { label: "时间与家庭同时产生", description: "两类内容同时进入候选，由同一个大按钮展示当前优先项。" },
  "p1-due": { label: "该用药了", description: "到达执行时间后显示到点弹窗；关闭弹窗后提醒仍保留在右侧，点击单条提醒直达确认界面。" },
  "medication-upcoming": { label: "用药时间快到了", description: "进入到点前30分钟后显示临近提醒，不弹出到点弹窗；点击单条提醒直达确认界面。" },
  "medication-grace-period": { label: "该用药了（29分59秒）", description: "仍处于到点强提醒；不重复弹窗或播报，右侧继续保留。" },
  "medication-unconfirmed": { label: "用药尚未确认（30分钟）", description: "到点满30分钟转为未确认并退出右侧，在今日全览中仍可处理。" },
  "medication-grouped": { label: "同一时间多项用药", description: "同时间、同阶段的多项用药合并展示；点击右侧进入今日全览。" },
  "medication-expired": { label: "用药次日已过期", description: "切换至次日00:00；记录转为已过期，退出首页右侧和今日全览，历史记录保留。" },
  "schedule-due": { label: "该做事项了", description: "到达执行时间后显示到点弹窗；关闭弹窗后事项仍保留在右侧，点击单条事项直达确认界面。" },
  "schedule-upcoming": { label: "事项时间快到了", description: "进入到点前30分钟后显示临近提醒；点击单条事项直达确认界面。" },
  "schedule-grace-period": { label: "该做事项了（29分59秒）", description: "仍处于到点强提醒；不重复弹窗或播报，右侧继续保留。" },
  "schedule-unconfirmed": { label: "事项尚未完成（30分钟）", description: "到点满30分钟转为未确认并退出右侧，在今日全览中仍可处理。" },
  "schedule-grouped": { label: "同一时间多项事项", description: "同时间、同阶段的多项事项合并展示；点击右侧进入今日全览。" },
  "schedule-expired": { label: "事项次日已过期", description: "切换至次日00:00；记录转为已过期，退出首页右侧和今日全览，历史记录保留。" },
  "activity-started": { label: "活动开始了", description: "到达活动开始时间后显示活动名称；点击右侧进入社区活动。" },
  "activity-upcoming": { label: "活动快开始了", description: "活动开始前30分钟显示开始时间和活动名称；点击右侧进入社区活动。" },
  "activity-updated": { label: "活动信息已更新", description: "不弹窗、不语音，右侧直接读取更新后的活动时间和地点。" },
  "activity-cancelled": { label: "活动已取消", description: "取消活动立即退出右侧候选，继续展示下一条有效内容。" },
  "activity-reminder-valid": { label: "报名成功 · 开始前30分钟", description: "活动和报名均有效时生成一次开始提醒；关闭后再次触发同一报名不会重复提醒。" },
  "activity-reminder-registration-cancelled": { label: "报名已取消 · 不提醒", description: "报名取消后不生成活动开始提醒，首页继续展示原有内容。" },
  "activity-reminder-activity-cancelled": { label: "活动已取消 · 不提醒", description: "活动取消后不生成活动开始提醒，首页继续展示原有内容。" },
  "reminder-daytime": { label: "日间首次播报", description: "固定日间时间；同一提醒仅首次到点进行语音播报。" },
  "reminder-nighttime": { label: "夜间静默提醒", description: "固定22:30；弹窗和右侧候选保留，但不进行语音播报。" },
  "next-day-exit": { label: "次日00:00退出", description: "当天未处理推荐退出首页候选，不删除内容、不生成完成记录。" },
  "recommendation-order": { label: "后台顺序轮换", description: "按后台展示顺序；同序时按创建时间从早到晚稳定轮换。" },
  "single-recommendation": { label: "仅一条推荐", description: "后台只有一条有效内容时持续展示，不因计时进入冷却或消失。" },
  "third-party-entertainment": { label: "休闲娱乐推荐", description: "右侧展示当前娱乐推荐；点击后进入休闲娱乐内容。" },
  "third-party-entertainment-failure": { label: "娱乐内容打开失败", description: "点击首页娱乐内容，再点任一内容入口，显示失败提示。" },
  "no-content": { label: "无待展示消息", description: "当前没有任何高、中、低级消息时，右侧固定显示 AI 语音入口。" },
  "ai-assistant-fallback": { label: "AI 兜底让位与恢复", description: "无消息时显示 AI 语音；低级消息进入后立即让位，清空消息后自动恢复。AI 不入队、不计数、不生成送达记录。" },
  "interaction-locked": { label: "操作中暂不换位", description: "正在操作右侧内容时先记录新留言，结束后再应用新排序。" },
  "same-priority-event-content": { label: "同级提醒同时触发", description: "到期日程与警惕事项同时进入队列；先展示事件，关闭或处理后再展示内容，提醒不合并、不覆盖。" },
};

const rightContentConditionLabels: Record<AcceptanceRightContentCondition, { label: string; description: string }> = {
  "relationship-valid": {
    label: "上传人关系有效",
    description: "首页提醒不变；点击后进入上传人的当前一对一会话，可继续留言或通话。",
  },
  "relationship-invalid": {
    label: "上传人关系已失效",
    description: "首页提醒不变；点击后进入原历史会话，历史影像可查看，会话只读。",
  },
};

const rightContentAcceptanceObjects: Array<{
  id: RightContentAcceptanceObject;
  label: string;
  scenarios: AcceptanceRightContentScenario[];
}> = [
  {
    id: "family",
    label: "家庭互动",
    scenarios: ["new-message", "new-album", "missed-call"],
  },
  {
    id: "medication",
    label: "用药",
    scenarios: ["p1-due", "medication-upcoming", "medication-grace-period", "medication-grouped"],
  },
  {
    id: "schedule",
    label: "日常事项",
    scenarios: ["schedule-upcoming", "schedule-due", "schedule-grace-period", "schedule-grouped"],
  },
  {
    id: "activity",
    label: "社区活动",
    scenarios: [
      "activity-upcoming",
      "activity-started",
      "activity-reminder-valid",
      "activity-reminder-registration-cancelled",
      "activity-reminder-activity-cancelled",
    ],
  },
  {
    id: "recommendation",
    label: "内容推荐",
    scenarios: ["recommendations-only", "third-party-entertainment", "no-content", "ai-assistant-fallback"],
  },
  {
    id: "queue",
    label: "同时触发队列",
    scenarios: ["same-priority-event-content"],
  },
];

const rightContentInteractionScenarios = rightContentAcceptanceObjects.flatMap((item) => item.scenarios);

const rightContentActionLabels: Partial<Record<AcceptanceRightContentScenario, string>> = {
  "recommendations-only": "打开推荐内容",
  "new-message": "查看家人留言",
  "new-album": "定位未查看影像",
  "missed-call": "查看未接来电",
  "p1-due": "打开用药确认",
  "medication-upcoming": "打开用药确认",
  "medication-grace-period": "打开用药确认",
  "medication-grouped": "打开今日全览",
  "schedule-upcoming": "打开事项确认",
  "schedule-due": "打开事项确认",
  "schedule-grace-period": "打开事项确认",
  "schedule-grouped": "打开今日全览",
  "activity-upcoming": "查看活动详情",
  "activity-started": "查看活动详情",
  "activity-reminder-valid": "再次触发同一报名",
  "activity-reminder-registration-cancelled": "检查开始提醒",
  "activity-reminder-activity-cancelled": "检查开始提醒",
  "third-party-entertainment": "打开休闲娱乐",
  "ai-assistant-fallback": "打开 AI 助手",
  "same-priority-event-content": "重新演示提醒顺序",
};

const albumLabels: Record<AcceptanceAlbumScenario, string> = {
  default: "正常轮播",
  "notice-photo": "新照片未查看",
  "notice-video": "新视频未查看",
  "video-failure": "视频播放失败",
  empty: "暂无家庭影像",
  single: "仅有一项",
  "load-failure": "影像加载失败",
};

const homeAlbumScenarios: AcceptanceAlbumScenario[] = ["default", "video-failure", "empty", "single", "load-failure"];
const familyAlbumScenarios: AcceptanceAlbumScenario[] = ["default", "notice-photo", "notice-video", "video-failure", "empty", "single", "load-failure"];

const heartLabels: Record<AcceptanceHeartScenario, string> = {
  "not-liked": "未喜欢",
  sending: "喜欢中",
  liked: "已喜欢",
  failure: "喜欢失败",
};

const reminderLabels: Record<AcceptanceReminderScenario, string> = {
  default: "正常提醒",
  "due-popup": "到点弹窗提醒",
  due: "待完成",
  "not-yet": "未到时间",
  "all-completed": "已完成",
  "unconfirmed-today": "当日未确认",
  "expired-history": "次日已过期只读",
  "elder-created": "本人创建可编辑删除",
  "other-created": "他端创建只读",
  "medication-validation": "用药剂量/用法校验",
  "external-repeat": "外部日期与重复规则",
  "action-failure": "确认失败",
  empty: "空列表",
};

const communityScenarioLabels: Record<AcceptanceCommunityScenario, { label: string; description: string }> = {
  default: { label: "五类正常内容", description: "公告、资讯、话题、活动和警惕事项均可进入。" },
  empty: { label: "当前分类无内容", description: "展示温和空状态，不影响其他模块。" },
  "load-failure": { label: "内容加载失败", description: "展示失败提示并支持重新加载。" },
  "topic-normal": { label: "话题正常", description: "展示话题列表、引用摘要和评论数量。" },
  "topic-elder": { label: "老人发起", description: "展示当前老人发起且可继续评论的话题。" },
  "topic-backend": { label: "后台发起", description: "后台发布的话题同样支持查看和评论。" },
  "topic-standalone": { label: "独立发起", description: "不引用资讯，填写标题和想说的话。" },
  "topic-reference": { label: "引用资讯", description: "从生活资讯带入整篇资讯引用卡片。" },
  "topic-no-comments": { label: "暂无评论", description: "详情显示温和空状态和评论输入。" },
  "topic-multiple-comments": { label: "多条一级评论", description: "所有评论直接属于话题，不做楼中楼。" },
  "topic-reference-expired": { label: "引用已失效", description: "保留资讯快照并说明原文不可查看。" },
  "topic-closed": { label: "话题已关闭", description: "可读正文和历史评论，不可新增评论。" },
  "topic-publish-failure": { label: "发布失败", description: "保留填写内容并支持重新提交。" },
  "topic-comment-failure": { label: "评论失败", description: "保留评论内容并支持重试。" },
  "topic-empty": { label: "话题空列表", description: "无话题时保留发起话题入口。" },
  "topic-load-failure": { label: "话题加载失败", description: "话题列表失败并提供重试。" },
  "activity-ended-cancelled": { label: "活动结束/取消", description: "不可再选择参加意向，活动状态优先展示。" },
  "activity-submit-failure": { label: "意向提交失败", description: "保留原选择并支持重新提交。" },
  "activity-live-unconfigured": { label: "活动未配置直播", description: "不显示直播信息和直播入口。" },
  "activity-live-not-started": { label: "直播未开始", description: "显示预计开播时间，暂不可进入。" },
  "activity-live-active": { label: "直播进行中", description: "访问配置有效，可进入和退出直播。" },
  "activity-live-ended": { label: "直播已结束", description: "保留直播状态，不允许再次进入。" },
  "activity-live-cancelled-conflict": { label: "活动取消但直播为 live", description: "活动取消优先，直播入口不可进入。" },
  "activity-live-invalid-access": { label: "直播地址失效", description: "直播中但访问配置无效，入口禁用。" },
  "activity-live-load-failure": { label: "直播加载失败", description: "进入后显示加载失败，可重新加载或退出。" },
  "activity-live-interrupted": { label: "直播中断", description: "进入后显示中断状态，可重新连接或退出。" },
};

const specialServicesScenarioLabels: Record<SpecialServicesAcceptanceScenario, { label: string; description: string }> = {
  default: { label: "五类正常服务", description: "五类服务均有可预约内容，可筛选并进入详情预约。" },
  "no-services": { label: "暂无可预约服务", description: "全部服务都不可预约时展示统一空状态。" },
  "filter-empty": { label: "当前筛选变为空", description: "保留当前分类并提示返回全部服务。" },
  "category-load-failure": { label: "分类加载失败", description: "不虚构分类，展示失败提示与重新加载。" },
  "category-disabled": { label: "分类已停用", description: "停用分类及其服务不进入老人端列表。" },
};

const communityStaffScenarioLabels: Record<CommunityStaffAcceptanceScenario, { label: string; description: string }> = {
  multiple: { label: "多人列表", description: "同屏展示四位已启用人员及完整联系信息。" },
  single: { label: "单人", description: "只展示一位社区服务负责人及完整联系信息。" },
  "multiple-time-slots": { label: "多服务时间", description: "卡片内完整展示多个对外服务时间段。" },
  empty: { label: "暂无人员", description: "没有已启用人员时展示统一空状态。" },
};

const serviceConversationScenarioLabels: Record<Exclude<ServiceConversationAcceptanceScenario, "off">, { label: string; description: string }> = {
  normal: { label: "正常留言", description: "查看文字和语音留言，并完整走通语音回复。" },
  empty: { label: "暂无留言", description: "服务联系人当前没有历史留言。" },
  "playback-failure": { label: "语音播放失败", description: "首次播放失败，页面内可直接重试。" },
  "send-failure": { label: "回复发送失败", description: "直接展示发送失败结果，录音已保留并可重试。" },
  "incoming-voice": { label: "家人语音来电", description: "展示独立来电界面，可接听或拒绝。" },
  "incoming-video": { label: "家人视频来电", description: "接听后进入视频通话，可控制静音、扬声器和画面。" },
  "call-timeout": { label: "呼出无人接听", description: "发起语音呼叫后进入等待，无人接听时自动结束并显示结果。" },
};

const serviceConversationScenarios = Object.keys(serviceConversationScenarioLabels) as Array<Exclude<ServiceConversationAcceptanceScenario, "off">>;

const serviceConversationActionLabels: Record<Exclude<ServiceConversationAcceptanceScenario, "off">, string> = {
  normal: "打开服务留言",
  empty: "查看暂无留言",
  "playback-failure": "打开语音播放场景",
  "send-failure": "查看回复发送失败",
  "incoming-voice": "显示家人语音来电",
  "incoming-video": "显示家人视频来电",
  "call-timeout": "重新触发无人接听",
};

const familyRequestScenarioLabels: Record<FamilyRelationshipRequestScenario, { label: string; description: string }> = {
  pending: { label: "单条待确认申请", description: "展示申请人、脱敏手机号、关系和授权影响，可同意或拒绝。" },
  multiple: { label: "多条申请与历史结果", description: "列表同时展示两条待确认申请和一条已处理记录。" },
  "processed-approved": { label: "已在手机端同意", description: "同一条申请已由老人手机端处理，平板只展示结果，不能重复提交。" },
  "processed-rejected": { label: "已在手机端拒绝", description: "同一条申请已由老人手机端拒绝，平板只展示结果，不能重复提交。" },
  expired: { label: "申请已过期", description: "过期申请保留识别信息和结果说明，不再提供处理按钮。" },
  "not-eligible": { label: "平板未绑定老人档案", description: "未激活或未绑定老人档案时，不展示申请内容，也不能处理申请。" },
};

const familyRequestScenarios = Object.keys(familyRequestScenarioLabels) as FamilyRelationshipRequestScenario[];

const familyRequestConditionLabels: Record<FamilyRelationshipRequestCondition, { label: string; description: string }> = {
  "network-normal": { label: "网络正常", description: "同意或拒绝后立即显示已处理，并禁止重复提交。" },
  "network-submit-failure": { label: "提交时网络失败", description: "初始申请界面不变；执行同意或拒绝后保留原申请并显示失败反馈。" },
};

const weatherLabels: Record<FamilyWeatherMockScenario, string> = {
  default: "正常天气",
  cached: "缓存天气",
  "weather-failure": "天气失败",
  "missing-location": "子女无位置",
  "elder-missing-location": "本人无位置",
  "relation-unbound": "关系解绑",
};

interface WeatherAcceptanceScenarioDefinition {
  id: FamilyWeatherMockScenario;
  group: "display";
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "normal" | "notice" | "warning" | "danger";
}

interface WeatherAcceptanceTargetDefinition {
  id: WeatherAcceptanceTarget;
  label: string;
  scenarios: FamilyWeatherMockScenario[];
  defaultTitle: string;
  defaultDescription: string;
}

const weatherScenarioDefinitions: WeatherAcceptanceScenarioDefinition[] = [
  {
    id: "default",
    group: "display",
    title: "正常家庭天气",
    description: "首页显示本人和两名子女，详情展示全部绑定家人",
    icon: CloudSun,
    tone: "normal",
  },
  {
    id: "cached",
    group: "display",
    title: "显示缓存天气",
    description: "女儿天气更新失败，继续显示上次成功数据和时间",
    icon: DatabaseBackup,
    tone: "notice",
  },
  {
    id: "weather-failure",
    group: "display",
    title: "单人天气失败",
    description: "女儿不显示虚构天气，其他家庭成员仍然正常",
    icon: CloudOff,
    tone: "danger",
  },
  {
    id: "missing-location",
    group: "display",
    title: "子女没有位置",
    description: "保留联系人卡片并提示天气位置待完善",
    icon: MapPinOff,
    tone: "warning",
  },
  {
    id: "elder-missing-location",
    group: "display",
    title: "本人没有位置",
    description: "首页本人天气显示空状态，其他首页功能不受影响",
    icon: MapPinOff,
    tone: "warning",
  },
  {
    id: "relation-unbound",
    group: "display",
    title: "家庭关系解绑",
    description: "详情不再展示已解绑的家庭成员",
    icon: UserMinus,
    tone: "danger",
  },
];

const weatherAcceptanceTargets: WeatherAcceptanceTargetDefinition[] = [
  {
    id: "home",
    label: "首页天气",
    scenarios: ["default", "elder-missing-location"],
    defaultTitle: "正常首页天气",
    defaultDescription: "首页突出本人天气，最多显示两名重点子女摘要",
  },
  {
    id: "detail",
    label: "天气详情",
    scenarios: ["default", "cached", "weather-failure", "missing-location", "relation-unbound"],
    defaultTitle: "正常天气详情",
    defaultDescription: "详情展示全部绑定成员、跨国家位置和子女当地时间",
  },
];

function getWeatherScenarioPresentation(target: WeatherAcceptanceTargetDefinition, scenarioId: FamilyWeatherMockScenario) {
  const definition = weatherScenarioDefinitions.find((item) => item.id === scenarioId);
  if (!definition) return null;
  if (scenarioId !== "default") return definition;
  return { ...definition, title: target.defaultTitle, description: target.defaultDescription };
}

export default function InteractionAcceptanceConsole({
  weatherScenario,
  albumScenario,
  heartScenario,
  reminderScenario,
  rightContentScenario,
  rightContentCondition,
  communityScenario,
  serviceScenario,
  communityStaffScenario,
  serviceConversationScenario,
  familyRequestScenario,
  familyRequestCondition,
  activationScenario,
  activationContractState,
  emergencyScenario,
  onShowHome,
  onShowAlbum,
  onShowReminders,
  onShowCommunity,
  onShowServices,
  onShowCommunityStaff,
  onShowContacts,
  onShowFamilyRequests,
  onSetWeatherScenario,
  onOpenWeatherScenario,
  onSetAlbumScenario,
  onSetHeartScenario,
  onSetReminderScenario,
  onSetRightContentScenario,
  onSetRightContentCondition,
  onSetCommunityScenario,
  onSetServiceScenario,
  onSetCommunityStaffScenario,
  onSetServiceConversationScenario,
  onSetFamilyRequestScenario,
  onSetFamilyRequestCondition,
  onSetActivationScenario,
  onActivateRightContent,
  onOpenEntertainmentFailure,
  onApplyRightContentUpdate,
  onOpenHomeReminderAlert,
  onHomeCommand,
  onSetEmergencyScenario,
  onOpenEmergencyScenario,
  onOpenActivation,
  onResetActivation,
  onReset,
}: InteractionAcceptanceConsoleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePage, setActivePage] = useState<AcceptanceConsolePage>("home");
  const [activeSection, setActiveSection] = useState<AcceptanceConsoleSection>("weather");
  const [weatherAcceptanceTarget, setWeatherAcceptanceTarget] = useState<WeatherAcceptanceTarget>("home");
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [opensToRight, setOpensToRight] = useState(false);
  const [opensUpward, setOpensUpward] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dragStateRef = useRef<AcceptanceConsoleDragState | null>(null);
  const dragMovedRef = useRef(false);
  const selectedWeatherTarget = weatherAcceptanceTargets.find((target) => target.id === weatherAcceptanceTarget) ?? weatherAcceptanceTargets[0];
  const selectedWeatherScenario = getWeatherScenarioPresentation(selectedWeatherTarget, weatherScenario);
  const selectedPage = acceptancePageOptions.find((page) => page.id === activePage) ?? acceptancePageOptions[0];
  const selectedPageSections = acceptanceSectionOptions.filter((section) => selectedPage.sections.includes(section.id));
  const albumScenarioOptions = activePage === "family-album" ? familyAlbumScenarios : homeAlbumScenarios;
  const selectedRightContentObject = rightContentAcceptanceObjects.find((item) => item.scenarios.includes(rightContentScenario))
    ?? rightContentAcceptanceObjects[rightContentAcceptanceObjects.length - 1];
  const rightContentActionLabel = rightContentScenario === "new-album" && rightContentCondition === "relationship-invalid"
    ? "打开历史会话"
    : rightContentActionLabels[rightContentScenario];
  const selectedActivationScenario = activationScenarioDefinitions[activationScenario];
  const selectedFamilyRequestScenario = familyRequestScenarioLabels[familyRequestScenario];
  const selectedFamilyRequestCondition = familyRequestConditionLabels[familyRequestCondition];

  useEffect(() => {
    if (activeSection === "task-progress" && !rightContentInteractionScenarios.includes(rightContentScenario)) {
      onSetRightContentScenario("recommendations-only");
    }
  }, [activeSection, onSetRightContentScenario, rightContentScenario]);

  useEffect(() => {
    if (rightContentScenario !== "new-album" && rightContentCondition !== "relationship-valid") {
      onSetRightContentCondition("relationship-valid");
    }
  }, [onSetRightContentCondition, rightContentCondition, rightContentScenario]);

  useEffect(() => {
    if (activeSection === "service-messages" && serviceConversationScenario === "off") {
      onSetServiceConversationScenario("normal");
    }
  }, [activeSection, onSetServiceConversationScenario, serviceConversationScenario]);

  useEffect(() => {
    if (!["pending", "multiple"].includes(familyRequestScenario) && familyRequestCondition !== "network-normal") {
      onSetFamilyRequestCondition("network-normal");
    }
  }, [familyRequestCondition, familyRequestScenario, onSetFamilyRequestCondition]);

  const showAlbumAcceptanceTarget = () => activePage === "family-album" ? onShowAlbum() : onShowHome();
  const changePage = (pageId: AcceptanceConsolePage) => {
    const nextPage = acceptancePageOptions.find((page) => page.id === pageId) ?? acceptancePageOptions[0];
    onReset();
    setActivePage(nextPage.id);
    setActiveSection(nextPage.sections[0]);
    setWeatherAcceptanceTarget("home");
  };
  const changeSection = (sectionId: AcceptanceConsoleSection) => {
    onReset();
    setActiveSection(sectionId);
    setWeatherAcceptanceTarget("home");
  };
  const changeRightContentObject = (objectId: RightContentAcceptanceObject) => {
    const nextObject = rightContentAcceptanceObjects.find((item) => item.id === objectId);
    if (nextObject) {
      onSetRightContentCondition("relationship-valid");
      onSetRightContentScenario(nextObject.scenarios[0]);
    }
  };
  const resetWorkbench = () => {
    setActivePage("home");
    setActiveSection("weather");
    setWeatherAcceptanceTarget("home");
    onReset();
  };

  const beginDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const consoleElement = event.currentTarget.closest(".interaction-acceptance-console") as HTMLElement | null;
    if (!consoleElement) return;
    const bounds = consoleElement.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: dragOffset.x,
      startOffsetY: dragOffset.y,
      startLeft: bounds.left,
      startTop: bounds.top,
      width: bounds.width,
      height: bounds.height,
    };
    dragMovedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const continueDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const maximumLeft = Math.max(8, window.innerWidth - dragState.width - 8);
    const maximumTop = Math.max(8, window.innerHeight - dragState.height - 8);
    const nextLeft = Math.min(maximumLeft, Math.max(8, dragState.startLeft + deltaX));
    const nextTop = Math.min(maximumTop, Math.max(8, dragState.startTop + deltaY));
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) dragMovedRef.current = true;
    setDragOffset({
      x: dragState.startOffsetX + nextLeft - dragState.startLeft,
      y: dragState.startOffsetY + nextTop - dragState.startTop,
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragStateRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragStateRef.current = null;
    if (!event.currentTarget.classList.contains("interaction-acceptance-trigger")) dragMovedRef.current = false;
  };

  const toggleConsole = () => {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    if (!isOpen) {
      const triggerBounds = triggerRef.current?.getBoundingClientRect();
      setOpensToRight(Boolean(triggerBounds && triggerBounds.left < window.innerWidth / 2));
      setOpensUpward(Boolean(triggerBounds && triggerBounds.top > window.innerHeight / 2));
    }
    setIsOpen((current) => !current);
  };

  return (
    <aside
      className={`interaction-acceptance-console${isOpen ? " is-open" : ""}${opensToRight ? " opens-to-right" : ""}${opensUpward ? " opens-upward" : ""}`}
      aria-label="交互验收台"
      style={{ transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)` }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="interaction-acceptance-trigger"
        onPointerDown={beginDrag}
        onPointerMove={continueDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={toggleConsole}
        aria-expanded={isOpen}
        aria-label={isOpen ? "收起交互验收台" : "打开交互验收台"}
        title={isOpen ? "收起交互验收台" : "打开交互验收台"}
      >
        {isOpen ? <PanelRightClose aria-hidden="true" /> : <PanelRightOpen aria-hidden="true" />}
      </button>

      {isOpen && (
        <div className="interaction-acceptance-panel">
          <header
            className="interaction-acceptance-drag-handle"
            onPointerDown={beginDrag}
            onPointerMove={continueDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div><Sparkles aria-hidden="true" /><span><strong>交互验收台</strong><small>交互状态 · 执行动作后保持展开</small></span></div>
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setIsOpen(false)} aria-label="收起交互验收台"><PanelRightClose /></button>
          </header>

          <section className="interaction-acceptance-hierarchy" aria-label="验收页面与模块">
            <label className="interaction-acceptance-page-picker interaction-acceptance-module-picker">
              <span>一级页面</span>
              <span className="interaction-acceptance-module-picker__select">
                <select
                  value={activePage}
                  onChange={(event) => changePage(event.target.value as AcceptanceConsolePage)}
                  aria-label="选择一级页面"
                >
                  {acceptancePageOptions.map((page) => <option key={page.id} value={page.id}>{page.label}</option>)}
                </select>
                <ChevronDown aria-hidden="true" />
              </span>
            </label>
            <label className="interaction-acceptance-module-picker">
              <span>二级模块</span>
              <span className="interaction-acceptance-module-picker__select">
              <select value={activeSection} onChange={(event) => changeSection(event.target.value as AcceptanceConsoleSection)} aria-label="选择验收模块">
                {selectedPageSections.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
              <ChevronDown aria-hidden="true" />
              </span>
            </label>
            {activeSection === "task-progress" && (
              <label className="interaction-acceptance-module-picker">
                <span>三级对象</span>
                <span className="interaction-acceptance-module-picker__select">
                  <select
                    value={selectedRightContentObject.id}
                    onChange={(event) => changeRightContentObject(event.target.value as RightContentAcceptanceObject)}
                    aria-label="选择首页右侧验收对象"
                  >
                    {rightContentAcceptanceObjects.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" />
                </span>
              </label>
            )}
          </section>

          <div className="interaction-acceptance-section">
            {activeSection === "album" && <section>
              <h2><Image aria-hidden="true" />家庭影像场景</h2>
              <div className="interaction-acceptance-grid is-two-columns">
                {albumScenarioOptions.map((scenario) => (
                  <button
                    key={scenario}
                    type="button"
                    className={albumScenario === scenario ? "is-active" : ""}
                    onClick={() => {
                      onSetAlbumScenario(scenario);
                      showAlbumAcceptanceTarget();
                    }}
                  >
                    {scenario.includes("video") ? <Video /> : <Image />}{albumLabels[scenario]}
                  </button>
                ))}
              </div>
              <h2><Heart aria-hidden="true" />喜欢状态</h2>
              <div className="interaction-acceptance-grid is-two-columns">
                {(Object.keys(heartLabels) as AcceptanceHeartScenario[]).map((scenario) => (
                  <button
                    key={scenario}
                    type="button"
                    className={heartScenario === scenario ? "is-active" : ""}
                    onClick={() => {
                      onSetHeartScenario(scenario);
                      showAlbumAcceptanceTarget();
                    }}
                  >
                    <Heart />{heartLabels[scenario]}
                  </button>
                ))}
              </div>
              <p className="interaction-acceptance-note">
                {activePage === "family-album"
                  ? "新照片、新视频未查看仅在家庭相册的信息区展示；视频状态以封面和播放按钮验收，不播放真实视频。"
                  : "首页仅验收家庭影像轮播、异常与喜欢状态，不展示新照片或新视频提醒。"}
              </p>
            </section>}

            {activeSection === "reminders" && <section>
              <h2><BellRing aria-hidden="true" />提醒状态</h2>
              <div className="interaction-acceptance-grid is-two-columns">
                {(Object.keys(reminderLabels) as AcceptanceReminderScenario[]).map((scenario) => (
                  <button
                    key={scenario}
                    type="button"
                    className={reminderScenario === scenario ? "is-active" : ""}
                    onClick={() => {
                      onSetReminderScenario(scenario);
                      if (scenario === "due-popup") {
                        onOpenHomeReminderAlert("medicine", 0);
                      } else {
                        onShowReminders();
                      }
                    }}
                  >
                    <BellRing />{reminderLabels[scenario]}
                  </button>
                ))}
              </div>
              <p className="interaction-acceptance-note">未确认仅可在当天补打卡；已过期只在历史日期保留并只读。创建来源仅用于权限判断，不显示在提醒卡片上。</p>
            </section>}

            {activeSection === "weather" && <section>
              <div className="interaction-acceptance-field">
                <h2>验收对象</h2>
                <div className="weather-acceptance-target" role="group" aria-label="选择天气验收对象">
                  {weatherAcceptanceTargets.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      className={weatherAcceptanceTarget === target.id ? "is-active" : ""}
                      onClick={() => {
                        setWeatherAcceptanceTarget(target.id);
                        if (!target.scenarios.includes(weatherScenario)) onSetWeatherScenario("default");
                      }}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="interaction-acceptance-field">
                <h2>模块状态</h2>
                <p>选择后通过底部动作查看页面状态</p>
                <div className="weather-acceptance-status-grid" role="group" aria-label="选择天气模块状态">
                  {selectedWeatherTarget.scenarios.map((scenarioId) => {
                    const definition = getWeatherScenarioPresentation(selectedWeatherTarget, scenarioId);
                    if (!definition) return null;
                    const ScenarioIcon = definition.icon;
                    return (
                      <button
                        key={scenarioId}
                        type="button"
                        className={weatherScenario === scenarioId ? "is-active" : ""}
                        onClick={() => onSetWeatherScenario(scenarioId)}
                      >
                        <ScenarioIcon aria-hidden="true" />
                        <span>{definition.title}</span>
                      </button>
                    );
                  })}
                </div>
                <span className="weather-acceptance-state-help">{selectedWeatherScenario?.description}</span>
              </div>

              <div className="interaction-acceptance-field">
                <h2>交互动作</h2>
                <div className="weather-acceptance-actions">
                  <button type="button" onClick={() => onSetWeatherScenario("default")}>恢复正常</button>
                  <button type="button" className="is-primary" onClick={() => onOpenWeatherScenario(weatherAcceptanceTarget)}>
                    {weatherAcceptanceTarget === "home"
                      ? "查看首页天气"
                      : "打开天气详情"}
                  </button>
                </div>
              </div>
              <p className="interaction-acceptance-note">先选择状态，再执行验收动作；验收台保持展开。</p>
            </section>}

            {activeSection === "emergency" && <section>
              <div className="interaction-acceptance-field">
                <h2><Siren aria-hidden="true" />交互条件</h2>
                <label className="interaction-acceptance-module-picker">
                  <span className="interaction-acceptance-module-picker__select">
                    <select
                      value={emergencyScenario}
                      onChange={(event) => onSetEmergencyScenario(event.target.value as EmergencyAcceptanceScenario)}
                      aria-label="选择在线协助交互条件"
                    >
                      {(Object.entries(emergencyScenarioDefinitions) as Array<[EmergencyAcceptanceScenario, { label: string; description: string }]>).map(([scenarioId, definition]) => (
                        <option key={scenarioId} value={scenarioId}>{definition.label}</option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" />
                  </span>
                </label>
                <div className="interaction-acceptance-current" aria-live="polite">
                  <strong>{emergencyScenarioDefinitions[emergencyScenario].label}</strong>
                  <p>{emergencyScenarioDefinitions[emergencyScenario].description}</p>
                </div>
              </div>
              <div className="interaction-acceptance-field">
                <h2>交互动作</h2>
                <button type="button" className="is-primary" onClick={() => onOpenEmergencyScenario(emergencyScenario)}>
                  <PhoneCall aria-hidden="true" />打开在线协助流程
                </button>
              </div>
            </section>}

            {activeSection === "task-progress" && <section>
              <div className="interaction-acceptance-field">
                <h2><Sparkles aria-hidden="true" />可见状态</h2>
                <label className="interaction-acceptance-module-picker">
                  <span className="interaction-acceptance-module-picker__select">
                    <select
                      value={rightContentScenario}
                      onChange={(event) => {
                        onSetRightContentCondition("relationship-valid");
                        onSetRightContentScenario(event.target.value as AcceptanceRightContentScenario);
                      }}
                      aria-label="选择首页右侧可见状态"
                    >
                      {selectedRightContentObject.scenarios.map((scenario) => (
                        <option key={scenario} value={scenario}>{rightContentScenarioLabels[scenario].label}</option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" />
                  </span>
                </label>
                <div className="interaction-acceptance-current" aria-live="polite">
                  <strong>{rightContentScenarioLabels[rightContentScenario].label}</strong>
                  <p>{rightContentScenarioLabels[rightContentScenario].description}</p>
                </div>
              </div>

              {rightContentScenario === "new-album" && (
                <div className="interaction-acceptance-field">
                  <h2><ShieldAlert aria-hidden="true" />交互条件</h2>
                  <label className="interaction-acceptance-module-picker">
                    <span className="interaction-acceptance-module-picker__select">
                      <select
                        value={rightContentCondition}
                        onChange={(event) => onSetRightContentCondition(event.target.value as AcceptanceRightContentCondition)}
                        aria-label="选择家庭影像交互条件"
                      >
                        {(Object.keys(rightContentConditionLabels) as AcceptanceRightContentCondition[]).map((condition) => (
                          <option key={condition} value={condition}>{rightContentConditionLabels[condition].label}</option>
                        ))}
                      </select>
                      <ChevronDown aria-hidden="true" />
                    </span>
                  </label>
                  <div className="interaction-acceptance-current" aria-live="polite">
                    <strong>{rightContentConditionLabels[rightContentCondition].label}</strong>
                    <p>{rightContentConditionLabels[rightContentCondition].description}</p>
                  </div>
                </div>
              )}

              <div className="interaction-acceptance-field">
                <h2><BellRing aria-hidden="true" />可执行动作</h2>
                {rightContentActionLabel && (
                  <button type="button" className="interaction-acceptance-primary-action" onClick={onActivateRightContent}>
                    <ChevronRight aria-hidden="true" />{rightContentActionLabel}
                  </button>
                )}
                {rightContentScenario === "third-party-entertainment" && (
                  <button type="button" className="interaction-acceptance-wide is-danger" onClick={onOpenEntertainmentFailure}>
                    <CloudOff aria-hidden="true" />查看打开失败结果
                  </button>
                )}
                {rightContentScenario === "p1-due" && (
                  <button type="button" className="interaction-acceptance-wide" onClick={() => onOpenHomeReminderAlert("medicine", 0)}>
                    <Pill />再次显示用药到点弹窗
                  </button>
                )}
                {rightContentScenario === "schedule-due" && (
                  <button type="button" className="interaction-acceptance-wide" onClick={() => onOpenHomeReminderAlert("schedule", 0)}>
                    <CalendarDays />再次显示事项到点弹窗
                  </button>
                )}
                {!rightContentActionLabel && rightContentScenario === "no-content" && (
                  <p className="interaction-acceptance-note">当前为空状态，没有可执行的内容入口。</p>
                )}
                {rightContentScenario === "interaction-locked" && (
                  <div className="interaction-acceptance-context-action">
                    <span>当前场景动作</span>
                    <button type="button" className="interaction-acceptance-primary-action" onClick={onApplyRightContentUpdate}>
                      <CheckCircle2 aria-hidden="true" />结束当前操作，应用新内容
                    </button>
                  </div>
                )}
                {rightContentScenario === "ai-assistant-fallback" && (
                  <div className="interaction-acceptance-context-action">
                    <span>更新消息状态</span>
                    <button type="button" className="interaction-acceptance-primary-action" onClick={onApplyRightContentUpdate}>
                      <CheckCircle2 aria-hidden="true" />切换消息进入 / 队列清空
                    </button>
                  </div>
                )}
              </div>

            </section>}

            {activeSection === "community-life" && <section>
              <div className="interaction-acceptance-field">
                <h2><Landmark aria-hidden="true" />社区生活场景</h2>
                <p>选择场景后直接打开对应页面，验收台保持展开。</p>
                <div className="interaction-acceptance-scenario-list">
                  {(Object.keys(communityScenarioLabels) as AcceptanceCommunityScenario[]).map((scenario) => (
                    <button
                      key={scenario}
                      type="button"
                      className={communityScenario === scenario ? "is-active" : ""}
                      onClick={() => onSetCommunityScenario(scenario)}
                    >
                      <span><Landmark aria-hidden="true" /><strong>{communityScenarioLabels[scenario].label}</strong></span>
                      <small>{communityScenarioLabels[scenario].description}</small>
                    </button>
                  ))}
                </div>
                <button type="button" className="interaction-acceptance-primary-action" onClick={onShowCommunity}>
                  <ChevronRight aria-hidden="true" />打开当前社区生活场景
                </button>
              </div>
              <p className="interaction-acceptance-note">社区话题支持独立发起、整篇资讯引用和一级评论；活动参加意向仅保留“我想参加”和“暂不参加”，与直播观看相互独立。</p>
            </section>}

            {activeSection === "special-services" && <section>
              <div className="interaction-acceptance-field">
                <h2><HandHeart aria-hidden="true" />特约服务分类场景</h2>
                <p>选择场景后直接打开现有特约服务页，验收台保持展开。</p>
                <div className="interaction-acceptance-scenario-list">
                  {(Object.keys(specialServicesScenarioLabels) as SpecialServicesAcceptanceScenario[]).map((scenario) => (
                    <button
                      key={scenario}
                      type="button"
                      className={serviceScenario === scenario ? "is-active" : ""}
                      onClick={() => onSetServiceScenario(scenario)}
                    >
                      <span><HandHeart aria-hidden="true" /><strong>{specialServicesScenarioLabels[scenario].label}</strong></span>
                      <small>{specialServicesScenarioLabels[scenario].description}</small>
                    </button>
                  ))}
                </div>
                <button type="button" className="interaction-acceptance-primary-action" onClick={onShowServices}>
                  <ChevronRight aria-hidden="true" />打开当前特约服务场景
                </button>
              </div>
              <p className="interaction-acceptance-note">分类只用于筛选服务；详情、预约确认、预约结果和服务记录继续复用现有流程。</p>
            </section>}

            {activeSection === "community-staff" && <section>
              <div className="interaction-acceptance-field">
                <h2><UsersRound aria-hidden="true" />社区人员场景</h2>
                <p>选择场景后直接打开社区人员正式页面。</p>
                <div className="interaction-acceptance-scenario-list">
                  {(Object.keys(communityStaffScenarioLabels) as CommunityStaffAcceptanceScenario[]).map((scenario) => (
                    <button
                      key={scenario}
                      type="button"
                      className={communityStaffScenario === scenario ? "is-active" : ""}
                      onClick={() => onSetCommunityStaffScenario(scenario)}
                    >
                      <span><UsersRound aria-hidden="true" /><strong>{communityStaffScenarioLabels[scenario].label}</strong></span>
                      <small>{communityStaffScenarioLabels[scenario].description}</small>
                    </button>
                  ))}
                </div>
                <button type="button" className="interaction-acceptance-primary-action" onClick={onShowCommunityStaff}>
                  <ChevronRight aria-hidden="true" />打开当前社区人员场景
                </button>
              </div>
              <p className="interaction-acceptance-note">电话和邮箱仅展示，不触发拨号或邮件；人员顺序、照片与资料按当前预设展示。</p>
            </section>}

            {activeSection === "family-requests" && <section>
              <div className="interaction-acceptance-field">
                <h2><UserRoundCheck aria-hidden="true" />可见状态</h2>
                <label className="interaction-acceptance-module-picker">
                  <span className="interaction-acceptance-module-picker__select">
                    <select
                      value={familyRequestScenario}
                      onChange={(event) => onSetFamilyRequestScenario(event.target.value as FamilyRelationshipRequestScenario)}
                      aria-label="选择家人申请状态"
                    >
                      {familyRequestScenarios.map((scenario) => (
                        <option key={scenario} value={scenario}>{familyRequestScenarioLabels[scenario].label}</option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" />
                  </span>
                </label>
                <div className="interaction-acceptance-current" aria-live="polite">
                  <strong>{selectedFamilyRequestScenario.label}</strong>
                  <p>{selectedFamilyRequestScenario.description}</p>
                </div>
              </div>

              {["pending", "multiple"].includes(familyRequestScenario) && (
                <div className="interaction-acceptance-field">
                  <h2><CloudOff aria-hidden="true" />交互条件</h2>
                  <label className="interaction-acceptance-module-picker">
                    <span className="interaction-acceptance-module-picker__select">
                      <select
                        value={familyRequestCondition}
                        onChange={(event) => onSetFamilyRequestCondition(event.target.value as FamilyRelationshipRequestCondition)}
                        aria-label="选择家人申请提交条件"
                      >
                        {(Object.keys(familyRequestConditionLabels) as FamilyRelationshipRequestCondition[]).map((condition) => (
                          <option key={condition} value={condition}>{familyRequestConditionLabels[condition].label}</option>
                        ))}
                      </select>
                      <ChevronDown aria-hidden="true" />
                    </span>
                  </label>
                  <div className="interaction-acceptance-current" aria-live="polite">
                    <strong>{selectedFamilyRequestCondition.label}</strong>
                    <p>{selectedFamilyRequestCondition.description}</p>
                  </div>
                </div>
              )}

              <div className="interaction-acceptance-field">
                <h2><BellRing aria-hidden="true" />可执行动作</h2>
                <button type="button" className="interaction-acceptance-primary-action" onClick={onShowFamilyRequests}>
                  <ChevronRight aria-hidden="true" />打开家人申请
                </button>
              </div>
            </section>}

            {activeSection === "service-messages" && <section>
              <div className="interaction-acceptance-field">
                <h2><MessageCircleHeart aria-hidden="true" />可见状态</h2>
                <label className="interaction-acceptance-module-picker">
                  <span className="interaction-acceptance-module-picker__select">
                    <select
                      value={serviceConversationScenario === "off" ? "normal" : serviceConversationScenario}
                      onChange={(event) => {
                        const scenario = event.target.value as Exclude<ServiceConversationAcceptanceScenario, "off">;
                        onSetServiceConversationScenario(scenario);
                        onShowContacts(scenario);
                      }}
                      aria-label="选择通讯录与家庭互动状态"
                    >
                      {serviceConversationScenarios.map((scenario) => (
                        <option key={scenario} value={scenario}>{serviceConversationScenarioLabels[scenario].label}</option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" />
                  </span>
                </label>
                {serviceConversationScenario !== "off" && (
                  <div className="interaction-acceptance-current" aria-live="polite">
                    <strong>{serviceConversationScenarioLabels[serviceConversationScenario].label}</strong>
                    <p>{serviceConversationScenarioLabels[serviceConversationScenario].description}</p>
                  </div>
                )}
              </div>
              <div className="interaction-acceptance-field">
                <h2><BellRing aria-hidden="true" />可执行动作</h2>
                {serviceConversationScenario !== "off" && (
                  <button type="button" className="interaction-acceptance-primary-action" onClick={() => onShowContacts(serviceConversationScenario)}>
                    <ChevronRight aria-hidden="true" />{serviceConversationActionLabels[serviceConversationScenario]}
                  </button>
                )}
              </div>
            </section>}

            {activeSection === "activation" && <section>
              <div className="interaction-acceptance-field">
                <h2><TabletSmartphone aria-hidden="true" />激活场景</h2>
                <label className="interaction-acceptance-module-picker">
                  <span className="interaction-acceptance-module-picker__select">
                    <select
                      value={activationScenario}
                      onChange={(event) => onSetActivationScenario(event.target.value as ActivationAcceptanceScenario)}
                      aria-label="选择设备激活场景"
                    >
                      {(Object.keys(activationScenarioDefinitions) as ActivationAcceptanceScenario[]).map((scenario) => (
                        <option key={scenario} value={scenario}>{activationScenarioDefinitions[scenario].label}</option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" />
                  </span>
                </label>
                <div className="interaction-acceptance-current" aria-live="polite">
                  <strong>{selectedActivationScenario.label} · {selectedActivationScenario.code}</strong>
                  <p>{selectedActivationScenario.description}</p>
                </div>
              </div>
              <div className="interaction-acceptance-field">
                <h2><DatabaseBackup aria-hidden="true" />跨端契约状态</h2>
                <dl className="activation-contract-status">
                  <div><dt>激活码</dt><dd>{activationContractState.activationCode.status}</dd></div>
                  <div><dt>目标设备</dt><dd>{activationContractState.device.status}</dd></div>
                  <div><dt>设备绑定老人</dt><dd>{activationContractState.device.boundElderlyId ?? "未绑定"}</dd></div>
                  <div><dt>老人当前平板</dt><dd>{activationContractState.elderly.currentTabletId ?? "未设置"}</dd></div>
                  <div><dt>可重复使用</dt><dd>{activationContractState.activationCode.reusable ? "是" : "否"}</dd></div>
                </dl>
              </div>
              <div className="interaction-acceptance-field">
                <h2><BellRing aria-hidden="true" />可执行动作</h2>
                <button type="button" className="interaction-acceptance-primary-action" onClick={onOpenActivation}>
                  <TabletSmartphone aria-hidden="true" />进入设备激活验收
                </button>
                <button type="button" className="interaction-acceptance-secondary-action" onClick={onResetActivation}>
                  <RefreshCcw aria-hidden="true" />重置当前激活场景
                </button>
              </div>
            </section>}
          </div>

          <footer>
            <button type="button" onClick={resetWorkbench}><RefreshCcw aria-hidden="true" />全局重置</button>
          </footer>
        </div>
      )}
    </aside>
  );
}
