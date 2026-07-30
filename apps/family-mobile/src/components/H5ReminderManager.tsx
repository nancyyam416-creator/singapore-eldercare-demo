/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Pill,
  Plus,
  Trash2,
  UserRound,
  X
} from 'lucide-react';
import { CareReminder, ReminderScenario } from '../types';

interface H5ReminderManagerProps {
  elderName: string;
  elderId: string;
  scenario: ReminderScenario;
}

const weekdayOptions = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
  { value: 0, label: '日' }
];

const initialReminders: CareReminder[] = [
  { id: 'rem-1', elderId: 'elder-1', elderName: '爸爸', type: 'medication', title: '晨间降压药', detail: '氨氯地平 1片', date: '2026-07-29', time: '08:00', repeat: 'daily' },
  { id: 'rem-2', elderId: 'elder-1', elderName: '爸爸', type: 'daily', title: '午后测量血压', detail: '测量后在中控屏确认', date: '2026-07-29', time: '14:30', repeat: 'weekly', weekdays: [1, 3, 5] },
  { id: 'rem-3', elderId: 'elder-1', elderName: '爸爸', type: 'medication', title: '晚间阿司匹林', detail: '阿司匹林肠溶片 1片', date: '2026-07-29', time: '19:00', repeat: 'daily' },
  { id: 'rem-4', elderId: 'elder-1', elderName: '爸爸', type: 'daily', title: '晚饭后散步', detail: '在小区内慢走20分钟', date: '2026-07-29', time: '18:30', repeat: 'daily' }
];

const repeatLabel = (reminder: CareReminder) => {
  if (reminder.repeat === 'daily') return '每天';
  if (reminder.repeat === 'once') return reminder.date.replace(/-/g, '.');
  const days = weekdayOptions.filter(day => reminder.weekdays?.includes(day.value)).map(day => `周${day.label}`).join('、');
  return days || '每周';
};

export const H5ReminderManager: React.FC<H5ReminderManagerProps> = ({ elderName, elderId, scenario }) => {
  const [reminders, setReminders] = useState<CareReminder[]>(initialReminders);
  const [filter, setFilter] = useState<'all' | 'medication' | 'daily'>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<CareReminder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CareReminder | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [draftType, setDraftType] = useState<'medication' | 'daily'>('medication');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDetail, setDraftDetail] = useState('');
  const [draftDate, setDraftDate] = useState('2026-07-29');
  const [draftTime, setDraftTime] = useState('09:00');
  const [draftRepeat, setDraftRepeat] = useState<'once' | 'daily' | 'weekly'>('daily');
  const [draftWeekdays, setDraftWeekdays] = useState<number[]>([]);

  const scenarioReminders = scenario === 'empty'
    ? []
    : scenario === 'delete_success'
      ? reminders.slice(1)
      : reminders;

  const visibleReminders = scenarioReminders.filter(reminder => filter === 'all' || reminder.type === filter);

  const openEditor = (reminder?: CareReminder) => {
    const source = reminder ?? null;
    setEditingReminder(source);
    setDraftType(source?.type ?? 'medication');
    setDraftTitle(source?.title ?? '');
    setDraftDetail(source?.detail ?? '');
    setDraftDate(source?.date ?? '2026-07-29');
    setDraftTime(source?.time ?? '09:00');
    setDraftRepeat(source?.repeat ?? 'daily');
    setDraftWeekdays(source?.weekdays ?? []);
    setFeedback(null);
    setEditorOpen(true);
  };

  useEffect(() => {
    setEditorOpen(false);
    setEditingReminder(null);
    setDeleteTarget(null);
    setDeleteError('');
    setFeedback(null);

    if (scenario === 'create') {
      openEditor();
    } else if (scenario === 'edit' && reminders[0]) {
      openEditor(reminders[0]);
    } else if ((scenario === 'delete_confirm' || scenario === 'delete_failed') && reminders[0]) {
      setDeleteTarget(reminders[0]);
    } else if (scenario === 'delete_success') {
      setFeedback({ message: '提醒已删除', tone: 'success' });
    }
  // 交互验收场景只在外部场景切换时触发，避免本地增删操作重复打开面板。
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  const saveReminder = () => {
    if (!draftTitle.trim() || (draftRepeat === 'weekly' && draftWeekdays.length === 0)) return;
    if (editingReminder) {
      setReminders(current => current.map(item => item.id === editingReminder.id
        ? { ...item, type: draftType, title: draftTitle.trim(), detail: draftDetail.trim(), date: draftDate, time: draftTime, repeat: draftRepeat, weekdays: draftRepeat === 'weekly' ? draftWeekdays : undefined }
        : item));
      setFeedback({ message: '提醒已更新', tone: 'success' });
    } else {
      setReminders(current => [{
        id: `rem-${Date.now()}`,
        elderId,
        elderName,
        type: draftType,
        title: draftTitle.trim(),
        detail: draftDetail.trim(),
        date: draftDate,
        time: draftTime,
        repeat: draftRepeat,
        weekdays: draftRepeat === 'weekly' ? draftWeekdays : undefined,
      }, ...current]);
      setFeedback({ message: '提醒已新增', tone: 'success' });
    }
    setEditorOpen(false);
  };

  const deleteReminder = () => {
    if (!deleteTarget) return;
    if (scenario === 'delete_failed') {
      setDeleteError('删除失败，请稍后重试');
      setFeedback({ message: '删除失败，原提醒已保留', tone: 'error' });
      return;
    }
    setReminders(current => current.filter(item => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleteError('');
    setFeedback({ message: '提醒已删除', tone: 'success' });
  };

  return (
    <div className="space-y-4" id="h5-reminder-manager">
      <section className="overflow-hidden rounded-2xl bg-slate-900 p-4 text-white shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><UserRound size={20} /></div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold text-slate-400">当前管理对象</span>
            <h2 className="mt-0.5 text-sm font-black">{elderName}</h2>
            <p className="mt-0.5 text-[10px] text-slate-300">全部时间按老人当地时间 · Asia/Shanghai</p>
          </div>
          <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[9px] font-bold text-emerald-300">已绑定</span>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
          <div>
            <div className="flex items-center gap-2"><BellRing size={16} className="text-blue-600" /><h3 className="text-sm font-black text-slate-900">提醒事项</h3></div>
            <p className="mt-1 text-[10px] text-slate-500">用药提醒和日常提醒统一管理</p>
          </div>
          <button type="button" onClick={() => openEditor()} className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-2 text-[10px] font-extrabold text-white"><Plus size={13} />新增</button>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1.5">
          {([
            ['all', `全部 ${scenarioReminders.length}`],
            ['medication', '用药提醒'],
            ['daily', '日常提醒']
          ] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-lg px-2 py-2 text-[10px] font-bold ${filter === value ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}>{label}</button>
          ))}
        </div>
      </section>

      {feedback && (
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-bold ${feedback.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {feedback.tone === 'success' ? <CheckCircle2 size={14} /> : <BellRing size={14} />}
          {feedback.message}
        </div>
      )}

      {visibleReminders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
          <BellRing size={24} className="mx-auto text-slate-300" />
          <strong className="mt-3 block text-xs text-slate-700">暂无提醒事项</strong>
          <p className="mt-1 text-[10px] text-slate-400">可为{elderName}新增用药提醒或日常提醒</p>
          <button type="button" onClick={() => openEditor()} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-[10px] font-bold text-white">新增提醒</button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visibleReminders.map(reminder => {
            const TypeIcon = reminder.type === 'medication' ? Pill : CalendarDays;
            return (
              <article key={reminder.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="flex items-start gap-3 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${reminder.type === 'medication' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}><TypeIcon size={18} /></div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-slate-400">{reminder.type === 'medication' ? '用药提醒' : '日常提醒'}</span>
                    <h4 className="mt-0.5 text-xs font-extrabold text-slate-900">{reminder.title}</h4>
                    {reminder.detail && <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{reminder.detail}</p>}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1"><Clock3 size={11} />{reminder.time}</span>
                      <span>{repeatLabel(reminder)}</span>
                      <span>老人当地时间</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end border-t border-slate-100 px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => openEditor(reminder)} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[9px] font-bold text-blue-600"><Edit3 size={11} />编辑</button>
                    <button type="button" onClick={() => setDeleteTarget(reminder)} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[9px] font-bold text-rose-600"><Trash2 size={11} />删除</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="rounded-xl bg-blue-50 px-3 py-2.5 text-[10px] leading-relaxed text-blue-700">子女可以管理提醒规则，但不能替老人完成服药或事项。完成状态仅由老人操作或设备记录产生。</p>

      {editorOpen && (
        <div className="absolute inset-0 z-50 flex items-end bg-slate-950/45 backdrop-blur-[1px]">
          <section role="dialog" aria-modal="true" aria-label={editingReminder ? '编辑提醒' : '新增提醒'} className="max-h-[88%] w-full overflow-y-auto rounded-t-[28px] bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-4">
              <div><span className="text-[9px] font-bold text-blue-600">提醒事项</span><h3 className="text-base font-black text-slate-900">{editingReminder ? '编辑提醒' : '新增提醒'}</h3></div>
              <button type="button" onClick={() => setEditorOpen(false)} aria-label="关闭提醒编辑" className="rounded-full bg-slate-100 p-2 text-slate-500"><X size={16} /></button>
            </header>
            <div className="space-y-4 p-4 pb-6">
              <div className="rounded-xl bg-slate-900 p-3 text-white"><span className="text-[9px] text-slate-400">管理对象</span><strong className="mt-0.5 block text-xs">{elderName}</strong><span className="mt-1 block text-[9px] text-slate-300">以下日期和时间均按老人当地时间</span></div>
              <div>
                <span className="mb-2 block text-[10px] font-bold text-slate-600">提醒类型</span>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setDraftType('medication')} className={`rounded-xl border p-3 text-xs font-bold ${draftType === 'medication' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}><Pill size={16} className="mx-auto mb-1" />用药提醒</button>
                  <button type="button" onClick={() => setDraftType('daily')} className={`rounded-xl border p-3 text-xs font-bold ${draftType === 'daily' ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-500'}`}><CalendarDays size={16} className="mx-auto mb-1" />日常提醒</button>
                </div>
              </div>
              <label className="block"><span className="mb-1.5 block text-[10px] font-bold text-slate-600">提醒名称</span><input value={draftTitle} onChange={event => setDraftTitle(event.target.value)} maxLength={30} placeholder={draftType === 'medication' ? '例如：晚间降压药' : '例如：测量血压'} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-xs outline-none focus:border-blue-400" /></label>
              <label className="block"><span className="mb-1.5 block text-[10px] font-bold text-slate-600">补充说明（选填）</span><input value={draftDetail} onChange={event => setDraftDetail(event.target.value)} maxLength={50} placeholder="药品剂量或事项说明" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-xs outline-none focus:border-blue-400" /></label>
              <div className="grid grid-cols-2 gap-2">
                <label><span className="mb-1.5 block text-[10px] font-bold text-slate-600">开始日期</span><input type="date" value={draftDate} onChange={event => setDraftDate(event.target.value)} className="w-full rounded-xl border border-slate-200 px-2 py-3 text-xs outline-none" /></label>
                <label><span className="mb-1.5 block text-[10px] font-bold text-slate-600">提醒时间</span><input type="time" value={draftTime} onChange={event => setDraftTime(event.target.value)} className="w-full rounded-xl border border-slate-200 px-2 py-3 text-xs outline-none" /></label>
              </div>
              <div>
                <span className="mb-2 block text-[10px] font-bold text-slate-600">重复方式</span>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                  {([['once', '仅一次'], ['daily', '每天'], ['weekly', '每周']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setDraftRepeat(value)} className={`rounded-lg py-2 text-[10px] font-bold ${draftRepeat === value ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}>{label}</button>)}
                </div>
              </div>
              {draftRepeat === 'weekly' && (
                <div><span className="mb-2 block text-[10px] font-bold text-slate-600">选择星期（必选）</span><div className="grid grid-cols-7 gap-1">{weekdayOptions.map(day => { const selected = draftWeekdays.includes(day.value); return <button key={day.value} type="button" onClick={() => setDraftWeekdays(current => selected ? current.filter(value => value !== day.value) : [...current, day.value])} className={`aspect-square rounded-full text-[10px] font-bold ${selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{day.label}</button>; })}</div>{draftWeekdays.length === 0 && <p className="mt-2 text-[9px] font-semibold text-amber-700">每周提醒至少选择一个星期</p>}</div>
              )}
              <button type="button" disabled={!draftTitle.trim() || (draftRepeat === 'weekly' && draftWeekdays.length === 0)} onClick={saveReminder} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-extrabold text-white disabled:bg-slate-200 disabled:text-slate-400">{editingReminder ? '保存修改' : '创建提醒'}</button>
            </div>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5 backdrop-blur-[1px]">
          <section role="alertdialog" aria-modal="true" aria-label="删除提醒确认" className="w-full rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600"><Trash2 size={18} /></div>
            <h3 className="mt-4 text-base font-black text-slate-900">删除“{deleteTarget.title}”？</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">删除后该提醒会从当前列表移除，并且不再产生后续提醒。</p>
            {deleteError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-[10px] font-bold text-rose-700">{deleteError}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => { setDeleteTarget(null); setDeleteError(''); }} className="rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-600">取消</button><button type="button" onClick={deleteReminder} className="rounded-xl bg-rose-600 py-3 text-xs font-bold text-white">{deleteError ? '重试删除' : '确认删除'}</button></div>
          </section>
        </div>
      )}
    </div>
  );
};
