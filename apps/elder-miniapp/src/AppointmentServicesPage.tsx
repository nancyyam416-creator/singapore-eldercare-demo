import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarCheck2, Check, CheckCircle2, ChevronRight, ClipboardList, Clock3, Droplets, MapPin, Wrench, Zap, UserRound } from 'lucide-react';
import ElderPageHeader from './ElderPageHeader';
import { appointmentCategories, appointmentCategoryName, appointmentServices, initialAppointmentRecords, type AppointmentCategoryCode, type AppointmentRecord, type AppointmentService, type AppointmentStatus } from './appointmentData';

export type AppointmentScenario = 'list' | 'detail' | 'form' | 'success' | 'records';
type Filter = 'all' | AppointmentCategoryCode;
type View = 'list' | 'detail' | 'form' | 'success' | 'records';

const STORAGE_KEY = 'u2g-elder-appointments-v2';
const categoryIcons = { electric: Zap, water: Droplets, basic: Wrench };
const statusMeta: Record<AppointmentStatus, { label: string; next?: AppointmentStatus }> = {
  pending: { label: '待确认', next: 'confirmed' },
  confirmed: { label: '已确认', next: 'in_service' },
  in_service: { label: '服务中', next: 'completed' },
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
    if (scenario === 'list') setView('list');
    if (scenario === 'detail') { setSelected(appointmentServices[0]); setView('detail'); }
    if (scenario === 'form') { setSelected(appointmentServices[0]); setView('form'); }
    if (scenario === 'success') {
      const example = records[0] ?? initialAppointmentRecords[0];
      setLatest(example); setView('success');
    }
    if (scenario === 'records') setView('records');
  }, [scenario]);

  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }, [records]);

  const visible = useMemo(() => filter === 'all' ? appointmentServices : appointmentServices.filter(item => item.category === filter), [filter]);
  const counts = useMemo(() => Object.fromEntries(appointmentCategories.map(item => [item.code, appointmentServices.filter(service => service.category === item.code).length])), []);

  const submit = () => {
    const record: AppointmentRecord = { id: `APT-${Date.now().toString().slice(-8)}`, serviceId: selected.id, serviceName: selected.name, categoryNameSnapshot: appointmentCategoryName(selected.category), provider: selected.provider, priceRange: selected.priceRange, serviceDate: date, serviceTime: time, elderName: '王奶奶', address: '红山社区 3栋 2单元 402室', contact, remark, status: 'pending', createdAt: '2026-10-28 10:30' };
    setRecords(current => [record, ...current]); setLatest(record); setView('success');
  };

  const advance = (record: AppointmentRecord) => {
    const next = statusMeta[record.status].next;
    if (!next) return;
    setRecords(current => current.map(item => item.id === record.id ? { ...item, status: next } : item));
  };

  const header = <ElderPageHeader title="预约服务" description="浏览当前社区可预约服务，或查看我的预约记录。" />;
  const switcher = <div className="appointment-section-switch" role="tablist" aria-label="预约服务页面">
    <button className={view !== 'records' ? 'active' : ''} onClick={() => setView('list')}><CalendarCheck2 />可预约服务</button>
    <button className={view === 'records' ? 'active' : ''} onClick={() => setView('records')}><ClipboardList />我的预约</button>
  </div>;

  return <>
    {header}
    {switcher}
    {view === 'list' && <>
      <div className="appointment-categories"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>全部 {appointmentServices.length}</button>{appointmentCategories.map(item => <button key={item.code} className={filter === item.code ? 'active' : ''} onClick={() => setFilter(item.code)}>{item.name} {counts[item.code]}</button>)}</div>
      <section className="appointment-service-list">{visible.map(service => { const CategoryIcon = categoryIcons[service.category]; return <button key={service.id} className="appointment-service-card" onClick={() => { setSelected(service); setView('detail'); }}><span className={`appointment-service-icon ${service.category}`}><CategoryIcon /></span><div><small>{appointmentCategoryName(service.category)}</small><h3>{service.name}</h3><p>{service.provider}</p><b>{service.priceRange}<em> 参考区间</em></b></div><ChevronRight /></button>; })}</section>
    </>}

    {view === 'detail' && <section className="appointment-detail">
      <button className="text-back" onClick={() => setView('list')}><ArrowLeft />返回服务列表</button>
      <div className={`appointment-detail-hero ${selected.category}`}><span>{appointmentCategoryName(selected.category)}</span><CalendarCheck2 /></div>
      <h2>{selected.name}</h2><strong className="appointment-price">{selected.priceRange}<small> 参考价格区间</small></strong><p>{selected.longDescription}</p>
      <div className="appointment-provider"><UserRound /><div><small>服务机构</small><strong>{selected.provider}</strong></div></div>
      <div className="appointment-features">{selected.features.map(feature => <span key={feature}><Check />{feature}</span>)}</div>
      <button className="primary-button" onClick={() => setView('form')}><CalendarCheck2 />立即预约</button>
    </section>}

    {view === 'form' && <section className="appointment-form">
      <button className="text-back" onClick={() => setView('detail')}><ArrowLeft />返回服务详情</button>
      <div className="appointment-form-summary"><small>{appointmentCategoryName(selected.category)}</small><h2>填写预约信息</h2><p>{selected.name} · 参考 {selected.priceRange}</p></div>
      <div className="appointment-readonly"><UserRound /><div><small>服务对象</small><strong>王奶奶（本人）</strong></div></div>
      <div className="appointment-readonly"><MapPin /><div><small>服务地址</small><strong>红山社区 3栋 2单元 402室</strong></div></div>
      <div className="two-fields"><label className="field-label">上门日期<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label><label className="field-label">上门时间<select value={time} onChange={event => setTime(event.target.value)}><option>09:00-11:00</option><option>14:00-16:00</option><option>16:00-18:00</option></select></label></div>
      <label className="field-label">联系电话<input value={contact} onChange={event => setContact(event.target.value)} /></label>
      <label className="field-label">备注（选填）<textarea value={remark} onChange={event => setRemark(event.target.value)} /></label>
      <button className="primary-button" disabled={!date || !time || !contact.trim()} onClick={submit}><Check />提交预约</button>
    </section>}

    {view === 'success' && latest && <section className="appointment-success"><span><CheckCircle2 /></span><h2>预约已提交</h2><b>当前状态：待确认</b><p>{latest.categoryNameSnapshot} · {latest.serviceName}</p><small>预约编号 {latest.id}</small><button className="primary-button" onClick={() => setView('records')}>查看我的预约</button><button className="secondary-button" onClick={() => setView('list')}>继续查看服务</button></section>}

    {view === 'records' && <section className="appointment-records">{records.map(record => <article key={record.id} className={`appointment-record ${record.status}`}><header><span>{record.categoryNameSnapshot}</span><b>{statusMeta[record.status].label}</b></header><h3>{record.serviceName}</h3><p><CalendarCheck2 />{record.serviceDate} · {record.serviceTime}</p><p><MapPin />{record.address}</p><p><UserRound />服务对象：{record.elderName}（本人）</p><footer><small>{record.id}</small>{statusMeta[record.status].next && <button onClick={() => advance(record)}><Clock3 />演示下一状态 <em>Mock</em></button>}</footer></article>)}</section>}
  </>;
}
