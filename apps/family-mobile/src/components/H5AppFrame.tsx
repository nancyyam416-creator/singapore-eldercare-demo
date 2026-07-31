/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Heart, 
  ShoppingBag, 
  ClipboardList, 
  UserRound,
  Wifi, 
  Signal, 
  Battery, 
  Phone, 
  AlertOctagon, 
  AlertTriangle,
  MapPin,
  Flame,
  Moon,
  Info,
  X,
  Compass,
  ArrowRight,
  House,
  AudioWaveform,
  ImagePlus,
  Settings2
} from 'lucide-react';
import {
  Medication,
  HealthStats,
  ActivityLog,
  Order,
  HomeCareScenario,
  HomeActivityScenario,
  FamilyReceiptScenario,
  FamilyMessageScenario,
  FamilyPhotoScenario,
  FamilyReceiptFilter,
  CareFeedScenario,
  ElderStatusCardScenario,
  ReassuranceScoreScenario,
  ElderProfileDataScenario,
  ElderProfileDeviceScenario,
  PublishedPhotoBatch,
  BoundElder,
  ElderBindingScenario,
  ReminderScenario,
  ChildLoginScenario
} from '../types';
import { initialBoundElders, initialChildResidenceAddress, initialFamilyConversations, initialFamilyMessages, initialPublishedPhotoBatches } from '../data/mockData';
import { H5MonitorTab } from './H5MonitorTab';
import { FamilySection, H5FamilyTab } from './H5FamilyTab';
import { H5PhotoShareSheet } from './H5PhotoShareSheet';
import { H5OrdersTab } from './H5OrdersTab';
import { H5ProfileTab } from './H5ProfileTab';
import { H5ElderProfileSheet } from './H5ElderProfileSheet';
import { H5LoginPage } from './H5LoginPage';

interface H5AppFrameProps {
  parentProfile: typeof import('../data/mockData').initialParentProfile;
  healthStats: HealthStats;
  setHealthStats: React.Dispatch<React.SetStateAction<HealthStats>>;
  medications: Medication[];
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
  activities: ActivityLog[];
  setActivities: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  emergencyAlert: string | null;
  setEmergencyAlert: (msg: string | null) => void;
  homeCareScenario: HomeCareScenario;
  homeActivityScenario: HomeActivityScenario;
  familyReceiptScenario: FamilyReceiptScenario;
  familyMessageScenario: FamilyMessageScenario;
  familyPhotoScenario: FamilyPhotoScenario;
  careFeedScenario: CareFeedScenario;
  elderStatusCardScenario: ElderStatusCardScenario;
  reassuranceScoreScenario: ReassuranceScoreScenario;
  elderProfileDataScenario: ElderProfileDataScenario;
  elderProfileDeviceScenario: ElderProfileDeviceScenario;
  elderProfileRadarExpanded: boolean;
  setElderProfileRadarExpanded: (expanded: boolean) => void;
  onRetryElderProfile: () => void;
  previewOpenElderProfileSignal: number;
  previewCloseElderProfileSignal: number;
  previewOpenScoreDetailsSignal: number;
  previewCloseScoreDetailsSignal: number;
  previewOpenFamilyReceiptsSignal: number;
  previewOpenFamilyMessagesSignal: number;
  previewOpenFamilyPhotosSignal: number;
  previewOpenHomeSignal: number;
  previewCloseFamilyReceiptsSignal: number;
  previewFamilyReceiptFilter: FamilyReceiptFilter;
  previewCompleteFamilyVoiceSignal: number;
  previewOpenMedicationDetailsSignal: number;
  previewResetSignal: number;
  previewOpenProfileSignal: number;
  reminderScenario: ReminderScenario;
  previewOpenRemindersSignal: number;
  previewOpenLoginSignal: number;
  loginScenario: ChildLoginScenario;
  elderBindingScenario: ElderBindingScenario;
  onPreviewContextChange?: (
    page: 'login' | 'home' | 'family' | 'care' | 'profile',
    familyModule?: 'family_messages' | 'family_photos'
  ) => void;
}

export const H5AppFrame: React.FC<H5AppFrameProps> = ({
  parentProfile,
  healthStats,
  setHealthStats,
  medications,
  setMedications,
  activities,
  setActivities,
  orders,
  setOrders,
  emergencyAlert,
  setEmergencyAlert,
  homeCareScenario,
  homeActivityScenario,
  familyReceiptScenario,
  familyMessageScenario,
  familyPhotoScenario,
  careFeedScenario,
  elderStatusCardScenario,
  reassuranceScoreScenario,
  elderProfileDataScenario,
  elderProfileDeviceScenario,
  elderProfileRadarExpanded,
  setElderProfileRadarExpanded,
  onRetryElderProfile,
  previewOpenElderProfileSignal,
  previewCloseElderProfileSignal,
  previewOpenScoreDetailsSignal,
  previewCloseScoreDetailsSignal,
  previewOpenFamilyReceiptsSignal,
  previewOpenFamilyMessagesSignal,
  previewOpenFamilyPhotosSignal,
  previewOpenHomeSignal,
  previewCloseFamilyReceiptsSignal,
  previewFamilyReceiptFilter,
  previewCompleteFamilyVoiceSignal,
  previewOpenMedicationDetailsSignal,
  previewResetSignal,
  previewOpenProfileSignal,
  reminderScenario,
  previewOpenRemindersSignal,
  previewOpenLoginSignal,
  loginScenario,
  elderBindingScenario,
  onPreviewContextChange
}) => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'store' | 'orders' | 'profile'>('monitor');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCallingParent, setIsCallingParent] = useState(false);
  const [showElderProfile, setShowElderProfile] = useState(false);
  const [residenceAddress, setResidenceAddress] = useState(initialChildResidenceAddress);
  const [familyMessages, setFamilyMessages] = useState(initialFamilyMessages);
  const [showPhotoShare, setShowPhotoShare] = useState(false);
  const [photoShareMounted, setPhotoShareMounted] = useState(false);
  const [familySection, setFamilySection] = useState<FamilySection>('messages');
  const [boundElders, setBoundElders] = useState<BoundElder[]>(initialBoundElders);
  const [currentElderId, setCurrentElderId] = useState<string | null>(initialBoundElders[0]?.id ?? null);
  const [initialFamilyConversationId, setInitialFamilyConversationId] = useState<string | null>(null);
  const [photoBatches, setPhotoBatches] = useState<PublishedPhotoBatch[]>(initialPublishedPhotoBatches);
  const latestPhotoFeedback = useMemo(() => {
    const latestLikedBatch = [...photoBatches]
      .filter(batch => batch.feedback === 'liked')
      .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())[0];
    return latestLikedBatch
      ? {
          elderName: latestLikedBatch.elderName,
          photoCount: latestLikedBatch.items.filter(item => item.type === 'photo').length,
          videoCount: latestLikedBatch.items.filter(item => item.type === 'video').length,
          category: latestLikedBatch.category,
          feedback: latestLikedBatch.feedback
        }
      : null;
  }, [photoBatches]);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const scopedFamilyMessages = familyMessageScenario === 'multi_elder'
    ? familyMessages
    : familyMessages.filter(message => message.conversationId === initialFamilyConversations[0]?.id);
  const unreadFamilyCount = scopedFamilyMessages.filter(message => message.sender === 'elder' && message.status === 'delivered').length;
  const currentBoundElder = boundElders.find(elder => elder.id === currentElderId) ?? boundElders[0];
  const currentParentProfile = currentBoundElder
    ? { ...parentProfile, name: currentBoundElder.name, age: currentBoundElder.age, avatar: currentBoundElder.avatar }
    : parentProfile;

  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  useEffect(() => {
    if (!isLoggedIn) {
      onPreviewContextChange?.('login');
    } else if (activeTab === 'monitor') {
      onPreviewContextChange?.('home');
    } else if (activeTab === 'store') {
      onPreviewContextChange?.(
        'family',
        familySection === 'messages' ? 'family_messages' : 'family_photos'
      );
    } else if (activeTab === 'orders') {
      onPreviewContextChange?.('care');
    } else if (activeTab === 'profile') {
      onPreviewContextChange?.('profile');
    }
  }, [activeTab, familySection, isLoggedIn, onPreviewContextChange]);

  useEffect(() => {
    if (previewOpenLoginSignal > 0) {
      setIsLoggedIn(false);
      setShowElderProfile(false);
      setShowPhotoShare(false);
    }
  }, [previewOpenLoginSignal]);

  useEffect(() => {
    if (previewOpenProfileSignal > 0) setActiveTab('profile');
  }, [previewOpenProfileSignal]);

  useEffect(() => {
    if (previewOpenRemindersSignal > 0) setActiveTab('orders');
  }, [previewOpenRemindersSignal]);

  const handleBindElder = (elder: BoundElder) => {
    if (boundElders.some(item => item.id === elder.id)) return false;
    setBoundElders(current => [...current, elder]);
    setCurrentElderId(elder.id);
    return true;
  };

  const enterElderHome = (elderId: string) => {
    setCurrentElderId(elderId);
    setActiveTab('monitor');
  };

  useEffect(() => {
    if (previewOpenElderProfileSignal > 0) {
      setActiveTab('monitor');
      setElderProfileRadarExpanded(true);
      setShowElderProfile(true);
    }
  }, [previewOpenElderProfileSignal, setElderProfileRadarExpanded]);

  useEffect(() => {
    if (previewCloseElderProfileSignal > 0) {
      setShowElderProfile(false);
    }
  }, [previewCloseElderProfileSignal]);

  useEffect(() => {
    if (previewResetSignal > 0) {
      setActiveTab('monitor');
      setShowElderProfile(false);
      setShowPhotoShare(false);
      setPhotoShareMounted(false);
      contentScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [previewResetSignal]);

  useEffect(() => {
    if (previewOpenFamilyMessagesSignal > 0) {
      setFamilySection('messages');
      setInitialFamilyConversationId(familyMessageScenario === 'multi_elder' ? null : initialFamilyConversations[0]?.id ?? null);
      setActiveTab('store');
    }
  }, [previewOpenFamilyMessagesSignal, familyMessageScenario]);

  useEffect(() => {
    if (previewOpenFamilyPhotosSignal > 0) {
      setFamilySection('photos');
      setActiveTab('store');
      const shouldOpenComposer = !familyPhotoScenario.startsWith('list_');
      setPhotoShareMounted(shouldOpenComposer);
      setShowPhotoShare(shouldOpenComposer);
    }
  }, [previewOpenFamilyPhotosSignal, familyPhotoScenario]);

  const openPhotoShare = () => {
    setPhotoShareMounted(true);
    setShowPhotoShare(true);
  };

  useEffect(() => {
    if (previewOpenHomeSignal > 0) {
      setActiveTab('monitor');
      setShowElderProfile(false);
      contentScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [previewOpenHomeSignal]);

  const addActivity = (content: string, type: ActivityLog['type']) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const newLog: ActivityLog = {
      id: `act-h5-${Date.now()}`,
      time: timeStr,
      content,
      type
    };
    setActivities(prev => [newLog, ...prev]);
  };

  const handleAddOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    addActivity(`子女端APP：成功在线支付预约了【${newOrder.serviceName}】服务`, 'info');
  };

  const handleDismissAlert = () => {
    setEmergencyAlert(null);
    setHealthStats(prev => ({ ...prev, heartRate: 72, heartRateStatus: 'normal' }));
    addActivity("子女端APP：子女已在APP上查看并手动“解除紧急跌倒警告” 🟢", 'info');
  };

  const handleMockCall = () => {
    setIsCallingParent(true);
    setTimeout(() => {
      setIsCallingParent(false);
      alert(`已接通长辈智能中控屏！目前正处于免提对讲，并已开启中控屏摄像头。`);
    }, 1200);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setActiveTab(elderBindingScenario === 'no_elder' ? 'profile' : 'monitor');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('monitor');
  };

  return (
    <div className="w-full sm:max-w-[450px] h-[100dvh] sm:h-[1200px] bg-slate-950 rounded-none sm:rounded-[48px] p-0 sm:p-3 shadow-none sm:shadow-2xl relative border-0 sm:border-4 border-slate-800 shrink-0" id="h5-phone-simulator">
      {/* 1. Phone Top Camera notch */}
      <div className="hidden sm:flex absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-950 rounded-full items-center justify-center z-50">
        <div className="w-3 h-3 bg-slate-900 rounded-full border border-slate-800 ml-1"></div>
        <div className="w-12 h-1 bg-slate-900 rounded-full mx-auto"></div>
      </div>

      {/* 2. Main Phone Screen content */}
      <div id="h5-phone-screen" className="w-full h-full bg-slate-50 rounded-none sm:rounded-[38px] overflow-hidden flex flex-col relative border-0 sm:border border-slate-900">
        
        {/* Mock OS Status Bar */}
        <div className="hidden sm:flex h-10 bg-white items-center justify-between px-6 shrink-0 z-40">
          <span className="text-2xs font-bold text-slate-800">{homeCareScenario === 'medication_overdue' ? '22:10' : '18:26'}</span>
          <div className="flex items-center gap-1.5 text-slate-800">
            <Signal size={12} />
            <span className="text-4xs font-bold font-mono">5G</span>
            <Wifi size={12} />
            <Battery size={14} className="text-slate-800" />
          </div>
        </div>

        {/* App page title */}
        <header className="relative z-30 flex h-11 shrink-0 items-center justify-center border-b border-slate-100 bg-white px-4 shadow-3xs">
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900">{!isLoggedIn ? '登录' : activeTab === 'monitor' ? '安心看' : activeTab === 'store' ? '亲情连' : activeTab === 'orders' ? '代管家' : '我的'}</h1>
        </header>

        {/* 3. APP SCREEN WRAPPER WITH ABSOLUTE ALERT OVERLAYS */}
        <div ref={contentScrollRef} className="flex-1 overflow-y-auto relative min-h-0 bg-slate-50">
          
          {/* CRITICAL EMERGENCY ALARM POPUP OVERLAY */}
          {isLoggedIn && emergencyAlert && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-2xl max-w-sm text-center space-y-4 animate-scale-in">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <AlertOctagon size={24} className="stroke-[2.5]" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-sm text-rose-600">🚨 长辈突发跌倒预警 🚨</h3>
                  <p className="text-3xs text-slate-600 leading-relaxed font-semibold">
                    {emergencyAlert}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left space-y-1 text-4xs text-slate-500">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>中控报警器：</span>
                    <span className="text-rose-500">已拉响高分贝警报</span>
                  </div>
                  <div className="flex justify-between">
                    <span>自动安全通告：</span>
                    <span className="text-emerald-600">已调度网格长上门确认</span>
                  </div>
                  <div className="flex justify-between">
                    <span>长辈环境定位：</span>
                    <span className="text-blue-600 font-extrabold">洗手间</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleMockCall}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white text-3xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/10 transition-colors"
                  >
                    <Phone size={12} className="fill-white" />
                    立即一键回拨中控屏对讲
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => alert('已指派呼叫系统，自动协助向 120 急救中心发送老人定位、病史(高血压、糖尿病)及子女联系方式...')}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-4xs font-bold py-2 rounded-xl transition-colors"
                    >
                      协助呼叫 120
                    </button>
                    <button
                      onClick={handleDismissAlert}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-4xs font-bold py-2 rounded-xl transition-colors border border-slate-200"
                    >
                      解除误报
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RENDERING ACTIVE TAB VIEW */}
          {!isLoggedIn && (
            <H5LoginPage scenario={loginScenario} onLoginSuccess={handleLogin} />
          )}

          {isLoggedIn && activeTab === 'monitor' && (
            <H5MonitorTab 
              healthStats={healthStats}
              setHealthStats={setHealthStats}
              medications={medications}
              setMedications={setMedications}
              activities={activities}
              setActivities={setActivities}
              orders={orders}
              parentProfile={currentParentProfile}
              onSwitchToOrders={() => setActiveTab('orders')}
              onOpenElderProfile={() => {
                setElderProfileRadarExpanded(true);
                setShowElderProfile(true);
              }}
              onOpenPhotoShare={openPhotoShare}
              onOpenFamilyPhotos={() => {
                setFamilySection('photos');
                setActiveTab('store');
              }}
              onOpenFamilyMessages={() => {
                const latestUnread = [...scopedFamilyMessages]
                  .filter(message => message.sender === 'elder' && message.status === 'delivered')
                  .sort((left, right) => new Date(right.sentAtUtc).getTime() - new Date(left.sentAtUtc).getTime())[0];
                setInitialFamilyConversationId(latestUnread?.conversationId ?? initialFamilyConversations[0]?.id ?? null);
                setFamilySection('messages');
                setActiveTab('store');
              }}
              familyMessages={scopedFamilyMessages}
              latestPhotoFeedback={latestPhotoFeedback}
              homeCareScenario={homeCareScenario}
              homeActivityScenario={homeActivityScenario}
              familyReceiptScenario={familyReceiptScenario}
              careFeedScenario={careFeedScenario}
              elderStatusCardScenario={elderStatusCardScenario}
              reassuranceScoreScenario={reassuranceScoreScenario}
              previewOpenScoreDetailsSignal={previewOpenScoreDetailsSignal}
              previewCloseScoreDetailsSignal={previewCloseScoreDetailsSignal}
              previewOpenFamilyReceiptsSignal={previewOpenFamilyReceiptsSignal}
              previewCloseFamilyReceiptsSignal={previewCloseFamilyReceiptsSignal}
              previewFamilyReceiptFilter={previewFamilyReceiptFilter}
              previewCompleteFamilyVoiceSignal={previewCompleteFamilyVoiceSignal}
              previewOpenMedicationDetailsSignal={previewOpenMedicationDetailsSignal}
              previewResetSignal={previewResetSignal}
            />
          )}

          {isLoggedIn && activeTab === 'store' && (
            <H5FamilyTab
              conversations={initialFamilyConversations}
              messages={scopedFamilyMessages}
              photoBatches={photoBatches}
              activeSection={familySection}
              messageScenario={familyMessageScenario}
              photoScenario={familyPhotoScenario}
              initialConversationId={initialFamilyConversationId}
              onSectionChange={setFamilySection}
              onOpenPhotoShare={openPhotoShare}
              onMessagesChange={setFamilyMessages}
              onContactElder={handleMockCall}
            />
          )}

          {isLoggedIn && activeTab === 'orders' && (
            <H5OrdersTab 
              orders={orders}
              setOrders={setOrders}
              activities={activities}
              setActivities={setActivities}
              elderName={currentParentProfile.name}
              elderId={currentBoundElder?.id ?? 'elder-1'}
              reminderScenario={reminderScenario}
              openReminderSignal={previewOpenRemindersSignal}
            />
          )}

          {isLoggedIn && activeTab === 'profile' && (
            <H5ProfileTab
              isLoggedIn={isLoggedIn}
              onLogin={handleLogin}
              onLogout={handleLogout}
              residenceAddress={residenceAddress}
              onSaveResidenceAddress={setResidenceAddress}
              boundElders={elderBindingScenario === 'no_elder' ? [] : boundElders}
              currentElderId={currentElderId}
              bindingScenario={elderBindingScenario}
              onBindElder={handleBindElder}
              onSwitchElder={setCurrentElderId}
              onEnterElderHome={enterElderHome}
            />
          )}

        </div>

        {isLoggedIn && activeTab === 'store' && familySection === 'photos' && (
          <button
            type="button"
            onClick={openPhotoShare}
            className="absolute bottom-20 right-4 z-40 flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500"
          >
            <ImagePlus size={16} />
            发照片或视频
          </button>
        )}

        {isLoggedIn && showElderProfile && (
          <H5ElderProfileSheet
            parentProfile={currentParentProfile}
            dataScenario={elderProfileDataScenario}
            deviceScenario={elderProfileDeviceScenario}
            radarExpanded={elderProfileRadarExpanded}
            onRadarExpandedChange={setElderProfileRadarExpanded}
            onRetry={onRetryElderProfile}
            onClose={() => setShowElderProfile(false)}
          />
        )}

        {isLoggedIn && photoShareMounted && (
          <H5PhotoShareSheet
            key={familyPhotoScenario}
            elderNames={['爸爸']}
            demoScenario={familyPhotoScenario}
            isOpen={showPhotoShare}
            onClose={() => setShowPhotoShare(false)}
            onPublished={(batch) => {
              setPhotoBatches(previous => [batch, ...previous.filter(item => item.id !== batch.id)]);
            }}
            onContactElder={() => {
              setShowPhotoShare(false);
              handleMockCall();
            }}
          />
        )}

        {/* 4. IOS Elegant Bottom Navigation Tabs bar */}
        {isLoggedIn && <nav className="h-16 bg-white border-t border-slate-150 flex items-center justify-around px-2 shrink-0 z-40 pb-2">
          <button
            onClick={() => setActiveTab('monitor')}
            disabled={!isLoggedIn}
            className={`flex flex-col items-center justify-center flex-1 gap-1 h-full transition-colors ${activeTab === 'monitor' ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <House size={18} className={activeTab === 'monitor' ? 'stroke-[2.5]' : ''} />
            <span className="text-5xs font-extrabold tracking-tight">安心看</span>
          </button>

          <button
            onClick={() => setActiveTab('store')}
            disabled={!isLoggedIn}
            className={`flex flex-col items-center justify-center flex-1 gap-1 h-full transition-colors ${activeTab === 'store' ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span className="relative"><AudioWaveform size={18} className={activeTab === 'store' ? 'stroke-[2.5]' : ''} />{unreadFamilyCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white">{unreadFamilyCount}</span>}</span>
            <span className="text-5xs font-extrabold tracking-tight">亲情连</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            disabled={!isLoggedIn}
            className={`flex flex-col items-center justify-center flex-1 gap-1 h-full transition-colors ${activeTab === 'orders' ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Settings2 size={18} className={activeTab === 'orders' ? 'stroke-[2.5]' : ''} />
            <span className="text-5xs font-extrabold tracking-tight">代管家</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center flex-1 gap-1 h-full transition-colors ${activeTab === 'profile' ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <UserRound size={18} className={activeTab === 'profile' ? 'stroke-[2.5]' : ''} />
            <span className="text-5xs font-extrabold tracking-tight">我的</span>
          </button>
        </nav>}

        {/* iOS physical bottom bar pill */}
        <div className="hidden sm:block h-1 bg-slate-300 w-32 mx-auto rounded-full mb-1 shrink-0"></div>
      </div>
    </div>
  );
};
