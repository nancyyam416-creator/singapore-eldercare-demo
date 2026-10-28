import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  BellRing,
  CalendarCheck2,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  CloudSun,
  Clock3,
  Droplets,
  Heart,
  Home,
  Images,
  Info,
  MessageCircle,
  Mic,
  PhoneCall,
  Pill,
  Plus,
  Radio,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Settings2,
  Upload,
  UserRound,
  Users,
  Video,
  Volume2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import AcceptanceWorkbench, { type AcceptanceModuleId, type AcceptancePageId } from './AcceptanceWorkbench';
import { ACCEPTANCE_WORKBENCH_ENABLED, U2G_PORTAL_URL } from './config';
import MobileAppShell from './MobileAppShell';
import ElderPageHeader from './ElderPageHeader';
import AppointmentServicesPage, { type AppointmentScenario } from './AppointmentServicesPage';

type MainTab = 'home' | 'family' | 'reminders' | 'activities' | 'services' | 'profile';
type Overlay = 'photo' | 'reminder' | null;
type ReminderType = 'medication' | 'daily';
type RepeatType = 'once' | 'daily' | 'weekly';
type ActivityParticipation = 'interested' | 'not_interested';
type Activity = { id: string; title: string; time: string; location: string; spotsLeft: number; tag: string; imageUrl: string; description: string; contact: string; status: 'registration' | 'ongoing' | 'ended' | 'cancelled'; liveEnabled: boolean; liveStatus: 'not_started' | 'live' | 'ended'; scheduledLiveStartAt?: string };
type ServiceCategory = 'water' | 'electric' | 'repair';
type BindingStatus = 'pending' | 'success' | 'rejected' | 'expired' | 'tablet-approved' | 'tablet-rejected' | 'network';
type PhotoVoiceState = 'idle' | 'listening' | 'processing' | 'error';
type ReminderFilter = 'all' | ReminderType;
type ReminderView = 'today' | 'rules';
type ReminderItem = { id: string; ruleId: string; type: ReminderType; time: string; title: string; detail: string; repeat: string; completed: boolean };
type ReminderRule = { id: string; type: ReminderType; title: string; detail: string; times: string[]; repeat: string; nextAt: string; enabled: boolean };

const photos = [
  { id: 1, title: '周末花园散步', date: '今天 09:20', tone: 'garden' },
  { id: 2, title: '家里的兰花开了', date: '昨天 16:10', tone: 'flowers' },
  { id: 3, title: '和老朋友喝茶', date: '10月19日', tone: 'tea' },
  { id: 4, title: '社区晨练', date: '10月18日', tone: 'exercise' },
];

const activities: Activity[] = [
  { id: 'act-1', title: '社区剪纸活动', time: '明天上午 10:00 - 11:30', location: '社区多功能活动室', spotsLeft: 3, tag: '手工活动', imageUrl: '/assets/community/activity-paper-cutting.jpg', description: '社区老师带大家完成一幅简单剪纸作品，材料由社区准备。', contact: '010-6258 8890', status: 'registration', liveEnabled: false, liveStatus: 'not_started' },
  { id: 'act-2', title: '防范养老诈骗与智能手机技巧宣讲会', time: '明天下午 14:30 - 15:30', location: '居委会大楼二楼会议室', spotsLeft: 12, tag: '安全科普', imageUrl: '/assets/community/activity-smartphone-class.jpg', description: '社区民警讲解常见养老诈骗，并演示手机来电识别和安全设置。', contact: '010-6258 8890', status: 'registration', liveEnabled: false, liveStatus: 'not_started' },
  { id: 'act-3', title: '夏季中医老年膳食养生调理座谈', time: '今天上午 10:00 - 11:00', location: '社区多功能助老俱乐部（同步直播）', spotsLeft: 7, tag: '健康膳食', imageUrl: '/assets/community-live-preview.jpg', description: '社区健康老师介绍夏季饮食搭配和常见食材选择。', contact: '010-6258 8890', status: 'ongoing', liveEnabled: true, liveStatus: 'live', scheduledLiveStartAt: '今天上午 10:00' },
];

const communityAlerts = [
  { id: 'tip-1', title: '警惕“冒充公检法安全账户”巨额骗局', summary: '只要对方要求转账到“安全账户”，立即挂断。', description: '近期有不法分子冒充公安、检察院或法院工作人员打电话，声称您的账户涉嫌洗钱、诈骗或其他违法行为，并要求您配合所谓的“资金核查”。\n\n请您记住，公安、检察院和法院不会通过电话要求群众转账，也没有所谓的“安全账户”。如果对方要求提供银行卡、身份证、短信验证码，或者要求您把钱转到指定账户，请立即挂断电话。\n\n挂断后，请使用平时保存的电话号码联系家人核实。确实存在资金损失或对方持续骚扰时，可以拨打 110 寻求帮助。不要拨打陌生人提供的任何联系电话。', category: '反诈防骗', source: '公安反诈中心', coverUrl: '/assets/community/alert-phone-security.jpg' },
  { id: 'tip-2', title: '提防“保健品理财讲座、免费送礼品”套路', summary: '先不付款、不签字，回家与家人商量后再决定。', description: '一些商家会以免费赠送鸡蛋、大米、小家电或者免费体检为由，邀请长者参加所谓的健康讲座。讲座中可能夸大产品功效，宣称某种保健品能够治疗多种疾病，并催促现场付款。\n\n保健食品不能代替药物，也不能治疗疾病。遇到需要支付大额费用、办理会员或者购买多年疗程的情况，请不要当场付款，不要签署自己没有看懂的文件。\n\n可以先把产品名称、宣传单和商家联系方式带回家，与家人、医生或社区工作人员商量后再决定。', category: '消费安全', source: '社区民警', coverUrl: '/assets/community/alert-senior-seminar.jpg' },
  { id: 'tip-3', title: '冒充亲属熟人“住院急需转账”紧急短信', summary: '不要着急汇款，先用家人原来的电话号码核实。', description: '如果突然收到自称儿女、孙辈或其他亲属的信息，对方说手机损坏、发生车祸、住院或者被拘留，并要求您立即向陌生账户转账，请先停下来核实。\n\n不要按照信息中的要求保持保密，也不要拨打对方临时提供的新号码。请直接拨打家人平时使用的电话号码，或者联系其他亲属确认情况。\n\n如果暂时联系不上家人，可以请社区工作人员协助。在确认对方真实身份之前，不要进行任何转账操作。', category: '亲情诈骗', source: '社区民警', coverUrl: '/assets/community/alert-phone-message.jpg' },
] as const;

const initialReminderItems: ReminderItem[] = [
  { id: 'i1', ruleId: 'r1', type: 'medication', time: '08:00', title: '日常补钙', detail: '维生素D 1片，饭后服用', repeat: '每天 2 次', completed: true },
  { id: 'i2', ruleId: 'r2', type: 'daily', time: '09:30', title: '测量血压', detail: '坐下休息后测量并记录', repeat: '每天', completed: true },
  { id: 'i3', ruleId: 'r1', type: 'medication', time: '19:00', title: '日常补钙', detail: '碳酸钙D3片 1片，温水送服', repeat: '每天 2 次', completed: false },
  { id: 'i4', ruleId: 'r3', type: 'daily', time: '20:30', title: '给女儿回电话', detail: '吃完晚饭后聊一聊', repeat: '仅一次', completed: false },
];

const initialReminderRules: ReminderRule[] = [
  { id: 'r1', type: 'medication', title: '日常补钙', detail: '早餐后维生素D，晚间碳酸钙D3片', times: ['08:00', '19:00'], repeat: '每天 2 次', nextAt: '今天 19:00', enabled: true },
  { id: 'r2', type: 'daily', title: '测量血压', detail: '坐下休息后测量并记录', times: ['09:30'], repeat: '每天', nextAt: '明天 09:30', enabled: true },
  { id: 'r3', type: 'daily', title: '给女儿回电话', detail: '吃完晚饭后聊一聊', times: ['20:30'], repeat: '仅一次', nextAt: '今天 20:30', enabled: true },
  { id: 'r4', type: 'medication', title: '午间胃药', detail: '饭前半小时服用 1 片', times: ['11:30'], repeat: '每天', nextAt: '已停用', enabled: false },
  { id: 'r5', type: 'daily', title: '周末散步', detail: '到楼下花园慢走半小时', times: ['08:30'], repeat: '每周六', nextAt: '10月24日 08:30', enabled: true },
];

const serviceData = {
  water: {
    label: '水路服务',
    provider: '安心到家水务服务站',
    Icon: Droplets,
    tone: 'blue',
    items: [
      { id: 'w1', name: '水龙头检修', range: 'S$30–80', detail: '检查漏水、松动和出水异常，具体材料费用另行确认。' },
      { id: 'w2', name: '水管漏水检查', range: 'S$50–150', detail: '上门检查可见水管和接口，复杂施工需商家进一步确认。' },
    ],
  },
  electric: {
    label: '电路服务',
    provider: '社区安心电工服务站',
    Icon: Zap,
    tone: 'amber',
    items: [
      { id: 'e1', name: '灯具与开关检查', range: 'S$35–90', detail: '检查常用灯具、插座或开关的简单故障。' },
      { id: 'e2', name: '家庭电路排查', range: 'S$80–220', detail: '排查跳闸或局部断电问题，最终价格由商家确认。' },
    ],
  },
  repair: {
    label: '居家维修',
    provider: '乐居综合维修服务站',
    Icon: Wrench,
    tone: 'violet',
    items: [
      { id: 'r1', name: '门锁与把手维修', range: 'S$40–120', detail: '检查门锁、把手松动或开合不顺等问题。' },
      { id: 'r2', name: '家具小修', range: 'S$45–160', detail: '处理桌椅松动、柜门偏移等常见小型维修。' },
    ],
  },
} as const;

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="overlay" role="presentation">
      <section className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header className="sheet-header">
          <div><span>U2G 家庭关怀</span><h2>{title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label={`关闭${title}`}><X /></button>
        </header>
        <div className="sheet-body">{children}</div>
      </section>
    </div>
  );
}

function SuccessPanel({ title, description, onDone }: { title: string; description: string; onDone: () => void }) {
  return <div className="success-panel"><span><Check /></span><h3>{title}</h3><p>{description}</p><button className="primary-button" onClick={onDone}>完成</button></div>;
}

export default function App() {
  const [tab, setTab] = useState<MainTab>('home');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [toast, setToast] = useState('');
  const [photoStep, setPhotoStep] = useState<'edit' | 'success'>('edit');
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([1, 2]);
  const [photoNote, setPhotoNote] = useState('今天阳光很好，和大家分享一下。');
  const [photoVoiceState, setPhotoVoiceState] = useState<PhotoVoiceState>('idle');
  const [reminderStep, setReminderStep] = useState<'edit' | 'success'>('edit');
  const [reminderType, setReminderType] = useState<ReminderType>('medication');
  const [reminderTitle, setReminderTitle] = useState('晚间降压药');
  const [reminderDetail, setReminderDetail] = useState('氨氯地平 1片，饭后服用');
  const [repeat, setRepeat] = useState<RepeatType>('daily');
  const [reminderDate, setReminderDate] = useState('2026-10-22');
  const [reminderTime, setReminderTime] = useState('19:00');
  const [reminderAddedToday, setReminderAddedToday] = useState(false);
  const [weekdays, setWeekdays] = useState<string[]>(['一', '三', '五']);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activityParticipation, setActivityParticipation] = useState<Record<string, ActivityParticipation>>({});
  const [activityIntentFailure, setActivityIntentFailure] = useState<ActivityParticipation | null>(null);
  const [activitySubmitShouldFail, setActivitySubmitShouldFail] = useState(false);
  const [liveActivity, setLiveActivity] = useState<Activity | null>(null);
  const [communityView, setCommunityView] = useState<'activities' | 'alerts'>('activities');
  const [selectedAlert, setSelectedAlert] = useState<(typeof communityAlerts)[number] | null>(null);
  const [alertReadIds, setAlertReadIds] = useState<string[]>([]);
  const [alertSpeechState, setAlertSpeechState] = useState<'playing' | 'paused' | null>(null);
  const [isOnline] = useState(() => navigator.onLine);
  const [appointmentScenario, setAppointmentScenario] = useState<AppointmentScenario>('list');
  const [servicesOpen, setServicesOpen] = useState(false);
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>('water');
  const [selectedService, setSelectedService] = useState<(typeof serviceData)[ServiceCategory]['items'][number] | null>(null);
  const [serviceStep, setServiceStep] = useState<'detail' | 'confirm' | 'success'>('detail');
  const [bindingOpen, setBindingOpen] = useState(false);
  const [bindingStatus, setBindingStatus] = useState<BindingStatus>('pending');
  const [bindingConfirmOpen, setBindingConfirmOpen] = useState(false);
  const [reminderFilter, setReminderFilter] = useState<ReminderFilter>('all');
  const [reminderView, setReminderView] = useState<ReminderView>('today');
  const [reminderItems, setReminderItems] = useState<ReminderItem[]>(initialReminderItems);
  const [reminderRules, setReminderRules] = useState<ReminderRule[]>(initialReminderRules);
  const [acceptancePageId, setAcceptancePageId] = useState<AcceptancePageId>('home');
  const [acceptanceModuleId, setAcceptanceModuleId] = useState<AcceptanceModuleId>('home-schedule');
  const [homeScheduleScenario, setHomeScheduleScenario] = useState('default');
  const [homeFamilyScenario, setHomeFamilyScenario] = useState('default');
  const [familyAlbumScenario, setFamilyAlbumScenario] = useState('default');
  const [activityListScenario, setActivityListScenario] = useState('default');
  const [guardianScenario, setGuardianScenario] = useState('default');

  const pageTitle = bindingOpen ? '家庭关系确认' : tab === 'home' ? '首页' : tab === 'family' ? '家庭' : tab === 'reminders' ? '提醒' : tab === 'activities' ? '社区' : tab === 'services' ? '预约服务' : '我的';
  const currentService = serviceData[serviceCategory];
  const canSaveReminder = reminderTitle.trim() && (reminderType === 'daily' || reminderDetail.trim()) && (repeat !== 'weekly' || weekdays.length > 0);
  const filteredReminders = useMemo(() => reminderItems, [reminderItems]);
  const pendingReminders = useMemo(() => filteredReminders.filter(item => !item.completed), [filteredReminders]);
  const completedReminders = useMemo(() => filteredReminders.filter(item => item.completed), [filteredReminders]);
  const filteredReminderRules = useMemo(() => reminderRules.filter(rule => reminderFilter === 'all' || rule.type === reminderFilter), [reminderFilter, reminderRules]);
  const todayPendingCount = reminderItems.filter(item => !item.completed).length;

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(''), 2200);
  };

  const saveActivityIntent = (activity: Activity, intent: ActivityParticipation, retry = false) => {
    if (activity.status === 'ended' || activity.status === 'cancelled') return;
    if (activitySubmitShouldFail && !retry) {
      setActivityIntentFailure(intent);
      return;
    }
    setActivityParticipation(current => ({ ...current, [activity.id]: intent }));
    setActivityIntentFailure(null);
    setActivitySubmitShouldFail(false);
    showToast(intent === 'interested' ? '已选择：我想参加' : '已选择：暂不参加');
  };

  const openAlert = (alert: (typeof communityAlerts)[number]) => {
    window.speechSynthesis.cancel();
    setAlertSpeechState(null);
    setSelectedAlert(alert);
    setAlertReadIds(current => current.includes(alert.id) ? current : [...current, alert.id]);
    setAcceptanceModuleId('community-alerts');
  };

  const startAlertSpeech = (restart = false) => {
    if (!selectedAlert) return;
    if (!restart && alertSpeechState === 'paused') {
      window.speechSynthesis.resume();
      setAlertSpeechState('playing');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${selectedAlert.title}。${selectedAlert.summary}。${selectedAlert.description}`);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.86;
    utterance.onend = () => setAlertSpeechState(null);
    utterance.onerror = () => setAlertSpeechState(null);
    window.speechSynthesis.speak(utterance);
    setAlertSpeechState('playing');
  };

  const pauseAlertSpeech = () => {
    window.speechSynthesis.pause();
    setAlertSpeechState('paused');
  };

  useEffect(() => () => window.speechSynthesis.cancel(), []);

  const openOverlay = (next: Exclude<Overlay, null>) => {
    if (next === 'photo') { setPhotoStep('edit'); setPhotoVoiceState('idle'); }
    if (next === 'reminder') { setReminderStep('edit'); setReminderAddedToday(false); }
    setOverlay(next);
  };

  const finishPhotoVoiceInput = () => {
    setPhotoVoiceState('processing');
    window.setTimeout(() => {
      setPhotoNote('今天天气很好，我在花园散步，拍了几张照片给大家看看。');
      setPhotoVoiceState('idle');
    }, 900);
  };

  const goTo = (next: MainTab) => {
    setSelectedActivity(null);
    setSelectedAlert(null);
    setLiveActivity(null);
    setActivityIntentFailure(null);
    window.speechSynthesis.cancel();
    setAlertSpeechState(null);
    setSelectedService(null);
    setServicesOpen(false);
    setServiceStep('detail');
    setTab(next);
    setAcceptancePageId(next);
    setAcceptanceModuleId(next === 'home' ? 'home-schedule' : next === 'family' ? 'family-album' : next === 'reminders' ? 'reminder-today' : next === 'activities' ? 'activity-list' : next === 'services' ? 'service-booking' : 'profile-guardians');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearTransientState = () => {
    setOverlay(null);
    setToast('');
    setPhotoStep('edit');
    setPhotoVoiceState('idle');
    setReminderStep('edit');
    setReminderFilter('all');
    setSelectedService(null);
    setServicesOpen(false);
    setServiceStep('detail');
    setBindingConfirmOpen(false);
    setLiveActivity(null);
    setActivityIntentFailure(null);
    setActivitySubmitShouldFail(false);
    window.speechSynthesis.cancel();
    setAlertSpeechState(null);
  };

  const changeAcceptanceContext = (pageId: AcceptancePageId, moduleId: AcceptanceModuleId) => {
    clearTransientState();
    setAcceptancePageId(pageId);
    setAcceptanceModuleId(moduleId);
    setBindingOpen(false);
    setSelectedActivity(null);
    setSelectedAlert(null);
    setTab(pageId);
    if (moduleId === 'reminder-today') setReminderView('today');
    if (moduleId === 'reminder-rules') setReminderView('rules');
    if (moduleId === 'activity-detail') setSelectedActivity(activities[0]);
    if (moduleId === 'community-alerts') setCommunityView('alerts');
    if (moduleId === 'service-booking') setAppointmentScenario('list');
    document.querySelector('.app-content')?.scrollTo({ top: 0, behavior: 'auto' });
  };

  const applyAcceptanceScenario = (pageId: AcceptancePageId, moduleId: AcceptanceModuleId, scenario: string) => {
    changeAcceptanceContext(pageId, moduleId);
    if (moduleId === 'home-schedule') setHomeScheduleScenario(scenario);
    if (moduleId === 'home-family') setHomeFamilyScenario(scenario);
    if (moduleId === 'family-album') setFamilyAlbumScenario(scenario);
    if (moduleId === 'reminder-today') setReminderItems(scenario === 'empty' ? [] : initialReminderItems.map(item => ({ ...item, completed: scenario === 'completed' ? true : item.completed })));
    if (moduleId === 'reminder-rules') setReminderRules(scenario === 'empty' ? [] : initialReminderRules.map(rule => ({ ...rule })));
    if (moduleId === 'activity-list') setActivityListScenario(scenario);
    if (moduleId === 'activity-detail') {
      setSelectedActivity(activities[0]);
      setActivityParticipation(scenario === 'interested' ? { [activities[0].id]: 'interested' } : scenario === 'not_interested' ? { [activities[0].id]: 'not_interested' } : {});
      setActivitySubmitShouldFail(scenario === 'submission_failure');
      setActivityIntentFailure(null);
    }
    if (moduleId === 'community-alerts') {
      setCommunityView('alerts');
      setAlertReadIds(scenario === 'detail' ? [communityAlerts[0].id] : []);
      setSelectedAlert(scenario === 'detail' ? communityAlerts[0] : null);
    }
    if (moduleId === 'service-booking') setAppointmentScenario(scenario as AppointmentScenario);
    if (moduleId === 'profile-guardians') setGuardianScenario(scenario);
    if (moduleId === 'profile-binding') {
      setBindingStatus(scenario as BindingStatus);
      setBindingOpen(true);
    }
  };

  const runAcceptanceAction = (action: string) => {
    if (action === 'open-reminders') goTo('reminders');
    if (action === 'open-family') goTo('family');
    if (action === 'open-photo') openOverlay('photo');
    if (action === 'open-reminder') openOverlay('reminder');
    if (action === 'open-first-activity') { setTab('activities'); setSelectedActivity(activities[0]); setAcceptancePageId('activities'); setAcceptanceModuleId('activity-detail'); }
    if (action === 'open-first-alert') { setTab('activities'); setCommunityView('alerts'); openAlert(communityAlerts[0]); setAcceptancePageId('activities'); setAcceptanceModuleId('community-alerts'); }
    if (action === 'open-services') goTo('services');
    if (action === 'open-binding') { setTab('profile'); setBindingStatus('pending'); setBindingOpen(true); setAcceptancePageId('profile'); setAcceptanceModuleId('profile-binding'); }
  };

  const toggleReminderRule = (rule: ReminderRule) => {
    const nextEnabled = !rule.enabled;
    setReminderRules(current => current.map(item => item.id === rule.id ? { ...item, enabled: nextEnabled, nextAt: nextEnabled ? (item.times.some(time => time > '18:04') ? `今天 ${item.times.find(time => time > '18:04')}` : `明天 ${item.times[0]}`) : '已停用' } : item));
    if (!nextEnabled) {
      setReminderItems(current => current.filter(item => item.ruleId !== rule.id || item.completed));
    } else {
      const futureTimes = rule.times.filter(time => time > '18:04');
      setReminderItems(current => [...current, ...futureTimes.filter(time => !current.some(item => item.ruleId === rule.id && item.time === time)).map(time => ({ id: `${rule.id}-${time}`, ruleId: rule.id, type: rule.type, time, title: rule.title, detail: rule.detail, repeat: rule.repeat, completed: false }))].sort((a, b) => a.time.localeCompare(b.time)));
    }
  };

  const scheduleAllCompleted = homeScheduleScenario === 'completed';
  const visibleFamilyPhotos = familyAlbumScenario === 'empty' ? [] : photos;
  const visibleActivities = activityListScenario === 'empty' ? [] : activities;
  const activityStatusLabel = (activity: Activity) => activity.status === 'ongoing' ? '正在进行' : activity.status === 'ended' ? '活动已结束' : activity.status === 'cancelled' ? '活动已取消' : `还剩 ${activity.spotsLeft} 个名额`;
  const alertReadingMinutes = (alert: (typeof communityAlerts)[number]) => Math.max(1, Math.ceil(`${alert.title}${alert.summary}${alert.description}`.length / 260));

  const homePage = <>
    <section className="hero-card">
      <div><span className="eyebrow">星期四 · 10月22日</span><h2>新加坡 · 多云</h2><p>体感 32°C，午后可能有短时阵雨，外出记得带伞。</p></div>
      <div className="hero-weather"><CloudSun /><strong>29°</strong><span>多云</span></div>
    </section>

    <button className="binding-notice" onClick={() => { setBindingStatus('pending'); setBindingOpen(true); }}>
      <span><Heart /></span>
      <div><small>新的家人申请</small><strong>张建国想与您建立家庭关系</strong><p>请核对是不是您的家人</p></div>
      <b>去确认</b>
    </button>

    <section className="home-module daily-schedule">
      <header className="home-module-header">
        <span><CalendarDays /></span>
        <div><h2>今日安排</h2><p>用药和活动按时间先后排列</p></div>
        <b>按时间</b>
      </header>
      <div className="schedule-list">
        {homeScheduleScenario === 'empty' ? <div className="acceptance-empty-state"><CalendarDays /><strong>今天暂无安排</strong><span>新的提醒或活动会显示在这里</span></div> : <>
        <div className="schedule-row completed">
          <i><Check /></i>
          <div className="schedule-item"><span><time>08:00</time><b>已完成</b></span><strong><Pill />早餐后用药</strong><p>维生素D 1片</p></div>
        </div>
        <button className={`schedule-row ${scheduleAllCompleted ? 'completed' : 'urgent'}`} onClick={() => goTo('reminders')}>
          <i>{scheduleAllCompleted ? <Check /> : '!'}</i>
          <div className="schedule-item"><span><time>17:30</time><b>{scheduleAllCompleted ? '已完成' : '已超时 56 分钟'}</b></span><strong><Pill />碳酸钙D3片</strong><p>1片，温水送服</p></div>
          <ChevronRight />
        </button>
        <button className={`schedule-row ${scheduleAllCompleted ? 'completed' : 'upcoming'}`} onClick={() => { setTab('activities'); setSelectedActivity(activities[0]); setAcceptancePageId('activities'); setAcceptanceModuleId('activity-detail'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <i>{scheduleAllCompleted ? <Check /> : <CalendarDays />}</i>
          <div className="schedule-item"><span><time>18:30</time><b>{scheduleAllCompleted ? '已完成' : '2 小时后开始'}</b></span><strong><CalendarDays />银龄健康操</strong><p>社区活动室</p></div>
          <ChevronRight />
        </button>
        <button className={`schedule-row ${scheduleAllCompleted ? 'completed' : 'waiting'}`} onClick={() => goTo('reminders')}>
          <i>{scheduleAllCompleted ? <Check /> : <Clock3 />}</i>
          <div className="schedule-item"><span><time>19:00</time><b>{scheduleAllCompleted ? '已完成' : '稍后提醒'}</b></span><strong><Pill />晚间降压药</strong><p>氨氯地平 1片</p></div>
          <ChevronRight />
        </button>
        </>}
      </div>
    </section>

    <section className="home-module family-glance">
      <header className="home-module-header">
        <span><Images /></span>
        <div><h2>家人最近分享</h2><p>推荐看看</p></div>
        <button onClick={() => goTo('family')}>查看全部</button>
      </header>
      {homeFamilyScenario === 'empty' ? <div className="acceptance-empty-state"><Images /><strong>暂无家人分享</strong><span>家人的照片和留言会显示在这里</span></div> : <><div className="photo-row">{photos.slice(0, 3).map(photo => <button key={photo.id} onClick={() => goTo('family')} className={`photo-tile ${photo.tone}`}><span>{photo.title}</span></button>)}</div>
      <div className="family-message-heading"><MessageCircle /><strong>家人留言</strong><span>2 条新消息</span></div>
      <div className="family-message-list">
        <button onClick={() => goTo('family')}><span className="message-avatar daughter">女儿</span><div><strong>张晓燕</strong><p>妈妈，晚上记得吃降压药，我下班后给您打电话。</p><small>今天 16:45</small></div><ChevronRight /></button>
        <button onClick={() => goTo('family')}><span className="message-avatar son">儿子</span><div><strong>张建平</strong><p>周末我带您去公园走走，天气好我们再拍些照片。</p><small>昨天 20:18</small></div><ChevronRight /></button>
      </div></>}
    </section>

  </>;

  const familyPage = <>
    <ElderPageHeader title="家人分享" description="查看家人分享的照片和视频，也可以发布新的相册。" />
    <section className="family-actions family-photo-only">
      <button onClick={() => openOverlay('photo')} className="family-action photo-action"><Upload /><div><strong>发相册</strong><span>直接分享给已绑定家人</span></div><ChevronRight /></button>
    </section>
    <div className="section-heading"><div><span>家庭相册</span><h2>最近的照片和视频</h2></div></div>
    <section className="gallery">{visibleFamilyPhotos.map(photo => <button key={photo.id} className={`gallery-card ${photo.tone}`} onClick={() => showToast('影像详情已打开')}><span className="gallery-badge">{photo.id === 4 ? <><Video />视频</> : <><Camera />照片</>}</span><div><strong>{photo.title}</strong><small>{photo.date}</small></div></button>)}</section>
    {!visibleFamilyPhotos.length && <div className="acceptance-empty-state standalone"><Images /><strong>暂无照片和视频</strong><span>点击“发相册”与家人分享近况</span></div>}
  </>;

  const remindersPage = <>
    <ElderPageHeader title="我的提醒" description="今天要做的事和长期提醒规则，都在这里管理。" action={<button onClick={() => openOverlay('reminder')}><Plus />新增提醒</button>} />
    <div className="reminder-view-switch elder-segmented-control" role="tablist" aria-label="提醒视图">
      <button role="tab" aria-selected={reminderView === 'today'} className={reminderView === 'today' ? 'active' : ''} onClick={() => setReminderView('today')}><strong>今天</strong><span>{todayPendingCount ? `${todayPendingCount} 项待完成` : '已全部完成'}</span></button>
      <button role="tab" aria-selected={reminderView === 'rules'} className={reminderView === 'rules' ? 'active' : ''} onClick={() => setReminderView('rules')}><strong>全部提醒</strong><span>{reminderRules.length} 条规则</span></button>
    </div>
    {reminderView === 'today' ? <>
      <section className="reminder-status-group pending-group">
        <header className="elder-section-heading"><div><BellRing /><span><h2>待完成</h2><p>请按时间完成以下事项</p></span></div><b className="elder-count-badge">{pendingReminders.length} 项</b></header>
        <div className="list-stack reminder-list">
        {pendingReminders.map(item => <article key={item.id} className="list-card reminder-item elder-content-card pending">
          <span className={`list-icon elder-icon-box ${item.type === 'medication' ? 'blue-bg' : 'amber-bg'}`}>{item.type === 'medication' ? <Pill /> : <CalendarDays />}</span>
          <div><small><time>{item.time}</time><em>{item.type === 'medication' ? '用药' : '日常'}</em></small><h3>{item.title}</h3><p>{item.detail}</p></div>
          <button className="complete-reminder-button elder-primary-action" aria-label={`将${item.title}标记为完成`} onClick={() => setReminderItems(current => current.map(currentItem => currentItem.id === item.id ? { ...currentItem, completed: true } : currentItem))}><Check /><span>标记完成</span></button>
        </article>)}
        {!pendingReminders.length && <div className="reminder-group-empty success"><CheckCircle2 /><strong>今天的事项都完成了</strong></div>}
        </div>
      </section>
      {!!completedReminders.length && <section className="reminder-status-group completed-group">
        <header className="elder-section-heading"><div><CheckCircle2 /><span><h2>已完成</h2><p>今天已经完成的事项</p></span></div><b className="elder-count-badge">{completedReminders.length} 项</b></header>
        <div className="list-stack reminder-list">
          {completedReminders.map(item => <article key={item.id} className="list-card reminder-item elder-content-card completed">
            <span className="completed-icon elder-icon-box"><Check /></span>
            <div><small><time>{item.time}</time><em>{item.type === 'medication' ? '用药' : '日常'}</em></small><h3>{item.title}</h3><p>{item.detail}</p><span className="reminder-meta"><strong className="elder-status-badge"><Check />已完成</strong></span></div>
          </article>)}
        </div>
      </section>}
      {!filteredReminders.length && <div className="acceptance-empty-state standalone"><BellRing /><strong>今天没有提醒</strong><span>新增提醒后会按时间显示在这里</span></div>}
    </> : <>
      <div className="reminder-filter" role="group" aria-label="提醒规则类型筛选">{([['all', '全部规则'], ['medication', '用药'], ['daily', '日常']] as const).map(([key, label]) => <button key={key} className={reminderFilter === key ? 'active' : ''} onClick={() => setReminderFilter(key)}>{label}</button>)}</div>
      <section className="list-stack reminder-rule-list">{filteredReminderRules.map(rule => <article key={rule.id} className={`reminder-rule-card elder-content-card ${rule.enabled ? '' : 'disabled'}`}>
        <div className="rule-card-header"><span className={`list-icon elder-icon-box ${rule.type === 'medication' ? 'blue-bg' : 'amber-bg'}`}>{rule.type === 'medication' ? <Pill /> : <CalendarDays />}</span><div><small>{rule.type === 'medication' ? '用药提醒' : '日常提醒'}</small><h3>{rule.title}</h3><p>{rule.detail}</p></div><button className={`rule-toggle ${rule.enabled ? 'on' : ''}`} onClick={() => toggleReminderRule(rule)} aria-label={`${rule.enabled ? '停用' : '启用'}${rule.title}`}><i /></button></div>
        <dl><div><dt>执行时间</dt><dd>{rule.times.join('、')}</dd></div><div><dt>重复方式</dt><dd>{rule.repeat}</dd></div><div><dt>下次提醒</dt><dd>{rule.nextAt}</dd></div></dl>
        <button className="rule-edit" onClick={() => showToast(`${rule.title}详情已打开`)} aria-label={`查看或编辑${rule.title}`}><span>查看或编辑</span><ChevronRight /></button>
      </article>)}</section>
      {!filteredReminderRules.length && <div className="acceptance-empty-state standalone"><BellRing /><strong>还没有提醒规则</strong><span>点击“新增提醒”创建第一条规则</span></div>}
    </>}
  </>;

  const activitiesPage = selectedActivity ? <>
    <section className="detail-page community-activity-detail-mobile">
      <button className="text-back" onClick={() => { setSelectedActivity(null); setActivityIntentFailure(null); }}><ArrowLeft />返回活动列表</button>
      <div className="activity-cover"><img src={selectedActivity.imageUrl} alt={`${selectedActivity.title}活动照片`} referrerPolicy="no-referrer" /><span>{selectedActivity.tag}</span></div>
      <div className="activity-detail-heading"><h2>{selectedActivity.title}</h2><b>{activityStatusLabel(selectedActivity)}</b></div><p>{selectedActivity.description}</p>
      <div className="fact-list"><span><Clock3 /><b>活动时间</b>{selectedActivity.time}</span><span><Home /><b>活动地点</b>{selectedActivity.location}</span><span><PhoneCall /><b>咨询电话</b>{selectedActivity.contact}</span>{selectedActivity.liveEnabled && <span><Radio /><b>直播状态</b>{selectedActivity.liveStatus === 'live' ? '直播中' : selectedActivity.liveStatus === 'ended' ? '直播已结束' : `${selectedActivity.scheduledLiveStartAt ?? ''}开播`}</span>}</div>
      {selectedActivity.liveEnabled && <button className="secondary-button activity-live-button" disabled={selectedActivity.liveStatus !== 'live' || selectedActivity.status === 'ended' || selectedActivity.status === 'cancelled'} onClick={() => setLiveActivity(selectedActivity)}><Video />{selectedActivity.liveStatus === 'live' ? '进入直播' : selectedActivity.liveStatus === 'ended' ? '直播已结束' : '等待开播'}</button>}
      {(selectedActivity.status === 'ended' || selectedActivity.status === 'cancelled') ? <div className="activity-unavailable"><ShieldAlert /><strong>{activityStatusLabel(selectedActivity)}</strong><span>当前不再接受参加意向。</span></div> : <div className="activity-intent-panel">
        {activityIntentFailure && <div className="activity-intent-error"><ShieldAlert /><span><strong>提交失败，选择尚未保存</strong><small>请重新提交原选择。</small></span></div>}
        {activityParticipation[selectedActivity.id] && !activityIntentFailure && <div className="activity-intent-result"><CheckCircle2 /><strong>已选择：{activityParticipation[selectedActivity.id] === 'interested' ? '我想参加' : '暂不参加'}</strong></div>}
        <div className="activity-intent-actions"><button className={activityParticipation[selectedActivity.id] === 'interested' ? 'active' : ''} onClick={() => saveActivityIntent(selectedActivity, 'interested')}><Users />我想参加</button><button className={activityParticipation[selectedActivity.id] === 'not_interested' ? 'active' : ''} onClick={() => saveActivityIntent(selectedActivity, 'not_interested')}><X />暂不参加</button></div>
        {activityIntentFailure && <button className="secondary-button" onClick={() => saveActivityIntent(selectedActivity, activityIntentFailure, true)}><RefreshCw />重新提交原选择</button>}
      </div>}
    </section>
    {liveActivity && <section className="community-live-mobile" role="dialog" aria-modal="true" aria-label={`${liveActivity.title}线上直播`}><header><span><Radio />社区活动直播</span><button onClick={() => setLiveActivity(null)}><X />退出直播</button></header><div><img src="/assets/community-live-preview.jpg" alt="社区活动现场直播画面" /><b><i />直播中</b><h2>{liveActivity.title}</h2><p>正在播放社区活动现场画面</p></div></section>}
  </> : selectedAlert ? <section className="detail-page community-alert-detail">
    <button className="text-back" onClick={() => { window.speechSynthesis.cancel(); setAlertSpeechState(null); setSelectedAlert(null); }}><ArrowLeft />返回警惕事项</button>
    <div className="community-alert-cover"><img src={selectedAlert.coverUrl} alt="" referrerPolicy="no-referrer" /></div>
    <div className="community-alert-meta"><span>{selectedAlert.category}</span><em><Check />已阅读</em></div><h2>{selectedAlert.title}</h2><p className="community-alert-byline">来源：{selectedAlert.source} · 预计朗读 {alertReadingMinutes(selectedAlert)} 分钟</p><strong>{selectedAlert.summary}</strong>
    <div className="community-alert-body">{selectedAlert.description.split(/\n\s*\n/).map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
    <div className="community-alert-speech"><div><Volume2 /><span><strong>{alertSpeechState === 'playing' ? '正在为您朗读' : alertSpeechState === 'paused' ? '播报已暂停' : '可以大声念给您听'}</strong><small>预计 {alertReadingMinutes(selectedAlert)} 分钟</small></span></div><button onClick={() => alertSpeechState === 'playing' ? pauseAlertSpeech() : startAlertSpeech()}>{alertSpeechState === 'playing' ? '暂停播报' : alertSpeechState === 'paused' ? '继续播报' : '大声念给我听'}</button><button onClick={() => startAlertSpeech(true)}><RefreshCw />从头听一遍</button></div>
  </section> : <>
    <ElderPageHeader title="社区生活" description="查看社区活动和需要留意的安全事项。" />
    <div className="community-section-switch" role="tablist" aria-label="社区二级内容"><button className={communityView === 'activities' ? 'active' : ''} onClick={() => setCommunityView('activities')}><CalendarDays />社区活动</button><button className={communityView === 'alerts' ? 'active' : ''} onClick={() => setCommunityView('alerts')}><ShieldAlert />警惕事项</button></div>
    {communityView === 'activities' ? <><section className="list-stack">{visibleActivities.map(activity => <button key={activity.id} className="activity-card" onClick={() => { setSelectedActivity(activity); setActivityIntentFailure(null); setAcceptanceModuleId('activity-detail'); }}><img src={activity.imageUrl} alt={`${activity.title}活动照片`} referrerPolicy="no-referrer" /><div><div className="activity-card-tags"><span className="tag">{activity.tag}</span><b>{activityStatusLabel(activity)}</b></div><h3>{activity.title}</h3><p><Clock3 />{activity.time}</p><p><Home />{activity.location}</p></div><ChevronRight /></button>)}</section>{!visibleActivities.length && <div className="acceptance-empty-state standalone"><CalendarDays /><strong>近期暂无活动</strong><span>新的社区活动发布后会显示在这里</span></div>}</> : <><div className="community-alert-summary"><strong>{communityAlerts.length - alertReadIds.length > 0 ? `${communityAlerts.length - alertReadIds.length} 条未读` : '全部已阅读'}</strong><span>{isOnline ? '内容来自可信机构' : '当前离线，已缓存内容仍可查看'}</span></div><section className="community-alert-list">{communityAlerts.map(alert => <button key={alert.id} className={alertReadIds.includes(alert.id) ? 'is-read' : ''} onClick={() => openAlert(alert)}><span><img src={alert.coverUrl} alt="" referrerPolicy="no-referrer" /></span><div><small>{alert.category}{alertReadIds.includes(alert.id) && <b><Check />已阅读</b>}</small><h3>{alert.title}</h3><p>{alert.summary}</p><em>{alert.source} · 预计朗读 {alertReadingMinutes(alert)} 分钟</em></div><ChevronRight /></button>)}</section></>}
  </>;

  const profilePage = <>
    <section className="profile-card elder-identity"><span>王</span><div><h2>王奶奶 <em>72岁 · 长者身份</em></h2><p>登录手机：+65 8123 4567</p><small>新加坡 · 已绑定所在社区</small></div></section>
    <section className="guardian-card">
      <header><Heart /><h2>家庭守护人</h2><span>只读</span></header>
      <div className="guardian-list">
        {guardianScenario === 'empty' ? <div className="acceptance-empty-state"><Heart /><strong>暂无家庭守护人</strong><span>确认家庭关系后会显示在这里</span></div> : <>
        {bindingStatus === 'success' && <div className="guardian-row newly-bound"><span className="guardian-avatar family">侄子</span><div><strong>张建国</strong><small>+65 8123 2198</small></div><b>刚刚绑定</b></div>}
        <div className="guardian-row"><span className="guardian-avatar daughter">女儿</span><div><strong>张晓燕</strong><small>139 1234 5678</small></div><b>守护中</b></div>
        <div className="guardian-row"><span className="guardian-avatar son">儿子</span><div><strong>张建平</strong><small>138 9876 5432</small></div><b>守护中</b></div>
        </>}
      </div>
    </section>
    <button className="profile-binding-entry" onClick={() => { setBindingStatus('pending'); setBindingOpen(true); }}><span><Heart /></span><div><strong>家庭关系申请</strong><small>{bindingStatus === 'success' ? '最近一项申请已同意' : '有 1 项申请等待您确认'}</small></div><ChevronRight /></button>
  </>;

  const bindingResult = bindingStatus !== 'pending' && <section className={`binding-result ${bindingStatus}`}>
    <span>{bindingStatus === 'success' ? <Check /> : bindingStatus === 'network' ? <RefreshCw /> : <X />}</span>
    <h2>{bindingStatus === 'success' ? '已经绑定成功' : bindingStatus === 'rejected' ? '已经拒绝申请' : bindingStatus === 'expired' ? '这项申请已失效' : bindingStatus === 'tablet-approved' ? '已在平板端确认' : bindingStatus === 'tablet-rejected' ? '已在平板端拒绝' : '暂时无法提交'}</h2>
    <p>{bindingStatus === 'success' ? '张建国已成为您的家庭守护人，可以在“我的”页面查看。' : bindingStatus === 'rejected' ? '对方不会获得您的家庭信息和服务权限。' : bindingStatus === 'expired' ? '为保护您的信息，过期申请不能继续处理。' : bindingStatus === 'tablet-approved' ? '这项申请已在您的平板上同意，手机端无需再次操作。' : bindingStatus === 'tablet-rejected' ? '这项申请已在您的平板上拒绝，手机端无法重复处理。' : '网络连接不稳定，本次没有完成绑定，请稍后重试。'}</p>
    {bindingStatus === 'network' && <button className="primary-button" onClick={() => setBindingStatus('pending')}><RefreshCw />重新尝试</button>}
    {bindingStatus === 'success' && <button className="primary-button" onClick={() => { setBindingOpen(false); setTab('profile'); }}>查看已绑定家人</button>}
    {bindingStatus !== 'network' && bindingStatus !== 'success' && <button className="secondary-button" onClick={() => setBindingOpen(false)}>返回首页</button>}
  </section>;

  const bindingPage = <section className="binding-page">
    <button className="text-back" onClick={() => setBindingOpen(false)}><ArrowLeft />返回</button>
    {bindingStatus === 'pending' ? <>
      <div className="binding-title"><span><ShieldCheck /></span><small>家庭关系申请</small><h2>请确认是不是您的家人</h2><p>只有您同意后，对方才能与您建立家庭关系。</p></div>
      <div className="applicant-card">
        <span className="applicant-avatar">张</span>
        <div><small>申请人 · 子女端注册用户</small><h3>张建国</h3><p>手机：+65 8123 2198</p><p>申请时间：今天 09:20</p></div>
        <b>对方填写：侄子</b>
      </div>
      <button className="primary-button binding-primary" onClick={() => setBindingConfirmOpen(true)}><Check />同意绑定</button>
      <button className="secondary-button binding-secondary" onClick={() => setBindingStatus('rejected')}>不是我的家人</button>
    </> : bindingResult}
  </section>;

  const servicePage = selectedService ? <section className="detail-page service-detail">
    <button className="text-back" onClick={() => { setSelectedService(null); setServiceStep('detail'); }}><ArrowLeft />返回服务列表</button>
    <div className={`service-hero ${currentService.tone}`}><currentService.Icon /><span>{currentService.label}</span></div>
    <span className="mock-badge">特约服务</span><h2>{selectedService.name}</h2><p>{selectedService.detail}</p>
    <div className="provider-box"><UserRound /><div><small>服务商</small><strong>{currentService.provider}</strong></div></div>
    <div className="price-box"><small>参考价格范围</small><strong>{selectedService.range}</strong><span>仅供参考，最终价格以商家确认或现场报价为准</span></div>
    {serviceStep === 'detail' && <button className="primary-button" onClick={() => setServiceStep('confirm')}><PhoneCall />立即预约</button>}
    {serviceStep === 'confirm' && <div className="confirm-box"><Info /><h3>确认联系商家？</h3><p>提交预约后，服务商会联系您确认需求、时间和最终价格。</p><button className="primary-button" onClick={() => setServiceStep('success')}>确认联系并预约</button><button className="secondary-button" onClick={() => setServiceStep('detail')}>再想一想</button></div>}
    {serviceStep === 'success' && <div className="order-result"><CheckCircle2 /><h3>预约已提交</h3><b>等待商家联系</b><p>{currentService.provider} 将进一步询问服务需求并确认最终价格。</p><span>订单号 U2G-53114</span></div>}
  </section> : <>
    <button className="text-back" onClick={() => { setServicesOpen(false); setSelectedService(null); }}><ArrowLeft />返回首页</button>
    <section className="page-intro service-intro"><div><span>特约服务</span><h2>需要家里帮忙？</h2><p>价格均为参考范围，最终以商家确认为准。</p></div><Wrench /></section>
    <div className="service-tabs">{(Object.keys(serviceData) as ServiceCategory[]).map(key => { const item = serviceData[key]; return <button key={key} className={serviceCategory === key ? 'active' : ''} onClick={() => setServiceCategory(key)}><item.Icon />{item.label}</button>; })}</div>
    <section className="provider-summary"><UserRound /><div><small>服务商</small><strong>{currentService.provider}</strong><span>本类当前展示 1 家服务商</span></div></section>
    <section className="list-stack">{currentService.items.map(item => <button key={item.id} className="service-item" onClick={() => { setSelectedService(item); setServiceStep('detail'); }}><span className={`list-icon ${currentService.tone}-bg`}><currentService.Icon /></span><div><h3>{item.name}</h3><p>参考范围 {item.range}</p><small>最终以商家确认为准</small></div><ChevronRight /></button>)}</section>
    <div className="boundary-note"><Info /><span><strong>预约说明</strong>提交后由服务商联系确认需求、上门时间和最终价格。</span></div>
  </>;

  const showingService = tab === 'home' && servicesOpen;

  return <MobileAppShell title={showingService ? '特约服务' : pageTitle}>
    <main className="app-content">{bindingOpen ? bindingPage : showingService ? servicePage : tab === 'home' ? homePage : tab === 'family' ? familyPage : tab === 'reminders' ? remindersPage : tab === 'activities' ? activitiesPage : tab === 'services' ? <AppointmentServicesPage scenario={appointmentScenario} onViewChange={view => { setAcceptancePageId('services'); setAcceptanceModuleId('service-booking'); setAppointmentScenario(view); }} /> : profilePage}</main>

    {!bindingOpen && !showingService && <nav className="bottom-nav" aria-label="主导航">
      {([
        ['home', Home, '首页'], ['family', Images, '家庭'], ['reminders', BellRing, '提醒'], ['activities', CalendarDays, '社区'], ['services', CalendarCheck2, '预约'], ['profile', CircleUserRound, '我的'],
      ] as const).map(([key, Icon, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => goTo(key)}><Icon /><span>{label}</span></button>)}
    </nav>}

    {toast && <div className="toast" role="status"><CheckCircle2 />{toast}</div>}

    {bindingConfirmOpen && <div className="confirm-overlay" role="presentation"><section className="binding-confirm" role="dialog" aria-modal="true" aria-labelledby="binding-confirm-title"><span><ShieldCheck /></span><h2 id="binding-confirm-title">确认同意张建国绑定？</h2><button className="primary-button" onClick={() => { setBindingConfirmOpen(false); setBindingStatus('success'); }}>确认同意</button><button className="secondary-button" onClick={() => setBindingConfirmOpen(false)}>再核对一下</button></section></div>}

    {overlay === 'photo' && <Sheet title="发相册" onClose={() => { setPhotoVoiceState('idle'); setOverlay(null); }}>{photoStep === 'success' ? <SuccessPanel title="相册发布成功" description="照片已经分享给家人。" onDone={() => setOverlay(null)} /> : <>
      <div className="form-group"><label>选择照片或视频</label><div className="media-picker"><button onClick={() => setSelectedPhotos([1, 2])}><Camera /><span>拍照片</span></button><button onClick={() => setSelectedPhotos([1, 2, 3])}><Images /><span>从手机选择</span></button></div></div>
      <div className="selected-media">{selectedPhotos.map((id, index) => <div key={id} className={`mini-photo ${photos[(id - 1) % photos.length].tone}`}><button onClick={() => setSelectedPhotos(current => current.filter(item => item !== id))} aria-label={`删除第${index + 1}张照片`}><X /></button></div>)}{selectedPhotos.length === 0 && <p>还没有选择照片</p>}</div>
      <div className="photo-caption">
        <div className="photo-caption-heading"><strong>照片附言（选填）</strong><button type="button" className={photoVoiceState === 'listening' ? 'listening' : ''} disabled={photoVoiceState === 'processing'} onClick={() => photoVoiceState === 'listening' ? finishPhotoVoiceInput() : setPhotoVoiceState('listening')}><Mic />{photoVoiceState === 'listening' ? '结束录音' : photoVoiceState === 'processing' ? '识别中' : '语音输入'}</button></div>
        <label className="field-label"><textarea maxLength={100} value={photoNote} onChange={event => setPhotoNote(event.target.value)} /><span>{photoNote.length}/100</span></label>
        {photoVoiceState === 'listening' && <div className="voice-input-status listening" role="status"><span><i />正在听，请说出照片附言…</span><div><button onClick={finishPhotoVoiceInput}>完成识别</button><button onClick={() => setPhotoVoiceState('idle')}>取消</button><button onClick={() => setPhotoVoiceState('error')}>没有听清</button></div></div>}
        {photoVoiceState === 'processing' && <div className="voice-input-status processing" role="status"><RefreshCw />正在识别，请稍候…</div>}
        {photoVoiceState === 'error' && <div className="voice-input-status error" role="alert"><span>没有听清楚，请重试。</span><div><button onClick={() => setPhotoVoiceState('listening')}><Mic />重新录音</button><button onClick={() => setPhotoVoiceState('idle')}>取消</button></div></div>}
      </div>
      <button className="primary-button" disabled={selectedPhotos.length === 0} onClick={() => setPhotoStep('success')}><Upload />确认发布相册</button>
    </>}</Sheet>}

    {overlay === 'reminder' && <Sheet title="新增提醒" onClose={() => setOverlay(null)}>{reminderStep === 'success' ? <SuccessPanel title="提醒已新增" description={reminderAddedToday ? `${reminderTitle}已保存，并已生成今天 ${reminderTime} 的待办。` : `${reminderTitle}已保存到全部提醒，开始时间到达后会生成当天待办。`} onDone={() => { setOverlay(null); setReminderView(reminderAddedToday ? 'today' : 'rules'); setAcceptanceModuleId(reminderAddedToday ? 'reminder-today' : 'reminder-rules'); }} /> : <>
      <div className="type-switch"><button className={reminderType === 'medication' ? 'active' : ''} onClick={() => { setReminderType('medication'); setReminderDetail('氨氯地平 1片，饭后服用'); }}><Pill />用药提醒</button><button className={reminderType === 'daily' ? 'active' : ''} onClick={() => { setReminderType('daily'); setReminderDetail(''); }}><CalendarDays />日常提醒</button></div>
      <label className="field-label">提醒名称<input value={reminderTitle} onChange={event => setReminderTitle(event.target.value)} /></label>
      <label className="field-label">{reminderType === 'medication' ? '剂量或用法（必填）' : '补充说明（选填）'}<input value={reminderDetail} onChange={event => setReminderDetail(event.target.value)} placeholder={reminderType === 'medication' ? '例如：1片，饭后服用' : '填写事项说明'} />{reminderType === 'medication' && !reminderDetail.trim() && <em>请至少填写剂量或用法</em>}</label>
      <div className="two-fields"><label className="field-label">开始日期<input type="date" value={reminderDate} onChange={event => setReminderDate(event.target.value)} /></label><label className="field-label">提醒时间<input type="time" value={reminderTime} onChange={event => setReminderTime(event.target.value)} /></label></div>
      <div className="form-group"><label>重复方式</label><div className="repeat-switch">{([['once', '仅一次'], ['daily', '每天'], ['weekly', '每周']] as const).map(([key, label]) => <button key={key} className={repeat === key ? 'active' : ''} onClick={() => setRepeat(key)}>{label}</button>)}</div></div>
      {repeat === 'weekly' && <div className="weekdays">{['一', '二', '三', '四', '五', '六', '日'].map(day => <button key={day} className={weekdays.includes(day) ? 'active' : ''} onClick={() => setWeekdays(current => current.includes(day) ? current.filter(item => item !== day) : [...current, day])}>{day}</button>)}</div>}
      <button className="primary-button" disabled={!canSaveReminder} onClick={() => { const id = `r-${Date.now()}`; const repeatLabel = repeat === 'once' ? '仅一次' : repeat === 'daily' ? '每天' : '每周'; const generatesToday = reminderDate === '2026-10-22' && reminderTime > '18:04'; setReminderAddedToday(generatesToday); setReminderRules(current => [...current, { id, type: reminderType, title: reminderTitle.trim(), detail: reminderDetail.trim() || '没有补充说明', times: [reminderTime], repeat: repeatLabel, nextAt: generatesToday ? `今天 ${reminderTime}` : `${reminderDate.slice(5).replace('-', '月')}日 ${reminderTime}`, enabled: true }]); if (generatesToday) setReminderItems(current => [...current, { id: `i-${Date.now()}`, ruleId: id, type: reminderType, time: reminderTime, title: reminderTitle.trim(), detail: reminderDetail.trim() || '没有补充说明', repeat: repeatLabel, completed: false }].sort((a, b) => a.time.localeCompare(b.time))); setReminderStep('success'); }}><Check />保存提醒</button>
    </>}</Sheet>}
    {ACCEPTANCE_WORKBENCH_ENABLED && <AcceptanceWorkbench portalUrl={U2G_PORTAL_URL} pageId={acceptancePageId} moduleId={acceptanceModuleId} onContextChange={changeAcceptanceContext} onScenarioChange={applyAcceptanceScenario} onAction={runAcceptanceAction} />}
  </MobileAppShell>;
}
