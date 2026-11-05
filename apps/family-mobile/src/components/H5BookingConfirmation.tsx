import { initialServiceAssistanceRecords } from '../../../elder-miniapp/src/appointmentData';
import { confirmSharedFamilyHandlingCompletion, upsertSharedServiceAssistanceRecord, normalizeServiceAssistanceRecord, serviceAssistanceExpiryMessage, readSharedServiceAssistanceRecords, subscribeSharedServiceAssistanceRecords, updateSharedServiceAssistanceRecord } from '../../../产品理解/90 原型与Mock素材/mock/服务协助记录共享Mock.js';
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { ArrowLeft } from 'lucide-react';

const formatTime = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '时间暂不可用' : new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(date); };

type Status = '家人处理完成' | '已失效' | '待处理' | '处理中' | '已处理' | '已取消';
const toStatus = (record: { status: string; familyHandlingStatus?: string }) => (
  record.familyHandlingStatus === 'completed' ? '家人处理完成' : record.status === 'expired' ? '已失效' : record.status === 'cancelled' ? '已取消'
    : record.status === 'handling' ? '处理中'
      : record.status === 'handled' ? '已处理'
        : '待处理'
) as Status;
const statusStyle: Record<Status, string> = { '家人处理完成': 'bg-emerald-50 text-emerald-700', '已失效': 'bg-slate-100 text-slate-500', '待处理': 'bg-amber-50 text-amber-700', '处理中': 'bg-blue-50 text-blue-600', '已处理': 'bg-emerald-50 text-emerald-700', '已取消': 'bg-slate-100 text-slate-500' };
const StatusBadge = ({ state }: { state: Status }) => <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle[state]}`}>{state === '待处理' ? '待家人处理' : state}</span>;
const pendingExample = { ...initialServiceAssistanceRecords[0], id: 'HELP-CHILD-PREVIEW-20261105', requestedAt: new Date().toISOString() };
export function addPendingServiceAssistanceExample() {
  upsertSharedServiceAssistanceRecord({ ...pendingExample, id: `HELP-PREVIEW-${Date.now()}`, requestedAt: new Date().toISOString() });
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
  const count = items.filter(item => item.state === '待处理').length;
  return count > 0 ? <span aria-label={`${count}条待处理协助`} className="rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-4 text-white">{count}</span> : null;
}
export function H5BookingConfirmation({ visible, inline = false }: { visible: boolean; resetSignal: number; inline?: boolean }) {
  const items = useSyncExternalStore(subscribe, snapshot);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState('');
  const selected = items.find(item => item.id === selectedId);
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
  const update = (state: Status) => {
    syncSharedRecords();
    const current = records.find(item => item.id === selectedId);
    if (!current || ['已失效', '已处理', '家人处理完成', '已取消'].includes(current.state)) return;
    if (current.state === '处理中' && current.handledBy !== currentHandler) return;
    if (state !== '处理中' && current.state !== '处理中') return;
    const handledAt = new Date().toISOString();
    const resultSummary = state === '已处理' ? note.trim() : null;
    const claimedAt = current.claimedAt || (state === '处理中' ? handledAt : undefined);
    if (state === '已处理' && !resultSummary) return;
    records = records.map(item => {
      if (item.id !== selectedId || ['已处理', '已取消'].includes(item.state)) return item;
      if (item.state === '处理中' && item.handledBy !== currentHandler) return item;
      if (state !== '处理中' && item.state !== '处理中') return item;
      return { ...item, state, handledBy: currentHandler, claimedAt, handledAt, resultSummary };
    });
    if (selectedId) {
      upsertSharedServiceAssistanceRecord(current);
      updateSharedServiceAssistanceRecord(selectedId, {
        status: state === '处理中' ? 'handling' : state === '已取消' ? 'cancelled' : 'handled',
        handledBy: currentHandler,
        claimedAt,
        handledAt,
        resultSummary,
      });
    }
    setEditing(false);
    listeners.forEach(listener => listener());
  };
  if (!visible) return null;
  const canHandle = selected?.state === '处理中' && selected.handledBy === currentHandler;
  return <>
    {<section aria-label="服务协助记录" className="space-y-4">
      {selected && <header className="flex items-center gap-2">{selected && <button aria-label="返回" onClick={() => setSelectedId(null)} className="p-3"><ArrowLeft size={18}/></button>}<h2 className="font-bold">{selected ? '服务协助详情' : '服务协助记录'}</h2></header>}
      {!selected ? <div className="space-y-3">{items.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">暂无老人发起的服务协助事项</p>}{items.map(item => <button key={item.id} onClick={() => {setSelectedId(item.id); setNote(''); setEditing(false);}} className="w-full space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-left"><span className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-slate-800">{item.elder.name}<span className="ml-2 text-xs font-normal text-slate-500">请家人帮忙</span></span><StatusBadge state={item.state}/></span><span className="block pt-2 text-base font-bold leading-6 text-slate-900">联系{item.service.name}服务</span><p className="text-xs leading-5 text-slate-500">{item.state === '已失效' ? serviceAssistanceExpiryMessage : item.state === '已取消' ? '该协助事项已取消' : item.resultSummary ? `处理结果：${item.resultSummary}` : '请联系服务商并反馈联系结果'}</p><div className="mt-3 space-y-1 border-t border-slate-100 pt-3"><p className="text-xs leading-5 text-slate-500">{item.provider.name}</p><p className="text-[11px] text-slate-400">{formatTime(item.requestedAt)} 发起</p></div></button>)}</div> : <div className="space-y-4">
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">{selected.elder.name}请家人帮忙</span><StatusBadge state={selected.state}/></div><h3 className="text-lg font-bold leading-7">联系{selected.service.name}服务</h3><p className="text-sm text-slate-600">老人请求：{selected.requestReason || '请家人协助联系服务商'}</p><p className="text-sm">服务商：{selected.provider.name}</p><p className="text-sm">电话：{selected.provider.phone}</p><p className="text-xs text-slate-500">请求时间：{formatTime(selected.requestedAt)}</p>{selected.state === '已失效' && <p role="status" className="text-sm text-slate-500">{serviceAssistanceExpiryMessage}</p>}{selected.state === '已取消' && <p role="status" className="text-sm text-slate-600">该协助事项已取消</p>}{selected.handledBy && <p className="text-sm">处理家人：{selected.handledBy}</p>}{selected.resultSummary && <p className="text-sm">处理结果：{selected.resultSummary}</p>}</section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="mb-4 text-sm font-bold">处理进度</h3><ol className="ml-1 border-l border-slate-200">{[
          { title: '老人发起协助', time: selected.requestedAt },
          ...(selected.reminderTimes || []).map((time: string) => ({ title: '老人再次提醒家人', time })),
          ...(selected.claimedAt ? [{ title: `${selected.handledBy || '家人'}接手处理`, time: selected.claimedAt }] : []),
          ...(['已处理', '家人处理完成', '已取消'].includes(selected.state) && selected.handledAt ? [{ title: selected.state !== '已取消' ? '提交处理结果' : '协助事项已取消', time: selected.handledAt }] : []),
          ...(selected.handlingCompletedAt ? [{ title: '家人处理完成于', time: selected.handlingCompletedAt }] : []),
          ...(selected.state === '已失效' && selected.expiredAt ? [{ title: '满48小时未处理，已失效', time: selected.expiredAt }] : [])
        ].sort((a,b) => Date.parse(a.time) - Date.parse(b.time)).map((event,index) => <li key={`${event.title}-${index}`} className="relative pb-5 pl-5 last:pb-0"><span className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-blue-500"/><p className="text-sm text-slate-700">{event.title}</p><p className="mt-1 text-xs text-slate-400">{formatTime(event.time)}</p></li>)}</ol></section>
        {selected.state === '已处理' && <button onClick={() => { syncSharedRecords(); const current = records.find(item => item.id === selectedId); if (!current || current.state !== '已处理') return; upsertSharedServiceAssistanceRecord(current); confirmSharedFamilyHandlingCompletion(current.id, currentHandler); syncSharedRecords(); }} className="w-full rounded-xl bg-blue-600 p-3 text-white">确认处理完成</button>}
        {selected.state === '家人处理完成' && <p role="status" className="text-sm text-emerald-700">{selected.review ? `老人已评价：${selected.review.rating} 星` : '家人处理完成'}</p>}
        {selected.state === '待处理' && <button onClick={() => update('处理中')} className="w-full rounded-xl bg-blue-600 p-3 text-white">接手此事项</button>}
        {canHandle && <><div className="grid grid-cols-2 gap-3"><a className="rounded-xl bg-white p-3 text-center text-blue-600" href={`tel:${selected.provider.phone.replace(/\s/g,'')}`}>联系服务商</a><a className="rounded-xl bg-white p-3 text-center text-blue-600" href={`tel:${selected.elder.phone.replace(/\s/g,'')}`}>联系老人</a></div><button onClick={() => setEditing(true)} className="w-full rounded-xl bg-blue-600 p-3 text-white">填写处理结果</button>{editing && <><label className="block text-sm">处理结果<textarea value={note} onChange={e => setNote(e.target.value)} maxLength={300} rows={3} className="mt-2 w-full rounded-xl border p-3" /></label><div className="grid grid-cols-2 gap-3"><button onClick={() => {setEditing(false); setNote('');}} className="rounded-xl border p-3">暂不填写</button><button disabled={!note.trim()} onClick={() => update('已处理')} className="rounded-xl bg-blue-600 p-3 text-white disabled:opacity-40">提交结果</button></div></>}<button onClick={() => update('已取消')} className="w-full p-3 text-sm text-slate-500">取消事项</button></>}
        {selected.state === '处理中' && !canHandle && <p className="text-sm text-slate-500">家人正在处理，请等待处理结果。</p>}
      </div>}
    </section>}
  </>;
}
