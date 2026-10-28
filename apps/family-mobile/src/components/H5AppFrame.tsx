/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AssistanceScenario, assistanceForElder, assistanceRevision, createAssistanceEvents, hasViewedAssistance, initialAssistanceViews, markAssistanceViewed } from '../data/onlineAssistance';
import { AssistanceHomeSummary, AssistanceNoticeEntry, H5OnlineAssistance } from './H5OnlineAssistance';
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
  MessageCircle,
  BellRing,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
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
  FamilyCallScenario,
  FamilyPhotoScenario,
  FamilyReceiptFilter,
  CareFeedScenario,
  ElderStatusCardScenario,
  ReassuranceScoreScenario,
  ElderProfileDataScenario,
  ElderProfileDeviceScenario,
  PublishedPhotoBatch,
  PhotoRecipientOption,
  FamilyNotification,
  FamilyConversation,
  BoundElder,
  ElderBindingScenario,
  ReminderScenario,
  ChildLoginScenario,
  StoreCategoryScenario
} from '../types';
import { initialBoundElders, initialChildResidenceAddress, initialFamilyConversations, initialFamilyMessages, initialFamilyNotifications, initialPublishedPhotoBatches } from '../data/mockData';
import { H5MonitorTab } from './H5MonitorTab';
import { FamilySection, H5FamilyTab } from './H5FamilyTab';
import { createBindingState, familyBindingReducer, getBoundElders } from '../data/familyBinding';
import { H5PhotoShareSheet } from './H5PhotoShareSheet';
import { H5OrdersTab } from './H5OrdersTab';
import { H5ProfileTab } from './H5ProfileTab';
import { H5ReminderManager } from './H5ReminderManager';
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
  familyCallScenario: FamilyCallScenario;
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
  previewOpenFamilyCallSignal: number;
  previewOpenFamilyPhotosSignal: number;
  previewOpenFamilyNotificationsSignal: number;
  assistanceScenario: AssistanceScenario;
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
  storeCategoryScenario: StoreCategoryScenario;
  previewOpenStoreSignal: number;
  loginScenario: ChildLoginScenario;
  elderBindingScenario: ElderBindingScenario;
  onPreviewContextChange?: (
    page: 'login' | 'home' | 'messages' | 'photos' | 'care' | 'profile',
    familyModule?: 'family_messages' | 'family_photos' | 'family_notifications' | 'reminders' | 'elder_binding'
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
  familyCallScenario,
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
  previewOpenFamilyCallSignal,
  previewOpenFamilyPhotosSignal,
  previewOpenFamilyNotificationsSignal,
  assistanceScenario,
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
  storeCategoryScenario,
  previewOpenStoreSignal,
  loginScenario,
  elderBindingScenario,
  onPreviewContextChange
}) => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'store' | 'orders' | 'profile'>('monitor');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'outgoing' | 'incoming' | 'connected' | 'unanswered'>('idle');
  const [callMode, setCallMode] = useState<'voice' | 'video'>('voice');
  const [callSeconds, setCallSeconds] = useState(0);
  const [callMuted, setCallMuted] = useState(false);
  const [callSpeaker, setCallSpeaker] = useState(true);
  const [callCamera, setCallCamera] = useState(true);
  const [callTarget, setCallTarget] = useState<Pick<FamilyConversation, 'id' | 'elderName' | 'avatar'> | null>(null);
  const [callConnected, setCallConnected] = useState(false);
  const [showElderProfile, setShowElderProfile] = useState(false);
  const [residenceAddress, setResidenceAddress] = useState(initialChildResidenceAddress);
  const [familyMessages, setFamilyMessages] = useState(initialFamilyMessages);
  const [familyNotifications, setFamilyNotifications] = useState<FamilyNotification[]>(initialFamilyNotifications);
  const [assistanceViews, setAssistanceViews] = useState(() => initialAssistanceViews(assistanceScenario));
  const [assistanceOpen, setAssistanceOpen] = useState(false);
  const [assistanceFromList, setAssistanceFromList] = useState(false);
  const [selectedAssistanceId, setSelectedAssistanceId] = useState<string | null>(null);
  const [showPhotoShare, setShowPhotoShare] = useState(false);
  const [photoShareMounted, setPhotoShareMounted] = useState(false);
  const [familySection, setFamilySection] = useState<FamilySection>('photos');
  const [showReminders, setShowReminders] = useState(false);
  const [bindingState, bindingDispatch] = useReducer(familyBindingReducer, elderBindingScenario, createBindingState);
  const boundElders = useMemo(() => getBoundElders(bindingState), [bindingState]);
  const activeBoundElders = boundElders.filter(elder => elder.relationshipStatus === 'active');
  const [currentElderId, setCurrentElderId] = useState<string | null>(initialBoundElders[0]?.id ?? null);
  const [showElderSwitcher, setShowElderSwitcher] = useState(false);
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
          category: latestLikedBatch.categoryNameSnapshot,
          feedback: latestLikedBatch.feedback
        }
      : null;
  }, [photoBatches]);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const scopedFamilyMessages = familyMessageScenario === 'multi_elder'
    ? familyMessages
    : familyMessages.filter(message => message.conversationId === initialFamilyConversations[0]?.id);
  const currentBoundElder = activeBoundElders.find(elder => elder.id === currentElderId) ?? activeBoundElders[0];
  const assistanceEvents = useMemo(() => assistanceForElder(createAssistanceEvents(assistanceScenario), currentBoundElder?.id), [assistanceScenario, currentBoundElder?.id]);
  const isAssistanceViewed = (id: string) => {
    const event = assistanceEvents.find(item => item.id === id);
    return !!event && hasViewedAssistance(assistanceViews, 'child-current', assistanceRevision(event));
  };
  const assistanceUnread = assistanceEvents.filter(event => !isAssistanceViewed(event.id)).length;
  const scopedNotifications = familyNotifications.filter(notification => notification.elderId === currentBoundElder?.id);
  const familyUnread = scopedNotifications.filter(notification => !notification.read).length;
  const unreadFamilyNotificationCount = familyUnread + assistanceUnread;
  const openAssistance = (id: string) => {
    const event = assistanceEvents.find(item => item.id === id);
    if (!event) return;
    setAssistanceViews(current => markAssistanceViewed(current, 'child-current', assistanceRevision(event)));
    setSelectedAssistanceId(id);
    setAssistanceOpen(true);
    contentScrollRef.current?.scrollTo({ top: 0 });
  };
  useEffect(() => {
    setAssistanceViews(initialAssistanceViews(assistanceScenario));
    setAssistanceOpen(false);
    setSelectedAssistanceId(null);
  }, [assistanceScenario, previewResetSignal]);
  useEffect(() => {
    setAssistanceOpen(false);
    setSelectedAssistanceId(null);
  }, [currentBoundElder?.id]);
  useEffect(() => {
    setAssistanceOpen(false);
    setSelectedAssistanceId(null);
    setAssistanceFromList(false);
  }, [activeTab, familySection]);
  useEffect(() => {
    if (!boundElders.some(elder => elder.id === currentElderId && elder.relationshipStatus === 'active')) {
      setCurrentElderId(boundElders.find(elder => elder.relationshipStatus === 'active')?.id ?? null);
    }
  }, [boundElders, currentElderId]);
  const currentParentProfile = currentBoundElder
    ? { ...parentProfile, name: currentBoundElder.name, age: currentBoundElder.age, avatar: currentBoundElder.avatar }
    : parentProfile;
  const photoRecipients: PhotoRecipientOption[] = [
    ...initialFamilyConversations.map(conversation => ({
      elderId: conversation.elderId,
      elderName: conversation.elderName,
      conversationId: conversation.id,
      relationshipStatus: conversation.relationshipStatus
    })),
    {
      elderId: 'elder-grandpa-invalid',
      elderName: '外公',
      conversationId: 'conversation-grandpa-invalid',
      relationshipStatus: 'invalid' as const,
      unavailableReason: '家庭关系已解除，不可发送'
    }
  ];

  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  useEffect(() => {
    if (callState !== 'connected') return;
    const timer = window.setInterval(() => setCallSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [callState]);

  useEffect(() => {
    if (previewOpenFamilyCallSignal <= 0) return;
    const mode = familyCallScenario.includes('video') ? 'video' : 'voice';
    setCallMode(mode);
    setCallSeconds(0);
    setCallMuted(false);
    setCallSpeaker(true);
    setCallCamera(true);
    setCallConnected(familyCallScenario.startsWith('connected'));
    setCallTarget({
      id: initialFamilyConversations[0].id,
      elderName: initialFamilyConversations[0].elderName,
      avatar: initialFamilyConversations[0].avatar
    });
    setCallState(
      familyCallScenario.startsWith('incoming')
        ? 'incoming'
        : familyCallScenario.startsWith('connected')
          ? 'connected'
          : familyCallScenario === 'unanswered'
            ? 'unanswered'
            : 'outgoing'
    );
  }, [previewOpenFamilyCallSignal, familyCallScenario]);

  useEffect(() => {
    if (!isLoggedIn) {
      onPreviewContextChange?.('login');
    } else if (activeTab === 'monitor') {
      onPreviewContextChange?.('home');
    } else if (activeTab === 'store') {
      onPreviewContextChange?.(
        familySection === 'photos' ? 'photos' : familySection === 'notifications' ? 'profile' : 'messages',
        familySection === 'messages' ? 'family_messages' : familySection === 'notifications' ? 'family_notifications' : 'family_photos'
      );
    } else if (activeTab === 'orders') {
      onPreviewContextChange?.('care');
    } else if (activeTab === 'profile') {
      onPreviewContextChange?.('profile', showReminders ? 'reminders' : 'elder_binding');
    }
  }, [activeTab, familySection, showReminders, isLoggedIn, onPreviewContextChange]);

  useEffect(() => {
    if (previewOpenLoginSignal > 0) {
      setIsLoggedIn(false);
      setShowElderProfile(false);
      setShowPhotoShare(false);
    }
  }, [previewOpenLoginSignal]);

  useEffect(() => {
    if (previewOpenProfileSignal > 0) { setShowReminders(false); setActiveTab('profile'); }
  }, [previewOpenProfileSignal]);

  useEffect(() => {
    if (previewOpenRemindersSignal > 0) { setShowReminders(true); setActiveTab('profile'); }
  }, [previewOpenRemindersSignal]);

  useEffect(() => {
    if (previewOpenStoreSignal > 0) setActiveTab('orders');
  }, [previewOpenStoreSignal]);

  useEffect(() => {
    bindingDispatch({ type: 'reset', scenario: elderBindingScenario });
    setCurrentElderId(elderBindingScenario === 'no_elder' || elderBindingScenario === 'relationship_removed' ? null : initialBoundElders[0].id);
  }, [elderBindingScenario]);

  const enterElderHome = (elderId: string) => {
    if (!activeBoundElders.some(elder => elder.id === elderId)) return;
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
      setFamilySection('photos');
      setFamilyMessages(initialFamilyMessages);
      setFamilyNotifications(initialFamilyNotifications);
      setPhotoBatches(initialPublishedPhotoBatches);
      bindingDispatch({ type: 'reset', scenario: 'bound' });
      setShowReminders(false);
      setCurrentElderId(initialBoundElders[0]?.id ?? null);
      setCallState('idle');
      setCallTarget(null);
      setCallConnected(false);
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

  useEffect(() => {
    if (previewOpenFamilyNotificationsSignal > 0) {
      setAssistanceOpen(false);
      setSelectedAssistanceId(null);
      setFamilySection('notifications');
      setActiveTab('store');
    }
  }, [previewOpenFamilyNotificationsSignal]);

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

  const handleMockCall = (mode: 'voice' | 'video' = 'voice', conversation?: FamilyConversation) => {
    setCallMode(mode);
    setCallSeconds(0);
    setCallMuted(false);
    setCallSpeaker(true);
    setCallCamera(true);
    setCallConnected(false);
    const target = conversation ?? initialFamilyConversations.find(item => item.elderId === currentBoundElder?.id) ?? initialFamilyConversations[0];
    setCallTarget({ id: target.id, elderName: target.elderName, avatar: target.avatar });
    setCallState('outgoing');
  };

  const finishMockCall = (result: 'completed' | 'cancelled' | 'rejected' | 'unanswered') => {
    if (callTarget) {
      const resultLabel = result === 'completed'
        ? `通话结束${callSeconds > 0 ? ` · ${String(Math.floor(callSeconds / 60)).padStart(2, '0')}:${String(callSeconds % 60).padStart(2, '0')}` : ''}`
        : result === 'cancelled'
          ? '已取消'
          : result === 'rejected'
            ? '已拒绝'
            : '无人接听';
      const record: import('../types').FamilyMessage = {
        id: `family-call-${Date.now()}`,
        conversationId: callTarget.id,
        sender: result === 'rejected' ? 'elder' : 'child',
        senderName: result === 'rejected' ? callTarget.elderName : '我',
        text: `${callMode === 'video' ? '视频通话' : '语音通话'} · ${resultLabel}`,
        sentAtUtc: new Date().toISOString(),
        status: 'delivered',
        type: 'call',
        durationSeconds: result === 'completed' ? callSeconds : undefined,
        callMode,
        callResult: result
      };
      setFamilyMessages(current => [...current, record]);
      setInitialFamilyConversationId(callTarget.id);
    }
    setCallState('idle');
    setCallConnected(false);
    setFamilySection('messages');
    setActiveTab('store');
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setActiveTab(activeBoundElders.length === 0 ? 'profile' : 'monitor');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('monitor');
  };

  return (
    <div className="preview-phone-frame bg-slate-950 rounded-none sm:rounded-[48px] p-0 sm:p-3 shadow-none sm:shadow-2xl relative border-0 sm:border-4 border-slate-800 shrink-0" id="h5-phone-simulator">
      {/* 1. Phone Top Camera notch */}
      <div className="hidden sm:flex absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-950 rounded-full items-center justify-center z-50">
        <div className="w-3 h-3 bg-slate-900 rounded-full border border-slate-800 ml-1"></div>
        <div className="w-12 h-1 bg-slate-900 rounded-full mx-auto"></div>
      </div>

      {/* 2. Main Phone Screen content */}
      <div id="h5-phone-screen" className="w-full h-full bg-slate-50 rounded-none sm:rounded-[38px] overflow-hidden flex flex-col relative border-0 sm:border border-slate-900">
        
        {/* Mock OS Status Bar */}
        <div className="hidden sm:flex h-10 bg-white items-center justify-between px-6 shrink-0 z-40">
          <span className="text-2xs font-bold text-slate-800">{homeCareScenario === 'medication_expired' ? '23:59' : homeCareScenario === 'medication_overdue' ? '22:10' : '18:26'}</span>
          <div className="flex items-center gap-1.5 text-slate-800">
            <Signal size={12} />
            <span className="text-4xs font-bold font-mono">5G</span>
            <Wifi size={12} />
            <Battery size={14} className="text-slate-800" />
          </div>
        </div>

        {/* App page title */}
        <header className="relative z-30 flex h-11 shrink-0 items-center justify-center border-b border-slate-100 bg-white px-4 shadow-3xs">
          {isLoggedIn && activeTab === 'store' && familySection !== 'notifications' ? (
            <div role="tablist" aria-label="家庭内容" className="flex rounded-xl bg-slate-100 p-1">
              {(['messages', 'photos'] as const).map(section => (
                <button key={section} type="button" role="tab" aria-selected={familySection === section} onClick={() => setFamilySection(section)} className={`rounded-lg px-5 py-1 text-xs font-bold ${familySection === section ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}>
                  {section === 'messages' ? '家庭留言' : '家庭相册'}
                </button>
              ))}
            </div>
          ) : <h1 className="text-sm font-extrabold tracking-tight text-slate-900">{!isLoggedIn ? '登录' : assistanceOpen ? '在线协助' : activeTab === 'monitor' ? '首页' : activeTab === 'store' ? '消息' : activeTab === 'orders' ? '预约服务' : showReminders ? '给老人设置提醒' : '我的'}</h1>}

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
                    onClick={() => handleMockCall('voice')}
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

          {isLoggedIn && !currentBoundElder && (activeTab !== 'profile' || showReminders) && (
            <div className="space-y-3 p-6 text-center">
              <h2 className="text-base font-bold text-slate-900">暂无有效家庭关系</h2>
              <p className="text-xs leading-relaxed text-slate-500">请先添加家人。待老人本人确认后，才可查看该老人的照护信息和使用相关功能。</p>
              <button type="button" onClick={() => { setShowReminders(false); setActiveTab('profile'); }} className="rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white">前往家人管理</button>
            </div>
          )}
          {isLoggedIn && currentBoundElder && activeTab === 'monitor' && !assistanceOpen && (
            <H5MonitorTab 
              healthStats={healthStats}
              setHealthStats={setHealthStats}
              medications={medications}
              setMedications={setMedications}
              activities={activities}
              setActivities={setActivities}
              orders={orders}
              parentProfile={currentParentProfile}
              onSwitchElder={activeBoundElders.length > 1 ? () => setShowElderSwitcher(true) : undefined}
              assistanceSummary={<AssistanceHomeSummary events={assistanceEvents} elderName={currentBoundElder.name} isViewed={isAssistanceViewed} onOpen={id => { setAssistanceFromList(false); openAssistance(id); }} onList={() => { setAssistanceFromList(true); setSelectedAssistanceId(null); setAssistanceOpen(true); contentScrollRef.current?.scrollTo({ top: 0 }); }} />}
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

          {isLoggedIn && assistanceOpen && (
            <H5OnlineAssistance events={assistanceEvents} elderName={currentBoundElder?.name ?? '家人'} isViewed={isAssistanceViewed} onOpen={openAssistance} selectedId={selectedAssistanceId} backLabel={selectedAssistanceId && assistanceFromList ? '返回在线协助列表' : activeTab === 'monitor' ? '返回首页' : activeTab === 'profile' ? '返回我的' : '返回消息'} onBack={() => { if (selectedAssistanceId && assistanceFromList) setSelectedAssistanceId(null); else { setAssistanceOpen(false); setSelectedAssistanceId(null); } contentScrollRef.current?.scrollTo({ top: 0 }); }} />
          )}
          {isLoggedIn && currentBoundElder && activeTab === 'store' && !(familySection === 'notifications' && assistanceOpen) && (
            <H5FamilyTab
              assistanceUnread={assistanceUnread}
              assistanceEntry={<AssistanceNoticeEntry events={assistanceEvents} elderName={currentBoundElder.name} isViewed={isAssistanceViewed} onOpen={id => { setAssistanceFromList(false); openAssistance(id); }} onList={() => { setAssistanceFromList(true); setSelectedAssistanceId(null); setAssistanceOpen(true); contentScrollRef.current?.scrollTo({ top: 0 }); }} />}
              conversations={initialFamilyConversations}
              messages={scopedFamilyMessages}
              photoBatches={photoBatches}
              notifications={scopedNotifications}
              activeSection={familySection}
              messageScenario={familyMessageScenario}
              photoScenario={familyPhotoScenario}
              initialConversationId={initialFamilyConversationId}
              onSectionChange={setFamilySection}
              onOpenPhotoShare={openPhotoShare}
              onRetryFailedRecipients={(publicationId) => {
                setPhotoBatches(previous => previous.map(batch =>
                  batch.publicationId === publicationId && batch.publishStatus === 'failed' && batch.retryable
                    ? { ...batch, publishStatus: 'published', syncStatus: 'delivered', failureReason: undefined, retryable: undefined, feedback: 'published' }
                    : batch
                ));
              }}
              onMessagesChange={setFamilyMessages}
              onNotificationsChange={update => setFamilyNotifications(current => {
                const scoped = current.filter(item => item.elderId === currentBoundElder.id);
                const next = typeof update === 'function' ? update(scoped) : update;
                return [...current.filter(item => item.elderId !== currentBoundElder.id), ...next];
              })}
              onContactElder={handleMockCall}
            />
          )}

          {isLoggedIn && currentBoundElder && activeTab === 'orders' && (
            <H5OrdersTab 
              orders={orders}
              setOrders={setOrders}
              activities={activities}
              setActivities={setActivities}
              elderName={currentParentProfile.name}
              elderId={currentBoundElder?.id ?? 'elder-1'}
              reminderScenario={reminderScenario}
              openReminderSignal={previewOpenRemindersSignal}
              storeCategoryScenario={storeCategoryScenario}
              openStoreSignal={previewOpenStoreSignal}
              elderProject={currentBoundElder?.project ?? '静安社区'}
            />
          )}

          {isLoggedIn && activeTab === 'profile' && !assistanceOpen && (!showReminders || currentBoundElder) && (
            showReminders ? <div className="p-4"><H5ReminderManager elderName={currentParentProfile.name} elderId={currentBoundElder?.id ?? 'elder-1'} scenario={reminderScenario} /></div> :
            <H5ProfileTab
              onOpenAssistance={() => { setAssistanceFromList(true); setSelectedAssistanceId(null); setAssistanceOpen(true); contentScrollRef.current?.scrollTo({ top: 0 }); }}
              isLoggedIn={isLoggedIn}
              onLogin={handleLogin}
              onLogout={handleLogout}
              residenceAddress={residenceAddress}
              onSaveResidenceAddress={setResidenceAddress}
              boundElders={boundElders}
              bindingState={bindingState}
              bindingDispatch={bindingDispatch}
              currentElderId={currentElderId}
              bindingScenario={elderBindingScenario}
              onSwitchElder={setCurrentElderId}
              onEnterElderHome={enterElderHome}
            />
          )}

        </div>

        {isLoggedIn && currentBoundElder && activeTab === 'store' && familySection === 'photos' && (
          <button
            type="button"
            onClick={openPhotoShare}
            className="absolute bottom-20 right-4 z-40 flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500"
          >
            <ImagePlus size={16} />
            发照片或视频
          </button>
        )}

        {isLoggedIn && showElderSwitcher && (
          <div className="absolute inset-0 z-50 flex items-end bg-slate-950/40" onClick={() => setShowElderSwitcher(false)}>
            <section role="dialog" aria-modal="true" aria-label="切换家人" onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') setShowElderSwitcher(false); }} className="w-full rounded-t-3xl bg-white p-5 pb-8 shadow-xl">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-bold text-slate-900">切换家人</h2><button autoFocus type="button" aria-label="关闭切换家人" onClick={() => setShowElderSwitcher(false)} className="rounded-full bg-slate-100 p-2 text-slate-500"><X size={18} /></button></div>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {activeBoundElders.map(elder => (
                  <button key={elder.id} type="button" aria-pressed={elder.id === currentBoundElder?.id} onClick={() => { setCurrentElderId(elder.id); setShowElderSwitcher(false); contentScrollRef.current?.scrollTo({ top: 0 }); }} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${elder.id === currentBoundElder?.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                    <img src={elder.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                    <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900">{elder.name}</span><span className="text-xs text-slate-500">我是{elder.relation}</span></span>
                    {elder.id === currentBoundElder?.id && <span className="text-xs font-bold text-blue-600">当前查看</span>}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {isLoggedIn && currentBoundElder && showElderProfile && (
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

        {isLoggedIn && currentBoundElder && photoShareMounted && (
          <H5PhotoShareSheet
            key={familyPhotoScenario}
            recipients={photoRecipients}
            currentElderId={currentElderId ?? initialFamilyConversations[0]?.elderId}
            uploaderId="child-current"
            demoScenario={familyPhotoScenario}
            isOpen={showPhotoShare}
            onClose={() => setShowPhotoShare(false)}
            onPublished={(batches) => {
              setPhotoBatches(previous => [...batches, ...previous.filter(item => !batches.some(batch => batch.id === item.id))]);
            }}
            onContactElder={(recipient) => {
              setShowPhotoShare(false);
              const target = initialFamilyConversations.find(conversation => conversation.id === recipient.conversationId);
              handleMockCall('voice', target);
            }}
          />
        )}

        {isLoggedIn && callState !== 'idle' && (
          <section role="dialog" aria-modal="true" aria-label={`${callMode === 'video' ? '视频' : '语音'}通话`} className="absolute inset-0 z-[90] flex flex-col items-center justify-between bg-slate-950 px-6 pb-10 pt-20 text-white">
            <div className="text-center">
              <img src={callTarget?.avatar ?? currentParentProfile.avatar} alt="" className="mx-auto h-24 w-24 rounded-full border-4 border-white/15 object-cover" />
              <h2 className="mt-5 text-xl font-black">{callTarget?.elderName ?? currentParentProfile.name}</h2>
              <p className="mt-2 text-sm text-white/60">{callState === 'incoming' ? `${callMode === 'video' ? '视频' : '语音'}来电` : callState === 'outgoing' ? `正在呼叫 · ${callMode === 'video' ? '视频' : '语音'}通话` : callState === 'unanswered' ? '无人接听' : `${String(Math.floor(callSeconds / 60)).padStart(2, '0')}:${String(callSeconds % 60).padStart(2, '0')}`}</p>
              {callState === 'unanswered' && <p className="mt-3 text-xs text-white/45">呼出 60 秒未接，通话已结束</p>}
            </div>

            {callState === 'connected' && <div className={`grid text-center text-[10px] ${callMode === 'video' ? 'w-full grid-cols-3 gap-4' : 'w-44 grid-cols-2 gap-5'}`}>
              <button type="button" onClick={() => setCallMuted(value => !value)} className="flex flex-col items-center gap-2"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">{callMuted ? <MicOff /> : <Mic />}</span>{callMuted ? '取消静音' : '静音'}</button>
              <button type="button" onClick={() => setCallSpeaker(value => !value)} className="flex flex-col items-center gap-2"><span className={`flex h-14 w-14 items-center justify-center rounded-full ${callSpeaker ? 'bg-white text-slate-950' : 'bg-white/15'}`}><Volume2 /></span>免提</button>
              {callMode === 'video' && <button type="button" onClick={() => setCallCamera(value => !value)} className="flex flex-col items-center gap-2"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">{callCamera ? <Video /> : <VideoOff />}</span>{callCamera ? '关闭摄像头' : '开启摄像头'}</button>}
            </div>}

            <div className="flex w-full items-center justify-center gap-10">
              {callState === 'incoming' && <button type="button" onClick={() => { setCallConnected(true); setCallState('connected'); }} className="flex flex-col items-center gap-2 text-xs"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500"><Phone className="fill-current" /></span>接听</button>}
              {callState === 'outgoing' && <button type="button" onClick={() => { setCallConnected(true); setCallState('connected'); }} className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/70">接通</button>}
              <button type="button" onClick={() => finishMockCall(callState === 'incoming' ? 'rejected' : callState === 'unanswered' ? 'unanswered' : callState === 'outgoing' ? 'cancelled' : callConnected ? 'completed' : 'cancelled')} className="flex flex-col items-center gap-2 text-xs"><span className="flex h-16 w-16 rotate-[135deg] items-center justify-center rounded-full bg-rose-600"><Phone className="fill-current" /></span>{callState === 'incoming' ? '拒绝' : callState === 'unanswered' ? '返回会话' : callState === 'outgoing' ? '取消' : '挂断'}</button>
            </div>
          </section>
        )}

        {/* 4. IOS Elegant Bottom Navigation Tabs bar */}
        {isLoggedIn && <nav onClickCapture={() => { setAssistanceOpen(false); setSelectedAssistanceId(null); setAssistanceFromList(false); }} className="h-16 bg-white border-t border-slate-150 flex items-center justify-around px-2 shrink-0 z-40 pb-2">
          <button
            onClick={() => setActiveTab('monitor')}
            disabled={!isLoggedIn}
            className={`flex flex-col items-center justify-center flex-1 gap-1 h-full transition-colors ${activeTab === 'monitor' ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <House size={18} className={activeTab === 'monitor' ? 'stroke-[2.5]' : ''} />
            <span className="text-5xs font-extrabold tracking-tight">首页</span>
          </button>

          <button
            onClick={() => { setActiveTab('store'); setFamilySection('messages'); }}
            disabled={!isLoggedIn}
            className={`flex flex-col items-center justify-center flex-1 gap-1 h-full transition-colors ${activeTab === 'store' && familySection !== 'notifications' ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span className="relative"><MessageCircle size={18} className={activeTab === 'store' && familySection === 'messages' ? 'stroke-[2.5]' : ''} />{familyUnread > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white">{familyUnread}</span>}</span>
            <span className="text-5xs font-extrabold tracking-tight">家庭</span>
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setShowReminders(true); }}
            disabled={!isLoggedIn}
            className={`flex flex-col items-center justify-center flex-1 gap-1 h-full transition-colors ${activeTab === 'profile' && showReminders ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <BellRing size={18} className={activeTab === 'profile' && showReminders ? 'stroke-[2.5]' : ''} />
            <span className="text-5xs font-extrabold tracking-tight">提醒事项</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            disabled={!isLoggedIn}
            className={`flex flex-col items-center justify-center flex-1 gap-1 h-full transition-colors ${activeTab === 'orders' ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Settings2 size={18} className={activeTab === 'orders' ? 'stroke-[2.5]' : ''} />
            <span className="text-5xs font-extrabold tracking-tight">预约服务</span>
          </button>

          <button
            onClick={() => { setShowReminders(false); setActiveTab('profile'); }}
            className={`flex flex-col items-center justify-center flex-1 gap-1 h-full transition-colors ${((activeTab === 'profile' && !showReminders) || (activeTab === 'store' && familySection === 'notifications')) ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <UserRound size={18} className={((activeTab === 'profile' && !showReminders) || (activeTab === 'store' && familySection === 'notifications')) ? 'stroke-[2.5]' : ''} />
            <span className="text-5xs font-extrabold tracking-tight">我的</span>
          </button>
        </nav>}

        {/* iOS physical bottom bar pill */}
        <div className="hidden sm:block h-1 bg-slate-300 w-32 mx-auto rounded-full mb-1 shrink-0"></div>
      </div>
    </div>
  );
};
