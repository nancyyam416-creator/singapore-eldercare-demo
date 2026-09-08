/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  BellRing,
  ClipboardList, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Truck, 
  Smile, 
  Clock3,
  CheckCircle2,
  PlayCircle,
  HelpCircle,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';
import { Order, ActivityLog, ReminderScenario, StoreCategoryScenario } from '../types';
import { H5ReminderManager } from './H5ReminderManager';
import { H5StoreTab } from './H5StoreTab';
import { initialParentProfile } from '../data/mockData';

interface H5OrdersTabProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  activities: ActivityLog[];
  setActivities: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  elderName: string;
  elderId: string;
  reminderScenario: ReminderScenario;
  openReminderSignal: number;
  storeCategoryScenario: StoreCategoryScenario;
  openStoreSignal: number;
  elderProject: string;
}

export const H5OrdersTab: React.FC<H5OrdersTabProps> = ({
  orders,
  setOrders,
  activities,
  setActivities,
  elderName,
  elderId,
  reminderScenario,
  openReminderSignal,
  storeCategoryScenario,
  openStoreSignal,
  elderProject
}) => {
  const [section, setSection] = useState<'reminders' | 'store' | 'services'>('reminders');

  useEffect(() => {
    if (openReminderSignal > 0) setSection('reminders');
  }, [openReminderSignal]);

  useEffect(() => {
    if (openStoreSignal > 0) setSection('store');
  }, [openStoreSignal]);

  const addActivity = (content: string, type: ActivityLog['type']) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const newLog: ActivityLog = {
      id: `act-ord-${Date.now()}`,
      time: timeStr,
      content,
      type
    };
    setActivities(prev => [newLog, ...prev]);
  };

  // Helper to advance the order status manually for interactive demonstration
  const handleAdvanceStatus = (orderId: string) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        let nextStatus: Order['status'] = ord.status;
        let logText = '';
        const now = new Date();
        const timeStr = now.getFullYear() + '-' + 
          String(now.getMonth() + 1).padStart(2, '0') + '-' + 
          String(now.getDate()).padStart(2, '0') + ' ' + 
          String(now.getHours()).padStart(2, '0') + ':' + 
          String(now.getMinutes()).padStart(2, '0');

        switch (ord.status) {
          case 'paid':
            nextStatus = 'assigning';
            logText = '匹配成功：已为您指派资深护理师【王秋萍】(5星好评)';
            addActivity(`中控屏通知：指派了资深护理师王秋萍上门服务【${ord.serviceName}】`, 'info');
            break;
          case 'assigning':
            nextStatus = 'dispatching';
            logText = '护理师王秋萍已出发，携带专业设备工具上门中，预计30分钟后到达';
            addActivity(`GPS中控位置同步：服务护理师王秋萍正在骑行上门中 🛵`, 'info');
            break;
          case 'dispatching':
            nextStatus = 'ongoing';
            logText = '护理师已上门到达长辈家，人脸识别成功，服务已正式开始';
            addActivity(`🚨 中控屏广播：养老护理师王秋萍已到达！开始提供【${ord.serviceName}】`, 'health');
            break;
          case 'ongoing':
            nextStatus = 'completed';
            logText = '服务已圆满完成！长辈在中控屏物理按键给出了 5星 好评';
            addActivity(`✅ 中控屏服务确认：【${ord.serviceName}】服务完成，长辈按键确认完毕`, 'health');
            break;
          case 'completed':
            // Reset cycle for demonstration
            nextStatus = 'paid';
            logText = '演示重新开始：已重新下单付款';
            break;
        }

        return {
          ...ord,
          status: nextStatus,
          statusLogs: [
            { time: timeStr, text: logText },
            ...ord.statusLogs
          ]
        };
      }
      return ord;
    }));
  };

  const getStatusDetails = (status: Order['status']) => {
    switch (status) {
      case 'paid':
        return { label: '已付款', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: <Clock3 size={12} /> };
      case 'assigning':
        return { label: '正在派单', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <Clock3 size={12} className="animate-pulse" /> };
      case 'dispatching':
        return { label: '护理师上门中', color: 'bg-sky-50 text-sky-650 border-sky-100', icon: <Truck size={12} className="animate-bounce" /> };
      case 'ongoing':
        return { label: '服务进行中', color: 'bg-purple-50 text-purple-650 border-purple-100', icon: <PlayCircle size={12} className="animate-spin-slow" /> };
      case 'completed':
        return { label: '服务已完成', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={12} /> };
    }
  };

  return (
    <div className="p-4 space-y-4 pb-6" id="h5-orders-tab">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1">
        <button type="button" onClick={() => setSection('reminders')} aria-pressed={section === 'reminders'} className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[10px] font-extrabold ${section === 'reminders' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}><BellRing size={14} />提醒事项</button>
        <button type="button" onClick={() => setSection('store')} aria-pressed={section === 'store'} className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[10px] font-extrabold ${section === 'store' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}><ShoppingBag size={14} />特约服务</button>
        <button type="button" onClick={() => setSection('services')} aria-pressed={section === 'services'} className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[10px] font-extrabold ${section === 'services' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}><ClipboardList size={14} />服务记录</button>
      </div>

      {section === 'reminders' ? (
        <H5ReminderManager elderName={elderName} elderId={elderId} scenario={reminderScenario} />
      ) : section === 'store' ? (
        <div className="-mx-4 -mt-2"><H5StoreTab parentProfile={initialParentProfile} elderName={elderName} elderProject={elderProject} scenario={storeCategoryScenario} onAddOrder={order => setOrders(current => [order, ...current])} onSwitchToOrders={() => setSection('services')} /></div>
      ) : (
        <>
      {/* Tab intro */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ClipboardList size={16} className="text-blue-600" />
          <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">服务与商品订单 ({orders.length})</h3>
        </div>
        <span className="text-4xs text-slate-400 font-bold">实时跟进养老服务动态</span>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-3">
          <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <ClipboardList size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-slate-700">暂无任何订单记录</h4>
            <p className="text-4xs text-slate-400 font-semibold leading-relaxed">您可以在商城为父母购买助浴、送餐、安防硬件等定制养老服务</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(ord => {
            const statusDetail = getStatusDetails(ord.status);
            return (
              <div key={ord.id} className="bg-white rounded-2xl border border-slate-100 shadow-3xs overflow-hidden animate-scale-in">
                {/* 1. Header of Card: Status */}
                <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-4xs text-slate-500 font-extrabold font-mono">订单号: {ord.id}</span>
                  </div>
                  
                  <span className={`text-5xs font-black border rounded-full px-2.5 py-0.5 flex items-center gap-1 ${statusDetail.color}`}>
                    {statusDetail.icon}
                    {statusDetail.label}
                  </span>
                </div>

                {/* 2. Main Order info */}
                <div className="p-4 space-y-3">
                  <div>
                    <span className="mb-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-bold text-blue-700">{ord.categoryNameSnapshot}</span>
                    <h4 className="font-extrabold text-xs text-slate-800 tracking-tight leading-tight">{ord.serviceName}</h4>
                    <p className="text-xs text-blue-600 font-black mt-1">付款实付: ￥{ord.price}</p>
                  </div>

                  <div className="border-t border-slate-100 pt-2.5 space-y-2">
                    <div className="flex items-start gap-1.5 text-3xs text-slate-500 font-semibold">
                      <User size={12} className="text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        服务对象：<span className="text-slate-800 font-extrabold">{ord.parentName}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 text-3xs text-slate-500 font-semibold">
                      <Calendar size={12} className="text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        预约日期：<span className="text-slate-800 font-extrabold">{ord.serviceDate} ({ord.serviceTime})</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 text-3xs text-slate-500 font-semibold">
                      <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
                      <div className="truncate" title={ord.parentAddress}>
                        服务地址：<span className="text-slate-800 font-extrabold">{ord.parentAddress}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Demo Interactive status advancer */}
                  <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/55 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-4xs font-extrabold text-blue-900 flex items-center gap-1">
                        <Smile size={12} className="text-blue-600" />
                        测试沙盒：模拟服务进度流转
                      </span>
                      <span className="text-5xs text-blue-600 bg-white border border-blue-100 px-1.5 py-0.2 rounded font-black uppercase">可交互推进</span>
                    </div>
                    <p className="text-4xs text-slate-500 leading-normal font-semibold">
                      点击下方按钮可推进订单的交付状态，并在老人中控屏及子女端同步。
                    </p>
                    <button
                      onClick={() => handleAdvanceStatus(ord.id)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white text-3xs font-extrabold py-2 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      {ord.status === 'completed' ? '🔄 重新演示流转过程' : '🚀 推进该订单至下一节点'}
                    </button>
                  </div>

                  {/* 4. Tracking Logs Timeline */}
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <span className="text-4xs text-slate-400 font-extrabold uppercase tracking-wider block">服务流转日志</span>
                    <div className="space-y-3 max-h-40 overflow-y-auto pl-1">
                      {ord.statusLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-2 relative">
                          {idx !== ord.statusLogs.length - 1 && (
                            <div className="absolute top-4 left-1.5 bottom-0 w-0.5 bg-slate-100 -translate-x-1/2"></div>
                          )}
                          <div className={`w-3 h-3 rounded-full shrink-0 mt-0.5 relative z-10 flex items-center justify-center ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                            <span className="w-1 h-1 rounded-full bg-white"></span>
                          </div>
                          <div className="space-y-0.5 flex-1">
                            <p className={`text-4xs leading-relaxed ${idx === 0 ? 'text-slate-800 font-extrabold' : 'text-slate-500 font-semibold'}`}>
                              {log.text}
                            </p>
                            <span className="text-5xs font-mono font-bold text-slate-450 block">{log.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
};
