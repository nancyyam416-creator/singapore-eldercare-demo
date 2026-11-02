import { useEffect, useMemo, useRef, useState } from 'react';
import { BellRing, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, HandHeart, MapPin, PhoneCall, Star, UserRound, Wrench, XCircle } from 'lucide-react';
import ElderPageHeader from './ElderPageHeader';
import { appointmentCategories, appointmentCategoryName, appointmentServices, currentElderProfile, initialServiceAssistanceRecords, type AppointmentCategoryCode, type AppointmentService, type ServiceAssistanceRecord } from './appointmentData';
import { canReviewServiceAssistance, getLatestServiceAssistanceRecord, getServiceAssistanceConfirmationCopy, normalizeServiceAssistanceRecord, readSharedServiceAssistanceRecords, serviceAssistanceExpiryMessage, submitSharedServiceReview, subscribeSharedServiceAssistanceRecords, upsertSharedServiceAssistanceRecord } from '../../产品理解/90 原型与Mock素材/mock/服务协助记录共享Mock.js';

export type AppointmentScenario = 'default' | 'detail' | 'requested' | 'handling' | 'expired' | 'cancelled' | 'handled' | 'completed' | 'reviewed' | 'records';
type Filter = 'all' | AppointmentCategoryCode;
type View = 'list' | 'detail' | 'result' | 'records';

const CHILD_NOTIFICATION_KEY = 'u2g-child-service-assistance-notifications-v1';
const BOUND_FAMILY_IDS = ['child-zhang-xiaoyan', 'child-zhang-jianping'];

const readRecords = () => {
  const shared = readSharedServiceAssistanceRecords() as ServiceAssistanceRecord[];
  return (shared.length ? shared : initialServiceAssistanceRecords)
    .map(record => normalizeServiceAssistanceRecord(record) as ServiceAssistanceRecord)
    .sort((first, second) => second.requestedAt.localeCompare(first.requestedAt));
};

const createScenarioRecord = (scenario: 'requested' | 'handling' | 'expired' | 'cancelled' | 'handled' | 'completed' | 'reviewed', service = appointmentServices[0]): ServiceAssistanceRecord => ({
  id: `HELP-MOCK-${scenario.toUpperCase()}`,
  elder: { id: 'elder-wang-jianguo', name: '王建国', phone: '+65 8603 2918' },
  service: { id: service.id, name: service.name, categoryName: appointmentCategoryName(service.category) },
  provider: { name: service.provider, phone: service.providerPhone },
  requestReason: '请家人协助联系服务商',
  requestedAt: '2026-10-30T09:20:00+08:00',
  status: scenario === 'requested' ? 'pending' : scenario === 'handling' ? 'handling' : scenario === 'expired' ? 'expired' : scenario === 'cancelled' ? 'cancelled' : 'handled',
  expiredAt: scenario === 'expired' ? '2026-11-01T09:20:00+08:00' : null,
  recipientIds: BOUND_FAMILY_IDS,
  handledBy: scenario === 'requested' || scenario === 'handling' || scenario === 'expired' || scenario === 'cancelled' ? null : '张晓燕',
  handledAt: scenario === 'requested' || scenario === 'handling' || scenario === 'expired' || scenario === 'cancelled' ? null : '2026-10-30T09:42:00+08:00',
  resultSummary: scenario === 'requested' || scenario === 'handling' || scenario === 'expired' || scenario === 'cancelled' ? null : '已联系服务商，对方将于今日下午再电话确认上门时间。',
  serviceStatus: scenario === 'completed' || scenario === 'reviewed' ? 'completed' : 'not_completed',
  completedAt: scenario === 'completed' || scenario === 'reviewed' ? '2026-10-30T16:30:00+08:00' : null,
  completedBy: scenario === 'completed' || scenario === 'reviewed' ? '张晓燕' : null,
  review: scenario === 'reviewed' ? { rating: 5, text: '师傅很耐心，问题已经处理好了。', elderId: 'elder-wang-jianguo', submittedAt: '2026-10-30T17:10:00+08:00', edited: false } : null,
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
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmationCopy, setConfirmationCopy] = useState(() => getServiceAssistanceConfirmationCopy(null));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const submissionGuardRef = useRef(false);

  const setView = (next: View, nextScenario: AppointmentScenario) => {
    setViewState(next);
    onViewChange?.(nextScenario);
  };

  useEffect(() => {
    if (scenario === 'default') setViewState('list');
    if (scenario === 'detail') setViewState('detail');
    if (scenario === 'records') setViewState('records');
    if (scenario === 'requested' || scenario === 'handling' || scenario === 'expired' || scenario === 'cancelled' || scenario === 'handled' || scenario === 'completed' || scenario === 'reviewed') {
      setLatest(current => {
        const expectedCompleted = scenario === 'completed' || scenario === 'reviewed';
        const expectedStatus = scenario === 'requested' ? 'pending' : scenario === 'handling' ? 'handling' : scenario === 'expired' ? 'expired' : scenario === 'cancelled' ? 'cancelled' : 'handled';
        if (current && current.status === expectedStatus && (current.serviceStatus === 'completed') === expectedCompleted && Boolean(current.review) === (scenario === 'reviewed')) return current;
        return createScenarioRecord(scenario);
      });
      setViewState('result');
    }
  }, [scenario]);

  useEffect(() => {
    const syncRecords = () => {
      const nextRecords = readRecords();
      setRecords(nextRecords);
      setLatest(current => current ? nextRecords.find(record => record.id === current.id) ?? current : current);
    };
    syncRecords();
    const unsubscribe = subscribeSharedServiceAssistanceRecords(syncRecords);
    const timer = window.setInterval(syncRecords, 30_000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, []);

  const communityServices = useMemo(() => appointmentServices.filter(service => service.coverageMode === 'all' || service.coverageCommunityIds.includes(currentElderProfile.communityId)), []);
  const visible = useMemo(() => filter === 'all' ? communityServices : communityServices.filter(item => item.category === filter), [communityServices, filter]);
  const counts = useMemo(() => Object.fromEntries(appointmentCategories.map(item => [item.code, communityServices.filter(service => service.category === item.code).length])), [communityServices]);

  const requestFamilyHelp = (service = selected) => {
    const scenarioRecord = latest?.service.id === service.id ? latest : null;
    const isResultScenario = scenario === 'requested' || scenario === 'handling' || scenario === 'expired' || scenario === 'cancelled' || scenario === 'handled' || scenario === 'completed' || scenario === 'reviewed';
    const latestRequest = isResultScenario && scenarioRecord
      ? scenarioRecord
      : getLatestServiceAssistanceRecord(records, 'elder-wang-jianguo', service.id) as ServiceAssistanceRecord | null;
    setSelected(service);
    setConfirmationCopy(getServiceAssistanceConfirmationCopy(latestRequest));
    setSubmitError('');
    setConfirmOpen(true);
  };

  const confirmFamilyHelp = () => {
    if (submissionGuardRef.current) return;
    submissionGuardRef.current = true;
    setSubmitting(true);
    setSubmitError('');
    try {
      const now = new Date().toISOString();
      const record: ServiceAssistanceRecord = {
        id: `HELP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        elder: { id: 'elder-wang-jianguo', name: '王建国', phone: '+65 8603 2918' },
        service: { id: selected.id, name: selected.name, categoryName: appointmentCategoryName(selected.category) },
        provider: { name: selected.provider, phone: selected.providerPhone },
        requestReason: '请家人协助联系服务商',
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

      const savedRecord = upsertSharedServiceAssistanceRecord(record) as ServiceAssistanceRecord;
      setRecords(readRecords());
      setLatest(savedRecord);
      const notifications = BOUND_FAMILY_IDS.map(recipientId => ({ id: `${record.id}-${recipientId}`, type: 'service_assistance_requested', recipientId, recordId: record.id, createdAt: now }));
      try {
        window.localStorage.setItem(CHILD_NOTIFICATION_KEY, JSON.stringify(notifications));
      } catch {
        // 共享协助记录已是跨端通知的权威状态，本地通知缓存失败不影响本次提交。
      }
      setConfirmOpen(false);
      setView('result', 'requested');
      window.setTimeout(() => {
        submissionGuardRef.current = false;
        setSubmitting(false);
      }, 800);
    } catch {
      setSubmitError('发送失败，请稍后重试。');
      submissionGuardRef.current = false;
      setSubmitting(false);
    }
  };

  const saveReview = () => {
    if (!latest || !canReviewServiceAssistance(latest, currentElderProfile.id) || reviewSubmitting) return;
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const scenarioOnly = latest.id.startsWith('HELP-MOCK-');
      const mockReview = { rating, text: reviewText.trim(), elderId: latest.elder.id, submittedAt: new Date().toISOString(), edited: false };
      const persisted = scenarioOnly ? { ...latest, review: mockReview } : submitSharedServiceReview(latest.id, currentElderProfile.id, { rating, text: reviewText });
      if (!persisted) throw new Error('review update failed');
      const updated = normalizeServiceAssistanceRecord(persisted) as ServiceAssistanceRecord;
      setLatest(updated);
      setRecords(current => current.map(record => record.id === updated.id ? updated : record));
      onViewChange?.('reviewed');
    } catch {
      setReviewError('评价提交失败，请稍后重试。');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const header = <ElderPageHeader title="服务协助" description="查看社区服务，可直接致电服务商或请家人帮忙。" />;
  const switcher = <div className="appointment-section-switch" role="tablist" aria-label="服务协助页面"><button className={view !== 'records' ? 'active' : ''} onClick={() => setView('list', 'default')}><Wrench />可用服务</button><button className={view === 'records' ? 'active' : ''} onClick={() => setView('records', 'records')}><ClipboardCheck />协助记录</button></div>;

  return <>
    {(view === 'list' || view === 'records') && <>{header}{switcher}</>}
    {view === 'list' && <><div className="appointment-categories"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>全部 {communityServices.length}</button>{appointmentCategories.map(item => <button key={item.code} className={filter === item.code ? 'active' : ''} onClick={() => setFilter(item.code)}>{item.name} {counts[item.code]}</button>)}</div><section className="appointment-service-list">{visible.map(service => <button key={service.id} className="appointment-service-card" onClick={() => { setSelected(service); setView('detail', 'detail'); }}><img src={service.coverImage} alt="" /><div><small>{appointmentCategoryName(service.category)}</small><h3>{service.name}</h3><p>{service.provider}</p><b>{service.priceRange}<em> 参考价格区间</em></b></div><ChevronRight /></button>)}</section></>}

    {view === 'detail' && <section className="appointment-detail">
      <div className="appointment-detail-hero-image"><img src={selected.coverImage} alt={selected.name} /><span>{appointmentCategoryName(selected.category)}</span></div>
      <div className="appointment-detail-basics"><h2>{selected.name}</h2><p>{selected.description}</p></div>
      <div className="appointment-price-highlight"><div><small>参考价格区间</small><strong>{selected.priceRange}</strong></div><span>具体费用以服务人员上门确认为准</span></div>
      <section className="appointment-introduction"><h3>服务介绍</h3><div><h4>服务内容</h4><p>{selected.serviceContent}</p></div><div><h4>注意事项</h4><ul>{selected.precautions.map(item => <li key={item}>{item}</li>)}</ul></div></section>
      <section className="appointment-service-info"><h3>服务信息</h3><div className="appointment-provider"><UserRound /><div className="appointment-provider-content"><div className="appointment-provider-heading"><small>服务商</small><strong>{selected.provider}</strong></div><dl className="appointment-provider-facts"><div><dt><Clock3 />营业时间</dt><dd>{selected.businessHours}</dd></div><div><dt><MapPin />支持区域</dt><dd>{selected.serviceArea}</dd></div><div><dt><PhoneCall />服务电话</dt><dd><a href={`tel:${selected.providerPhone.replace(/\s/g, '')}`}>{selected.providerPhone}</a></dd></div></dl></div></div></section>
      <section className="appointment-detail-gallery"><h3>服务详情</h3><div className="appointment-detail-images">{selected.detailImages.map(image => <img key={image} src={image} alt={`${selected.name}服务详情`} />)}</div></section>
      <div className="appointment-detail-actions"><a className="primary-button appointment-call-button" href={`tel:${selected.providerPhone.replace(/\s/g, '')}`}><PhoneCall />拨打服务电话<span>{selected.providerPhone}</span></a><button className="secondary-button appointment-family-help-button" onClick={() => requestFamilyHelp()}><HandHeart />请家人帮忙</button></div>
    </section>}

    {view === 'result' && latest && <section className={`appointment-assistance-result ${latest.status} ${latest.serviceStatus}`}>
      <span>{latest.status === 'expired' || latest.status === 'cancelled' ? <XCircle /> : latest.serviceStatus === 'completed' || latest.status === 'handled' ? <CheckCircle2 /> : <BellRing />}</span>
      <h2>{latest.status === 'expired' ? '协助已失效' : latest.status === 'cancelled' ? '协助已取消' : latest.serviceStatus === 'completed' ? '服务已完成' : latest.status === 'handled' ? `${latest.handledBy} 已处理` : latest.status === 'handling' ? '家人正在联系' : '已通知家人'}</h2>
      <p>{latest.status === 'expired' ? serviceAssistanceExpiryMessage : latest.status === 'cancelled' ? '上次协助请求已取消，您可以重新请家人帮忙。' : latest.serviceStatus === 'completed' ? '本次服务已完成，您可以给服务评分。' : latest.status === 'handled' ? latest.resultSummary : latest.status === 'handling' ? '家人已开始帮您联系服务商。' : '请等待家人与您联系。'}</p>
      <dl><div><dt>需要协助</dt><dd>{latest.service.categoryName} · {latest.service.name}</dd></div><div><dt>服务商</dt><dd>{latest.provider.name} · {latest.provider.phone}</dd></div><div><dt>请求时间</dt><dd>{formatTime(latest.requestedAt)}</dd></div>{latest.handledAt && <div><dt>处理时间</dt><dd>{formatTime(latest.handledAt)}</dd></div>}{latest.completedAt && <div><dt>完成时间</dt><dd>{formatTime(latest.completedAt)}</dd></div>}</dl>
      {canReviewServiceAssistance(latest, currentElderProfile.id) && <div className="service-review-form">
        <strong>评价本次服务</strong>
        <div className="service-review-stars" aria-label="服务评分">{[1, 2, 3, 4, 5].map(value => <button key={value} className={value <= rating ? 'active' : ''} onClick={() => setRating(value)} aria-label={`${value} 星`}><Star /></button>)}</div>
        <textarea value={reviewText} onChange={event => setReviewText(event.target.value)} maxLength={100} placeholder="写下评价（选填）" />
        {reviewError && <p className="service-review-error" role="alert">{reviewError}</p>}
        <button className="primary-button" onClick={saveReview} disabled={reviewSubmitting}>{reviewSubmitting ? '提交中…' : '提交评价'}</button>
      </div>}
      {latest.review && <div className="service-review-result"><strong>我的评价</strong><div>{[1, 2, 3, 4, 5].map(value => <Star key={value} className={value <= latest.review!.rating ? 'active' : ''} />)}</div><p>{latest.review.text || '未填写文字评价'}</p><small>评价人：{latest.elder.name} · {formatTime(latest.review.submittedAt)}</small></div>}
      <button className="primary-button" onClick={() => { const service = appointmentServices.find(item => item.id === latest.service.id); if (service) requestFamilyHelp(service); }}><HandHeart />请家人帮忙</button>
      <button className="secondary-button" onClick={() => setView('records', 'records')}>查看协助记录</button><button className="secondary-button" onClick={() => setView('list', 'default')}>继续查看服务</button>
    </section>}

    {view === 'records' && <section className="appointment-records">{records.map(record => <article key={record.id} className={`appointment-record ${record.status}`}><header><span>{record.service.categoryName}</span><b>{record.status === 'expired' ? '已失效' : record.review ? '已评价' : record.serviceStatus === 'completed' ? '服务已完成' : record.status === 'handled' ? '已处理' : record.status === 'handling' ? '处理中' : '待处理'}</b></header><h3>{record.service.name}</h3><p><UserRound />{record.provider.name} · {record.provider.phone}</p><p><Clock3 />请求于 {formatTime(record.requestedAt)}</p>{record.status === 'expired' && <p className="appointment-expiry-copy"><XCircle />{serviceAssistanceExpiryMessage}</p>}{record.status === 'handled' && <><p><CheckCircle2 />{record.handledBy} 已于 {formatTime(record.handledAt!)} 处理</p><p><ClipboardCheck />{record.resultSummary}</p></>}{record.review && <><p><Star />{record.review.rating} 星 · {record.review.text || '未填写文字评价'}</p><p><UserRound />评价人：{record.elder.name} · {formatTime(record.review.submittedAt)}</p></>}{canReviewServiceAssistance(record, record.elder.id) && <button className="appointment-record-review" onClick={() => { setLatest(record); setRating(5); setReviewText(''); setReviewError(''); setView('result', 'completed'); }}>评价服务</button>}<footer><small>{record.id}</small><span>{record.review ? '本次服务已评价' : record.status === 'expired' ? '本次协助已结束，历史记录已保留' : record.serviceStatus === 'completed' ? '服务已完成，等待评价' : record.status === 'handled' ? '已获得家人处理结果' : '已通知全部绑定家人'}</span></footer></article>)}</section>}

    {confirmOpen && <div className="appointment-help-confirm-overlay" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="appointment-help-confirm-title"><span><HandHeart /></span><h2 id="appointment-help-confirm-title">{confirmationCopy.title}</h2><p>{confirmationCopy.description}</p><small>{confirmationCopy.hint}</small>{submitError && <p className="appointment-help-submit-error" role="alert">{submitError}</p>}<div><button type="button" onClick={() => setConfirmOpen(false)} disabled={submitting}>再想想</button><button type="button" className="is-primary" onClick={confirmFamilyHelp} disabled={submitting}>{submitting ? '发送中…' : '确认发送'}</button></div></section></div>}
  </>;
}
