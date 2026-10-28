import React from 'react';
import { ArrowLeft, ChevronRight, Headphones, Check, Clock3, CheckCircle2 } from 'lucide-react';
import { AssistanceEvent, assistanceStatusLabels, assistanceProgress, assistanceUpdateTime, sortAssistanceEvents } from '../data/onlineAssistance';

const time = (value: string) => new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Singapore', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
interface Props {
  events: AssistanceEvent[];
  elderName: string;
  isViewed: (id: string) => boolean;
  onOpen: (id: string) => void;
}
const EventCard: React.FC<{ event: AssistanceEvent; viewed: boolean; onOpen: () => void }> = ({ event, viewed, onOpen }) => (
  <button type="button" onClick={onOpen} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs">
    <span className="flex items-center justify-between gap-2"><strong className="text-sm text-slate-900">{event.elderName} · 在线协助</strong><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${event.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : event.status === 'waiting' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{assistanceStatusLabels[event.status]}</span></span>
    <span className="mt-2 block text-xs leading-relaxed text-slate-600">{assistanceProgress(event)}</span>
    <span className="mt-1 block text-[10px] text-slate-400">更新于 {time(assistanceUpdateTime(event))}</span>
    <span className="mt-3 flex items-center justify-between text-[10px] text-slate-500"><span>发起于 {time(event.startedAt)}</span><span className={`flex items-center gap-1 ${viewed ? '' : 'font-bold text-blue-600'}`}>{viewed ? '已查看' : <><span className="h-1.5 w-1.5 rounded-full bg-rose-500" />未读</>}<ChevronRight size={14} /></span></span>
  </button>
);
export function AssistanceHomeSummary({ events, elderName, isViewed, onOpen, onList }: Props & { onList: () => void }) {
  const ongoing = sortAssistanceEvents(events.filter(event => event.status !== 'completed'));
  const latest = ongoing[0];
  if (!latest) return null;
  const multiple = ongoing.length > 1;
  const unread = ongoing.some(event => !isViewed(event.id));
  return <button type="button" aria-label={`在线协助，${multiple ? `进行中 ${ongoing.length} 条` : assistanceStatusLabels[latest.status]}，${multiple ? '查看全部' : '查看进度'}`} onClick={() => multiple ? onList() : onOpen(latest.id)} className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-xs transition-colors hover:border-blue-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" >
    <span className="flex items-center gap-2 px-5 pt-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Headphones size={15} /></span><strong className="text-base font-extrabold text-slate-900">在线协助</strong>{unread && <span aria-label="有未读进展" className="h-1.5 w-1.5 rounded-full bg-rose-500" />}<span className={`ml-auto shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${latest.status === 'waiting' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>{multiple ? `进行中 ${ongoing.length} 条` : assistanceStatusLabels[latest.status]}</span></span>
    <span className="mx-5 mb-3 mt-3 block"><span className="mb-1 block text-xs font-semibold text-slate-800">{elderName}{multiple && ` · ${assistanceStatusLabels[latest.status]}`}</span><span className="block text-xs leading-relaxed text-slate-600">{assistanceProgress(latest)}</span></span>
    <span className="mx-5 flex items-center justify-between gap-2 border-t border-slate-100 py-3 text-[10px] text-slate-400"><span>{time(assistanceUpdateTime(latest))} 更新{multiple && ` · 另有 ${ongoing.length - 1} 条`}</span><span className="flex shrink-0 items-center gap-0.5 font-bold text-blue-600">{multiple ? '查看全部' : '查看进度'}<ChevronRight size={13} /></span></span>
  </button>;
}
export function AssistanceNoticeEntry({ events, elderName, isViewed, onOpen, onList }: Props & { onList: () => void }) {
  return <section className="mb-4 space-y-2" aria-label="在线协助消息">
    {events.filter(event => event.notificationAvailable).map(event => <EventCard key={event.id} event={event} viewed={isViewed(event.id)} onOpen={() => onOpen(event.id)} />)}
  </section>;
}
export function H5OnlineAssistance({ events, elderName, isViewed, onOpen, selectedId, onBack, backLabel }: Props & { selectedId: string | null; backLabel: string; onBack: () => void }) {
  const selected = events.find(event => event.id === selectedId);
  return <div className="space-y-4 p-4 pb-8">
    <div className="flex items-center gap-2"><button type="button" onClick={onBack} aria-label={backLabel} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600"><ArrowLeft size={18} /></button><h2 className="text-base font-bold">{selectedId ? '处理进度' : '协助记录'}</h2></div>
    {selectedId ? selected ? <>
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${selected.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : selected.status === 'waiting' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{selected.status === 'completed' ? <CheckCircle2 size={25} /> : selected.status === 'waiting' ? <Clock3 size={25} /> : <Headphones size={25} />}</span>
          <div><h3 className="text-xl font-extrabold text-slate-900">{selected.status === 'processing' ? '正在处理' : assistanceStatusLabels[selected.status]}</h3><p className="mt-1 text-xs text-slate-500">{selected.elderName} · 在线协助</p></div>
        </div>
        <h3 className="mb-5 mt-7 text-sm font-bold text-slate-900">处理进度</h3>
        <ol aria-label="在线协助处理进度">
          {([
            { title: '已发起', done: true, current: false, detail: selected.summary, at: selected.startedAt },
            { title: selected.status === 'waiting' ? '等待接听' : '呼叫中心处理', done: selected.status === 'completed', current: selected.status !== 'completed', detail: selected.status === 'processing' ? assistanceProgress(selected) : '', at: selected.status === 'processing' ? selected.updatedAt : undefined },
            { title: '处理完成', done: selected.status === 'completed', current: false, detail: selected.status === 'completed' ? selected.result : '', at: selected.completedAt }
          ]).map((step, index) => <li key={index} aria-current={step.current ? 'step' : undefined} className="relative flex gap-3 pb-6 last:pb-0">
            {index < 2 && <span aria-hidden="true" className={`absolute bottom-0 left-[11px] top-6 w-0.5 ${step.done && (index === 0 ? selected.status !== 'waiting' : selected.status === 'completed') ? 'bg-blue-200' : 'bg-slate-100'}`} />}
            <span aria-hidden="true" className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${step.done ? 'bg-blue-600 text-white' : step.current ? 'border-2 border-blue-600 bg-blue-50 ring-4 ring-blue-50' : 'border-2 border-slate-200 bg-white'}`}>{step.done ? <Check size={13} /> : step.current ? <span className="h-2 w-2 rounded-full bg-blue-600" /> : null}</span>
            <div className="min-w-0 flex-1 pt-0.5"><div className="flex items-center justify-between gap-2"><strong className={`text-sm ${step.done || step.current ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</strong>{step.current && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">当前</span>}</div>
              {step.at && <p className="mt-1 text-[10px] text-slate-400">{time(step.at)}{step.current ? ' 更新' : ''}</p>}
              {step.detail && <p className={`mt-2 text-xs leading-relaxed ${step.current ? 'rounded-xl bg-blue-50 p-3 text-blue-800' : 'text-slate-500'}`}>{step.detail}</p>}
              {index === 2 && selected.status === 'completed' && selected.remarks && <p className="mt-2 text-xs leading-relaxed text-slate-500">{selected.remarks}</p>}
            </div>
          </li>)}
        </ol>
      </section>
      <details key={selected.id} className="rounded-2xl border border-slate-200 bg-white text-xs text-slate-500">
        <summary className="cursor-pointer px-4 py-4 font-semibold text-slate-600">事件信息</summary>
        <dl className="space-y-3 border-t border-slate-100 p-4">{[['事件编号', selected.id], ['发起方式', '老人中控屏']].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt>{label}</dt><dd className="text-right text-slate-700">{value}</dd></div>)}</dl>
      </details>
    </> : <p className="rounded-xl bg-white p-5 text-sm text-slate-500">当前家人暂无此事件，请返回列表查看。</p> : <>
      <p className="text-xs text-slate-500">{elderName}的在线协助记录 · 由呼叫中心处理</p>
      {events.length ? sortAssistanceEvents(events).map(event => <EventCard key={event.id} event={event} viewed={isViewed(event.id)} onOpen={() => onOpen(event.id)} />) : <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">暂无在线协助记录</p>}
    </>}
  </div>;
}
