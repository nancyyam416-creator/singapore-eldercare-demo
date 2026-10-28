export const weatherLocationCatalog = [
  {
    code: "SG",
    name: "新加坡",
    regions: [
      {
        code: "SG-CENTRAL",
        name: "中央区",
        cities: [
          { code: "SG-SINGAPORE", name: "新加坡", latitude: 1.29027, longitude: 103.851959, timezone: "Asia/Singapore" },
        ],
      },
    ],
  },
  {
    code: "AU",
    name: "澳大利亚",
    regions: [
      {
        code: "AU-NSW",
        name: "新南威尔士州",
        cities: [
          { code: "AU-SYDNEY", name: "悉尼", latitude: -33.86882, longitude: 151.20929, timezone: "Australia/Sydney" },
        ],
      },
    ],
  },
  {
    code: "GB",
    name: "英国",
    regions: [
      {
        code: "GB-ENG",
        name: "英格兰",
        cities: [
          { code: "GB-LONDON", name: "伦敦", latitude: 51.507351, longitude: -0.127758, timezone: "Europe/London" },
        ],
      },
    ],
  },
  {
    code: "MY",
    name: "马来西亚",
    regions: [
      {
        code: "MY-14",
        name: "吉隆坡联邦直辖区",
        cities: [
          { code: "MY-KUL", name: "吉隆坡", latitude: 3.139003, longitude: 101.686855, timezone: "Asia/Kuala_Lumpur" },
        ],
      },
    ],
  },
  {
    code: "JP",
    name: "日本",
    regions: [
      {
        code: "JP-13",
        name: "东京都",
        cities: [
          { code: "JP-TOKYO", name: "东京", latitude: 35.676422, longitude: 139.650027, timezone: "Asia/Tokyo" },
        ],
      },
    ],
  },
];

export const initialWeatherLocations = [
  { id: "LOC-E-000128", ownerType: "老人", ownerId: "SG-E-000128", status: "有效", countryCode: "SG", countryName: "新加坡", regionCode: "SG-CENTRAL", regionName: "中央区", cityCode: "SG-SINGAPORE", cityName: "新加坡", latitude: 1.2849, longitude: 103.8167, timezone: "Asia/Singapore", source: "老人档案地址解析", sourceDetail: "12 Bukit Merah View #08-31", updatedAt: "2026-07-27 09:18", syncStatus: "同步成功", syncedAt: "2026-07-27 09:19", invalidReason: "" },
  { id: "LOC-E-000127", ownerType: "老人", ownerId: "SG-E-000127", status: "有效", countryCode: "SG", countryName: "新加坡", regionCode: "SG-CENTRAL", regionName: "中央区", cityCode: "SG-SINGAPORE", cityName: "新加坡", latitude: 1.3343, longitude: 103.8520, timezone: "Asia/Singapore", source: "老人档案地址解析", sourceDetail: "85 Lorong 4 Toa Payoh #06-112", updatedAt: "2026-07-27 08:55", syncStatus: "同步成功", syncedAt: "2026-07-27 08:56", invalidReason: "" },
  { id: "LOC-E-000126", ownerType: "老人", ownerId: "SG-E-000126", status: "有效", countryCode: "SG", countryName: "新加坡", regionCode: "SG-CENTRAL", regionName: "中央区", cityCode: "SG-SINGAPORE", cityName: "新加坡", latitude: 1.2943, longitude: 103.8061, timezone: "Asia/Singapore", source: "老人档案地址解析", sourceDetail: "46 Commonwealth Drive #10-127", updatedAt: "2026-07-27 08:40", syncStatus: "同步失败", syncedAt: "2026-07-27 08:41", invalidReason: "下游数据同步超时，位置本身仍然有效" },
  { id: "LOC-E-000125", ownerType: "老人", ownerId: "SG-E-000125", status: "待完善", countryCode: "", countryName: "", regionCode: "", regionName: "", cityCode: "", cityName: "", latitude: null, longitude: null, timezone: "", source: "老人档案地址解析", sourceDetail: "待补充", updatedAt: "2026-07-27 08:20", syncStatus: "待同步", syncedAt: "", invalidReason: "居住地址缺失，无法解析国家、城市、经纬度和时区" },
  { id: "LOC-E-000124", ownerType: "老人", ownerId: "SG-E-000124", status: "有效", countryCode: "SG", countryName: "新加坡", regionCode: "SG-CENTRAL", regionName: "中央区", cityCode: "SG-SINGAPORE", cityName: "新加坡", latitude: 1.3691, longitude: 103.8454, timezone: "Asia/Singapore", source: "老人档案地址解析", sourceDetail: "305 Ang Mo Kio Avenue 1 #11-1161", updatedAt: "2026-07-26 17:12", syncStatus: "同步成功", syncedAt: "2026-07-26 17:13", invalidReason: "" },
  { id: "LOC-E-000123", ownerType: "老人", ownerId: "SG-E-000123", status: "有效", countryCode: "SG", countryName: "新加坡", regionCode: "SG-CENTRAL", regionName: "中央区", cityCode: "SG-SINGAPORE", cityName: "新加坡", latitude: 1.3321, longitude: 103.8462, timezone: "Asia/Singapore", source: "老人档案地址解析", sourceDetail: "123 Lorong 1 Toa Payoh #04-308", updatedAt: "2026-07-26 16:45", syncStatus: "同步成功", syncedAt: "2026-07-26 16:46", invalidReason: "" },
  { id: "LOC-R-00031", ownerType: "亲属", ownerId: "RU-00031", status: "有效", countryCode: "AU", countryName: "澳大利亚", regionCode: "AU-NSW", regionName: "新南威尔士州", cityCode: "AU-SYDNEY", cityName: "悉尼", latitude: -33.86882, longitude: 151.20929, timezone: "Australia/Sydney", source: "子女手动选择", sourceDetail: "子女端确认保存", updatedAt: "2026-07-27 09:12", syncStatus: "同步成功", syncedAt: "2026-07-27 09:13", invalidReason: "" },
  { id: "LOC-R-00030", ownerType: "亲属", ownerId: "RU-00030", status: "待完善", countryCode: "MY", countryName: "马来西亚", regionCode: "", regionName: "", cityCode: "", cityName: "", latitude: null, longitude: null, timezone: "", source: "子女手动选择", sourceDetail: "仅保存了国家", updatedAt: "2026-07-27 08:36", syncStatus: "待同步", syncedAt: "", invalidReason: "行政区和城市未选择，无法确定经纬度与 IANA 时区" },
  { id: "LOC-R-00029", ownerType: "亲属", ownerId: "RU-00029", status: "有效", countryCode: "GB", countryName: "英国", regionCode: "GB-ENG", regionName: "英格兰", cityCode: "GB-LONDON", cityName: "伦敦", latitude: 51.507351, longitude: -0.127758, timezone: "Europe/London", source: "后台协助维护", sourceDetail: "运营人员根据亲属确认信息补录", updatedAt: "2026-07-26 18:20", syncStatus: "同步成功", syncedAt: "2026-07-26 18:21", invalidReason: "" },
  { id: "LOC-R-00028", ownerType: "亲属", ownerId: "RU-00028", status: "有效", countryCode: "MY", countryName: "马来西亚", regionCode: "MY-14", regionName: "吉隆坡联邦直辖区", cityCode: "MY-KUL", cityName: "吉隆坡", latitude: 3.139003, longitude: 101.686855, timezone: "Asia/Kuala_Lumpur", source: "子女定位确认", sourceDetail: "设备定位预填后由子女确认", updatedAt: "2026-07-26 14:02", syncStatus: "同步成功", syncedAt: "2026-07-26 14:03", invalidReason: "" },
  { id: "LOC-R-00027", ownerType: "亲属", ownerId: "RU-00027", status: "已失效", countryCode: "SG", countryName: "新加坡", regionCode: "SG-CENTRAL", regionName: "中央区", cityCode: "SG-SINGAPORE", cityName: "新加坡", latitude: 1.29027, longitude: 103.851959, timezone: "Asia/Singapore", source: "子女手动选择", sourceDetail: "已被新的位置记录替换", updatedAt: "2026-07-20 12:16", syncStatus: "已停止同步", syncedAt: "2026-07-20 12:16", invalidReason: "位置已被替换，仅供历史追溯" },
  { id: "LOC-R-00026", ownerType: "亲属", ownerId: "RU-00026", status: "待完善", countryCode: "", countryName: "", regionCode: "", regionName: "", cityCode: "", cityName: "", latitude: null, longitude: null, timezone: "", source: "尚未设置", sourceDetail: "亲属尚未提交天气城市", updatedAt: "—", syncStatus: "待同步", syncedAt: "", invalidReason: "尚未设置天气位置" },
  { id: "LOC-R-00025", ownerType: "亲属", ownerId: "RU-00025", status: "有效", countryCode: "JP", countryName: "日本", regionCode: "JP-13", regionName: "东京都", cityCode: "JP-TOKYO", cityName: "东京", latitude: 35.676422, longitude: 139.650027, timezone: "Asia/Tokyo", source: "子女手动选择", sourceDetail: "子女端确认保存", updatedAt: "2026-07-25 16:28", syncStatus: "同步成功", syncedAt: "2026-07-25 16:29", invalidReason: "" },
];

export const initialWeatherQueries = [
  { id: "WQ-001", locationId: "LOC-E-000128", status: "查询成功", fetchedAt: "2026-07-27 09:30", lastSuccessAt: "2026-07-27 09:30", cacheUpdatedAt: "2026-07-27 09:30", failureType: "", message: "天气数据可用" },
  { id: "WQ-002", locationId: "LOC-E-000126", status: "查询失败", fetchedAt: "2026-07-27 09:28", lastSuccessAt: "2026-07-27 08:58", cacheUpdatedAt: "2026-07-27 08:58", failureType: "天气查询失败", message: "请求失败，后台保留最近一次成功缓存" },
  { id: "WQ-003", locationId: "LOC-E-000124", status: "使用缓存", fetchedAt: "2026-07-27 09:25", lastSuccessAt: "2026-07-27 08:55", cacheUpdatedAt: "2026-07-27 08:55", failureType: "刷新失败", message: "更新失败，当前展示最近成功缓存" },
  { id: "WQ-004", locationId: "LOC-R-00031", status: "查询成功", fetchedAt: "2026-07-27 09:31", lastSuccessAt: "2026-07-27 09:31", cacheUpdatedAt: "2026-07-27 09:31", failureType: "", message: "天气数据可用" },
  { id: "WQ-005", locationId: "LOC-R-00029", status: "使用缓存", fetchedAt: "2026-07-27 09:24", lastSuccessAt: "2026-07-27 08:54", cacheUpdatedAt: "2026-07-27 08:54", failureType: "天气查询失败", message: "查询失败，使用伦敦最近成功缓存" },
  { id: "WQ-006", locationId: "LOC-R-00028", status: "查询成功", fetchedAt: "2026-07-27 09:22", lastSuccessAt: "2026-07-27 09:22", cacheUpdatedAt: "2026-07-27 09:22", failureType: "", message: "天气数据可用" },
  { id: "WQ-007", locationId: "LOC-R-00025", status: "查询失败", fetchedAt: "2026-07-27 09:18", lastSuccessAt: "", cacheUpdatedAt: "", failureType: "地区暂不支持", message: "无可用缓存，不展示默认天气" },
];

export const initialWeatherRegionIntegrations = [
  { id: "WRI-SG", countryCode: "SG", countryName: "新加坡", granularity: "国家 / 地区", coverage: "新加坡全境", interfaceMode: "统一天气服务网关", interfaceKey: "REGION-SG", accessStatus: "已接入", queryStatus: "正常", cacheStatus: "缓存可用", linkedLocationCount: 9, lastCheckedAt: "2026-07-27 10:28", lastSuccessAt: "2026-07-27 10:28", message: "查询与缓存链路正常" },
  { id: "WRI-MY", countryCode: "MY", countryName: "马来西亚", granularity: "国家 / 地区", coverage: "马来西亚", interfaceMode: "统一天气服务网关", interfaceKey: "REGION-MY", accessStatus: "已接入", queryStatus: "正常", cacheStatus: "缓存可用", linkedLocationCount: 2, lastCheckedAt: "2026-07-27 10:24", lastSuccessAt: "2026-07-27 10:24", message: "查询与缓存链路正常" },
  { id: "WRI-AU", countryCode: "AU", countryName: "澳大利亚", granularity: "国家 / 地区", coverage: "澳大利亚", interfaceMode: "统一天气服务网关", interfaceKey: "REGION-AU", accessStatus: "已接入", queryStatus: "使用缓存", cacheStatus: "缓存可用", linkedLocationCount: 1, lastCheckedAt: "2026-07-27 10:18", lastSuccessAt: "2026-07-27 09:52", message: "本次刷新失败，当前使用最近成功缓存" },
  { id: "WRI-GB", countryCode: "GB", countryName: "英国", granularity: "国家 / 地区", coverage: "英国", interfaceMode: "统一天气服务网关", interfaceKey: "REGION-GB", accessStatus: "已接入", queryStatus: "正常", cacheStatus: "缓存可用", linkedLocationCount: 1, lastCheckedAt: "2026-07-27 10:20", lastSuccessAt: "2026-07-27 10:20", message: "查询与缓存链路正常" },
  { id: "WRI-JP", countryCode: "JP", countryName: "日本", granularity: "国家 / 地区", coverage: "日本", interfaceMode: "统一天气服务网关", interfaceKey: "REGION-JP", accessStatus: "待接入", queryStatus: "不可查询", cacheStatus: "无可用缓存", linkedLocationCount: 1, lastCheckedAt: "2026-07-27 10:16", lastSuccessAt: "—", message: "当前区域尚未完成天气接口接入" },
];

export const initialWeatherLocationAudits = [
  { id: "WA-001", ownerType: "亲属", ownerId: "RU-00029", action: "后台补充天气位置", before: "未设置", after: "英国 / 英格兰 / 伦敦 / Europe/London", source: "后台协助维护", operator: "赵亚男", operatedAt: "2026-07-26 18:20", result: "成功" },
  { id: "WA-002", ownerType: "老人", ownerId: "SG-E-000126", action: "居住地址解析", before: "待完善", after: "新加坡 / 中央区 / 新加坡 / Asia/Singapore", source: "老人档案地址解析", operator: "系统", operatedAt: "2026-07-27 08:40", result: "位置有效，数据同步失败" },
  { id: "WA-003", ownerType: "亲属", ownerId: "RU-00027", action: "位置失效", before: "新加坡 / 中央区 / 新加坡", after: "已失效", source: "新位置替换", operator: "系统", operatedAt: "2026-07-20 12:16", result: "成功" },
  { id: "WA-004", ownerType: "老人", ownerId: "SG-E-000125", action: "居住地址解析", before: "未解析", after: "待完善", source: "老人档案地址解析", operator: "系统", operatedAt: "2026-07-27 08:20", result: "地址缺失，无法解析" },
];

const qweatherCondition = (code, text) => ({ code, text });

export const weatherConditionCatalog = [
  { code: "CLEAR", name: "晴朗", description: "晴、少云或晴间多云", conditions: [qweatherCondition("100", "晴"), qweatherCondition("102", "少云"), qweatherCondition("103", "晴间多云")], configurable: true },
  { code: "CLOUDY", name: "多云阴天", description: "多云或阴天", conditions: [qweatherCondition("101", "多云"), qweatherCondition("104", "阴")], configurable: true },
  { code: "RAIN", name: "普通降雨", description: "阵雨及小到中等强度降雨", conditions: [qweatherCondition("300", "阵雨"), qweatherCondition("305", "小雨"), qweatherCondition("306", "中雨"), qweatherCondition("309", "毛毛雨/细雨"), qweatherCondition("314", "小到中雨"), qweatherCondition("315", "中到大雨"), qweatherCondition("399", "雨")], configurable: true },
  { code: "HEAVY_RAIN", name: "强降雨", description: "强阵雨、大雨及暴雨级降雨", conditions: [qweatherCondition("301", "强阵雨"), qweatherCondition("307", "大雨"), qweatherCondition("308", "极端降雨"), qweatherCondition("310", "暴雨"), qweatherCondition("311", "大暴雨"), qweatherCondition("312", "特大暴雨"), qweatherCondition("316", "大到暴雨"), qweatherCondition("317", "暴雨到大暴雨"), qweatherCondition("318", "大暴雨到特大暴雨")], configurable: true },
  { code: "THUNDER_HAIL", name: "雷暴冰雹", description: "雷阵雨、强雷阵雨或伴有冰雹", conditions: [qweatherCondition("302", "雷阵雨"), qweatherCondition("303", "强雷阵雨"), qweatherCondition("304", "雷阵雨伴有冰雹")], configurable: true },
  { code: "FREEZING_MIX", name: "冻雨与雨雪", description: "冻雨、雨夹雪及雨雪混合天气", conditions: [qweatherCondition("313", "冻雨"), qweatherCondition("404", "雨夹雪"), qweatherCondition("405", "雨雪天气"), qweatherCondition("406", "阵雨夹雪")], configurable: true },
  { code: "SNOW", name: "普通降雪", description: "小到中雪及阵雪", conditions: [qweatherCondition("400", "小雪"), qweatherCondition("401", "中雪"), qweatherCondition("407", "阵雪"), qweatherCondition("408", "小到中雪"), qweatherCondition("499", "雪")], configurable: true },
  { code: "HEAVY_SNOW", name: "强降雪", description: "大雪、暴雪及更强降雪", conditions: [qweatherCondition("402", "大雪"), qweatherCondition("403", "暴雪"), qweatherCondition("409", "中到大雪"), qweatherCondition("410", "大到暴雪")], configurable: true },
  { code: "FOG", name: "雾", description: "薄雾至特强浓雾", conditions: [qweatherCondition("500", "薄雾"), qweatherCondition("501", "雾"), qweatherCondition("509", "浓雾"), qweatherCondition("510", "强浓雾"), qweatherCondition("514", "大雾"), qweatherCondition("515", "特强浓雾")], configurable: true },
  { code: "HAZE", name: "霾", description: "霾及中度至严重霾", conditions: [qweatherCondition("502", "霾"), qweatherCondition("511", "中度霾"), qweatherCondition("512", "重度霾"), qweatherCondition("513", "严重霾")], configurable: true },
  { code: "DUST", name: "沙尘", description: "扬沙、浮尘及沙尘暴", conditions: [qweatherCondition("503", "扬沙"), qweatherCondition("504", "浮尘"), qweatherCondition("507", "沙尘暴"), qweatherCondition("508", "强沙尘暴")], configurable: true },
  { code: "HOT", name: "高温", description: "和风天气官方天气现象“热”", conditions: [qweatherCondition("900", "热")], configurable: true },
  { code: "COLD", name: "低温", description: "和风天气官方天气现象“冷”", conditions: [qweatherCondition("901", "冷")], configurable: true },
  { code: "UNKNOWN", name: "未知", description: "官方未知代码及未来无法识别的新增代码统一使用此兜底", conditions: [qweatherCondition("999", "未知")], configurable: false },
];

const qweatherConditionGroupMap = Object.freeze(Object.fromEntries(
  weatherConditionCatalog.flatMap((group) => group.conditions.map((condition) => [condition.code, group.code])),
));

export const resolveQWeatherCondition = (condition = {}) => {
  const code = String(condition.code ?? "").trim();
  const text = String(condition.text ?? "").trim();
  const groupCode = qweatherConditionGroupMap[code] || "UNKNOWN";
  const group = weatherConditionCatalog.find((item) => item.code === groupCode) || weatherConditionCatalog.at(-1);
  return { condition: { code, text }, groupCode: group.code, groupName: group.name };
};

export const initialCareScripts = weatherConditionCatalog.map((group) => ({
  id: `WCS-${group.code}`,
  weatherCode: group.code,
  weatherName: group.name,
  template: group.code === "CLEAR" ? "{子女称呼}，{城市}今天天气晴朗，气温{温度}，出门记得注意防晒，多喝水。"
    : group.code === "CLOUDY" ? "{子女称呼}，{城市}今天多云或阴，气温{温度}，外出记得适时增减衣物。"
      : group.code === "RAIN" ? "{子女称呼}，{城市}今天有雨，气温{温度}，出门带好雨具，路上注意安全。"
        : group.code === "HEAVY_RAIN" ? "{子女称呼}，{城市}今天有强降雨，请提醒{老人称呼}尽量留在室内，避开积水路段。"
          : group.code === "THUNDER_HAIL" ? "{子女称呼}，{城市}今天有雷暴或冰雹风险，请提醒{老人称呼}留在室内并远离窗边。"
            : group.code === "FREEZING_MIX" ? "{子女称呼}，{城市}今天有冻雨或雨雪天气，请提醒{老人称呼}减少外出，注意路面湿滑。"
              : group.code === "SNOW" ? "{子女称呼}，{城市}今天有降雪，气温{温度}，请提醒{老人称呼}注意保暖和防滑。"
                : group.code === "HEAVY_SNOW" ? "{子女称呼}，{城市}今天有强降雪，建议{老人称呼}留在室内并留意当地出行信息。"
                  : group.code === "FOG" ? "{子女称呼}，{城市}今天有雾，能见度较低，请提醒{老人称呼}外出时放慢脚步。"
                    : group.code === "HAZE" ? "{子女称呼}，{城市}今天有霾，请提醒{老人称呼}减少长时间户外活动，留意呼吸不适。"
                      : group.code === "DUST" ? "{子女称呼}，{城市}今天有沙尘，请提醒{老人称呼}减少外出并做好口鼻防护。"
                        : group.code === "HOT" ? "{子女称呼}，{城市}天气炎热，气温{温度}，记得及时补水，避免长时间晒太阳。"
                          : group.code === "COLD" ? "{子女称呼}，{城市}天气寒冷，当前{温度}，记得添衣保暖，出门注意防寒。"
                            : "{子女称呼}，{城市}当前天气信息暂未完全识别，气温{温度}，外出前请留意当地最新天气情况。",
  status: group.code === "UNKNOWN" ? "内置兜底" : "启用",
  version: 1,
  updatedAt: group.code === "UNKNOWN" ? "系统预置" : "2026-10-28 10:00",
  operator: group.code === "UNKNOWN" ? "系统" : "赵亚男",
  historyCount: 0,
  ...(group.code === "UNKNOWN" ? { builtIn: true } : {}),
}));

export const initialCareMessageSnapshots = [
  { id: "MSG-20260726-001", scriptId: "WCS-CLEAR", templateSnapshot: "{子女称呼}，{城市}今天是晴天，气温{温度}，出门记得注意防晒。", renderedText: "阿强，伦敦今天是晴天，气温21℃，出门记得注意防晒。", weatherCode: "CLEAR", generatedAt: "2026-07-26 08:12" },
  { id: "MSG-20260727-002", scriptId: "WCS-RAIN", templateSnapshot: "{子女称呼}，{城市}今天有雨，气温{温度}，出门带好雨具，路上注意安全。", renderedText: "秀芳，悉尼今天有雨，气温17℃，出门带好雨具，路上注意安全。", weatherCode: "RAIN", generatedAt: "2026-07-27 09:05" },
];

const legacyCareScriptGroupMap = Object.freeze({
  SUNNY: "CLEAR", CLOUDY: "CLOUDY", OVERCAST: "CLOUDY", RAINY: "RAIN", HEAVY_RAIN: "HEAVY_RAIN",
  THUNDERSTORM: "THUNDER_HAIL", SEVERE_THUNDERSTORM: "THUNDER_HAIL", HAZE: "HAZE", MIST_FOG: "FOG",
  HOT: "HOT", COLD: "COLD", UNKNOWN: "UNKNOWN",
});

export const careScriptMockApi = {
  hydrate(records) {
    const normalizedRecords = (Array.isArray(records) ? records : initialCareScripts).reduce((result, record) => {
      const weatherCode = legacyCareScriptGroupMap[record.weatherCode] || record.weatherCode;
      if (weatherCode === "WINDY" || result.some((item) => item.weatherCode === weatherCode)) return result;
      const group = weatherConditionCatalog.find((item) => item.code === weatherCode);
      return [...result, { ...record, weatherCode, weatherName: group?.name || record.weatherName, version: record.version || 1 }];
    }, []);
    const mergedDefaults = initialCareScripts.map((defaultScript) => ({
      ...defaultScript,
      ...(this.getByCondition(normalizedRecords, defaultScript.weatherCode) || {}),
    }));
    const defaultCodes = new Set(initialCareScripts.map((item) => item.weatherCode));
    const additionalRecords = normalizedRecords.filter((record) => (
      !defaultCodes.has(record.weatherCode)
      && weatherConditionCatalog.some((condition) => condition.configurable && condition.code === record.weatherCode)
    ));
    return [...mergedDefaults, ...additionalRecords];
  },
  getByCondition(records, weatherCode) {
    return records.find((item) => item.weatherCode === weatherCode) || null;
  },
  renderTemplate(template, variables = {}) {
    return String(template || "").replace(/\{(老人称呼|子女称呼|城市|天气|温度)\}/g, (token, key) => variables[key] || token);
  },
  save(records, condition, input, operator = "赵亚男") {
    const normalizedRecords = records.map((item) => ({ ...item, version: item.version || 1 }));
    const current = this.getByCondition(normalizedRecords, condition.code);
    const next = {
      ...current,
      id: current?.id || `WCS-${condition.code}`,
      weatherCode: condition.code,
      weatherName: condition.name,
      template: input.template,
      status: input.status,
      updatedAt: "2026-07-27 11:20",
      operator,
      version: current ? (current.version || 1) + (current.template === input.template ? 0 : 1) : 1,
      historyCount: current?.historyCount || 0,
    };
    return current
      ? normalizedRecords.map((item) => item.weatherCode === condition.code ? next : item)
      : [...normalizedRecords, next];
  },
  createMessageSnapshot(script, renderedText, generatedAt) {
    return {
      scriptId: script.id,
      templateSnapshot: script.template,
      renderedText,
      weatherCode: script.weatherCode,
      generatedAt,
    };
  },
};

export const getWeatherLocationCompleteness = (location) => {
  if (!location) return 0;
  const fields = [location.countryCode, location.cityCode, Number.isFinite(location.latitude), Number.isFinite(location.longitude), location.timezone];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
};

export const formatWeatherLocation = (location) => {
  if (!location || !location.cityName) return "尚未设置天气位置";
  return [location.cityName, location.regionName, location.countryName].filter(Boolean).join(" · ");
};

export const weatherMockApi = {
  listLocations(records, filters = {}) {
    return records.filter((item) => (!filters.ownerType || item.ownerType === filters.ownerType) && (!filters.status || item.status === filters.status));
  },
  getLocation(records, ownerType, ownerId) {
    return records.find((item) => item.ownerType === ownerType && item.ownerId === ownerId && item.status !== "已失效")
      || records.find((item) => item.ownerType === ownerType && item.ownerId === ownerId)
      || null;
  },
  getWeatherQuery(queries, locationId) {
    return queries.find((item) => item.locationId === locationId) || null;
  },
  getAudits(audits, ownerType, ownerId) {
    return audits.filter((item) => item.ownerType === ownerType && item.ownerId === ownerId);
  },
  resolveSelection(countryCode, regionCode, cityCode) {
    const country = weatherLocationCatalog.find((item) => item.code === countryCode);
    const region = country?.regions.find((item) => item.code === regionCode);
    const city = region?.cities.find((item) => item.code === cityCode);
    return { country, region, city };
  },
  saveRelativeLocation(records, audits, ownerId, selection, operator = "赵亚男") {
    const { country, region, city } = selection;
    const current = this.getLocation(records, "亲属", ownerId);
    const now = "2026-07-27 10:30";
    const next = {
      id: current?.id || `LOC-R-${ownerId.replace("RU-", "")}`,
      ownerType: "亲属",
      ownerId,
      status: city ? "有效" : "待完善",
      countryCode: country?.code || "",
      countryName: country?.name || "",
      regionCode: region?.code || "",
      regionName: region?.name || "",
      cityCode: city?.code || "",
      cityName: city?.name || "",
      latitude: city?.latitude ?? null,
      longitude: city?.longitude ?? null,
      timezone: city?.timezone || "",
      source: "后台协助维护",
      sourceDetail: "运营人员根据亲属确认信息维护",
      updatedAt: now,
      syncStatus: city ? "同步成功" : "待同步",
      syncedAt: city ? now : "",
      invalidReason: city ? "" : "国家、行政区或城市未完整选择",
    };
    const nextRecords = current ? records.map((item) => item.id === current.id ? next : item) : [next, ...records];
    const audit = {
      id: `WA-${String(audits.length + 1).padStart(3, "0")}`,
      ownerType: "亲属",
      ownerId,
      action: "后台维护天气位置",
      before: formatWeatherLocation(current),
      after: formatWeatherLocation(next),
      source: "后台协助维护",
      operator,
      operatedAt: now,
      result: city ? "成功" : "待完善",
    };
    return { records: nextRecords, audits: [audit, ...audits], saved: next };
  },
};
