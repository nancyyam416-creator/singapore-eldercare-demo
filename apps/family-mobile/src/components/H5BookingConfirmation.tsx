import { appointmentServices, initialServiceAssistanceRecords } from '../../../elder-miniapp/src/appointmentData';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, CalendarCheck, ChevronRight } from 'lucide-react';

type Result = 'success' | 'pending';
type Notice = { id: string; elder: string; service: string; supplier: string; calledAt: string; read: boolean; phone: string; elderPhone: string; handler?: string; completedAt: string | null; review: { rating: number; text: string; submittedAt: string } | null; result?: Result; date?: string; note?: string; failOnce?: boolean; receipts?: { elder: { result: Result; date: string; note: string }; admin: { result: Result; date: string; note: string } } };
const initialNotices = (): Notice[] => initialServiceAssistanceRecords.map(record => ({
  id: record.id, elder: record.elder.name, service: record.service.name, supplier: record.provider.name,
  calledAt: record.requestedAt, read: false, result: record.status === 'handled' ? 'success' : undefined,
  date: record.handledAt ?? undefined, note: record.resultSummary ?? undefined,
  phone: record.provider.phone, elderPhone: record.elder.phone, handler: record.handledBy ?? undefined,
  completedAt: record.completedAt, review: record.review
}));

export function H5BookingConfirmation({ visible, resetSignal }: { visible: boolean; resetSignal: number }) {
  const [notices, setNotices] = useState(initialNotices);
  const [page, setPage] = useState<'closed' | 'list' | 'detail'>('closed');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [choice, setChoice] = useState<Result | null>(null);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { setNotices(initialNotices()); setPage('closed'); }, [resetSignal]);
  useEffect(() => { if (!visible) setPage('closed'); }, [visible]);
  const selected = notices.find(item => item.id === selectedId);
  const unread = notices.filter(item => !item.result).length;
  const open = (item: Notice) => {
    setSelectedId(item.id); setChoice(item.result ?? 'success'); setDate(item.date ?? ''); setNote(item.note ?? ''); setError('');
    setNotices(items => items.map(value => value.id === item.id ? { ...value, read: true } : value)); setPage('detail');
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || selected.result || !choice) return;
    if (selected.failOnce) {
      setNotices(items => items.map(item => item.id === selected.id ? { ...item, failOnce: false } : item));
      setError('提交失败，内容已保留，请重试。'); return;
    }
    setNotices(items => items.map(item => item.id === selected.id && !item.result ? { ...item, handler: '张女士', result: choice, date: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Singapore' }), note: note.trim(), receipts: { elder: { result: choice, date: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Singapore' }), note: note.trim() }, admin: { result: choice, date: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Singapore' }), note: note.trim() } } } : item));
    setError('');
  };
  if (!visible) return null;
  return <>
    <button type="button" onClick={() => setPage('list')} className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left text-xs font-bold text-slate-800"><CalendarCheck size={18} className="text-blue-600" /><span className="flex-1">家人协助</span>{unread > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-white">{unread}条待处理</span>}<ChevronRight size={16} /></button>
    {page !== 'closed' && <section aria-label="家人协助" className="absolute inset-0 z-40 overflow-y-auto bg-slate-50 p-4">
      <header className="mb-4 flex items-center gap-2"><button type="button" aria-label={page === 'detail' ? '返回协助列表' : '返回家庭留言'} onClick={() => setPage(page === 'detail' ? 'list' : 'closed')} className="flex h-11 w-11 items-center justify-center rounded-full bg-white"><ArrowLeft size={18} /></button><h2 className="text-base font-bold">{page === 'detail' ? '协助详情' : '家人协助'}</h2></header>
      {page === 'list' ? <div className="space-y-3">{notices.map(item => <button key={item.id} type="button" onClick={() => open(item)} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left"><span className="flex items-center justify-between gap-2"><strong className="text-sm">{item.elder} · {item.service}</strong><span className="text-xs text-blue-600">{item.result ? '已处理' : '待处理'}</span></span><span className="mt-2 block text-xs text-slate-500">{item.supplier} · {item.calledAt} 发起</span></button>)}</div> : selected && <form onSubmit={submit} className="space-y-4">
        <section className="space-y-2 rounded-2xl bg-white p-4"><h3 className="font-bold">{selected.elder} · {selected.service}</h3><p className="text-sm text-slate-600">{selected.supplier}</p><p className="text-sm text-slate-600">电话：{selected.phone}</p><p className="text-xs text-slate-500">老人请求：请家人帮忙</p><p className="text-xs text-slate-500">发起时间：{selected.calledAt}</p></section>
        {selected.result ? <section role="status" className="space-y-3 rounded-2xl bg-white p-4"><h3 className="font-bold text-blue-600">{selected.handler} 已处理</h3>{selected.date && <p className="text-sm">处理时间：{selected.date.replace('T', ' ')}</p>}{selected.note && <p className="break-words text-sm text-slate-600">{selected.note}</p>}<p className="text-xs text-slate-500">结果已记录</p>{selected.receipts && <p className="text-xs text-slate-500">家人可查看处理结果</p>}</section> : <>
          <div className="grid grid-cols-2 gap-3"><a href={`tel:${selected.elderPhone.replace(/\s/g, '')}`} className="rounded-xl bg-white p-3 text-center text-sm text-blue-600">联系老人</a><a href={`tel:${selected.phone.replace(/\s/g, '')}`} className="rounded-xl bg-white p-3 text-center text-sm text-blue-600">拨打服务商电话</a></div>
          <label className="block text-sm font-semibold">处理结果（选填）<textarea maxLength={120} value={note} onChange={event => setNote(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-200 bg-white p-3 font-normal" rows={3} /></label>
          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
          <button disabled={!choice} className="min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:bg-slate-200">{error ? '重试提交' : '已处理'}</button>
        </>}
        {selected.result && <section className="space-y-3 rounded-2xl bg-white p-4"><h3 className="font-bold">服务进度</h3><p className="text-sm">{selected.completedAt ? `服务完成 · ${selected.completedAt}` : '等待服务完成'}</p>{selected.review ? <div className="space-y-2"><p className="text-amber-600">{'★'.repeat(selected.review.rating)}{'☆'.repeat(5 - selected.review.rating)}</p><p className="break-words text-sm">{selected.review.text}</p><p className="text-xs text-slate-500">{selected.elder} · {selected.review.submittedAt}</p></div> : <p className="text-xs text-slate-500">暂无老人评价</p>}</section>}
      </form>}
    </section>}
  </>;
}
