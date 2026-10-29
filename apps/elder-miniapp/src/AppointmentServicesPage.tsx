import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, Check, CheckCircle2, ChevronRight, CircleAlert, ClipboardList, Clock3, Droplets, MapPin, PhoneCall, Wrench, XCircle, Zap, UserRound } from 'lucide-react';
import ElderPageHeader from './ElderPageHeader';
import { appointmentCategories, appointmentCategoryName, appointmentServices, initialPhoneAppointmentRecords, type AppointmentCategoryCode, type AppointmentService, type PhoneAppointmentConfirmationStatus, type PhoneAppointmentRecord } from './appointmentData';

export type AppointmentScenario = 'list' | 'detail' | 'result' | 'pending' | 'confirmed' | 'failed' | 'no_guardian' | 'records';
type Filter = 'all' | AppointmentCategoryCode;
type View = 'list' | 'detail' | 'result' | 'records';

const STORAGE_KEY = 'u2g-phone-appointment-records-v1';
const CHILD_NOTIFICATION_KEY = 'u2g-child-appointment-notifications-v1';
const categoryIcons = { electric: Zap, water: Droplets, basic: Wrench };
const statusMeta: Record<PhoneAppointmentConfirmationStatus, { label: string; description: string }> = {
  pending: { label: '预约结果待确认', description: '已拨打服务机构电话，预约结果待家人确认。' },
  confirmed: { label: '已预约成功', description: '家人已确认服务机构安排。' },
  failed: { label: '暂未预约成功', description: '家人已确认本次暂未安排上门。' },
  no_guardian: { label: '暂无家人确认', description: '已拨打服务机构电话，当前没有已绑定家人，可稍后查看预约结果。' },
};

const readRecords = () => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) as PhoneAppointmentRecord[] : initialPhoneAppointmentRecords;
  } catch {
    return initialPhoneAppointmentRecords;
  }
};

const createScenarioRecord = (status: PhoneAppointmentConfirmationStatus, service = appointmentServices[0]): PhoneAppointmentRecord => ({
  id: `CALL-MOCK-${status}`,
  elder: { id: 'elder-wang', name: '王奶奶', phone: '+65 8123 4567' },
  service: { id: service.id, name: service.name, categoryName: appointmentCategoryName(service.category) },
  provider: { name: service.provider, phone: service.providerPhone },
  calledAt: '2026-10-29T18:26:00+08:00',
  confirmationStatus: status,
  appointmentTime: status === 'confirmed' ? '2026-10-30 14:00–16:00' : null,
  note: status === 'confirmed' ? '服务机构已确认上门时间。' : status === 'failed' ? '服务机构暂未安排本次上门。' : null,
  childNotification: status === 'no_guardian' ? { recipientIds: [], sentAt: null } : { recipientIds: ['child-zhang-xiaoyan', 'child-zhang-jianping'], sentAt: '2026-10-29T18:26:10+08:00' },
});

const formatCalledAt = (value: string) => new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
type Props = { scenario: AppointmentScenario; onViewChange?: (view: View) => void };

export default function AppointmentServicesPage({ scenario, onViewChange }: Props) {
  const [view, setViewState] = useState<View>('list');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<AppointmentService>(appointmentServices[0]);
  const [records, setRecords] = useState<PhoneAppointmentRecord[]>(readRecords);
  const [latest, setLatest] = useState<PhoneAppointmentRecord | null>(null);
  const setView = (next: View) => { setViewState(next); onViewChange?.(next); };

  useEffect(() => {
    if (scenario === 'list') setViewState('list');
    if (scenario === 'detail') setViewState('detail');
    if (scenario === 'records') setViewState('records');
    if (scenario === 'pending' || scenario === 'confirmed' || scenario === 'failed' || scenario === 'no_guardian') {
      setLatest(createScenarioRecord(scenario));
      setViewState('result');
    }
  }, [scenario]);

  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }, [records]);
  const visible = useMemo(() => filter === 'all' ? appointmentServices : appointmentServices.filter(item => item.category === filter), [filter]);
  const counts = useMemo(() => Object.fromEntries(appointmentCategories.map(item => [item.code, appointmentServices.filter(service => service.category === item.code).length])), []);

  const recordPhoneAppointment = () => {
    const hasBoundGuardian = scenario !== 'no_guardian';
    const now = new Date().toISOString();
    const record: PhoneAppointmentRecord = {
      id: `CALL-${Date.now()}`,
      elder: { id: 'elder-wang', name: '王奶奶', phone: '+65 8123 4567' },
      service: { id: selected.id, name: selected.name, categoryName: appointmentCategoryName(selected.category) },
      provider: { name: selected.provider, phone: selected.providerPhone },
      calledAt: now,
      confirmationStatus: hasBoundGuardian ? 'pending' : 'no_guardian',
      appointmentTime: null,
      note: null,
      childNotification: hasBoundGuardian ? { recipientIds: ['child-zhang-xiaoyan', 'child-zhang-jianping'], sentAt: now } : { recipientIds: [], sentAt: null },
    };
    setRecords(current => [record, ...current]);
    setLatest(record);
    if (hasBoundGuardian) {
      const notifications = record.childNotification.recipientIds.map(recipientId => ({ id: `${record.id}-${recipientId}`, type: 'phone_appointment_confirmation', recipientId, record }));
      window.localStorage.setItem(CHILD_NOTIFICATION_KEY, JSON.stringify(notifications));
    }
    setView('result');
  };

  const header = <ElderPageHeader title="预约服务" description="查看社区服务，拨打电话后可在这里查看预约结果。" />;
  const switcher = <div className="appointment-section-switch" role="tablist" aria-label="预约服务页面"><button className={view !== 'records' ? 'active' : ''} onClick={() => setView('list')}><CalendarCheck2 />可预约服务</button><button className={view === 'records' ? 'active' : ''} onClick={() => setView('records')}><ClipboardList />预约进展</button></div>;

  return <>
    {(view === 'list' || view === 'records') && <>{header}{switcher}</>}
    {view === 'list' && <><div className="appointment-categories"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>全部 {appointmentServices.length}</button>{appointmentCategories.map(item => <button key={item.code} className={filter === item.code ? 'active' : ''} onClick={() => setFilter(item.code)}>{item.name} {counts[item.code]}</button>)}</div><section className="appointment-service-list">{visible.map(service => { const CategoryIcon = categoryIcons[service.category]; return <button key={service.id} className="appointment-service-card" onClick={() => { setSelected(service); setView('detail'); }}><span className={`appointment-service-icon ${service.category}`}><CategoryIcon /></span><div><small>{appointmentCategoryName(service.category)}</small><h3>{service.name}</h3><p>{service.provider}</p><b>{service.priceRange}<em> 参考区间</em></b></div><ChevronRight /></button>; })}</section></>}

    {view === 'detail' && <section className="appointment-detail"><div className={`appointment-detail-hero ${selected.category}`}><span>{appointmentCategoryName(selected.category)}</span><CalendarCheck2 /></div><h2>{selected.name}</h2><strong className="appointment-price">{selected.priceRange}<small> 参考价格区间</small></strong><p>{selected.longDescription}</p><div className="appointment-provider"><UserRound /><div className="appointment-provider-content"><div className="appointment-provider-heading"><small>服务机构</small><strong>{selected.provider}</strong><a href={`tel:${selected.providerPhone.replace(/\s/g, '')}`} onClick={recordPhoneAppointment}>{selected.providerPhone}</a></div><dl className="appointment-provider-facts"><div><dt><Clock3 />营业时间</dt><dd>{selected.businessHours}</dd></div><div><dt><MapPin />支持区域</dt><dd>{selected.serviceArea}</dd></div></dl></div></div><div className="appointment-features">{selected.features.map(feature => <span key={feature}><Check />{feature}</span>)}</div><div className="appointment-consultation-note"><PhoneCall /><span><strong>电话直接预约</strong><small>拨打后可与服务机构确认上门时间，预约结果会同步给已绑定家人确认。</small></span></div><a className="primary-button appointment-call-button" href={`tel:${selected.providerPhone.replace(/\s/g, '')}`} onClick={recordPhoneAppointment}><PhoneCall />拨打电话预约<span>{selected.providerPhone}</span></a></section>}

    {view === 'result' && latest && <section className={`appointment-call-result ${latest.confirmationStatus}`}><span>{latest.confirmationStatus === 'confirmed' ? <CheckCircle2 /> : latest.confirmationStatus === 'failed' ? <XCircle /> : <CircleAlert />}</span><h2>{statusMeta[latest.confirmationStatus].label}</h2><p>{statusMeta[latest.confirmationStatus].description}</p><dl><div><dt>服务</dt><dd>{latest.service.categoryName} · {latest.service.name}</dd></div><div><dt>服务机构</dt><dd>{latest.provider.name}</dd></div><div><dt>拨打时间</dt><dd>{formatCalledAt(latest.calledAt)}</dd></div>{latest.appointmentTime && <div><dt>预约时间</dt><dd>{latest.appointmentTime}</dd></div>}{latest.note && <div><dt>备注</dt><dd>{latest.note}</dd></div>}</dl><button className="primary-button" onClick={() => setView('records')}>查看预约进展</button><button className="secondary-button" onClick={() => setView('list')}>继续查看服务</button></section>}

    {view === 'records' && <section className="appointment-records">{records.map(record => <article key={record.id} className={`appointment-record ${record.confirmationStatus}`}><header><span>{record.service.categoryName}</span><b>{statusMeta[record.confirmationStatus].label}</b></header><h3>{record.service.name}</h3><p><PhoneCall />{record.provider.name} · {record.provider.phone}</p><p><Clock3 />拨打于 {formatCalledAt(record.calledAt)}</p>{record.appointmentTime && <p><CalendarCheck2 />上门时间：{record.appointmentTime}</p>}{record.note && <p><ClipboardList />{record.note}</p>}<footer><small>{record.id}</small><span>{statusMeta[record.confirmationStatus].description}</span></footer></article>)}</section>}
  </>;
}
