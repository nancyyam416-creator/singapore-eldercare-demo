import { initialServiceAssistanceRecords } from '../../../elder-miniapp/src/appointmentData';
import { startSharedServiceContact, answerSharedServiceContact, askSharedElderIfFamilyHelpNeeded, startSharedFamilyServiceContact, submitSharedFamilyServiceContactResult, confirmSharedFamilyHandlingCompletion, isFamilyAssistanceRecord, isPendingServiceContact, upsertSharedServiceAssistanceRecord, normalizeServiceAssistanceRecord, serviceAssistanceExpiryMessage, readSharedServiceAssistanceRecords, subscribeSharedServiceAssistanceRecords } from '../../../产品理解/90 原型与Mock素材/mock/服务协助记录共享Mock.js';
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, X } from 'lucide-react';

const formatTime = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '时间暂不可用' : new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(date); };

type Status = '状态待更新' | '拨号待确认' | '已约好' | '家人处理完成' | '已失效' | '待处理' | '处理中' | '已处理' | '已取消';
const toStatus = (record: { status: string; familyHandlingStatus?: string }) => (
  isPendingServiceContact(record) ? '拨号待确认' : (record as { workflowStage?: string }).workflowStage === 'appointment_confirmed' ? '已约好' : record.familyHandlingStatus === 'completed' ? '家人处理完成' : record.status === 'expired' ? '已失效' : record.status === 'cancelled' ? '已取消'
    : record.status === 'handling' ? '处理中'
      : record.status === 'handled' ? '已处理'
        : record.status === 'pending' && isFamilyAssistanceRecord(record) ? '待处理' : '状态待更新'
) as Status;
const statusStyle: Record<Status, string> = { '状态待更新': 'bg-slate-100 text-slate-500', '拨号待确认': 'bg-violet-50 text-violet-700', '已约好': 'bg-emerald-50 text-emerald-700', '家人处理完成': 'bg-emerald-50 text-emerald-700', '已失效': 'bg-slate-100 text-slate-500', '待处理': 'bg-amber-50 text-amber-700', '处理中': 'bg-blue-50 text-blue-600', '已处理': 'bg-emerald-50 text-emerald-700', '已取消': 'bg-slate-100 text-slate-500' };
const StatusBadge = ({ state }: { state: Status }) => <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle[state]}`}>{state === '待处理' ? '待家人处理' : state}</span>;
type DisplayRecord = ReturnType<typeof normalizeServiceAssistanceRecord>;
const elderLabel = (record: DisplayRecord) => record.elder?.relationshipName || record.elder?.name || '老人';
const recordDescription = (record: DisplayRecord) => {
  const name = elderLabel(record);
  if (record.familyContactStatus === 'contacting' || record.status === 'handling') return `${record.handledBy || '家人'}正在帮忙联系`;
  if (record.familyContactResult === 'not_appointed' && record.status === 'pending') return '上次还没约好，可以继续帮忙联系。';
  if (isPendingServiceContact(record)) return `${name}${record.phoneActionType === 'phone_viewed' ? '查看了服务电话' : record.phoneActionType === 'call_started' ? '已发起拨号' : '联系结果待确认'}，还未确认是否约好。`;
  if (record.resultSummary) return record.resultSummary;
  if (record.status === 'expired') return serviceAssistanceExpiryMessage;
  if (record.status === 'cancelled') return '该协助事项已取消';
  return isFamilyAssistanceRecord(record) ? `${name}希望家人帮忙联系。` : '等待最新状态';
};
const eventTitle = (event: { type: string; actorName?: string; payload?: { result?: string } }) => {
  const actor = event.actorName || '家人';
  const labels: Record<string, string> = { service_call_started: '老人发起拨号', family_help_inquiry_sent: `${actor}询问老人是否约好`, elder_appointment_confirmed: '老人确认约好了', elder_family_help_requested: '老人没约好，请家人帮忙', family_help_requested: '老人请求家人帮忙', family_help_reminded: '老人再次提醒', family_help_claimed: `${actor}开始帮忙联系`, family_service_contact_started: `${actor}开始帮忙联系`, family_service_contact_result_submitted: `${actor}反馈${event.payload?.result === 'appointment_confirmed' ? '约好了' : '还没约好'}` };
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
const readDraft = (id: string) => { try { return JSON.parse(sessionStorage.getItem(`service-contact-draft:${id}`) || '{}'); } catch { return {}; } };
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
export function H5BookingConfirmation({ visible, inline = false }: { visible: boolean; resetSignal: number; inline?: boolean }) {
  const items = useSyncExternalStore(subscribe, snapshot);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [appointmentAt, setAppointmentAt] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [confirmedChoice, setConfirmedChoice] = useState(false);
  const callReturn = useRef<{ id: string; hidden: boolean; simulated: boolean } | null>(null);
  const selected = items.find(item => item.id === selectedId);
  const saveDraft = (time: string) => { setAppointmentAt(time); try { if (selectedId) sessionStorage.setItem(`service-contact-draft:${selectedId}`, JSON.stringify({ appointmentAt: time })); } catch { setFeedback('草稿暂时无法保存，请保持此页重试'); } };
  useEffect(() => {
    const showReturned = () => { if (callReturn.current?.id === selectedId) { setShowResult(true); callReturn.current = null; } };
    const visibility = () => {
      const pending = callReturn.current;
      if (!pending || pending.simulated) return;
      if (document.visibilityState === 'hidden') pending.hidden = true;
      else if (pending.hidden) showReturned();
    };
    const simulate = () => { if (callReturn.current?.simulated) showReturned(); };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('service-contact-simulate-return', simulate);
    return () => { document.removeEventListener('visibilitychange', visibility); window.removeEventListener('service-contact-simulate-return', simulate); };
  }, [selectedId]);

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
  const beginContact = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!selected) { event.preventDefault(); return; }
    try {
      if (!readSharedServiceAssistanceRecords().some(item => item.id === selected.id)) upsertSharedServiceAssistanceRecord(selected);
      const result = startSharedFamilyServiceContact(selected.id, { id: 'child-current', name: currentHandler });
      syncSharedRecords();
      if (!result.started) { event.preventDefault(); setFeedback(result.currentContact ? `${result.currentContact.actor.name || '其他家人'}正在帮忙联系` : '当前无法联系，请刷新记录后重试'); return; }
      setFeedback(''); setShowResult(false); setConfirmedChoice(false);
      callReturn.current = { id: selected.id, hidden: false, simulated: !/Android|iPhone/i.test(navigator.userAgent) };
      if (callReturn.current.simulated) { event.preventDefault(); }
    } catch { event.preventDefault(); setFeedback('发起联系失败，请重试'); }
  };
  const submitResult = (result: string) => {
    if (!selected) return;
    try {
      const response = submitSharedFamilyServiceContactResult(selected.id, result, { id: 'child-current', name: currentHandler }, result === 'appointment_confirmed' ? { appointmentAt } : {});
      syncSharedRecords();
      if (!response.submitted) { setFeedback('结果未提交，事项可能已由其他家人处理，请查看最新状态'); return; }
      try { sessionStorage.removeItem(`service-contact-draft:${selected.id}`); } catch {}
      setShowResult(false); setConfirmedChoice(false); callReturn.current = null;
      setFeedback(result === 'appointment_confirmed' ? '已记录约好结果' : '已记录还没约好，可继续联系');
    } catch { setFeedback('提交失败，已保留填写内容，请重试'); }
  };
  if (!visible) return null;
  const canHandle = selected?.state === '处理中' && (selected.claimedById ? selected.claimedById === 'child-current' : selected.handledBy === currentHandler);
  const askElder = () => {
    if (!selected || !isPendingServiceContact(selected)) return;
    try {
      const result = askSharedElderIfFamilyHelpNeeded(selected.id, { id: 'child-current', name: currentHandler });
      syncSharedRecords(); setFeedback(result.asked || result.reason === 'inquiry_already_sent' ? '已询问老人，等待答复' : '询问未发送，请检查最新状态后重试');
    } catch { setFeedback('询问发送失败，请重试'); }
  };
  const elder = selected ? elderLabel(selected) : '老人';
  const booked = selected?.familyContactResult === 'appointment_confirmed';
  const taskTitle = !selected ? '' : canHandle ? '这次联系约好了吗？' : booked ? `已帮${elder}约好` : selected.state === '已约好' ? `${elder}已约好` : selected.state === '拨号待确认' ? `${elder}还没确认是否约好` : selected.state === '处理中' ? `${selected.handledBy || '其他家人'}正在帮忙联系` : selected.state === '待处理' ? `${elder}想请您帮忙${/维修/.test(selected.service.name) ? '约维修' : '联系服务'}` : selected.state === '已失效' ? '这次请求已失效' : selected.state === '已取消' ? '这次请求已取消' : '这次联系已有结果';
  const taskReason = !selected ? '' : canHandle ? '您已发起联系，确认一下结果，家人就能知道进展。' : booked ? '已记录本次联系结果。' : selected.state === '待处理' ? (selected.familyContactResult === 'not_appointed' ? '上次还没约好，您可以再联系服务商。' : selected.appointmentOutcome === 'family_help_requested' ? '老人没约好，希望家人帮忙联系。' : '') : ['处理中', '已取消', '已约好'].includes(selected.state) ? '' : recordDescription(selected);
  const resultPanel = canHandle && showResult ? <div className="absolute inset-0 z-[85] flex items-end bg-slate-950/50" onClick={() => setShowResult(false)} onKeyDown={event => { if (event.key === 'Escape') setShowResult(false); }}>        <section role="dialog" aria-modal="true" aria-labelledby="contact-result-title" onClick={event => event.stopPropagation()} className="max-h-[85%] w-full space-y-5 overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl"><header className="flex items-center justify-between gap-3"><h3 id="contact-result-title" className="text-lg font-bold">这次约好了吗？</h3><button autoFocus aria-label="关闭联系结果" onClick={() => setShowResult(false)} className="rounded-full bg-slate-100 p-2 text-slate-500"><X size={18}/></button></header>{confirmedChoice ? <><label className="block text-sm">具体时间（选填）<input value={appointmentAt} onChange={e => saveDraft(e.target.value)} maxLength={80} className="mt-1 w-full rounded border p-2" /></label><button onClick={() => submitResult('appointment_confirmed')} className="w-full rounded-xl bg-blue-600 p-3 text-white">确认约好了</button><button onClick={() => setConfirmedChoice(false)} className="w-full p-2 text-sm">返回选择</button></> : <div className="grid grid-cols-2 gap-2"><button onClick={() => setConfirmedChoice(true)} className="rounded-xl bg-blue-600 p-3 text-white">约好了</button><button onClick={() => submitResult('not_appointed')} className="rounded-xl border p-3">还没约好</button></div>}{feedback && <p role="status" className="text-sm text-rose-600">{feedback}</p>}</section></div> : null;
  const actionBar = selected && !showResult && (canHandle || ['待处理', '拨号待确认'].includes(selected.state) || (selected.state === '已处理' && !selected.familyContactResult)) ? <div data-service-assistance-actions className="absolute inset-x-0 bottom-16 z-30 space-y-2 border-t border-slate-100 bg-white px-4 pt-4 pb-4 shadow-sm">        {selected.state === '已处理' && !selected.familyContactResult && <button onClick={() => { syncSharedRecords(); const current = records.find(item => item.id === selectedId); if (!current || current.state !== '已处理') return; upsertSharedServiceAssistanceRecord(current); confirmSharedFamilyHandlingCompletion(current.id, currentHandler); syncSharedRecords(); }} className="w-full rounded-xl bg-blue-600 p-3 text-white">确认处理完成</button>}
        {selected.state === '家人处理完成' && <p role="status" className="text-sm text-emerald-700">{selected.review ? `老人已评价：${selected.review.rating} 星` : '家人处理完成'}</p>}
        {selected.state === '拨号待确认' && <button onClick={askElder} disabled={Boolean(selected.familyHelpInquiry)} className="w-full rounded-xl bg-blue-600 p-3 text-white disabled:bg-slate-200 disabled:text-slate-500">{selected.familyHelpInquiry ? '已询问老人，等待答复' : '问问老人约好了吗'}</button>}
        {selected.state === '待处理' && <a onClick={beginContact} href={`tel:${selected.provider.phone.replace(/\s/g, '')}`} className="block w-full rounded-xl bg-blue-600 p-3 text-center text-white">打电话帮忙约</a>}
        {canHandle && !showResult && <button onClick={() => { setShowResult(true); setConfirmedChoice(false); }} className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white">确认联系结果</button>}
        {canHandle && <a onClick={beginContact} href={`tel:${selected.provider.phone.replace(/\s/g, '')}`} className="flex min-h-11 items-center justify-center text-sm text-blue-600">再次拨打服务商电话</a>}
</div> : null;
  return <>
    {<section aria-label="服务协助记录" className={`space-y-4 ${selected ? 'pb-40' : ''}`}>
      {selected && <header className="flex items-center gap-2">{selected && <button aria-label="返回" onClick={() => setSelectedId(null)} className="p-3"><ArrowLeft size={18}/></button>}<h2 className="font-bold">{selected ? '服务协助详情' : '服务协助记录'}</h2></header>}
      {!selected ? <div className="space-y-3">{items.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">暂无老人发起的服务协助事项</p>}{items.map(item => <button key={item.id} onClick={() => {setSelectedId(item.id); setShowHistory(false); setFeedback(''); setAppointmentAt(readDraft(item.id).appointmentAt ?? item.appointmentAt ?? ''); setShowResult(false); setConfirmedChoice(false); callReturn.current = null;}} className="w-full space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-left"><span className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-slate-800">{item.elder.name}<span className="ml-2 text-xs font-normal text-slate-500">{isFamilyAssistanceRecord(item) ? '请家人帮忙' : '联系动态'}</span></span><StatusBadge state={item.state}/></span><span className="block pt-2 text-base font-bold leading-6 text-slate-900">联系{item.service.name}服务</span><p className="text-xs leading-5 text-slate-500">{recordDescription(item)}</p><div className="mt-3 space-y-1 border-t border-slate-100 pt-3"><p className="text-xs leading-5 text-slate-500">{item.provider.name}</p><p className="text-[11px] text-slate-400">{formatTime(item.requestedAt)} 发起</p></div></button>)}</div> : <div className="space-y-4">
        <section className="space-y-3 px-1 py-2"><h3 className="text-xl font-bold leading-8 text-slate-900">{taskTitle}</h3><p className="text-sm font-semibold text-blue-600">{selected.service.name}</p>{taskReason && <p className="text-sm leading-6 text-slate-600">{taskReason}</p>}{selected.appointmentAt && <p className="text-sm font-medium text-emerald-700">约定时间：{selected.appointmentAt}</p>}{selected.feeText && <p className="text-xs text-slate-500">历史费用：{selected.feeText}</p>}</section>
        <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4"><h3 className="text-xs font-medium text-slate-500">联系这家服务商</h3><p className="text-base font-semibold text-slate-900">{selected.provider.name}</p><p className="text-sm text-slate-600">{selected.provider.phone}</p></section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-bold">联系记录</h3><button onClick={() => setShowHistory(value => !value)} aria-expanded={showHistory} className="text-xs text-blue-600">{showHistory ? '收起' : '查看全部'}</button></div><ol className="ml-1 border-l border-slate-200">{[
          ...(selected.workflowEvents?.length ? selected.workflowEvents.map((event: { type: string; actorName?: string; createdAt: string }) => ({ title: eventTitle(event), time: event.createdAt })) : [{ title: selected.contactStartedAt ? '老人发起联系' : '老人发起协助', time: selected.requestedAt }]),
          ...(selected.reminderTimes || []).map((time: string) => ({ title: '老人再次提醒家人', time })),
          ...(!selected.workflowEvents?.length && selected.claimedAt ? [{ title: `${selected.handledBy || '家人'}开始帮忙联系`, time: selected.claimedAt }] : []),
          ...(['已处理', '家人处理完成', '已取消'].includes(selected.state) && selected.handledAt ? [{ title: selected.state !== '已取消' ? '提交处理结果' : '协助事项已取消', time: selected.handledAt }] : []),
          ...(selected.handlingCompletedAt ? [{ title: '家人处理完成于', time: selected.handlingCompletedAt }] : []),
          ...(selected.state === '已失效' && selected.expiredAt ? [{ title: '满48小时未处理，已失效', time: selected.expiredAt }] : [])
        ].sort((a,b) => Date.parse(b.time) - Date.parse(a.time)).filter((_, index) => showHistory || index === 0).map((event,index) => <li key={`${event.title}-${index}`} className="relative pb-5 pl-5 last:pb-0"><span className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-blue-500"/><p className="text-sm text-slate-700">{event.title}</p><p className="mt-1 text-xs text-slate-400">{formatTime(event.time)}</p></li>)}</ol></section>

        {feedback && <p role="status" className="text-sm text-slate-600">{feedback}</p>}
      </div>}
    </section>}
    {actionBar && (document.getElementById('h5-phone-screen') ? createPortal(actionBar, document.getElementById('h5-phone-screen')!) : actionBar)}
    {resultPanel && (document.getElementById('h5-phone-screen') ? createPortal(resultPanel, document.getElementById('h5-phone-screen')!) : resultPanel)}
  </>;
}
