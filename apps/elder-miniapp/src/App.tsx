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
  Play,
  Plus,
  Radio,
  Send,
  Settings2,
  Upload,
  UserRound,
  Video,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

type MainTab = 'home' | 'family' | 'reminders' | 'activities' | 'profile';
type Overlay = 'photo' | 'message' | 'reminder' | null;
type ReminderType = 'medication' | 'daily';
type RepeatType = 'once' | 'daily' | 'weekly';
type Activity = typeof activities[number];
type ServiceCategory = 'water' | 'electric' | 'repair';

const photos = [
  { id: 1, title: '周末花园散步', date: '今天 09:20', tone: 'garden' },
  { id: 2, title: '家里的兰花开了', date: '昨天 16:10', tone: 'flowers' },
  { id: 3, title: '和老朋友喝茶', date: '10月19日', tone: 'tea' },
  { id: 4, title: '社区晨练', date: '10月18日', tone: 'exercise' },
];

const activities = [
  { id: 'a1', title: '银龄健康操', date: '10月23日 周五', time: '上午 09:30', location: '社区活动室', tag: '健康运动', live: true, description: '由社区老师带领完成简单、安全的舒展运动，适合长者参与。' },
  { id: 'a2', title: '防诈骗知识讲堂', date: '10月25日 周日', time: '下午 14:00', location: '一楼多功能厅', tag: '安全课堂', live: false, description: '结合常见案例讲解如何识别电话、短信和网络诈骗。' },
  { id: 'a3', title: '邻里茶话会', date: '10月28日 周三', time: '下午 15:30', location: '社区茶室', tag: '邻里交流', live: false, description: '和邻居一起喝茶聊天，分享近期生活趣事。' },
] as const;

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
  const [messageStep, setMessageStep] = useState<'edit' | 'success'>('edit');
  const [messageMode, setMessageMode] = useState<'text' | 'voice'>('text');
  const [message, setMessage] = useState('我今天很好，大家不用担心。');
  const [reminderStep, setReminderStep] = useState<'edit' | 'success'>('edit');
  const [reminderType, setReminderType] = useState<ReminderType>('medication');
  const [reminderTitle, setReminderTitle] = useState('晚间降压药');
  const [reminderDetail, setReminderDetail] = useState('氨氯地平 1片，饭后服用');
  const [repeat, setRepeat] = useState<RepeatType>('daily');
  const [weekdays, setWeekdays] = useState<string[]>(['一', '三', '五']);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [joinedActivities, setJoinedActivities] = useState<string[]>([]);
  const [liveActivity, setLiveActivity] = useState<Activity | null>(null);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>('water');
  const [selectedService, setSelectedService] = useState<(typeof serviceData)[ServiceCategory]['items'][number] | null>(null);
  const [serviceStep, setServiceStep] = useState<'detail' | 'confirm' | 'success'>('detail');

  const pageTitle = tab === 'home' ? '您好，王奶奶' : tab === 'family' ? '家庭互动' : tab === 'reminders' ? '提醒事项' : tab === 'activities' ? '社区活动' : '我的信息';
  const currentService = serviceData[serviceCategory];
  const canSaveReminder = reminderTitle.trim() && (reminderType === 'daily' || reminderDetail.trim()) && (repeat !== 'weekly' || weekdays.length > 0);

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(''), 2200);
  };

  const openOverlay = (next: Exclude<Overlay, null>) => {
    if (next === 'photo') setPhotoStep('edit');
    if (next === 'message') setMessageStep('edit');
    if (next === 'reminder') setReminderStep('edit');
    setOverlay(next);
  };

  const goTo = (next: MainTab) => {
    setSelectedActivity(null);
    setLiveActivity(null);
    setSelectedService(null);
    setServicesOpen(false);
    setServiceStep('detail');
    setTab(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const homePage = <>
    <section className="hero-card">
      <div><span className="eyebrow">星期四 · 10月22日</span><h2>新加坡 · 多云</h2><p>体感 32°C，午后可能有短时阵雨，外出记得带伞。</p></div>
      <div className="hero-weather"><CloudSun /><strong>29°</strong><span>多云</span></div>
    </section>

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
          <i><Radio /></i>
          <div className="schedule-item"><span><time>18:30</time><b>2 小时后开始</b></span><strong><CalendarDays />银龄健康操</strong><p>社区活动室 · 可看直播</p></div>
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
    <section className="family-actions">
      <button onClick={() => openOverlay('photo')} className="family-action photo-action"><Upload /><div><strong>发相册</strong><span>直接分享给已绑定家人</span></div><ChevronRight /></button>
      <button onClick={() => openOverlay('message')} className="family-action message-action"><MessageCircle /><div><strong>发留言</strong><span>文字或语音，独立发送</span></div><ChevronRight /></button>
    </section>
    <div className="section-heading"><div><span>家庭相册</span><h2>最近的照片和视频</h2></div></div>
    <section className="gallery">{photos.map(photo => <button key={photo.id} className={`gallery-card ${photo.tone}`} onClick={() => showToast('影像详情已打开')}><span className="gallery-badge">{photo.id === 4 ? <><Video />视频</> : <><Camera />照片</>}</span><div><strong>{photo.title}</strong><small>{photo.date}</small></div></button>)}</section>
  </>;

  const remindersPage = <>
    <section className="page-intro reminder-intro"><div><span>今天</span><h2>2 项提醒</h2><p>到点后请在详情中确认完成。</p></div><button className="intro-action" onClick={() => openOverlay('reminder')}><Plus />新增提醒</button></section>
    <div className="section-heading"><div><span>今天的安排</span><h2>待完成</h2></div></div>
    <section className="list-stack">
      <article className="list-card"><span className="list-icon blue-bg"><Pill /></span><div><small>用药提醒 · 19:00</small><h3>晚间降压药</h3><p>氨氯地平 1片，饭后服用</p><b>每天</b></div><ChevronRight /></article>
      <article className="list-card"><span className="list-icon amber-bg"><CalendarDays /></span><div><small>日常提醒 · 20:30</small><h3>给女儿回电话</h3><p>吃完晚饭后聊一聊</p><b>仅一次</b></div><ChevronRight /></article>
    </section>
    <div className="rule-note"><Clock3 /><p><strong>提醒规则</strong>编辑周期提醒只影响以后还未发生的提醒，历史记录不会被改写。</p></div>
  </>;

  const activitiesPage = liveActivity ? <section className="live-page">
    <button className="text-back" onClick={() => setLiveActivity(null)}><ArrowLeft />返回活动详情</button>
    <div className="live-stage"><span><Radio />直播中</span><Play /><h2>{liveActivity.title}</h2><p>社区老师正在带领大家完成简单、安全的舒展运动。</p></div>
    <button className="secondary-button" onClick={() => setLiveActivity(null)}>退出直播</button>
  </section> : selectedActivity ? <section className="detail-page">
    <button className="text-back" onClick={() => setSelectedActivity(null)}><ArrowLeft />返回活动列表</button>
    <div className="activity-cover"><span>{selectedActivity.tag}</span><CalendarDays /></div>
    <h2>{selectedActivity.title}</h2><p>{selectedActivity.description}</p>
    <div className="fact-list"><span><CalendarDays /><b>活动日期</b>{selectedActivity.date}</span><span><Clock3 /><b>开始时间</b>{selectedActivity.time}</span><span><Home /><b>活动地点</b>{selectedActivity.location}</span></div>
    {selectedActivity.live && <button className="live-button" onClick={() => setLiveActivity(selectedActivity)}><Radio /><div><strong>进入活动直播</strong><span>当前正在直播</span></div><ChevronRight /></button>}
    {joinedActivities.includes(selectedActivity.id) ? <div className="joined-result"><CheckCircle2 /><div><strong>已报名参加</strong><span>活动开始前会提醒您</span></div></div> : <button className="primary-button" onClick={() => { setJoinedActivities(current => [...current, selectedActivity.id]); showToast('参加意向已提交'); }}><Heart />我想参加</button>}
  </section> : <>
    <section className="page-intro activity-intro"><div><span>社区生活</span><h2>一起参加活动</h2><p>活动参加与直播入口相互独立。</p></div><CalendarDays /></section>
    <section className="list-stack">{activities.map(activity => <button key={activity.id} className="activity-card" onClick={() => setSelectedActivity(activity)}><div className="activity-date"><strong>{activity.date.slice(0, 5)}</strong><span>{activity.time}</span></div><div><span className="tag">{activity.tag}</span><h3>{activity.title}</h3><p>{activity.location}</p>{activity.live && <b><Radio />可看直播</b>}</div><ChevronRight /></button>)}</section>
  </>;

  const profilePage = <>
    <section className="profile-card elder-identity"><span>王</span><div><h2>王奶奶 <em>72岁 · 长者身份</em></h2><p>登录手机：+65 8123 4567</p><small>新加坡 · 已绑定所在社区</small></div></section>
    <section className="guardian-card">
      <header><Heart /><h2>家庭守护人</h2><span>只读</span></header>
      <div className="guardian-list">
        <div className="guardian-row"><span className="guardian-avatar daughter">女儿</span><div><strong>张晓燕</strong><small>139 1234 5678</small></div><b>守护中</b></div>
        <div className="guardian-row"><span className="guardian-avatar son">儿子</span><div><strong>张建平</strong><small>138 9876 5432</small></div><b>守护中</b></div>
      </div>
    </section>
  </>;

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

    <main className="app-content">{showingService ? servicePage : tab === 'home' ? homePage : tab === 'family' ? familyPage : tab === 'reminders' ? remindersPage : tab === 'activities' ? activitiesPage : profilePage}</main>

    {!showingService && !liveActivity && <nav className="bottom-nav" aria-label="主导航">
      {([
        ['home', Home, '首页'], ['family', Images, '家庭'], ['reminders', BellRing, '提醒'], ['activities', CalendarDays, '社区'], ['profile', CircleUserRound, '我的'],
      ] as const).map(([key, Icon, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => goTo(key)}><Icon /><span>{label}</span></button>)}
    </nav>}

    {toast && <div className="toast" role="status"><CheckCircle2 />{toast}</div>}

    {overlay === 'photo' && <Sheet title="发相册" onClose={() => setOverlay(null)}>{photoStep === 'success' ? <SuccessPanel title="相册发布成功" description="照片已分享给所有有效绑定家人，无需逐个选择子女。" onDone={() => setOverlay(null)} /> : <>
      <div className="recipient-rule"><Heart /><div><strong>分享给已绑定家人</strong><span>系统自动使用有效家庭关系，不需要选择具体子女。</span></div></div>
      <div className="form-group"><label>选择照片或视频</label><div className="media-picker"><button onClick={() => setSelectedPhotos([1, 2])}><Camera /><span>拍照片</span></button><button onClick={() => setSelectedPhotos([1, 2, 3])}><Images /><span>从手机选择</span></button></div></div>
      <div className="selected-media">{selectedPhotos.map((id, index) => <div key={id} className={`mini-photo ${photos[(id - 1) % photos.length].tone}`}><button onClick={() => setSelectedPhotos(current => current.filter(item => item !== id))} aria-label={`删除第${index + 1}张照片`}><X /></button></div>)}{selectedPhotos.length === 0 && <p>还没有选择照片</p>}</div>
      <label className="field-label">照片附言（选填）<textarea maxLength={100} value={photoNote} onChange={event => setPhotoNote(event.target.value)} /><span>{photoNote.length}/100</span></label>
      <button className="primary-button" disabled={selectedPhotos.length === 0} onClick={() => setPhotoStep('success')}><Upload />确认发布相册</button>
    </>}</Sheet>}

    {overlay === 'message' && <Sheet title="给家人留言" onClose={() => setOverlay(null)}>{messageStep === 'success' ? <SuccessPanel title="留言已发送" description={messageMode === 'text' ? '文字留言已发送给家人。' : '语音留言已发送给家人。'} onDone={() => setOverlay(null)} /> : <>
      <div className="mode-switch"><button className={messageMode === 'text' ? 'active' : ''} onClick={() => setMessageMode('text')}><MessageCircle />文字留言</button><button className={messageMode === 'voice' ? 'active' : ''} onClick={() => setMessageMode('voice')}><Mic />语音留言</button></div>
      {messageMode === 'text' ? <label className="field-label">想对家人说什么？<textarea maxLength={300} value={message} onChange={event => setMessage(event.target.value)} /><span>{message.length}/300</span></label> : <div className="voice-recorder"><button onClick={() => showToast('已录制 8 秒语音')}><Mic /></button><strong>按一下开始录音</strong><span>录好后可以试听再发送</span></div>}
      <div className="boundary-note"><Info /><span>留言是独立消息，不会加入家庭相册。</span></div>
      <button className="primary-button" disabled={messageMode === 'text' && !message.trim()} onClick={() => setMessageStep('success')}><Send />发送留言</button>
    </>}</Sheet>}

    {overlay === 'reminder' && <Sheet title="新增提醒" onClose={() => setOverlay(null)}>{reminderStep === 'success' ? <SuccessPanel title="提醒已新增" description={`${reminderTitle}将按当前规则提醒您。`} onDone={() => setOverlay(null)} /> : <>
      <div className="type-switch"><button className={reminderType === 'medication' ? 'active' : ''} onClick={() => { setReminderType('medication'); setReminderDetail('氨氯地平 1片，饭后服用'); }}><Pill />用药提醒</button><button className={reminderType === 'daily' ? 'active' : ''} onClick={() => { setReminderType('daily'); setReminderDetail(''); }}><CalendarDays />日常提醒</button></div>
      <label className="field-label">提醒名称<input value={reminderTitle} onChange={event => setReminderTitle(event.target.value)} /></label>
      <label className="field-label">{reminderType === 'medication' ? '剂量或用法（必填）' : '补充说明（选填）'}<input value={reminderDetail} onChange={event => setReminderDetail(event.target.value)} placeholder={reminderType === 'medication' ? '例如：1片，饭后服用' : '填写事项说明'} />{reminderType === 'medication' && !reminderDetail.trim() && <em>请至少填写剂量或用法</em>}</label>
      <div className="two-fields"><label className="field-label">开始日期<input type="date" defaultValue="2026-10-21" /></label><label className="field-label">提醒时间<input type="time" defaultValue="19:00" /></label></div>
      <div className="form-group"><label>重复方式</label><div className="repeat-switch">{([['once', '仅一次'], ['daily', '每天'], ['weekly', '每周']] as const).map(([key, label]) => <button key={key} className={repeat === key ? 'active' : ''} onClick={() => setRepeat(key)}>{label}</button>)}</div></div>
      {repeat === 'weekly' && <div className="weekdays">{['一', '二', '三', '四', '五', '六', '日'].map(day => <button key={day} className={weekdays.includes(day) ? 'active' : ''} onClick={() => setWeekdays(current => current.includes(day) ? current.filter(item => item !== day) : [...current, day])}>{day}</button>)}</div>}
      <button className="primary-button" disabled={!canSaveReminder} onClick={() => setReminderStep('success')}><Check />保存提醒</button>
    </>}</Sheet>}
  </div>;
}
