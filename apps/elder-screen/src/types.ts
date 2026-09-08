export interface MedicationReminder {
  id: string;
  time: string;
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
  uploadTime?: string;
  categoryName?: string;
  batchCaption?: string;
  initialHearts?: number;
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
  audioUrl?: string;
  loadFailed?: boolean;
}

export interface CommunityActivity {
  id: string;
  title: string;
  time: string;
  location: string;
  spotsLeft: number;
  registered: boolean;
  tag: string;
  imageUrl: string;
  description?: string;
  audience?: string;
  contact?: string;
  status?: 'registration' | 'ongoing' | 'ended' | 'cancelled';
  requiresConfirmation?: boolean;
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
