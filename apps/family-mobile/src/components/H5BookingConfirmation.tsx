import { initialServiceAssistanceRecords } from '../../../elder-miniapp/src/appointmentData';
import { startSharedServiceContact, answerSharedServiceContact, askSharedElderIfFamilyHelpNeeded, startSharedFamilyServiceContact, submitSharedFamilyServiceContactResult, confirmSharedFamilyHandlingCompletion, isFamilyAssistanceRecord, isPendingServiceContact, upsertSharedServiceAssistanceRecord, normalizeServiceAssistanceRecord, serviceAssistanceExpiryMs, readSharedServiceAssistanceRecords, subscribeSharedServiceAssistanceRecords } from '../../../产品理解/90 原型与Mock素材/mock/服务协助记录共享Mock.js';
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';

const formatTime = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '时间暂不可用' : new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(date); };

type Status = '状态待更新' | '联系意向' | '拨号待确认' | '已约好' | '家人处理完成' | '已失效' | '待处理' | '处理中' | '已处理' | '已取消';
const toStatus = (record: { status: string; familyHandlingStatus?: string; phoneActionType?: string }) => (
  isPendingServiceContact(record) && record.phoneActionType === 'phone_viewed' ? '联系意向' : isPendingServiceContact(record) ? '拨号待确认' : (record as { workflowStage?: string }).workflowStage === 'appointment_confirmed' ? '已约好' : record.familyHandlingStatus === 'completed' ? '家人处理完成' : record.status === 'expired' ? '已失效' : record.status === 'cancelled' ? '已取消'
    : record.status === 'handling' ? '处理中'
      : record.status === 'handled' ? '已处理'
        : record.status === 'pending' && isFamilyAssistanceRecord(record) ? '待处理' : '状态待更新'
) as Status;
type DisplayRecord = ReturnType<typeof normalizeServiceAssistanceRecord>;
const statusLabel = (record: DisplayRecord) => {
  if (record.status === 'expired') return '已失效';
  if (record.status === 'cancelled') return null;
  if (isPendingServiceContact(record)) return record.familyHelpInquiry ? '处理中' : '待处理';
  if (record.state === '处理中' || record.familyContactResult === 'not_appointed') return '处理中';
  if (record.state === '待处理') return '待处理';
  if (['已约好', '已处理', '家人处理完成'].includes(record.state)) return '已处理';
  return null;
};
const displayColors = { 待处理: 'bg-amber-50 text-amber-700', 处理中: 'bg-blue-50 text-blue-700', 已处理: 'bg-emerald-50 text-emerald-700', 已失效: 'bg-slate-100 text-slate-500' };
function RecordBadge({record}: {record: DisplayRecord}) {
  const label = statusLabel(record);
  return label && <span className={`rounded-full px-2 py-1 text-xs ${displayColors[label]}`}>{label}</span>;
}
let previewGroup: string | null = null;
export function selectServicePreview(group: string | null) { previewGroup = group; }
const makePreview = (help: boolean) => {
  const now = new Date(Date.now() - 10 * 60000).toISOString();
  const variants = help ? [
    {}, { status: 'handling', handledBy: '张女士' },
    { status: 'handled', familyContactResult: 'appointment_confirmed' },
    { status: 'pending', requestedAt: new Date(Date.now() - 49 * 3600000).toISOString(), familyHelpRequestedAt: new Date(Date.now() - 49 * 3600000).toISOString() }
  ] : [
    { phoneActionType: 'phone_viewed' },
    { phoneActionType: 'call_started', familyHelpInquiry: { actorName: '张女士' } },
    { phoneActionType: 'call_started', appointmentOutcome: 'appointment_confirmed' }
  ];
  return variants.map((variant, index) => {
    const started = variant.requestedAt || now;
    const types = help
      ? ['family_help_requested', 'family_service_contact_started', 'family_service_contact_result_submitted']
      : [index === 0 ? 'service_phone_viewed' : 'service_call_started', 'family_help_inquiry_sent', 'elder_appointment_confirmed'];
    const workflowEvents = types.slice(0, index === 3 ? 1 : index + 1).map((type, step) => {
      const child = step === 1 || (help && step === 2);
      const elder = initialServiceAssistanceRecords[0].elder;
      return {
        id: `preview-event-${help}-${index}-${step}`, type, actorType: child ? 'family' : 'elder',
        actorId: child ? 'child-current' : elder.id, actorName: child ? '张女士' : elder.name,
        createdAt: new Date(Date.parse(started) + step * 3 * 60000).toISOString(),
        payload: type === 'family_service_contact_result_submitted' ? { result: 'appointment_confirmed' } : {},
      };
    });
    const record = normalizeServiceAssistanceRecord({ ...initialServiceAssistanceRecords[0], id: 'preview-' + help + '-' + index,
      requestedAt: started, contactStartedAt: started, familyHelpRequestedAt: help ? started : null, workflowEvents,
      workflowStage: help ? 'family_help_pending' : 'contact_pending_confirmation', ...variant });
    return { ...record, state: toStatus(record) };
  });
};
const localDemoEnabled = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
const createDemoBaseline = () => makePreview(true).map(record => ({
  ...record, id: 'local-demo-' + record.id,
}));
let demoBaseline = localDemoEnabled ? createDemoBaseline() : [];
export function resetServiceDemoBaseline() {
  if (localDemoEnabled) demoBaseline = createDemoBaseline();
}
const elderLabel = (record: DisplayRecord) => record.elder?.relationshipName || record.elder?.name || '老人';
const expiryNote = (record: DisplayRecord) => {
  if (record.status !== 'expired' || !isFamilyAssistanceRecord(record)) return '';
  const elapsed = Date.parse(record.expiredAt) - Date.parse(record.familyHelpRequestedAt || record.requestedAt);
  return elapsed >= serviceAssistanceExpiryMs ? '该请求超过48小时未完成处理，已自动失效。' : '';
};
const recordDescription = (record: DisplayRecord) => {
  const name = elderLabel(record);
  if (record.appointmentOutcome === 'service_no_longer_needed') return '老人暂时不需要此服务';
  if (record.familyHandlingStatus === 'completed') return record.resultSummary || '家人已完成本次协助。';
  if (record.familyContactResult === 'appointment_confirmed') return '家人已反馈预约结果。';
  if (record.appointmentOutcome === 'appointment_confirmed') return '老人已确认约好服务。';
  if (isPendingServiceContact(record) && record.familyHelpInquiry) return '家人已询问老人，正在等待答复。';
  if (record.familyContactStatus === 'contacting' || record.status === 'handling') return `${record.handledBy || '家人'}正在帮忙联系`;
  if (record.familyContactResult === 'not_appointed' && record.status === 'pending') return '上次还没约好，可以继续帮忙联系。';
  if (isPendingServiceContact(record) && record.phoneActionType === 'phone_viewed') return `${name}查看了服务电话，尚未发起拨号。`;
  if (isPendingServiceContact(record)) return `${name}${record.phoneActionType === 'call_started' ? '已发起拨号' : '联系结果待确认'}，还未确认是否约好。`;
  if (record.resultSummary) return record.resultSummary;
  if (record.status === 'expired') return expiryNote(record) || '该请求已失效。';
  if (record.status === 'cancelled') return '该协助事项已取消';
  return isFamilyAssistanceRecord(record) ? `${name}希望家人帮忙联系。` : '等待最新状态';
};
const eventTitle = (event: { type: string; actorName?: string; payload?: { result?: string } }) => {
  const actor = event.actorName || '家人';
  const labels: Record<string, string> = { elder_service_no_longer_needed: '老人暂时不需要此服务', service_phone_viewed: '老人查看了服务电话', service_call_started: '老人发起拨号', family_help_inquiry_sent: `${actor}询问老人是否约好`, elder_appointment_confirmed: '老人确认约好了', elder_family_help_requested: '老人没约好，请家人帮忙', family_help_requested: '老人请求家人帮忙', family_help_reminded: '老人再次提醒', family_help_claimed: `${actor}开始帮忙联系`, family_service_contact_started: `${actor}开始帮忙联系`, family_service_contact_result_submitted: `${actor}反馈${event.payload?.result === 'appointment_confirmed' ? '约好了' : '还没约好'}` };
  return labels[event.type] || '记录更新';
};
const pendingExample = { ...initialServiceAssistanceRecords[0], id: 'HELP-CHILD-PREVIEW-20261105', requestedAt: new Date().toISOString() };
export function addPendingServiceAssistanceExample() {
  upsertSharedServiceAssistanceRecord({ ...pendingExample, id: `HELP-PREVIEW-${Date.now()}`, requestedAt: new Date().toISOString() });
  syncSharedRecords();
}
export function addServiceContactScenario(scenario: 'pending' | 'other' | 'confirmed' | 'help') {
  const candidate = { ...initialServiceAssistanceRecords[0], id: `CONTACT-PREVIEW-${Date.now()}`, requestedAt: new Date().toISOString() };
  const { record } = startSharedServiceContact(candidate);
  if (!record) return;
  if (scenario !== 'pending') answerSharedServiceContact(record.id, scenario === 'confirmed' ? 'appointment_confirmed' : 'family_help_requested');
  if (scenario === 'other') startSharedFamilyServiceContact(record.id, { id: 'child-other', name: '李先生' });
  syncSharedRecords();
}
const initial = () => [pendingExample, ...initialServiceAssistanceRecords].map(record => normalizeServiceAssistanceRecord(record)).map(record => ({ ...record, state: toStatus(record) }));
let records = initial();
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const snapshot = () => records;
const currentHandler = '张女士';
const syncSharedRecords = () => {
  const shared = readSharedServiceAssistanceRecords().map((record) => ({ ...record, state: toStatus(record) }));
  const sharedIds = new Set(shared.map((record) => record.id));
  const next = [...shared, ...initial().filter(record => !sharedIds.has(record.id))].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  if (JSON.stringify(next) === JSON.stringify(records)) return;
  records = next;
  listeners.forEach(listener => listener());
};
export function ServiceAssistanceBadge() {
  const items = useSyncExternalStore(subscribe, snapshot);
  useEffect(() => { syncSharedRecords(); const off = subscribeSharedServiceAssistanceRecords(syncSharedRecords); const timer = window.setInterval(syncSharedRecords, 1200); return () => { off(); window.clearInterval(timer); }; }, []);
  const count = items.filter(item => item.state === '待处理' && isFamilyAssistanceRecord(item)).length;
  return count > 0 ? <span aria-label={`${count}条待处理协助`} className="rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-4 text-white">{count}</span> : null;
}
export function H5BookingConfirmation({ visible, inline = false, onDetailChange }: { onDetailChange: (open: boolean) => void; visible: boolean; resetSignal: number; inline?: boolean }) {
  const stored = useSyncExternalStore(subscribe, snapshot);
  const [preview] = useState(() => previewGroup);
  const [examples, setExamples] = useState(() => preview ? [...makePreview(false), ...makePreview(true)] : demoBaseline);
  useEffect(() => {
    if (!preview && localDemoEnabled) demoBaseline = examples;
  }, [examples, preview]);
  const [group, setGroup] = useState(preview || 'all');
  const items = preview ? examples : [...examples, ...stored];
  const [selectedStatus, setSelectedStatus] = useState('');
  useEffect(() => {
    if (!preview) return;
    window.dispatchEvent(new CustomEvent('service-preview-filter-change', { detail: { group, status: selectedStatus } }));
    const applyFilter = (event: Event) => {
      setSelectedId(null);
      setSimulatedCall(false);
      setSelectedStatus((event as CustomEvent<string>).detail);
    };
    window.addEventListener('service-preview-select-filter', applyFilter);
    return () => window.removeEventListener('service-preview-select-filter', applyFilter);
  }, [preview, group, selectedStatus]);
  const visibleItems = !preview ? items : items.filter(item => group === 'all' || (group === 'help') === isFamilyAssistanceRecord(item)).filter(item => !selectedStatus || statusLabel(item) === selectedStatus);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simulatedCall, setSimulatedCall] = useState(false);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('service-preview-can-return', { detail: simulatedCall }));
    if (!simulatedCall) return;
    const finish = () => { setSimulatedCall(false); setFeedback(''); };
    window.addEventListener('service-preview-return', finish);
    return () => {
      window.removeEventListener('service-preview-return', finish);
      window.dispatchEvent(new CustomEvent('service-preview-can-return', { detail: false }));
    };
  }, [simulatedCall]);
  const [feedback, setFeedback] = useState('');
  const selected = items.find(item => item.id === selectedId);
  const inDetail = Boolean(selected);
  React.useLayoutEffect(() => { onDetailChange(inDetail); }, [inDetail, onDetailChange]);
  useEffect(() => {
    if (!visible) return undefined;
    syncSharedRecords();
    const unsubscribe = subscribeSharedServiceAssistanceRecords(syncSharedRecords);
    const timer = window.setInterval(syncSharedRecords, 1200);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [visible]);
  const updatePreview = (changes: Partial<DisplayRecord>, type: string, result?: string) => {
    setExamples(previous => previous.map(item => {
      if (item.id !== selectedId) return item;
      const event = { type, actorName: currentHandler, createdAt: new Date().toISOString(), payload: { result } };
      const updated = { ...item, ...changes, workflowEvents: [...(item.workflowEvents || []), event] };
      return { ...updated, state: toStatus(updated) };
    }));
  };
  const isolatedRecord = examples.some(record => record.id === selectedId);
  const awaitingPreviewAnswer = Boolean(preview && selected && isPendingServiceContact(selected) && selected.familyHelpInquiry);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('service-preview-awaiting-answer', { detail: awaitingPreviewAnswer }));
    if (!awaitingPreviewAnswer) return;
    const answer = (event: Event) => {
      if ((event as CustomEvent).detail === 'unneeded') {
        updatePreview({ status: 'handled', workflowStage: 'service_no_longer_needed', appointmentOutcome: 'service_no_longer_needed' }, 'elder_service_no_longer_needed');
        setFeedback('');
        return;
      }
      const help = (event as CustomEvent).detail === 'help';
      updatePreview({
        workflowStage: help ? 'family_help_pending' : 'appointment_confirmed',
        appointmentOutcome: help ? 'family_help_requested' : 'appointment_confirmed',
        familyHelpRequestedAt: help ? new Date().toISOString() : null,
        status: help ? 'pending' : 'handled',
      }, help ? 'elder_family_help_requested' : 'elder_appointment_confirmed');
      if (help) setGroup('help');
      setFeedback('');
    };
    window.addEventListener('service-preview-elder-answer', answer);
    return () => {
      window.removeEventListener('service-preview-elder-answer', answer);
      window.dispatchEvent(new CustomEvent('service-preview-awaiting-answer', { detail: false }));
    };
  }, [awaitingPreviewAnswer, selectedId]);
  const beginContact = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!selected) { event.preventDefault(); return; }
    if (isolatedRecord) {
      event.preventDefault();
      updatePreview({ status: 'handling', handledBy: currentHandler, claimedById: 'child-current' }, 'family_service_contact_started');
      setSimulatedCall(true);
      setFeedback('已模拟拨号');
      return;
    }
    try {
      if (!readSharedServiceAssistanceRecords().some(item => item.id === selected.id)) upsertSharedServiceAssistanceRecord(selected);
      const result = startSharedFamilyServiceContact(selected.id, { id: 'child-current', name: currentHandler });
      syncSharedRecords();
      if (!result.started) { event.preventDefault(); setFeedback(result.currentContact ? `${result.currentContact.actor.name || '其他家人'}正在帮忙联系` : '当前无法联系，请刷新记录后重试'); return; }
      const desktop = !/Android|iPhone/i.test(navigator.userAgent);
      if (desktop) event.preventDefault();
      setSimulatedCall(desktop);
      setFeedback(desktop ? '已模拟拨号' : '');
    } catch { event.preventDefault(); setFeedback('发起联系失败，请重试'); }
  };
  const confirmBooking = () => {
    setSimulatedCall(false);
    if (!selected) return;
    if (isolatedRecord) {
      updatePreview({ status: 'handled', familyContactResult: 'appointment_confirmed' },
        'family_service_contact_result_submitted', 'appointment_confirmed');
      setFeedback('');
      return;
    }
    try {
      const response = submitSharedFamilyServiceContactResult(selected.id, 'appointment_confirmed', { id: 'child-current', name: currentHandler });
      syncSharedRecords();
      setFeedback(response.submitted ? '' : '未能提交，请查看最新状态后重试');
    } catch { setFeedback('提交失败，请重试'); }
  };
  if (!visible) return null;
  const canHandle = selected?.state === '处理中' && (selected.claimedById ? selected.claimedById === 'child-current' : selected.handledBy === currentHandler);
  const askElder = () => {
    if (!selected || !isPendingServiceContact(selected)) return;
    if (isolatedRecord) {
      updatePreview({ familyHelpInquiry: { actorName: currentHandler } }, 'family_help_inquiry_sent');
      setFeedback('');
      return;
    }
    try {
      const result = askSharedElderIfFamilyHelpNeeded(selected.id, { id: 'child-current', name: currentHandler });
      syncSharedRecords(); setFeedback(result.asked || result.reason === 'inquiry_already_sent' ? '' : '询问未发送，请检查最新状态后重试');
    } catch { setFeedback('询问发送失败，请重试'); }
  };
  const taskReason = selected?.appointmentOutcome === 'service_no_longer_needed' ? '老人暂时不需要此服务' : selected?.state === '处理中' && !canHandle && selected.handledBy
    ? `${selected.handledBy}正在联系服务商。`
    : selected ? expiryNote(selected) : '';
  const actionBar = selected && (canHandle || ['待处理', '拨号待确认', '联系意向'].includes(selected.state) || (!preview && isFamilyAssistanceRecord(selected) && selected.state === '已处理' && !selected.familyContactResult)) ? <div data-service-assistance-actions className="absolute inset-x-0 bottom-16 z-30 space-y-2 border-t border-slate-100 bg-white px-4 pt-4 pb-4 shadow-sm">        {selected.state === '已处理' && !selected.familyContactResult && <button onClick={() => { syncSharedRecords(); const current = records.find(item => item.id === selectedId); if (!current || current.state !== '已处理') return; upsertSharedServiceAssistanceRecord(current); confirmSharedFamilyHandlingCompletion(current.id, currentHandler); syncSharedRecords(); }} className="w-full rounded-xl bg-blue-600 p-3 text-white">确认处理完成</button>}
        {selected.state === '家人处理完成' && <p role="status" className="text-sm text-emerald-700">{selected.review ? `老人已评价：${selected.review.rating} 星` : '家人处理完成'}</p>}
        {isPendingServiceContact(selected) && <button onClick={askElder} disabled={Boolean(selected.familyHelpInquiry)} className="w-full rounded-xl bg-blue-600 p-3 text-white disabled:bg-slate-200 disabled:text-slate-500">{selected.familyHelpInquiry ? '已询问老人，等待答复' : '问问老人约好了吗'}</button>}
        {selected.state === '待处理' && <a onClick={beginContact} href={`tel:${selected.provider.phone.replace(/\s/g, '')}`} className="block w-full rounded-xl bg-blue-600 p-3 text-center text-white">打电话帮忙约</a>}
        {canHandle && <button onClick={confirmBooking} className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white">已约好</button>}
        {canHandle && <a onClick={beginContact} href={`tel:${selected.provider.phone.replace(/\s/g, '')}`} className="flex min-h-11 items-center justify-center text-sm text-blue-600">再次联系</a>}
</div> : null;
  return <>
    {<section aria-label="服务协助记录" className={`space-y-4 ${selected ? 'pb-40' : ''}`}>
      {selected && <header className="flex items-center gap-2">{selected && <button aria-label="返回" onClick={() => { setSimulatedCall(false); setSelectedId(null); }} className="p-3"><ArrowLeft size={18}/></button>}<h2 className="font-bold">{selected ? '服务协助详情' : '服务协助记录'}</h2></header>}
      {!selected ? <div className="space-y-3">{visibleItems.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">暂无相关记录</p>}{visibleItems.map(item => <button key={item.id} onClick={() => {setSelectedId(item.id); setFeedback('');}} className="w-full space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-left"><span className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-slate-800">{item.elder.name}<span className="ml-2 text-xs font-normal text-slate-500">{isFamilyAssistanceRecord(item) ? '请家人帮忙' : '联系动态'}</span></span><RecordBadge record={item}/></span><span className="block pt-2 text-base font-bold leading-6 text-slate-900">联系{item.service.name}服务</span><p className="text-xs leading-5 text-slate-500">{recordDescription(item)}</p><div className="mt-3 space-y-1 border-t border-slate-100 pt-3"><p className="text-xs leading-5 text-slate-500">{item.provider.name}</p><p className="text-[11px] text-slate-400">{formatTime(item.requestedAt)} 发起</p></div></button>)}</div> : <div className="space-y-4">
        <section className="space-y-2 px-1 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h3 className="min-w-0 break-words text-xl font-bold leading-7 text-slate-900">{selected.elder?.name || '老人'}的服务协助</h3>
            <RecordBadge record={selected}/>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-6 text-blue-600">{selected.service.name}</p>
            {taskReason && <p className="text-sm leading-6 text-slate-600">{taskReason}</p>}
            {selected.appointmentAt && <p className="text-sm font-medium leading-6 text-emerald-700">约定时间：{selected.appointmentAt}</p>}
            {selected.feeText && <p className="text-xs leading-5 text-slate-500">历史费用：{selected.feeText}</p>}
          </div>
        </section>
        <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4"><h3 className="text-xs font-medium text-slate-500">联系这家服务商</h3><p className="text-base font-semibold text-slate-900">{selected.provider.name}</p><p className="text-sm text-slate-600">{selected.provider.phone}</p></section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-bold">处理进展</h3></div><ol className="ml-1 border-l border-slate-200">{[
          ...(selected.workflowEvents?.length ? selected.workflowEvents.map((event: { type: string; actorName?: string; createdAt: string }) => ({ title: eventTitle(event), time: event.createdAt })) : [{ title: selected.contactStartedAt ? '老人发起联系' : '老人发起协助', time: selected.requestedAt }]),
          ...(selected.reminderTimes || []).map((time: string) => ({ title: '老人再次提醒家人', time })),
          ...(!selected.workflowEvents?.length && selected.claimedAt ? [{ title: `${selected.handledBy || '家人'}开始帮忙联系`, time: selected.claimedAt }] : []),
          ...(['已处理', '家人处理完成', '已取消'].includes(selected.state) && selected.handledAt && !selected.workflowEvents?.some((event: { type: string; createdAt: string }) =>
            event.type === 'family_service_contact_result_submitted' && Date.parse(event.createdAt) === Date.parse(selected.handledAt)) ? [{ title: selected.state !== '已取消' ? '提交处理结果' : '协助事项已取消', time: selected.handledAt }] : []),
          ...(selected.handlingCompletedAt ? [{ title: '家人处理完成于', time: selected.handlingCompletedAt }] : []),
          ...(selected.state === '已失效' && selected.expiredAt ? [{ title: '请求已失效', time: selected.expiredAt }] : [])
        ].sort((a,b) => Date.parse(a.time) - Date.parse(b.time)).map((event,index) => <li key={`${event.title}-${index}`} className="relative pb-5 pl-5 last:pb-0"><span className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-blue-500"/><p className="text-sm text-slate-700">{event.title}</p><p className="mt-1 text-xs text-slate-400">{formatTime(event.time)}</p></li>)}</ol></section>

        {feedback && <p role="status" className="text-sm text-slate-600">{feedback}</p>}
      </div>}
    </section>}
    {actionBar && (document.getElementById('h5-phone-screen') ? createPortal(actionBar, document.getElementById('h5-phone-screen')!) : actionBar)}
  </>;
}
