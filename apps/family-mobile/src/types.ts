/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  timeSlot: 'morning' | 'noon' | 'evening' | 'night';
  timeStr: string;
  status: 'taken' | 'untaken' | 'missed';
  takenTime?: string;
  note?: string;
}

export interface ActivityLog {
  id: string;
  time: string;
  content: string;
  type: 'info' | 'medication' | 'health' | 'warning' | 'alert';
}

export interface HealthStats {
  heartRate: number;
  heartRateStatus: 'normal' | 'abnormal' | 'high' | 'low';
  steps: number;
  stepsTarget: number;
  sleepHours: number;
  sleepQuality: 'excellent' | 'good' | 'fair' | 'poor';
  location: string; // e.g. "客厅", "卧室", "厨房", "洗手间", "户外"
  batteryLevel: number; // Wearable device battery
  controlScreenStatus?: 'online' | 'offline';
}

export type HomeCareScenario = 'normal' | 'medication_overdue' | 'inactivity';

export type ElderStatusCardScenario = 'normal' | 'device_offline' | 'location_empty';

export type HomeActivityScenario =
  | 'normal'
  | 'partial_offline'
  | 'all_offline'
  | 'no_devices'
  | 'loading'
  | 'data_error'
  | 'no_activity'
  | 'insufficient_history'
  | 'single_room_day2'
  | 'single_room_day3';

export type FamilyReceiptScenario =
  | 'multiple'
  | 'cross_day_unread'
  | 'all_viewed'
  | 'message_only'
  | 'photo_like_only'
  | 'no_interaction'
  | 'loading'
  | 'data_error';

export type FamilyReceiptFilter = 'all' | 'message' | 'photo_like';

export type FamilyPhotoScenario =
  | 'list_default'
  | 'list_empty'
  | 'list_offline_cached'
  | 'list_offline_empty'
  | 'compose_empty'
  | 'compose_photo'
  | 'compose_video'
  | 'compose_mixed'
  | 'compose_max'
  | 'publishing'
  | 'partial_retry'
  | 'publish_failed'
  | 'camera_denied'
  | 'capture_cancelled'
  | 'video_preview_failed';

export type FamilyMessageScenario =
  | 'normal'
  | 'empty'
  | 'send_failed'
  | 'voice_error'
  | 'relationship_invalid'
  | 'multi_elder';

export type CareFeedScenario =
  | 'normal'
  | 'medication_overdue'
  | 'pending_only'
  | 'no_records'
  | 'loading'
  | 'data_error';

export type ReassuranceScoreScenario =
  | 'normal'
  | 'space_normal'
  | 'single_room'
  | 'single_room_day2'
  | 'single_room_day3'
  | 'no_movement'
  | 'schedule_all_completed'
  | 'schedule_not_due'
  | 'no_tasks'
  | 'schedule_overdue'
  | 'schedule_late_completed'
  | 'schedule_uncompleted'
  | 'medication_unconfirmed_day2'
  | 'medication_unconfirmed_day3'
  | 'medication_sync_gap'
  | 'interaction_love'
  | 'interaction_message'
  | 'interaction_multiple'
  | 'no_interaction'
  | 'partial_data'
  | 'sensing'
  | 'device_offline';

export type ElderProfileDataScenario = 'normal' | 'profile_loading' | 'profile_error' | 'device_error';

export type ElderProfileDeviceScenario =
  | 'all_online'
  | 'screen_offline'
  | 'radar_partial_offline'
  | 'radar_all_offline'
  | 'status_unknown'
  | 'no_devices';

export type ElderRelation = '儿子' | '女儿' | '儿媳' | '女婿' | '孙辈' | '其他家属';

export type ElderBindingScenario =
  | 'bound'
  | 'no_elder'
  | 'code_error'
  | 'code_expired'
  | 'invitation_ended'
  | 'invitation_invalidated'
  | 'network_error'
  | 'already_bound'
  | 'relationship_removed'
  | 'tablet_code';

export type ReminderScenario =
  | 'list'
  | 'create'
  | 'edit'
  | 'delete_confirm'
  | 'delete_success'
  | 'delete_failed'
  | 'empty';

export interface CareReminder {
  id: string;
  elderId: string;
  elderName: string;
  type: 'medication' | 'daily';
  title: string;
  detail?: string;
  date: string;
  time: string;
  repeat: 'once' | 'daily' | 'weekly';
  weekdays?: number[];
}

export interface BoundElder {
  id: string;
  name: string;
  age: number;
  avatar: string;
  relation: ElderRelation;
  project: string;
  maskedAddress: string;
  relationshipStatus: 'active' | 'removed';
}

export interface ServiceProduct {
  id: string;
  name: string;
  category: 'care' | 'medical' | 'safety' | 'food';
  price: number;
  unit: string;
  description: string;
  longDescription: string;
  image: string;
  rating: number;
  sales: number;
  features: string[];
}

export interface Order {
  id: string;
  serviceId: string;
  serviceName: string;
  price: number;
  serviceDate: string;
  serviceTime: string;
  parentName: string;
  parentAddress: string;
  status: 'paid' | 'assigning' | 'dispatching' | 'ongoing' | 'completed';
  statusLogs: { time: string; text: string }[];
  orderTime: string;
  paymentMethod: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface FamilyMessage {
  id: string;
  conversationId: string;
  sender: 'child' | 'elder';
  senderName: string;
  text?: string;
  sentAtUtc: string;
  status: 'sending' | 'delivered' | 'viewed' | 'listened' | 'failed';
  type: 'text' | 'voice';
  durationSeconds?: number;
  failureReason?: string;
}

export interface FamilyConversation {
  id: string;
  elderId: string;
  elderName: string;
  relationLabel: string;
  avatar: string;
  relationshipStatus: 'active' | 'invalid';
}

export interface PublishedPhotoBatch {
  id: string;
  elderName: string;
  category: string;
  message?: string;
  publishedAt: string;
  items: Array<{
    id: string;
    name: string;
    type: 'photo' | 'video';
    previewUrl: string;
    videoUrl?: string;
    durationSeconds?: number;
  }>;
  feedback: 'published' | 'viewed' | 'liked';
}
