/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  Images,
  MapPin,
  Monitor,
  Phone,
  Radio,
  RefreshCw,
  ShieldCheck,
  UserRound,
  X
} from 'lucide-react';
import { ElderProfileDataScenario, ElderProfileDeviceScenario } from '../types';

interface H5ElderProfileSheetProps {
  parentProfile: typeof import('../data/mockData').initialParentProfile;
  dataScenario: ElderProfileDataScenario;
  deviceScenario: ElderProfileDeviceScenario;
  radarExpanded: boolean;
  onRadarExpandedChange: (expanded: boolean) => void;
  onRetry: () => void;
  onClose: () => void;
}

type DeviceState = 'online' | 'offline' | 'unknown';

interface RadarDevice {
  name: string;
  signal: string;
  state: DeviceState;
  lastOnline?: string;
}

const baseRadarDevices: RadarDevice[] = [
  { name: '客厅人体雷达', signal: '100%', state: 'online' },
  { name: '卧室人体雷达', signal: '96%', state: 'online' },
  { name: '卫生间人体雷达', signal: '92%', state: 'online' }
];

const getRadarDevices = (scenario: ElderProfileDeviceScenario): RadarDevice[] => {
  if (scenario === 'radar_partial_offline') {
    return baseRadarDevices.map((device, index) => (
      index === 2 ? { ...device, state: 'offline', lastOnline: '35分钟前' } : device
    ));
  }
  if (scenario === 'radar_all_offline') {
    return baseRadarDevices.map((device, index) => ({
      ...device,
      state: 'offline',
      lastOnline: `${26 + index * 7}分钟前`
    }));
  }
  if (scenario === 'status_unknown') {
    return baseRadarDevices.map(device => ({ ...device, state: 'unknown' }));
  }
  return baseRadarDevices;
};

const statusStyle: Record<DeviceState, { dot: string; badge: string; label: string }> = {
  online: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700',
    label: '在线'
  },
  offline: {
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700',
    label: '离线'
  },
  unknown: {
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600',
    label: '状态未知'
  }
};

export const H5ElderProfileSheet: React.FC<H5ElderProfileSheetProps> = ({
  parentProfile,
  dataScenario,
  deviceScenario,
  radarExpanded,
  onRadarExpandedChange,
  onRetry,
  onClose
}) => {
  const radarDevices = getRadarDevices(deviceScenario);
  const screenState: DeviceState =
    deviceScenario === 'screen_offline'
      ? 'offline'
      : deviceScenario === 'status_unknown'
        ? 'unknown'
        : 'online';
  const offlineRadarCount = radarDevices.filter(device => device.state === 'offline').length;
  const unknownRadarCount = radarDevices.filter(device => device.state === 'unknown').length;
  const onlineRadarCount = radarDevices.length - offlineRadarCount - unknownRadarCount;
  const radarGroup =
    offlineRadarCount === radarDevices.length
      ? { label: '全部离线', helper: `${radarDevices.length}台设备均未连接`, tone: 'offline' as DeviceState }
      : offlineRadarCount > 0
        ? { label: `${offlineRadarCount}台离线`, helper: `${onlineRadarCount}/${radarDevices.length}台在线`, tone: 'offline' as DeviceState }
        : unknownRadarCount > 0
          ? { label: '状态待确认', helper: `${unknownRadarCount}台状态暂未同步`, tone: 'unknown' as DeviceState }
          : { label: '运行中', helper: '覆盖3个房间：客厅／卧室／卫生间', tone: 'online' as DeviceState };

  return (
    <div className="absolute inset-0 z-[70] flex items-end bg-slate-950/55 p-2 backdrop-blur-[2px]" role="presentation" onClick={onClose}>
      <section aria-label={`${parentProfile.name}的守护档案`} className="flex max-h-[96%] w-full flex-col overflow-hidden rounded-[28px] bg-slate-50 shadow-2xl" onClick={event => event.stopPropagation()}>
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-3.5">
          <div>
            <span className="text-[10px] font-bold text-blue-600">老人档案</span>
            <h2 className="mt-0.5 text-base font-extrabold text-slate-900">{parentProfile.name}的守护档案</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭老人档案" className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><X size={17} /></button>
        </header>

        {dataScenario === 'profile_loading' ? (
          <div aria-label="档案加载中" className="flex-1 space-y-4 overflow-hidden p-4">
            <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-5 w-20 animate-pulse rounded bg-slate-200" />
            <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
            <span className="sr-only">档案加载中</span>
          </div>
        ) : dataScenario === 'profile_error' ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600"><AlertCircle size={22} /></span>
            <strong className="mt-3 text-sm text-slate-900">档案加载失败</strong>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">暂时无法获取老人档案，请稍后重新加载。</p>
            <button type="button" onClick={onRetry} className="mt-4 flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-[11px] font-bold text-white">
              <RefreshCw size={13} />重新加载
            </button>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <section className="rounded-2xl bg-slate-900 p-4 text-white shadow-sm">
              <div className="flex items-center gap-3">
                <img src={parentProfile.avatar} alt={parentProfile.name} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white/20" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><h3 className="text-base font-extrabold">{parentProfile.name}</h3><span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-200">{parentProfile.age}岁</span></div>
                  <p className="mt-1 flex items-start gap-1 text-[10px] leading-relaxed text-white/60"><MapPin size={11} className="mt-0.5 shrink-0" />{parentProfile.address || '暂无居住地址'}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-extrabold text-slate-900">绑定设备</h3>
              {dataScenario === 'device_error' ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                  <AlertCircle size={20} className="mx-auto text-slate-400" />
                  <strong className="mt-2 block text-xs text-slate-800">设备状态暂未同步</strong>
                  <p className="mt-1 text-[10px] text-slate-500">基础档案仍可正常查看</p>
                  <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600"><RefreshCw size={12} />重新加载设备状态</button>
                </div>
              ) : deviceScenario === 'no_devices' ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center">
                  <Monitor size={20} className="mx-auto text-slate-300" />
                  <strong className="mt-2 block text-xs text-slate-700">暂未绑定设备</strong>
                  <p className="mt-1 text-[10px] text-slate-400">设备绑定后将在这里显示</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${screenState === 'online' ? 'bg-blue-50 text-blue-600' : screenState === 'offline' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}><Monitor size={18} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-slate-900">14寸中控屏</strong>
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${statusStyle[screenState].badge}`}>{statusStyle[screenState].label}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {screenState === 'online'
                          ? '当前位置：客厅 · 系统版本：v2.4 最新'
                          : screenState === 'offline'
                            ? '最后位置：客厅 · 最后在线于12分钟前'
                            : '设备状态暂未同步'}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <button
                      type="button"
                      aria-expanded={radarExpanded}
                      onClick={() => onRadarExpandedChange(!radarExpanded)}
                      className="flex w-full items-center gap-3 px-3 py-3 text-left"
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${radarGroup.tone === 'online' ? 'bg-emerald-50 text-emerald-600' : radarGroup.tone === 'offline' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}><Radio size={18} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <strong className="text-xs text-slate-900">各房间人体雷达</strong>
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${statusStyle[radarGroup.tone].badge}`}>{radarGroup.label}</span>
                        </span>
                        <span className="mt-1 block text-[10px] text-slate-500">{radarGroup.helper}</span>
                      </span>
                      <ChevronDown size={15} className={`text-slate-400 transition-transform ${radarExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {radarExpanded && (
                      <div className="divide-y divide-slate-100 border-t border-slate-100 px-3">
                        {radarDevices.map(device => (
                          <div key={device.name} className="flex items-center justify-between gap-3 py-2.5 text-[10px]">
                            <span className="flex min-w-0 items-center gap-2 font-bold text-slate-700"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusStyle[device.state].dot}`} /><span className="truncate">{device.name}</span></span>
                            <span className={`shrink-0 font-bold ${device.state === 'online' ? 'text-emerald-600' : device.state === 'offline' ? 'text-rose-600' : 'text-slate-500'}`}>
                              {device.state === 'online'
                                ? `信号 ${device.signal} · 在线`
                                : device.state === 'offline'
                                  ? `离线 · ${device.lastOnline}`
                                  : '状态暂未同步'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-xs font-extrabold text-slate-900">紧急联系人</h3>
              <div className="space-y-2">
                {[['张大伟（长子）','138-xxxx-8888'],['张小静（次女）','139-xxxx-6666']].map(([name, phone], index) => (
                  <div key={name} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${index === 0 ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}><UserRound size={17} /></span><div><strong className="block text-xs text-slate-900">{name}</strong><span className="mt-1 block text-[10px] text-slate-500">{phone}</span></div></div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-extrabold text-slate-900">专属顾问</h3>
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600"><ShieldCheck size={18} /></span>
                <div className="min-w-0 flex-1"><strong className="block text-xs text-slate-900">李顾问</strong><span className="mt-1 block text-[10px] text-slate-500">孝心关怀中心</span></div>
                <button type="button" onClick={() => alert('正在联系专属顾问…')} className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white"><Phone size={12} />电话咨询</button>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-extrabold text-slate-900">守护概况</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-3"><CalendarDays size={17} className="text-blue-600" /><span className="mt-2 block text-[10px] text-slate-500">日程提醒</span><strong className="mt-0.5 block text-sm text-blue-600">已设置3项</strong></div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3"><Images size={17} className="text-rose-500" /><span className="mt-2 block text-[10px] text-slate-500">轮播相册</span><strong className="mt-0.5 block text-sm text-rose-500">已上传24张</strong></div>
              </div>
            </section>
          </div>
        )}

        <div className="shrink-0 border-t border-slate-100 bg-white p-3">
          <button type="button" onClick={onClose} className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white">收起档案</button>
        </div>
      </section>
    </div>
  );
};
