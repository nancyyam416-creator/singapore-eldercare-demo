export type WeatherLocationStatus = "valid" | "incomplete" | "invalid";
export type WeatherLocationSource = "elder-profile" | "child-manual" | "child-location-confirmed" | "admin-maintained";
export type WeatherLocationSyncStatus = "synced" | "pending" | "failed";
export type WeatherQueryState = "success" | "cached" | "failed" | "unsupported" | "no-data";
export type FamilyRelationStatus = "active" | "unbound";
export type WeatherConditionCode = "sunny" | "cloudy" | "rain" | "storm" | "snow" | "wind" | "cold" | "hot";
export type FamilyWeatherMockScenario =
  | "default"
  | "cached"
  | "weather-failure"
  | "missing-location"
  | "elder-missing-location"
  | "relation-unbound";

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
}

export interface FamilyWeatherSnapshot {
  scenario: FamilyWeatherMockScenario;
  elder: FamilyWeatherMember;
  children: FamilyWeatherMember[];
  loadedAt: string;
}

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

  return snapshot;
};

export const familyWeatherMockApi = {
  getSnapshot,
  reset: () => undefined,
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

export const formatWeatherUpdatedAt = (value?: string, timeZone = "Asia/Shanghai") => {
  if (!value) return "暂无更新时间";
  return new Intl.DateTimeFormat("zh-CN", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
};
