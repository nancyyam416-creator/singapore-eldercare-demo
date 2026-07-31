/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Cpu,
  MousePointerClick,
  RotateCcw,
  X
} from 'lucide-react';
import {
  ElderProfileDataScenario,
  ElderProfileDeviceScenario,
  ElderStatusCardScenario,
  HomeCareScenario,
  HomeActivityScenario,
  FamilyReceiptScenario,
  FamilyMessageScenario,
  FamilyPhotoScenario,
  FamilyReceiptFilter,
  CareFeedScenario,
  ReassuranceScoreScenario,
  ElderBindingScenario,
  ReminderScenario,
  ChildLoginScenario
} from '../types';

type ElderAcceptanceTarget = 'card' | 'profile';
type FamilyPhotoAcceptanceTarget = 'list' | 'publish';
type AcceptancePage = 'login' | 'home' | 'family' | 'care' | 'profile';
type AcceptanceModule = 'login' | 'elder' | 'score' | 'activity' | 'family_receipts' | 'today_feed' | 'family_messages' | 'family_photos' | 'reminders' | 'elder_binding';
type ScoreScenarioCategory = 'space' | 'schedule' | 'interaction' | 'overall';

interface H5InteractionWorkbenchProps {
  activePreviewPage: AcceptancePage;
  activePreviewFamilyModule: 'family_messages' | 'family_photos';
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
  elderBindingScenario: ElderBindingScenario;
  reminderScenario: ReminderScenario;
  loginScenario: ChildLoginScenario;
  elderProfileRadarExpanded: boolean;
  showSimulator: boolean;
  onHomeCareScenarioChange: (scenario: HomeCareScenario) => void;
  onHomeActivityScenarioChange: (scenario: HomeActivityScenario) => void;
  onFamilyReceiptScenarioChange: (scenario: FamilyReceiptScenario) => void;
  onFamilyMessageScenarioChange: (scenario: FamilyMessageScenario) => void;
  onFamilyPhotoScenarioChange: (scenario: FamilyPhotoScenario) => void;
  onOpenFamilyMessages: () => void;
  onOpenFamilyPhotos: () => void;
  onOpenHome: () => void;
  onOpenElderBinding: () => void;
  onCareFeedScenarioChange: (scenario: CareFeedScenario) => void;
  onElderStatusCardScenarioChange: (scenario: ElderStatusCardScenario) => void;
  onReassuranceScoreScenarioChange: (scenario: ReassuranceScoreScenario) => void;
  onElderProfileDataScenarioChange: (scenario: ElderProfileDataScenario) => void;
  onElderProfileDeviceScenarioChange: (scenario: ElderProfileDeviceScenario) => void;
  onElderBindingScenarioChange: (scenario: ElderBindingScenario) => void;
  onReminderScenarioChange: (scenario: ReminderScenario) => void;
  onLoginScenarioChange: (scenario: ChildLoginScenario) => void;
  onOpenLogin: () => void;
  onElderProfileRadarExpandedChange: (expanded: boolean) => void;
  onOpenElderProfile: () => void;
  onCloseElderProfile: () => void;
  onOpenScoreDetails: () => void;
  onCloseScoreDetails: () => void;
  onOpenFamilyReceipts: (filter: FamilyReceiptFilter) => void;
  onCloseFamilyReceipts: () => void;
  onCompleteFamilyVoice: () => void;
  onOpenMedicationDetails: () => void;
  onOpenReminders: () => void;
  onReset: () => void;
  onToggleSimulator: () => void;
}

const elderScenarios: Array<{ value: ElderStatusCardScenario; label: string; description: string }> = [
  { value: 'normal', label: '正常', description: '设备在线，存在最后位置' },
  { value: 'device_offline', label: '设备离线', description: '提示离线并保留最后位置' },
  { value: 'location_empty', label: '无位置', description: '没有可展示的位置记录' }
];

const homeActivityScenarios: Array<{ value: HomeActivityScenario; label: string; description: string; status: string }> = [
  { value: 'normal', label: '正常记录', description: '设备正常，今日已有房间活动记录', status: '正常' },
  { value: 'partial_offline', label: '部分设备离线', description: '1个房间设备离线，记录可能不完整', status: '需留意' },
  { value: 'all_offline', label: '全部设备离线', description: '保留离线前最后一段可信记录', status: '设备离线' },
  { value: 'no_devices', label: '未配置设备', description: '尚未绑定用于居家活动的房间设备', status: '未配置' },
  { value: 'loading', label: '记录加载中', description: '正在读取今日房间活动记录', status: '加载中' },
  { value: 'data_error', label: '记录读取失败', description: '活动记录暂时无法读取', status: '加载失败' },
  { value: 'no_activity', label: '今日暂无记录', description: '设备正常，但今天尚未检测到活动', status: '暂无记录' },
  { value: 'insufficient_history', label: '趋势数据不足', description: '近7天有效记录少于5天', status: '数据不足' },
  { value: 'single_room_day2', label: '连续单房间48小时', description: '连续48小时没有形成其他房间记录', status: '需留意' },
  { value: 'single_room_day3', label: '连续单房间72小时+', description: '示例：已连续4天没有形成其他房间记录', status: '异常预警' }
];

const familyMessageScenarios: Array<{ value: FamilyMessageScenario; label: string; description: string; status: string }> = [
  { value: 'normal', label: '双向留言', description: '老人文字、语音与子女留言同时展示', status: '正常' },
  { value: 'multi_elder', label: '多老人会话', description: '先展示会话列表，再进入一对一会话', status: '可切换' },
  { value: 'empty', label: '空会话', description: '已绑定老人，但还没有留言记录', status: '暂无留言' },
  { value: 'send_failed', label: '发送失败', description: '保留原文或语音，可点击重新发送', status: '可重试' },
  { value: 'voice_error', label: '语音播放失败', description: '播放失败时保留留言并提供重试', status: '播放失败' },
  { value: 'relationship_invalid', label: '家庭关系失效', description: '可查看历史，不可再发送留言', status: '已失效' }
];

const familyReceiptScenarios: Array<{ value: FamilyReceiptScenario; label: string; description: string; status: string }> = [
  { value: 'multiple', label: '留言与影像反馈', description: '首页同时展示最新语音及照片、视频反馈摘要', status: '2类互动' },
  { value: 'cross_day_unread', label: '跨日未查看', description: '未查看记录优先展示，不限制只看今天', status: '待查看' },
  { value: 'all_viewed', label: '全部已查看', description: '保留互动记录，并按发生时间倒序展示', status: '已查看' },
  { value: 'message_only', label: '仅有家庭留言', description: '首页只展示老人发来的语音留言摘要', status: '1类互动' },
  { value: 'photo_like_only', label: '仅有影像反馈', description: '首页只展示老人查看或喜欢照片、视频的反馈', status: '1类互动' },
  { value: 'no_interaction', label: '暂无互动', description: '今天及历史均无可展示的互动记录', status: '空状态' },
  { value: 'loading', label: '互动加载中', description: '正在读取留言和家庭影像反馈记录', status: '加载中' },
  { value: 'data_error', label: '互动读取失败', description: '记录暂时不可用，可稍后重新加载', status: '读取失败' }
];

const familyPhotoListScenarios: Array<{ value: FamilyPhotoScenario; label: string; description: string; status: string }> = [
  { value: 'list_default', label: '家庭影像列表', description: '展示照片、视频和混合批次，支持分类筛选与回看。', status: '正常' },
  { value: 'list_empty', label: '影像列表为空', description: '没有发布记录时展示空页面和发布入口。', status: '空状态' },
  { value: 'list_offline_cached', label: '无网络 · 有缓存', description: '保留上次加载的影像，并提示反馈状态可能不是最新。', status: '离线可查看' },
  { value: 'list_offline_empty', label: '无网络 · 无缓存', description: '展示网络异常页面和重新加载操作。', status: '加载失败' }
];

const familyPhotoPublishScenarios: Array<{ value: FamilyPhotoScenario; label: string; description: string; status: string }> = [
  { value: 'compose_empty', label: '编辑中 · 未选择', description: '展示拍照片、拍视频、从手机选择，发布按钮不可用。', status: '编辑中' },
  { value: 'compose_photo', label: '照片批次', description: '展示照片缩略图、预览、删除、分类和附言。', status: '可发布' },
  { value: 'compose_video', label: '视频批次', description: '展示视频封面、播放标识、时长与预览播放。', status: '可发布' },
  { value: 'compose_mixed', label: '混合批次', description: '同批展示照片和视频，合计不超过9项。', status: '可发布' },
  { value: 'compose_max', label: '已选满9项', description: '展示数量上限提示，可删除后继续添加。', status: '达到上限' },
  { value: 'publishing', label: '影像上传中', description: '全部待上传项进入上传中，发布按钮不可重复点击。', status: '上传中' },
  { value: 'partial_retry', label: '单个视频失败', description: '成功内容保留，只重试失败的视频。', status: '部分失败' },
  { value: 'publish_failed', label: '整批发布失败', description: '保留全部影像、分类和附言，可重新发布。', status: '发布失败' },
  { value: 'camera_denied', label: '相机权限拒绝', description: '说明开启权限，并保留“从手机选择”作为替代。', status: '权限异常' },
  { value: 'capture_cancelled', label: '取消拍摄', description: '不新增内容，继续停留在编辑页。', status: '已取消' },
  { value: 'video_preview_failed', label: '视频预览失败', description: '保留文件并支持删除后重新选择。', status: '预览失败' }
];

const elderBindingScenarios: Array<{ value: ElderBindingScenario; label: string; description: string; status: string }> = [
  { value: 'bound', label: '已绑定老人', description: '展示已绑定老人列表、当前老人及新增绑定入口。', status: '正常' },
  { value: 'no_elder', label: '登录后暂无老人', description: '登录成功后直接进入绑定老人引导。', status: '首次绑定' },
  { value: 'code_error', label: '绑定码错误', description: '输入的6位家庭绑定码无法识别。', status: '校验失败' },
  { value: 'code_expired', label: '绑定码已过期', description: '提示在老人屏幕重新生成家庭邀请。', status: '已过期' },
  { value: 'invitation_ended', label: '邀请已结束', description: '当前邀请已结束，需要使用新的邀请。', status: '已结束' },
  { value: 'invitation_invalidated', label: '后台作废邀请', description: '邀请已被后台作废，提示联系项目人员。', status: '已作废' },
  { value: 'network_error', label: '网络异常', description: '绑定码暂时无法校验，可稍后重试。', status: '网络异常' },
  { value: 'already_bound', label: '已经绑定', description: '重复绑定同一老人时不创建新的家庭关系。', status: '重复关系' },
  { value: 'relationship_removed', label: '家庭关系已解除', description: '老人保留在列表中并显示关系失效状态。', status: '已解除' },
  { value: 'tablet_code', label: '误输平板激活码', description: '明确提示扫描老人屏幕上的邀请二维码。', status: '码类型错误' }
];

const loginScenarios: Array<{ value: ChildLoginScenario; label: string; description: string; status: string }> = [
  { value: 'default', label: '首次打开', description: '默认进入登录页，手机号和验证码均为空。', status: '待登录' },
  { value: 'code_sent', label: '验证码已发送', description: '手机号校验通过，展示发送结果与演示验证码。', status: '已发送' },
  { value: 'invalid_phone', label: '手机号格式错误', description: '分别校验+65八位号码与+86十一位号码。', status: '格式错误' },
  { value: 'invalid_code', label: '验证码错误', description: '保留手机号并提示重新输入验证码。', status: '验证失败' },
  { value: 'code_expired', label: '验证码已过期', description: '提示重新获取验证码，不进入登录后页面。', status: '已过期' },
  { value: 'send_failed', label: '验证码发送失败', description: '保留手机号，允许再次点击获取验证码。', status: '可重试' },
  { value: 'network_error', label: '登录网络异常', description: '登录失败后保留输入内容，可稍后重试。', status: '网络异常' }
];

const reminderScenarios: Array<{ value: ReminderScenario; label: string; description: string; status: string }> = [
  { value: 'create', label: '新增提醒', description: '打开新增面板，可创建用药提醒或日常提醒。', status: '新增' },
  { value: 'edit', label: '编辑提醒', description: '打开现有提醒并修改名称、时间与重复规则。', status: '编辑' },
  { value: 'delete_confirm', label: '删除确认', description: '删除前明确影响范围并要求二次确认。', status: '待确认' },
  { value: 'delete_success', label: '删除成功', description: '提醒卡片从当前列表移除并展示成功反馈。', status: '已删除' },
  { value: 'delete_failed', label: '删除失败', description: '保留原提醒与确认弹窗，允许重新尝试。', status: '可重试' },
  { value: 'empty', label: '空列表', description: '当前老人还没有用药提醒或日常提醒。', status: '空状态' }
];

const acceptanceModulesByPage: Record<AcceptancePage, Array<{ value: AcceptanceModule; label: string }>> = {
  login: [
    { value: 'login', label: '手机号验证码登录' }
  ],
  home: [
    { value: 'elder', label: '老人信息' },
    { value: 'score', label: '安心评分' },
    { value: 'activity', label: '居家活动' },
    { value: 'family_receipts', label: '亲情互动' },
    { value: 'today_feed', label: '今日动态' }
  ],
  family: [
    { value: 'family_messages', label: '家庭留言' },
    { value: 'family_photos', label: '家庭影像' }
  ],
  care: [
    { value: 'reminders', label: '提醒事项' }
  ],
  profile: [
    { value: 'elder_binding', label: '老人绑定' }
  ]
};

const careFeedScenarios: Array<{ value: CareFeedScenario; label: string; description: string; status: string }> = [
  { value: 'normal', label: '完整类型动态', description: '覆盖空间、用药、事项、活动报名、预约服务和亲情互动', status: '6类记录' },
  { value: 'medication_overdue', label: '用药超时', description: '未确认用药置顶，并以需关注状态展示', status: '需关注' },
  { value: 'pending_only', label: '仅有待开始计划', description: '今天尚无已发生记录，仅展示后续计划', status: '待开始' },
  { value: 'no_records', label: '今日暂无动态', description: '服务正常，但今天没有记录或计划', status: '暂无动态' },
  { value: 'loading', label: '动态加载中', description: '正在读取今天的照护与互动记录', status: '加载中' },
  { value: 'data_error', label: '动态读取失败', description: '暂时无法取得动态记录，可稍后重试', status: '读取失败' }
];

const scoreCategoryOptions: Array<{ value: ScoreScenarioCategory; label: string }> = [
  { value: 'space', label: '空间作息' },
  { value: 'schedule', label: '日程完成' },
  { value: 'interaction', label: '亲情互动' },
  { value: 'overall', label: '整体与数据' }
];

const scoreScenarios: Array<{
  value: ReassuranceScoreScenario;
  category: ScoreScenarioCategory;
  label: string;
  description: string;
  result: string;
  impact: string;
  status: string;
}> = [
  { value: 'space_normal', category: 'space', label: '多房间正常活动', description: '今天在2个及以上房间形成记录', result: '空间 40/40', impact: '总分不受限', status: '记录正常' },
  { value: 'single_room', category: 'space', label: '单房间未满48小时', description: '仅在一个房间形成有效记录', result: '空间 30/40', impact: '总分90分', status: '记录正常' },
  { value: 'single_room_day2', category: 'space', label: '连续单房间48小时', description: '连续48小时未检测到第二个房间', result: '空间 15/40', impact: '风险扣5分 · 总分70', status: '需留意' },
  { value: 'single_room_day3', category: 'space', label: '连续单房间72小时+', description: '示例：已连续4天未检测到第二个房间', result: '空间 0/40', impact: '风险扣10分 · 总分50', status: '异常预警' },
  { value: 'no_movement', category: 'space', label: '暂无移动记录', description: '雷达在线，今天尚无房间移动', result: '空间 30/40', impact: '总分90分', status: '记录正常' },
  { value: 'schedule_all_completed', category: 'schedule', label: '到期日程全部完成', description: '已经到时间的任务均有完成记录', result: '日程 40/40', impact: '总分100分', status: '记录正常' },
  { value: 'schedule_not_due', category: 'schedule', label: '日程均未到时间', description: '今天有任务，但目前均未到计划时间', result: '日程 40/40', impact: '暂不进入分母', status: '记录正常' },
  { value: 'no_tasks', category: 'schedule', label: '今日无待办', description: '今天没有配置需要完成的任务', result: '日程 40/40', impact: '不产生日程扣分', status: '记录正常' },
  { value: 'schedule_overdue', category: 'schedule', label: '日程延期中', description: '1项完成，1项超过时间仍未完成', result: '日程 20/40', impact: '总分80分', status: '需留意' },
  { value: 'schedule_late_completed', category: 'schedule', label: '日程延期完成', description: '超过计划时间后补充完成记录', result: '日程 40/40', impact: '保留延期说明', status: '记录正常' },
  { value: 'schedule_uncompleted', category: 'schedule', label: '日程明确未完成', description: '1项完成，1项已明确未完成', result: '日程 20/40', impact: '总分80分', status: '需留意' },
  { value: 'medication_unconfirmed_day2', category: 'schedule', label: '连续2个用药日未确认', description: '连续2个应服药日期均无有效确认', result: '日程 0/40', impact: '风险扣5分 · 总分55', status: '需留意' },
  { value: 'medication_unconfirmed_day3', category: 'schedule', label: '连续3个用药日未确认', description: '连续3个应服药日期均无有效确认', result: '日程 0/40', impact: '风险扣10分 · 总分50', status: '异常预警' },
  { value: 'medication_sync_gap', category: 'schedule', label: '用药记录暂不可用', description: '到期用药尚未形成可展示的有效记录', result: '日程 --/40', impact: '连续计数暂停', status: '数据未完整' },
  { value: 'interaction_message', category: 'interaction', label: '老人发来留言', description: '老人主动发送1条语音留言', result: '互动 20/20', impact: '总分100分', status: '有互动' },
  { value: 'interaction_love', category: 'interaction', label: '老人喜欢影像', description: '老人给家庭照片或视频点了1次喜欢', result: '互动 20/20', impact: '总分100分', status: '有互动' },
  { value: 'interaction_multiple', category: 'interaction', label: '发生多种互动', description: '今天既有留言，也有照片爱心', result: '互动 20/20', impact: '不重复加分', status: '有互动' },
  { value: 'no_interaction', category: 'interaction', label: '老人暂未互动', description: '互动服务正常，但没有老人端回执', result: '互动 10/20', impact: '总分90分', status: '暂无互动' },
  { value: 'normal', category: 'overall', label: '默认全部正常', description: '三个维度数据完整且无待确认事项', result: '40＋40＋20', impact: '总分100分', status: '记录正常' },
  { value: 'partial_data', category: 'overall', label: '部分数据未更新', description: '至少一个评分维度无法确认', result: '总分 --', impact: '暂停计算', status: '数据未完整' },
  { value: 'sensing', category: 'overall', label: '数据感知中', description: '三个维度均尚未形成可评估记录', result: '总分 --', impact: '等待形成记录', status: '数据感知中' },
  { value: 'device_offline', category: 'overall', label: '核心设备离线', description: '中控屏、雷达或必要网关离线', result: '总分 --', impact: '暂时无法评估', status: '设备离线' }
];

const profileDataScenarios: Array<{ value: ElderProfileDataScenario; label: string }> = [
  { value: 'normal', label: '正常加载' },
  { value: 'profile_loading', label: '档案加载中' },
  { value: 'profile_error', label: '档案加载失败' },
  { value: 'device_error', label: '设备状态失败' }
];

const profileDeviceScenarios: Array<{ value: ElderProfileDeviceScenario; label: string }> = [
  { value: 'all_online', label: '全部在线' },
  { value: 'screen_offline', label: '中控屏离线' },
  { value: 'radar_partial_offline', label: '1台雷达离线' },
  { value: 'radar_all_offline', label: '雷达全部离线' },
  { value: 'status_unknown', label: '状态未知' },
  { value: 'no_devices', label: '未绑定设备' }
];

const initialScoreSelection: Record<ScoreScenarioCategory, ReassuranceScoreScenario> = {
  space: 'space_normal',
  schedule: 'schedule_all_completed',
  interaction: 'interaction_message',
  overall: 'normal'
};

export const H5InteractionWorkbench: React.FC<H5InteractionWorkbenchProps> = ({
  activePreviewPage,
  activePreviewFamilyModule,
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
  elderBindingScenario,
  reminderScenario,
  loginScenario,
  elderProfileRadarExpanded,
  showSimulator,
  onHomeCareScenarioChange,
  onHomeActivityScenarioChange,
  onFamilyReceiptScenarioChange,
  onFamilyMessageScenarioChange,
  onFamilyPhotoScenarioChange,
  onOpenFamilyMessages,
  onOpenFamilyPhotos,
  onOpenHome,
  onOpenElderBinding,
  onCareFeedScenarioChange,
  onElderStatusCardScenarioChange,
  onReassuranceScoreScenarioChange,
  onElderProfileDataScenarioChange,
  onElderProfileDeviceScenarioChange,
  onElderBindingScenarioChange,
  onReminderScenarioChange,
  onLoginScenarioChange,
  onOpenLogin,
  onElderProfileRadarExpandedChange,
  onOpenElderProfile,
  onCloseElderProfile,
  onOpenScoreDetails,
  onCloseScoreDetails,
  onOpenFamilyReceipts,
  onCloseFamilyReceipts,
  onCompleteFamilyVoice,
  onOpenMedicationDetails,
  onOpenReminders,
  onReset,
  onToggleSimulator
}) => {
  const [elderTarget, setElderTarget] = useState<ElderAcceptanceTarget>('card');
  const [acceptancePage, setAcceptancePage] = useState<AcceptancePage>('home');
  const [acceptanceModule, setAcceptanceModule] = useState<AcceptanceModule>('score');
  const [familyPhotoTarget, setFamilyPhotoTarget] = useState<FamilyPhotoAcceptanceTarget>('list');
  const [scoreCategory, setScoreCategory] = useState<ScoreScenarioCategory>('overall');
  const [scoreSelectionByCategory, setScoreSelectionByCategory] = useState(initialScoreSelection);

  useEffect(() => {
    setAcceptancePage(activePreviewPage);
    setAcceptanceModule(
      activePreviewPage === 'login'
        ? 'login'
        : activePreviewPage === 'home'
        ? 'score'
        : activePreviewPage === 'care'
          ? 'reminders'
        : activePreviewPage === 'profile'
          ? 'elder_binding'
          : activePreviewFamilyModule === 'family_messages'
            ? 'family_messages'
            : 'family_photos'
    );
  }, [activePreviewFamilyModule, activePreviewPage]);

  const resetWorkbench = () => {
    setElderTarget('card');
    setAcceptancePage('home');
    setAcceptanceModule('score');
    setFamilyPhotoTarget('list');
    setScoreCategory('overall');
    setScoreSelectionByCategory(initialScoreSelection);
    onReset();
  };

  const changeAcceptancePage = (page: AcceptancePage) => {
    setAcceptancePage(page);
    const nextModule: AcceptanceModule = page === 'login'
      ? 'login'
      : page === 'home'
      ? 'score'
      : page === 'care'
        ? 'reminders'
      : page === 'profile'
        ? 'elder_binding'
        : 'family_messages';
    setAcceptanceModule(nextModule);
    onCloseElderProfile();
    onCloseScoreDetails();
    onCloseFamilyReceipts();
    if (page === 'login') onOpenLogin();
    else if (page === 'home') onOpenHome();
    else if (page === 'care') onOpenReminders();
    else if (page === 'profile') onOpenElderBinding();
    else onOpenFamilyMessages();
  };

  const changeScoreCategory = (category: ScoreScenarioCategory) => {
    setScoreCategory(category);
    onReassuranceScoreScenarioChange(scoreSelectionByCategory[category]);
  };

  const changeScoreScenario = (category: ScoreScenarioCategory, scenario: ReassuranceScoreScenario) => {
    setScoreSelectionByCategory(current => ({ ...current, [category]: scenario }));
    onReassuranceScoreScenarioChange(scenario);
  };

  const changeElderTarget = (target: ElderAcceptanceTarget) => {
    setElderTarget(target);
    onHomeCareScenarioChange('normal');
    if (target === 'profile') {
      onElderProfileRadarExpandedChange(true);
      onOpenElderProfile();
    } else {
      onCloseElderProfile();
    }
  };

  return (
    <aside
      aria-label="交互验收台"
      className="hidden w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:flex"
    >
      <header className="flex items-start justify-between border-b border-slate-100 px-4 py-4">
        <div>
          <div className="flex items-center gap-2">
            <MousePointerClick size={16} className="text-blue-600" />
            <h2 className="text-sm font-extrabold text-slate-900">交互验收台</h2>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">不属于正式移动端页面</p>
        </div>
        <button
          type="button"
          onClick={resetWorkbench}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <RotateCcw size={13} />
          重置
        </button>
      </header>

      <div className="space-y-5 p-4">
        <section>
          <h3 className="text-[11px] font-extrabold text-slate-500">模块验收</h3>
          <p className="mt-0.5 text-[10px] text-slate-400">选择页面、模块和状态，在手机界面查看效果</p>
        </section>

        <section className="space-y-3" aria-label="页面与模块层级">
            <div>
              <h3 className="mb-2 text-[11px] font-extrabold text-slate-500">一级页面</h3>
              <div className="grid grid-cols-5 gap-1 rounded-xl bg-slate-100 p-1">
                {([['login', '登录'], ['home', '安心看'], ['family', '亲情连'], ['care', '代管家'], ['profile', '我的']] as const).map(([page, label]) => (
                  <button key={page} type="button" onClick={() => changeAcceptancePage(page)} aria-pressed={acceptancePage === page} className={`rounded-lg px-2 py-2 text-[10px] font-bold ${acceptancePage === page ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}>{label}</button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="workbench-module" className="mb-2 block text-[11px] font-extrabold text-slate-500">二级模块</label>
              <select
                id="workbench-module"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                value={acceptanceModule}
                onChange={event => {
                  const nextModule = event.target.value as AcceptanceModule;
                  setAcceptanceModule(nextModule);
                  if (nextModule === 'login') onOpenLogin();
                  if (acceptancePage === 'home') onOpenHome();
                  if (nextModule === 'reminders') onOpenReminders();
                  if (nextModule === 'family_messages') onOpenFamilyMessages();
                  if (nextModule === 'family_photos') {
                    setFamilyPhotoTarget('list');
                    onFamilyPhotoScenarioChange('list_default');
                    onOpenFamilyPhotos();
                  }
                  if (nextModule === 'elder_binding') onOpenElderBinding();
                  if (nextModule === 'score') {
                    onCloseElderProfile();
                  } else if (nextModule === 'elder') {
                    onCloseScoreDetails();
                  } else {
                    onCloseElderProfile();
                    onCloseScoreDetails();
                    onCloseFamilyReceipts();
                  }
                }}
              >
                {acceptanceModulesByPage[acceptancePage].map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            {acceptanceModule === 'family_photos' && (
              <div>
                <label htmlFor="workbench-family-photo-target" className="mb-2 block text-[11px] font-extrabold text-slate-500">三级模块</label>
                <select
                  id="workbench-family-photo-target"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={familyPhotoTarget}
                  onChange={event => {
                    const nextTarget = event.target.value as FamilyPhotoAcceptanceTarget;
                    setFamilyPhotoTarget(nextTarget);
                    onFamilyPhotoScenarioChange(nextTarget === 'list' ? 'list_default' : 'compose_empty');
                    onOpenFamilyPhotos();
                  }}
                >
                  <option value="list">家庭影像列表</option>
                  <option value="publish">发布影像弹窗</option>
                </select>
              </div>
            )}
            <p className="text-[9px] leading-relaxed text-slate-400">
              {acceptancePage === 'home'
                ? '安心看只验证摘要、状态和首页弹层。'
                : acceptancePage === 'care'
                  ? '代管家验证人工提醒的查看、新增、编辑与删除。'
                : acceptancePage === 'profile'
                  ? '我的页面验证老人绑定、切换与异常状态。'
                  : '亲情连验证完整会话与家庭影像业务。'}
            </p>
        </section>

        <>

            {acceptanceModule === 'elder' && <section aria-label="老人信息验收对象">
              <h3 className="mb-2 text-[11px] font-extrabold text-slate-500">验收对象</h3>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                {([
                  ['card', '老人信息卡'],
                  ['profile', '档案详情']
                ] as const).map(([target, label]) => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => changeElderTarget(target)}
                    aria-pressed={elderTarget === target}
                    className={`rounded-lg px-2 py-2 text-[10px] font-bold ${elderTarget === target ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>}

            {acceptanceModule === 'elder' && (elderTarget === 'card' ? (
              <>
                <section aria-label="老人信息模块状态">
                  <div className="mb-2">
                    <h3 className="text-[11px] font-extrabold text-slate-500">模块状态</h3>
                    <p className="mt-0.5 text-[10px] text-slate-400">只改变老人信息卡</p>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {elderScenarios.map(option => {
                      const selected = elderStatusCardScenario === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => onElderStatusCardScenarioChange(option.value)}
                          aria-pressed={selected}
                          className={`rounded-lg px-1.5 py-2 text-[10px] font-bold transition-colors ${
                            selected
                              ? 'bg-slate-900 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section aria-label="老人信息卡交互">
                  <h3 className="mb-2 text-[11px] font-extrabold text-slate-500">交互动作</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={resetWorkbench} className="rounded-xl border border-slate-200 px-3 py-2.5 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-50">
                      默认状态
                    </button>
                    <button type="button" onClick={() => changeElderTarget('profile')} className="rounded-xl bg-blue-600 px-3 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-blue-500">
                      打开档案
                    </button>
                  </div>
                </section>
              </>
            ) : (
              <>
                <section aria-label="档案数据状态">
                  <h3 className="mb-2 text-[11px] font-extrabold text-slate-500">数据状态</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {profileDataScenarios.map(option => {
                      const selected = elderProfileDataScenario === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            onElderProfileDataScenarioChange(option.value);
                            onOpenElderProfile();
                          }}
                          aria-pressed={selected}
                          className={`rounded-lg px-2 py-2 text-[10px] font-bold ${selected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {elderProfileDataScenario === 'normal' && (
                  <section aria-label="绑定设备状态">
                    <h3 className="mb-2 text-[11px] font-extrabold text-slate-500">绑定设备状态</h3>
                    <div className="grid grid-cols-2 gap-1.5">
                      {profileDeviceScenarios.map(option => {
                        const selected = elderProfileDeviceScenario === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              onElderProfileDeviceScenarioChange(option.value);
                              onOpenElderProfile();
                            }}
                            aria-pressed={selected}
                            className={`rounded-lg px-2 py-2 text-[10px] font-bold ${selected ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                <section aria-label="老人档案交互">
                  <h3 className="mb-2 text-[11px] font-extrabold text-slate-500">交互动作</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onElderProfileRadarExpandedChange(true);
                        onOpenElderProfile();
                      }}
                      className="rounded-lg bg-blue-600 px-2 py-2 text-[10px] font-bold text-white"
                    >
                      打开档案
                    </button>
                    <button type="button" onClick={onCloseElderProfile} className="rounded-lg bg-slate-100 px-2 py-2 text-[10px] font-bold text-slate-600">关闭档案</button>
                    {elderProfileDataScenario === 'normal' && elderProfileDeviceScenario !== 'no_devices' && (
                      <>
                        <button type="button" onClick={() => onElderProfileRadarExpandedChange(true)} className={`rounded-lg px-2 py-2 text-[10px] font-bold ${elderProfileRadarExpanded ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>展开设备明细</button>
                        <button type="button" onClick={() => onElderProfileRadarExpandedChange(false)} className={`rounded-lg px-2 py-2 text-[10px] font-bold ${!elderProfileRadarExpanded ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>收起设备明细</button>
                      </>
                    )}
                  </div>
                </section>
              </>
            ))}

            {acceptanceModule === 'score' && (
              <>
                <section aria-label="安心评分状态">
                  <div className="mb-2">
                    <h3 className="text-[11px] font-extrabold text-slate-500">评分状态</h3>
                    <p className="mt-0.5 text-[10px] text-slate-400">按触发评分变化的数据来源分类</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                    {scoreCategoryOptions.map(category => {
                      const selected = scoreCategory === category.value;
                      const count = scoreScenarios.filter(option => option.category === category.value).length;
                      return (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => changeScoreCategory(category.value)}
                          aria-pressed={selected}
                          className={`rounded-lg px-2 py-2 text-[10px] font-bold transition-colors ${
                            selected ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {category.label}
                          <span className={`ml-1 text-[9px] ${selected ? 'text-blue-400' : 'text-slate-400'}`}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {scoreScenarios.filter(option => option.category === scoreCategory).map(option => {
                      const selected = reassuranceScoreScenario === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => changeScoreScenario(option.category, option.value)}
                          aria-pressed={selected}
                          className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                            selected
                              ? 'border-blue-300 bg-blue-50 shadow-xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-start justify-between gap-2">
                            <strong className={`text-[11px] ${selected ? 'text-blue-700' : 'text-slate-800'}`}>{option.label}</strong>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold ${
                              option.status === '异常预警'
                                ? 'bg-rose-100 text-rose-700'
                                : option.status === '需留意'
                                  ? 'bg-amber-100 text-amber-800'
                                  : option.status.includes('数据') || option.status === '设备离线'
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-emerald-50 text-emerald-700'
                            }`}>{option.status}</span>
                          </span>
                          <span className="mt-1 block text-[9px] leading-snug text-slate-400">{option.description}</span>
                          <span className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[9px] font-bold">
                            <span className={selected ? 'text-blue-700' : 'text-slate-600'}>{option.result}</span>
                            <span className="text-slate-400">{option.impact}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section aria-label="安心评分交互">
                  <h3 className="mb-2 text-[11px] font-extrabold text-slate-500">交互动作</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button type="button" onClick={onOpenScoreDetails} className="rounded-lg bg-blue-600 px-2 py-2.5 text-[10px] font-bold text-white">打开评分明细</button>
                    <button type="button" onClick={onCloseScoreDetails} className="rounded-lg bg-slate-100 px-2 py-2.5 text-[10px] font-bold text-slate-600">关闭评分明细</button>
                  </div>
                </section>
              </>
            )}

            {acceptanceModule === 'activity' && (
              <>
                <section aria-label="居家活动状态">
                  <div className="mb-2">
                    <h3 className="text-[11px] font-extrabold text-slate-500">模块状态</h3>
                    <p className="mt-0.5 text-[10px] text-slate-400">设备、数据与连续活动状态</p>
                  </div>
                  <div className="space-y-1.5">
                    {homeActivityScenarios.map(option => {
                      const selected = homeActivityScenario === option.value;
                      const critical = option.status === '异常预警';
                      const attention = option.status === '需留意' || option.status === '设备离线';
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => onHomeActivityScenarioChange(option.value)}
                          aria-pressed={selected}
                          className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                            selected
                              ? 'border-blue-300 bg-blue-50 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-start justify-between gap-2">
                            <strong className={`text-[11px] ${selected ? 'text-blue-700' : 'text-slate-800'}`}>{option.label}</strong>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold ${
                              critical
                                ? 'bg-rose-100 text-rose-700'
                                : attention
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                            }`}>{option.status}</span>
                          </span>
                          <span className="mt-1 block text-[9px] leading-snug text-slate-400">{option.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section aria-label="居家活动交互">
                  <h3 className="mb-2 text-[11px] font-extrabold text-slate-500">交互动作</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button type="button" onClick={() => onHomeActivityScenarioChange('normal')} className="rounded-lg bg-blue-600 px-2 py-2.5 text-[10px] font-bold text-white">恢复正常记录</button>
                    <button type="button" onClick={onOpenElderProfile} className="rounded-lg bg-slate-100 px-2 py-2.5 text-[10px] font-bold text-slate-600">查看设备详情</button>
                  </div>
                </section>
              </>
            )}

            {acceptanceModule === 'family_receipts' && (
              <>
                <section aria-label="首页亲情互动状态">
                  <div className="mb-2">
                    <h3 className="text-[11px] font-extrabold text-slate-500">模块状态</h3>
                    <p className="mt-0.5 text-[10px] text-slate-400">首页聚合留言摘要与照片、视频反馈</p>
                  </div>
                  <div className="space-y-1.5">
                    {familyReceiptScenarios.map(option => {
                      const selected = familyReceiptScenario === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            onOpenHome();
                            onCloseFamilyReceipts();
                            onFamilyReceiptScenarioChange(option.value);
                          }}
                          aria-pressed={selected}
                          className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${selected ? 'border-orange-300 bg-orange-50 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                          <span className="flex items-start justify-between gap-2">
                            <strong className={`text-[11px] ${selected ? 'text-orange-800' : 'text-slate-800'}`}>{option.label}</strong>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold text-slate-600">{option.status}</span>
                          </span>
                          <span className="mt-1 block text-[9px] leading-snug text-slate-400">{option.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section aria-label="首页亲情互动交互">
                  <h3 className="mb-2 text-[11px] font-extrabold text-slate-500">交互动作</h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button type="button" onClick={() => onOpenFamilyReceipts('all')} className="rounded-lg bg-blue-600 px-1 py-2.5 text-[10px] font-bold text-white">全部记录</button>
                    <button type="button" onClick={() => onOpenFamilyReceipts('message')} className="rounded-lg bg-orange-50 px-1 py-2.5 text-[10px] font-bold text-orange-800">留言记录</button>
                    <button type="button" onClick={() => onOpenFamilyReceipts('photo_like')} className="rounded-lg bg-rose-50 px-1 py-2.5 text-[10px] font-bold text-rose-700">点赞记录</button>
                  </div>
                </section>
              </>
            )}

            {acceptanceModule === 'family_messages' && (
              <>
                <section aria-label="家庭留言状态">
                  <div className="mb-2"><h3 className="text-[11px] font-extrabold text-slate-500">模块状态</h3><p className="mt-0.5 text-[10px] text-slate-400">会话、发送、语音与家庭关系状态</p></div>
                  <div className="space-y-1.5">
                    {familyMessageScenarios.map(option => {
                      const selected = familyMessageScenario === option.value;
                      return <button key={option.value} type="button" onClick={() => { onFamilyMessageScenarioChange(option.value); onOpenFamilyMessages(); }} aria-pressed={selected} className={`w-full rounded-xl border px-3 py-2.5 text-left ${selected ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}><span className="flex justify-between gap-2"><strong className="text-[11px] text-slate-800">{option.label}</strong><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold text-slate-600">{option.status}</span></span><span className="mt-1 block text-[9px] text-slate-400">{option.description}</span></button>;
                    })}
                  </div>
                </section>
                <section aria-label="家庭留言交互"><h3 className="mb-2 text-[11px] font-extrabold text-slate-500">交互动作</h3><button type="button" onClick={onOpenFamilyMessages} className="w-full rounded-lg bg-blue-600 px-2 py-2.5 text-[10px] font-bold text-white">打开家庭留言</button></section>
              </>
            )}

            {acceptanceModule === 'reminders' && (
              <>
                <section aria-label="提醒事项交互场景">
                  <div className="mb-2">
                    <h3 className="text-[11px] font-extrabold text-slate-500">交互场景</h3>
                    <p className="mt-0.5 text-[10px] text-slate-400">仅验证提醒定义的新增、编辑和删除</p>
                  </div>
                  <div className="space-y-1.5">
                    {reminderScenarios.map(option => {
                      const selected = reminderScenario === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            onReminderScenarioChange(option.value);
                            onOpenReminders();
                          }}
                          aria-pressed={selected}
                          className={`w-full rounded-xl border px-3 py-2.5 text-left ${selected ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}
                        >
                          <span className="flex items-start justify-between gap-2">
                            <strong className="text-[11px] text-slate-800">{option.label}</strong>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold text-slate-600">{option.status}</span>
                          </span>
                          <span className="mt-1 block text-[9px] leading-snug text-slate-400">{option.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
                <section aria-label="提醒事项交互">
                  <h3 className="mb-2 text-[11px] font-extrabold text-slate-500">交互动作</h3>
                  <button type="button" onClick={onOpenReminders} className="w-full rounded-lg bg-blue-600 px-2 py-2.5 text-[10px] font-bold text-white">打开提醒事项</button>
                </section>
              </>
            )}

            {acceptanceModule === 'login' && (
              <>
                <section aria-label="子女登录状态">
                  <div className="mb-2">
                    <h3 className="text-[11px] font-extrabold text-slate-500">登录状态</h3>
                    <p className="mt-0.5 text-[10px] text-slate-400">手机号、验证码与必要失败反馈</p>
                  </div>
                  <div className="space-y-1.5">
                    {loginScenarios.map(option => {
                      const selected = loginScenario === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            onLoginScenarioChange(option.value);
                            onOpenLogin();
                          }}
                          aria-pressed={selected}
                          className={`w-full rounded-xl border px-3 py-2.5 text-left ${selected ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}
                        >
                          <span className="flex items-start justify-between gap-2">
                            <strong className="text-[11px] text-slate-800">{option.label}</strong>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold text-slate-600">{option.status}</span>
                          </span>
                          <span className="mt-1 block text-[9px] leading-snug text-slate-400">{option.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
                <section aria-label="子女登录交互">
                  <h3 className="mb-2 text-[11px] font-extrabold text-slate-500">交互动作</h3>
                  <button type="button" onClick={onOpenLogin} className="w-full rounded-lg bg-blue-600 px-2 py-2.5 text-[10px] font-bold text-white">打开登录页</button>
                </section>
              </>
            )}

            {acceptanceModule === 'elder_binding' && (
              <>
                <section aria-label="老人绑定状态">
                  <div className="mb-2">
                    <h3 className="text-[11px] font-extrabold text-slate-500">绑定状态</h3>
                    <p className="mt-0.5 text-[10px] text-slate-400">入口、绑定码校验与家庭关系状态</p>
                  </div>
                  <div className="space-y-1.5">
                    {elderBindingScenarios.map(option => {
                      const selected = elderBindingScenario === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            onElderBindingScenarioChange(option.value);
                            onOpenElderBinding();
                          }}
                          aria-pressed={selected}
                          className={`w-full rounded-xl border px-3 py-2.5 text-left ${selected ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}
                        >
                          <span className="flex items-start justify-between gap-2">
                            <strong className="text-[11px] text-slate-800">{option.label}</strong>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold text-slate-600">{option.status}</span>
                          </span>
                          <span className="mt-1 block text-[9px] leading-snug text-slate-400">{option.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
                <section aria-label="老人绑定交互">
                  <h3 className="mb-2 text-[11px] font-extrabold text-slate-500">交互动作</h3>
                  <button type="button" onClick={onOpenElderBinding} className="w-full rounded-lg bg-blue-600 px-2 py-2.5 text-[10px] font-bold text-white">打开绑定老人</button>
                </section>
              </>
            )}

            {acceptanceModule === 'family_photos' && familyPhotoTarget === 'list' && (
              <section aria-label="家庭影像列表状态">
                <div className="mb-2">
                  <h3 className="text-[11px] font-extrabold text-slate-500">列表状态</h3>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">点击后直接在手机界面查看对应效果。</p>
                </div>
                <div className="space-y-1.5">
                  {familyPhotoListScenarios.map(rule => (
                    <button
                      key={rule.value}
                      type="button"
                      onClick={() => {
                        onFamilyPhotoScenarioChange(rule.value);
                        onOpenFamilyPhotos();
                      }}
                      aria-pressed={familyPhotoScenario === rule.value}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${familyPhotoScenario === rule.value ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <strong className="text-[11px] text-slate-800">{rule.label}</strong>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold text-slate-600">{rule.status}</span>
                      </span>
                      <span className="mt-1 block text-[9px] leading-snug text-slate-400">{rule.description}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {acceptanceModule === 'family_photos' && familyPhotoTarget === 'publish' && (
              <section aria-label="发布影像弹窗状态">
                <div className="mb-2">
                  <h3 className="text-[11px] font-extrabold text-slate-500">弹窗状态</h3>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">选择状态后打开发布照片或视频弹窗。</p>
                </div>
                <div className="space-y-1.5">
                  {familyPhotoPublishScenarios.map(rule => (
                    <button key={rule.value} type="button" onClick={() => { onFamilyPhotoScenarioChange(rule.value); onOpenFamilyPhotos(); }} aria-pressed={familyPhotoScenario === rule.value} className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${familyPhotoScenario === rule.value ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <span className="flex items-start justify-between gap-2"><strong className="text-[11px] text-slate-800">{rule.label}</strong><span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold text-slate-600">{rule.status}</span></span>
                      <span className="mt-1 block text-[9px] leading-snug text-slate-400">{rule.description}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {acceptanceModule === 'today_feed' && (
              <>
                <section aria-label="今日动态状态">
                  <div className="mb-2">
                    <h3 className="text-[11px] font-extrabold text-slate-500">模块状态</h3>
                    <p className="mt-0.5 text-[10px] text-slate-400">记录、计划与数据读取状态</p>
                  </div>
                  <div className="space-y-1.5">
                    {careFeedScenarios.map(option => {
                      const selected = careFeedScenario === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => onCareFeedScenarioChange(option.value)}
                          aria-pressed={selected}
                          className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${selected ? 'border-blue-300 bg-blue-50 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                          <span className="flex items-start justify-between gap-2">
                            <strong className={`text-[11px] ${selected ? 'text-blue-700' : 'text-slate-800'}`}>{option.label}</strong>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold ${option.value === 'medication_overdue' ? 'bg-amber-100 text-amber-800' : option.value === 'data_error' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{option.status}</span>
                          </span>
                          <span className="mt-1 block text-[9px] leading-snug text-slate-400">{option.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section aria-label="今日动态交互">
                  <h3 className="mb-2 text-[11px] font-extrabold text-slate-500">交互动作</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button type="button" onClick={() => onCareFeedScenarioChange('normal')} className="rounded-lg bg-blue-600 px-2 py-2.5 text-[10px] font-bold text-white">查看完整类型</button>
                    <button type="button" onClick={() => onCareFeedScenarioChange('medication_overdue')} className="rounded-lg bg-amber-50 px-2 py-2.5 text-[10px] font-bold text-amber-800">模拟用药超时</button>
                    <button type="button" onClick={onOpenMedicationDetails} className="col-span-2 rounded-lg bg-slate-900 px-2 py-2.5 text-[10px] font-bold text-white">打开超时用药详情</button>
                  </div>
                </section>
              </>
            )}
        </>
      </div>

      <footer className="mt-auto border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={onToggleSimulator}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
        >
          {showSimulator ? <X size={14} /> : <Cpu size={14} />}
          {showSimulator ? '关闭设备仿真' : '打开设备仿真'}
        </button>
      </footer>
    </aside>
  );
}
