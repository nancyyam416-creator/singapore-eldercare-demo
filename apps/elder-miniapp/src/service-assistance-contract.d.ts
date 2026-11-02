declare module '*服务协助记录共享Mock.js' {
  export const serviceAssistanceExpiryMessage: string;
  export const serviceAssistanceExpiryMs: number;
  export type ServiceAssistanceConfirmationCopy = { title: string; description: string; hint: string; confirmLabel: string; successMessage: string };
  export function normalizeServiceAssistanceRecord<T extends Record<string, unknown>>(record: T, now?: number): T;
  export function getLatestServiceAssistanceRecord<T extends Record<string, unknown>>(records: T[], elderId: string | null | undefined, serviceId: string): T | null;
  export function getServiceAssistanceConfirmationCopy(record?: Record<string, unknown> | null): ServiceAssistanceConfirmationCopy;
  export function readSharedServiceAssistanceRecords(): Record<string, unknown>[];
  export function upsertSharedServiceAssistanceRecord<T extends Record<string, unknown>>(record: T): T;
  export function requestSharedServiceAssistance<T extends Record<string, unknown>>(record: T): { record: T; reminded: boolean; message: string };
  export function updateSharedServiceAssistanceRecord(recordId: string, updates: Record<string, unknown>): Record<string, unknown> | null;
  export function canReviewServiceAssistance(record: Record<string, unknown> | null | undefined, elderId: string): boolean;
  export function submitSharedServiceReview<T extends Record<string, unknown>>(recordId: string, elderId: string, review: { rating: number; text: string }): T | null;
  export function subscribeSharedServiceAssistanceRecords(listener: () => void): () => void;
}
