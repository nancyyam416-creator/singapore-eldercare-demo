/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  Check,
  ImagePlus,
  LoaderCircle,
  Phone,
  Play,
  RefreshCw,
  Send,
  Smartphone,
  Trash2,
  Video,
  X
} from 'lucide-react';
import { FamilyPhotoScenario, PublishedPhotoBatch } from '../types';

type MediaStatus = 'pending' | 'uploading' | 'published' | 'failed';
type MediaType = 'photo' | 'video';

interface UploadMediaItem {
  id: string;
  name: string;
  type: MediaType;
  previewUrl: string;
  videoUrl?: string;
  durationSeconds?: number;
  status: MediaStatus;
  localUrl?: boolean;
  previewFailed?: boolean;
}

interface H5PhotoShareSheetProps {
  elderNames: string[];
  onClose: () => void;
  onPublished: (batch: PublishedPhotoBatch) => void;
  onContactElder: () => void;
  demoScenario?: FamilyPhotoScenario;
  isOpen: boolean;
}

const MAX_MEDIA_COUNT = 9;
const categories = ['日常生活', '家庭聚会', '旅行风景', '孩子成长', '节日纪念'];
const demoVideoUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const createDemoCover = (start: string, end: string, title: string, subtitle: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360" viewBox="0 0 360 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${start}"/><stop offset="1" stop-color="${end}"/></linearGradient></defs><rect width="360" height="360" rx="32" fill="url(#g)"/><circle cx="180" cy="135" r="58" fill="white" fill-opacity=".22"/><path d="M116 256c16-48 112-48 128 0" fill="white" fill-opacity=".22"/><text x="180" y="302" text-anchor="middle" fill="white" font-family="sans-serif" font-size="26" font-weight="700">${title}</text><text x="180" y="330" text-anchor="middle" fill="white" fill-opacity=".78" font-family="sans-serif" font-size="16">${subtitle}</text></svg>`)}`;

const demoPhotoCovers = [
  createDemoCover('#60A5FA', '#4F46E5', '公园合影', '照片'),
  createDemoCover('#34D399', '#0F766E', '周末风景', '照片'),
  createDemoCover('#FB923C', '#E11D48', '家庭聚会', '照片')
];

const demoVideoCovers = [
  createDemoCover('#8B5CF6', '#2563EB', '公园散步', '视频 · 00:18'),
  createDemoCover('#F97316', '#DB2777', '生日祝福', '视频 · 00:26')
];

const makeDemoItem = (index: number, type: MediaType, status: MediaStatus = 'pending', previewFailed = false): UploadMediaItem => ({
  id: `scenario-${type}-${index + 1}`,
  name: type === 'video' ? `家庭视频${index + 1}.mp4` : `家庭照片${index + 1}.jpg`,
  type,
  previewUrl: type === 'video' ? demoVideoCovers[index % demoVideoCovers.length] : demoPhotoCovers[index % demoPhotoCovers.length],
  videoUrl: type === 'video' ? demoVideoUrl : undefined,
  durationSeconds: type === 'video' ? (index % 2 === 0 ? 18 : 26) : undefined,
  status,
  previewFailed
});

const createInitialItems = (scenario?: FamilyPhotoScenario): UploadMediaItem[] => {
  if (!scenario || ['list_default', 'list_empty', 'list_offline_cached', 'list_offline_empty', 'compose_empty', 'camera_denied', 'capture_cancelled'].includes(scenario)) return [];
  if (scenario === 'compose_photo') return [0, 1, 2].map(index => makeDemoItem(index, 'photo'));
  if (scenario === 'compose_video') return [0, 1].map(index => makeDemoItem(index, 'video'));
  if (scenario === 'compose_max') return Array.from({ length: MAX_MEDIA_COUNT }, (_, index) => makeDemoItem(index, index % 3 === 2 ? 'video' : 'photo'));
  if (scenario === 'video_preview_failed') return [makeDemoItem(0, 'video', 'pending', true)];
  if (scenario === 'partial_retry') return [makeDemoItem(0, 'photo', 'published'), makeDemoItem(1, 'photo', 'published'), makeDemoItem(0, 'video', 'failed')];
  if (scenario === 'publish_failed') return [makeDemoItem(0, 'photo', 'failed'), makeDemoItem(0, 'video', 'failed')];
  if (scenario === 'publishing') return [makeDemoItem(0, 'photo', 'uploading'), makeDemoItem(0, 'video', 'uploading')];
  return [makeDemoItem(0, 'photo'), makeDemoItem(0, 'video'), makeDemoItem(1, 'photo')];
};

const statusLabel: Record<MediaStatus, string> = {
  pending: '待上传',
  uploading: '上传中',
  published: '已发布',
  failed: '上传失败'
};

const formatDuration = (seconds?: number) => {
  if (!seconds || !Number.isFinite(seconds)) return '';
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;
};

const describeItems = (items: UploadMediaItem[]) => {
  const photoCount = items.filter(item => item.type === 'photo').length;
  const videoCount = items.length - photoCount;
  return [photoCount ? `${photoCount}张照片` : '', videoCount ? `${videoCount}段视频` : ''].filter(Boolean).join('、');
};

export const H5PhotoShareSheet: React.FC<H5PhotoShareSheetProps> = ({ elderNames, onClose, onPublished, onContactElder, demoScenario, isOpen }) => {
  const [items, setItems] = useState<UploadMediaItem[]>(() => createInitialItems(demoScenario));
  const [elderName, setElderName] = useState(elderNames[0] || '老人');
  const [category, setCategory] = useState(categories[0]);
  const [message, setMessage] = useState('');
  const [selectedPreview, setSelectedPreview] = useState<UploadMediaItem | null>(null);
  const [notice, setNotice] = useState('');
  const [batchStatus, setBatchStatus] = useState<'editing' | 'uploading' | 'partial_failed' | 'failed' | 'published'>(
    demoScenario === 'publishing' ? 'uploading' : demoScenario === 'partial_retry' ? 'partial_failed' : demoScenario === 'publish_failed' ? 'failed' : 'editing'
  );
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const publishingRef = useRef(demoScenario === 'publishing');
  const itemsRef = useRef(items);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => () => itemsRef.current.forEach(item => { if (item.localUrl) URL.revokeObjectURL(item.previewUrl); }), []);

  const failedCount = items.filter(item => item.status === 'failed').length;
  const publishedCount = items.filter(item => item.status === 'published').length;
  const canPublish = items.length > 0 && !publishingRef.current && batchStatus !== 'uploading';
  const title = useMemo(() => batchStatus === 'published' ? '影像已发给家人' : `发照片或视频给${elderName}`, [batchStatus, elderName]);

  const completePublish = () => onPublished({
    id: `media-batch-${Date.now()}`,
    elderName,
    category,
    message: message.trim() || undefined,
    publishedAt: new Date().toISOString(),
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      previewUrl: item.previewUrl,
      videoUrl: item.videoUrl || (item.type === 'video' ? item.previewUrl : undefined),
      durationSeconds: item.durationSeconds
    })),
    feedback: 'liked'
  });

  const addLocalMedia = (event: ChangeEvent<HTMLInputElement>, expectedType?: MediaType) => {
    const files = Array.from(event.target.files || []) as File[];
    event.target.value = '';
    if (files.length === 0) {
      setNotice(expectedType ? '已取消拍摄，未添加新内容。' : '已取消选择。');
      return;
    }
    setItems(previous => {
      const remaining = MAX_MEDIA_COUNT - previous.length;
      const acceptedFiles = files.slice(0, Math.max(remaining, 0));
      if (files.length > remaining) setNotice(`照片和视频合计最多9项，本次仅添加前${Math.max(remaining, 0)}项。`);
      else setNotice('');
      const keys = new Set(previous.map(item => item.id));
      const additions = acceptedFiles.flatMap(file => {
        const type: MediaType = file.type.startsWith('video/') || expectedType === 'video' ? 'video' : 'photo';
        const id = `${file.name}-${file.size}-${file.lastModified}`;
        if (keys.has(id)) return [];
        keys.add(id);
        return [{ id, name: file.name, type, previewUrl: URL.createObjectURL(file), videoUrl: type === 'video' ? undefined : undefined, status: 'pending' as const, localUrl: true }];
      });
      return [...previous, ...additions];
    });
    setBatchStatus('editing');
  };

  const removeItem = (id: string) => setItems(previous => previous.filter(item => {
    if (item.id === id && item.localUrl) URL.revokeObjectURL(item.previewUrl);
    return item.id !== id;
  }));

  const updateDuration = (id: string, duration: number) => {
    if (!Number.isFinite(duration)) return;
    setItems(previous => previous.map(item => item.id === id ? { ...item, durationSeconds: Math.round(duration) } : item));
  };

  const publish = () => {
    if (!canPublish || publishingRef.current) return;
    publishingRef.current = true;
    setBatchStatus('uploading');
    setItems(previous => previous.map(item => item.status === 'pending' || item.status === 'failed' ? { ...item, status: 'uploading' } : item));
    window.setTimeout(() => {
      setItems(previous => previous.map(item => item.status === 'uploading' ? { ...item, status: 'published' } : item));
      setBatchStatus('published');
      completePublish();
      publishingRef.current = false;
    }, 900);
  };

  const retryFailed = () => {
    if (!failedCount || publishingRef.current) return;
    publishingRef.current = true;
    setBatchStatus('uploading');
    setItems(previous => previous.map(item => item.status === 'failed' ? { ...item, status: 'uploading' } : item));
    window.setTimeout(() => {
      setItems(previous => previous.map(item => item.status === 'uploading' ? { ...item, status: 'published' } : item));
      setBatchStatus('published');
      completePublish();
      publishingRef.current = false;
    }, 700);
  };

  const reset = () => {
    items.forEach(item => { if (item.localUrl) URL.revokeObjectURL(item.previewUrl); });
    setItems([]);
    setMessage('');
    setNotice('');
    setBatchStatus('editing');
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[85] flex items-end bg-slate-950/50" role="presentation" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="photo-share-title" onClick={event => event.stopPropagation()} className="flex max-h-[94%] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200" />
        <header className="flex items-center justify-between border-b border-slate-100 px-4 pb-3 pt-2"><div><span className="text-[10px] font-bold text-blue-600">家庭影像</span><h3 id="photo-share-title" className="mt-0.5 text-base font-black text-slate-900">{title}</h3></div><button type="button" onClick={onClose} aria-label="关闭" className="rounded-full bg-slate-100 p-2 text-slate-500"><X size={16} /></button></header>

        {batchStatus === 'published' ? (
          <div className="flex-1 overflow-y-auto p-5 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check size={27} /></span><h4 className="mt-4 text-lg font-black text-slate-900">{describeItems(items)}已发布</h4><p className="mt-2 text-xs leading-relaxed text-slate-500">{elderName}可在中控屏回看照片或视频。查看和喜欢反馈会显示在首页亲情互动中。</p><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={reset} className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white"><ImagePlus size={15} />继续发影像</button><button type="button" onClick={onContactElder} className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-50 py-3 text-xs font-bold text-orange-700"><Phone size={15} />联系老人</button></div></div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {elderNames.length > 1 && <label className="block"><span className="text-xs font-bold text-slate-700">接收老人</span><select value={elderName} onChange={event => setElderName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">{elderNames.map(name => <option key={name}>{name}</option>)}</select></label>}
            {elderNames.length === 1 && <div className="rounded-xl bg-blue-50 px-3 py-2.5 text-xs text-blue-800">接收人：<strong>{elderName}</strong></div>}

            <div>
              <div className="flex items-center justify-between"><strong className="text-xs text-slate-800">添加照片或视频</strong><span className="text-[10px] text-slate-400">合计最多9项</span></div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button type="button" onClick={() => photoInputRef.current?.click()} className="flex flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50 py-3 text-blue-700"><Camera size={18} /><span className="mt-1 text-[9px] font-bold">拍照片</span></button>
                <button type="button" onClick={() => videoInputRef.current?.click()} className="flex flex-col items-center justify-center rounded-xl border border-violet-100 bg-violet-50 py-3 text-violet-700"><Video size={18} /><span className="mt-1 text-[9px] font-bold">拍视频</span></button>
                <button type="button" onClick={() => libraryInputRef.current?.click()} className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-3 text-slate-700"><Smartphone size={18} /><span className="mt-1 text-[9px] font-bold">从手机选择</span></button>
                <input ref={photoInputRef} type="file" accept="image/*" capture="environment" onChange={event => addLocalMedia(event, 'photo')} className="sr-only" />
                <input ref={videoInputRef} type="file" accept="video/*" capture="environment" onChange={event => addLocalMedia(event, 'video')} className="sr-only" />
                <input ref={libraryInputRef} type="file" accept="image/*,video/*" multiple onChange={event => addLocalMedia(event)} className="sr-only" />
              </div>
              {notice && <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[10px] text-amber-700">{notice}</div>}
              {demoScenario === 'camera_denied' && <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2"><strong className="text-[10px] text-rose-700">无法使用相机</strong><p className="mt-0.5 text-[9px] text-rose-600">相机权限已被拒绝，可在系统设置中开启，或使用“从手机选择”。</p></div>}
              {demoScenario === 'capture_cancelled' && <div className="mt-2 rounded-xl bg-slate-100 px-3 py-2 text-[10px] text-slate-600">已取消拍摄，没有添加新内容。</div>}
            </div>

            <div>
              <div className="flex items-center justify-between"><strong className="text-xs text-slate-800">发布前预览</strong><span className="text-[10px] text-slate-400">{items.length}/{MAX_MEDIA_COUNT}</span></div>
              {items.length === 0 ? <div className="mt-2 rounded-xl border border-dashed border-slate-200 py-6 text-center text-[10px] text-slate-400">还没有选择照片或视频</div> : <div className="mt-2 grid grid-cols-3 gap-2">{items.map(item => <div key={item.id} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100"><button type="button" onClick={() => setSelectedPreview(item)} className="h-full w-full text-left">{item.previewFailed ? <span className="flex h-full w-full flex-col items-center justify-center bg-rose-50 text-rose-500"><AlertCircle size={20} /><span className="mt-1 text-[8px] font-bold">视频预览失败</span></span> : item.type === 'video' && item.localUrl ? <video src={item.previewUrl} muted preload="metadata" onLoadedMetadata={event => updateDuration(item.id, event.currentTarget.duration)} className="h-full w-full object-cover" /> : <img src={item.previewUrl} alt={item.name} className="h-full w-full object-cover" />}{item.type === 'video' && !item.previewFailed && <span className="absolute inset-0 flex items-center justify-center"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/65 text-white"><Play size={14} className="ml-0.5 fill-current" /></span></span>}{item.type === 'video' && item.durationSeconds && <span className="absolute bottom-1 right-1 rounded bg-slate-950/70 px-1 py-0.5 text-[8px] text-white">{formatDuration(item.durationSeconds)}</span>}</button><span className={`absolute bottom-1 left-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold ${item.status === 'failed' ? 'bg-rose-600 text-white' : item.status === 'published' ? 'bg-emerald-600 text-white' : 'bg-slate-900/70 text-white'}`}>{item.status === 'uploading' && <LoaderCircle size={9} className="mr-0.5 inline animate-spin" />}{statusLabel[item.status]}</span>{item.status === 'pending' && <button type="button" onClick={() => removeItem(item.id)} aria-label={`删除${item.name}`} className="absolute right-1 top-1 rounded-full bg-slate-950/65 p-1 text-white"><Trash2 size={11} /></button>}</div>)}</div>}
              {items.length >= MAX_MEDIA_COUNT && <p className="mt-2 text-[10px] font-bold text-amber-700">已达到9项上限，如需添加请先删除一项。</p>}
            </div>

            <label className="block"><span className="text-xs font-bold text-slate-700">影像分类</span><select value={category} onChange={event => setCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">{categories.map(item => <option key={item}>{item}</option>)}</select><span className="mt-1 block text-[9px] text-slate-400">分类由系统预设，暂不支持自建。</span></label>
            <label className="block"><span className="flex items-center justify-between text-xs font-bold text-slate-700"><span>给老人的话（选填）</span><span className="text-[9px] font-normal text-slate-400">{message.length}/100</span></span><textarea value={message} onChange={event => setMessage(event.target.value)} rows={2} maxLength={100} placeholder="例如：周末我们去公园拍的照片和视频" className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none" /><span className="mt-1 block text-[9px] text-slate-400">附言跟随本次影像发布，不进入家庭留言。</span></label>

            {batchStatus === 'partial_failed' && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><div className="flex items-center gap-2 text-xs font-bold text-amber-900"><AlertCircle size={15} />部分影像发布失败</div><p className="mt-1 text-[10px] text-amber-700">已发布{publishedCount}项，失败{failedCount}项。重试只处理失败内容。</p></div>}
            {batchStatus === 'failed' && <div className="rounded-xl bg-rose-50 p-3"><strong className="text-xs text-rose-700">本次发布失败</strong><p className="mt-1 text-[10px] text-rose-600">照片、视频、分类和附言已保留，可以重新发布。</p></div>}
          </div>
        )}

        {batchStatus !== 'published' && <footer className="border-t border-slate-100 bg-white p-4">{batchStatus === 'partial_failed' ? <button type="button" onClick={retryFailed} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-extrabold text-white"><RefreshCw size={16} />重试失败的{failedCount}项</button> : <button type="button" disabled={!canPublish} onClick={publish} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-extrabold text-white disabled:bg-slate-200 disabled:text-slate-400">{batchStatus === 'uploading' ? <LoaderCircle size={16} className="animate-spin" /> : batchStatus === 'failed' ? <RefreshCw size={16} /> : <Send size={16} />}{batchStatus === 'uploading' ? '正在发布…' : batchStatus === 'failed' ? `重新发布${items.length}项影像` : `发布${items.length ? `${items.length}项` : ''}影像`}</button>}</footer>}
      </section>

      {selectedPreview && <div className="absolute inset-0 z-[95] flex items-center justify-center bg-slate-950/85 p-4" onClick={() => setSelectedPreview(null)}><section role="dialog" aria-modal="true" onClick={event => event.stopPropagation()} className="w-full overflow-hidden rounded-2xl bg-slate-950"><header className="flex items-center justify-between px-3 py-2 text-white"><strong className="truncate text-xs">{selectedPreview.name}</strong><button type="button" onClick={() => setSelectedPreview(null)} aria-label="关闭预览" className="rounded-full bg-white/10 p-2"><X size={15} /></button></header>{selectedPreview.previewFailed ? <div className="flex aspect-video flex-col items-center justify-center bg-slate-900 text-rose-300"><AlertCircle size={28} /><strong className="mt-2 text-sm">视频预览失败</strong><span className="mt-1 text-[10px] text-slate-400">文件仍保留，可删除后重新选择</span></div> : selectedPreview.type === 'video' ? <video src={selectedPreview.videoUrl || selectedPreview.previewUrl} controls autoPlay className="max-h-[62vh] w-full bg-black" onError={() => setItems(previous => previous.map(item => item.id === selectedPreview.id ? { ...item, previewFailed: true } : item))} /> : <img src={selectedPreview.previewUrl} alt={selectedPreview.name} className="max-h-[62vh] w-full object-contain" />}</section></div>}
    </div>
  );
};
