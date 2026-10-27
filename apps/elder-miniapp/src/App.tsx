import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  BellRing,
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
  RefreshCw,
  ShieldCheck,
  Settings2,
  Upload,
  UserRound,
  Video,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

type MainTab = 'home' | 'family' | 'reminders' | 'activities' | 'profile';
type Overlay = 'photo' | 'reminder' | null;
type ReminderType = 'medication' | 'daily';
type RepeatType = 'once' | 'daily' | 'weekly';
type Activity = typeof activities[number];
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

const activities = [
  { id: 'a1', title: '银龄健康操', date: '10月23日 周五', time: '上午 09:30', location: '社区活动室', tag: '健康运动', description: '由社区老师带领完成简单、安全的舒展运动，适合长者参与。' },
  { id: 'a2', title: '防诈骗知识讲堂', date: '10月25日 周日', time: '下午 14:00', location: '一楼多功能厅', tag: '安全课堂', description: '结合常见案例讲解如何识别电话、短信和网络诈骗。' },
  { id: 'a3', title: '邻里茶话会', date: '10月28日 周三', time: '下午 15:30', location: '社区茶室', tag: '邻里交流', description: '和邻居一起喝茶聊天，分享近期生活趣事。' },
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
  const [joinedActivities, setJoinedActivities] = useState<string[]>([]);
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

  const pageTitle = bindingOpen ? '家庭关系确认' : tab === 'home' ? '您好，王奶奶' : tab === 'family' ? '家庭互动' : tab === 'reminders' ? '提醒事项' : tab === 'activities' ? '社区活动' : '我的信息';
  const currentService = serviceData[serviceCategory];
  const canSaveReminder = reminderTitle.trim() && (reminderType === 'daily' || reminderDetail.trim()) && (repeat !== 'weekly' || weekdays.length > 0);
  const filteredReminders = useMemo(() => reminderItems, [reminderItems]);
  const filteredReminderRules = useMemo(() => reminderRules.filter(rule => reminderFilter === 'all' || rule.type === reminderFilter), [reminderFilter, reminderRules]);
  const todayPendingCount = reminderItems.filter(item => !item.completed).length;
  const filteredPendingCount = filteredReminders.filter(item => !item.completed).length;
  const medicationRuleCount = reminderRules.filter(rule => rule.type === 'medication').length;
  const dailyRuleCount = reminderRules.filter(rule => rule.type === 'daily').length;

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(''), 2200);
  };

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
    setSelectedService(null);
    setServicesOpen(false);
    setServiceStep('detail');
    setTab(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <div className="schedule-row completed">
          <i><Check /></i>
          <div className="schedule-item"><span><time>08:00</time><b>已完成</b></span><strong><Pill />早餐后用药</strong><p>维生素D 1片</p></div>
        </div>
        <button className="schedule-row urgent" onClick={() => goTo('reminders')}>
          <i>!</i>
          <div className="schedule-item"><span><time>17:30</time><b>已超时 56 分钟</b></span><strong><Pill />碳酸钙D3片</strong><p>1片，温水送服</p></div>
          <ChevronRight />
        </button>
        <button className="schedule-row upcoming" onClick={() => { setTab('activities'); setSelectedActivity(activities[0]); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <i><CalendarDays /></i>
          <div className="schedule-item"><span><time>18:30</time><b>2 小时后开始</b></span><strong><CalendarDays />银龄健康操</strong><p>社区活动室</p></div>
          <ChevronRight />
        </button>
        <button className="schedule-row waiting" onClick={() => goTo('reminders')}>
          <i><Clock3 /></i>
          <div className="schedule-item"><span><time>19:00</time><b>稍后提醒</b></span><strong><Pill />晚间降压药</strong><p>氨氯地平 1片</p></div>
          <ChevronRight />
        </button>
      </div>
    </section>

    <section className="home-module family-glance">
      <header className="home-module-header">
        <span><Images /></span>
        <div><h2>家人最近分享</h2><p>推荐看看</p></div>
        <button onClick={() => goTo('family')}>查看全部</button>
      </header>
      <div className="photo-row">{photos.slice(0, 3).map(photo => <button key={photo.id} onClick={() => goTo('family')} className={`photo-tile ${photo.tone}`}><span>{photo.title}</span></button>)}</div>
      <div className="family-message-heading"><MessageCircle /><strong>家人留言</strong><span>2 条新消息</span></div>
      <div className="family-message-list">
        <button onClick={() => goTo('family')}><span className="message-avatar daughter">女儿</span><div><strong>张晓燕</strong><p>妈妈，晚上记得吃降压药，我下班后给您打电话。</p><small>今天 16:45</small></div><ChevronRight /></button>
        <button onClick={() => goTo('family')}><span className="message-avatar son">儿子</span><div><strong>张建平</strong><p>周末我带您去公园走走，天气好我们再拍些照片。</p><small>昨天 20:18</small></div><ChevronRight /></button>
      </div>
    </section>

    <section className="home-module service-module">
      <header className="home-module-header">
        <span><Wrench /></span>
        <div><h2>便民服务</h2><p>需要上门帮忙？</p></div>
      </header>
      <div className="service-entry-grid">
        <button onClick={() => { setTab('home'); setServicesOpen(true); setSelectedService(null); setServiceCategory('water'); }} className="service-entry water"><span><Droplets /></span><strong>水路服务</strong><small>漏水检修</small></button>
        <button onClick={() => { setTab('home'); setServicesOpen(true); setSelectedService(null); setServiceCategory('electric'); }} className="service-entry electric"><span><Zap /></span><strong>电路服务</strong><small>灯具开关</small></button>
        <button onClick={() => { setTab('home'); setServicesOpen(true); setSelectedService(null); setServiceCategory('repair'); }} className="service-entry repair"><span><Wrench /></span><strong>居家维修</strong><small>门锁家具</small></button>
      </div>
    </section>
  </>;

  const familyPage = <>
    <section className="family-actions family-photo-only">
      <button onClick={() => openOverlay('photo')} className="family-action photo-action"><Upload /><div><strong>发相册</strong><span>直接分享给已绑定家人</span></div><ChevronRight /></button>
    </section>
    <div className="section-heading"><div><span>家庭相册</span><h2>最近的照片和视频</h2></div></div>
    <section className="gallery">{photos.map(photo => <button key={photo.id} className={`gallery-card ${photo.tone}`} onClick={() => showToast('影像详情已打开')}><span className="gallery-badge">{photo.id === 4 ? <><Video />视频</> : <><Camera />照片</>}</span><div><strong>{photo.title}</strong><small>{photo.date}</small></div></button>)}</section>
  </>;

  const remindersPage = <>
    <div className="reminder-view-switch" role="tablist" aria-label="提醒视图">
      <button role="tab" aria-selected={reminderView === 'today'} className={reminderView === 'today' ? 'active' : ''} onClick={() => setReminderView('today')}>今日提醒</button>
      <button role="tab" aria-selected={reminderView === 'rules'} className={reminderView === 'rules' ? 'active' : ''} onClick={() => setReminderView('rules')}>提醒列表</button>
    </div>
    {reminderView === 'today' ? <>
      <section className="page-intro reminder-intro reminder-overview"><div><span>今天</span><h2>今日共 {reminderItems.length} 项</h2><p>待完成 {todayPendingCount} 项</p></div><button className="intro-action" onClick={() => openOverlay('reminder')}><Plus />新增提醒</button></section>
      <div className="reminder-list-heading"><div><span>今日实际提醒</span><h2>按时间排序</h2></div><b>{filteredPendingCount} 项待完成</b></div>
      <section className="list-stack reminder-list">
        {filteredReminders.map(item => <article key={item.id} className={`list-card reminder-item ${item.completed ? 'completed' : 'pending'}`}>
          <span className={`list-icon ${item.type === 'medication' ? 'blue-bg' : 'amber-bg'}`}>{item.type === 'medication' ? <Pill /> : <CalendarDays />}</span>
          <div><small><em>{item.type === 'medication' ? '用药提醒' : '日常提醒'}</em><time>{item.time}</time></small><h3>{item.title}</h3><p>{item.detail}</p><span className="reminder-meta"><b>{item.repeat}</b><strong>{item.completed ? '已完成' : '待完成'}</strong></span></div>
          {!item.completed && <button aria-label={`将${item.title}标记为完成`} onClick={() => setReminderItems(current => current.map(currentItem => currentItem.id === item.id ? { ...currentItem, completed: true } : currentItem))}><Check /></button>}
        </article>)}
      </section>
    </> : <>
      <section className="rule-overview"><div><span>已创建</span><strong>{reminderRules.length} 条</strong></div><p>用药提醒 {medicationRuleCount} 条 · 日常提醒 {dailyRuleCount} 条</p><button onClick={() => openOverlay('reminder')}><Plus />新增提醒</button></section>
      <div className="reminder-filter" role="group" aria-label="提醒规则类型筛选">{([['all', '全部规则'], ['medication', '用药'], ['daily', '日常']] as const).map(([key, label]) => <button key={key} className={reminderFilter === key ? 'active' : ''} onClick={() => setReminderFilter(key)}>{label}</button>)}</div>
      <section className="list-stack reminder-rule-list">{filteredReminderRules.map(rule => <article key={rule.id} className={`reminder-rule-card ${rule.enabled ? '' : 'disabled'}`}>
        <span className={`list-icon ${rule.type === 'medication' ? 'blue-bg' : 'amber-bg'}`}>{rule.type === 'medication' ? <Pill /> : <CalendarDays />}</span>
        <div><small>{rule.type === 'medication' ? '用药提醒' : '日常提醒'}</small><h3>{rule.title}</h3><p>{rule.times.join('、')} · {rule.repeat}</p><b>下次提醒：{rule.nextAt}</b></div>
        <button className={`rule-toggle ${rule.enabled ? 'on' : ''}`} onClick={() => toggleReminderRule(rule)} aria-label={`${rule.enabled ? '停用' : '启用'}${rule.title}`}><i /></button>
        <button className="rule-edit" onClick={() => showToast(`${rule.title}详情已打开`)} aria-label={`查看或编辑${rule.title}`}><ChevronRight /></button>
      </article>)}</section>
      <div className="rule-note"><Clock3 /><p><strong>规则与今天不同</strong>一条每日规则只计为 1 条规则，但每天会生成当天的提醒。</p></div>
    </>}
  </>;

  const activitiesPage = selectedActivity ? <section className="detail-page">
    <button className="text-back" onClick={() => setSelectedActivity(null)}><ArrowLeft />返回活动列表</button>
    <div className="activity-cover"><span>{selectedActivity.tag}</span><CalendarDays /></div>
    <h2>{selectedActivity.title}</h2><p>{selectedActivity.description}</p>
    <div className="fact-list"><span><CalendarDays /><b>活动日期</b>{selectedActivity.date}</span><span><Clock3 /><b>开始时间</b>{selectedActivity.time}</span><span><Home /><b>活动地点</b>{selectedActivity.location}</span></div>
    {joinedActivities.includes(selectedActivity.id) ? <div className="joined-result"><CheckCircle2 /><div><strong>已报名参加</strong><span>活动开始前会提醒您</span></div></div> : <button className="primary-button" onClick={() => { setJoinedActivities(current => [...current, selectedActivity.id]); showToast('参加意向已提交'); }}><Heart />我想参加</button>}
  </section> : <>
    <section className="page-intro activity-intro"><div><span>社区生活</span><h2>一起参加活动</h2><p>查看近期活动，选择感兴趣的活动报名参加。</p></div><CalendarDays /></section>
    <section className="list-stack">{activities.map(activity => <button key={activity.id} className="activity-card" onClick={() => setSelectedActivity(activity)}><div className="activity-date"><strong>{activity.date.slice(0, 5)}</strong><span>{activity.time}</span></div><div><span className="tag">{activity.tag}</span><h3>{activity.title}</h3><p>{activity.location}</p></div><ChevronRight /></button>)}</section>
  </>;

  const profilePage = <>
    <section className="profile-card elder-identity"><span>王</span><div><h2>王奶奶 <em>72岁 · 长者身份</em></h2><p>登录手机：+65 8123 4567</p><small>新加坡 · 已绑定所在社区</small></div></section>
    <section className="guardian-card">
      <header><Heart /><h2>家庭守护人</h2><span>只读</span></header>
      <div className="guardian-list">
        {bindingStatus === 'success' && <div className="guardian-row newly-bound"><span className="guardian-avatar family">侄子</span><div><strong>张建国</strong><small>+65 8••• 2198</small></div><b>刚刚绑定</b></div>}
        <div className="guardian-row"><span className="guardian-avatar daughter">女儿</span><div><strong>张晓燕</strong><small>139 1234 5678</small></div><b>守护中</b></div>
        <div className="guardian-row"><span className="guardian-avatar son">儿子</span><div><strong>张建平</strong><small>138 9876 5432</small></div><b>守护中</b></div>
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
        <div><small>申请人</small><h3>张建国</h3><p>手机：+65 8••• 2198</p></div>
        <b>对方填写：侄子</b>
      </div>
      <div className="binding-permission"><Info /><p><strong>同意后，对方可以：</strong>查看您的日常提醒和近况，给您发送照片、留言，并使用家庭关怀服务。</p></div>
      <button className="primary-button binding-primary" onClick={() => setBindingConfirmOpen(true)}><Check />同意绑定</button>
      <button className="secondary-button binding-secondary" onClick={() => setBindingStatus('rejected')}>不是我的家人</button>
      <div className="binding-demo-states"><span>其他可能情况</span><button onClick={() => setBindingStatus('tablet-approved')}>平板已确认</button><button onClick={() => setBindingStatus('tablet-rejected')}>平板已拒绝</button><button onClick={() => setBindingStatus('expired')}>申请已失效</button><button onClick={() => setBindingStatus('network')}>网络失败</button></div>
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

  return <div className="app-shell">
    <header className="app-header">
      <div className="brand-mark">U</div><div><span>U2G 乐龄生活</span><h1>{showingService ? '特约服务' : pageTitle}</h1></div>
    </header>

    <main className="app-content">{bindingOpen ? bindingPage : showingService ? servicePage : tab === 'home' ? homePage : tab === 'family' ? familyPage : tab === 'reminders' ? remindersPage : tab === 'activities' ? activitiesPage : profilePage}</main>

    {!bindingOpen && !showingService && <nav className="bottom-nav" aria-label="主导航">
      {([
        ['home', Home, '首页'], ['family', Images, '家庭'], ['reminders', BellRing, '提醒'], ['activities', CalendarDays, '社区'], ['profile', CircleUserRound, '我的'],
      ] as const).map(([key, Icon, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => goTo(key)}><Icon /><span>{label}</span></button>)}
    </nav>}

    {toast && <div className="toast" role="status"><CheckCircle2 />{toast}</div>}

    {bindingConfirmOpen && <div className="confirm-overlay" role="presentation"><section className="binding-confirm" role="dialog" aria-modal="true" aria-labelledby="binding-confirm-title"><span><ShieldCheck /></span><h2 id="binding-confirm-title">确认同意张建国绑定？</h2><p>同意后，他将可以查看您的日常提醒和近况，并使用家庭关怀服务。</p><button className="primary-button" onClick={() => { setBindingConfirmOpen(false); setBindingStatus('success'); }}>确认同意</button><button className="secondary-button" onClick={() => setBindingConfirmOpen(false)}>再核对一下</button></section></div>}

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

    {overlay === 'reminder' && <Sheet title="新增提醒" onClose={() => setOverlay(null)}>{reminderStep === 'success' ? <SuccessPanel title="提醒已新增" description={reminderAddedToday ? `${reminderTitle}已加入提醒列表，并生成今天的提醒。` : `${reminderTitle}已加入提醒列表，今天尚未生成提醒。`} onDone={() => { setOverlay(null); setReminderView('rules'); }} /> : <>
      <div className="type-switch"><button className={reminderType === 'medication' ? 'active' : ''} onClick={() => { setReminderType('medication'); setReminderDetail('氨氯地平 1片，饭后服用'); }}><Pill />用药提醒</button><button className={reminderType === 'daily' ? 'active' : ''} onClick={() => { setReminderType('daily'); setReminderDetail(''); }}><CalendarDays />日常提醒</button></div>
      <label className="field-label">提醒名称<input value={reminderTitle} onChange={event => setReminderTitle(event.target.value)} /></label>
      <label className="field-label">{reminderType === 'medication' ? '剂量或用法（必填）' : '补充说明（选填）'}<input value={reminderDetail} onChange={event => setReminderDetail(event.target.value)} placeholder={reminderType === 'medication' ? '例如：1片，饭后服用' : '填写事项说明'} />{reminderType === 'medication' && !reminderDetail.trim() && <em>请至少填写剂量或用法</em>}</label>
      <div className="two-fields"><label className="field-label">开始日期<input type="date" value={reminderDate} onChange={event => setReminderDate(event.target.value)} /></label><label className="field-label">提醒时间<input type="time" value={reminderTime} onChange={event => setReminderTime(event.target.value)} /></label></div>
      <div className="form-group"><label>重复方式</label><div className="repeat-switch">{([['once', '仅一次'], ['daily', '每天'], ['weekly', '每周']] as const).map(([key, label]) => <button key={key} className={repeat === key ? 'active' : ''} onClick={() => setRepeat(key)}>{label}</button>)}</div></div>
      {repeat === 'weekly' && <div className="weekdays">{['一', '二', '三', '四', '五', '六', '日'].map(day => <button key={day} className={weekdays.includes(day) ? 'active' : ''} onClick={() => setWeekdays(current => current.includes(day) ? current.filter(item => item !== day) : [...current, day])}>{day}</button>)}</div>}
      <button className="primary-button" disabled={!canSaveReminder} onClick={() => { const id = `r-${Date.now()}`; const repeatLabel = repeat === 'once' ? '仅一次' : repeat === 'daily' ? '每天' : '每周'; const generatesToday = reminderDate === '2026-10-22' && reminderTime > '18:04'; setReminderAddedToday(generatesToday); setReminderRules(current => [...current, { id, type: reminderType, title: reminderTitle.trim(), detail: reminderDetail.trim() || '没有补充说明', times: [reminderTime], repeat: repeatLabel, nextAt: generatesToday ? `今天 ${reminderTime}` : `${reminderDate.slice(5).replace('-', '月')}日 ${reminderTime}`, enabled: true }]); if (generatesToday) setReminderItems(current => [...current, { id: `i-${Date.now()}`, ruleId: id, type: reminderType, time: reminderTime, title: reminderTitle.trim(), detail: reminderDetail.trim() || '没有补充说明', repeat: repeatLabel, completed: false }].sort((a, b) => a.time.localeCompare(b.time))); setReminderStep('success'); }}><Check />保存提醒</button>
    </>}</Sheet>}
  </div>;
}
