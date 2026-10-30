import { useEffect, useMemo, useState } from 'react';
import { BellRing, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, HandHeart, MapPin, PhoneCall, Star, UserRound, Wrench } from 'lucide-react';
import ElderPageHeader from './ElderPageHeader';
import { appointmentCategories, appointmentCategoryName, appointmentServices, currentElderProfile, initialServiceAssistanceRecords, type AppointmentCategoryCode, type AppointmentService, type ServiceAssistanceRecord } from './appointmentData';

export type AppointmentScenario = 'default' | 'detail' | 'requested' | 'handled' | 'completed' | 'reviewed' | 'records';
type Filter = 'all' | AppointmentCategoryCode;
type View = 'list' | 'detail' | 'result' | 'records';

const STORAGE_KEY = 'u2g-service-assistance-records-v1';
const CHILD_NOTIFICATION_KEY = 'u2g-child-service-assistance-notifications-v1';
const BOUND_FAMILY_IDS = ['child-zhang-xiaoyan', 'child-zhang-jianping'];

const readRecords = () => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) as ServiceAssistanceRecord[] : initialServiceAssistanceRecords;
  } catch {
    return initialServiceAssistanceRecords;
  }
};

const createScenarioRecord = (scenario: 'requested' | 'handled' | 'completed' | 'reviewed', service = appointmentServices[0]): ServiceAssistanceRecord => ({
  id: `HELP-MOCK-${scenario.toUpperCase()}`,
  elder: { id: 'elder-wang', name: '王奶奶', phone: '+65 8123 4567' },
  service: { id: service.id, name: service.name, categoryName: appointmentCategoryName(service.category) },
  provider: { name: service.provider, phone: service.providerPhone },
  requestedAt: '2026-10-30T09:20:00+08:00',
  status: scenario === 'requested' ? 'pending' : 'handled',
  recipientIds: BOUND_FAMILY_IDS,
  handledBy: scenario === 'requested' ? null : '张晓燕',
  handledAt: scenario === 'requested' ? null : '2026-10-30T09:42:00+08:00',
  resultSummary: scenario === 'requested' ? null : '已联系服务商，对方将于今日下午再电话确认上门时间。',
  serviceStatus: scenario === 'completed' || scenario === 'reviewed' ? 'completed' : 'not_completed',
  completedAt: scenario === 'completed' || scenario === 'reviewed' ? '2026-10-30T16:30:00+08:00' : null,
  review: scenario === 'reviewed' ? { rating: 5, text: '师傅很耐心，问题已经处理好了。', submittedAt: '2026-10-30T17:10:00+08:00', edited: false } : null,
});

const formatTime = (value: string) => new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(value));

type Props = { scenario: AppointmentScenario; onViewChange?: (scenario: AppointmentScenario) => void };

export default function AppointmentServicesPage({ scenario, onViewChange }: Props) {
  const [view, setViewState] = useState<View>('list');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<AppointmentService>(appointmentServices[0]);
  const [records, setRecords] = useState<ServiceAssistanceRecord[]>(readRecords);
  const [latest, setLatest] = useState<ServiceAssistanceRecord | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [editingReview, setEditingReview] = useState(false);

  const setView = (next: View, nextScenario: AppointmentScenario) => {
    setViewState(next);
    onViewChange?.(nextScenario);
  };

  useEffect(() => {
    if (scenario === 'default') setViewState('list');
    if (scenario === 'detail') setViewState('detail');
    if (scenario === 'records') setViewState('records');
    if (scenario === 'requested' || scenario === 'handled' || scenario === 'completed' || scenario === 'reviewed') {
      setLatest(current => {
        const expectedCompleted = scenario === 'completed' || scenario === 'reviewed';
        if (current && current.status === (scenario === 'requested' ? 'pending' : 'handled') && (current.serviceStatus === 'completed') === expectedCompleted && Boolean(current.review) === (scenario === 'reviewed')) return current;
        return createScenarioRecord(scenario);
      });
      setEditingReview(false);
      setViewState('result');
    }
  }, [scenario]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const communityServices = useMemo(() => appointmentServices.filter(service => service.coverageMode === 'all' || service.coverageCommunityIds.includes(currentElderProfile.communityId)), []);
  const visible = useMemo(() => filter === 'all' ? communityServices : communityServices.filter(item => item.category === filter), [communityServices, filter]);
  const counts = useMemo(() => Object.fromEntries(appointmentCategories.map(item => [item.code, communityServices.filter(service => service.category === item.code).length])), [communityServices]);

  const requestFamilyHelp = () => {
    const now = new Date().toISOString();
    const record: ServiceAssistanceRecord = {
      id: `HELP-${Date.now()}`,
      elder: { id: 'elder-wang', name: '王奶奶', phone: '+65 8123 4567' },
      service: { id: selected.id, name: selected.name, categoryName: appointmentCategoryName(selected.category) },
      provider: { name: selected.provider, phone: selected.providerPhone },
      requestedAt: now,
      status: 'pending',
      recipientIds: BOUND_FAMILY_IDS,
      handledBy: null,
      handledAt: null,
      resultSummary: null,
      serviceStatus: 'not_completed',
      completedAt: null,
      review: null,
    };

    setRecords(current => [record, ...current]);
    setLatest(record);
    const notifications = BOUND_FAMILY_IDS.map(recipientId => ({ id: `${record.id}-${recipientId}`, type: 'service_assistance_requested', recipientId, recordId: record.id, createdAt: now }));
    window.localStorage.setItem(CHILD_NOTIFICATION_KEY, JSON.stringify(notifications));
    setView('result', 'requested');
  };

  const saveReview = () => {
    if (!latest || latest.serviceStatus !== 'completed') return;
    const review = { rating, text: reviewText.trim(), submittedAt: new Date().toISOString(), edited: Boolean(latest.review) };
    const updated = { ...latest, review };
    setLatest(updated);
    setRecords(current => current.map(record => record.id === updated.id ? updated : record));
    setEditingReview(false);
    onViewChange?.('reviewed');
  };

  const header = <ElderPageHeader title="服务协助" description="查看社区服务，可直接致电服务商或请家人帮忙。" />;
  const switcher = <div className="appointment-section-switch" role="tablist" aria-label="服务协助页面"><button className={view !== 'records' ? 'active' : ''} onClick={() => setView('list', 'default')}><Wrench />可用服务</button><button className={view === 'records' ? 'active' : ''} onClick={() => setView('records', 'records')}><ClipboardCheck />协助记录</button></div>;

  return <>
    {(view === 'list' || view === 'records') && <>{header}{switcher}</>}
    {view === 'list' && <><div className="appointment-categories"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>全部 {communityServices.length}</button>{appointmentCategories.map(item => <button key={item.code} className={filter === item.code ? 'active' : ''} onClick={() => setFilter(item.code)}>{item.name} {counts[item.code]}</button>)}</div><section className="appointment-service-list">{visible.map(service => <button key={service.id} className="appointment-service-card" onClick={() => { setSelected(service); setView('detail', 'detail'); }}><img src={service.coverImage} alt="" /><div><small>{appointmentCategoryName(service.category)}</small><h3>{service.name}</h3><p>{service.provider}</p><b>{service.priceRange}<em> 参考区间</em></b></div><ChevronRight /></button>)}</section></>}

    {view === 'detail' && <section className="appointment-detail">
      <div className="appointment-detail-hero-image"><img src={selected.coverImage} alt={selected.name} /><span>{appointmentCategoryName(selected.category)}</span></div>
      <div className="appointment-detail-basics"><h2>{selected.name}</h2><p>{selected.description}</p></div>
      <div className="appointment-price-highlight"><div><small>参考价格区间</small><strong>{selected.priceRange}</strong></div><span>具体费用以服务人员上门确认为准</span></div>
      <section className="appointment-introduction"><h3>服务介绍</h3><div><h4>服务内容</h4><p>{selected.serviceContent}</p></div><div><h4>注意事项</h4><ul>{selected.precautions.map(item => <li key={item}>{item}</li>)}</ul></div></section>
      <section className="appointment-service-info"><h3>服务信息</h3><div className="appointment-provider"><UserRound /><div className="appointment-provider-content"><div className="appointment-provider-heading"><small>服务商</small><strong>{selected.provider}</strong></div><dl className="appointment-provider-facts"><div><dt><Clock3 />营业时间</dt><dd>{selected.businessHours}</dd></div><div><dt><MapPin />支持区域</dt><dd>{selected.serviceArea}</dd></div><div><dt><PhoneCall />服务电话</dt><dd><a href={`tel:${selected.providerPhone.replace(/\s/g, '')}`}>{selected.providerPhone}</a></dd></div></dl></div></div></section>
      <section className="appointment-detail-gallery"><h3>服务详情</h3><div className="appointment-detail-images">{selected.detailImages.map(image => <img key={image} src={image} alt={`${selected.name}服务详情`} />)}</div></section>
      <div className="appointment-detail-actions"><a className="primary-button appointment-call-button" href={`tel:${selected.providerPhone.replace(/\s/g, '')}`}><PhoneCall />拨打服务电话<span>{selected.providerPhone}</span></a><button className="secondary-button appointment-family-help-button" onClick={requestFamilyHelp}><HandHeart />请家人帮忙</button><p className="appointment-help-hint">将通知所有已绑定家人，由家人联系服务商并回告处理结果。</p></div>
    </section>}

    {view === 'result' && latest && <section className={`appointment-assistance-result ${latest.status} ${latest.serviceStatus}`}>
      <span>{latest.serviceStatus === 'completed' || latest.status === 'handled' ? <CheckCircle2 /> : <BellRing />}</span>
      <h2>{latest.serviceStatus === 'completed' ? '服务已完成' : latest.status === 'handled' ? `${latest.handledBy} 已处理` : '已通知家人'}</h2>
      <p>{latest.serviceStatus === 'completed' ? '本次服务已完成，您可以给服务评分。' : latest.status === 'handled' ? latest.resultSummary : '请等待家人与您联系。'}</p>
      <dl><div><dt>需要协助</dt><dd>{latest.service.categoryName} · {latest.service.name}</dd></div><div><dt>服务商</dt><dd>{latest.provider.name} · {latest.provider.phone}</dd></div><div><dt>请求时间</dt><dd>{formatTime(latest.requestedAt)}</dd></div>{latest.handledAt && <div><dt>处理时间</dt><dd>{formatTime(latest.handledAt)}</dd></div>}{latest.completedAt && <div><dt>完成时间</dt><dd>{formatTime(latest.completedAt)}</dd></div>}</dl>
      {latest.serviceStatus === 'completed' && (!latest.review || editingReview) && <div className="service-review-form">
        <strong>{latest.review ? '修改评价' : '评价本次服务'}</strong>
        <div className="service-review-stars" aria-label="服务评分">{[1, 2, 3, 4, 5].map(value => <button key={value} className={value <= rating ? 'active' : ''} onClick={() => setRating(value)} aria-label={`${value} 星`}><Star /></button>)}</div>
        <textarea value={reviewText} onChange={event => setReviewText(event.target.value)} maxLength={100} placeholder="写下评价（选填）" />
        <button className="primary-button" onClick={saveReview}>提交评价</button>
      </div>}
      {latest.review && !editingReview && <div className="service-review-result"><strong>我的评价</strong><div>{[1, 2, 3, 4, 5].map(value => <Star key={value} className={value <= latest.review!.rating ? 'active' : ''} />)}</div>{latest.review.text && <p>{latest.review.text}</p>}{!latest.review.edited && <button onClick={() => { setRating(latest.review!.rating); setReviewText(latest.review!.text); setEditingReview(true); }}>修改一次</button>}</div>}
      <button className="secondary-button" onClick={() => setView('records', 'records')}>查看协助记录</button><button className="secondary-button" onClick={() => setView('list', 'default')}>继续查看服务</button>
    </section>}

    {view === 'records' && <section className="appointment-records">{records.map(record => <article key={record.id} className={`appointment-record ${record.status}`}><header><span>{record.service.categoryName}</span><b>{record.serviceStatus === 'completed' ? '服务已完成' : record.status === 'handled' ? '已处理' : '待处理'}</b></header><h3>{record.service.name}</h3><p><UserRound />{record.provider.name} · {record.provider.phone}</p><p><Clock3 />请求于 {formatTime(record.requestedAt)}</p>{record.status === 'handled' && <><p><CheckCircle2 />{record.handledBy} 已于 {formatTime(record.handledAt!)} 处理</p><p><ClipboardCheck />{record.resultSummary}</p></>}{record.review && <p><Star />{record.review.rating} 星{record.review.text ? ` · ${record.review.text}` : ''}</p>}<footer><small>{record.id}</small><span>{record.serviceStatus === 'completed' ? '服务已完成' : record.status === 'handled' ? '已获得家人处理结果' : '已通知全部绑定家人'}</span></footer></article>)}</section>}
  </>;
}
