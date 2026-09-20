export interface MedicationReminder {
  id: string;
  time: string;
  scheduledAt?: string;
  name: string;
  dosage: string;
  status: 'completed' | 'pending' | 'unconfirmed' | 'expired';
  takenAt?: string;
  priority?: 'P0' | 'P1' | 'P2';
  category?: 'medication' | 'schedule';
  ctaTitle?: string;
}

export type FulfillmentKind = 'medication' | 'schedule' | 'message' | 'activity' | 'service' | 'content';

export interface FulfillmentRecord {
  id: string;
  kind: FulfillmentKind;
  title: string;
  occurredAt: string;
}

export interface HealthTelemetry {
  heartRate: number;
  systolic: number;
  diastolic: number;
  bloodOxygen: number;
  bloodGlucose: number;
  lastUpdated: string;
}

export interface IoTSensor {
  id: string;
  name: string;
  location: string;
  status: 'normal' | 'active' | 'warning';
  lastSeen: string;
}

export interface FamilyPhoto {
  id: string;
  url: string;
  caption: string;
  date: string;
  type?: 'photo' | 'video';
  videoUrl?: string;
  senderName?: string;
  uploaderRelationshipId?: string;
  publishedAt?: string;
  uploadTime?: string;
  categoryNameSnapshot?: string;
  batchCaption?: string;
  initialHearts?: number;
  width?: number;
  height?: number;
  alt?: string;
  voiceDuration?: number;
  viewedAt?: string | null;
}

export interface FamilyMessage {
  id: string;
  sender: string;
  avatar: string;
  type: 'voice' | 'text' | 'photo' | 'call_log';
  content: string;
  duration?: number; // for voice (seconds)
  timestamp: string;
  played: boolean;
  recipient?: string;
  photoUrl?: string;
  photoUrls?: string[];
  familyMediaId?: string;
  familyMediaType?: 'photo' | 'video';
  audioUrl?: string;
  loadFailed?: boolean;
  deliveryStatus?: 'sending' | 'failed' | 'delivered';
  elderViewedAt?: string | null;
  replyToMessageId?: string;
}

export interface CommunityActivity {
  id: string;
  title: string;
  time: string;
  location: string;
  spotsLeft: number;
  tag: string;
  imageUrl: string;
  description?: string;
  contact?: string;
  status?: 'registration' | 'ongoing' | 'ended' | 'cancelled';
  liveEnabled: boolean;
  liveStatus: 'not_started' | 'live' | 'ended';
  scheduledLiveStartAt?: string;
  liveAccessType?: 'url' | 'third_party_id';
  playbackUrl?: string;
  liveProvider?: string;
  externalLiveId?: string;
}

export interface AntiScamTip {
  id: string;
  title: string;
  description: string;
  category: string;
  source: string;
  summary?: string;
  coverUrl?: string;
  contactLabel?: string;
}

export interface SpecialServiceBooking {
  id: string;
  serviceId: string;
  serviceName: string;
  provider: string;
  categoryCode?: "home" | "care" | "meal" | "health" | "safety";
  categoryName?: string;
  slotId: string;
  slotLabel: string;
  status: 'booked' | 'accepted' | 'in_service' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
