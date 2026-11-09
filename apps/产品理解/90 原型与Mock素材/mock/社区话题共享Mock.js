export const communityTopicAccountNames = {
  "ADMIN-001": "赵亚男",
  "ADMIN-002": "王淑芬",
  "ADMIN-CURRENT": "赵亚男",
  "SG-E-000123": "周阿顺",
  "SG-E-000124": "李玉珍",
  "SG-E-000125": "王德昌",
  "SG-E-000126": "林秀英",
  "SG-E-000127": "黄国强",
  "SG-E-000128": "陈美玲",
};

const timestampOf = (value) => {
  const timestamp = Date.parse(String(value || ""));
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const resolveCommunityTopicAccountName = (accountId, fallbackName = "") => (
  communityTopicAccountNames[String(accountId || "")] || String(fallbackName || "").trim() || "未知用户"
);

export const sortCommunityTopicsByPublishedAt = (records) => records
  .map((record, sourceOrder) => ({ record, sourceOrder }))
  .sort((left, right) => {
    const timeDelta = timestampOf(right.record.publishedAt || right.record.createdAt)
      - timestampOf(left.record.publishedAt || left.record.createdAt);
    if (timeDelta) return timeDelta;
    const orderDelta = Number(right.record.creationOrder || 0) - Number(left.record.creationOrder || 0);
    return orderDelta || right.sourceOrder - left.sourceOrder;
  })
  .map(({ record }) => record);

export const isCommunityTopicReferenceAvailable = (referenceContentId, contentRecords) => {
  if (!referenceContentId) return false;
  const source = contentRecords.find((record) => record.id === referenceContentId);
  return Boolean(source && source.resourceType === "life_info" && source.publishStatus === "published");
};
