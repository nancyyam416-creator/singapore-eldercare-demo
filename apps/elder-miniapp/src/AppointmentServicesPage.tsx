import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, Check, CheckCircle2, ChevronRight, ClipboardList, Droplets, MapPin, PhoneCall, Wrench, Zap, UserRound } from 'lucide-react';
import ElderPageHeader from './ElderPageHeader';
import { appointmentCategories, appointmentCategoryName, appointmentServices, initialAppointmentRecords, type AppointmentCategoryCode, type AppointmentRecord, type AppointmentService, type AppointmentStatus, type ConsultationCallRecord } from './appointmentData';

export type AppointmentScenario = 'list' | 'detail' | 'form' | 'success' | 'records';
type Filter = 'all' | AppointmentCategoryCode;
type View = 'list' | 'detail' | 'form' | 'success' | 'records';

const STORAGE_KEY = 'u2g-elder-appointments-v2';
const CALL_LOG_KEY = 'u2g-elder-service-consultations-v1';
const categoryIcons = { electric: Zap, water: Droplets, basic: Wrench };
const statusMeta: Record<AppointmentStatus, { label: string }> = {
  pending: { label: '等待联系确认' },
  confirmed: { label: '已确认' },
  in_service: { label: '服务中' },
  completed: { label: '已完成' },
};

const readRecords = () => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) as AppointmentRecord[] : initialAppointmentRecords;
  } catch {
    return initialAppointmentRecords;
  }
};

type Props = { scenario: AppointmentScenario; onViewChange?: (view: View) => void };

export default function AppointmentServicesPage({ scenario, onViewChange }: Props) {
  const [view, setViewState] = useState<View>('list');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<AppointmentService>(appointmentServices[0]);
  const [records, setRecords] = useState<AppointmentRecord[]>(readRecords);
  const [date, setDate] = useState('2026-10-30');
  const [time, setTime] = useState('14:00-16:00');
  const [contact, setContact] = useState('+65 8123 4567');
  const [remark, setRemark] = useState('请提前电话联系。');
  const [latest, setLatest] = useState<AppointmentRecord | null>(null);

  const setView = (next: View) => { setViewState(next); onViewChange?.(next); };

  useEffect(() => {
    if (scenario === 'list') setViewState('list');
    if (scenario === 'detail') setViewState('detail');
    if (scenario === 'form') setViewState('form');
    if (scenario === 'success') {
      const example = records[0] ?? initialAppointmentRecords[0];
      setLatest(example); setViewState('success');
    }
    if (scenario === 'records') setViewState('records');
  }, [scenario]);

  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }, [records]);

  const visible = useMemo(() => filter === 'all' ? appointmentServices : appointmentServices.filter(item => item.category === filter), [filter]);
  const counts = useMemo(() => Object.fromEntries(appointmentCategories.map(item => [item.code, appointmentServices.filter(service => service.category === item.code).length])), []);

  const submit = () => {
    const record: AppointmentRecord = { id: `APT-${Date.now().toString().slice(-8)}`, serviceId: selected.id, serviceName: selected.name, categoryNameSnapshot: appointmentCategoryName(selected.category), provider: selected.provider, priceRange: selected.priceRange, serviceDate: date, serviceTime: time, elderName: '王奶奶', address: '红山社区 3栋 2单元 402室', contact, remark, status: 'pending', createdAt: '2026-10-28 10:30' };
    setRecords(current => [record, ...current]); setLatest(record); setView('success');
  };

  const recordConsultationCall = () => {
    let current: ConsultationCallRecord[] = [];
    try {
      const stored = window.localStorage.getItem(CALL_LOG_KEY);
      current = stored ? JSON.parse(stored) as ConsultationCallRecord[] : [];
    } catch {
      current = [];
    }
    const record: ConsultationCallRecord = { id: `CALL-${Date.now()}`, serviceId: selected.id, serviceName: selected.name, provider: selected.provider, providerPhone: selected.providerPhone, elderName: '王奶奶', callerPhone: '+65 8123 4567', initiatedAt: new Date().toISOString(), channel: 'elder_miniapp' };
    window.localStorage.setItem(CALL_LOG_KEY, JSON.stringify([record, ...current]));
  };

  const header = <ElderPageHeader title="预约服务" description="浏览当前社区可预约服务，或查看我的预约记录。" />;
  const switcher = <div className="appointment-section-switch" role="tablist" aria-label="预约服务页面">
    <button className={view !== 'records' ? 'active' : ''} onClick={() => setView('list')}><CalendarCheck2 />可预约服务</button>
    <button className={view === 'records' ? 'active' : ''} onClick={() => setView('records')}><ClipboardList />我的预约</button>
  </div>;

  return <>
    {(view === 'list' || view === 'records') && <>{header}{switcher}</>}
    {view === 'list' && <>
      <div className="appointment-categories"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>全部 {appointmentServices.length}</button>{appointmentCategories.map(item => <button key={item.code} className={filter === item.code ? 'active' : ''} onClick={() => setFilter(item.code)}>{item.name} {counts[item.code]}</button>)}</div>
      <section className="appointment-service-list">{visible.map(service => { const CategoryIcon = categoryIcons[service.category]; return <button key={service.id} className="appointment-service-card" onClick={() => { setSelected(service); setView('detail'); }}><span className={`appointment-service-icon ${service.category}`}><CategoryIcon /></span><div><small>{appointmentCategoryName(service.category)}</small><h3>{service.name}</h3><p>{service.provider}</p><b>{service.priceRange}<em> 参考区间</em></b></div><ChevronRight /></button>; })}</section>
    </>}

    {view === 'detail' && <section className="appointment-detail">
      <div className={`appointment-detail-hero ${selected.category}`}><span>{appointmentCategoryName(selected.category)}</span><CalendarCheck2 /></div>
      <h2>{selected.name}</h2><strong className="appointment-price">{selected.priceRange}<small> 参考价格区间</small></strong><p>{selected.longDescription}</p>
      <div className="appointment-provider"><UserRound /><div><small>服务机构</small><strong>{selected.provider}</strong><a href={`tel:${selected.providerPhone.replace(/\s/g, '')}`} onClick={recordConsultationCall}>{selected.providerPhone}</a></div></div>
      <div className="appointment-features">{selected.features.map(feature => <span key={feature}><Check />{feature}</span>)}</div>
      <div className="appointment-consultation-note"><PhoneCall /><span><strong>电话也可直接预约</strong><small>可直接拨打服务机构电话预约上门时间，也可以先了解服务范围和价格。</small></span></div>
      <a className="primary-button appointment-call-button" href={`tel:${selected.providerPhone.replace(/\s/g, '')}`} onClick={recordConsultationCall}><PhoneCall />拨打电话预约<span>{selected.providerPhone}</span></a>
      <button className="secondary-button appointment-online-button" onClick={() => setView('form')}><CalendarCheck2 />在线提交预约信息</button>
      <p className="appointment-online-hint">也可以在线填写服务需求和时间，提交后将为您安排后续联系。</p>
    </section>}

    {view === 'form' && <section className="appointment-form">
      <div className="appointment-form-summary"><small>{appointmentCategoryName(selected.category)}</small><h2>填写预约信息</h2><p>{selected.name} · 参考 {selected.priceRange}</p></div>
      <div className="appointment-form-notice"><PhoneCall /><span><strong>在线提交预约信息</strong><small>填写服务时间和联系方式后，将为您安排后续联系；也可拨打 {selected.providerPhone} 直接预约。</small></span></div>
      <div className="appointment-readonly"><UserRound /><div><small>服务对象</small><strong>王奶奶（本人）</strong></div></div>
      <div className="appointment-readonly"><MapPin /><div><small>服务地址</small><strong>红山社区 3栋 2单元 402室</strong></div></div>
      <div className="two-fields"><label className="field-label">上门日期<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label><label className="field-label">上门时间<select value={time} onChange={event => setTime(event.target.value)}><option>09:00-11:00</option><option>14:00-16:00</option><option>16:00-18:00</option></select></label></div>
      <label className="field-label">联系电话<input value={contact} onChange={event => setContact(event.target.value)} /></label>
      <label className="field-label">备注（选填）<textarea value={remark} onChange={event => setRemark(event.target.value)} /></label>
      <button className="primary-button" disabled={!date || !time || !contact.trim()} onClick={submit}><Check />提交预约</button>
    </section>}

    {view === 'success' && latest && <section className="appointment-success"><span><CheckCircle2 /></span><h2>预约信息已记录</h2><b>当前状态：等待联系确认</b><p>{latest.categoryNameSnapshot} · {latest.serviceName}</p><small>我们将根据您填写的信息安排后续联系；也可以直接拨打服务电话预约。</small><small>预约编号 {latest.id}</small><button className="primary-button" onClick={() => setView('records')}>查看我的预约</button><button className="secondary-button" onClick={() => setView('list')}>继续查看服务</button></section>}

    {view === 'records' && <section className="appointment-records">{records.map(record => <article key={record.id} className={`appointment-record ${record.status}`}><header><span>{record.categoryNameSnapshot}</span><b>{statusMeta[record.status].label}</b></header><h3>{record.serviceName}</h3><p><CalendarCheck2 />{record.serviceDate} · {record.serviceTime}</p><p><MapPin />{record.address}</p><p><UserRound />服务对象：{record.elderName}（本人）</p><footer><small>{record.id}</small><span>完成联系确认后将更新状态</span></footer></article>)}</section>}
  </>;
}
