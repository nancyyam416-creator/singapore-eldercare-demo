import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Phone } from 'lucide-react';
import { unifiedServiceCatalog, unifiedServiceCategories } from '../../../产品理解/90 原型与Mock素材/mock/统一服务目录.js';
import catalog from '../../../产品理解/90 原型与Mock素材/mock/统一服务目录.json';

const appointmentCategories = unifiedServiceCategories;
const appointmentServices = unifiedServiceCatalog;
type DirectoryService = typeof appointmentServices[number];
const communityNames = new Map(catalog.communities.map(item => [item.id, item.name]));
const coverageLabel = (service: DirectoryService) => service.coverageMode === 'all' ? '全部社区' : service.coverageCommunityIds.map(id => communityNames.get(id) ?? '社区未设置').join('、');

export function H5ServiceDirectory({ communityId }: { communityId?: string }) {
  const [selected, setSelected] = useState<DirectoryService | null>(null);
  const [category, setCategory] = useState('all');
  useEffect(() => { setSelected(null); setCategory('all'); }, [communityId]);
  const services = appointmentServices.filter(item => communityId && (item.coverageMode === 'all' || item.coverageCommunityIds.includes(communityId))).filter(item => category === 'all' || item.categoryCode === category);
  if (selected) return <section className="space-y-4 p-4">
    <button onClick={() => setSelected(null)} className="flex min-h-11 items-center gap-2 text-sm"><ArrowLeft size={18} />服务详情</button>
    <section className="overflow-hidden rounded-2xl bg-white"><img src={selected.coverImage} alt={selected.name} className="block h-auto w-full" /><div className="space-y-2 p-5"><span className="text-xs text-blue-600">{selected.category}</span><h2 className="text-xl font-bold">{selected.name}</h2><p className="text-base font-bold text-blue-600">参考价格 {selected.priceRange}</p></div></section>
    <section aria-label="服务介绍" className="space-y-5 rounded-2xl bg-white p-5"><h2 className="text-base font-bold">服务介绍</h2><div className="space-y-2"><h3 className="text-sm font-semibold">服务内容</h3><p className="text-sm leading-7 text-slate-600">{selected.serviceContent}</p></div><div className="space-y-2"><h3 className="text-sm font-semibold">注意事项</h3><ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">{selected.precautions.split("\n").map(text => <li key={text}>{text}</li>)}</ul></div></section>
    <dl className="space-y-4 rounded-2xl bg-white p-5 text-sm">{[['服务商', selected.provider], ['营业时间', selected.businessHours], ['服务范围', coverageLabel(selected)], ['电话', selected.providerPhone]].map(([label, value]) => <div key={label}><dt className="mb-1 text-xs text-slate-400">{label}</dt><dd className="break-words">{value}</dd></div>)}</dl>
    <section aria-label="服务详情" className="overflow-hidden rounded-2xl bg-white"><h2 className="p-5 text-base font-bold">服务详情</h2>{selected.detailImages.map((source, index) => <img key={source} src={source} alt={`${selected.name}详情 ${index + 1}`} className="block h-auto w-full" loading="lazy" />)}</section>
    <a href={`tel:${selected.providerPhone.replace(/\s/g, '')}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 p-3 text-sm font-bold text-white"><Phone size={18} />拨打服务商电话</a>
  </section>;
  return <section className="space-y-4 p-4"><h2 className="text-lg font-bold">服务目录</h2><div className="flex flex-wrap gap-2">{[{ code: 'all', name: '全部' }, ...appointmentCategories].map(item => <button key={item.code} onClick={() => setCategory(item.code)} className={`rounded-full px-3 py-2 text-xs ${category === item.code ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}>{item.name}</button>)}</div><div className="space-y-3">{services.length === 0 && <div className="rounded-2xl bg-white px-5 py-12 text-center text-sm text-slate-500">{communityId ? "当前社区暂无可用服务" : "社区未设置"}</div>}{services.map(item => <button key={item.id} onClick={() => setSelected(item)} className="w-full space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-left"><img src={item.coverImage} alt={item.name} className="block h-auto w-full rounded-xl" loading="lazy" /><div className="flex items-center justify-between"><strong className="text-sm">{item.name}</strong><ChevronRight size={16} /></div><p className="text-xs leading-relaxed text-slate-500">{item.description}</p><p className="text-xs text-slate-500">{item.provider}</p><p className="text-sm font-bold text-blue-600">{item.priceRange}</p></button>)}</div></section>;
}
