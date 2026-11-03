import React, { useState } from 'react';
import { MapPin, RefreshCw, ShieldOff, X } from 'lucide-react';

export type PhoneLocationScenario = 'latest' | 'last' | 'unshared' | 'empty';

export function H5ElderLocationSheet({ name, scenario, onClose }: { name: string; scenario: PhoneLocationScenario; onClose: () => void }) {
  const [checked, setChecked] = useState(false);
  const hasLocation = scenario === 'latest' || scenario === 'last';
  const place = name === '张健康' ? '红山社区活动室附近' : '大巴窑社区花园附近';
  const reportedAt = scenario === 'last' ? '11月2日 16:30' : '11月3日 09:35';
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-slate-50" role="dialog" aria-modal="true" aria-label={`${name}的位置`} onKeyDown={event => { if (event.key === 'Escape') onClose(); }}>
      <header className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-4">
        <div><h2 className="text-base font-bold text-slate-900">{name}的位置</h2><p className="mt-1 text-xs text-slate-500">老人手机共享的位置</p></div>
        <button autoFocus type="button" onClick={onClose} aria-label="关闭位置" className="rounded-full bg-slate-100 p-2 text-slate-500"><X size={20} /></button>
      </header>
      <div className="min-h-0 flex flex-1 flex-col overflow-y-auto p-4">
        {hasLocation ? <div className="relative flex min-h-[390px] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#eef2f0]">
          <div role="img" aria-label={`${place}，位置示意地图`} className="relative min-h-64 flex-1 overflow-hidden">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 340 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <rect width="340" height="400" fill="#eef2f0" />
              <path d="M285 -20 Q240 100 300 220 T280 420" fill="none" stroke="#c9e5ef" strokeWidth="36" />
              <rect x="105" y="118" width="114" height="100" rx="20" fill="#cce6d4" />
              <path d="M115 192 Q155 140 205 155" fill="none" stroke="#eaf5e9" strokeWidth="7" />
              <g fill="#dde3e5" stroke="#d4dcdf"><rect x="8" y="27" width="45" height="42" rx="5" /><rect x="105" y="26" width="50" height="50" rx="5" /><rect x="172" y="35" width="44" height="32" rx="5" /><rect x="12" y="131" width="38" height="65" rx="5" /><rect x="10" y="267" width="42" height="62" rx="5" /><rect x="110" y="271" width="45" height="40" rx="5" /><rect x="173" y="270" width="44" height="58" rx="5" /><rect x="113" y="360" width="100" height="30" rx="5" /></g>
              <path d="M75 0V400M240 0V400M0 96H340M0 241H340M0 346H340" stroke="#dbe2e4" strokeWidth="22" /><path d="M75 0V400M240 0V400M0 96H340M0 241H340M0 346H340" stroke="white" strokeWidth="18" />
              <g fill="#8b9a98" fontSize="10" textAnchor="middle"><text x="160" y="204">社区绿地</text><text x="157" y="300">住宅区</text><text x="157" y="59">社区设施</text></g>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pb-8">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border border-blue-400/25 bg-blue-500/10">
                <div className="flex flex-col items-center"><span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm">{name}</span><span className="mt-2 rounded-full border-4 border-white bg-blue-600 p-3 text-white shadow-lg shadow-blue-600/25"><MapPin size={26} /></span><span className="mt-1 h-2 w-2 rounded-full bg-blue-600 ring-4 ring-white" /></div>
              </div>
            </div>
            <span className="absolute right-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-[10px] text-slate-500">位置示意 · 非实时地图</span>
          </div>
          <section className="relative shrink-0 rounded-t-2xl border-t border-slate-100 bg-white p-4 shadow-[0_-4px_16px_rgba(15,23,42,0.04)]">
            <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${scenario === 'last' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>{scenario === 'last' ? '上次位置' : '最近上报位置'}</span>
            <h3 className="mt-3 text-base font-bold text-slate-900">{place}</h3><p className="mt-2 text-xs text-slate-500">上报于 {reportedAt}</p>
            {scenario === 'last' && <p className="mt-2 text-xs text-amber-700">暂未收到新的位置</p>}
          </section>
        </div> : <section className="flex min-h-72 flex-1 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <span className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400">{scenario === 'unshared' ? <ShieldOff size={28} /> : <MapPin size={28} />}</span>
          <h3 className="text-base font-bold text-slate-900">{scenario === 'unshared' ? '老人暂未共享位置' : '暂无位置记录'}</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{scenario === 'unshared' ? '老人开启位置共享后，可在这里查看。' : '已开启共享，等待老人手机上报位置。'}</p>
        </section>}
      </div>
      <footer className="shrink-0 border-t border-slate-100 bg-white p-4"><button type="button" onClick={() => setChecked(true)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white"><RefreshCw size={16} />{checked ? '已刷新' : '刷新位置'}</button></footer>
    </div>
  );
}
