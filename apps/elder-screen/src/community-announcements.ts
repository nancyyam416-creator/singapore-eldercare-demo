import {
  readSharedCommunityAnnouncements,
  subscribeSharedCommunityAnnouncements,
} from "../../产品理解/90 原型与Mock素材/mock/社区公告共享Mock.js";

export interface SharedCommunityAnnouncement {
  id: string;
  projectId: string;
  communityId: string;
  resourceType: "announcement";
  title: string;
  summary: string;
  bodyHtml: string;
  coverUrl: string;
  publishAt: string;
  publishStatus: "published" | "disabled";
  updatedAt: string;
}

const viewedStoragePrefix = "u2g-community-announcement-viewed";

const normalizeAnnouncement = (record: SharedCommunityAnnouncement): SharedCommunityAnnouncement => ({
  ...record,
  id: String(record.id || ""),
  communityId: String(record.communityId || record.projectId || ""),
  title: String(record.title || "").trim(),
  summary: String(record.summary || "").trim(),
  bodyHtml: String(record.bodyHtml || ""),
  coverUrl: String(record.coverUrl || ""),
  publishAt: String(record.publishAt || ""),
  publishStatus: record.publishStatus === "disabled" ? "disabled" : "published",
});

const sortAnnouncementsByPublishAt = (
  records: SharedCommunityAnnouncement[],
): SharedCommunityAnnouncement[] => records
  .map((record, index) => ({ record, index }))
  .sort((left, right) => {
    const leftTimestamp = Date.parse(left.record.publishAt);
    const rightTimestamp = Date.parse(right.record.publishAt);
    if (Number.isNaN(leftTimestamp) || Number.isNaN(rightTimestamp) || leftTimestamp === rightTimestamp) {
      return left.index - right.index;
    }
    return rightTimestamp - leftTimestamp;
  })
  .map(({ record }) => record);

export const readCommunityAnnouncements = (): SharedCommunityAnnouncement[] => (
  sortAnnouncementsByPublishAt(
    (readSharedCommunityAnnouncements() as SharedCommunityAnnouncement[]).map(normalizeAnnouncement),
  )
);

export const subscribeCommunityAnnouncements = (
  listener: (records: SharedCommunityAnnouncement[]) => void,
) => subscribeSharedCommunityAnnouncements((records: SharedCommunityAnnouncement[]) => {
  listener(sortAnnouncementsByPublishAt(records.map(normalizeAnnouncement)));
});

const viewedStorageKey = (elderId: string) => `${viewedStoragePrefix}:${elderId}`;

export const readViewedCommunityAnnouncementIds = (elderId: string): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(viewedStorageKey(elderId)) || "[]");
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
};

export const markCommunityAnnouncementViewed = (elderId: string, announcementId: string): string[] => {
  const current = readViewedCommunityAnnouncementIds(elderId);
  const next = current.includes(announcementId) ? current : [...current, announcementId];
  if (typeof window !== "undefined") {
    window.localStorage.setItem(viewedStorageKey(elderId), JSON.stringify(next));
  }
  return next;
};

export const communityAnnouncementBodyParagraphs = (bodyHtml: string): string[] => {
  if (typeof document === "undefined") {
    const text = bodyHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return text ? [text] : [];
  }
  const container = document.createElement("div");
  container.innerHTML = bodyHtml;
  const blocks = Array.from(container.querySelectorAll("p, li, h1, h2, h3, blockquote"))
    .map((element) => element.textContent?.replace(/\s+/g, " ").trim() || "")
    .filter(Boolean);
  if (blocks.length) return blocks;
  const text = container.textContent?.replace(/\s+/g, " ").trim();
  return text ? [text] : [];
};

export const formatCommunityAnnouncementPublishAt = (value: string) => {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
};
