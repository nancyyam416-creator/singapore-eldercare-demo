export type WeatherLocationStatus = "valid" | "incomplete" | "invalid";
export type WeatherLocationSource = "elder-profile" | "child-manual" | "child-location-confirmed" | "admin-maintained";
export type WeatherLocationSyncStatus = "synced" | "pending" | "failed";
export type WeatherQueryState = "success" | "cached" | "failed" | "unsupported" | "no-data";
export type FamilyRelationStatus = "active" | "unbound";
export type WeatherConditionCode = "sunny" | "cloudy" | "rain" | "storm" | "snow" | "wind" | "cold" | "hot";
export type WeatherCareDirection = "travel" | "warmth" | "hydration" | "daily";
export type FamilyWeatherMockScenario =
  | "default"
  | "cached"
  | "weather-failure"
  | "missing-location"
  | "elder-missing-location"
  | "relation-unbound"
  | "send-failure"
  | "already-sent";

export interface WeatherLocationAuditEntry {
  id: string;
  changedAt: string;
  changedBy: string;
  source: WeatherLocationSource;
  previousLocationId?: string;
  nextLocationId: string;
  summary: string;
}

export interface FamilyWeatherLocation {
  id: string;
  ownerUserId: string;
  countryCode: string;
  countryName: string;
  administrativeAreaCode?: string;
  administrativeAreaName?: string;
  cityCode: string;
  cityName: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  status: WeatherLocationStatus;
  source: WeatherLocationSource;
  updatedAt: string;
  syncStatus: WeatherLocationSyncStatus;
  syncUpdatedAt: string;
  syncError?: string;
  auditTrail: WeatherLocationAuditEntry[];
}

export interface FamilyWeatherObservation {
  locationId: string;
  queryState: WeatherQueryState;
  conditionCode?: WeatherConditionCode;
  conditionText?: string;
  temperatureC?: number;
  highC?: number;
  lowC?: number;
  airQuality?: string;
  riskText?: string;
  observedAt?: string;
  lastSuccessAt?: string;
  queryUpdatedAt: string;
  statusMessage?: string;
}

export interface DailyWeatherCareRecord {
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientUserId: string;
  locationId: string;
  targetLocalDate: string;
  requestId: string;
  text: string;
  source: "weather-care";
  generationMode: "mock-rule";
  confirmationMethod: "touch";
  sentAtUtc: string;
  messageId: string;
  messageStatus: "sent";
  syncStatus: "synced";
  locationSnapshot: FamilyWeatherLocation;
  weatherSnapshot: FamilyWeatherObservation;
}

export interface FamilyWeatherMember {
  id: string;
  userId: string;
  displayName: string;
  relationship: string;
  isElder: boolean;
  priority: number;
  recentInteractionAt: string;
  relationStatus: FamilyRelationStatus;
  location: FamilyWeatherLocation | null;
  weather: FamilyWeatherObservation | null;
  dailyCare?: DailyWeatherCareRecord;
}

export interface FamilyWeatherSnapshot {
  scenario: FamilyWeatherMockScenario;
  elder: FamilyWeatherMember;
  children: FamilyWeatherMember[];
  loadedAt: string;
}

export interface WeatherCareDraft {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientUserId: string;
  senderId: string;
  senderName: string;
  locationId: string;
  targetLocalDate: string;
  direction: WeatherCareDirection;
  variant: number;
  text: string;
  generatedAt: string;
  generationMode: "mock-rule";
  weatherSnapshot: FamilyWeatherObservation;
  locationSnapshot: FamilyWeatherLocation;
}

export interface GenerateWeatherCareInput {
  elderId: string;
  elderName: string;
  recipient: FamilyWeatherMember;
  direction: WeatherCareDirection;
  variant: number;
}

export interface SendWeatherCareInput {
  requestId: string;
  draft: WeatherCareDraft;
  scenario: FamilyWeatherMockScenario;
}

export type SendWeatherCareResult =
  | { status: "success"; record: DailyWeatherCareRecord }
  | { status: "already-sent"; record: DailyWeatherCareRecord }
  | { status: "failed"; errorCode: "MOCK_SEND_FAILED"; message: string };

export const weatherCareDirectionOptions: Array<{ id: WeatherCareDirection; label: string }> = [
  { id: "travel", label: "出门准备" },
  { id: "warmth", label: "添衣保暖" },
  { id: "hydration", label: "防晒补水" },
  { id: "daily", label: "日常问候" },
];

const DAILY_CARE_STORAGE_KEY = "u2g-family-weather-care-records-v1";
const successfulRequests = new Map<string, DailyWeatherCareRecord>();
const sendAttempts = new Map<string, number>();

const formatLocalDate = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
};

const readDailyRecords = (): DailyWeatherCareRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(DAILY_CARE_STORAGE_KEY);
    return stored ? JSON.parse(stored) as DailyWeatherCareRecord[] : [];
  } catch {
    return [];
  }
};

const writeDailyRecords = (records: DailyWeatherCareRecord[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DAILY_CARE_STORAGE_KEY, JSON.stringify(records));
};

const makeLocation = (
  id: string,
  ownerUserId: string,
  cityName: string,
  cityCode: string,
  administrativeAreaName: string,
  administrativeAreaCode: string,
  countryName: string,
  countryCode: string,
  latitude: number,
  longitude: number,
  timeZone: string,
  source: WeatherLocationSource,
): FamilyWeatherLocation => ({
  id,
  ownerUserId,
  countryCode,
  countryName,
  administrativeAreaCode,
  administrativeAreaName,
  cityCode,
  cityName,
  latitude,
  longitude,
  timeZone,
  status: "valid",
  source,
  updatedAt: "2026-07-27T01:20:00.000Z",
  syncStatus: "synced",
  syncUpdatedAt: "2026-07-27T01:22:00.000Z",
  auditTrail: [{
    id: `audit-${id}`,
    changedAt: "2026-07-27T01:20:00.000Z",
    changedBy: source === "elder-profile" ? "老人档案同步" : "家庭成员确认",
    source,
    nextLocationId: id,
    summary: `确认天气位置为${cityName}`,
  }],
});

const makeWeather = (
  locationId: string,
  conditionCode: WeatherConditionCode,
  conditionText: string,
  temperatureC: number,
  highC: number,
  lowC: number,
  riskText?: string,
): FamilyWeatherObservation => ({
  locationId,
  queryState: "success",
  conditionCode,
  conditionText,
  temperatureC,
  highC,
  lowC,
  riskText,
  observedAt: "2026-07-27T01:40:00.000Z",
  lastSuccessAt: "2026-07-27T01:40:00.000Z",
  queryUpdatedAt: "2026-07-27T01:41:00.000Z",
});

const createBaseSnapshot = (): FamilyWeatherSnapshot => {
  const elderLocation = makeLocation("loc-elder-beijing", "elder-wang", "北京", "CN-BJS", "北京市", "CN-BJ", "中国", "CN", 39.9042, 116.4074, "Asia/Shanghai", "elder-profile");
  const daughterLocation = makeLocation("loc-daughter-shanghai", "daughter-xiaomin", "上海", "CN-SHA", "上海市", "CN-SH", "中国", "CN", 31.2304, 121.4737, "Asia/Shanghai", "child-manual");
  const sonLocation = makeLocation("loc-son-vancouver", "son-xiaogang", "温哥华", "CA-YVR", "不列颠哥伦比亚省", "CA-BC", "加拿大", "CA", 49.2827, -123.1207, "America/Vancouver", "child-location-confirmed");
  const youngerDaughterLocation = makeLocation("loc-younger-daughter-singapore", "daughter-xiaoyu", "新加坡", "SG-SIN", "新加坡", "SG-01", "新加坡", "SG", 1.3521, 103.8198, "Asia/Singapore", "child-manual");

  return {
    scenario: "default",
    loadedAt: new Date().toISOString(),
    elder: {
      id: "member-elder",
      userId: "elder-wang",
      displayName: "王奶奶",
      relationship: "本人",
      isElder: true,
      priority: 999,
      recentInteractionAt: "2026-07-27T01:35:00.000Z",
      relationStatus: "active",
      location: elderLocation,
      weather: { ...makeWeather(elderLocation.id, "sunny", "晴", 26, 31, 22), airQuality: "良" },
    },
    children: [
      {
        id: "member-daughter",
        userId: "daughter-xiaomin",
        displayName: "女儿小敏",
        relationship: "女儿",
        isElder: false,
        priority: 100,
        recentInteractionAt: "2026-07-27T01:30:00.000Z",
        relationStatus: "active",
        location: daughterLocation,
        weather: makeWeather(daughterLocation.id, "rain", "有雨", 19, 22, 17, "今天有雨，出门记得带伞"),
      },
      {
        id: "member-son",
        userId: "son-xiaogang",
        displayName: "儿子小刚",
        relationship: "儿子",
        isElder: false,
        priority: 90,
        recentInteractionAt: "2026-07-26T10:15:00.000Z",
        relationStatus: "active",
        location: sonLocation,
        weather: makeWeather(sonLocation.id, "cold", "偏冷", 8, 11, 5, "当地天气偏冷，注意添衣"),
      },
      {
        id: "member-younger-daughter",
        userId: "daughter-xiaoyu",
        displayName: "小女儿小雨",
        relationship: "小女儿",
        isElder: false,
        priority: 80,
        recentInteractionAt: "2026-07-25T08:20:00.000Z",
        relationStatus: "active",
        location: youngerDaughterLocation,
        weather: makeWeather(youngerDaughterLocation.id, "storm", "雷阵雨", 30, 32, 27, "午后可能有雷阵雨"),
      },
      {
        id: "member-grandson",
        userId: "grandson-jiejie",
        displayName: "孙子杰杰",
        relationship: "孙子",
        isElder: false,
        priority: 70,
        recentInteractionAt: "2026-07-24T12:00:00.000Z",
        relationStatus: "active",
        location: null,
        weather: null,
      },
    ],
  };
};

const attachDailyRecords = (snapshot: FamilyWeatherSnapshot) => {
  const records = readDailyRecords();
  return {
    ...snapshot,
    children: snapshot.children.map((member) => {
      if (!member.location || member.location.status !== "valid" || !member.location.timeZone) return member;
      const localDate = formatLocalDate(new Date(), member.location.timeZone);
      const record = records.find((item) => item.recipientId === member.id && item.locationId === member.location?.id && item.targetLocalDate === localDate);
      return record ? { ...member, dailyCare: record } : member;
    }),
  };
};

const getSnapshot = (scenario: FamilyWeatherMockScenario = "default"): FamilyWeatherSnapshot => {
  const snapshot = createBaseSnapshot();
  snapshot.scenario = scenario;

  if (scenario === "cached") {
    snapshot.children[0] = {
      ...snapshot.children[0],
      weather: snapshot.children[0].weather ? {
        ...snapshot.children[0].weather,
        queryState: "cached",
        observedAt: "2026-07-27T00:10:00.000Z",
        lastSuccessAt: "2026-07-27T00:10:00.000Z",
        queryUpdatedAt: "2026-07-27T01:41:00.000Z",
        statusMessage: "更新失败，正在显示最近一次成功数据",
      } : null,
    };
  }

  if (scenario === "weather-failure") {
    snapshot.children[0] = {
      ...snapshot.children[0],
      weather: {
        locationId: snapshot.children[0].location?.id ?? "unknown",
        queryState: "failed",
        queryUpdatedAt: new Date().toISOString(),
        statusMessage: "天气暂时无法获取，请稍后再试",
      },
    };
  }

  if (scenario === "missing-location") {
    const previousLocation = snapshot.children[0].location;
    snapshot.children[0] = {
      ...snapshot.children[0],
      location: previousLocation ? {
        ...previousLocation,
        countryCode: "",
        countryName: "",
        cityCode: "",
        cityName: "",
        latitude: 0,
        longitude: 0,
        timeZone: "",
        status: "incomplete",
        syncStatus: "pending",
      } : null,
      weather: null,
    };
  }

  if (scenario === "elder-missing-location") {
    const previousLocation = snapshot.elder.location;
    snapshot.elder = {
      ...snapshot.elder,
      location: previousLocation ? {
        ...previousLocation,
        countryCode: "",
        countryName: "",
        cityCode: "",
        cityName: "",
        latitude: 0,
        longitude: 0,
        timeZone: "",
        status: "incomplete",
        syncStatus: "pending",
      } : null,
      weather: null,
    };
  }

  if (scenario === "relation-unbound") snapshot.children[0] = { ...snapshot.children[0], relationStatus: "unbound" };

  if (scenario === "already-sent") {
    const recipient = snapshot.children[0];
    if (recipient.location && recipient.weather) {
      recipient.dailyCare = {
        senderId: snapshot.elder.userId,
        senderName: snapshot.elder.displayName,
        recipientId: recipient.id,
        recipientUserId: recipient.userId,
        locationId: recipient.location.id,
        targetLocalDate: formatLocalDate(new Date(), recipient.location.timeZone),
        requestId: "weather-care-already-sent",
        text: "女儿，惦记你了。上海有雨、19度，出门记得带伞，注意脚下安全。",
        source: "weather-care",
        generationMode: "mock-rule",
        confirmationMethod: "touch",
        sentAtUtc: new Date().toISOString(),
        messageId: "weather-care-message-already-sent",
        messageStatus: "sent",
        syncStatus: "synced",
        locationSnapshot: { ...recipient.location },
        weatherSnapshot: { ...recipient.weather },
      };
    }
  }

  return attachDailyRecords(snapshot);
};

const localPeriod = (timeZone: string) => {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", hour12: false }).format(new Date()));
  if (hour < 6) return "夜里";
  if (hour < 11) return "早上";
  if (hour < 14) return "中午";
  if (hour < 18) return "下午";
  return "晚上";
};

const directionSentence = (direction: WeatherCareDirection, member: FamilyWeatherMember) => {
  const condition = member.weather?.conditionText ?? "天气有变化";
  const temperature = member.weather?.temperatureC;
  const temperatureText = typeof temperature === "number" ? `${temperature}度` : "";
  const city = member.location?.cityName ?? "你那里";
  if (direction === "travel") return `${city}${condition}${temperatureText ? `、${temperatureText}` : ""}，出门前记得准备好雨具和随身用品。`;
  if (direction === "warmth") return `${city}现在${condition}${temperatureText ? `，${temperatureText}` : ""}，记得根据天气添件衣服。`;
  if (direction === "hydration") return `${city}现在${condition}${temperatureText ? `，${temperatureText}` : ""}，出门记得防晒，也要多喝水。`;
  return `${city}今天${condition}${temperatureText ? `，${temperatureText}` : ""}，照顾好自己，有空给家里回句话。`;
};

const generateDraft = async (input: GenerateWeatherCareInput): Promise<WeatherCareDraft> => {
  const { recipient, direction, variant } = input;
  if (!recipient.location || recipient.location.status !== "valid" || !recipient.weather || !["success", "cached"].includes(recipient.weather.queryState)) {
    throw new Error("WEATHER_CONTEXT_UNAVAILABLE");
  }
  const period = localPeriod(recipient.location.timeZone);
  const relation = recipient.relationship;
  const openings = [`${relation}，${period}好。`, `${relation}，看了下你那里的天气。`, `${relation}，惦记你了。`];
  const text = `${openings[variant % openings.length]}${directionSentence(direction, recipient)}`;
  await new Promise((resolve) => window.setTimeout(resolve, 420));
  return {
    id: `weather-draft-${recipient.id}-${Date.now()}-${variant}`,
    recipientId: recipient.id,
    recipientName: recipient.displayName,
    recipientUserId: recipient.userId,
    senderId: input.elderId,
    senderName: input.elderName,
    locationId: recipient.location.id,
    targetLocalDate: formatLocalDate(new Date(), recipient.location.timeZone),
    direction,
    variant,
    text,
    generatedAt: new Date().toISOString(),
    generationMode: "mock-rule",
    weatherSnapshot: { ...recipient.weather },
    locationSnapshot: { ...recipient.location },
  };
};

const sendCareMessage = async (input: SendWeatherCareInput): Promise<SendWeatherCareResult> => {
  const previousSuccess = successfulRequests.get(input.requestId);
  if (previousSuccess) return { status: "success", record: previousSuccess };

  const records = readDailyRecords();
  const existing = records.find((item) => (
    item.recipientId === input.draft.recipientId
    && item.locationId === input.draft.locationId
    && item.targetLocalDate === input.draft.targetLocalDate
  ));
  if (existing) return { status: "already-sent", record: existing };

  const attempts = (sendAttempts.get(input.requestId) ?? 0) + 1;
  sendAttempts.set(input.requestId, attempts);
  await new Promise((resolve) => window.setTimeout(resolve, 720));
  if (input.scenario === "send-failure" && attempts === 1) {
    return { status: "failed", errorCode: "MOCK_SEND_FAILED", message: "发送失败，请检查网络后重新发送" };
  }

  const record: DailyWeatherCareRecord = {
    senderId: input.draft.senderId,
    senderName: input.draft.senderName,
    recipientId: input.draft.recipientId,
    recipientUserId: input.draft.recipientUserId,
    locationId: input.draft.locationId,
    targetLocalDate: input.draft.targetLocalDate,
    requestId: input.requestId,
    text: input.draft.text,
    source: "weather-care",
    generationMode: input.draft.generationMode,
    confirmationMethod: "touch",
    sentAtUtc: new Date().toISOString(),
    messageId: `weather-care-message-${Date.now()}`,
    messageStatus: "sent",
    syncStatus: "synced",
    locationSnapshot: { ...input.draft.locationSnapshot },
    weatherSnapshot: { ...input.draft.weatherSnapshot },
  };
  successfulRequests.set(input.requestId, record);
  writeDailyRecords([record, ...records]);
  return { status: "success", record };
};

const reset = () => {
  successfulRequests.clear();
  sendAttempts.clear();
  if (typeof window !== "undefined") window.localStorage.removeItem(DAILY_CARE_STORAGE_KEY);
};

export const familyWeatherMockApi = {
  getSnapshot,
  generateDraft,
  sendCareMessage,
  reset,
};

export const formatWeatherLocalTime = (timeZone: string) => new Intl.DateTimeFormat("zh-CN", {
  timeZone,
  month: "numeric",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
}).format(new Date());

export const getWeatherLocalDate = (timeZone: string) => formatLocalDate(new Date(), timeZone);

export const formatWeatherUpdatedAt = (value?: string, timeZone = "Asia/Shanghai") => {
  if (!value) return "暂无更新时间";
  return new Intl.DateTimeFormat("zh-CN", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
};
