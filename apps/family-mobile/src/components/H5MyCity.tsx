import React, { useState } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { familyCityCatalog, readFamilyCity, saveFamilyCity } from '../../../产品理解/90 原型与Mock素材/mock/家人城市共享';
import { mockApplicantId } from '../data/familyBinding';

export function H5MyCity({ onBack, scenario = 'actual' }: { onBack: () => void; scenario?: string; key?: number }) {
  const [saved, setSaved] = useState(() => scenario === 'actual' ? readFamilyCity(mockApplicantId) : ['shared', 'denied', 'failed'].includes(scenario) ? { ownerUserId: mockApplicantId, city: familyCityCatalog[1], source: 'child-manual' as const, updatedAt: new Date().toISOString(), sharing: true } : null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(scenario === 'denied' ? '未获得位置权限，可手动选择城市。' : scenario === 'failed' ? '城市识别失败，请重试或手动选择。' : '');
  const [view, setView] = useState<'overview' | 'select'>( ['denied', 'failed'].includes(scenario) ? 'select' : 'overview');
  const locate = () => {
    setMessage('');
    if (scenario !== 'actual') { if (scenario === 'denied' || scenario === 'failed') { setMessage(scenario === 'denied' ? '未获得位置权限，可手动选择城市。' : '城市识别失败，请重试或手动选择。'); } else { save(familyCityCatalog[0].id, 'child-location-confirmed'); } return; }
    if (!navigator.geolocation) { setMessage('当前浏览器不支持定位，请手动选择城市。'); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const params = new URLSearchParams({ latitude: coords.latitude.toFixed(2), longitude: coords.longitude.toFixed(2), localityLanguage: 'zh' });
        const response = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?' + params, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error();
        const data = await response.json();
        const names = [data.city, data.locality, data.countryName];
        const city = familyCityCatalog.find(c => [c.name, ...c.aliases].some(n => names.includes(n)));
        if (!city) { setMessage('暂未找到支持的城市，请手动搜索选择。'); return; }
        save(city.id, 'child-location-confirmed');
      } catch { setMessage('城市识别失败，请重试或手动选择。'); }
      finally { setBusy(false); }
    }, error => { setBusy(false); setMessage(error.code === 1 ? '未获得位置权限，可手动选择城市。' : '暂时无法获取位置，请重试或手动选择。'); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  };
  const cities = familyCityCatalog.filter(c => [c.name, c.country, ...c.aliases].some(n => n.toLowerCase().includes(query.trim().toLowerCase())));
  const save = (id: string, source: 'child-manual' | 'child-location-confirmed') => {
    try { setSaved(scenario === 'actual' ? saveFamilyCity(mockApplicantId, id, source) : { ownerUserId: mockApplicantId, city: familyCityCatalog.find(c => c.id === id) || null, source, updatedAt: new Date().toISOString(), sharing: Boolean(id) }); setView('overview'); setMessage(''); }
    catch { setMessage('保存失败，请重试。'); }
  };
  const openSelection = () => { setQuery(''); setMessage(''); setView('select'); };
  const back = () => { if (view === 'overview') onBack(); else { setMessage(''); setView('overview'); } };
  return <div className="min-h-full space-y-5 bg-slate-50 p-4 pb-8">
    <header className="flex items-center gap-3"><button disabled={busy} aria-label={view === 'overview' ? '返回我的' : '返回上一步'} onClick={back} className="rounded-full bg-white p-3 text-slate-600 disabled:opacity-50"><ArrowLeft size={18}/></button><h2 className="font-bold">{view === 'select' ? '选择城市' : '我的城市'}</h2></header>
    {view === 'overview' && <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="space-y-4 p-5"><div className="flex items-center justify-between"><span className="text-xs text-slate-500">我的城市</span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${saved?.sharing ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{saved?.sharing ? '已共享' : '未开启'}</span></div><strong className="block text-2xl text-slate-900">{saved?.city?.name || '尚未设置城市'}</strong><p className="text-xs leading-relaxed text-slate-500">{saved?.sharing ? '家人可以查看这座城市的天气。' : '设置后，让家人了解你所在城市的天气。'}</p></div>
        <button onClick={openSelection} className="w-full border-t border-slate-100 px-5 py-3.5 text-sm font-bold text-blue-600">{saved?.sharing ? '更换城市' : '设置城市'}</button>
      </section>
    </>}
    {view === 'select' && <>
      <p className="text-xs leading-relaxed text-slate-500">让家人了解你所在城市的天气，只共享城市，不显示具体位置。</p>
      <section aria-label="选择城市" className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 p-3">
          <input aria-label="搜索城市" disabled={busy} value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索城市名称" className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"/>
          <button aria-label="获取当前城市" disabled={busy} onClick={locate} className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-blue-600 disabled:opacity-50"><MapPin size={16}/>{busy ? '定位中' : '定位'}</button>
        </div>
        {message && <p role="status" className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500">{message}</p>}
        <div className="divide-y divide-slate-100">{cities.map(c => <button disabled={busy} key={c.id} onClick={() => { save(c.id, 'child-manual'); }} className="flex min-h-14 w-full items-center justify-between p-4 text-sm"><strong className="text-slate-800">{c.name}</strong><span className="text-xs text-slate-400">{c.country}</span></button>)}{cities.length === 0 && <p className="p-4 text-sm text-slate-500">未找到城市，请尝试其他名称。</p>}</div>
      </section>
    </>}
    {view !== 'select' && message && <p role="status" className="text-center text-xs text-slate-500">{message}</p>}
  </div>;
}
