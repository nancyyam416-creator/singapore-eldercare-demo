/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Sparkles,
  RefreshCw,
  Plus,
  Send,
  MessageSquare,
  Check,
  Bell,
  Home,
  ChevronDown,
  ChevronRight,
  Pill,
  Footprints,
  Images,
  Phone,
  History,
  Play,
  Pause,
  Heart,
  Mic2,
  PersonStanding,
  CircleHelp,
  X
} from 'lucide-react';
import { Medication, HealthStats, ActivityLog, Order, HomeCareScenario, HomeActivityScenario, FamilyReceiptScenario, FamilyReceiptFilter, CareFeedScenario, ElderStatusCardScenario, ReassuranceScoreScenario, FamilyMessage as SharedFamilyMessage } from '../types';
import { H5ElderStatusCard } from './H5ElderStatusCard';

interface H5MonitorTabProps {
  healthStats: HealthStats;
  setHealthStats?: React.Dispatch<React.SetStateAction<HealthStats>>;
  medications: Medication[];
  setMedications?: React.Dispatch<React.SetStateAction<Medication[]>>;
  activities: ActivityLog[];
  setActivities?: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  orders: Order[];
  parentProfile: typeof import('../data/mockData').initialParentProfile;
  onSwitchToOrders: () => void;
  onOpenElderProfile: () => void;
  onOpenPhotoShare: () => void;
  onOpenFamilyMessages: () => void;
  familyMessages: SharedFamilyMessage[];
  onOpenFamilyPhotos: () => void;
  latestPhotoFeedback: { elderName: string; photoCount: number; videoCount: number; category: string; feedback: 'published' | 'viewed' | 'liked' } | null;
  homeCareScenario: HomeCareScenario;
  homeActivityScenario: HomeActivityScenario;
  familyReceiptScenario: FamilyReceiptScenario;
  careFeedScenario: CareFeedScenario;
  elderStatusCardScenario: ElderStatusCardScenario;
  reassuranceScoreScenario: ReassuranceScoreScenario;
  previewOpenScoreDetailsSignal: number;
  previewCloseScoreDetailsSignal: number;
  previewOpenFamilyReceiptsSignal: number;
  previewCloseFamilyReceiptsSignal: number;
  previewFamilyReceiptFilter: FamilyReceiptFilter;
  previewCompleteFamilyVoiceSignal: number;
  previewOpenMedicationDetailsSignal: number;
  previewResetSignal: number;
}

// Event registration type
interface CommunityEvent {
  id: string;
  title: string;
  time: string;
  location: string;
  organizer: string;
  attendance: 'attended' | 'upcoming';
}

// Family message board type
interface FamilyMessage {
  id: string;
  time: string;
  sender: 'child' | 'parent' | 'system';
  text: string;
  status: 'sent' | 'delivered' | 'read' | 'replied';
  replyText?: string;
  replyTime?: string;
}

interface FamilyReceipt {
  id: string;
  type: 'message' | 'photo_like';
  time: string;
  title: string;
  detail: string;
  format?: 'voice' | 'text';
  durationSeconds?: number;
  dayLabel: '今天' | '昨天';
}

type VoicePlaybackState = 'idle' | 'playing' | 'paused' | 'completed';

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const SHOW_REASSURANCE_SCORE_CARD = false;

interface ScoreEmotionRingProps {
  score: number | null;
  tone: 'normal' | 'attention' | 'critical' | 'warning' | 'muted';
  status: string;
}

const ScoreEmotionRing: React.FC<ScoreEmotionRingProps> = ({ score, tone, status }) => {
  const radius = 39;
  const circumference = 2 * Math.PI * radius;
  const progress = score === null ? 0 : Math.max(0, Math.min(100, score));
  const strokeOffset = circumference * (1 - progress / 100);
  const toneConfig = {
    normal: {
      ring: 'stroke-blue-600',
      face: 'bg-blue-50 text-blue-700 shadow-[0_6px_18px_rgba(37,99,235,0.16)]',
      track: 'stroke-blue-100'
    },
    attention: {
      ring: 'stroke-orange-500',
      face: 'bg-orange-50 text-orange-700 shadow-[0_6px_18px_rgba(249,115,22,0.14)]',
      track: 'stroke-orange-100'
    },
    critical: {
      ring: 'stroke-rose-500',
      face: 'bg-rose-50 text-rose-700 shadow-[0_6px_18px_rgba(244,63,94,0.16)]',
      track: 'stroke-rose-100'
    },
    warning: {
      ring: 'stroke-orange-500',
      face: 'bg-orange-50 text-orange-700 shadow-[0_6px_18px_rgba(249,115,22,0.14)]',
      track: 'stroke-orange-100'
    },
    muted: {
      ring: 'stroke-slate-300',
      face: 'bg-slate-100 text-slate-500 shadow-[0_6px_16px_rgba(100,116,139,0.12)]',
      track: 'stroke-slate-200'
    }
  }[tone];

  return (
    <div className="relative flex h-[84px] w-[84px] shrink-0 items-center justify-center" aria-label={`${status}${score === null ? '，暂无评分' : `，${score}分`}`}>
      <svg viewBox="0 0 94 94" className="-rotate-90 absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="47" cy="47" r={radius} fill="none" strokeWidth="8" className={toneConfig.track} />
        {score === null ? (
          <circle cx="47" cy="47" r={radius} fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray="5 8" className={toneConfig.ring} />
        ) : (
          <circle
            cx="47"
            cy="47"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            className={toneConfig.ring}
          />
        )}
      </svg>
      <div className={`relative flex h-[66px] w-[66px] flex-col items-center justify-center rounded-full ${toneConfig.face}`}>
        {tone === 'warning' ? (
          <>
            <div className="flex items-center gap-3 text-[13px] font-black leading-none"><span>×</span><span>×</span></div>
            <span className="mt-2 h-2.5 w-5 rounded-t-full border-x-2 border-t-2 border-current" />
          </>
        ) : tone === 'critical' ? (
          <>
            <div className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-current" /><span className="h-1.5 w-1.5 rounded-full bg-current" /></div>
            <span className="mt-2 h-2.5 w-5 rounded-t-full border-x-2 border-t-2 border-current" />
          </>
        ) : tone === 'muted' ? (
          <>
            <div className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-current" /><span className="h-1.5 w-1.5 rounded-full bg-current" /></div>
            <span className="mt-2 text-xs font-black tracking-widest">···</span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-current" /><span className="h-1.5 w-1.5 rounded-full bg-current" /></div>
            {tone === 'normal' ? (
              <span className="mt-2 h-2.5 w-5 rounded-b-full border-x-2 border-b-2 border-current" />
            ) : (
              <span className="mt-2 h-0.5 w-5 rounded-full bg-current" />
            )}
          </>
        )}
      </div>
    </div>
  );
};

const scoreRuleContent = {
  space: {
    title: '空间作息如何计算',
    bullets: [
      '多个房间有活动，或仅配置1个房间且有活动：40分。',
      '单房间持续不足48小时：30分。',
      '持续48～72小时：15分，并额外扣5分。',
      '持续72小时以上：0分，并额外扣10分。',
      '检测到其他房间后恢复40分。',
      '暂无移动计30分；设备离线显示--。'
    ]
  },
  schedule: {
    title: '日程完成如何计算',
    bullets: [
      '无待办或任务均未到时间：40分。',
      '已到时间的任务按完成比例计分。',
      '延期中暂不计该任务分数。',
      '延期完成仍按已完成计算。',
      '连续2个用药日未确认额外扣5分；连续3个及以上额外扣10分。',
      '记录无法确认时暂停连续计数；记录恢复后正常展示。',
      '数据无法确认时显示--。'
    ]
  },
  interaction: {
    title: '亲情互动如何计算',
    bullets: [
      '发留言、回复、点爱心或形成查看回执：20分。',
      '多次互动最高仍为20分。',
      '当天暂无老人互动：10分。',
      '数据无法确认时显示--。'
    ]
  }
} as const;

export const H5MonitorTab: React.FC<H5MonitorTabProps> = ({
  healthStats,
  medications,
  setMedications,
  activities,
  setActivities,
  parentProfile,
  onOpenElderProfile,
  onOpenPhotoShare,
  onOpenFamilyMessages,
  familyMessages: sharedFamilyMessages,
  onOpenFamilyPhotos,
  latestPhotoFeedback,
  homeCareScenario,
  homeActivityScenario,
  familyReceiptScenario,
  careFeedScenario,
  elderStatusCardScenario,
  reassuranceScoreScenario,
  previewOpenScoreDetailsSignal,
  previewCloseScoreDetailsSignal,
  previewOpenFamilyReceiptsSignal,
  previewCloseFamilyReceiptsSignal,
  previewFamilyReceiptFilter,
  previewCompleteFamilyVoiceSignal,
  previewOpenMedicationDetailsSignal,
  previewResetSignal
}) => {
  // --- Tab internal interaction states ---
  const [activeSegment, setActiveSegment] = useState<'status' | 'activities' | 'messages'>('status');
  const [showDetails, setShowDetails] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);
  const [showResolutionOptions, setShowResolutionOptions] = useState(false);
  const [resolutionState, setResolutionState] = useState<null | { status: 'resolved' | 'pending' | 'urgent'; text: string }>(null);
  const [showMedicationAttentionDetails, setShowMedicationAttentionDetails] = useState(false);
  const [showTakenMedications, setShowTakenMedications] = useState(false);
  const [selectedMedicationId, setSelectedMedicationId] = useState<string>('med-overdue');
  const [medicationContactStarted, setMedicationContactStarted] = useState(false);
  const [showTrendDetails, setShowTrendDetails] = useState(false);
  const [spaceView, setSpaceView] = useState<'day' | 'week'>('day');
  const [selectedActivitySegment, setSelectedActivitySegment] = useState<string | null>(null);
  const [selectedActivityDay, setSelectedActivityDay] = useState<string | null>(null);
  const [voicePlaybackStates, setVoicePlaybackStates] = useState<Record<string, VoicePlaybackState>>({});
  const [activeVoiceReceiptId, setActiveVoiceReceiptId] = useState<string | null>(null);
  const [viewedFamilyReceiptIds, setViewedFamilyReceiptIds] = useState<Set<string>>(() => new Set(['like-1', 'like-2', 'message-3', 'like-3', 'like-4', 'like-5']));
  const [showFamilyReceipts, setShowFamilyReceipts] = useState(false);
  const [familyReceiptFilter, setFamilyReceiptFilter] = useState<'all' | 'message' | 'photo_like'>('all');
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const [expandedScoreRule, setExpandedScoreRule] = useState<'space' | 'schedule' | 'interaction' | null>(null);
  const unreadSharedFamilyMessages = sharedFamilyMessages.filter(message => message.sender === 'elder' && message.status === 'delivered');
  const latestUnreadSharedFamilyMessage = [...unreadSharedFamilyMessages].sort((left, right) => new Date(right.sentAtUtc).getTime() - new Date(left.sentAtUtc).getTime())[0];

  useEffect(() => {
    setShowResolutionOptions(false);
    setResolutionState(null);
    setShowMedicationAttentionDetails(false);
    setShowTakenMedications(false);
    setSelectedMedicationId(homeCareScenario === 'normal' ? 'med-overdue' : 'med-3');
    setMedicationContactStarted(false);
    setShowTrendDetails(false);
    setSpaceView('day');
    setShowScoreDetails(false);
    setExpandedScoreRule(null);
  }, [homeCareScenario]);

  useEffect(() => {
    setSpaceView('day');
    setSelectedActivitySegment(null);
    setSelectedActivityDay(null);
  }, [homeActivityScenario]);

  useEffect(() => {
    setShowScoreDetails(false);
    setExpandedScoreRule(null);
  }, [reassuranceScoreScenario]);

  useEffect(() => {
    setShowFamilyReceipts(false);
    setFamilyReceiptFilter('all');
    setVoicePlaybackStates(familyReceiptScenario === 'all_viewed'
      ? { 'message-1': 'completed', 'message-2': 'completed', 'message-3': 'completed', 'message-yesterday': 'completed' }
      : {});
    setActiveVoiceReceiptId(null);
    setViewedFamilyReceiptIds(familyReceiptScenario === 'all_viewed'
      ? new Set(['like-1', 'message-1', 'like-2', 'message-2', 'like-3', 'message-3', 'like-4', 'like-5', 'message-yesterday'])
      : new Set(['like-1', 'like-2', 'message-3', 'like-3', 'like-4', 'like-5']));
  }, [familyReceiptScenario]);

  useEffect(() => {
    if (previewOpenFamilyReceiptsSignal > 0) {
      setFamilyReceiptFilter(previewFamilyReceiptFilter);
      setShowFamilyReceipts(true);
    }
  }, [previewOpenFamilyReceiptsSignal, previewFamilyReceiptFilter]);

  useEffect(() => {
    if (previewCloseFamilyReceiptsSignal > 0) {
      setShowFamilyReceipts(false);
    }
  }, [previewCloseFamilyReceiptsSignal]);

  useEffect(() => {
    if (previewOpenMedicationDetailsSignal > 0) {
      setMedicationContactStarted(false);
      setSelectedMedicationId(homeCareScenario === 'normal' ? 'med-overdue' : 'med-3');
      setShowMedicationAttentionDetails(true);
    }
  }, [previewOpenMedicationDetailsSignal, homeCareScenario]);

  useEffect(() => {
    if (previewCompleteFamilyVoiceSignal > 0) {
      setActiveVoiceReceiptId('message-1');
      setVoicePlaybackStates(current => ({ ...current, 'message-1': 'completed' }));
    }
  }, [previewCompleteFamilyVoiceSignal]);

  useEffect(() => {
    if (previewResetSignal > 0) {
      setVoicePlaybackStates({});
      setActiveVoiceReceiptId(null);
      setResolutionState(null);
      setShowResolutionOptions(false);
      setShowMedicationAttentionDetails(false);
      setShowTakenMedications(false);
      setSelectedMedicationId('med-overdue');
      setMedicationContactStarted(false);
    }
  }, [previewResetSignal]);

  const activeVoicePlaybackState = activeVoiceReceiptId ? (voicePlaybackStates[activeVoiceReceiptId] ?? 'idle') : 'idle';

  useEffect(() => {
    if (!activeVoiceReceiptId || activeVoicePlaybackState !== 'playing') return;
    const voiceId = activeVoiceReceiptId;
    const timer = window.setTimeout(() => {
      setVoicePlaybackStates(current => ({ ...current, [voiceId]: 'completed' }));
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [activeVoiceReceiptId, activeVoicePlaybackState]);

  useEffect(() => {
    if (!activeVoiceReceiptId || activeVoicePlaybackState !== 'completed') return;
    const voiceId = activeVoiceReceiptId;
    const timer = window.setTimeout(() => {
      setViewedFamilyReceiptIds(current => new Set(current).add(voiceId));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [activeVoiceReceiptId, activeVoicePlaybackState]);

  const handleVoicePlayback = (receiptId: string) => {
    setActiveVoiceReceiptId(receiptId);
    setVoicePlaybackStates(current => {
      const nextState = current[receiptId] === 'playing' ? 'paused' : 'playing';
      const nextStates = Object.fromEntries(Object.entries(current).map(([id, state]) => [id, state === 'playing' ? 'paused' : state]));
      return { ...nextStates, [receiptId]: nextState };
    });
  };

  const openFamilyReceipts = (filter: FamilyReceiptFilter = 'all') => {
    setFamilyReceiptFilter(filter);
    setShowFamilyReceipts(true);
  };

  const openReceipt = (receipt: FamilyReceipt) => {
    setViewedFamilyReceiptIds(current => new Set(current).add(receipt.id));
    if (receipt.type === 'message') {
      setShowFamilyReceipts(false);
      onOpenFamilyMessages();
      return;
    }
    setShowFamilyReceipts(false);
    onOpenFamilyPhotos();
  };

  const allFamilyReceipts: FamilyReceipt[] = [
    { id: 'like-1', type: 'photo_like', dayLabel: '今天', time: '16:08', title: '妈妈喜欢你发的视频', detail: '周末家庭聚会' },
    { id: 'message-1', type: 'message', dayLabel: '今天', time: '15:42', title: '妈妈发来一条语音', detail: '我今天去听讲座啦，挺好的。', format: 'voice', durationSeconds: 18 },
    { id: 'like-2', type: 'photo_like', dayLabel: '今天', time: '14:56', title: '妈妈看过你发的视频', detail: '春日公园散步' },
    { id: 'message-2', type: 'message', dayLabel: '今天', time: '13:20', title: '妈妈发来一条语音', detail: '中午已经吃过饭啦。', format: 'voice', durationSeconds: 9 },
    { id: 'like-3', type: 'photo_like', dayLabel: '今天', time: '11:48', title: '妈妈给照片点了爱心', detail: '孩子们的旅行照' },
    { id: 'message-3', type: 'message', dayLabel: '今天', time: '10:15', title: '妈妈回复了一条语音', detail: '知道啦，你也注意休息。', format: 'voice', durationSeconds: 12 },
    { id: 'like-4', type: 'photo_like', dayLabel: '今天', time: '09:35', title: '妈妈给照片点了爱心', detail: '家庭聚餐' },
    { id: 'like-5', type: 'photo_like', dayLabel: '今天', time: '08:52', title: '妈妈给照片点了爱心', detail: '小时候的老照片' },
    { id: 'message-yesterday', type: 'message', dayLabel: '昨天', time: '20:15', title: '妈妈昨晚发来一条语音', detail: '明天记得早点休息。', format: 'voice', durationSeconds: 7 }
  ];
  const todayFamilyReceipts = allFamilyReceipts.filter(item => item.dayLabel === '今天');
  const familyReceipts = familyReceiptScenario === 'message_only'
    ? todayFamilyReceipts.filter(item => item.type === 'message')
    : familyReceiptScenario === 'photo_like_only'
      ? todayFamilyReceipts.filter(item => item.type === 'photo_like')
      : familyReceiptScenario === 'cross_day_unread'
        ? allFamilyReceipts
      : ['multiple', 'all_viewed'].includes(familyReceiptScenario)
        ? todayFamilyReceipts
        : [];
  const todayVisibleFamilyReceipts = familyReceipts.filter(item => item.dayLabel === '今天');
  const todayFamilyPhotoLikeCount = todayVisibleFamilyReceipts.filter(item => item.type === 'photo_like').length;
  const familyMessageCount = familyReceipts.filter(item => item.type === 'message').length;
  const familyPhotoLikeCount = familyReceipts.filter(item => item.type === 'photo_like').length;
  const latestMediaFeedbackTitle = latestPhotoFeedback
    ? latestPhotoFeedback.videoCount > 0 && latestPhotoFeedback.photoCount > 0
      ? `${latestPhotoFeedback.elderName}看过并喜欢你发的${latestPhotoFeedback.photoCount}张照片和${latestPhotoFeedback.videoCount}段视频`
      : latestPhotoFeedback.videoCount > 0
        ? `${latestPhotoFeedback.elderName}${latestPhotoFeedback.feedback === 'liked' ? '喜欢' : '看过'}你发的视频`
        : `${latestPhotoFeedback.elderName}给${latestPhotoFeedback.photoCount}张照片点了爱心`
    : `妈妈给${todayFamilyPhotoLikeCount}张照片点了爱心`;
  const unviewedFamilyReceiptCount = familyReceipts.filter(item => !viewedFamilyReceiptIds.has(item.id)).length;
  const hasUnviewedPhotoFeedback = familyReceipts.some(item => item.type === 'photo_like' && !viewedFamilyReceiptIds.has(item.id));
  const familyReceiptMessages = familyReceipts.filter(item => item.type === 'message');
  const featuredFamilyMessage = familyReceiptMessages.find(item => !viewedFamilyReceiptIds.has(item.id)) ?? familyReceiptMessages[0];
  const featuredMessageViewed = featuredFamilyMessage ? viewedFamilyReceiptIds.has(featuredFamilyMessage.id) : false;
  const featuredVoicePlaybackState = featuredFamilyMessage
    ? (voicePlaybackStates[featuredFamilyMessage.id] ?? (featuredMessageViewed ? 'completed' : 'idle'))
    : 'idle';
  const featuredVoiceCompleted = featuredFamilyMessage?.format === 'voice' && featuredVoicePlaybackState === 'completed';
  const visibleFamilyReceiptsUnsorted = familyReceiptFilter === 'all'
    ? familyReceipts
    : familyReceipts.filter(item => item.type === familyReceiptFilter);
  const visibleFamilyReceipts = [...visibleFamilyReceiptsUnsorted].sort((a, b) => {
    const viewedDifference = Number(viewedFamilyReceiptIds.has(a.id)) - Number(viewedFamilyReceiptIds.has(b.id));
    if (viewedDifference !== 0) return viewedDifference;
    if (a.dayLabel !== b.dayLabel) return a.dayLabel === '今天' ? -1 : 1;
    return toMinutes(b.time) - toMinutes(a.time);
  });
  const groupedVisibleFamilyReceipts = [
    {
      key: 'unviewed',
      label: '未查看',
      description: '优先处理',
      receipts: visibleFamilyReceipts.filter(item => !viewedFamilyReceiptIds.has(item.id))
    },
    {
      key: 'viewed',
      label: '已查看',
      description: '按时间倒序',
      receipts: visibleFamilyReceipts.filter(item => viewedFamilyReceiptIds.has(item.id))
    }
  ].filter(group => group.receipts.length > 0);

  useEffect(() => {
    if (previewOpenScoreDetailsSignal > 0) {
      setExpandedScoreRule(null);
      setShowScoreDetails(true);
    }
  }, [previewOpenScoreDetailsSignal]);

  useEffect(() => {
    if (previewCloseScoreDetailsSignal > 0) {
      setShowScoreDetails(false);
      setExpandedScoreRule(null);
    }
  }, [previewCloseScoreDetailsSignal]);

  const effectiveScenario: HomeCareScenario = resolutionState?.status === 'resolved' && homeCareScenario !== 'medication_overdue' && homeCareScenario !== 'medication_expired' ? 'normal' : homeCareScenario;
  const isMedicationExpiredScenario = effectiveScenario === 'medication_expired';
  const isMedicationAttentionScenario = effectiveScenario === 'medication_overdue' || isMedicationExpiredScenario;
  const currentTimeLabel = isMedicationExpiredScenario ? '23:59' : homeCareScenario === 'medication_overdue' ? '22:10' : '18:26';
  const currentTimeMinutes = toMinutes(currentTimeLabel);
  const activityDataCutoffMinutes = effectiveScenario === 'inactivity' ? toMinutes('12:20') : currentTimeMinutes;

  // --- Room monitor sub-tab toggle ('trajectory' | 'durations') ---
  const [roomSubTab, setRoomSubTab] = useState<'trajectory' | 'durations'>('trajectory');
  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<'today' | 'yesterday' | 'before_yesterday'>('today');

  // --- Add Medication Form States ---
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedTimeSlot, setNewMedTimeSlot] = useState<'morning' | 'noon' | 'evening' | 'night'>('morning');
  const [newMedTimeStr, setNewMedTimeStr] = useState('08:00');
  const [newMedNote, setNewMedNote] = useState('');

  // 旧详情区仅使用统一家庭留言数据的读取投影，不再维护第二套消息状态。
  const familyMessages: FamilyMessage[] = sharedFamilyMessages.map(message => ({
    id: message.id,
    time: new Date(message.sentAtUtc).toTimeString().slice(0, 5),
    sender: message.sender === 'elder' ? 'parent' : 'child',
    text: message.text ?? `[语音 ${message.durationSeconds ?? 0}秒]`,
    status: message.status === 'viewed' || message.status === 'listened' ? 'read' : message.status === 'delivered' ? 'delivered' : 'sent'
  }));
  const [newMessageText, setNewMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // --- Room movement monitoring data (Daily roomstay durations) ---
  // We mock a duration structure that reflects standard patterns of an elder.
  // When location changes in simulator, we visually highlight that room and dynamically show stay duration.
  const roomStayDurations = useMemo(() => {
    if (selectedDate === 'yesterday') {
      return [
        { id: 'bedroom', name: '卧室', hours: 9.8, desc: '夜间主睡眠与下午午睡舒适看护', color: 'bg-indigo-500', icon: '🛏️' },
        { id: 'living', name: '客厅', hours: 5.5, desc: '晚间黄金档电视、老友来访茶叙活动', color: 'bg-sky-500', icon: '📺' },
        { id: 'kitchen', name: '厨房', hours: 1.8, desc: '烹饪一日三餐、智能天然气安全检测', color: 'bg-amber-500', icon: '🍳' },
        { id: 'bathroom', name: '洗手间', hours: 1.2, desc: '早晚热水淋浴及微动雷达防摔防滑安全守护', color: 'bg-teal-500', icon: '🚿' },
        { id: 'balcony', name: '阳台/户外', hours: 2.2, desc: '上午小区花园散步健身与下午阳台晒太阳', color: 'bg-emerald-500', icon: '🌳' },
      ];
    }
    if (selectedDate === 'before_yesterday') {
      return [
        { id: 'bedroom', name: '卧室', hours: 11.2, desc: '阴雨天气卧床看书及休息时间较多', color: 'bg-indigo-500', icon: '🛏️' },
        { id: 'living', name: '客厅', hours: 3.8, desc: '室内舒展、听京剧收听日常健康讲座', color: 'bg-sky-500', icon: '📺' },
        { id: 'kitchen', name: '厨房', hours: 1.2, desc: '加热配餐、天然气与明火防泄防干烧看护', color: 'bg-amber-500', icon: '🍳' },
        { id: 'bathroom', name: '洗手间', hours: 0.8, desc: '常规洗漱洗脸与起夜雷达智能防摔滞留巡检', color: 'bg-teal-500', icon: '🚿' },
        { id: 'balcony', name: '阳台/户外', hours: 0.5, desc: '小雨天气，仅在封闭阳台晾晒和整理衣物', color: 'bg-emerald-500', icon: '🌳' },
      ];
    }
    // Default: 'today'
    return [
      { id: 'bedroom', name: '卧室', hours: 10.5, desc: '昨夜主睡眠与下午午休时间', color: 'bg-indigo-500', icon: '🛏️' },
      { id: 'living', name: '客厅', hours: 4.5, desc: '早起看报、电视与室内有氧活动', color: 'bg-sky-500', icon: '📺' },
      { id: 'kitchen', name: '厨房', hours: 1.5, desc: '制作午餐及烧水天然气监控', color: 'bg-amber-500', icon: '🍳' },
      { id: 'bathroom', name: '洗手间', hours: 0.8, desc: '洗漱、入厕及毫米波雷达防摔监测', color: 'bg-teal-500', icon: '🚿' },
      { id: 'balcony', name: '阳台/户外', hours: 1.2, desc: '养花活动、下午阳光房静坐与小区散步', color: 'bg-emerald-500', icon: '🌳' },
    ];
  }, [selectedDate]);

  // --- 24-Hour Room Movement Trajectory Timeline ---
  const roomTrajectoryTimeline = useMemo(() => {
    if (selectedDate === 'yesterday') {
      return [
        {
          timeRange: '00:00 - 06:30',
          roomName: '卧室',
          icon: '🛏️',
          activity: '夜眠深睡与体动异常跌落监测',
          details: '前半夜深度睡眠占比42%（属于优良水平）。凌晨04:12有短时微幅体动翻身，床边坠落防区雷达安全反馈无异样。',
          color: 'bg-indigo-500',
          textColor: 'text-indigo-600',
          borderColor: 'border-indigo-100',
        },
        {
          timeRange: '06:30 - 08:00',
          roomName: '洗手间',
          icon: '🚿',
          activity: '晨起洗漱与热水淋浴防滑安全监视',
          details: '晨起热水淋浴共18分钟，浴室高敏雷达全程绿色呼吸守护中。沐浴期间无急剧重力下滑或大角度姿态跌倒。',
          color: 'bg-teal-500',
          textColor: 'text-teal-600',
          borderColor: 'border-teal-100',
        },
        {
          timeRange: '08:00 - 10:00',
          roomName: '厨房',
          icon: '🍳',
          activity: '营养早餐烹制与防干烧安全巡检',
          details: '长辈在厨房煮水饺与温热牛奶。气敏传感器及防干烧温感探头全程处于绿灯工作状态，气压流速平稳。',
          color: 'bg-amber-500',
          textColor: 'text-amber-600',
          borderColor: 'border-amber-100',
        },
        {
          timeRange: '10:00 - 12:00',
          roomName: '阳台/户外',
          icon: '🌳',
          activity: '上午户外散步与老友公园棋局',
          details: '前往小区花园散步，手环卫星定位与心率同步看护中。长辈共计步4200步，心率保持在 95 bpm 舒适有氧范围。',
          color: 'bg-emerald-500',
          textColor: 'text-emerald-600',
          borderColor: 'border-emerald-100',
        },
        {
          timeRange: '12:00 - 13:30',
          roomName: '厨房',
          icon: '🍳',
          activity: '爱心午餐与服药行为传感器打卡',
          details: '在厨房制作时令午餐。13:00 智能药盒提醒服用日常降脂药，抽屉检测到仓门开启，系统上传确认吃药绿标。',
          color: 'bg-amber-500',
          textColor: 'text-amber-600',
          borderColor: 'border-amber-100',
        },
        {
          timeRange: '13:30 - 15:30',
          roomName: '卧室',
          icon: '🛏️',
          activity: '卧室午休微体征无接触看护',
          details: '卧床静息深度午休约2小时。卧室防跌雷达呼吸微体征频率稳定，每分钟16次，无短暂窒息或体征骤降告警。',
          color: 'bg-indigo-500',
          textColor: 'text-indigo-600',
          borderColor: 'border-indigo-100',
        },
        {
          timeRange: '15:30 - 17:30',
          roomName: '阳台/户外',
          icon: '🌳',
          activity: '阳台静坐阅报与秋季兰花修剪',
          details: '在向阳封闭阳台摇椅上翻阅报纸，并为兰花浇水。阳台环境温湿度正常（24.5℃, 52%），环境清爽舒适。',
          color: 'bg-emerald-500',
          textColor: 'text-emerald-600',
          borderColor: 'border-emerald-100',
        },
        {
          timeRange: '17:30 - 19:00',
          roomName: '客厅',
          icon: '📺',
          activity: '子女亲情双向视频通话与踱步慢走',
          details: '客厅电视大屏提示来电。长辈与子女（您）进行了15分钟高清视频通话，精神面貌充沛饱满。通话后在客厅踱步消食。',
          color: 'bg-sky-500',
          textColor: 'text-sky-600',
          borderColor: 'border-sky-100',
        },
        {
          timeRange: '19:00 - 22:00',
          roomName: '客厅',
          icon: '📺',
          activity: '黄金档电视观赏与中药温水足浴',
          details: '在客厅沙发收看健康养生栏目。21:30 使用智能恒温足浴桶泡脚，客厅人体雷达持续维持绿色在场确认。',
          color: 'bg-sky-500',
          textColor: 'text-sky-600',
          borderColor: 'border-sky-100',
        },
        {
          timeRange: '22:00 - 24:00',
          roomName: '卧室',
          icon: '🛏️',
          activity: '熄灯入睡与全屋红外微波联动检测',
          details: '长辈22:15熄灯上床入睡，主卧和过道雷达自适应切换到夜间精细红外夜视与呼吸频率追踪算法中。',
          color: 'bg-indigo-500',
          textColor: 'text-indigo-600',
          borderColor: 'border-indigo-100',
        }
      ];
    }

    if (selectedDate === 'before_yesterday') {
      return [
        {
          timeRange: '00:00 - 07:30',
          roomName: '卧室',
          icon: '🛏️',
          activity: '深度静音睡眠与微颤呼吸评估模型',
          details: '整夜长辈呼吸深度平稳，无窒息异常。02:40 监测起夜1次（沿途红外地灯自动柔和亮起，4分半后顺利归床）。',
          color: 'bg-indigo-500',
          textColor: 'text-indigo-600',
          borderColor: 'border-indigo-100',
        },
        {
          timeRange: '07:30 - 08:30',
          roomName: '洗手间',
          icon: '🚿',
          activity: '晨起日常洗漱与血压血氧自主检测',
          details: '洗手间洗漱完毕后，长辈通过客厅智能中控一键晨测：血压 126/82 mmHg，血氧 98%，体征极其平稳。',
          color: 'bg-teal-500',
          textColor: 'text-teal-600',
          borderColor: 'border-teal-100',
        },
        {
          timeRange: '08:30 - 11:30',
          roomName: '卧室',
          icon: '🛏️',
          activity: '阴雨天卧床晨读与手关节热敷',
          details: '当天早晨天阴有微雨，气温微降。长辈在主卧依靠靠枕阅览报章，并开启智能手部热敷按摩器静养。',
          color: 'bg-indigo-500',
          textColor: 'text-indigo-600',
          borderColor: 'border-indigo-100',
        },
        {
          timeRange: '11:30 - 12:30',
          roomName: '厨房',
          icon: '🍳',
          activity: '电磁炉极速配餐与碗碟消杀',
          details: '采用电磁炉和微波炉进行半成品配餐加热，未开启明火。水槽洗碗后一键开启紫外线消杀柜安全工作。',
          color: 'bg-amber-500',
          textColor: 'text-amber-600',
          borderColor: 'border-amber-100',
        },
        {
          timeRange: '12:30 - 13:00',
          roomName: '客厅',
          icon: '📺',
          activity: '午间日常踱步走动与服药完成打卡',
          details: '在客厅踱步慢行消食，并在智能药盒语音提醒下，于12:45准时取出中午高血压控释药片，完成云端合规。',
          color: 'bg-sky-500',
          textColor: 'text-sky-600',
          borderColor: 'border-sky-100',
        },
        {
          timeRange: '13:00 - 15:30',
          roomName: '卧室',
          icon: '🛏️',
          activity: '卧室下午长时深度午休雷达护航',
          details: '床榻雷达监测长辈深度午休2.5小时。非侵入式微波心率保持在 64-67 bpm 优秀区间，呼吸频率均匀有致。',
          color: 'bg-indigo-500',
          textColor: 'text-indigo-600',
          borderColor: 'border-indigo-100',
        },
        {
          timeRange: '15:30 - 16:30',
          roomName: '阳台/户外',
          icon: '🌳',
          activity: '推窗通风与阳台干衣服晾收整理',
          details: '雨过天晴，推窗进行全屋通风换气。长辈在阳台活动约20分钟，整理晾干的衣物，阳台防跌雷达跟踪无异常。',
          color: 'bg-emerald-500',
          textColor: 'text-emerald-600',
          borderColor: 'border-emerald-100',
        },
        {
          timeRange: '16:30 - 19:30',
          roomName: '客厅',
          icon: '📺',
          activity: '经典京剧广播欣赏与下午温热红茶',
          details: '长辈在客厅使用智能蓝牙音箱点播经典戏曲，并使用防干烧电茶炉烹制一杯红茶，未触发超时无操作干烧警示。',
          color: 'bg-sky-500',
          textColor: 'text-sky-600',
          borderColor: 'border-sky-100',
        },
        {
          timeRange: '19:30 - 22:30',
          roomName: '卧室',
          icon: '🛏️',
          activity: '卧室睡前读物阅览与腿部拉伸操',
          details: '提前卧床看书，并在床边进行了5分钟针对膝关节和踝关节的拉伸保健操。雷达多维捕捉到微肢体动作。',
          color: 'bg-indigo-500',
          textColor: 'text-indigo-600',
          borderColor: 'border-indigo-100',
        },
        {
          timeRange: '22:30 - 24:00',
          roomName: '卧室',
          icon: '🛏️',
          activity: '夜眠模式全面加载与呼吸气道不通畅筛查',
          details: '熄灯上床。夜间全屋雷达多功能联动：智能评估慢波睡眠质量，对呼吸暂停进行前置动态算法筛查守护。',
          color: 'bg-indigo-500',
          textColor: 'text-indigo-600',
          borderColor: 'border-indigo-100',
        }
      ];
    }

    // Default: 'today'
    return [
      {
        timeRange: '00:00 - 07:00',
        roomName: '卧室',
        icon: '🛏️',
        activity: '夜间深睡与微动防坠床监测',
        details: '主睡眠阶段，体动频率正常。03:14 监测起夜1次洗手间（历时4分钟后安全折返床铺），无跌倒或超时滞留。',
        color: 'bg-indigo-500',
        textColor: 'text-indigo-600',
        borderColor: 'border-indigo-100',
      },
      {
        timeRange: '07:00 - 08:30',
        roomName: '洗手间',
        icon: '🚿',
        activity: '晨起洗漱与生理指标测量',
        details: '起床洗漱共12分钟，浴室雷达正常看护。随后进入厨房使用智能电热水壶烧温水。',
        color: 'bg-teal-500',
        textColor: 'text-teal-600',
        borderColor: 'border-teal-100',
      },
      {
        timeRange: '08:30 - 11:30',
        roomName: '客厅',
        icon: '📺',
        activity: '晨读、亲情大屏互动与晨测',
        details: '在客厅沙发阅报、收听早新闻，并进行血压/血氧日常晨测，中控屏播放了子女留言问候语音。',
        color: 'bg-sky-500',
        textColor: 'text-sky-600',
        borderColor: 'border-sky-100',
      },
      {
        timeRange: '11:30 - 13:00',
        roomName: '厨房',
        icon: '🍳',
        activity: '午餐制作、膳食与服药打卡',
        details: '进入厨房烹饪午餐，气敏阀门一切安全。12:30 在智能药盒语音督促下成功取出当日午间降压药服用。',
        color: 'bg-amber-500',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-100',
      },
      {
        timeRange: '13:00 - 15:00',
        roomName: '卧室',
        icon: '🛏️',
        activity: '舒适午休与非活动状态雷达护航',
        details: '卧室卧床静止休息约1.5小时，心率稳定在 65 bpm 左右，手环呼吸同步未现低氧异常。',
        color: 'bg-indigo-500',
        textColor: 'text-indigo-600',
        borderColor: 'border-indigo-100',
      },
      {
        timeRange: '15:00 - 18:00',
        roomName: '阳台/户外',
        icon: '🌳',
        activity: '修剪花木与户外阳光步行',
        details: '在向阳阳台静坐与浇花，16:15 戴手环下楼在小区花园散步晨练，同步计步步数已超额达标。',
        color: 'bg-emerald-500',
        textColor: 'text-emerald-600',
        borderColor: 'border-emerald-100',
      },
      {
        timeRange: '18:00 - 18:15',
        roomName: '厨房',
        icon: '🍳',
        activity: '晚餐收尾与厨房安全确认',
        details: '完成清淡晚餐烹调，智能炉温及防干烧插座正常关闭。',
        color: 'bg-amber-500',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-100',
      },
      {
        timeRange: '18:15 - 19:30',
        roomName: '客厅',
        icon: '📺',
        activity: '餐后在客厅走动消食',
        details: '餐后在客厅进行缓慢走动，最近一次活动于 10 分钟前同步。',
        color: 'bg-sky-500',
        textColor: 'text-sky-600',
        borderColor: 'border-sky-100',
      },
      {
        timeRange: '19:30 - 22:30',
        roomName: '客厅',
        icon: '📺',
        activity: '晚间电视休闲、温水浴足与沐浴',
        details: '客厅沙发观影。21:15 使用智能足浴桶，随后沐浴。洗手间雷达全开，未现气压骤降或重力倾跌异常。',
        color: 'bg-sky-500',
        textColor: 'text-sky-600',
        borderColor: 'border-sky-100',
      },
      {
        timeRange: '22:30 - 24:00',
        roomName: '卧室',
        icon: '🛏️',
        activity: '夜眠体征精细检测与睡眠评估',
        details: '长辈上床关灯，夜间低照度卧室红外看护、呼吸及睡眠质量评分模型已自动加载。',
        color: 'bg-indigo-500',
        textColor: 'text-indigo-600',
        borderColor: 'border-indigo-100',
      }
    ];
  }, [selectedDate]);

  const activeTimelineIndex = useMemo(() => {
    if (selectedDate === 'today') {
      const currentIndex = roomTrajectoryTimeline.findIndex(item => {
        const [start, end] = item.timeRange.split('-').map(value => value.trim());
        return activityDataCutoffMinutes >= toMinutes(start) && activityDataCutoffMinutes < toMinutes(end);
      });
      if (currentIndex !== -1) return currentIndex;
    }
    const idx = roomTrajectoryTimeline.findIndex(item => item.roomName === healthStats.location);
    return idx !== -1 ? idx : 0;
  }, [activityDataCutoffMinutes, healthStats.location, roomTrajectoryTimeline, selectedDate]);

  const activeIndex = selectedTimelineIndex !== null ? selectedTimelineIndex : activeTimelineIndex;

  // Render a single room block inside our interactive graphical floor plan layout
  const renderRoomBlock = (
    name: string, 
    emoji: string, 
    colClass: string, 
    bgColors: string, 
    textColor: string, 
    dotColor: string
  ) => {
    const isCurrentlyHere = healthStats.location === name || (name.includes('阳台') && healthStats.location.includes('阳台')) || (healthStats.location.includes('阳台') && name.includes('阳台'));
    const isSelectedInTrajectory = roomTrajectoryTimeline[activeIndex]?.roomName === name || (name.includes('阳台') && roomTrajectoryTimeline[activeIndex]?.roomName.includes('阳台')) || (roomTrajectoryTimeline[activeIndex]?.roomName.includes('阳台') && name.includes('阳台'));
    const duration = roomStayDurations.find(r => r.name === name || (name.includes('阳台') && r.name.includes('阳台')) || (r.name.includes('阳台') && name.includes('阳台')))?.hours || 0;

    return (
      <button
        key={name}
        type="button"
        onClick={() => {
          // Find the first index in roomTrajectoryTimeline matching this roomName
          const idx = roomTrajectoryTimeline.findIndex(item => item.roomName === name || (name.includes('阳台') && item.roomName.includes('阳台')));
          if (idx !== -1) {
            setSelectedTimelineIndex(idx);
          }
        }}
        className={`p-2 rounded-xl border-1.5 transition-all flex flex-col justify-between text-left relative cursor-pointer ${colClass} ${
          isSelectedInTrajectory 
            ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-100 z-10 saturate-120 scale-[1.02]' 
            : `${bgColors} border-slate-200 hover:bg-white hover:border-slate-300`
        }`}
      >
        {/* Live beacon / Pulsar */}
        {isCurrentlyHere && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 z-20">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        )}

        {/* Selection badge */}
        {isSelectedInTrajectory && (
          <span className="absolute -top-1.5 -left-1.5 bg-blue-600 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[10px] font-black z-20 shadow-xs">
            🔍
          </span>
        )}

        <div className="space-y-0.5">
          <div className="flex items-center gap-1">
            <span className="text-xs">{emoji}</span>
            <span className="text-4xs font-black text-slate-800">{name}</span>
          </div>
          <p className="text-[9px] font-bold text-slate-400 leading-none">
            {selectedDate === 'today' ? '今日' : selectedDate === 'yesterday' ? '昨日' : '前日'}停留: <strong className="font-mono text-slate-700 font-extrabold">{duration}h</strong>
          </p>
        </div>

        {/* Room-specific alert or status label */}
        <div className="flex items-center justify-between text-[8px] font-black mt-1">
          {isCurrentlyHere ? (
            <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-1 py-0.2 rounded-sm font-black flex items-center gap-0.5 animate-pulse text-[7px] tracking-tight">
              ● 实时在场
            </span>
          ) : isSelectedInTrajectory ? (
            <span className="text-blue-600 bg-blue-50 border border-blue-100 px-1 py-0.2 rounded-sm font-black text-[7px] tracking-tight">
              已选中时段
            </span>
          ) : (
            <span className="text-slate-400 font-medium">当前未检测</span>
          )}
        </div>
      </button>
    );
  };

  // Compute stats
  const medicationRowsSource: Medication[] = effectiveScenario === 'medication_on_track'
    ? medications.map(medication => medication.id === 'med-overdue'
      ? { ...medication, status: 'taken', takenTime: '17:40', consecutiveUnconfirmedDays: undefined, lastUnconfirmedAt: undefined }
      : medication)
    : medications;
  const takenCount = medicationRowsSource.filter(m => m.status === 'taken').length;
  const totalMeds = medicationRowsSource.length;
  const pendingMedications = medicationRowsSource.filter(m => m.status === 'untaken');
  const missedMedications = medicationRowsSource.filter(m => m.status === 'missed');
  const scheduledMedications = pendingMedications
    .filter(medication => toMinutes(medication.timeStr) > currentTimeMinutes)
    .sort((a, b) => toMinutes(a.timeStr) - toMinutes(b.timeStr));
  const overdueMedications = pendingMedications.filter(medication => toMinutes(medication.timeStr) <= currentTimeMinutes);
  const medicationExceptions = [...missedMedications, ...overdueMedications];
  const nextScheduledMedication = scheduledMedications[0];
  const todayMedicationRows = [...medicationRowsSource]
    .sort((a, b) => toMinutes(a.timeStr) - toMinutes(b.timeStr))
    .map(medication => {
      const isTaken = medication.status === 'taken';
      const isMissed = medication.status === 'missed';
      const isExpired = !isTaken && (isMissed || (isMedicationExpiredScenario && medication.id === 'med-3'));
      const isOverdue = !isTaken && (isMissed || toMinutes(medication.timeStr) <= currentTimeMinutes);
      return {
        ...medication,
        isTaken,
        isMissed,
        isExpired,
        isOverdue,
        statusLabel: isTaken
          ? `${medication.takenTime ?? medication.timeStr} 已服用`
          : isExpired
            ? '已过期未服用'
            : isOverdue
              ? '超时未服用'
            : '待服用'
      };
    });
  const overdueMedicationCount = todayMedicationRows.filter(medication => medication.isOverdue).length;
  const expiredMedicationCount = todayMedicationRows.filter(medication => medication.isExpired).length;
  const outstandingMedicationRows = todayMedicationRows
    .filter(medication => !medication.isTaken)
    .sort((left, right) => Number(right.isExpired) - Number(left.isExpired) || Number(right.isOverdue) - Number(left.isOverdue) || toMinutes(left.timeStr) - toMinutes(right.timeStr));
  const primaryMedicationException = outstandingMedicationRows.find(medication => medication.isExpired)
    ?? outstandingMedicationRows.find(medication => medication.isOverdue);
  const nextMedicationGroup = nextScheduledMedication
    ? scheduledMedications.filter(medication => medication.timeStr === nextScheduledMedication.timeStr)
    : [];
  const formatOverdueDuration = (plannedTime: string) => {
    const overdueMinutes = Math.max(0, currentTimeMinutes - toMinutes(plannedTime));
    if (overdueMinutes < 60) return `${overdueMinutes} 分钟`;
    const hours = Math.floor(overdueMinutes / 60);
    const minutes = overdueMinutes % 60;
    return minutes > 0 ? `${hours} 小时 ${minutes} 分钟` : `${hours} 小时`;
  };
  const selectedMedication = todayMedicationRows.find(medication => medication.id === selectedMedicationId) ?? outstandingMedicationRows[0] ?? todayMedicationRows[0];
  const selectedMedicationExpired = selectedMedication?.isExpired ?? false;
  const latestFamilyReply = [...familyMessages].reverse().find(message => message.status === 'replied');
  const visibleActivities = activities.filter(activity => !/(手环|心率|步数)/.test(activity.content));
  const isUrgent = resolutionState?.status === 'urgent';
  const isPending = resolutionState?.status === 'pending';
  const medicationWasResolved = false;
  const medicationIssueActive = isMedicationAttentionScenario || medicationExceptions.length > 0;
  const medicationPoints = isMedicationExpiredScenario ? 0 : effectiveScenario === 'medication_overdue' ? 15 : medicationExceptions.length === 0 || totalMeds === 0 ? 30 : Math.round((takenCount / totalMeds) * 30);
  const movementPoints = effectiveScenario === 'inactivity' ? (isUrgent ? 0 : 15) : 30;

  const getTrajectoryWidth = (timeRange: string) => {
    const [start, end] = timeRange.split('-').map(value => value.trim());
    const toHours = (value: string) => {
      const [hours, minutes] = value.split(':').map(Number);
      return hours + minutes / 60;
    };
    return `${Math.max(2, ((toHours(end) - toHours(start)) / 24) * 100)}%`;
  };

  const getTimelineSegmentState = (timeRange: string) => {
    if (selectedDate !== 'today') return { isFuture: false, recordedRatio: 1 };
    const [start, end] = timeRange.split('-').map(value => value.trim()).map(toMinutes);
    if (start >= activityDataCutoffMinutes) return { isFuture: true, recordedRatio: 0 };
    if (end <= activityDataCutoffMinutes) return { isFuture: false, recordedRatio: 1 };
    return { isFuture: false, recordedRatio: (activityDataCutoffMinutes - start) / (end - start) };
  };

  const getRecordedTimeRange = (timeRange: string) => {
    if (selectedDate !== 'today') return timeRange;
    const [start, end] = timeRange.split('-').map(value => value.trim());
    const cutoffLabel = effectiveScenario === 'inactivity' ? '12:20' : currentTimeLabel;
    return toMinutes(end) > activityDataCutoffMinutes ? `${start} - ${cutoffLabel}` : timeRange;
  };

  // --- Helper to log activity ---
  const addActivityLog = (content: string, type: ActivityLog['type']) => {
    if (setActivities) {
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 5);
      const newLog: ActivityLog = {
        id: `act-h5-${Date.now()}`,
        time: timeStr,
        content,
        type
      };
      setActivities(prev => [newLog, ...prev]);
    }
  };

  // --- Action: Add Medication ---
  const handleCreateMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim() || !newMedDosage.trim()) return;

    const newMed: Medication = {
      id: `med-${Date.now()}`,
      name: newMedName,
      dosage: newMedDosage,
      timeSlot: newMedTimeSlot,
      timeStr: newMedTimeStr,
      status: 'untaken',
      note: newMedNote || '遵医嘱服用'
    };

    if (setMedications) {
      setMedications(prev => [...prev, newMed]);
    }

    // Add activity log
    addActivityLog(`子女端APP：为您新增了日常用药计划【${newMedName}】(${newMedTimeStr}，剂量 ${newMedDosage})`, 'info');

    // Reset Form
    setNewMedName('');
    setNewMedDosage('');
    setNewMedTimeSlot('morning');
    setNewMedTimeStr('08:00');
    setNewMedNote('');
    setIsAddingMed(false);
  };

  // --- Action: Send voice reminder to elder speaker ---
  const handleSendReminder = (medName: string) => {
    alert(`📢 服药语音提醒已发送！长辈客厅和卧室的智能中控屏将播放语音：“张叔叔，您的子女通过手机提醒您：现在到了服用【${medName}】的时间，请及时服用。”`);
    addActivityLog(`子女端APP：向长辈家中中控终端推送了【${medName}】人工催促语音服药提醒`, 'warning');
  };

  // --- Mock Community Events Data ---
  const communityEvents: CommunityEvent[] = [
    { id: 'ev-1', title: '社区高血压与膳食管理讲座', time: '今天 09:30 - 11:00', location: '小区党群服务中心二楼', organizer: '长宁社区康养办', attendance: 'attended' },
    { id: 'ev-2', title: '老年书法绘画交流会', time: '本周六 14:00 - 16:30', location: '康寿养老中心一楼', organizer: '夕阳红书画协会', attendance: 'upcoming' },
    { id: 'ev-3', title: '智慧药盒操作体验', time: '下周一 10:00 - 11:30', location: '智能养老样板房', organizer: '孝心通智能康养部', attendance: 'upcoming' }
  ];

  const openDetails = (segment: 'status' | 'activities' | 'messages') => {
    setActiveSegment(segment);
    setShowDetails(true);
    window.requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // 安心看不再独立发送留言，该旧入口统一跳转家庭留言。
  const handleSendFamilyMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setNewMessageText('');
    setIsSendingMessage(false);
    onOpenFamilyMessages();
  };

  const exceptionConfig = effectiveScenario === 'medication_expired'
    ? {
        icon: Pill,
        eyebrow: '用药记录已过期',
        title: '19:00 阿司匹林当天未形成服用记录',
        description: '当天有效确认时段已结束，记录为已过期未服用',
        hint: '可查看详情后决定是否联系长辈',
        segment: 'status' as const
      }
    : effectiveScenario === 'medication_overdue'
    ? {
        icon: Pill,
        eyebrow: isUrgent ? '用药需要立即关注' : '用药等待确认',
        title: '19:00 阿司匹林已超过计划时间 3 小时',
        description: '中控屏已提醒，仍未收到用药确认',
        hint: '可查看详情后决定是否联系长辈',
        segment: 'status' as const
      }
    : effectiveScenario === 'inactivity'
      ? {
          icon: Footprints,
          eyebrow: isUrgent ? '活动情况需要立即关注' : '活动等待确认',
          title: isUrgent ? '长时间无活动且暂时联系不上' : '连续 6 小时未检测到活动',
          description: '最后活动 12:20 · 客厅，房间设备在线',
          hint: isUrgent ? '建议尽快联系社区照护人员协助确认' : '已排除午睡、外出签到和设备离线，建议联系确认',
          segment: 'status' as const
        }
      : null;

  const statusItems = [
    medicationIssueActive
      ? { key: 'medication', segment: 'status' as const, icon: Pill, iconClass: isMedicationExpiredScenario ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700', label: '用药情况', value: isMedicationExpiredScenario ? '有药物已过期未服用' : '晚间用药尚未确认', detail: isMedicationExpiredScenario ? '当天未形成服用记录' : '超过计划时间 3 小时 · 中控屏已提醒', score: `${medicationPoints}/30`, scoreClass: isMedicationExpiredScenario ? 'text-rose-700' : 'text-amber-700', priority: 0 }
      : { key: 'medication', segment: 'status' as const, icon: Pill, iconClass: 'bg-emerald-50 text-emerald-700', label: '用药情况', value: '目前均正常', detail: nextScheduledMedication ? `${nextScheduledMedication.timeStr} 服药计划 · 尚未到时间` : '今日用药情况已确认', score: `${medicationPoints}/30`, scoreClass: 'text-emerald-700', priority: 1 },
    { key: 'community', segment: 'activities' as const, icon: Calendar, iconClass: 'bg-emerald-50 text-emerald-700', label: '参加活动', value: '已参加今日活动', detail: '09:30 社区健康讲座已签到', score: '20/20', scoreClass: 'text-emerald-700', priority: 2 },
    effectiveScenario === 'inactivity'
      ? { key: 'movement', segment: 'status' as const, icon: Footprints, iconClass: isUrgent ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700', label: '在家走动', value: isUrgent ? '需要立即关注' : '较长时间未检测到活动', detail: '最后活动 12:20 · 已排除常规静默场景', score: `${movementPoints}/30`, scoreClass: isUrgent ? 'text-rose-700' : 'text-amber-700', priority: 0 }
      : { key: 'movement', segment: 'status' as const, icon: Footprints, iconClass: 'bg-emerald-50 text-emerald-700', label: '在家走动', value: '今日检测到居家活动', detail: `10分钟前 · 最近在${healthStats.location}`, score: `${movementPoints}/30`, scoreClass: 'text-emerald-700', priority: 3 },
    { key: 'family', segment: 'messages' as const, icon: Images, iconClass: 'bg-blue-50 text-blue-700', label: '家庭互动', value: latestFamilyReply ? '有 1 条留言回复' : '暂无新留言', detail: '照片暂无新点赞', score: latestFamilyReply ? '20/20' : '10/20', scoreClass: 'text-blue-700', priority: 4 }
  ].sort((a, b) => a.priority - b.priority);

  const resolutionOptions = homeCareScenario === 'medication_overdue' || homeCareScenario === 'medication_expired'
    ? ['老人表示已服用', '老人表示稍后服用', '暂未联系上']
    : ['已联系，长辈正常', '正在午睡', '已外出', '暂时联系不上'];

  const handleResolution = (option: string) => {
    const unreachable = option === '暂时联系不上' || option === '暂未联系上';
    const urgent = unreachable && homeCareScenario === 'inactivity';
    const pending = unreachable && (homeCareScenario === 'medication_overdue' || homeCareScenario === 'medication_expired');
    setResolutionState({
      status: urgent ? 'urgent' : pending ? 'pending' : 'resolved',
      text: urgent ? `${currentTimeLabel} 暂时联系不上，提醒已升级` : homeCareScenario === 'medication_overdue' || homeCareScenario === 'medication_expired' ? `${currentTimeLabel} 家属反馈：${option}` : `${pending ? currentTimeLabel : '18:34'} ${option}`
    });
    setShowResolutionOptions(false);
    setShowMedicationAttentionDetails(false);
    setMedicationContactStarted(false);
  };

  const trendRows = [
    {
      key: 'medication',
      label: '用药确认',
      summary: '近7天有3天未确认 · 连续2天',
      states: homeCareScenario === 'medication_overdue'
        ? ['normal', 'normal', 'warning', 'normal', 'normal', 'warning', 'warning']
        : ['normal', 'normal', 'warning', 'normal', 'warning', 'warning', 'normal']
    },
    {
      key: 'activity',
      label: '居家活动',
      summary: '近7天有2天活动明显偏少',
      states: homeCareScenario === 'inactivity'
        ? ['normal', 'normal', 'normal', 'normal', 'warning', 'normal', 'warning']
        : ['normal', 'warning', 'normal', 'normal', 'warning', 'normal', 'normal']
    }
  ] as const;
  const trendDayLabels = ['四', '五', '六', '日', '一', '二', '今'];

  const currentStateCopy = effectiveScenario === 'inactivity'
    ? { badge: '位置待确认', locationLabel: '最后记录位置', location: '客厅', updatedAt: '更新于 12:20 · 约6小时前', tone: 'amber' }
    : { badge: '老人在线', locationLabel: '当前位置', location: healthStats.location, updatedAt: effectiveScenario === 'medication_overdue' ? '更新于 22:00 · 10分钟前' : '更新于 1 分钟前', tone: 'green' };

  const scoreScenarioConfig = (() => {
    const normalDimensions = [
      {
        key: 'space',
        label: '空间作息',
        value: 40 as number | null,
        total: 40,
        state: '活动正常',
        detail: '今日检测到多个房间的合理切换与停留',
        definition: '今天在2个及以上房间形成活动记录，空间作息按正常情况计40分。',
        logs: [
          { time: '07:18', text: '卧室进入客厅，形成第二个房间记录', points: '已记录' },
          { time: '18:16', text: `在${healthStats.location}检测到活动`, points: '40分' }
        ]
      },
      {
        key: 'schedule',
        label: '日程完成',
        value: 40 as number | null,
        total: 40,
        state: '全部完成',
        detail: '今日2项已到期任务均已完成',
        definition: '只统计已经到计划时间的任务；2项到期任务都有完成记录，因此计40分。',
        logs: [
          { time: '08:12', text: '晨间用药由系统确认完成', points: '按时完成' },
          { time: '09:30', text: '社区健康讲座完成签到', points: '按时完成' }
        ]
      },
      {
        key: 'interaction',
        label: '亲情互动',
        value: 20 as number | null,
        total: 20,
        state: '有互动',
        detail: '今日收到1条老人语音回复',
        definition: '老人主动回复、发留言、给照片点爱心或形成查看回执，任一情况均视为有互动，计20分；多次互动不重复加分。',
        logs: [{ time: '15:42', text: '老人回复子女留言并发送语音', points: '有互动' }]
      }
    ];

    if (reassuranceScoreScenario === 'sensing' || reassuranceScoreScenario === 'device_offline') {
      const offline = reassuranceScoreScenario === 'device_offline';
      return {
        score: null as number | null,
        status: offline ? '设备离线' : '数据感知中',
        tone: offline ? 'warning' : 'muted',
        description: offline ? '中控屏或雷达连接中断，暂无法评估' : '全屋设备运行中，等待今日活动数据',
        dimensions: normalDimensions.map(item => ({
          ...item,
          value: null,
          state: offline ? '无法评估' : '等待记录',
          detail: offline ? '数据源离线，暂不计算本维度' : '尚未形成可用于评分的今日记录',
          definition: offline ? '相关设备离线，无法确认实际情况，本维度不计0分也不补满分。' : '系统尚未形成可确认记录，暂不计算本维度。',
          logs: []
        }))
      };
    }

    const dimensions = normalDimensions.map(item => ({ ...item, logs: [...item.logs] }));

    if (reassuranceScoreScenario === 'single_room') {
      dimensions[0] = {
        ...dimensions[0],
        value: 30,
        state: '单房间记录',
        detail: '连续单房间未满48小时，空间作息按第1天计分',
        definition: '家中配置多个房间雷达，但连续未满48小时只在1个房间形成记录，空间作息计30分。',
        logs: [
          { time: '07:20', text: '卧室检测到活动', points: '已记录' },
          { time: '截至18:26', text: '仅卧室形成记录，尚未检测到第二个房间', points: '30分' }
        ]
      };
    }

    if (reassuranceScoreScenario === 'single_room_day2') {
      dimensions[0] = {
        ...dimensions[0],
        value: 15,
        state: '需留意',
        detail: '连续48小时仅在卧室形成空间记录',
        definition: '连续满48小时、未满72小时未检测到第二个房间，空间作息计15分，并额外扣除5分连续风险分。',
        logs: [
          { time: '前天18:26', text: '卧室开始形成连续单房间记录', points: '开始累计' },
          { time: '今日18:26', text: '已连续48小时未检测到第二个房间', points: '-5分' }
        ]
      };
    }

    if (reassuranceScoreScenario === 'single_room_day3') {
      dimensions[0] = {
        ...dimensions[0],
        value: 0,
        state: '异常预警',
        detail: '已连续4天仅在卧室形成空间记录',
        definition: '连续满72小时未检测到第二个房间，空间作息计0分，并额外扣除10分连续风险分。',
        logs: [
          { time: '3天前18:26', text: '卧室开始形成连续单房间记录', points: '开始累计' },
          { time: '今日18:26', text: '已连续4天未检测到第二个房间', points: '-10分' }
        ]
      };
    }

    if (reassuranceScoreScenario === 'no_movement') {
      dimensions[0] = {
        ...dimensions[0],
        value: 30,
        state: '暂无移动',
        detail: '暂无移动记录，按数据兜底规则计基础分',
        definition: '雷达在线且数据服务正常，但今天尚未形成房间移动记录，暂按基础分30分计算；设备离线不适用此规则。',
        logs: [{ time: '截至18:26', text: '雷达在线，但今日暂无房间移动记录', points: '30分兜底' }]
      };
    }

    if (reassuranceScoreScenario === 'no_tasks') {
      dimensions[1] = {
        ...dimensions[1],
        value: 40,
        state: '今日无待办',
        detail: '今日无待办，不产生日程违约扣分',
        definition: '日程服务正常，且今天没有配置需要完成的任务，因此不扣分，日程完成计40分。',
        logs: [{ time: '今日', text: '未配置需在今天完成的用药、打卡或活动任务', points: '40分' }]
      };
    }

    if (reassuranceScoreScenario === 'schedule_not_due') {
      dimensions[1] = {
        ...dimensions[1],
        value: 40,
        state: '暂无到期事项',
        detail: '今天已配置2项日程，目前均未到计划时间',
        definition: '只统计截至当前时间已经到期的任务；未来任务暂不进入分母，因此日程完成计40分。',
        logs: [
          { time: '19:00', text: '晚间用药尚未到计划时间', points: '未到时间' },
          { time: '20:30', text: '晚间活动打卡尚未到计划时间', points: '未到时间' }
        ]
      };
    }

    if (reassuranceScoreScenario === 'schedule_overdue') {
      dimensions[1] = {
        ...dimensions[1],
        value: 20,
        state: '1项延期中',
        detail: '今日2项已到期任务中，1项完成、1项超过计划时间仍未完成',
        definition: '超过计划时间且尚无完成记录的任务会进入到期任务分母，该项暂计0分；补充完成记录后会重新计算。',
        logs: [
          { time: '08:12', text: '晨间用药由系统确认完成', points: '按时完成' },
          { time: '19:00', text: '晚间用药已超过计划时间，尚未确认完成', points: '延期中' }
        ]
      };
    }

    if (reassuranceScoreScenario === 'schedule_late_completed') {
      dimensions[1] = {
        ...dimensions[1],
        value: 40,
        state: '已全部完成',
        detail: '今日2项已到期任务均已完成，其中1项延期完成',
        definition: '任务超过计划时间后补充了可信完成记录，仍按已完成计分；明细保留延期时长，但当前规则不额外扣分。',
        logs: [
          { time: '08:12', text: '晨间用药由系统确认完成', points: '按时完成' },
          { time: '19:26', text: '晚间用药晚于计划时间26分钟确认完成', points: '延期完成' }
        ]
      };
    }

    if (reassuranceScoreScenario === 'schedule_uncompleted') {
      dimensions[1] = {
        ...dimensions[1],
        value: 20,
        state: '1项未完成',
        detail: '今日2项已到期任务中，1项完成、1项明确未完成',
        definition: '已到期且被明确标记为跳过或当日结束仍无完成记录的任务计入分母，该项计0分。',
        logs: [
          { time: '08:12', text: '晨间用药由系统确认完成', points: '按时完成' },
          { time: '19:00', text: '晚间用药已明确标记为今日未完成', points: '未完成' }
        ]
      };
    }

    if (reassuranceScoreScenario === 'medication_unconfirmed_day2') {
      dimensions[1] = {
        ...dimensions[1],
        value: 0,
        state: '连续未确认',
        detail: '已连续2个用药日没有形成有效确认记录',
        definition: '当天用药任务仍按完成比例计分；连续2个用药日均无有效确认时，再额外扣除5分连续风险分。',
        logs: [
          { time: '昨天08:00', text: '晨间用药到当日结束仍无确认记录', points: '未确认' },
          { time: '今天08:00', text: '晨间用药超过确认时段仍无记录', points: '-5分' }
        ]
      };
    }

    if (reassuranceScoreScenario === 'medication_unconfirmed_day3') {
      dimensions[1] = {
        ...dimensions[1],
        value: 0,
        state: '异常预警',
        detail: '已连续3个用药日没有形成有效确认记录',
        definition: '当天用药任务仍按完成比例计分；连续3个及以上用药日均无有效确认时，再额外扣除10分连续风险分。',
        logs: [
          { time: '2天前08:00', text: '晨间用药开始形成连续未确认记录', points: '开始累计' },
          { time: '今天08:00', text: '已连续3个用药日没有有效确认记录', points: '-10分' }
        ]
      };
    }

    if (reassuranceScoreScenario === 'medication_sync_gap') {
      dimensions[1] = {
        ...dimensions[1],
        value: null,
        state: '数据未完整',
        detail: '到期用药尚未形成可展示的有效确认记录',
        definition: '记录无法确认时，连续未确认计数暂停；本维度不计0分，也不补满分。记录恢复后直接按正常记录展示。',
        logs: [
          { time: '08:00', text: '晨间用药确认记录暂未获取', points: '未展示' }
        ]
      };
      return {
        score: null as number | null,
        status: '数据未完整',
        tone: 'muted',
        description: '用药确认记录暂不完整，暂无法计算今日总分',
        dimensions
      };
    }

    if (reassuranceScoreScenario === 'interaction_love') {
      dimensions[2] = {
        ...dimensions[2],
        value: 20,
        state: '有互动',
        detail: '老人今天给家人照片点了1次爱心',
        definition: '老人主动给留言或照片点爱心，视为形成1次有效亲情互动，亲情互动计20分。',
        logs: [{ time: '16:08', text: '老人给家庭相册中的照片点了爱心', points: '有互动' }]
      };
    }

    if (reassuranceScoreScenario === 'interaction_message') {
      dimensions[2] = {
        ...dimensions[2],
        value: 20,
        state: '有互动',
        detail: '老人今天发来1条语音留言',
        definition: '老人主动发送或回复语音留言，视为形成1次有效亲情互动，亲情互动计20分。',
        logs: [{ time: '15:42', text: '老人发来一条18秒语音留言', points: '有互动' }]
      };
    }

    if (reassuranceScoreScenario === 'interaction_multiple') {
      dimensions[2] = {
        ...dimensions[2],
        value: 20,
        state: '有互动',
        detail: '今天有2次互动：1条语音留言、1次照片爱心',
        definition: '当天发生任一有效互动即计20分；多次或多类互动会完整展示，但不会重复累加超过20分。',
        logs: [
          { time: '15:42', text: '老人发来一条18秒语音留言', points: '有互动' },
          { time: '16:08', text: '老人给家庭相册中的照片点了爱心', points: '有互动' }
        ]
      };
    }

    if (reassuranceScoreScenario === 'no_interaction') {
      dimensions[2] = {
        ...dimensions[2],
        value: 10,
        state: '暂无互动',
        detail: '暂无留言或照片互动，保留基础陪伴分',
        definition: '互动服务正常，但今天没有老人留言、回复、点爱心或查看回执，亲情互动保留基础分10分。',
        logs: [{ time: '截至18:26', text: '今天暂无新的留言、回复或照片互动', points: '10分兜底' }]
      };
    }

    if (reassuranceScoreScenario === 'partial_data') {
      dimensions[1] = {
        ...dimensions[1],
        value: null,
        state: '数据未更新',
        detail: '日程完成记录暂时无法读取',
        definition: '日程服务请求失败、超时或相关设备离线时，不能判断任务是否完成，本维度显示--，今日总分暂停计算。',
        logs: [
          { time: '08:12', text: '晨间用药存在已确认记录', points: '已知记录' },
          { time: '09:30', text: '社区活动完成状态暂未同步', points: '无法评估' }
        ]
      };
      dimensions[2] = {
        ...dimensions[2],
        value: 10,
        state: '暂无互动',
        detail: '暂无留言或照片互动，保留基础陪伴分',
        definition: '互动服务正常，但今天没有形成新的老人互动记录，亲情互动保留基础分10分。',
        logs: [{ time: '截至18:26', text: '今天暂无新的亲情互动记录', points: '10分兜底' }]
      };
    }

    if (reassuranceScoreScenario === 'normal' && effectiveScenario === 'medication_overdue') {
      dimensions[1] = {
        ...dimensions[1],
        value: 20,
        state: '1项延期中',
        detail: '今日2项已到期任务中有1项仍待确认',
        definition: '超过计划时间且尚无完成记录的任务会进入到期任务分母，该项暂计0分；完成后重新计算。',
        logs: [
          { time: '08:12', text: '晨间用药由系统确认完成', points: '按时完成' },
          { time: '19:00', text: '晚间用药超过计划时间，暂未确认', points: '延期中' }
        ]
      };
    }

    if (reassuranceScoreScenario === 'normal' && effectiveScenario === 'inactivity') {
      dimensions[0] = {
        ...dimensions[0],
        value: 30,
        state: '暂无新活动',
        detail: '最后活动记录为12:20，之后暂无移动记录',
        definition: '雷达在线但较长时间没有形成新的房间活动记录，空间作息暂按30分计算。',
        logs: [{ time: '12:20', text: '客厅最后一次检测到活动', points: '30分' }]
      };
    }

    if (reassuranceScoreScenario === 'partial_data') {
      return {
        score: null as number | null,
        status: '数据未完整',
        tone: 'muted',
        description: '部分记录未更新，暂无法计算今日总分',
        dimensions
      };
    }

    const rawScore = dimensions.reduce((sum, item) => sum + (item.value ?? 0), 0);
    const riskDeduction = reassuranceScoreScenario === 'single_room_day3'
      ? 10
      : reassuranceScoreScenario === 'medication_unconfirmed_day3'
        ? 10
      : reassuranceScoreScenario === 'single_room_day2'
        ? 5
        : reassuranceScoreScenario === 'medication_unconfirmed_day2'
          ? 5
          : 0;
    const score = Math.max(0, rawScore - riskDeduction);
    const isCritical = reassuranceScoreScenario === 'single_room_day3'
      || reassuranceScoreScenario === 'medication_unconfirmed_day3';
    const needsAttention = reassuranceScoreScenario === 'single_room_day2'
      || reassuranceScoreScenario === 'medication_unconfirmed_day2'
      || reassuranceScoreScenario === 'schedule_overdue'
      || reassuranceScoreScenario === 'schedule_uncompleted'
      || effectiveScenario !== 'normal';

    return {
      score,
      status: isCritical ? '异常预警' : needsAttention ? '需留意' : '记录正常',
      tone: isCritical ? 'critical' : needsAttention || score < 80 ? 'attention' : 'normal',
      description: isCritical
        ? reassuranceScoreScenario === 'medication_unconfirmed_day3'
          ? '连续3个用药日没有有效确认记录'
          : '已连续4天未检测到第二个房间'
        : reassuranceScoreScenario === 'single_room_day2'
          ? '连续48小时未检测到第二个房间'
          : reassuranceScoreScenario === 'medication_unconfirmed_day2'
            ? '连续2个用药日没有有效确认记录'
          : reassuranceScoreScenario === 'partial_data'
        ? '今日部分履约与互动数据尚未完整'
        : needsAttention
          ? '今日存在需要继续确认的记录'
          : '今日空间活动与日程履约情况良好',
      dimensions
    };
  })();

  const reassuranceScore = scoreScenarioConfig.score;
  const scoreDimensions = scoreScenarioConfig.dimensions;
  const scoreUnavailable = reassuranceScore === null;
  const scoreIsAttention = scoreScenarioConfig.tone === 'attention' || scoreScenarioConfig.tone === 'critical' || scoreScenarioConfig.tone === 'warning';
  const scoreValueClass = scoreUnavailable
    ? 'text-slate-400'
    : scoreScenarioConfig.tone === 'critical'
      ? 'text-rose-600'
      : scoreIsAttention
        ? 'text-orange-600'
        : 'text-blue-600';
  const scoreEmotionTone = scoreScenarioConfig.tone as ScoreEmotionRingProps['tone'];
  const scoreBadgeClass = scoreScenarioConfig.tone === 'normal'
    ? 'bg-emerald-50 text-emerald-700'
    : scoreScenarioConfig.tone === 'attention'
      ? 'bg-amber-50 text-amber-800'
      : scoreScenarioConfig.tone === 'critical'
        ? 'bg-rose-100 text-rose-800'
      : scoreScenarioConfig.tone === 'warning'
        ? 'bg-orange-100 text-orange-800'
        : 'bg-slate-100 text-slate-600';

  const effectiveActivityScenario: HomeActivityScenario =
    homeActivityScenario === 'normal' && effectiveScenario === 'inactivity'
      ? 'no_activity'
      : homeActivityScenario;
  const activityStatusCopy = (() => {
    switch (effectiveActivityScenario) {
      case 'partial_offline':
        return { label: '1个房间设备离线', className: 'bg-amber-50 text-amber-800', opensProfile: true };
      case 'all_offline':
        return { label: '设备离线', className: 'bg-orange-50 text-orange-800', opensProfile: true };
      case 'no_activity':
        return { label: '暂无记录', className: 'bg-slate-100 text-slate-600', opensProfile: false };
      case 'insufficient_history':
        return { label: '趋势数据不足', className: 'bg-slate-100 text-slate-600', opensProfile: false };
      case 'single_room_day2':
        return { label: '需留意', className: 'bg-amber-50 text-amber-800', opensProfile: false };
      case 'single_room_day3':
        return { label: '异常预警', className: 'bg-rose-50 text-rose-700', opensProfile: false };
      default:
        return { label: '设备在线', className: 'bg-emerald-50 text-emerald-700', opensProfile: false };
    }
  })();
  const todaySpaceSegments = (() => {
    switch (effectiveActivityScenario) {
      case 'partial_offline':
        return [
          { label: '卧室', width: 29.2, color: 'bg-[#7667F5]' },
          { label: '洗手间', width: 6.2, color: 'bg-[#24B8C7]' },
          { label: '记录缺失', width: 10.5, color: 'bg-slate-200' },
          { label: '厨房', width: 6.3, color: 'bg-[#F59E58]' },
          { label: '客厅', width: 24.6, color: 'bg-[#F4B740]' },
          { label: '未来时间', width: 23.2, color: 'bg-slate-100' }
        ];
      case 'all_offline':
        return [
          { label: '卧室', width: 29.2, color: 'bg-[#7667F5]' },
          { label: '洗手间', width: 6.2, color: 'bg-[#24B8C7]' },
          { label: '客厅', width: 29.6, color: 'bg-[#F4B740]' },
          { label: '设备离线后暂无记录', width: 35, color: 'bg-slate-200' }
        ];
      case 'no_activity':
        return [{ label: '今天暂未形成活动记录', width: 100, color: 'bg-slate-100' }];
      case 'single_room_day2':
      case 'single_room_day3':
        return [
          { label: '卧室', width: 76.8, color: 'bg-[#7667F5]' },
          { label: '未来时间', width: 23.2, color: 'bg-slate-100' }
        ];
      default:
        return [
          { label: '卧室', width: 29.2, color: 'bg-[#7667F5]' },
          { label: '洗手间', width: 6.2, color: 'bg-[#24B8C7]' },
          { label: '客厅', width: 12.5, color: 'bg-[#F4B740]' },
          { label: '厨房', width: 6.3, color: 'bg-[#F59E58]' },
          { label: '卧室', width: 8.3, color: 'bg-[#7667F5]' },
          { label: '未检测到室内活动', width: 12.5, color: 'bg-slate-200' },
          { label: '客厅', width: effectiveScenario === 'medication_overdue' ? 17.4 : 1.8, color: 'bg-[#F4B740]' },
          { label: '未来时间', width: effectiveScenario === 'medication_overdue' ? 7.6 : 23.2, color: 'bg-slate-100' }
        ];
    }
  })();

  const activityTrendCopy = (() => {
    switch (effectiveActivityScenario) {
      case 'partial_offline':
        return '部分房间记录暂不可用，暂不生成完整趋势。';
      case 'all_offline':
        return '设备离线，暂不生成活动趋势。';
      case 'no_devices':
        return '配置房间设备后，可查看活动记录与近7天趋势。';
      case 'loading':
        return '正在读取今天及近7天的活动记录。';
      case 'data_error':
        return '活动记录暂时无法读取，请稍后重新加载。';
      case 'no_activity':
        return '今天暂未形成活动记录，近7天趋势需结合后续记录判断。';
      case 'insufficient_history':
        return '近7天有效记录少于5天，暂无法判断活动趋势。';
      case 'single_room_day2':
        return '连续48小时主要在卧室形成记录，请留意长辈近况。';
      case 'single_room_day3':
        return '已连续4天主要在卧室形成记录，最近一次其他房间记录为7月22日18:26，建议尽快确认长辈近况。';
      default:
        return '近7天室内作息规律，房间切换频次正常，无异常单室久坐滞留。';
    }
  })();
  let activitySegmentOffset = 0;
  const activityTimelineSegments = todaySpaceSegments.map(segment => {
    const startMinutes = Math.round(activitySegmentOffset * 14.4);
    activitySegmentOffset += segment.width;
    const endMinutes = Math.round(activitySegmentOffset * 14.4);
    const formatMinutes = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    return {
      ...segment,
      startMinutes,
      endMinutes: Math.min(endMinutes, activityDataCutoffMinutes),
      timeRange: `${formatMinutes(startMinutes)}–${formatMinutes(Math.min(endMinutes, 1440))}`,
      duration: `${Math.max(1, Math.round((endMinutes - startMinutes) / 60 * 10) / 10)}小时`
    };
  });

  const activityRoomColumns = [
    { label: '卧室', x: 62, color: '#7B7BFF' },
    { label: '客厅', x: 119, color: '#FFB04C' },
    { label: '厨房', x: 176, color: '#FF7D00' },
    { label: '洗手间', x: 233, color: '#00B5D8' },
    { label: '未感知', x: 290, color: '#C9CDD4' }
  ];
  const resolveActivityRoom = (label: string) => {
    if (label === '卧室') return activityRoomColumns[0];
    if (label === '客厅') return activityRoomColumns[1];
    if (label === '厨房') return activityRoomColumns[2];
    if (label === '洗手间') return activityRoomColumns[3];
    return activityRoomColumns[4];
  };
  const activityChartTop = 24;
  const activityChartBottom = 180;
  const activityTimeToY = (minutes: number) => activityChartTop + (Math.min(minutes, activityDataCutoffMinutes) / activityDataCutoffMinutes) * (activityChartBottom - activityChartTop);
  const visibleActivitySegments = activityTimelineSegments.filter(segment => segment.label !== '未来时间' && segment.startMinutes < activityDataCutoffMinutes);
  const activityTimeTicks = [0, 240, 480, 720, 960, activityDataCutoffMinutes]
    .filter((value, index, values) => index === 0 || value > values[index - 1] + 30);
  const latestActivitySegment = visibleActivitySegments.at(-1);
  const activityStepPath = visibleActivitySegments.reduce((path, segment, index) => {
    const room = resolveActivityRoom(segment.label);
    const nextSegment = visibleActivitySegments[index + 1];
    const yStart = activityTimeToY(segment.startMinutes);
    const yEnd = activityTimeToY(segment.endMinutes);
    const nextRoom = nextSegment ? resolveActivityRoom(nextSegment.label) : null;
    const startCommand = index === 0 ? `M ${room.x} ${yStart}` : '';
    return `${path} ${startCommand} V ${yEnd}${nextRoom ? ` H ${nextRoom.x}` : ''}`;
  }, '').trim();

  const weeklyActivityComparison = {
    thisWeekTotal: 47.6,
    lastWeekTotal: 49.7,
    difference: -2.1
  };
  const weeklyActivityRatio = weeklyActivityComparison.thisWeekTotal / weeklyActivityComparison.lastWeekTotal;
  const weeklyActivityMarkerPosition = Math.min(94, Math.max(6, ((weeklyActivityRatio - 0.8) / 0.4) * 100));

  const resolvedCareFeedScenario: CareFeedScenario = effectiveScenario === 'medication_overdue'
    ? 'medication_overdue'
    : careFeedScenario;
  const careFeed = resolvedCareFeedScenario === 'medication_overdue'
    ? [
        { time: '19:00', type: '用药', text: '阿司匹林仍未确认', status: '需留意', tone: 'amber' },
        { time: '16:15', type: '空间动态', text: '客厅检测到活动', status: '已记录', tone: 'space' },
        { time: '09:30', type: '活动', text: '社区健康讲座', status: '已报名', tone: 'activity' }
      ]
    : resolvedCareFeedScenario === 'pending_only'
      ? [
          { time: '19:00', type: '计划', text: '阿司匹林肠溶片', status: '尚未开始', tone: 'future' }
        ]
      : [
        { time: effectiveScenario === 'inactivity' ? '12:20' : '18:16', type: '空间动态', text: effectiveScenario === 'inactivity' ? '客厅最后一次检测到活动' : `在${healthStats.location}检测到活动`, status: '已记录', tone: effectiveScenario === 'inactivity' ? 'amber' : 'space' },
        { time: '16:08', type: '亲情互动', text: '老人喜欢你发的家庭影像', status: '已互动', tone: 'interaction' },
        { time: '15:30', type: '预约服务', text: '上门理疗服务', status: '已预约', tone: 'service' },
        { time: '14:00', type: '其他事项', text: '午间测量事项', status: '已完成', tone: 'task' },
        { time: '09:30', type: '活动', text: '社区健康讲座', status: '已报名', tone: 'activity' },
        { time: '08:12', type: '用药', text: '晨间用药已确认', status: '已确认', tone: 'medication' }
      ];

  return (
    <div className="p-4 space-y-4 pb-6" id="h5-monitor-tab">
      <H5ElderStatusCard parentProfile={parentProfile} currentLocation={healthStats.location} scenario={elderStatusCardScenario} onOpenProfile={onOpenElderProfile}>
        {exceptionConfig && effectiveScenario === 'inactivity' && (
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-amber-50 px-3 py-2.5">
            <span className="min-w-0 truncate text-[10px] font-bold text-amber-800">{currentStateCopy.badge}</span>
            <button data-testid="exception-contact-button" type="button" onClick={() => setShowResolutionOptions(value => !value)} className={`ml-3 shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-bold ${isUrgent ? 'bg-rose-500 text-white' : 'bg-amber-300 text-amber-950'}`}>
              {isUrgent ? '再次联系' : '联系确认'}
            </button>
          </div>
        )}
      </H5ElderStatusCard>

      <button
        type="button"
        onClick={() => {
          setExpandedScoreRule(null);
          setShowScoreDetails(true);
        }}
        aria-haspopup="dialog"
        aria-label={`查看今日安心分明细，${scoreUnavailable ? '暂无评分' : `${reassuranceScore}分`}，${scoreScenarioConfig.status}`}
        className={`${SHOW_REASSURANCE_SCORE_CARD ? '' : 'hidden'} w-full rounded-3xl border bg-white p-4 text-left text-slate-900 shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
          scoreScenarioConfig.tone === 'critical'
            ? 'border-rose-200 hover:border-rose-300 hover:bg-rose-50/30'
            : scoreIsAttention
              ? 'border-orange-100 hover:border-orange-200 hover:bg-orange-50/20'
              : 'border-blue-100 hover:border-blue-200 hover:bg-blue-50/30'
        }`}
      >
        <div className="flex min-h-[96px] items-center justify-between gap-3">
          <div className="min-w-0 flex-1 self-center">
            <span className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold tracking-wide text-slate-400">今日安心分</span>
              <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${scoreBadgeClass}`}>{scoreScenarioConfig.status}</span>
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <strong className={`text-[42px] font-extrabold leading-none ${scoreValueClass}`}>{scoreUnavailable ? '--' : reassuranceScore}</strong>
              <span className="text-[11px] font-bold text-slate-500">分</span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 py-0.5 pl-1.5 pr-1 text-[9px] font-bold text-slate-400">
                /100
                <ChevronRight size={11} strokeWidth={2.5} aria-hidden="true" />
              </span>
            </div>
          </div>
          <span className="flex w-[84px] shrink-0 items-center justify-center">
            <ScoreEmotionRing score={reassuranceScore} tone={scoreEmotionTone} status={scoreScenarioConfig.status} />
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-3">
          {scoreDimensions.map(item => (
            <div key={item.label} className="px-1 text-center">
              <span className="block text-[10px] font-bold text-slate-600">{item.label}</span>
              <span className="mt-1 flex items-baseline justify-center">
                <strong className={`text-base leading-none ${
                  item.value === null
                    ? 'text-slate-400'
                    : scoreScenarioConfig.tone === 'critical' && item.key === 'space'
                      ? 'text-rose-600'
                      : item.value < item.total
                        ? 'text-orange-600'
                        : 'text-blue-600'
                }`}>{item.value === null ? '--' : item.value}</strong>
                <span className="ml-0.5 text-[9px] font-bold text-slate-300">/{item.total}</span>
              </span>
            </div>
          ))}
        </div>
      </button>

      {SHOW_REASSURANCE_SCORE_CARD && showScoreDetails && (
        <div className="absolute inset-0 z-50 flex items-end bg-slate-950/35">
          <button
            type="button"
            aria-label="关闭安心分明细"
            onClick={() => {
              setShowScoreDetails(false);
              setExpandedScoreRule(null);
            }}
            className="absolute inset-0 cursor-default"
          />
          <section role="dialog" aria-modal="true" aria-labelledby="score-detail-title" className="relative z-10 max-h-[74%] w-full overflow-y-auto rounded-t-[28px] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 pb-3 pt-2">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 id="score-detail-title" className="text-base font-extrabold text-slate-900">今日安心分明细</h4>
                  <p className="mt-0.5 text-[10px] text-slate-500">按空间作息、日程完成和亲情互动计算</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowScoreDetails(false);
                    setExpandedScoreRule(null);
                  }}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600"
                >
                  完成
                </button>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className={`flex items-center justify-between rounded-2xl px-3.5 py-3 ${
                scoreUnavailable
                  ? 'bg-slate-100'
                  : scoreScenarioConfig.tone === 'critical'
                    ? 'bg-rose-50'
                    : scoreIsAttention
                      ? 'bg-orange-50'
                      : 'bg-blue-50'
              }`}>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500">今日总分</span>
                  <strong className={`mt-0.5 block text-2xl font-extrabold ${scoreValueClass}`}>{scoreUnavailable ? '--' : `${reassuranceScore} 分`}</strong>
                </div>
                <span className={`rounded-full px-2.5 py-1.5 text-[10px] font-bold ${scoreBadgeClass}`}>{scoreScenarioConfig.status}</span>
              </div>

              {scoreDimensions.map(item => {
                const hasDeduction = item.value !== null && item.value < item.total;
                const ruleKey = item.key as keyof typeof scoreRuleContent;
                const rule = scoreRuleContent[ruleKey];
                const ruleExpanded = expandedScoreRule === ruleKey;
                return (
                  <section key={item.key} className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="flex items-start justify-between gap-3 bg-slate-50 px-3.5 py-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1">
                            <strong className="block text-xs text-slate-900">{item.label}</strong>
                            <button
                              type="button"
                              aria-label={`${ruleExpanded ? '收起' : '查看'}${item.label}计算规则`}
                              aria-expanded={ruleExpanded}
                              onClick={() => setExpandedScoreRule(current => current === ruleKey ? null : ruleKey)}
                              className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                                ruleExpanded ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'
                              }`}
                            >
                              <CircleHelp size={14} strokeWidth={2} />
                            </button>
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            item.value === null
                              ? 'bg-slate-200 text-slate-600'
                              : hasDeduction
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}>{item.state}</span>
                        </div>
                        <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{item.detail}</p>
                      </div>
                      <strong className={`shrink-0 text-sm ${
                        item.value === null
                          ? 'text-slate-400'
                          : scoreScenarioConfig.tone === 'critical' && item.key === 'space'
                            ? 'text-rose-600'
                            : hasDeduction
                              ? 'text-orange-600'
                              : 'text-emerald-700'
                      }`}>{item.value === null ? '--' : item.value}/{item.total}</strong>
                    </div>
                    {ruleExpanded && (
                      <div className="border-t border-blue-100 bg-blue-50/60 px-3.5 py-3">
                        <strong className="block text-[10px] text-blue-800">{rule.title}</strong>
                        <ul className="mt-2 space-y-1.5">
                          {rule.bullets.map(bullet => (
                            <li key={bullet} className="flex gap-2 text-[10px] leading-relaxed text-slate-600">
                              <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.logs.length > 0 ? (
                      <div className="divide-y divide-slate-100 px-3.5">
                        {item.logs.map((log, index) => (
                          <div key={`${item.key}-${index}`} className="grid grid-cols-[54px_1fr_auto] items-start gap-2 py-2.5">
                            <span className="text-[9px] font-bold text-slate-400">{log.time}</span>
                            <span className="text-[10px] leading-relaxed text-slate-600">{log.text}</span>
                            <span className={`text-[9px] font-bold ${
                              scoreScenarioConfig.tone === 'critical' && item.key === 'space'
                                ? 'text-rose-600'
                                : hasDeduction
                                  ? 'text-orange-600'
                                  : 'text-emerald-700'
                            }`}>{log.points}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-3.5 py-3 text-[10px] text-slate-400">当前没有可展示的评分记录</p>
                    )}
                  </section>
                );
              })}
              <p className="px-1 pb-1 text-[9px] leading-relaxed text-slate-400">
                安心分用于汇总当天记录，不代表医学诊断或绝对安全结论。
              </p>
            </div>
          </section>
        </div>
      )}

      {resolutionState?.status === 'resolved' && homeCareScenario !== 'medication_overdue' && (
        <section className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
          <CheckCircle size={18} className="shrink-0 text-emerald-600" />
          <div>
            <strong className="block text-xs text-emerald-800">提醒已解除</strong>
            <span className="mt-0.5 block text-[11px] text-emerald-700">{resolutionState.text}</span>
          </div>
        </section>
      )}

      <section data-testid="today-medication-card" className={`overflow-hidden rounded-[20px] border bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] ${primaryMedicationException ? 'border-rose-100' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Pill size={15} /></span>
            <h4 className="text-base font-extrabold text-slate-900">今日用药</h4>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${primaryMedicationException ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {totalMeds === 0 ? '今日无用药' : expiredMedicationCount > 0 ? `${expiredMedicationCount}次过期未服` : primaryMedicationException ? `${overdueMedicationCount}次超时未服` : outstandingMedicationRows.length > 0 ? `已服 ${takenCount}/${totalMeds} 次` : '正常服用'}
          </span>
        </div>

        {todayMedicationRows.length === 0 ? (
          <div className="border-t border-slate-100 px-5 py-6 text-center">
            <strong className="text-xs text-slate-700">今天没有用药计划</strong>
            <p className="mt-1 text-[10px] text-slate-400">新增用药提醒后会在这里展示</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto px-5 pb-4 pt-2">
              <div className="grid min-w-full" style={{ gridTemplateColumns: `repeat(${todayMedicationRows.length}, minmax(68px, 1fr))`, width: `${Math.max(100, todayMedicationRows.length * 24)}%` }} aria-label="今日用药时间轴">
                {todayMedicationRows.map((medication, index) => {
                  const nextMedication = todayMedicationRows[index + 1];
                  const isAlert = medication.isExpired || medication.isOverdue;
                  const lineCompleted = medication.isTaken && nextMedication?.isTaken;
                  const timelineStatus = medication.isTaken ? '已服' : isAlert ? '未服' : '待服';
                  return (
                    <div key={medication.id} className="relative flex min-w-0 flex-col items-center text-center">
                      {index < todayMedicationRows.length - 1 && <span className={`absolute left-1/2 top-3 h-px w-full ${lineCompleted ? 'bg-emerald-500' : 'border-t border-dashed border-slate-200'}`} aria-hidden="true" />}
                      <button
                        type="button"
                        disabled={!isAlert}
                        onClick={() => { setMedicationContactStarted(false); setSelectedMedicationId(medication.id); setShowMedicationAttentionDetails(true); }}
                        aria-label={`${medication.timeStr} ${medication.name} ${timelineStatus}`}
                        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-transform ${medication.isTaken ? 'border-emerald-500 bg-emerald-500 text-white' : isAlert ? 'border-rose-500 bg-rose-500 text-white shadow-[0_0_0_5px_rgba(245,63,63,0.10)] hover:scale-105' : 'border-slate-300 bg-white text-slate-400'} disabled:cursor-default`}
                      >
                        {medication.isTaken ? <Check size={13} strokeWidth={3} /> : isAlert ? <span className="text-[12px] font-black leading-none">!</span> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                      </button>
                      <strong className={`mt-2 text-[10px] ${isAlert ? 'text-rose-600' : 'text-slate-600'}`}>{medication.timeStr}</strong>
                      <span className={`mt-0.5 text-[9px] font-bold ${medication.isTaken ? 'text-emerald-600' : isAlert ? 'text-rose-600' : 'text-slate-400'}`}>{timelineStatus}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mx-5 border-t border-slate-100 pt-3">
              {primaryMedicationException ? (
                <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5">
                  <AlertCircle size={17} className="shrink-0 text-rose-500" />
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-[11px] text-rose-600">{primaryMedicationException.timeStr} 已{primaryMedicationException.isExpired ? '过期' : `超时 ${formatOverdueDuration(primaryMedicationException.timeStr)}`} · {primaryMedicationException.name}</strong>
                    {(primaryMedicationException.consecutiveUnconfirmedDays ?? 0) >= 2 && <span className="mt-0.5 block text-[9px] font-bold text-rose-500">已连续{primaryMedicationException.consecutiveUnconfirmedDays}个用药日未确认</span>}
                  </div>
                  <button type="button" onClick={() => { setMedicationContactStarted(false); setSelectedMedicationId(primaryMedicationException.id); setShowMedicationAttentionDetails(true); }} className="shrink-0 rounded-full bg-rose-500 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600">电话确认</button>
                </div>
              ) : nextScheduledMedication ? (
                <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                  <Bell size={16} className="shrink-0 text-blue-600" />
                  <strong className="min-w-0 flex-1 truncate text-[11px] text-slate-600">下一顿：{nextScheduledMedication.timeStr} · {nextMedicationGroup.length > 1 ? `${nextMedicationGroup.length} 种药物` : nextScheduledMedication.name}</strong>
                </div>
              ) : (
                <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-emerald-50 px-3 py-2.5 text-emerald-700"><CheckCircle size={16} className="shrink-0" /><strong className="text-[11px]">今天的用药计划已全部完成</strong></div>
              )}
            </div>

            {showTakenMedications && (
              <div className="border-t border-slate-100 bg-slate-50/60 px-5">
                <div className="divide-y divide-slate-200/70">
                  {todayMedicationRows.map(medication => (
                    <div key={medication.id} className="flex items-center gap-3 py-3">
                      <span className={`flex h-8 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold ${medication.isTaken ? 'bg-emerald-50 text-emerald-700' : medication.isOverdue ? 'bg-rose-50 text-rose-700' : 'bg-white text-slate-500'}`}>{medication.timeStr}</span>
                      <span className="min-w-0 flex-1 text-left"><strong className="block truncate text-[11px] text-slate-800">{medication.name}</strong><span className="mt-0.5 block truncate text-[9px] text-slate-500">{medication.dosage}</span></span>
                      <span className={`shrink-0 text-[9px] font-bold ${medication.isTaken ? 'text-emerald-600' : medication.isOverdue ? 'text-rose-600' : 'text-slate-400'}`}>{medication.statusLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="button" onClick={() => setShowTakenMedications(current => !current)} aria-expanded={showTakenMedications} className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 px-5 py-2.5 text-[10px] font-bold text-slate-500 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              {showTakenMedications ? '收起用药明细' : `查看全部 ${todayMedicationRows.length} 项`}
              <ChevronDown size={13} className={`transition-transform ${showTakenMedications ? 'rotate-180' : ''}`} />
            </button>
          </>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Home size={15} /></span>
            <h4 className="text-base font-extrabold text-slate-900">居家活动</h4>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${activityStatusCopy?.className ?? 'bg-emerald-50 text-emerald-700'}`}>
              {activityStatusCopy?.label ?? '设备在线'}
            </span>
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              {(['day', 'week'] as const).map(view => (
                <button
                  key={view}
                  type="button"
                  onClick={() => {
                    setSpaceView(view);
                    if (view === 'day') setSelectedActivityDay(null);
                    setSelectedActivitySegment(null);
                  }}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-bold ${spaceView === view ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                >
                  {view === 'day' ? '今日' : '7天'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {effectiveActivityScenario === 'loading' ? (
          <div className="animate-pulse space-y-3 px-4 py-5" aria-label="居家活动记录加载中">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-8 rounded-xl bg-slate-100" />
            <div className="h-3 w-48 rounded bg-slate-100" />
          </div>
        ) : effectiveActivityScenario === 'data_error' ? (
          <div className="px-4 py-6 text-center">
            <AlertCircle size={24} className="mx-auto text-slate-400" />
            <strong className="mt-2 block text-xs text-slate-700">活动记录暂时无法读取</strong>
            <p className="mt-1 text-[10px] text-slate-400">已有记录不会被清除，请稍后重新加载</p>
            <button
              type="button"
              onClick={() => setSelectedActivitySegment('已发起重新加载，请稍后查看')}
              className="mt-3 inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-600"
            >
              <RefreshCw size={12} />
              重新加载
            </button>
            {selectedActivitySegment && <p className="mt-2 text-[9px] text-blue-600">{selectedActivitySegment}</p>}
          </div>
        ) : effectiveActivityScenario === 'no_devices' ? (
          <div className="px-4 py-6 text-center">
            <Home size={24} className="mx-auto text-slate-300" />
            <strong className="mt-2 block text-xs text-slate-700">尚未配置居家活动设备</strong>
            <p className="mt-1 text-[10px] text-slate-400">配置房间设备后可查看活动时间带</p>
            <button type="button" onClick={onOpenElderProfile} className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700">
              查看老人档案
            </button>
          </div>
        ) : spaceView === 'day' ? (
          <div className="px-4 pb-3 pt-2.5">
            <div className="ml-9 grid grid-cols-5 text-center text-[9px] font-bold text-slate-500">
              {activityRoomColumns.map(room => <span key={room.label}>{room.label}</span>)}
            </div>

            <svg viewBox="0 0 320 196" className="mt-0.5 block w-full" role="img" aria-label="今日房间流转与停留时长轨迹图">
              <defs>
                <pattern id="unperceived-lane-pattern" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
                  <rect width="6" height="6" fill="#F4F5F6" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#D9DCE1" strokeWidth="1" />
                </pattern>
              </defs>
              {activityRoomColumns.map((room, index) => {
                const laneLeft = index === 0 ? 42 : (activityRoomColumns[index - 1].x + room.x) / 2;
                const laneRight = index === activityRoomColumns.length - 1 ? 318 : (room.x + activityRoomColumns[index + 1].x) / 2;
                return (
                  <rect
                    key={`${room.label}-lane`}
                    x={laneLeft}
                    y={activityChartTop - 8}
                    width={laneRight - laneLeft}
                    height={activityChartBottom - activityChartTop + 16}
                    fill={room.label === '未感知' ? 'url(#unperceived-lane-pattern)' : index % 2 === 0 ? '#FFFFFF' : '#F8F9FA'}
                  />
                );
              })}
              {activityRoomColumns.map(room => (
                <line key={room.label} x1={room.x} x2={room.x} y1={activityChartTop - 8} y2={activityChartBottom + 8} stroke="#ECEEF1" strokeWidth="1" />
              ))}
              {activityTimeTicks.map(minutes => {
                const y = activityTimeToY(minutes);
                const label = minutes === activityDataCutoffMinutes
                  ? currentTimeLabel
                  : `${String(Math.floor(minutes / 60)).padStart(2, '0')}:00`;
                return (
                  <g key={minutes}>
                    <line x1="42" x2="304" y1={y} y2={y} stroke="#F2F3F5" strokeWidth="1" />
                    <text x="36" y={y + 3} textAnchor="end" fontSize="8" fill="#86909C">{label}</text>
                  </g>
                );
              })}

              {activityStepPath && <path d={activityStepPath} fill="none" stroke="#D0D3D6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />}

              {visibleActivitySegments.map(segment => {
                const room = resolveActivityRoom(segment.label);
                const yStart = activityTimeToY(segment.startMinutes);
                const yEnd = activityTimeToY(segment.endMinutes);
                return (
                  <g
                    key={`${segment.label}-${segment.startMinutes}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${room.label} ${segment.timeRange} 约${segment.duration}`}
                    onClick={() => setSelectedActivitySegment(`${room.label} · ${segment.timeRange} · 约${segment.duration}`)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') setSelectedActivitySegment(`${room.label} · ${segment.timeRange} · 约${segment.duration}`);
                    }}
                    className="cursor-pointer outline-none"
                  >
                    <line x1={room.x} x2={room.x} y1={yStart} y2={yEnd} stroke={room.color} strokeWidth="3.5" strokeLinecap="round" />
                    <line x1={room.x} x2={room.x} y1={yStart} y2={yEnd} stroke="transparent" strokeWidth="14" />
                    <circle cx={room.x} cy={yStart} r="4.5" fill={room.color} stroke="white" strokeWidth="2" />
                  </g>
                );
              })}

              {latestActivitySegment && (() => {
                const latestRoom = resolveActivityRoom(latestActivitySegment.label);
                const latestY = activityTimeToY(latestActivitySegment.endMinutes);
                const tooltipOnLeft = latestRoom.x > 235;
                const tooltipX = tooltipOnLeft ? latestRoom.x - 62 : latestRoom.x + 14;
                const tooltipY = latestY - 31;
                return (
                  <g>
                    <circle cx={latestRoom.x} cy={latestY} r="14" fill="none" stroke={latestRoom.color} strokeWidth="1.5" opacity="0.18" />
                    <circle cx={latestRoom.x} cy={latestY} r="11" fill={latestRoom.color} opacity="0.14" className="animate-ping" />
                    <circle cx={latestRoom.x} cy={latestY} r="9" fill={latestRoom.color} stroke="white" strokeWidth="2" />
                    <PersonStanding x={latestRoom.x - 6} y={latestY - 6} width="12" height="12" color="white" strokeWidth={2.2} aria-hidden="true" />
                    <path
                      d={tooltipOnLeft
                        ? `M ${tooltipX + 48} ${tooltipY + 10} L ${latestRoom.x - 7} ${latestY - 7} L ${tooltipX + 48} ${tooltipY + 14} Z`
                        : `M ${tooltipX} ${tooltipY + 10} L ${latestRoom.x + 7} ${latestY - 7} L ${tooltipX} ${tooltipY + 14} Z`}
                      fill="#1856EE"
                    />
                    <rect x={tooltipX} y={tooltipY} width="48" height="20" rx="10" fill="#1856EE" />
                    <text x={tooltipX + 24} y={tooltipY + 13} textAnchor="middle" fontSize="8" fontWeight="700" fill="white">当前位置</text>
                  </g>
                );
              })()}
            </svg>

            {selectedActivitySegment && (
              <div className="mt-2.5 rounded-xl bg-slate-50 px-3 py-2 text-[10px] text-slate-600">{selectedActivitySegment}</div>
            )}
          </div>
        ) : (
          <div className="px-4 pb-4 pt-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <strong className="block text-sm text-slate-900">
                  {effectiveActivityScenario === 'insufficient_history' ? '近7天数据不足' : '本周活动对比'}
                </strong>
                {effectiveActivityScenario === 'insufficient_history' && (
                  <span className="mt-1 block text-[10px] text-slate-500">有效记录少于5天，暂不比较</span>
                )}
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ${effectiveActivityScenario === 'normal' ? 'bg-amber-50 text-amber-700' : activityStatusCopy?.className ?? 'bg-slate-100 text-slate-600'}`}>
                {effectiveActivityScenario === 'normal' ? `较上周少 ${Math.abs(weeklyActivityComparison.difference)}小时` : activityStatusCopy?.label ?? '趋势参考'}
              </span>
            </div>

            <div className={effectiveActivityScenario === 'insufficient_history' ? 'mt-4' : 'mt-3'} aria-label="本周与上周整体活跃时长区间对比">
              <div className="mb-2 flex justify-between px-0.5 text-[9px] font-medium text-slate-500">
                <span>较少</span>
                <span>接近日常</span>
                <span>较多</span>
              </div>
              <div className="relative pt-4">
                {effectiveActivityScenario !== 'insufficient_history' && (
                  <div
                    className="absolute top-0 -translate-x-1/2 text-center"
                    style={{ left: `${weeklyActivityMarkerPosition}%` }}
                  >
                    <span className="block whitespace-nowrap rounded-full bg-blue-600 px-2 py-0.5 text-[8px] font-bold text-white shadow-sm">本周</span>
                    <span className="mx-auto block h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-blue-600" />
                  </div>
                )}
                <div className="flex h-3 overflow-hidden rounded-full ring-1 ring-inset ring-slate-100">
                  <div className="w-1/3 bg-amber-300" />
                  <div className="w-1/3 bg-emerald-500" />
                  <div className="w-1/3 bg-blue-200" />
                </div>
                <div className="absolute bottom-0 left-1/2 h-5 w-px -translate-x-1/2 bg-slate-700" aria-hidden="true" />
              </div>
              <div className="relative mt-1.5 h-4 text-[8px] text-slate-400">
                <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">上周基准</span>
              </div>

              <div className="mt-2 grid grid-cols-2 divide-x divide-slate-100 rounded-xl bg-slate-50 py-2.5 text-center">
                <div>
                  <span className="block text-[9px] text-slate-400">本周</span>
                  <strong className="mt-0.5 block text-xs text-blue-700">{effectiveActivityScenario === 'insufficient_history' ? '--' : `${weeklyActivityComparison.thisWeekTotal}小时`}</strong>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400">上周</span>
                  <strong className="mt-0.5 block text-xs text-slate-700">{weeklyActivityComparison.lastWeekTotal}小时</strong>
                </div>
              </div>
            </div>

            {effectiveActivityScenario !== 'normal' && effectiveActivityScenario !== 'insufficient_history' && (
              <div className={`mt-3 rounded-xl px-3 py-2.5 text-[10px] leading-relaxed ${effectiveActivityScenario === 'single_room_day3' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-900'}`}>
                <strong className="mr-1">活动趋势：</strong>{activityTrendCopy}
              </div>
            )}
          </div>
        )}
      </section>

      {exceptionConfig && effectiveScenario === 'inactivity' && showResolutionOptions && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <strong className="text-sm text-slate-900">联系后记录结果</strong>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{exceptionConfig.title}。{exceptionConfig.description}</p>
            </div>
            <button type="button" onClick={() => setShowResolutionOptions(false)} className="shrink-0 text-[11px] font-bold text-slate-400 hover:text-slate-700">收起</button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {resolutionOptions.map(option => (
              <button key={option} type="button" onClick={() => handleResolution(option)} className={`rounded-lg border px-2 py-2.5 text-[11px] font-bold ${option === '暂时联系不上' ? 'border-rose-200 text-rose-700 hover:bg-rose-50' : 'border-slate-200 text-slate-700 hover:border-blue-200 hover:bg-blue-50'}`}>
                {option}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-xs">
        <div className="flex items-center justify-between gap-4 px-5 pb-4 pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600"><MessageSquare size={16} /></span>
            <div className="min-w-0">
              <h4 className="text-base font-extrabold text-slate-900">亲情互动</h4>
              <p className={`mt-1 text-[10px] ${unviewedFamilyReceiptCount > 0 ? 'font-bold text-rose-500' : 'text-slate-400'}`}>{unviewedFamilyReceiptCount > 0 ? `${unviewedFamilyReceiptCount}条新互动待查看` : '今日互动已查看'}</p>
            </div>
          </div>
          {familyReceipts.length > 0 && <button type="button" onClick={() => openFamilyReceipts('all')} className="flex shrink-0 items-center gap-1 rounded-full bg-orange-50 px-3 py-2 text-[10px] font-bold text-orange-700">查看记录<ChevronRight size={13} /></button>}
        </div>

        {familyReceiptScenario === 'loading' ? (
          <div className="animate-pulse space-y-2 px-4 py-4" aria-label="亲情互动加载中"><div className="h-10 rounded-xl bg-slate-100" /><div className="h-10 rounded-xl bg-slate-100" /></div>
        ) : familyReceiptScenario === 'data_error' ? (
          <div className="px-4 py-5 text-center"><AlertCircle size={22} className="mx-auto text-slate-300" /><p className="mt-2 text-[10px] text-slate-500">请稍后重新加载</p></div>
        ) : familyReceipts.length === 0 ? (
          <div className="px-4 py-5 text-center"><MessageSquare size={22} className="mx-auto text-slate-300" /><p className="mt-2 text-[10px] text-slate-500">有新互动后会在这里展示</p></div>
        ) : <div className="divide-y divide-slate-100 px-5 pb-1">
          {featuredFamilyMessage && <div className="flex items-center gap-3.5 py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Mic2 size={18} /></span>
              <button type="button" onClick={onOpenFamilyMessages} className="min-w-0 flex-1 text-left">
                <span className="flex items-center gap-1.5">
                  <strong className="truncate text-xs text-slate-900">{featuredFamilyMessage.title}</strong>
                  {!featuredMessageViewed && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-label="未查看" />}
                </span>
                <span className="mt-1.5 block truncate text-[10px] text-slate-500">“{featuredFamilyMessage.detail}” · {featuredFamilyMessage.dayLabel}{featuredFamilyMessage.time} · {featuredFamilyMessage.durationSeconds}秒</span>
              </button>
              <button
                type="button"
                onClick={() => handleVoicePlayback(featuredFamilyMessage.id)}
                aria-label={featuredVoicePlaybackState === 'playing' ? '暂停语音' : featuredVoicePlaybackState === 'paused' ? '继续播放语音' : featuredVoiceCompleted ? '重新播放语音' : '播放语音'}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${featuredVoiceCompleted ? 'bg-emerald-500 hover:bg-emerald-600' : featuredVoicePlaybackState === 'paused' ? 'bg-slate-400 hover:bg-slate-500' : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                {featuredVoicePlaybackState === 'playing' ? <Pause size={16} /> : featuredVoiceCompleted ? <RefreshCw size={15} /> : <Play size={16} className="ml-0.5" />}
              </button>
          </div>}

          {todayFamilyPhotoLikeCount > 0 && <button type="button" onClick={onOpenFamilyPhotos} className="flex w-full items-center gap-3.5 py-5 text-left hover:bg-rose-50/40">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500" aria-hidden="true">
              <Images size={18} />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm"><Heart size={9} className="fill-rose-500 text-rose-500" /></span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <strong className="truncate text-xs text-slate-900">{latestMediaFeedbackTitle}</strong>
                {hasUnviewedPhotoFeedback && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-label="未查看" />}
              </span>
              <span className="mt-1.5 block truncate text-[10px] text-slate-500">{latestPhotoFeedback?.category || '周末全家福'} · 今天16:08</span>
            </span>
            <ChevronRight size={15} className="shrink-0 text-slate-300" />
          </button>}
        </div>}
      </section>

      {showFamilyReceipts && (
        <div className="absolute inset-0 z-[60] flex items-end bg-slate-950/40">
          <button type="button" aria-label="关闭互动记录" onClick={() => setShowFamilyReceipts(false)} className="absolute inset-0 cursor-default" />
          <section role="dialog" aria-modal="true" aria-labelledby="family-receipts-title" className="relative z-10 flex max-h-[78%] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200" />
            <header className="flex items-center justify-between border-b border-slate-100 px-4 pb-3 pt-2">
              <div>
                <h3 id="family-receipts-title" className="text-base font-extrabold text-slate-900">互动记录</h3>
                <p className="mt-0.5 text-[10px] text-slate-500">{unviewedFamilyReceiptCount > 0 ? `${unviewedFamilyReceiptCount}条未查看` : '已全部查看'} · 今日新增{todayVisibleFamilyReceipts.length}条</p>
              </div>
              <button type="button" onClick={() => setShowFamilyReceipts(false)} aria-label="关闭" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"><X size={16} /></button>
            </header>

            <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1.5">
              {([
                { value: 'all', label: `全部 ${familyReceipts.length}` },
                { value: 'message', label: `留言 ${familyMessageCount}` },
                { value: 'photo_like', label: `影像反馈 ${familyPhotoLikeCount}` }
              ] as const).map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFamilyReceiptFilter(option.value)}
                  aria-pressed={familyReceiptFilter === option.value}
                  className={`rounded-lg px-2 py-2 text-[10px] font-bold ${familyReceiptFilter === option.value ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
              {groupedVisibleFamilyReceipts.map(group => (
                <section key={group.key} aria-label={`${group.label}互动`} className="pt-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <strong className={`text-[11px] ${group.key === 'unviewed' ? 'text-blue-700' : 'text-slate-600'}`}>{group.label}</strong>
                      <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${group.key === 'unviewed' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{group.receipts.length}条</span>
                    </div>
                    <span className="text-[9px] text-slate-400">{group.description}</span>
                  </div>
                  {group.receipts.map(receipt => {
                    const receiptVoicePlaybackState = receipt.format === 'voice'
                      ? (voicePlaybackStates[receipt.id] ?? (group.key === 'viewed' ? 'completed' : 'idle'))
                      : 'idle';
                    return (
                    <div key={receipt.id} className={`flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0 ${group.key === 'viewed' ? 'opacity-75' : ''}`}>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${receipt.type === 'message' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-500'}`}>
                        {receipt.type === 'message' ? <Mic2 size={17} /> : <Heart size={17} className="fill-rose-500" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <strong className={`truncate text-xs ${group.key === 'viewed' ? 'text-slate-600' : 'text-slate-900'}`}>{receipt.title}</strong>
                          {group.key === 'unviewed' && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" aria-label="未查看" />}
                          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold ${receipt.type === 'message' ? 'bg-orange-50 text-orange-700' : 'bg-rose-50 text-rose-700'}`}>{receipt.type === 'message' ? '语音留言' : '影像反馈'}</span>
                        </div>
                        <p className="mt-1 truncate text-[10px] text-slate-500">{receipt.detail}</p>
                        <span className={`mt-1 block text-[9px] ${receipt.format === 'voice' && group.key === 'viewed' ? 'font-bold text-emerald-600' : 'text-slate-400'}`}>{receipt.dayLabel} {receipt.time}{receipt.format === 'voice' ? ` · ${receipt.durationSeconds}秒` : ''}{receipt.format === 'voice' && group.key === 'viewed' ? ' · 已播放' : group.key === 'viewed' ? ' · 已查看' : ' · 未查看'}</span>
                      </div>
                      {receipt.format === 'voice' ? (
                        <button type="button" onClick={() => handleVoicePlayback(receipt.id)} aria-label={receiptVoicePlaybackState === 'playing' ? '暂停语音' : receiptVoicePlaybackState === 'completed' ? '重新播放语音' : '播放语音'} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${receiptVoicePlaybackState === 'completed' ? 'bg-emerald-500' : receiptVoicePlaybackState === 'paused' ? 'bg-slate-400' : 'bg-orange-500'}`}>
                          {receiptVoicePlaybackState === 'playing' ? <Pause size={14} /> : receiptVoicePlaybackState === 'completed' ? <RefreshCw size={13} /> : <Play size={14} className="ml-0.5" />}
                        </button>
                      ) : receipt.type === 'photo_like' ? (
                        <button type="button" onClick={() => openReceipt(receipt)} aria-label={`查看照片${receipt.detail}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400"><ChevronRight size={15} /></button>
                      ) : <button type="button" onClick={() => openReceipt(receipt)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400" aria-label="查看留言"><ChevronRight size={15} /></button>}
                    </div>
                    );
                  })}
                </section>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3">
              <button type="button" onClick={() => { setShowFamilyReceipts(false); onOpenFamilyMessages(); }} className="rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white">家庭留言</button>
              <button type="button" onClick={() => { setShowFamilyReceipts(false); onOpenFamilyPhotos(); }} className="rounded-xl bg-rose-50 py-2.5 text-xs font-bold text-rose-700">家庭影像</button>
            </div>
          </section>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-2 px-5 pb-3 pt-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <History size={15} />
          </span>
          <h4 className="text-base font-extrabold text-slate-900">今日动态</h4>
        </div>
        <div className="px-4 py-1">
          {resolvedCareFeedScenario === 'loading' ? (
            <div className="space-y-3 py-4" aria-label="今日动态加载中">
              {[0, 1, 2].map(item => <div key={item} className="flex animate-pulse items-center gap-3"><span className="h-3 w-10 rounded bg-slate-100" /><span className="h-2.5 w-2.5 rounded-full bg-slate-100" /><span className="h-8 flex-1 rounded-lg bg-slate-100" /></div>)}
            </div>
          ) : resolvedCareFeedScenario === 'data_error' ? (
            <div className="flex flex-col items-center py-6 text-center" role="status"><AlertCircle size={22} className="text-rose-400" /><strong className="mt-2 text-xs text-slate-700">动态读取失败</strong><span className="mt-1 text-[10px] text-slate-400">请稍后重试</span></div>
          ) : resolvedCareFeedScenario === 'no_records' ? (
            <div className="flex flex-col items-center py-6 text-center"><Clock size={22} className="text-slate-300" /><strong className="mt-2 text-xs text-slate-700">今天还没有动态</strong><span className="mt-1 text-[10px] text-slate-400">活动或日程形成记录后会自动展示</span></div>
          ) : careFeed.map(item => {
            const rowContent = <>
              <span className="w-10 shrink-0 font-mono text-[10px] font-bold text-slate-400">{item.time}</span>
              <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.tone === 'space' ? 'bg-emerald-500' : item.tone === 'medication' ? 'bg-blue-500' : item.tone === 'task' ? 'bg-violet-500' : item.tone === 'activity' ? 'bg-orange-500' : item.tone === 'service' ? 'bg-indigo-500' : item.tone === 'interaction' ? 'bg-rose-500' : item.tone === 'amber' ? 'bg-amber-500' : 'border border-dashed border-slate-400 bg-white'}`} />
              <span className="min-w-0 flex-1 text-left"><span className="text-[10px] font-bold text-slate-400">{item.type}</span><strong className="mt-0.5 block truncate text-xs text-slate-800">{item.text}</strong></span>
              <span className={`shrink-0 text-[10px] font-bold ${item.tone === 'space' ? 'text-emerald-700' : item.tone === 'medication' ? 'text-blue-700' : item.tone === 'task' ? 'text-violet-700' : item.tone === 'activity' ? 'text-orange-700' : item.tone === 'service' ? 'text-indigo-700' : item.tone === 'interaction' ? 'text-rose-700' : item.tone === 'amber' ? 'text-amber-700' : 'text-slate-400'}`}>{item.status}</span>
            </>;
            const actionable = resolvedCareFeedScenario === 'medication_overdue' && item.type === '用药';
            return actionable ? (
              <button key={`${item.time}-${item.type}`} type="button" onClick={() => { setMedicationContactStarted(false); setShowMedicationAttentionDetails(true); }} aria-haspopup="dialog" className="flex w-full gap-3 border-b border-slate-100 py-3 text-left last:border-b-0 hover:bg-amber-50/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                {rowContent}<ChevronRight size={14} className="mt-1 shrink-0 text-slate-300" />
              </button>
            ) : (
              <div key={`${item.time}-${item.type}`} className={`flex gap-3 border-b border-slate-100 py-3 last:border-b-0 ${item.tone === 'future' ? 'opacity-55' : ''}`}>{rowContent}</div>
            );
          })}
        </div>
      </section>

      {showMedicationAttentionDetails && typeof document !== 'undefined' && createPortal(
        <div className="absolute inset-0 z-[80] flex items-end justify-center overflow-hidden bg-slate-950/45 p-3" role="presentation" onClick={() => setShowMedicationAttentionDetails(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="medication-attention-title" onClick={event => event.stopPropagation()} className="max-h-[calc(100%_-_24px)] w-full overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-4 py-4">
              <div>
                <span className={`text-[10px] font-bold ${selectedMedicationExpired ? 'text-rose-700' : 'text-amber-700'}`}>用药详情</span>
                <h4 id="medication-attention-title" className="mt-1 text-base font-extrabold text-slate-900">{selectedMedication?.name ?? '药物'}{selectedMedicationExpired ? '已过期未服用' : '仍未确认'}</h4>
              </div>
              <button type="button" onClick={() => setShowMedicationAttentionDetails(false)} aria-label="关闭用药详情" className="rounded-full bg-slate-100 p-2 text-slate-500"><X size={16} /></button>
            </div>
            <div className="space-y-4 p-4">
              <div className={`rounded-2xl p-3.5 ${selectedMedicationExpired ? 'bg-rose-50' : 'bg-amber-50'}`}>
                <div className="flex items-center justify-between gap-3"><strong className={`text-sm ${selectedMedicationExpired ? 'text-rose-950' : 'text-amber-950'}`}>计划时间 {selectedMedication?.timeStr ?? '--:--'}</strong><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${selectedMedicationExpired ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>{selectedMedication?.statusLabel ?? '待确认'}</span></div>
                <p className={`mt-2 text-xs leading-relaxed ${selectedMedicationExpired ? 'text-rose-900' : 'text-amber-900'}`}>{selectedMedicationExpired ? '当天有效确认时段已结束，系统仍未收到服用记录，本次用药记为已过期未服用。' : (selectedMedication?.consecutiveUnconfirmedDays ?? 0) >= 2 ? `今天再次超过计划时间仍未形成服用记录，已连续${selectedMedication?.consecutiveUnconfirmedDays}天未确认服用。` : `截至 ${currentTimeLabel}，已超过计划时间，系统仍未收到用药确认。`}</p>
              </div>
              {(selectedMedication?.consecutiveUnconfirmedDays ?? 0) >= 2 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-xs text-slate-900">连续未确认记录</strong>
                    <span className="text-[10px] font-bold text-amber-700">连续 {selectedMedication?.consecutiveUnconfirmedDays} 天</span>
                  </div>
                  <div className="mt-3 space-y-2 text-[10px]">
                    <div className="flex items-center justify-between gap-3"><span className="text-slate-500">{selectedMedication?.lastUnconfirmedAt}</span><strong className="text-rose-700">已过期未服用</strong></div>
                    <div className="flex items-center justify-between gap-3"><span className="text-slate-500">今天 {selectedMedication?.timeStr}</span><strong className="text-amber-700">超时未服用</strong></div>
                  </div>
                </div>
              )}
              {resolutionState && (homeCareScenario === 'medication_overdue' || homeCareScenario === 'medication_expired') && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-blue-50 p-3.5">
                  <CheckCircle size={16} className="mt-0.5 shrink-0 text-blue-600" />
                  <div><strong className="text-xs text-blue-800">已记录家属反馈</strong><p className="mt-1 text-[10px] leading-relaxed text-blue-700">{resolutionState.text}。该反馈不会更改系统用药确认状态。</p></div>
                </div>
              )}
              {!medicationContactStarted ? (
                <div>
                  <p className="text-[11px] leading-relaxed text-slate-500">如需了解实际情况，可直接呼叫老人中控屏；是否联系由家属自行决定。</p>
                  <button type="button" onClick={() => setMedicationContactStarted(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white"><Phone size={15} />呼叫中控屏</button>
                </div>
              ) : (
                <div className="border-t border-slate-100 pt-4">
                  <strong className="text-sm text-slate-900">记录家属反馈（选填）</strong>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-500">仅作为家属备注，不会更改系统用药确认状态。</p>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {resolutionOptions.map(option => <button key={option} type="button" onClick={() => handleResolution(option)} className={`rounded-xl border px-3 py-2.5 text-left text-[11px] font-bold ${option === '暂未联系上' ? 'border-rose-200 text-rose-700 hover:bg-rose-50' : 'border-slate-200 text-slate-700 hover:border-blue-200 hover:bg-blue-50'}`}>{option}</button>)}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>,
        document.getElementById('h5-phone-screen') ?? document.body
      )}

      <div className="sticky bottom-2 z-20 flex gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur">
        <button type="button" onClick={() => alert('正在呼叫长辈中控屏…')} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white"><Phone size={14} />呼叫中控屏</button>
        <button type="button" onClick={onOpenPhotoShare} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-50 py-2.5 text-xs font-bold text-orange-700"><Images size={14} />发照片或视频给爸爸</button>
      </div>

      {false && showDetails && (
      <div ref={detailsRef} className="space-y-4 scroll-mt-4 animate-scale-in">

      {/* Segment Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
        <button
          onClick={() => setActiveSegment('status')}
          className={`flex-1 py-1.5 rounded-lg text-4xs font-black uppercase transition-colors flex items-center justify-center gap-1 cursor-pointer ${activeSegment === 'status' ? 'bg-white text-blue-600 shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Home size={12} />
          照护详情
        </button>
        <button
          onClick={() => setActiveSegment('activities')}
          className={`flex-1 py-1.5 rounded-lg text-4xs font-black uppercase transition-colors flex items-center justify-center gap-1 cursor-pointer ${activeSegment === 'activities' ? 'bg-white text-blue-600 shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Calendar size={12} />
          活动记录
        </button>
        <button
          onClick={() => setActiveSegment('messages')}
          className={`flex-1 py-1.5 rounded-lg text-4xs font-black uppercase transition-colors flex items-center justify-center gap-1 cursor-pointer ${activeSegment === 'messages' ? 'bg-white text-blue-600 shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <MessageSquare size={12} />
          留言互动
          {isSendingMessage && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-0.5 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* ================= SECTION 1: HOME STATUS & MEDICATION ================= */}
      {activeSegment === 'status' && (
        <div className="space-y-4 animate-scale-in">
          <section className={`overflow-hidden rounded-2xl border bg-white shadow-xs ${effectiveScenario === 'inactivity' ? isUrgent ? 'border-rose-200' : 'border-amber-200' : 'border-emerald-100'}`}>
            <div className={`flex items-start gap-3 p-4 ${effectiveScenario === 'inactivity' ? isUrgent ? 'bg-rose-50/70' : 'bg-amber-50/70' : 'bg-emerald-50/70'}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ${effectiveScenario === 'inactivity' ? isUrgent ? 'text-rose-600' : 'text-amber-700' : 'text-emerald-600'}`}><Footprints size={20} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-extrabold text-slate-900">{effectiveScenario === 'inactivity' ? isUrgent ? '长时间无活动且联系不上' : '较长时间未检测到活动' : '今天有正常走动'}</h4>
                  <strong className={`text-xs ${effectiveScenario === 'inactivity' ? isUrgent ? 'text-rose-700' : 'text-amber-700' : 'text-emerald-700'}`}>{movementPoints}/30</strong>
                </div>
                <p className="mt-1 text-xs text-slate-600">{effectiveScenario === 'inactivity' ? '最后活动 12:20 · 已排除常规静默场景' : `10 分钟前检测到活动 · 最近在${healthStats.location}`}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100 px-2 py-3 text-center">
              <div><span className="block text-[10px] text-slate-400">早晨</span><strong className="mt-1 block text-xs text-slate-800">卧室 → 客厅</strong></div>
              <div><span className="block text-[10px] text-slate-400">下午</span><strong className="mt-1 block text-xs text-slate-800">卧室 → 厨房</strong></div>
              <div><span className="block text-[10px] text-slate-400">现在</span><strong className={`mt-1 block text-xs ${effectiveScenario === 'inactivity' ? 'text-amber-700' : 'text-emerald-700'}`}>{effectiveScenario === 'inactivity' ? '待确认' : healthStats.location}</strong></div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">今日用药</h4>
                <p className="mt-0.5 text-xs text-slate-500">系统负责定时提醒，异常时才通知家属</p>
              </div>
              <strong className={`text-xs ${medicationIssueActive ? isUrgent ? 'text-rose-700' : 'text-amber-700' : 'text-emerald-700'}`}>{medicationIssueActive ? `${takenCount}/${totalMeds} 已确认` : '目前均正常'}</strong>
            </div>
            <div className="divide-y divide-slate-100">
              {medications.map(med => (
                <div key={med.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${med.status === 'taken' || (med.id === 'med-3' && medicationWasResolved) ? 'bg-emerald-50 text-emerald-600' : med.status === 'missed' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                    {med.status === 'taken' || (med.id === 'med-3' && medicationWasResolved) ? <CheckCircle size={16} /> : <Clock size={16} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-xs text-slate-900">{med.timeStr} · {med.name}</strong>
                    <span className="mt-0.5 block text-[10px] text-slate-500">{med.dosage}{med.note ? ` · ${med.note}` : ''}</span>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold ${med.status === 'taken' || (med.id === 'med-3' && medicationWasResolved) ? 'text-emerald-700' : med.status === 'missed' ? 'text-rose-700' : 'text-blue-700'}`}>
                    {med.id === 'med-3' && medicationWasResolved ? '22:18 已确认' : med.status === 'taken' ? `${med.takenTime} 已服` : med.status === 'missed' || toMinutes(med.timeStr) <= currentTimeMinutes ? '超时未确认' : '尚未到时间'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" />
                  <h4 className="text-sm font-extrabold text-slate-900">一天活动时间带</h4>
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">{effectiveScenario === 'inactivity' ? '颜色显示截至 12:20 的活动记录，之后的灰色区域暂无活动数据。' : '颜色表示各时段检测到活动的房间，点击色块查看记录。'}</p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">设备在线</span>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex justify-between px-0.5 text-[9px] font-medium text-slate-400">
                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
              </div>
              <div className="relative">
                <div className="flex h-10 overflow-hidden rounded-xl border-2 border-white bg-slate-100 shadow-sm ring-1 ring-slate-200">
                  {roomTrajectoryTimeline.map((item, index) => {
                    const segmentState = getTimelineSegmentState(item.timeRange);
                    return (
                      <button
                        key={`${item.timeRange}-${index}`}
                        type="button"
                        disabled={segmentState.isFuture}
                        aria-label={`${item.timeRange} ${item.roomName}${segmentState.isFuture ? ' 尚未发生' : ''}`}
                        title={segmentState.isFuture ? `${item.timeRange} · 尚未发生` : `${getRecordedTimeRange(item.timeRange)} · ${item.roomName}`}
                        onClick={() => setSelectedTimelineIndex(index)}
                        className={`relative h-full overflow-hidden border-r border-white/70 bg-slate-100 transition-all last:border-r-0 ${segmentState.isFuture ? 'cursor-default' : 'cursor-pointer'} ${activeIndex === index && segmentState.recordedRatio > 0 ? 'z-10 ring-2 ring-inset ring-slate-900/25' : ''}`}
                        style={{ width: getTrajectoryWidth(item.timeRange) }}
                      >
                        <span className={`absolute inset-y-0 left-0 ${item.color} opacity-85`} style={{ width: `${segmentState.recordedRatio * 100}%` }} />
                        {activeIndex === index && segmentState.recordedRatio > 0 && <span className="absolute inset-x-1 bottom-1 h-0.5 rounded-full bg-white" />}
                      </button>
                    );
                  })}
                </div>
                <span className="absolute -top-2 h-14 w-px bg-blue-600" style={{ left: `${(currentTimeMinutes / (24 * 60)) * 100}%` }} aria-hidden="true">
                  <span className="absolute -left-4 -top-4 whitespace-nowrap rounded bg-blue-600 px-1.5 py-0.5 text-[8px] font-bold text-white">现在</span>
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
              {roomStayDurations.map(room => (
                <span key={room.id} className="flex items-center gap-1.5 text-[10px] text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-sm ${room.color}`} />{room.name}
                </span>
              ))}
            </div>

            {roomTrajectoryTimeline[activeIndex] && (
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                <span className={`h-8 w-1 shrink-0 rounded-full ${roomTrajectoryTimeline[activeIndex].color}`} />
                <div className="min-w-0 flex-1">
                  <strong className="block text-xs text-slate-900">{roomTrajectoryTimeline[activeIndex].roomName}检测到活动</strong>
                  <span className="mt-0.5 block text-[11px] text-slate-500">{getRecordedTimeRange(roomTrajectoryTimeline[activeIndex].timeRange)} · 仅作为生活状态线索</span>
                </div>
              </div>
            )}
          </section>
          
          {/* A. NEW SEGMENT: Room Occupancy stay duration tracking */}
          <div className="hidden bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-1.5">
                <RefreshCw size={14} className="text-blue-600 animate-spin-slow" />
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                  {selectedDate === 'today' ? '今日' : selectedDate === 'yesterday' ? '昨日' : '前日'}房间活动概览
                </h4>
              </div>
              <span className="text-5xs text-slate-400 font-extrabold">
                {selectedDate === 'today' ? '设备在线 · 刚刚同步' : '历史设备记录'}
              </span>
            </div>

            {/* Date Switcher Pill Selector */}
            <div className="mb-3.5 space-y-1.5">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">📅 选择历史看护日期：</span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate('today');
                    setSelectedTimelineIndex(null);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    selectedDate === 'today'
                      ? 'bg-blue-600 text-white shadow-3xs font-black scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-850 bg-white border border-slate-200/40 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-4xs font-black">今天 (07-01)</span>
                  <span className="text-[8px] opacity-80 leading-none">实时数据流</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate('yesterday');
                    setSelectedTimelineIndex(0);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    selectedDate === 'yesterday'
                      ? 'bg-blue-600 text-white shadow-3xs font-black scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-850 bg-white border border-slate-200/40 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-4xs font-black">昨天 (06-30)</span>
                  <span className="text-[8px] opacity-80 leading-none">看护完整归档</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate('before_yesterday');
                    setSelectedTimelineIndex(0);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    selectedDate === 'before_yesterday'
                      ? 'bg-blue-600 text-white shadow-3xs font-black scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-850 bg-white border border-slate-200/40 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-4xs font-black">前天 (06-29)</span>
                  <span className="text-[8px] opacity-80 leading-none">阴雨天看护归档</span>
                </button>
              </div>
            </div>

            {/* Sub-tabs header for switching between Trajectory and Duration */}
            <div className="flex bg-slate-50 border border-slate-200/60 p-0.5 rounded-lg mb-3 text-5xs shrink-0 font-bold">
              <button
                type="button"
                onClick={() => setRoomSubTab('trajectory')}
                className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${roomSubTab === 'trajectory' ? 'bg-blue-600 text-white shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                🕒 24h房间活动时间线
              </button>
              <button
                type="button"
                onClick={() => setRoomSubTab('durations')}
                className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${roomSubTab === 'durations' ? 'bg-blue-600 text-white shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                📊 各房间停留时长
              </button>
            </div>

            {roomSubTab === 'trajectory' ? (
              <div className="space-y-3 animate-fade-in">
                <p className="text-5xs text-slate-500 font-medium leading-relaxed">
                  房间感知设备按时段记录人体活动与停留位置。点击下方<b>户型空间</b>或<b>24h时间轴色块</b>查看记录；数据仅作生活状态线索，不判断具体动作或健康状况。
                </p>

                {/* A. Interactive Floor Plan Layout */}
                <div className="grid grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 shadow-3xs relative overflow-hidden">
                  {/* Grid overlay for blueprint feel */}
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none opacity-[0.03]">
                    <div className="border-r border-b border-slate-900"></div>
                    <div className="border-r border-b border-slate-900"></div>
                    <div className="border-r border-b border-slate-900"></div>
                    <div className="border-r border-b border-slate-900"></div>
                    <div className="border-r border-b border-slate-900"></div>
                    <div className="border-b border-slate-900"></div>
                  </div>

                  {/* Render Room 1: Bedroom (卧室) - Left side, top */}
                  {renderRoomBlock('卧室', '🛏️', 'col-span-7 h-16', 'bg-indigo-50/40 border-indigo-200/50', 'text-indigo-600', 'bg-indigo-500')}

                  {/* Render Room 2: Bathroom (洗手间) - Right side, top */}
                  {renderRoomBlock('洗手间', '🚿', 'col-span-5 h-16', 'bg-teal-50/40 border-teal-200/50', 'text-teal-600', 'bg-teal-500')}

                  {/* Render Room 3: Kitchen (厨房) - Left side, middle */}
                  {renderRoomBlock('厨房', '🍳', 'col-span-5 h-16', 'bg-amber-50/40 border-amber-200/50', 'text-amber-600', 'bg-amber-500')}

                  {/* Render Room 4: Living Room (客厅) - Right side, middle */}
                  {renderRoomBlock('客厅', '📺', 'col-span-7 h-16', 'bg-sky-50/40 border-sky-200/50', 'text-sky-600', 'bg-sky-500')}

                  {/* Render Room 5: Balcony/Outdoor (阳台/户外) - Bottom span */}
                  {renderRoomBlock('阳台/户外', '🌳', 'col-span-12 h-11', 'bg-emerald-50/40 border-emerald-200/50', 'text-emerald-600', 'bg-emerald-500')}
                </div>

                {/* B. 24-Hour Continuous Activity Ribbon */}
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 shadow-3xs">
                  <div className="flex justify-between items-center text-5xs text-slate-450 font-black uppercase">
                    <span>🕒 24小时房间活动时间线</span>
                    <span className="text-blue-600 font-bold">点击色块切换时段</span>
                  </div>
                  <div className="flex h-5.5 rounded-lg overflow-hidden border border-slate-200 shadow-3xs">
                    {roomTrajectoryTimeline.map((item, idx) => {
                      const isSelected = activeIndex === idx;
                      
                      // Dynamically calculate segment width based on its timeRange
                      const parts = item.timeRange.split('-').map(p => p.trim());
                      let width = '10%';
                      if (parts.length === 2) {
                        const parseTime = (t: string) => {
                          const [h, m] = t.split(':').map(Number);
                          return h + (isNaN(m) ? 0 : m / 60);
                        };
                        const startVal = parseTime(parts[0]);
                        const endVal = parseTime(parts[1]);
                        const diff = endVal - startVal;
                        if (!isNaN(diff) && diff > 0) {
                          width = `${(diff / 24) * 100}%`;
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedTimelineIndex(idx)}
                          className={`${item.color} h-full transition-all relative flex items-center justify-center cursor-pointer ${
                            isSelected ? 'ring-2 ring-blue-600 ring-offset-1 z-10 scale-y-110 saturate-125 shadow-sm' : 'opacity-85 hover:opacity-100'
                          }`}
                          style={{ width }}
                          title={`${item.roomName} (${item.timeRange})`}
                        >
                          <span className="text-[10px] select-none">{item.icon}</span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Timeline Hour Scale Labels */}
                  <div className="flex justify-between text-[8px] font-mono font-bold text-slate-400 px-1 pt-0.5">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>24:00</span>
                  </div>
                </div>

                {/* C. Current Selection Detail Callout Card */}
                {roomTrajectoryTimeline[activeIndex] && (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 space-y-2 animate-scale-in">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-3xs bg-blue-600 text-white font-mono px-2 py-0.5 rounded-md font-bold">
                          {roomTrajectoryTimeline[activeIndex].timeRange}
                        </span>
                        <span className="text-4xs font-black text-slate-800 flex items-center gap-1">
                          <span>{roomTrajectoryTimeline[activeIndex].icon}</span>
                          <span>在 {roomTrajectoryTimeline[activeIndex].roomName}</span>
                        </span>
                      </div>
                      
                      <span className="text-5xs bg-emerald-100 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                        ✓ 设备数据有效
                      </span>
                    </div>

                    <h5 className="text-xs font-black text-slate-800">
                      {roomTrajectoryTimeline[activeIndex].roomName}活动记录
                    </h5>

                    <p className="text-4xs text-slate-600 font-medium leading-relaxed bg-white/70 p-2 rounded-lg border border-slate-100">
                      该时段在{roomTrajectoryTimeline[activeIndex].roomName}检测到人体活动。数据来自房间感知设备，仅作为活动线索，不用于判断具体动作或健康状况。
                    </p>
                  </div>
                )}

                {/* D. Full Day Sequential Timeline Log List (Scrollable list at the bottom for completeness) */}
                <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-5xs text-slate-500 font-black uppercase">📖 {selectedDate === 'today' ? '今日' : selectedDate === 'yesterday' ? '昨日' : '前日'}房间活动记录</span>
                    <span className="text-5xs text-slate-400">共 {roomTrajectoryTimeline.length} 个时段记录</span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {roomTrajectoryTimeline.map((item, index) => {
                      const isSelected = activeIndex === index;
                      const isCurrentlyHere = healthStats.location === item.roomName;
                      
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedTimelineIndex(index)}
                          className={`w-full p-2 rounded-lg border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-200 shadow-3xs ring-1 ring-blue-100' 
                              : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-3xs">{item.icon}</span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-4xs font-mono font-black text-slate-600">{item.timeRange}</span>
                                <span className="text-4xs font-black text-slate-800 bg-slate-100 px-1 py-0.2 rounded">{item.roomName}</span>
                                {isCurrentlyHere && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                )}
                              </div>
                              <p className="text-5xs text-slate-450 font-bold mt-0.5 truncate max-w-[150px]">检测到房间活动</p>
                            </div>
                          </div>
                          
                          <span className="text-[9px] text-blue-600 font-black">
                            {isSelected ? '已选择' : '查阅'} &rarr;
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <p className="text-5xs text-slate-500 font-medium leading-relaxed mb-1">
                  房间设备按日汇总人体活动时长，绿色标记表示当前检测到活动。数据仅作生活状态线索，设备异常与长辈异常会分开判断。
                </p>

                <div className="space-y-3">
                  {roomStayDurations.map((room) => {
                    const isActive = selectedDate === 'today' && healthStats.location === room.name;
                    // Dynamically normalize percent based on total hours sum
                    const totalHoursSum = roomStayDurations.reduce((sum, r) => sum + r.hours, 0);
                    const percent = totalHoursSum > 0 ? Math.round((room.hours / totalHoursSum) * 100) : 0;
                    return (
                      <div key={room.id} className="space-y-1">
                        <div className="flex justify-between items-center text-4xs font-bold">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <span className="text-3xs">{room.icon}</span>
                            <span className="text-xs font-black text-slate-800">{room.name}</span>
                            {isActive && (
                              <span className="text-5xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-md font-black flex items-center gap-1 animate-pulse">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span>
                                当前在此空间中
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-xs text-slate-800 font-black">{room.hours}小时</span>
                        </div>
                        <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${room.color} ${isActive ? 'opacity-100 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'opacity-80'}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <p className="text-5xs text-slate-400 font-semibold leading-normal">本日累计检测到 {room.hours} 小时人体活动</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* B. Medication sync and addition checklist */}
          <div className="hidden bg-white rounded-2xl p-4 border border-slate-100 shadow-xs relative">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-1.5">
                <Clock size={16} className="text-blue-600" />
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">今日用药监督与打卡</h4>
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className="text-5xs text-slate-500 font-bold">
                  已服 <span className="text-blue-600 font-black">{takenCount}</span>/{totalMeds}
                </span>
                <button
                  onClick={() => setIsAddingMed(!isAddingMed)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-5xs font-black px-2 py-1 rounded-lg flex items-center gap-0.5 shadow-3xs cursor-pointer transition-colors"
                >
                  <Plus size={10} />
                  新增计划
                </button>
              </div>
            </div>

            {/* ADD MEDICATION INLINE FORM OVERLAY */}
            {isAddingMed && (
              <form onSubmit={handleCreateMedication} className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 animate-scale-in">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                  <span className="text-4xs font-black text-blue-600 uppercase flex items-center gap-1">
                    <Sparkles size={10} />
                    替长辈录入新药单
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingMed(false)}
                    className="text-slate-400 hover:text-slate-600 text-4xs font-black"
                  >
                    取消
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-5xs text-slate-450 font-black uppercase block">1. 药品名称 *</label>
                  <input
                    type="text"
                    required
                    placeholder="例：硝苯地平控释片 (降压药)"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-3xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-5xs text-slate-450 font-black uppercase block">2. 服用剂量 *</label>
                    <input
                      type="text"
                      required
                      placeholder="例：30mg / 1片"
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-3xs font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-5xs text-slate-450 font-black uppercase block">3. 计划时段 *</label>
                    <select
                      value={newMedTimeSlot}
                      onChange={(e) => setNewMedTimeSlot(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-3xs font-semibold focus:outline-none focus:border-blue-500"
                    >
                      <option value="morning">上午/早餐前</option>
                      <option value="noon">中午/随午餐</option>
                      <option value="evening">下午/晚餐后</option>
                      <option value="night">睡前服用</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-5xs text-slate-450 font-black uppercase block">4. 具体时间</label>
                    <input
                      type="text"
                      placeholder="例：08:00"
                      value={newMedTimeStr}
                      onChange={(e) => setNewMedTimeStr(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-3xs font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-5xs text-slate-450 font-black uppercase block">5. 温馨医嘱备注</label>
                    <input
                      type="text"
                      placeholder="例：温开水服，忌空腹"
                      value={newMedNote}
                      onChange={(e) => setNewMedNote(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-3xs font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-3xs font-extrabold py-1.5 rounded-lg shadow-3xs transition-colors cursor-pointer"
                >
                  确认下发至中控药盒 📡
                </button>
              </form>
            )}

            {/* LIVE PHARMACY CHECKLIST WITH ACTION TRIGGERS */}
            <div className="space-y-2.5">
              {medications.map(med => (
                <div 
                  key={med.id} 
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${med.status === 'taken' ? 'bg-emerald-50/50 border-emerald-100' : med.status === 'missed' ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50/50 border-slate-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${med.status === 'taken' ? 'bg-emerald-100 text-emerald-600' : med.status === 'missed' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}`}>
                      <CheckCircle size={15} />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-800 tracking-tight leading-tight">{med.name}</h5>
                      <p className="text-3xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1 font-semibold">
                        <span>计划：<strong className="font-mono text-blue-600 font-extrabold">{med.timeStr}</strong></span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>剂量：{med.dosage}</span>
                      </p>
                      {med.note && (
                        <p className="text-5xs text-slate-400 mt-0.5 font-medium leading-normal italic">医嘱：{med.note}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {med.status === 'taken' ? (
                      <span className="text-5xs text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        已打卡服药 • {med.takenTime}
                      </span>
                    ) : med.status === 'missed' ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-5xs text-rose-600 font-extrabold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                          超时漏服 ❌
                        </span>
                        <button
                          onClick={() => handleSendReminder(med.name)}
                          className="text-5xs text-blue-600 hover:text-blue-500 font-black hover:underline cursor-pointer"
                        >
                          催服药
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-5xs text-orange-600 font-extrabold bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full animate-pulse">
                          待打卡 ⏳
                        </span>
                        <button
                          onClick={() => handleSendReminder(med.name)}
                          className="text-5xs bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded font-bold cursor-pointer"
                        >
                          呼叫服药
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ================= SECTION 2: COMMUNITY ACTIVITIES SIGNUP ================= */}
      {activeSegment === 'activities' && (
        <div className="space-y-4 animate-scale-in">
          {communityEvents.filter(evt => evt.attendance === 'attended').map(evt => (
            <section key={evt.id} className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-xs">
              <div className="flex items-start gap-3 bg-emerald-50/70 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600"><CheckCircle size={20} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900">今天已参加活动</h4>
                    <strong className="text-xs text-emerald-700">20/20</strong>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-800">{evt.title}</p>
                  <p className="mt-1 text-[10px] text-slate-500">09:30 已签到 · {evt.location}</p>
                </div>
              </div>
            </section>
          ))}

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              <h4 className="text-sm font-extrabold text-slate-900">接下来安排</h4>
            </div>
            <div className="divide-y divide-slate-100">
              {communityEvents.filter(evt => evt.attendance === 'upcoming').map(evt => (
                <div key={evt.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500"><Clock size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-xs text-slate-900">{evt.title}</strong>
                    <span className="mt-1 block truncate text-[10px] text-slate-500">{evt.time} · {evt.location}</span>
                  </div>
                  <ChevronRight size={15} className="shrink-0 text-slate-300" />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ================= SECTION 3: FAMILY MESSAGES & REPLIES ================= */}
      {activeSegment === 'messages' && (
        <div className="space-y-4 animate-scale-in">
          <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">今天有 1 条长辈回复</h4>
                <p className="mt-1 text-[10px] text-slate-500">照片暂无新点赞</p>
              </div>
              <strong className="text-xs text-blue-700">20/20</strong>
            </div>
          </section>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col">
            <div className="flex items-center gap-1.5 mb-2 border-b border-slate-100 pb-3 shrink-0">
              <MessageSquare size={16} className="text-blue-600" />
              <h4 className="text-sm font-extrabold text-slate-900">亲情留言</h4>
            </div>

            <p className="mb-4 text-[10px] leading-relaxed text-slate-500">
              留言将发送到家中中控屏，长辈可直接查看并回复。
            </p>

            {/* Conversation Flow */}
            <div className="space-y-4 pb-4">
              {familyMessages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  {/* Child Message */}
                  <div className="flex gap-2.5 flex-row-reverse">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                      我
                    </div>
                    <div className="max-w-[80%] space-y-0.5">
                      <div className="rounded-2xl rounded-tr-sm bg-blue-600 p-3 text-xs font-semibold leading-relaxed text-white">
                        {msg.text}
                      </div>
                      <span className="block text-right text-[10px] text-slate-400">
                        {msg.time} • {msg.status === 'replied' ? '长辈已回复' : msg.status === 'read' ? '长辈已读' : '已播报'}
                      </span>
                    </div>
                  </div>

                  {/* Reply Message if exists */}
                  {msg.replyText && (
                    <div className="flex gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700">
                        爸
                      </div>
                      <div className="max-w-[80%] space-y-0.5">
                        <div className="rounded-2xl rounded-tl-sm bg-slate-100 p-3 text-xs font-semibold leading-relaxed text-slate-800">
                          {msg.replyText}
                        </div>
                        {msg.replyTime && (
                          <span className="block text-[10px] text-slate-400">
                            {msg.replyTime} • 中控屏同步
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isSendingMessage && (
                <div className="flex gap-2.5">
                  <div className="w-6.5 h-6.5 rounded-full bg-slate-100 border border-slate-200 text-blue-600 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                  </div>
                  <div className="bg-slate-50 rounded-xl rounded-tl-none p-2 shadow-3xs border border-slate-100 max-w-[70%]">
                    <span className="text-5xs text-slate-400 animate-pulse font-bold">长辈正在查收/中控语音播报中...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleSendFamilyMessage} className="sticky bottom-0 -mx-1 mt-auto flex gap-2 border-t border-slate-100 bg-white px-1 pt-3">
              <input
                type="text"
                required
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                disabled={isSendingMessage}
                placeholder="给长辈留句话…"
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium focus:border-blue-600 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!newMessageText.trim() || isSendingMessage}
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-200"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= TELEMETRY ACTIVITIES LOG (FROM THE IoT DEVICE) ================= */}
      <div className="hidden bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
          <div className="flex items-center gap-1.5">
            <RefreshCw size={15} className="text-blue-600 animate-spin-slow" />
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">最近同步动态</h4>
          </div>
          <span className="text-5xs text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">
            实时连通
          </span>
        </div>

        <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
          {visibleActivities.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 font-semibold">暂无最新同步动态</div>
          ) : (
            visibleActivities.map((act, index) => (
              <div key={act.id} className="flex gap-2.5 relative">
                {/* Timeline vertical connector */}
                {index !== visibleActivities.length - 1 && (
                  <div className="absolute top-5 left-2.5 bottom-0 w-0.5 bg-slate-100 -translate-x-1/2"></div>
                )}
                
                <div className={`w-5 h-5 rounded-full flex items-center justify-center relative z-10 shrink-0 mt-0.5 ${
                  act.type === 'alert' ? 'bg-rose-100 text-rose-600 ring-4 ring-rose-50' :
                  act.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                  act.type === 'medication' ? 'bg-emerald-100 text-emerald-600' :
                  act.type === 'health' ? 'bg-blue-100 text-blue-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {act.type === 'alert' ? <AlertCircle size={10} /> :
                   act.type === 'medication' ? <CheckCircle size={10} /> :
                   <span className="w-1.5 h-1.5 rounded-full bg-current"></span>}
                </div>

                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 leading-none">{act.content}</span>
                    <span className="text-4xs font-mono font-bold text-slate-400">{act.time}</span>
                  </div>
                  <p className="text-4xs text-slate-450 font-bold">
                    {act.type === 'alert' ? '紧急求救上报' :
                     act.type === 'warning' ? '中控预警推送' :
                     act.type === 'medication' ? '智能药盒触发' :
                     act.type === 'health' ? '长辈测量录入' : '空间雷达感应'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
      )}

    </div>
  );
};
