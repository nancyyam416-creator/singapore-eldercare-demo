import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
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
  Image,
  MapPinOff,
  MessageCircleHeart,
  PanelRightClose,
  PanelRightOpen,
  Pill,
  Play,
  RefreshCcw,
  Send,
  ShieldAlert,
  Siren,
  Sparkles,
  TabletSmartphone,
  UserRoundCheck,
  UserMinus,
  Video,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import type { FamilyWeatherMockScenario } from "../weather/familyWeather";
import type { EmergencyAcceptanceScenario } from "./EmergencyModal";
import "./interaction-acceptance-console.css";

export type AcceptanceTaskScenario = "unfinished" | "overdue" | "all-done" | "no-p0";
export type AcceptanceTaskContentScenario = "medicine" | "schedule";
export type AcceptanceRecordScenario = "with-records" | "empty";
export type AcceptanceCareRegion = "domestic" | "singapore";
export type AcceptanceCareTime = "morning" | "noon" | "afternoon" | "evening" | "late-night";
export type AcceptanceCareMode = "no-disaster" | "disaster";
export type AcceptanceCareScenario = "daily" | "festival" | "seasonal";
export type AcceptanceDisasterScenario = "typhoon" | "rainstorm" | "cold-wave" | "heat" | "haze" | "strong-wind";
export type AcceptanceMessageScenario = "none" | "single" | "multiple" | "photo" | "photo-group" | "load-failure";
export type AcceptanceAlbumScenario =
  | "default"
  | "notice-photo"
  | "notice-video"
  | "video-failure"
  | "empty"
  | "single"
  | "load-failure";
export type AcceptanceHeartScenario = "not-liked" | "sending" | "liked" | "failure";
export type AcceptanceReminderScenario = "default" | "due" | "not-yet" | "empty" | "all-completed" | "unconfirmed" | "action-failure";
export type AcceptanceHomeCommand =
  | "reset-home-overlays"
  | "previous-photo"
  | "next-photo"
  | "show-photo-controls"
  | "expand-messages"
  | "collapse-messages"
  | "play-first-message"
  | "play-message-chime"
  | "open-weather"
  | "open-weather-care";

interface InteractionAcceptanceConsoleProps {
  taskScenario: AcceptanceTaskScenario;
  taskContentScenario: AcceptanceTaskContentScenario;
  recordScenario: AcceptanceRecordScenario;
  careRegion: AcceptanceCareRegion;
  careTime: AcceptanceCareTime;
  careMode: AcceptanceCareMode;
  careScenario: AcceptanceCareScenario;
  disasterScenario: AcceptanceDisasterScenario;
  messageScenario: AcceptanceMessageScenario;
  weatherScenario: FamilyWeatherMockScenario;
  albumScenario: AcceptanceAlbumScenario;
  heartScenario: AcceptanceHeartScenario;
  reminderScenario: AcceptanceReminderScenario;
  onShowHome: () => void;
  onShowAlbum: () => void;
  onShowReminders: () => void;
  onSetTaskScenario: (scenario: AcceptanceTaskScenario) => void;
  onSetTaskContentScenario: (scenario: AcceptanceTaskContentScenario) => void;
  onSetRecordScenario: (scenario: AcceptanceRecordScenario) => void;
  onSetCareRegion: (region: AcceptanceCareRegion) => void;
  onSetCareTime: (time: AcceptanceCareTime) => void;
  onSetCareMode: (mode: AcceptanceCareMode) => void;
  onSetCareScenario: (scenario: AcceptanceCareScenario) => void;
  onSetDisasterScenario: (scenario: AcceptanceDisasterScenario) => void;
  onSetMessageScenario: (scenario: AcceptanceMessageScenario) => void;
  onSetWeatherScenario: (scenario: FamilyWeatherMockScenario) => void;
  onOpenWeatherScenario: (target: WeatherAcceptanceTarget) => void;
  onSetAlbumScenario: (scenario: AcceptanceAlbumScenario) => void;
  onSetHeartScenario: (scenario: AcceptanceHeartScenario) => void;
  onSetReminderScenario: (scenario: AcceptanceReminderScenario) => void;
  onOpenHomeReminderAlert: (category: AcceptanceTaskContentScenario) => void;
  onHomeCommand: (command: AcceptanceHomeCommand) => void;
  onOpenEmergencyScenario: (scenario: EmergencyAcceptanceScenario) => void;
  onOpenActivation: () => void;
  onReset: () => void;
}

type AcceptanceConsoleSection = "weather" | "emergency" | "album" | "message" | "task-progress" | "reminders";
type AcceptanceConsolePage = "home" | "family-album" | "reminders";
type WeatherAcceptanceTarget = "home" | "detail" | "care";

const acceptanceSectionOptions: Array<{ id: AcceptanceConsoleSection; label: string }> = [
  { id: "weather", label: "家庭天气" },
  { id: "emergency", label: "紧急呼叫" },
  { id: "album", label: "家庭影像" },
  { id: "message", label: "留言提醒" },
  { id: "task-progress", label: "任务进度" },
  { id: "reminders", label: "今日提醒" },
];

const acceptancePageOptions: Array<{ id: AcceptanceConsolePage; label: string; sections: AcceptanceConsoleSection[] }> = [
  { id: "home", label: "首页", sections: ["weather", "emergency", "album", "task-progress", "message"] },
  { id: "family-album", label: "家庭相册", sections: ["album"] },
  { id: "reminders", label: "提醒事项", sections: ["reminders"] },
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

const taskLabels: Record<AcceptanceTaskScenario, string> = {
  unfinished: "有未完成 P0",
  overdue: "存在逾期",
  "all-done": "全部 P0 已完成",
  "no-p0": "今日无 P0",
};

const taskContentLabels: Record<AcceptanceTaskContentScenario, string> = {
  medicine: "用药提醒",
  schedule: "日常提醒",
};

const recordLabels: Record<AcceptanceRecordScenario, string> = {
  "with-records": "有履约记录",
  empty: "暂无履约记录",
};

const careRegionLabels: Record<AcceptanceCareRegion, string> = {
  domestic: "国内地区",
  singapore: "新加坡/热带地区",
};

const careScenarioLabels: Record<AcceptanceCareScenario, string> = {
  daily: "日常时段兜底",
  festival: "传统文化节气",
  seasonal: "季节/雨季养生",
};

const careTimeLabels: Record<AcceptanceCareTime, string> = {
  morning: "早上 05:00–11:00",
  noon: "中午 11:00–13:30",
  afternoon: "下午 13:30–18:00",
  evening: "晚上 18:00–22:00",
  "late-night": "夜深 22:00–05:00",
};

const careModeLabels: Record<AcceptanceCareMode, string> = {
  "no-disaster": "无灾害",
  disaster: "有灾害/突变",
};

const disasterLabels: Record<AcceptanceDisasterScenario, string> = {
  typhoon: "台风/强飓风",
  rainstorm: "暴雨/雷阵雨",
  "cold-wave": "剧烈降温/寒潮",
  heat: "高温/酷暑",
  haze: "大雾/霾天气",
  "strong-wind": "大风/沙尘",
};

const messageLabels: Record<AcceptanceMessageScenario, string> = {
  none: "无新留言",
  single: "单条新留言",
  multiple: "多条混合",
  photo: "新单张照片",
  "photo-group": "新照片组",
  "load-failure": "留言加载失败",
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
  due: "待完成",
  "not-yet": "未到时间",
  "all-completed": "已完成",
  unconfirmed: "未确认/已过期",
  "action-failure": "确认失败",
  empty: "空列表",
};

const weatherLabels: Record<FamilyWeatherMockScenario, string> = {
  default: "正常天气",
  cached: "缓存天气",
  "weather-failure": "天气失败",
  "missing-location": "子女无位置",
  "elder-missing-location": "本人无位置",
  "relation-unbound": "关系解绑",
  "send-failure": "发送失败",
  "already-sent": "今日已发送",
};

interface WeatherAcceptanceScenarioDefinition {
  id: FamilyWeatherMockScenario;
  group: "display" | "care";
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
    description: "保留联系人卡片，提示完善位置并关闭天气关怀",
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
    description: "详情不再展示已解绑的女儿，也不能继续发送关怀",
    icon: UserMinus,
    tone: "danger",
  },
  {
    id: "send-failure",
    group: "care",
    title: "发送失败",
    description: "统一覆盖发送前断网、发送中断网和服务发送失败；保留原话并支持原请求重试",
    icon: Send,
    tone: "danger",
  },
  {
    id: "already-sent",
    group: "care",
    title: "今日已经发送",
    description: "展示今日发送记录并阻止再次发送",
    icon: CheckCircle2,
    tone: "notice",
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
  {
    id: "care",
    label: "关怀发送",
    scenarios: ["default", "send-failure", "already-sent"],
    defaultTitle: "正常发送",
    defaultDescription: "显示系统准备的固定话术，明确确认后发送并展示完成结果",
  },
];

function getWeatherScenarioPresentation(target: WeatherAcceptanceTargetDefinition, scenarioId: FamilyWeatherMockScenario) {
  const definition = weatherScenarioDefinitions.find((item) => item.id === scenarioId);
  if (!definition) return null;
  if (scenarioId !== "default") return definition;
  return { ...definition, title: target.defaultTitle, description: target.defaultDescription };
}

export default function InteractionAcceptanceConsole({
  taskScenario,
  taskContentScenario,
  recordScenario,
  careRegion,
  careTime,
  careMode,
  careScenario,
  disasterScenario,
  messageScenario,
  weatherScenario,
  albumScenario,
  heartScenario,
  reminderScenario,
  onShowHome,
  onShowAlbum,
  onShowReminders,
  onSetTaskScenario,
  onSetTaskContentScenario,
  onSetRecordScenario,
  onSetCareRegion,
  onSetCareTime,
  onSetCareMode,
  onSetCareScenario,
  onSetDisasterScenario,
  onSetMessageScenario,
  onSetWeatherScenario,
  onOpenWeatherScenario,
  onSetAlbumScenario,
  onSetHeartScenario,
  onSetReminderScenario,
  onOpenHomeReminderAlert,
  onHomeCommand,
  onOpenEmergencyScenario,
  onOpenActivation,
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

  const runAndClose = (action: () => void) => {
    action();
  };
  const showAlbumAcceptanceTarget = () => activePage === "family-album" ? onShowAlbum() : onShowHome();

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
            <div><Sparkles aria-hidden="true" /><span><strong>交互验收台</strong><small>执行动作后保持展开</small></span></div>
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setIsOpen(false)} aria-label="收起交互验收台"><PanelRightClose /></button>
          </header>

          <section className="interaction-acceptance-hierarchy" aria-label="验收页面与模块">
            <label className="interaction-acceptance-page-picker interaction-acceptance-module-picker">
              <span>一级页面</span>
              <span className="interaction-acceptance-module-picker__select">
                <select
                  value={activePage}
                  onChange={(event) => {
                    const nextPage = acceptancePageOptions.find((page) => page.id === event.target.value) ?? acceptancePageOptions[0];
                    setActivePage(nextPage.id);
                    if (!nextPage.sections.includes(activeSection)) setActiveSection(nextPage.sections[0]);
                  }}
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
              <select value={activeSection} onChange={(event) => setActiveSection(event.target.value as AcceptanceConsoleSection)} aria-label="选择验收模块">
                {selectedPageSections.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
              <ChevronDown aria-hidden="true" />
              </span>
            </label>
          </section>

          <div className="interaction-acceptance-section">
            {activeSection === "message" && <section>
              <h2><MessageCircleHeart aria-hidden="true" />留言场景</h2>
              <div className="interaction-acceptance-grid is-two-columns">
                {(Object.keys(messageLabels) as AcceptanceMessageScenario[]).map((scenario) => (
                  <button
                    key={scenario}
                    type="button"
                    className={messageScenario === scenario ? "is-active" : ""}
                    onClick={() => runAndClose(() => {
                      onSetMessageScenario(scenario);
                      onShowHome();
                    })}
                  >
                    <MessageCircleHeart />{messageLabels[scenario]}
                  </button>
                ))}
              </div>
            </section>}

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
                      onShowReminders();
                    }}
                  >
                    <BellRing />{reminderLabels[scenario]}
                  </button>
                ))}
              </div>
              <p className="interaction-acceptance-note">“未确认/已过期”共用补打卡交互；老人端仅验收用药提醒、日常提醒及单次执行状态。</p>
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
                <p>{weatherAcceptanceTarget === "care" ? "选择后立即联动页面，底部按钮可重复执行" : "选择后通过底部动作查看页面状态"}</p>
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
                        onClick={() => {
                          onSetWeatherScenario(scenarioId);
                          if (weatherAcceptanceTarget === "care") onOpenWeatherScenario("care");
                        }}
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
                {weatherAcceptanceTarget === "care" && (
                  <ol className="weather-acceptance-flow" aria-label="关怀发送验收步骤">
                    <li><span>1</span><b>展示固定话术</b></li>
                    <li><span>2</span><b>{weatherScenario === "send-failure" ? "发送失败" : weatherScenario === "already-sent" ? "识别今日记录" : "确认发送"}</b></li>
                    <li><span>3</span><b>{weatherScenario === "send-failure" ? "恢复并重发成功" : weatherScenario === "already-sent" ? "阻止重复发送" : "完成并返回"}</b></li>
                  </ol>
                )}
                <div className="weather-acceptance-actions">
                  <button type="button" onClick={() => onSetWeatherScenario("default")}>恢复正常</button>
                  <button type="button" className="is-primary" onClick={() => onOpenWeatherScenario(weatherAcceptanceTarget)}>
                    {weatherAcceptanceTarget === "home"
                      ? "查看首页天气"
                      : weatherAcceptanceTarget === "detail"
                        ? "打开天气详情"
                        : weatherScenario === "send-failure"
                          ? "开始异常恢复验收"
                          : weatherScenario === "already-sent"
                            ? "查看今日发送记录"
                          : "开始正常发送验收"}
                  </button>
                </div>
              </div>
              <p className="interaction-acceptance-note">
                {weatherAcceptanceTarget === "care" && weatherScenario === "send-failure"
                  ? "发送失败统一覆盖断网和服务异常；保留原文，重新发送沿用同一请求且只产生一条消息。"
                  : weatherAcceptanceTarget === "care" && weatherScenario === "already-sent"
                    ? "直接展示今日发送记录，并阻止当天重复发送。"
                  : weatherAcceptanceTarget === "care"
                    ? "进入固定话术确认页，发送成功后点“完成并返回首页”结束验收。"
                    : "先选择状态，再执行验收动作；验收台保持展开。"}
              </p>
            </section>}

            {activeSection === "emergency" && <section>
              <div className="interaction-acceptance-field">
                <h2><Siren aria-hidden="true" />紧急呼叫</h2>
                <p>只展示主流程中难以稳定触发的呼叫结果</p>
                <div className="interaction-acceptance-grid is-two-columns">
                  <button type="button" onClick={() => onOpenEmergencyScenario("connected")}><UserRoundCheck />已接通</button>
                  <button type="button" className="is-danger" onClick={() => onOpenEmergencyScenario("call-failure")}><CloudOff />呼叫失败</button>
                </div>
              </div>
              <p className="interaction-acceptance-note">呼叫确认、倒计时、继续呼叫和误触操作已在正常页面体现，不在验收台重复设置。</p>
            </section>}

            {activeSection === "task-progress" && <section>
              <div className="interaction-acceptance-field">
                <h2><CheckCircle2 aria-hidden="true" />今日任务状态</h2>
                <div className="interaction-acceptance-grid is-two-columns">
                  {(Object.keys(taskLabels) as AcceptanceTaskScenario[]).map((scenario) => (
                    <button key={scenario} type="button" className={taskScenario === scenario ? "is-active" : ""} onClick={() => onSetTaskScenario(scenario)}>
                      <CheckCircle2 />{taskLabels[scenario]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="interaction-acceptance-field">
                <h2><Sparkles aria-hidden="true" />当前核心内容</h2>
                <div className="interaction-acceptance-grid is-two-columns">
                  {(Object.keys(taskContentLabels) as AcceptanceTaskContentScenario[]).map((scenario) => (
                    <button key={scenario} type="button" className={taskContentScenario === scenario ? "is-active" : ""} onClick={() => onSetTaskContentScenario(scenario)}>
                      <Sparkles />{taskContentLabels[scenario]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="interaction-acceptance-field">
                <h2><BellRing aria-hidden="true" />首页提前 5 分钟弹窗</h2>
                <div className="interaction-acceptance-grid is-two-columns">
                  <button type="button" onClick={() => onOpenHomeReminderAlert("medicine")}>
                    <Pill />用药提醒弹窗
                  </button>
                  <button type="button" onClick={() => onOpenHomeReminderAlert("schedule")}>
                    <CalendarDays />日常提醒弹窗
                  </button>
                </div>
              </div>

              <div className="interaction-acceptance-field">
                <h2><Clock3 aria-hidden="true" />履约记录</h2>
                <div className="interaction-acceptance-grid is-two-columns">
                  {(Object.keys(recordLabels) as AcceptanceRecordScenario[]).map((scenario) => (
                    <button key={scenario} type="button" className={recordScenario === scenario ? "is-active" : ""} onClick={() => onSetRecordScenario(scenario)}>
                      <Clock3 />{recordLabels[scenario]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="interaction-acceptance-field">
                <h2><Sparkles aria-hidden="true" />无 P0 关怀文案</h2>
                <p>优先级：夜深问候 ＞ 灾害突变 ＞ 节气 ＞ 养生 ＞ 日常兜底</p>
                <div className="interaction-acceptance-grid is-two-columns">
                  {(Object.keys(careRegionLabels) as AcceptanceCareRegion[]).map((region) => (
                    <button key={region} type="button" className={careRegion === region ? "is-active" : ""} onClick={() => onSetCareRegion(region)}>
                      <MapPinOff />{careRegionLabels[region]}
                    </button>
                  ))}
                </div>
                <div className="interaction-acceptance-grid is-two-columns">
                  {(Object.keys(careTimeLabels) as AcceptanceCareTime[]).map((time) => (
                    <button key={time} type="button" className={careTime === time ? "is-active" : ""} onClick={() => onSetCareTime(time)}>
                      <Clock3 />{careTimeLabels[time]}
                    </button>
                  ))}
                </div>
                {careTime !== "late-night" && <>
                  <div className="interaction-acceptance-grid is-two-columns">
                    {(Object.keys(careModeLabels) as AcceptanceCareMode[]).map((mode) => (
                      <button key={mode} type="button" className={careMode === mode ? "is-active" : ""} onClick={() => onSetCareMode(mode)}>
                        <ShieldAlert />{careModeLabels[mode]}
                      </button>
                    ))}
                  </div>
                  {careMode === "disaster" ? (
                    <div className="interaction-acceptance-grid is-two-columns">
                      {(Object.keys(disasterLabels) as AcceptanceDisasterScenario[]).map((scenario) => (
                        <button key={scenario} type="button" className={disasterScenario === scenario ? "is-active" : ""} onClick={() => onSetDisasterScenario(scenario)}>
                          <ShieldAlert />{disasterLabels[scenario]}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="interaction-acceptance-grid is-two-columns">
                      {(Object.keys(careScenarioLabels) as AcceptanceCareScenario[]).map((scenario) => (
                        <button key={scenario} type="button" className={careScenario === scenario ? "is-active" : ""} onClick={() => onSetCareScenario(scenario)}>
                          <Sparkles />{careScenarioLabels[scenario]}
                        </button>
                      ))}
                    </div>
                  )}
                </>}
              </div>
              <p className="interaction-acceptance-note">选择后立即联动首页；具体时段、节日、天气和地区文案按 PRD 规则匹配，不逐条设置验收按钮。</p>
            </section>}
          </div>

          <footer>
            <button type="button" className="is-activation" onClick={() => runAndClose(onOpenActivation)}><TabletSmartphone aria-hidden="true" />进入设备激活验收</button>
            <button type="button" onClick={() => runAndClose(onReset)}><RefreshCcw aria-hidden="true" />恢复首页默认数据</button>
          </footer>
        </div>
      )}
    </aside>
  );
}
