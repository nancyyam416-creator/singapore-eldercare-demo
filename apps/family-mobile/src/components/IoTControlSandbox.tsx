/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Activity, 
  MapPin, 
  Flame, 
  Heart, 
  Clock, 
  AlertTriangle, 
  Check, 
  X,
  Plus,
  Droplet,
  Compass,
  Cpu,
  Tv,
  Sparkles,
  RefreshCw,
  Bell
} from 'lucide-react';
import { Medication, HealthStats, ActivityLog } from '../types';

interface IoTControlSandboxProps {
  healthStats: HealthStats;
  setHealthStats: React.Dispatch<React.SetStateAction<HealthStats>>;
  medications: Medication[];
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
  activities: ActivityLog[];
  setActivities: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  triggerEmergencyAlert: (msg: string) => void;
  clearEmergencyAlert: () => void;
  hasActiveAlert: boolean;
}

export const IoTControlSandbox: React.FC<IoTControlSandboxProps> = ({
  healthStats,
  setHealthStats,
  medications,
  setMedications,
  activities,
  setActivities,
  triggerEmergencyAlert,
  clearEmergencyAlert,
  hasActiveAlert
}) => {
  const [activePanelTab, setActivePanelTab] = useState<'safety' | 'vitals' | 'meds'>('safety');

  const addActivity = (content: string, type: ActivityLog['type']) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const newLog: ActivityLog = {
      id: `act-sim-${Date.now()}`,
      time: timeStr,
      content,
      type
    };
    setActivities(prev => [newLog, ...prev]);
  };

  const handleLocationChange = (loc: string) => {
    setHealthStats(prev => ({ ...prev, location: loc }));
    addActivity(`物联网空间雷达：长辈移动到了【${loc}】`, 'info');
  };

  const toggleMedication = (id: string, currentStatus: Medication['status']) => {
    setMedications(prev => prev.map(med => {
      if (med.id === id) {
        if (currentStatus === 'taken') {
          return { ...med, status: 'untaken', takenTime: undefined };
        } else {
          const now = new Date();
          const takenTimeStr = now.toTimeString().slice(0, 5);
          addActivity(`智能服药盒：长辈按时服用【${med.name}】✅`, 'medication');
          return { ...med, status: 'taken', takenTime: takenTimeStr };
        }
      }
      return med;
    }));
  };

  const handleMissMedication = (id: string) => {
    setMedications(prev => prev.map(med => {
      if (med.id === id) {
        addActivity(`智能服药盒：【${med.name}】今日服药超时，系统标记为“漏服” ❌`, 'warning');
        return { ...med, status: 'missed', takenTime: undefined };
      }
      return med;
    }));
  };

  const handleWalk = () => {
    const walkSteps = 500;
    setHealthStats(prev => {
      const nextSteps = prev.steps + walkSteps;
      addActivity(`智能定位手环：同步到步行步数 +${walkSteps}，当前累计：${nextSteps}步 🏃‍♂️`, 'health');
      return { ...prev, steps: nextSteps };
    });
  };

  const handleRandomHeartRate = () => {
    const min = 65;
    const max = 95;
    const randomHr = Math.floor(Math.random() * (max - min + 1)) + min;
    setHealthStats(prev => {
      addActivity(`智能心率表：实时心率传感器同步，心率更新为 ${randomHr} bpm`, 'health');
      return { ...prev, heartRate: randomHr, heartRateStatus: 'normal' };
    });
  };

  const handleSimulateGlucose = () => {
    addActivity("无线血糖仪：老人家录入空腹血糖数据 6.4 mmol/L（平稳）🩸", 'health');
  };

  return (
    <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-xs w-full max-w-md space-y-5" id="iot-sandbox-control">
      {/* 1. Sandbox Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <Cpu size={16} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">智能设备数据仿真沙盒</h3>
            <p className="text-5xs text-slate-400 font-extrabold uppercase">模拟长辈在家中物联网设备的各种动态变化</p>
          </div>
        </div>
        <span className="text-5xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-black animate-pulse">
          仿真网关连接正常
        </span>
      </div>

      {/* 2. Mini Tab Toggles */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button
          onClick={() => setActivePanelTab('safety')}
          className={`flex-1 py-1.5 rounded-lg text-4xs font-black uppercase transition-colors flex items-center justify-center gap-1 cursor-pointer ${activePanelTab === 'safety' ? 'bg-white text-blue-600 shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Bell size={12} />
          安防与紧急求救
        </button>
        <button
          onClick={() => setActivePanelTab('vitals')}
          className={`flex-1 py-1.5 rounded-lg text-4xs font-black uppercase transition-colors flex items-center justify-center gap-1 cursor-pointer ${activePanelTab === 'vitals' ? 'bg-white text-blue-600 shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Activity size={12} />
          体征与位置
        </button>
        <button
          onClick={() => setActivePanelTab('meds')}
          className={`flex-1 py-1.5 rounded-lg text-4xs font-black uppercase transition-colors flex items-center justify-center gap-1 cursor-pointer ${activePanelTab === 'meds' ? 'bg-white text-blue-600 shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Clock size={12} />
          用药药盒打卡
        </button>
      </div>

      {/* 3. Panel Body */}
      <div className="min-h-[180px] bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between">
        
        {/* TAB 1: SAFETY / EMERGENCY ALARM */}
        {activePanelTab === 'safety' && (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-5xs text-slate-400 font-extrabold uppercase">1. 选择跌倒或水侵高危险警报触发：</span>
              <p className="text-4xs text-slate-500 leading-relaxed font-semibold">
                触发后，子女端H5手机App将瞬间弹出红色高音量警报窗口，展示位置定位，并记录求救轨迹。
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  handleLocationChange('洗手间');
                  triggerEmergencyAlert("防摔毫米波雷达探测到长辈在【洗手间】停留超过25分钟且无任何肢体动作，判断突发跌倒滑倒！中控高分贝警报已鸣响，自动通知小区网格长。");
                }}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white text-3xs font-extrabold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-rose-600/10 transition-colors cursor-pointer"
              >
                <AlertTriangle size={14} />
                🚨 模拟洗手间：突发跌倒求救
              </button>

              <button
                onClick={() => {
                  handleLocationChange('厨房');
                  triggerEmergencyAlert("智能厨房水浸传感器发现大量漫水积水（深度超1.5cm）！地面湿滑导致长辈有极其严重的摔伤隐患，请电话确认并叮嘱老人切勿进入！");
                }}
                className="w-full bg-amber-500 hover:bg-amber-450 text-white text-3xs font-extrabold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/10 transition-colors cursor-pointer"
              >
                <Droplet size={14} className="fill-white" />
                ⚠️ 模拟厨房：溢水滑倒安全预警
              </button>

              {hasActiveAlert && (
                <button
                  onClick={clearEmergencyAlert}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-3xs font-extrabold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-1"
                >
                  <Check size={14} />
                  解除仿真警报 (恢复正常体征)
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: VITALS & LOCATION */}
        {activePanelTab === 'vitals' && (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-5xs text-slate-400 font-extrabold uppercase block">1. 模拟长辈在房间内行走移动：</span>
              <div className="grid grid-cols-4 gap-1.5">
                {['客厅', '卧室', '厨房', '洗手间'].map(loc => (
                  <button
                    key={loc}
                    onClick={() => handleLocationChange(loc)}
                    className={`text-4xs py-1.5 px-1 rounded-lg border font-bold transition-all cursor-pointer ${healthStats.location === loc ? 'bg-blue-600 border-blue-600 text-white shadow-3xs' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200/60 pt-3 space-y-2">
              <span className="text-5xs text-slate-400 font-extrabold uppercase block">2. 模拟手环健康传感器数据更新：</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleWalk}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-4xs font-bold py-2 rounded-xl flex flex-col items-center gap-1 shadow-3xs transition-all cursor-pointer"
                >
                  <Flame size={12} className="text-orange-500" />
                  <span>步行 +500步</span>
                </button>

                <button
                  onClick={handleRandomHeartRate}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-4xs font-bold py-2 rounded-xl flex flex-col items-center gap-1 shadow-3xs transition-all cursor-pointer"
                >
                  <Heart size={12} className="text-rose-500" />
                  <span>测实时心率</span>
                </button>

                <button
                  onClick={handleSimulateGlucose}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-4xs font-bold py-2 rounded-xl flex flex-col items-center gap-1 shadow-3xs transition-all cursor-pointer"
                >
                  <Activity size={12} className="text-blue-500" />
                  <span>录入新血糖</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MEDICATION MEDICINE BOX */}
        {activePanelTab === 'meds' && (
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-5xs text-slate-400 font-extrabold uppercase block">1. 模拟智能服药盒的硬件确认：</span>
              <p className="text-4xs text-slate-500 font-semibold leading-normal">
                老人家在卧室吃完药后，可通过物理按键/打开药格自动确认。状态会同步上报到子女H5用药页面。
              </p>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-40 pr-1">
              {medications.map(med => (
                <div key={med.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h5 className="text-4xs font-extrabold text-slate-700 truncate">{med.name}</h5>
                    <span className="text-5xs text-slate-400 font-bold block">{med.timeStr} • {med.dosage}</span>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleMedication(med.id, med.status)}
                      className={`text-5xs font-black px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${med.status === 'taken' ? 'bg-emerald-500 border-emerald-500 text-white shadow-3xs' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}
                    >
                      {med.status === 'taken' ? '已服用' : '模拟服药'}
                    </button>
                    {med.status !== 'taken' && (
                      <button
                        onClick={() => handleMissMedication(med.id)}
                        disabled={med.status === 'missed'}
                        className={`text-5xs font-black px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${med.status === 'missed' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}
                      >
                        模拟超时漏服
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
