/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, ChevronRight, MapPin } from 'lucide-react';
import { ElderStatusCardScenario } from '../types';

interface H5ElderStatusCardProps {
  parentProfile: typeof import('../data/mockData').initialParentProfile;
  currentLocation: string;
  scenario: ElderStatusCardScenario;
  onOpenProfile: () => void;
  children?: React.ReactNode;
}

const scenarioCopy: Record<ElderStatusCardScenario, {
  alert?: string;
  location?: string;
  updatedAt: string;
  tone: 'normal' | 'warning' | 'empty';
}> = {
  normal: {
    updatedAt: '更新于 1 分钟前',
    tone: 'normal'
  },
  device_offline: {
    alert: '14寸中控屏离线，请检查网络或电源',
    updatedAt: '更新于 1 分钟前',
    tone: 'warning'
  },
  location_empty: {
    alert: '暂未获取到老人位置',
    location: '暂无位置',
    updatedAt: '等待首次上报',
    tone: 'empty'
  }
};

export const H5ElderStatusCard: React.FC<H5ElderStatusCardProps> = ({
  parentProfile,
  currentLocation,
  scenario,
  onOpenProfile,
  children
}) => {
  const state = scenarioCopy[scenario];
  const location = state.location ?? currentLocation;

  return (
    <section aria-label="老人状态卡" data-scenario={scenario} className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-slate-300/50">
      {state.alert && (
        <div className="mb-3 flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-2.5 py-2 text-[10px] font-bold text-amber-200">
          <AlertCircle size={13} className="shrink-0" />
          <span>{state.alert}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img src={parentProfile.avatar} alt={parentProfile.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-emerald-500" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-slate-900 bg-emerald-400" aria-label="老人在线" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <strong className="truncate text-lg font-extrabold text-white">{parentProfile.name}</strong>
            <span className="shrink-0 text-[11px] font-semibold text-white/55">（{parentProfile.age}岁）</span>
          </div>
          <div className="mt-1.5 flex min-w-0 items-center gap-1 text-[11px] font-semibold text-white/55">
            <MapPin size={13} className={`shrink-0 ${state.tone === 'normal' ? 'text-emerald-400' : state.tone === 'warning' ? 'text-amber-300' : 'text-slate-400'}`} />
            <span className={`shrink-0 font-bold ${state.tone === 'empty' ? 'text-white/60' : 'text-white/85'}`}>位置：{location}</span>
            <span className="text-white/25">·</span>
            <span className="truncate">{state.updatedAt}</span>
          </div>
        </div>

        <button type="button" onClick={onOpenProfile} aria-label={`查看${parentProfile.name}的老人档案`} className="flex shrink-0 items-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-bold text-white/75 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          老人档案<ChevronRight size={13} />
        </button>
      </div>

      {children}
    </section>
  );
};
