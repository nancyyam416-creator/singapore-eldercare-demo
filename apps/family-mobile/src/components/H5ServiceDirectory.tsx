import { segmentedControlClass, segmentedOptionClass } from './segmentedControlStyles';
import { getServiceReviewSummary, readSharedServiceAssistanceRecords, subscribeSharedServiceAssistanceRecords } from '../../../产品理解/90 原型与Mock素材/mock/服务协助记录共享Mock.js';
import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, AlertCircle, RefreshCw, Phone, UserRound, Clock3, MapPin } from 'lucide-react';
import { unifiedServiceCatalog, readUnifiedServiceDirectoryRuntime, subscribeUnifiedServiceDirectoryRuntime, resolveUnifiedServiceDirectory } from '../../../产品理解/90 原型与Mock素材/mock/统一服务目录.js';
import catalog from '../../../产品理解/90 原型与Mock素材/mock/统一服务目录.json';

const serviceImages = import.meta.glob('../../../elder-miniapp/public/assets/services/*', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const appointmentServices = unifiedServiceCatalog.map(service => {
  const source = catalog.services.find(item => item.id === service.id);
  return { ...service, coverImage: serviceImages[`../../../elder-miniapp/public${source?.coverImage}`] || service.coverImage, detailImages: source?.detailImages.map(image => serviceImages[`../../../elder-miniapp/public${image}`] || image) || service.detailImages };
});
type DirectoryService = typeof appointmentServices[number];
const communityNames = new Map(catalog.communities.map(item => [item.id, item.name]));
const coverageLabel = (service: DirectoryService) => service.coverageMode === 'all' ? '全部社区' : service.coverageCommunityIds.map(id => communityNames.get(id) ?? '社区未设置').join('、');
const firstServicePrice = (service: DirectoryService) => service.serviceItems.find(item => item.priceText?.trim())?.priceText;

export function H5ServiceDirectory({ communityId, disabledCategory, loadError = false }: { communityId?: string; disabledCategory?: string; loadError?: boolean }) {
  const [contract, setContract] = useState(() => readUnifiedServiceDirectoryRuntime());
  const [category, setCategory] = useState('');
  useEffect(() => subscribeUnifiedServiceDirectoryRuntime(setContract), []);
  const [reviewRecords, setReviewRecords] = useState(() => readSharedServiceAssistanceRecords());
  useEffect(() => { const sync = () => setReviewRecords(readSharedServiceAssistanceRecords()); const off = subscribeSharedServiceAssistanceRecords(sync); const timer = window.setInterval(sync, 1200); return () => { off(); window.clearInterval(timer); }; }, []);
  const reviewSummary = (service: DirectoryService) => getServiceReviewSummary([service.id, ...service.legacyServiceIds], reviewRecords);
  const [selected, setSelected] = useState<DirectoryService | null>(null);
  const [detailTab, setDetailTab] = useState<'details' | 'reviews'>('details');
  const [recovered, setRecovered] = useState(false);
  useEffect(() => { setSelected(null); }, [communityId]);
  const directory = resolveUnifiedServiceDirectory({ communityId, settings: contract.categorySettings, categories: contract.categories, services: contract.services });
  const activeCategory = directory.categoryEnabled && directory.categories.some(item => item.code === category) ? category : '';
  const available = communityId ? directory.services.filter(item => (!disabledCategory || item.categoryCode !== disabledCategory)).map(item => ({ ...item, coverImage: item.coverImage || appointmentServices.find(source => source.id === item.id)?.coverImage, detailImages: item.detailImages || [], precautions: Array.isArray(item.precautions) ? item.precautions.join('\n') : item.precautions || '' })) : [];
  const services = activeCategory ? available.filter(item => item.categoryCode === activeCategory || item.categoryId === activeCategory) : available;
  useEffect(() => { setCategory(''); }, [communityId]);
  useEffect(() => { setSelected(current => current ? available.find(item => item.id === current.id) || null : null); }, [contract, communityId, disabledCategory]);
  if (loadError && !recovered) return <section role="alert" className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center"><AlertCircle size={28} className="mx-auto text-slate-400"/><h2 className="mt-3 text-sm font-bold">服务目录加载失败</h2><p className="mt-2 text-xs text-slate-500">暂时无法加载社区服务，请重新加载。</p><button onClick={() => setRecovered(true)} className="mx-auto mt-4 flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white"><RefreshCw size={14}/>重新加载</button></section>;
  if (selected) return <section className="space-y-3 pb-[calc(5rem+env(safe-area-inset-bottom))]">
    <button onClick={() => setSelected(null)} className="flex min-h-11 items-center gap-2 text-sm"><ArrowLeft size={18} />服务详情</button>
    <div className="relative overflow-hidden rounded-2xl bg-slate-100"><img src={selected.coverImage} alt={selected.name} className="block aspect-[5/3] w-full object-cover"/></div>
    <div className="space-y-2"><h2 className="text-lg font-bold leading-6 text-slate-900">{selected.name}</h2><p className="text-xs leading-5 text-slate-500">{selected.description}</p></div>
    <div role="tablist" aria-label="服务详情内容" className={segmentedControlClass}>{(['details', 'reviews'] as const).map(tab => <button key={tab} role="tab" aria-selected={detailTab === tab} aria-controls={`service-${tab}-panel`} onClick={() => setDetailTab(tab)} className={segmentedOptionClass(detailTab === tab)}>{tab === 'details' ? '详情' : `服务评价 (${reviewSummary(selected).count})`}</button>)}</div>
    {detailTab === 'details' ? <div id="service-details-panel" role="tabpanel" aria-label="详情" className="space-y-3">
    <section aria-label="服务介绍" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4"><h3 className="border-b border-slate-100 pb-3 text-sm font-bold">服务介绍</h3><div className="space-y-2"><h4 className="text-xs font-semibold">服务内容</h4><div className="divide-y divide-slate-100">{selected.serviceItems.map(item => <article key={item.id} className="space-y-2 py-3"><div className="flex items-start justify-between gap-3"><h5 className="text-sm font-semibold">{item.name}</h5><strong className="min-w-0 max-w-[55%] break-words text-right text-sm text-blue-600">{item.priceText}</strong></div><p className="text-xs leading-5 text-slate-500">{item.content}</p></article>)}</div><p className="text-[11px] text-slate-400">具体费用以服务人员上门确认为准</p></div><div className="space-y-2"><h4 className="text-xs font-semibold">注意事项</h4><ul className="list-disc space-y-2 pl-5 text-xs leading-6 text-slate-600">{selected.precautions.split('\n').map(text => <li key={text}>{text}</li>)}</ul></div></section>
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4"><h3 className="border-b border-slate-100 pb-3 text-sm font-bold">服务信息</h3><div className="flex gap-3 rounded-xl border border-slate-200 p-3"><UserRound size={18} className="shrink-0 text-blue-600"/><div className="min-w-0 flex-1"><p className="text-[10px] text-slate-500">服务商</p><strong className="mt-1 block text-xs">{selected.provider}</strong><dl className="mt-3 space-y-3 border-t border-slate-100 pt-3">{([[Clock3, '营业时间', selected.businessHours], [MapPin, '支持区域', coverageLabel(selected)], [Phone, '服务电话', selected.providerPhone]] as const).map(([Icon, label, value]) => <div key={label as string} className="grid grid-cols-[5rem_1fr] items-start gap-2"><dt className="flex items-center gap-1 text-[10px] text-slate-500"><Icon size={12} className="shrink-0 text-blue-600"/>{label}</dt><dd className="break-words text-[11px] font-semibold leading-4 text-slate-700">{label === '服务电话' ? <a className="text-blue-600" href={`tel:${selected.providerPhone.replace(/\s/g, '')}`}>{value}</a> : value}</dd></div>)}</dl></div></div></section>
    <section aria-label="服务详情" className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"><h3 className="border-b border-slate-100 pb-3 text-sm font-bold">服务详情</h3>{selected.detailImages.map((source, index) => <img key={source} src={source} alt={`${selected.name}详情 ${index + 1}`} className="block h-auto w-full rounded-xl bg-slate-100 object-contain" loading="lazy" />)}</section>
    </div> : <section id="service-reviews-panel" role="tabpanel" aria-label="服务评价" className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">{reviewSummary(selected).count === 0 ? <p className="text-xs text-slate-500">暂无评价</p> : <><p className="text-sm text-amber-600">{reviewSummary(selected).average}分 · {reviewSummary(selected).count}条评价</p>{reviewSummary(selected).reviews.map(review => <article key={review.recordId} className="space-y-2 border-t border-slate-100 pt-3"><p className="text-xs font-semibold">{review.reviewerName} · {review.rating}星</p><p className="text-xs leading-5 text-slate-600">{review.text || '未填写文字评价'}</p><time className="text-[10px] text-slate-400">{new Date(review.submittedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Singapore', hour12: false })}</time></article>)}</>}</section>}
    {document.getElementById('h5-phone-screen') && createPortal(
      <div data-service-call-bar className="absolute inset-x-0 bottom-16 z-30 border-t border-slate-200 bg-white/95 px-4 pt-2 shadow-lg backdrop-blur" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
    <a href={`tel:${selected.providerPhone.replace(/\s/g, '')}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 p-3 text-sm font-bold text-white"><Phone size={18} />拨打服务商电话</a>
      </div>, document.getElementById('h5-phone-screen')!
    )}
  </section>;
  return <section className="space-y-3" aria-label="服务目录">
    <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={14}/>{communityNames.get(communityId ?? '') ?? '社区未设置'}</p>
    {directory.categoryEnabled && <nav aria-label="服务分类" className="flex gap-2 overflow-x-auto pb-1">{[{ code: '', name: '全部' }, ...directory.categories].map(item => <button key={item.code} aria-pressed={activeCategory === item.code} onClick={() => setCategory(item.code)} className={`shrink-0 rounded-full px-3 py-2 text-xs ${activeCategory === item.code ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}>{item.name}</button>)}</nav>}
    <div className="space-y-3">{services.length === 0 && <div className="rounded-2xl bg-white px-5 py-12 text-center text-sm text-slate-500">{communityId ? '当前社区暂无可用服务' : '社区未设置'}</div>}{services.map(item => <button key={item.id} onClick={() => { setDetailTab('details'); setSelected(item); }} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-xs"><img src={item.coverImage} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" loading="lazy"/><span className="min-w-0 flex-1 space-y-1"><strong className="block text-sm leading-5 text-slate-900">{item.name}</strong><span className="block text-[11px] leading-4 text-slate-500">{item.provider}</span>{firstServicePrice(item) && <span className="block break-words text-sm font-bold leading-5 text-blue-600">{firstServicePrice(item)}</span>}<span className="block text-[11px] text-slate-500">{reviewSummary(item).count ? `${reviewSummary(item).average}分 · ${reviewSummary(item).count}条评价` : '暂无评价'}</span></span><ChevronRight size={16} className="shrink-0 text-slate-400"/></button>)}</div>
  </section>;
}
