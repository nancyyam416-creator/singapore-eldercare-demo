const PREVIEW_STATE_VERSION_KEY = "u2g-preview-state-version";

export const PREVIEW_STATE_VERSION = "2026-11-10-today-overview-v1";

const PREVIEW_STATE_BASELINE: Record<string, unknown> = {
  "u2g-tablet-activated-v1": "true",
  "u2g-safety-read-ids-v1": [],
  "u2g-today-overview-schedules-v3": {},
  "u2g-today-overview-sync-queue-v2": [],
  "u2g-today-overview-recommendations-v2": ["community-show"],
};

export function ensurePreviewStateBaseline() {
  if (typeof window === "undefined") return false;

  try {
    if (window.localStorage.getItem(PREVIEW_STATE_VERSION_KEY) === PREVIEW_STATE_VERSION) return false;

    Object.entries(PREVIEW_STATE_BASELINE).forEach(([key, value]) => {
      window.localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    });
    window.localStorage.setItem(PREVIEW_STATE_VERSION_KEY, PREVIEW_STATE_VERSION);
    return true;
  } catch {
    return false;
  }
}
