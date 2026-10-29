import React, { useEffect, useState } from 'react';
import { ArrowLeft, CalendarCheck, ChevronRight } from 'lucide-react';

type Result = 'success' | 'pending';
type Notice = { id: string; elder: string; service: string; supplier: string; calledAt: string; read: boolean; result?: Result; date?: string; note?: string; failOnce?: boolean; receipts?: { elder: { result: Result; date: string; note: string }; admin: { result: Result; date: string; note: string } } };
const initialNotices = (): Notice[] => [
  { id: 'call-1', elder: '张健康', service: '上门理疗', supplier: '社区康复服务中心', calledAt: '10/29 09:30', read: false },
  { id: 'call-2', elder: '李惠兰', service: '居家保洁', supplier: '安心居家服务', calledAt: '10/29 10:15', read: false, failOnce: true }
];

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
  const unread = notices.filter(item => !item.read).length;
  const open = (item: Notice) => {
    setSelectedId(item.id); setChoice(item.result ?? null); setDate(item.date ?? ''); setNote(item.note ?? ''); setError('');
    setNotices(items => items.map(value => value.id === item.id ? { ...value, read: true } : value)); setPage('detail');
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || selected.result || !choice) return;
    if (selected.failOnce) {
      setNotices(items => items.map(item => item.id === selected.id ? { ...item, failOnce: false } : item));
      setError('提交失败，内容已保留，请重试。'); return;
    }
    setNotices(items => items.map(item => item.id === selected.id && !item.result ? { ...item, result: choice, date: choice === 'success' ? date : '', note: note.trim(), receipts: { elder: { result: choice, date: choice === 'success' ? date : '', note: note.trim() }, admin: { result: choice, date: choice === 'success' ? date : '', note: note.trim() } } } : item));
    setError('');
  };
  if (!visible) return null;
  return <>
    <button type="button" onClick={() => setPage('list')} className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left text-xs font-bold text-slate-800"><CalendarCheck size={18} className="text-blue-600" /><span className="flex-1">服务预约确认</span>{unread > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-white">{unread}条未读</span>}<ChevronRight size={16} /></button>
    {page !== 'closed' && <section aria-label="服务预约确认" className="absolute inset-0 z-40 overflow-y-auto bg-slate-50 p-4">
      <header className="mb-4 flex items-center gap-2"><button type="button" aria-label={page === 'detail' ? '返回预约通知列表' : '返回家庭留言'} onClick={() => setPage(page === 'detail' ? 'list' : 'closed')} className="flex h-11 w-11 items-center justify-center rounded-full bg-white"><ArrowLeft size={18} /></button><h2 className="text-base font-bold">{page === 'detail' ? '确认预约结果' : '服务预约通知'}</h2></header>
      {page === 'list' ? <div className="space-y-3">{notices.map(item => <button key={item.id} type="button" onClick={() => open(item)} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left"><span className="flex items-center justify-between gap-2"><strong className="text-sm">{item.elder} · {item.service}</strong><span className="text-xs text-blue-600">{item.result ? '已处理' : '待确认'}{!item.read && ' · 未读'}</span></span><span className="mt-2 block text-xs text-slate-500">{item.supplier} · {item.calledAt} 拨打</span></button>)}</div> : selected && <form onSubmit={submit} className="space-y-4">
        <section className="space-y-2 rounded-2xl bg-white p-4"><h3 className="font-bold">{selected.elder} · {selected.service}</h3><p className="text-sm text-slate-600">{selected.supplier}</p><p className="text-xs text-slate-500">拨打时间：{selected.calledAt}</p></section>
        {selected.result ? <section role="status" className="space-y-3 rounded-2xl bg-white p-4"><h3 className="font-bold text-blue-600">{selected.result === 'success' ? '已预约成功' : '暂未预约成功'}</h3>{selected.date && <p className="text-sm">预约时间：{selected.date.replace('T', ' ')}</p>}{selected.note && <p className="break-words text-sm text-slate-600">{selected.note}</p>}<p className="text-xs text-slate-500">结果已记录</p>{selected.receipts && <p className="text-xs text-slate-500">已同步给老人 · 服务记录已更新</p>}</section> : <>
          <fieldset className="space-y-2"><legend className="mb-2 text-sm font-bold">老人是否已经预约成功？</legend>{(['success', 'pending'] as const).map(value => <label key={value} className={`flex min-h-12 items-center gap-3 rounded-xl border p-3 text-sm ${choice === value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white'}`}><input type="radio" name="booking-result" checked={choice === value} onChange={() => setChoice(value)} />{value === 'success' ? '已预约成功' : '暂未预约成功'}</label>)}</fieldset>
          {choice === 'success' && <label className="block text-sm font-semibold">预约日期时间（选填）<input type="datetime-local" value={date} onChange={event => setDate(event.target.value)} className="mt-2 block w-full min-w-0 rounded-xl border border-slate-200 bg-white p-3" /></label>}
          {choice && <label className="block text-sm font-semibold">{choice === 'success' ? '备注（选填）' : '原因或后续安排（选填）'}<textarea maxLength={120} value={note} onChange={event => setNote(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-200 bg-white p-3 font-normal" rows={3} /></label>}
          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
          <button disabled={!choice} className="min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:bg-slate-200">{error ? '重试提交' : '确认结果'}</button>
        </>}
      </form>}
    </section>}
  </>;
}
