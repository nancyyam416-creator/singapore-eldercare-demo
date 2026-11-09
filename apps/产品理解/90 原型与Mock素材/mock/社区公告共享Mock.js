import communityLifeMock from "./社区生活跨端统一Mock.json";

export const communityAnnouncementStorageKey = "u2g-community-announcements-v1-shared-contract";
export const communityAnnouncementChangeEvent = "u2g:community-announcements-changed";

const cookieName = "u2g_community_announcements_v1";
const isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";
const defaultAnnouncements = communityLifeMock.communityContents.filter((item) => item.resourceType === "announcement");
const cookieValue = (name) => document.cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1);
const parseRecords = (value) => {
  try {
    const records = JSON.parse(value || "[]");
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
};

export const normalizeSharedCommunityAnnouncement = (record) => ({
  id: String(record.id || ""),
  projectId: String(record.projectId || ""),
  communityId: String(record.communityId || record.projectId || ""),
  resourceType: "announcement",
  title: String(record.title || "").trim(),
  summary: String(record.summary ?? record.description ?? "").trim(),
  bodyHtml: String(record.bodyHtml ?? record.contentHtml ?? "<p><br></p>"),
  coverUrl: String(record.coverUrl || ""),
  source: String(record.source || "").trim(),
  audience: "当前社区全部老人",
  publishAt: String(record.publishAt || ""),
  validUntil: String(record.validUntil || ""),
  displayOrder: Math.max(1, Number.parseInt(record.displayOrder, 10) || 1),
  publishStatus: record.publishStatus === "disabled" || record.status === "已停用" ? "disabled" : "published",
  syncToRecommendation: record.syncToRecommendation !== false,
  updatedAt: String(record.updatedAt || record.publishAt || ""),
});

const readCookieRecords = () => {
  if (!isBrowser()) return [];
  const manifest = cookieValue(`${cookieName}_manifest`);
  if (!manifest) return [];
  try {
    const [revision, countText] = manifest.split(":");
    const count = Number(countText);
    if (!Number.isInteger(count) || count < 1 || count > 32) return [];
    const chunks = Array.from({ length: count }, (_, index) => cookieValue(`${cookieName}_${revision}_${index}`));
    if (chunks.some((chunk) => chunk === undefined)) return [];
    return parseRecords(decodeURIComponent(chunks.join("")));
  } catch {
    return [];
  }
};

const writeRecords = (records) => {
  if (!isBrowser()) return records;
  const normalized = records.map(normalizeSharedCommunityAnnouncement);
  const encoded = encodeURIComponent(JSON.stringify(normalized));
  const chunks = encoded.match(/.{1,3000}/g) || [""];
  if (chunks.length > 32) throw new Error("社区公告存储空间不足");
  const previous = cookieValue(`${cookieName}_manifest`);
  const revision = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  chunks.forEach((chunk, index) => {
    document.cookie = `${cookieName}_${revision}_${index}=${chunk}; path=/; max-age=2592000; samesite=lax`;
  });
  document.cookie = `${cookieName}_manifest=${revision}:${chunks.length}; path=/; max-age=2592000; samesite=lax`;
  window.localStorage.setItem(communityAnnouncementStorageKey, JSON.stringify(normalized));
  if (previous) {
    const [oldRevision, oldCount] = previous.split(":");
    for (let index = 0; index < Math.min(Number(oldCount) || 0, 32); index += 1) document.cookie = `${cookieName}_${oldRevision}_${index}=; path=/; max-age=0`;
  }
  window.dispatchEvent(new CustomEvent(communityAnnouncementChangeEvent, { detail: { revision } }));
  return normalized;
};

export const readSharedCommunityAnnouncements = () => {
  if (!isBrowser()) return defaultAnnouncements.map(normalizeSharedCommunityAnnouncement);
  const cookieRecords = readCookieRecords();
  const records = cookieRecords.length ? cookieRecords : parseRecords(window.localStorage.getItem(communityAnnouncementStorageKey));
  const normalized = (records.length ? records : defaultAnnouncements).map(normalizeSharedCommunityAnnouncement);
  window.localStorage.setItem(communityAnnouncementStorageKey, JSON.stringify(normalized));
  return normalized;
};

export const upsertSharedCommunityAnnouncement = (record) => {
  const normalized = normalizeSharedCommunityAnnouncement(record);
  const records = readSharedCommunityAnnouncements();
  const next = records.some((item) => item.id === normalized.id)
    ? records.map((item) => item.id === normalized.id ? normalized : item)
    : [normalized, ...records];
  writeRecords(next);
  return normalized;
};

export const setSharedCommunityAnnouncementStatus = (id, publishStatus, updatedAt, publishAt) => {
  let updated = null;
  const next = readSharedCommunityAnnouncements().map((item) => {
    if (item.id !== id) return item;
    updated = normalizeSharedCommunityAnnouncement({ ...item, publishStatus, updatedAt, publishAt: publishAt || item.publishAt });
    return updated;
  });
  if (updated) writeRecords(next);
  return updated;
};

export const subscribeSharedCommunityAnnouncements = (listener) => {
  if (!isBrowser()) return () => {};
  let revision = cookieValue(`${cookieName}_manifest`) || "";
  const notify = () => listener(readSharedCommunityAnnouncements());
  const handleStorage = (event) => { if (event.key === communityAnnouncementStorageKey) notify(); };
  const handleChange = () => notify();
  const interval = window.setInterval(() => {
    const nextRevision = cookieValue(`${cookieName}_manifest`) || "";
    if (nextRevision && nextRevision !== revision) {
      revision = nextRevision;
      notify();
    }
  }, 1000);
  window.addEventListener("storage", handleStorage);
  window.addEventListener(communityAnnouncementChangeEvent, handleChange);
  return () => {
    window.clearInterval(interval);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(communityAnnouncementChangeEvent, handleChange);
  };
};
