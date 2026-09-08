import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, CreditCard, MapPin, RefreshCw, ShoppingBag, Star, User, X } from 'lucide-react';
import { Order, ServiceCategoryCode, ServiceProduct, StoreCategoryScenario } from '../types';
import { serviceCatalog, serviceCategories } from '../data/mockData';

interface Props {
  parentProfile: typeof import('../data/mockData').initialParentProfile;
  elderName: string;
  elderProject: string;
  scenario: StoreCategoryScenario;
  onAddOrder: (order: Order) => void;
  onSwitchToOrders: () => void;
}
type View = 'list' | 'detail' | 'checkout' | 'success';
type Filter = 'all' | ServiceCategoryCode;
const fallbackNames: Record<ServiceCategoryCode, string> = { home: '居家服务', care: '照护服务', meal: '助餐服务', health: '健康服务', safety: '适老安全' };
const tones: Record<ServiceCategoryCode, string> = { home: 'bg-sky-50 text-sky-700', care: 'bg-violet-50 text-violet-700', meal: 'bg-orange-50 text-orange-700', health: 'bg-emerald-50 text-emerald-700', safety: 'bg-rose-50 text-rose-700' };

export const H5StoreTab: React.FC<Props> = ({ parentProfile, elderName, elderProject, scenario, onAddOrder, onSwitchToOrders }) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<View>('list');
  const [selected, setSelected] = useState<ServiceProduct | null>(null);
  const [paying, setPaying] = useState(false);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [retrying, setRetrying] = useState(false);
  const communityId = scenario === 'alternate_community' || elderProject.includes('长宁') ? 'community-changning' : 'community-jingan';
  const communityName = communityId === 'community-changning' ? '长宁社区' : '静安社区';
  const services = useMemo(() => scenario === 'empty' ? [] : serviceCatalog.filter(item => item.isBookable && item.communityIds.includes(communityId)).filter(item => !(scenario === 'category_disabled' && item.category === 'meal')), [communityId, scenario]);
  const categories = useMemo(() => serviceCategories.filter(item => item.communityId === communityId && item.status === 'enabled').filter(item => !(scenario === 'category_disabled' && item.code === 'meal')).map(item => ({ ...item, count: services.filter(service => service.category === item.code).length })).filter(item => item.count > 0).sort((a, b) => a.displayOrder - b.displayOrder), [communityId, scenario, services]);
  const names = useMemo(() => Object.fromEntries(categories.map(item => [item.code, item.name])) as Partial<Record<ServiceCategoryCode, string>>, [categories]);
  const nameOf = (code: ServiceCategoryCode) => names[code] ?? fallbackNames[code];
  const visible = filter === 'all' ? services : services.filter(item => item.category === filter);

  useEffect(() => { setFilter('all'); setView('list'); setSelected(null); }, [communityId, elderName, scenario]);

  const createOrder = () => {
    if (!selected || paying) return;
    setPaying(true);
    window.setTimeout(() => {
      const now = new Date();
      const time = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const order: Order = { id: `ord-${Date.now().toString().slice(-6)}`, serviceId: selected.id, serviceName: selected.name, categoryNameSnapshot: nameOf(selected.category), price: selected.price, serviceDate: '2026-08-26', serviceTime: '14:00-16:00', parentName: elderName, parentAddress: parentProfile.address, status: 'paid', statusLogs: [{ time, text: '订单下单成功，子女完成模拟支付' }], orderTime: time, paymentMethod: '微信支付' };
      onAddOrder(order); setLatestOrder(order); setPaying(false); setView('success');
    }, 500);
  };

  if (scenario === 'load_error' && !retrying) return <div className="p-4"><div className="rounded-2xl border border-rose-100 bg-white p-8 text-center"><AlertCircle className="mx-auto text-rose-500" size={28} /><h3 className="mt-3 text-sm font-extrabold">服务分类加载失败</h3><p className="mt-1 text-[10px] text-slate-500">暂时无法读取{communityName}的服务，订单记录不受影响。</p><button type="button" onClick={() => { setRetrying(true); window.setTimeout(() => setRetrying(false), 700); }} className="mt-4 inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2.5 text-[10px] font-bold text-white"><RefreshCw size={13} />重新加载</button></div></div>;

  return <div id="h5-store-tab" className="p-4 pb-6">
    {view === 'list' && <div className="space-y-4">
      <section className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-white"><span className="rounded-full bg-white/15 px-2 py-1 text-[9px] font-bold">特约服务</span><h3 className="mt-2 text-sm font-extrabold">为{elderName}预约社区服务</h3><p className="mt-1 text-[10px] text-blue-100">当前社区：{scenario === 'alternate_community' ? `${communityName}（验收模拟）` : elderProject}</p></section>
      {services.length === 0 ? <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><ShoppingBag className="mx-auto text-slate-300" size={28} /><h3 className="mt-3 text-sm font-extrabold">当前社区暂无可预约服务</h3><p className="mt-1 text-[10px] text-slate-500">开放服务后会自动显示，历史订单仍可查看。</p></section> : <>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none"><button type="button" onClick={() => setFilter('all')} className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-extrabold ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>全部 {services.length}</button>{categories.map(item => <button key={item.code} type="button" onClick={() => setFilter(item.code)} className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-extrabold ${filter === item.code ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{item.name} {item.count}</button>)}</div>
        <div className="space-y-3">{visible.map(item => <button type="button" key={item.id} onClick={() => { setSelected(item); setView('detail'); }} className="flex w-full overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-3xs"><img src={item.image} alt={item.name} className="h-24 w-24 object-cover" /><span className="flex min-w-0 flex-1 flex-col justify-between p-3"><span><span className={`inline-flex rounded px-1.5 py-0.5 text-[8px] font-black ${tones[item.category]}`}>{nameOf(item.category)}</span><strong className="mt-1.5 block truncate text-xs text-slate-800">{item.name}</strong><span className="mt-1 block truncate text-[9px] text-slate-400">{item.description}</span></span><span className="flex items-center justify-between"><b className="text-xs text-blue-600">￥{item.price}<small className="text-[8px] text-slate-400">/{item.unit}</small></b><span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-500"><Star size={10} className="fill-current" />{item.rating}</span></span></span></button>)}</div>
      </>}
    </div>}

    {view === 'detail' && selected && <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white"><div className="relative"><img src={selected.image} alt={selected.name} className="h-40 w-full object-cover" /><button type="button" onClick={() => setView('list')} className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white"><X size={15} /></button></div><div className="space-y-4 p-4"><div><span className={`rounded px-2 py-1 text-[9px] font-bold ${tones[selected.category]}`}>{nameOf(selected.category)}</span><h3 className="mt-2 text-sm font-extrabold">{selected.name}</h3><p className="mt-1 text-base font-black text-blue-600">￥{selected.price}<small className="text-[9px] text-slate-400">/{selected.unit}</small></p></div><div className="grid grid-cols-2 gap-2 border-y border-slate-100 py-3">{selected.features.map(feature => <span key={feature} className="flex items-center gap-1 text-[9px] text-slate-600"><Check size={11} className="text-emerald-500" />{feature}</span>)}</div><p className="text-[11px] leading-relaxed text-slate-500">{selected.longDescription}</p><button type="button" onClick={() => setView('checkout')} className="flex w-full items-center justify-center gap-1 rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white"><ShoppingBag size={14} />立即预约</button></div></section>}

    {view === 'checkout' && selected && <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4"><div className="flex items-center justify-between border-b border-slate-100 pb-3"><div><p className="text-[9px] font-bold text-blue-600">{nameOf(selected.category)}</p><h3 className="text-sm font-extrabold">确认预约</h3></div><button type="button" onClick={() => setView('detail')}><X size={16} /></button></div><div className="flex gap-3 rounded-xl bg-slate-50 p-3"><img src={selected.image} alt="" className="h-14 w-14 rounded-lg object-cover" /><div className="min-w-0 flex-1"><strong className="block truncate text-xs">{selected.name}</strong><span className="mt-2 block text-xs font-black text-blue-600">￥{selected.price}</span></div></div><div className="rounded-xl border border-slate-200 p-3"><div className="flex items-center gap-1 text-xs font-extrabold"><User size={12} />服务对象：{elderName}</div><p className="mt-1 flex items-center gap-1 text-[9px] text-slate-500"><MapPin size={11} />{parentProfile.address}</p></div><div className="grid grid-cols-2 gap-2"><div className="rounded-xl border border-slate-200 p-3 text-[10px]"><b>上门日期</b><p className="mt-1 text-slate-500">2026-08-26</p></div><div className="rounded-xl border border-slate-200 p-3 text-[10px]"><b>上门时间</b><p className="mt-1 text-slate-500">14:00-16:00</p></div></div><button type="button" disabled={paying} onClick={createOrder} className="flex w-full items-center justify-center gap-1 rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white"><CreditCard size={14} />{paying ? '模拟支付中…' : `确认支付 ￥${selected.price}`}</button></section>}

    {view === 'success' && latestOrder && <section className="rounded-2xl border border-slate-100 bg-white p-6 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check size={25} /></span><h3 className="mt-3 text-sm font-extrabold">预约成功</h3><p className="mt-1 text-[10px] text-slate-500">{latestOrder.categoryNameSnapshot} · {latestOrder.serviceName}</p><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setView('list')} className="rounded-xl bg-slate-100 py-2.5 text-[10px] font-bold">继续查看服务</button><button type="button" onClick={onSwitchToOrders} className="rounded-xl bg-blue-600 py-2.5 text-[10px] font-bold text-white">查看订单记录</button></div></section>}
  </div>;
};
