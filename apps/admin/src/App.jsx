import { useEffect, useMemo, useRef, useState } from "react";
import activityTaichiCover from "./activity-taichi.svg";
import activitySafetyCover from "./activity-safety.svg";
import activityMusicCover from "./activity-music.svg";
import activityHealthCover from "./activity-health.svg";
import {
  careScriptMockApi,
  formatWeatherLocation,
  getWeatherLocationCompleteness,
  initialCareScripts,
  initialWeatherLocationAudits,
  initialWeatherLocations,
  initialWeatherQueries,
  initialWeatherRegionIntegrations,
  weatherLocationCatalog,
  weatherConditionCatalog,
  weatherMockApi,
} from "./weatherMock";
import {
  Activity,
  AlertTriangle,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  CloudSun,
  ClipboardList,
  FileClock,
  HeartHandshake,
  Home,
  Images,
  LayoutDashboard,
  Menu,
  MonitorSmartphone,
  MapPin,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

const menuGroups = [
  { label: "工作台", items: [{ key: "overview", label: "运营概览", icon: LayoutDashboard }] },
  {
    label: "老人服务",
    items: [
      { key: "elderly", label: "老人档案", icon: Users },
      { key: "relations", label: "亲属档案", icon: HeartHandshake },
      { key: "reminders", label: "提醒事项", icon: Bell },
      { key: "emergencyHelp", label: "紧急求助", icon: AlertTriangle },
      { key: "familyAlbums", label: "家庭相册", icon: Images },
    ],
  },
  {
    label: "运营内容",
    items: [
      { key: "recommendations", label: "推荐策略", icon: Sparkles },
      { key: "safety", label: "安全资讯", icon: ShieldCheck },
      { key: "activities", label: "社区活动", icon: CalendarDays },
      { key: "services", label: "预约服务", icon: ClipboardList },
    ],
  },
  {
    label: "设备与数据",
    items: [
      { key: "devices", label: "设备管理", icon: MonitorSmartphone, children: [
        { key: "tabletDevices", label: "平板设备" },
        { key: "sensorDevices", label: "房间活动传感器" },
      ] },
      { key: "activity", label: "房间活动", icon: Activity },
      { key: "weatherLocations", label: "天气位置", icon: CloudSun },
      { key: "careScripts", label: "关怀话术", icon: MessageSquareText },
    ],
  },
  {
    label: "系统管理",
    items: [
      { key: "projects", label: "项目与社区", icon: Building2 },
      { key: "accounts", label: "账号与角色", icon: CircleUserRound },
      { key: "logs", label: "操作日志", icon: FileClock },
      { key: "settings", label: "基础配置", icon: Settings },
    ],
  },
];

const availableMenuKeys = new Set(menuGroups.flatMap((group) => group.items.flatMap((item) => [item.key, ...(item.children || []).map((child) => child.key)])));

const pageMeta = {
  elderly: { title: "老人档案", description: "维护老人基础资料、所属项目与服务关系", add: "新增老人" },
  relations: { title: "亲属档案", description: "查看所有手机号注册用户及其关联的老人", add: "新增联系人" },
  reminders: { title: "提醒事项", description: "维护用药提醒和日常提醒定义，并查看后台详细计划", add: "新建提醒" },
  emergencyHelp: { title: "紧急求助", description: "跟进老人发起的紧急求助、通知送达与事件处理结果", add: "" },
  familyAlbums: { title: "家庭相册", description: "管理照片与视频批次，查看同步、首次查看和喜欢状态", add: "" },
  recommendations: { title: "推荐策略", description: "维护老人端每日推荐内容及自动轮播规则", add: "新增推荐策略" },
  safety: { title: "安全资讯", description: "发布诈骗提醒、家居安全与社区公告", add: "发布资讯" },
  activities: { title: "社区活动", description: "发布活动并跟踪老人参与意向与触达结果", add: "发布活动" },
  services: { title: "预约服务", description: "查看并处理老人通过中控屏提交的上门服务预约", add: "" },
  tabletDevices: { title: "平板设备", description: "维护平板资产、老人绑定、激活和在线状态", add: "录入平板" },
  sensorDevices: { title: "房间活动传感器", description: "录入传感器、绑定老人和房间并完成安装校验", add: "添加传感器" },
  activity: { title: "房间活动", description: "查看房间停留、最近活动与设备数据可信度", add: "导出数据" },
  weatherLocations: { title: "天气位置", description: "按国家和地区查看天气接口接入与技术诊断状态", add: "" },
  careScripts: { title: "关怀话术", description: "按天气情况维护老人端可匹配展示的一条关怀话术", add: "" },
  projects: { title: "项目与社区", description: "维护老人档案可选择的服务项目和所属社区", add: "新增项目" },
  accounts: { title: "账号与角色", description: "维护后台账号、角色权限与数据范围", add: "新增账号" },
  logs: { title: "操作日志", description: "追溯关键业务操作、结果与责任边界", add: "导出日志" },
  settings: { title: "基础配置", description: "维护字典、标签、内容分类和业务参数", add: "新增配置" },
};

const elderlyRows = [
  {
    name: "陈美玲", id: "SG-E-000128", gender: "女", birthday: "1950-03-18", age: 76,
    phone: "+65 9123 6208", project: "红山社区养老计划", community: "红山社区",
    address: "12 Bukit Merah View #08-31", rooms: ["客厅", "卧室", "厨房"], tags: ["独居", "高龄"],
    family: 2, device: "3 / 3 在线", advisor: "林佳慧", status: "服务中", attention: "正常",
    emergency: { name: "陈伟强", relation: "儿子", phone: "+65 9881 2036" }, updatedAt: "2026-07-16 10:24",
  },
  {
    name: "黄国强", id: "SG-E-000127", gender: "男", birthday: "1945-11-02", age: 81,
    phone: "+65 9018 3321", project: "大巴窑关怀中心", community: "大巴窑社区",
    address: "85 Lorong 4 Toa Payoh #06-112", rooms: ["客厅", "卧室", "厨房"], tags: ["独居", "设备关注"],
    family: 1, device: "2 / 3 在线", advisor: "未开通", status: "服务中", attention: "设备离线",
    emergency: { name: "黄丽芬", relation: "女儿", phone: "+65 9766 4102" }, updatedAt: "2026-07-16 09:42",
  },
  {
    name: "林秀英", id: "SG-E-000126", gender: "女", birthday: "1953-05-26", age: 73,
    phone: "+65 8890 7136", project: "女皇镇乐龄中心", community: "女皇镇社区",
    address: "46 Commonwealth Drive #10-127", rooms: ["客厅", "主卧", "厨房", "卫生间"], tags: ["慢病关注", "用药提醒"],
    family: 3, device: "4 / 4 在线", advisor: "张文杰", status: "服务中", attention: "提醒未完成",
    emergency: { name: "林志明", relation: "儿子", phone: "+65 9332 5771" }, updatedAt: "2026-07-15 18:06",
  },
  {
    name: "王德昌", id: "SG-E-000125", gender: "男", birthday: "1947-08-14", age: 79,
    phone: "", project: "红山社区养老计划", community: "红山社区",
    address: "待补充", rooms: [], tags: ["资料待补"],
    family: 2, device: "待安装", advisor: "林佳慧", status: "待开通", attention: "资料待补充",
    emergency: { name: "", relation: "", phone: "" }, updatedAt: "2026-07-15 14:18",
  },
  {
    name: "李玉珍", id: "SG-E-000124", gender: "女", birthday: "1942-01-09", age: 84,
    phone: "+65 8227 1645", project: "宏茂桥活跃乐龄中心", community: "宏茂桥社区",
    address: "305 Ang Mo Kio Avenue 1 #11-1161", rooms: ["客厅", "卧室", "厨房"], tags: ["高龄", "家庭同住"],
    family: 1, device: "3 / 3 在线", advisor: "未开通", status: "服务中", attention: "正常",
    emergency: { name: "李惠珍", relation: "女儿", phone: "+65 9188 0427" }, updatedAt: "2026-07-14 16:35",
  },
  {
    name: "周阿顺", id: "SG-E-000123", gender: "男", birthday: "1949-06-30", age: 77,
    phone: "+65 8660 2941", project: "大巴窑关怀中心", community: "大巴窑社区",
    address: "123 Lorong 1 Toa Payoh #04-308", rooms: ["客厅", "卧室", "玄关"], tags: ["待回访"],
    family: 2, device: "3 / 3 在线", advisor: "张文杰", status: "服务中", attention: "待回访",
    emergency: { name: "周慧敏", relation: "女儿", phone: "+65 9712 8560" }, updatedAt: "2026-07-12 11:20",
  },
];

const relativeAccounts = [
  { id: "RU-00031", name: "陈伟强", phone: "+65 9881 2036", status: "正常", registeredAt: "2026-06-18 09:42", lastActive: "今天 10:26", links: [{ elderlyId: "SG-E-000128", relation: "儿子" }] },
  { id: "RU-00030", name: "黄丽芬", phone: "+65 9766 4102", status: "正常", registeredAt: "2026-06-20 14:18", lastActive: "今天 09:35", links: [{ elderlyId: "SG-E-000127", relation: "女儿" }] },
  { id: "RU-00029", name: "林志明", phone: "+65 9332 5771", status: "正常", registeredAt: "2026-06-22 18:06", lastActive: "昨天 21:12", links: [{ elderlyId: "SG-E-000126", relation: "儿子" }, { elderlyId: "SG-E-000124", relation: "外甥" }] },
  { id: "RU-00028", name: "李惠珍", phone: "+65 9188 0427", status: "正常", registeredAt: "2026-06-25 11:20", lastActive: "今天 08:16", links: [{ elderlyId: "SG-E-000124", relation: "女儿" }] },
  { id: "RU-00027", name: "周慧敏", phone: "+65 9712 8560", status: "正常", registeredAt: "2026-07-01 16:38", lastActive: "07-16 19:40", links: [{ elderlyId: "SG-E-000123", relation: "女儿" }] },
  { id: "RU-00026", name: "王建国", phone: "+65 8603 2918", status: "正常", registeredAt: "2026-07-12 10:05", lastActive: "今天 11:02", links: [] },
  { id: "RU-00025", name: "赵雅雯", phone: "+65 8156 7702", status: "正常", registeredAt: "2026-07-15 15:26", lastActive: "尚未登录", links: [] },
];

const initialProjects = [
  { id: "PRJ-001", name: "红山社区养老计划", community: "红山社区", country: "新加坡", city: "新加坡", district: "Bukit Merah", address: "12 Bukit Merah View", timezone: "Asia/Singapore (UTC+8)", contact: "王淑芬", phone: "+65 6123 8801", status: "启用" },
  { id: "PRJ-002", name: "大巴窑关怀中心", community: "大巴窑社区", country: "新加坡", city: "新加坡", district: "Toa Payoh", address: "85 Lorong 4 Toa Payoh", timezone: "Asia/Singapore (UTC+8)", contact: "陈志伟", phone: "+65 6258 1902", status: "启用" },
  { id: "PRJ-003", name: "女皇镇乐龄中心", community: "女皇镇社区", country: "新加坡", city: "新加坡", district: "Queenstown", address: "46 Commonwealth Drive", timezone: "Asia/Singapore (UTC+8)", contact: "林美芳", phone: "+65 6472 3306", status: "启用" },
  { id: "PRJ-004", name: "宏茂桥活跃乐龄中心", community: "宏茂桥社区", country: "新加坡", city: "新加坡", district: "Ang Mo Kio", address: "305 Ang Mo Kio Avenue 1", timezone: "Asia/Singapore (UTC+8)", contact: "黄国民", phone: "+65 6456 9208", status: "启用" },
];

const initialSafetyNews = [
  { id: "SAF-001", title: "警惕冒充银行客服诈骗", category: "诈骗提醒", content: "近期出现冒充银行客服，以账户异常为由索取验证码的诈骗行为。请勿向陌生人提供银行卡信息、密码或短信验证码。", description: "银行工作人员不会通过电话索取密码或验证码。", cover: "", scope: "all", projectIds: [], status: "已发布", updatedAt: "2026-07-15 16:20" },
  { id: "SAF-002", title: "雨季居家防滑注意事项", category: "家居安全", content: "雨季地面容易湿滑，请及时擦干玄关、厨房和卫生间积水，穿着防滑鞋，并保持夜间照明充足。", description: "及时清理积水，重点检查卫生间和玄关。", cover: "", scope: "projects", projectIds: ["PRJ-001"], status: "已发布", updatedAt: "2026-07-14 09:10" },
  { id: "SAF-003", title: "社区维修工程通知", category: "社区公告", content: "大巴窑关怀中心公共区域将进行照明维护，施工期间请老人注意绕行，并听从现场工作人员指引。", description: "", cover: "", scope: "projects", projectIds: ["PRJ-002"], status: "已发布", updatedAt: "2026-07-16 11:05" },
  { id: "SAF-004", title: "陌生人上门服务核验指南", category: "生活安全", content: "如有陌生人自称维修、送货或社区工作人员上门，请先通过官方电话核验身份，不要让无法确认身份的人员进入住所。", description: "无法核验身份时，不开门、不转账，并联系亲属或项目人员。", cover: "", scope: "all", projectIds: [], status: "已发布", updatedAt: "2026-07-08 13:40" },
];

const initialServiceBookings = [
  { id: "RSV-20260726001", serviceId: "cleaning", serviceName: "家政保洁", category: "居家服务", elderlyId: "SG-E-000128", provider: "安心到家社区服务中心", slotId: "clean-tomorrow-am", slotLabel: "明天上午 09:00—11:00", status: "待确认", createdAt: "2026-07-26 09:18", source: "老人中控屏", operator: "", updatedAt: "2026-07-26 09:18" },
  { id: "RSV-20260726002", serviceId: "repair", serviceName: "上门维修", category: "居家服务", elderlyId: "SG-E-000127", provider: "社区便民维修站", slotId: "repair-tomorrow-pm", slotLabel: "明天下午 14:00—16:00", status: "已确认", createdAt: "2026-07-26 08:42", source: "老人中控屏", operator: "赵亚男", updatedAt: "2026-07-26 09:05" },
  { id: "RSV-20260725003", serviceId: "medical-companion", serviceName: "陪诊服务", category: "健康服务", elderlyId: "SG-E-000126", provider: "社区健康管家中心", slotId: "medical-tomorrow-am", slotLabel: "明天上午 07:30—12:00", status: "服务中", createdAt: "2026-07-25 16:20", source: "老人中控屏", operator: "张文杰", updatedAt: "2026-07-26 07:25" },
  { id: "RSV-20260724004", serviceId: "care", serviceName: "助老生活照护", category: "照护服务", elderlyId: "SG-E-000124", provider: "社区综合助老服务站", slotId: "care-tomorrow-pm", slotLabel: "明天下午 14:30—16:30", status: "已完成", createdAt: "2026-07-24 11:08", source: "老人中控屏", operator: "赵亚男", updatedAt: "2026-07-25 16:45" },
  { id: "RSV-20260724005", serviceId: "cleaning", serviceName: "家政保洁", category: "居家服务", elderlyId: "SG-E-000123", provider: "安心到家社区服务中心", slotId: "clean-after-am", slotLabel: "后天上午 09:00—11:00", status: "已取消", createdAt: "2026-07-24 10:16", source: "老人中控屏", operator: "老人本人", updatedAt: "2026-07-24 10:28" },
];

const initialServiceCatalog = [
  { id: "SRV-001", name: "家政保洁", category: "居家服务", provider: "安心到家社区服务中心", description: "提供日常居家清洁、地面清洁和基础整理服务。", slots: ["明天上午 09:00—11:00", "明天下午 14:00—16:00", "后天上午 09:00—11:00"], status: "启用", updatedAt: "2026-07-24 10:20" },
  { id: "SRV-002", name: "上门维修", category: "居家服务", provider: "社区便民维修站", description: "提供水电、门锁及常用居家设施的上门检查和维修。", slots: ["明天上午 10:00—12:00", "明天下午 14:00—16:00"], status: "启用", updatedAt: "2026-07-23 16:45" },
  { id: "SRV-003", name: "陪诊服务", category: "健康服务", provider: "社区健康管家中心", description: "协助老人就医报到、院内陪同及返程联系。", slots: ["明天上午 07:30—12:00", "后天上午 07:30—12:00"], status: "启用", updatedAt: "2026-07-22 09:18" },
  { id: "SRV-004", name: "助老生活照护", category: "照护服务", provider: "社区综合助老服务站", description: "提供生活协助、简单照护和日常陪伴。", slots: ["明天上午 09:30—11:30", "明天下午 14:30—16:30"], status: "启用", updatedAt: "2026-07-21 14:06" },
];

const initialTabletDevices = [
  { id: "TAB-SG-20260031", sn: "SN-TAB-260031", model: "U2G Home 14", currentVersion: "v2.5.3", versionStatus: "待更新", activationCode: "583104", activationMethod: "激活码", operator: "赵亚男", status: "在线", boundElderlyId: "SG-E-000128", boundAt: "2026-07-02 10:18", lastOnline: "2 分钟前" },
  { id: "TAB-SG-20260030", sn: "SN-TAB-260030", model: "U2G Home 14", currentVersion: "v2.6.0", versionStatus: "已最新", activationCode: "271946", activationMethod: "二维码", operator: "张文杰", status: "在线", boundElderlyId: "SG-E-000126", boundAt: "2026-06-28 15:40", lastOnline: "5 分钟前" },
  { id: "TAB-SG-20260029", sn: "SN-TAB-260029", model: "U2G Home 14", currentVersion: "v2.4.8", versionStatus: "待更新", activationCode: "806315", activationMethod: "激活码", operator: "赵亚男", status: "离线", boundElderlyId: "SG-E-000127", boundAt: "2026-06-25 09:32", lastOnline: "4 小时前" },
  { id: "TAB-SG-20260032", sn: "SN-TAB-260032", model: "U2G Home 14", currentVersion: "v2.6.0", versionStatus: "已最新", activationCode: "", activationMethod: "", operator: "", status: "待激活", boundElderlyId: null, boundAt: "", lastOnline: "尚未激活" },
  { id: "TAB-SG-20260033", sn: "SN-TAB-260033", model: "U2G Home 14", currentVersion: "v2.6.0", versionStatus: "已最新", activationCode: "", activationMethod: "", operator: "", status: "待激活", boundElderlyId: null, boundAt: "", lastOnline: "尚未激活" },
];

const initialActivationRecords = [
  { id: "ACT-DEMO-001", code: "318642", elderlyId: "SG-E-000125", deviceId: "TAB-SG-20260033", deviceSn: "SN-TAB-260033", status: "激活失败", method: "6位激活码", createdAt: "2026-07-27 15:20", operator: "赵亚男" },
];

const initialFamilyInvitations = [
  { id: "FINV-001", elderlyId: "SG-E-000128", deviceId: "TAB-SG-20260031", deviceSn: "SN-TAB-260031", code: "736521", generatedAt: "2026-07-28 10:10", expiresAt: "2026-07-28 10:40", status: "有效", boundCount: 0 },
  { id: "FINV-002", elderlyId: "SG-E-000128", deviceId: "TAB-SG-20260031", deviceSn: "SN-TAB-260031", code: "284913", generatedAt: "2026-07-26 18:06", expiresAt: "2026-07-26 18:36", status: "已被新邀请替换", boundCount: 1 },
  { id: "FINV-003", elderlyId: "SG-E-000128", deviceId: "TAB-SG-20260031", deviceSn: "SN-TAB-260031", code: "592804", generatedAt: "2026-07-20 09:22", expiresAt: "2026-07-20 09:52", status: "老人端已结束", boundCount: 2 },
  { id: "FINV-004", elderlyId: "SG-E-000127", deviceId: "TAB-SG-20260029", deviceSn: "SN-TAB-260029", code: "168305", generatedAt: "2026-07-27 14:05", expiresAt: "2026-07-27 14:35", status: "已过期", boundCount: 0 },
  { id: "FINV-005", elderlyId: "SG-E-000126", deviceId: "TAB-SG-20260030", deviceSn: "SN-TAB-260030", code: "940217", generatedAt: "2026-07-25 11:30", expiresAt: "2026-07-25 12:00", status: "后台已作废", boundCount: 0 },
];

const initialFamilyRelations = [
  { id: "FREL-001", elderlyId: "SG-E-000128", name: "陈伟强", phone: "+65 9881 2036", relation: "儿子", boundAt: "2026-07-20 09:28", status: "正常" },
  { id: "FREL-002", elderlyId: "SG-E-000128", name: "陈丽华", phone: "+65 9336 1842", relation: "女儿", boundAt: "2026-07-26 18:12", status: "正常" },
  { id: "FREL-003", elderlyId: "SG-E-000127", name: "黄丽芳", phone: "+65 9766 4102", relation: "女儿", boundAt: "2026-07-12 16:40", status: "正常" },
  { id: "FREL-004", elderlyId: "SG-E-000126", name: "林志明", phone: "+65 9332 5771", relation: "儿子", boundAt: "2026-07-08 11:05", status: "正常" },
  { id: "FREL-005", elderlyId: "SG-E-000128", name: "陈美芳", phone: "+65 8123 6640", relation: "侄女", boundAt: "2026-06-18 14:22", status: "已解除" },
];

const initialSensorDevices = [
  { id: "SEN-SG-000031", sn: "SN-A20-88931", name: "客厅活动感知器", model: "U2G Motion S1", elderlyId: "SG-E-000128", room: "客厅", installStatus: "已安装", onlineStatus: "在线", lastReport: "2 分钟前", lastActivity: "今天 10:42", signal: "良好", installer: "赵亚男", installedAt: "2026-07-02 11:05" },
  { id: "SEN-SG-000032", sn: "SN-A20-88932", name: "卧室活动感知器", model: "U2G Motion S1", elderlyId: "SG-E-000128", room: "卧室", installStatus: "已安装", onlineStatus: "在线", lastReport: "6 分钟前", lastActivity: "今天 10:31", signal: "良好", installer: "赵亚男", installedAt: "2026-07-02 11:18" },
  { id: "SEN-SG-000033", sn: "SN-A20-88933", name: "厨房活动感知器", model: "U2G Motion S1", elderlyId: "SG-E-000128", room: "厨房", installStatus: "已安装", onlineStatus: "在线", lastReport: "9 分钟前", lastActivity: "今天 10:28", signal: "良好", installer: "赵亚男", installedAt: "2026-07-02 11:32" },
  { id: "SEN-SG-000027", sn: "SN-A18-77302", name: "客厅活动感知器", model: "U2G Motion S1", elderlyId: "SG-E-000127", room: "客厅", installStatus: "已安装", onlineStatus: "在线", lastReport: "4 分钟前", lastActivity: "今天 10:36", signal: "良好", installer: "陈志伟", installedAt: "2026-06-25 10:10" },
  { id: "SEN-SG-000028", sn: "SN-A18-77303", name: "卧室活动感知器", model: "U2G Motion S1", elderlyId: "SG-E-000127", room: "卧室", installStatus: "已安装", onlineStatus: "在线", lastReport: "11 分钟前", lastActivity: "今天 10:22", signal: "一般", installer: "陈志伟", installedAt: "2026-06-25 10:24" },
  { id: "SEN-SG-000029", sn: "SN-A18-77304", name: "厨房活动感知器", model: "U2G Motion S1", elderlyId: "SG-E-000127", room: "厨房", installStatus: "已安装", onlineStatus: "离线", lastReport: "4 小时前", lastActivity: "今天 06:18", signal: "未连接", installer: "陈志伟", installedAt: "2026-06-25 10:38" },
  { id: "SEN-SG-000021", sn: "SN-A22-93010", name: "客厅活动感知器", model: "U2G Motion S2", elderlyId: "SG-E-000126", room: "客厅", installStatus: "已安装", onlineStatus: "在线", lastReport: "1 分钟前", lastActivity: "今天 10:44", signal: "良好", installer: "张文杰", installedAt: "2026-06-28 16:15" },
  { id: "SEN-SG-000022", sn: "SN-A22-93011", name: "主卧活动感知器", model: "U2G Motion S2", elderlyId: "SG-E-000126", room: "主卧", installStatus: "已安装", onlineStatus: "在线", lastReport: "7 分钟前", lastActivity: "今天 10:33", signal: "良好", installer: "张文杰", installedAt: "2026-06-28 16:28" },
];

const dailyRoomActivity = {
  "SG-E-000128": [
    { room: "卧室", start: "06:42", end: "07:15" },
    { room: "厨房", start: "07:24", end: "07:46" },
    { room: "客厅", start: "08:03", end: "09:18" },
    { room: "卧室", start: "09:32", end: "09:51" },
    { room: "厨房", start: "10:12", end: "10:29" },
    { room: "客厅", start: "10:34", end: "10:47" },
    { room: "客厅", start: "12:16", end: "13:08" },
    { room: "卧室", start: "14:22", end: "15:06" },
  ],
  "SG-E-000127": [
    { room: "卧室", start: "07:08", end: "07:42" },
    { room: "客厅", start: "08:01", end: "09:36" },
    { room: "厨房", start: "10:05", end: "10:28" },
    { room: "客厅", start: "12:10", end: "13:22" },
    { room: "卧室", start: "14:18", end: "15:02" },
    { room: "客厅", start: "16:14", end: "17:45" },
  ],
  "SG-E-000126": [
    { room: "主卧", start: "06:26", end: "07:04" },
    { room: "厨房", start: "07:18", end: "07:51" },
    { room: "客厅", start: "08:12", end: "10:06" },
    { room: "主卧", start: "11:34", end: "12:16" },
    { room: "客厅", start: "14:02", end: "16:28" },
  ],
};

const initialGlobalInactivityRule = { enabled: true, thresholdHours: 3, startTime: "08:00", endTime: "22:00" };
const defaultInactivityState = { status: "当前正常", history: [] };

const initialInactivityRules = {
  "SG-E-000128": {
    enabled: true, thresholdHours: 3, startTime: "08:00", endTime: "22:00", status: "当前正常",
    history: [{ id: "IR-0001", triggeredAt: "2026-07-16 18:24", lastActivity: "客厅 · 15:20", duration: "3 小时 04 分", status: "已恢复", recoveredAt: "18:42" }],
  },
  "SG-E-000127": {
    enabled: true, thresholdHours: 3, startTime: "08:00", endTime: "22:00", status: "待关注",
    history: [{ id: "IR-0002", triggeredAt: "今天 14:36", lastActivity: "卧室 · 11:31", duration: "3 小时 05 分", status: "待关注", recoveredAt: "—" }],
  },
};

const initialReminders = [
  { id: "REM-000101", elderlyId: "SG-E-000128", type: "用药提醒", title: "早间降压药", date: "2026-07-30", time: "08:00", repeat: "每天", note: "早餐后服用 1 片", createdBy: "赵亚男", createdAt: "2026-07-18 10:24", updatedBy: "赵亚男", updatedAt: "2026-07-28 16:10", occurrences: [{ id: "OCC-101-01", date: "2026-07-29", time: "08:00", status: "已完成", resultAt: "2026-07-29 08:12" }, { id: "OCC-101-02", date: "2026-07-30", time: "08:00", status: "未到时间", resultAt: "—" }] },
  { id: "REM-000102", elderlyId: "SG-E-000126", type: "日常提醒", title: "社区体检", date: "2026-07-29", time: "09:30", repeat: "仅一次", note: "携带身份证和既往病历", createdBy: "张文杰", createdAt: "2026-07-20 15:16", updatedBy: "张文杰", updatedAt: "2026-07-20 15:16", deleteFailureOnce: true, occurrences: [{ id: "OCC-102-01", date: "2026-07-29", time: "09:30", status: "待完成", resultAt: "—" }] },
  { id: "REM-000103", elderlyId: "SG-E-000127", type: "用药提醒", title: "晚间用药", date: "2026-07-28", time: "20:00", repeat: "每天", note: "睡前服用", createdBy: "赵亚男", createdAt: "2026-07-21 09:42", updatedBy: "赵亚男", updatedAt: "2026-07-27 09:20", occurrences: [{ id: "OCC-103-01", date: "2026-07-27", time: "20:00", status: "未确认", resultAt: "—" }, { id: "OCC-103-02", date: "2026-07-28", time: "20:00", status: "已过期", resultAt: "—" }] },
  { id: "REM-000104", elderlyId: "SG-E-000124", type: "日常提醒", title: "与女儿视频通话", date: "2026-07-31", time: "19:00", repeat: "每周四", note: "每周四视频通话", createdBy: "赵亚男", createdAt: "2026-07-22 11:08", updatedBy: "赵亚男", updatedAt: "2026-07-22 11:08", occurrences: [{ id: "OCC-104-01", date: "2026-07-31", time: "19:00", status: "未到时间", resultAt: "—" }] },
];

const initialEmergencyHelpEvents = [
  {
    id: "SOS-20260728001", elderlyId: "SG-E-000128", startedAt: "2026-07-28 09:42:18", sourceDevice: "客厅平板", sourceDeviceId: "TAB-SG-20260031",
    status: "进行中", result: "部分通知失败", endedAt: "", endReason: "", endNote: "", endedBy: "",
    notifications: [
      { id: "SOS-N-001", recipientType: "紧急联系人", name: "陈伟强", relation: "儿子", phone: "+65 9881 2036", deliveryStatus: "已送达", viewedAt: "2026-07-28 09:43:05", retryCount: 0, failureReason: "", lastAttemptAt: "2026-07-28 09:42:26" },
      { id: "SOS-N-002", recipientType: "紧急联系人", name: "陈丽华", relation: "女儿", phone: "+65 8123 7701", deliveryStatus: "发送失败", viewedAt: "", retryCount: 2, failureReason: "号码暂时无法接通", lastAttemptAt: "2026-07-28 09:44:12" },
      { id: "SOS-N-003", recipientType: "子女", name: "陈伟强", relation: "儿子", phone: "+65 9881 2036", deliveryStatus: "已送达", viewedAt: "2026-07-28 09:43:05", retryCount: 0, failureReason: "", lastAttemptAt: "2026-07-28 09:42:27" },
    ],
    timeline: [
      { time: "09:42:18", title: "老人发起紧急求助", detail: "由客厅平板长按求助按钮发起" },
      { time: "09:42:26", title: "通知任务已创建", detail: "向 2 位紧急联系人和 1 位已绑定子女发送通知" },
      { time: "09:44:12", title: "部分通知发送失败", detail: "陈丽华已自动重试 2 次，号码暂时无法接通" },
    ],
  },
  {
    id: "SOS-20260728002", elderlyId: "SG-E-000127", startedAt: "2026-07-28 08:16:42", sourceDevice: "卧室求助按钮", sourceDeviceId: "SOS-BTN-00027",
    status: "进行中", result: "等待处理", endedAt: "", endReason: "", endNote: "", endedBy: "",
    notifications: [
      { id: "SOS-N-004", recipientType: "紧急联系人", name: "黄丽芬", relation: "女儿", phone: "+65 9766 4102", deliveryStatus: "已送达", viewedAt: "2026-07-28 08:18:03", retryCount: 0, failureReason: "", lastAttemptAt: "2026-07-28 08:16:49" },
      { id: "SOS-N-005", recipientType: "子女", name: "黄丽芬", relation: "女儿", phone: "+65 9766 4102", deliveryStatus: "已送达", viewedAt: "2026-07-28 08:18:03", retryCount: 0, failureReason: "", lastAttemptAt: "2026-07-28 08:16:50" },
    ],
    timeline: [
      { time: "08:16:42", title: "老人发起紧急求助", detail: "由卧室求助按钮发起" },
      { time: "08:16:50", title: "通知已全部送达", detail: "紧急联系人和已绑定子女均已收到通知" },
      { time: "08:18:03", title: "子女已查看", detail: "黄丽芬已打开求助详情" },
    ],
  },
  {
    id: "SOS-20260728003", elderlyId: "SG-E-000126", startedAt: "2026-07-28 07:35:10", sourceDevice: "客厅平板", sourceDeviceId: "TAB-SG-20260030",
    status: "已结束", result: "误触已结束", endedAt: "2026-07-28 07:41:28", endReason: "老人误触", endNote: "电话联系老人确认安全，无需进一步处理。", endedBy: "赵亚男",
    notifications: [
      { id: "SOS-N-006", recipientType: "紧急联系人", name: "林志明", relation: "儿子", phone: "+65 9332 5771", deliveryStatus: "已送达", viewedAt: "2026-07-28 07:37:16", retryCount: 0, failureReason: "", lastAttemptAt: "2026-07-28 07:35:18" },
      { id: "SOS-N-007", recipientType: "子女", name: "林志明", relation: "儿子", phone: "+65 9332 5771", deliveryStatus: "已送达", viewedAt: "2026-07-28 07:37:16", retryCount: 0, failureReason: "", lastAttemptAt: "2026-07-28 07:35:19" },
    ],
    timeline: [
      { time: "07:35:10", title: "老人发起紧急求助", detail: "由客厅平板长按求助按钮发起" },
      { time: "07:37:16", title: "子女已查看", detail: "林志明已打开求助详情" },
      { time: "07:41:28", title: "事件已结束", detail: "赵亚男确认原因为老人误触" },
    ],
  },
  {
    id: "SOS-20260727004", elderlyId: "SG-E-000124", startedAt: "2026-07-27 19:22:06", sourceDevice: "客厅平板", sourceDeviceId: "TAB-SG-20260032",
    status: "已结束", result: "已结束", endedAt: "2026-07-27 19:46:35", endReason: "家属已接手", endNote: "女儿已到达老人住所并继续陪同。", endedBy: "张文杰",
    notifications: [
      { id: "SOS-N-008", recipientType: "紧急联系人", name: "李惠珍", relation: "女儿", phone: "+65 9188 0427", deliveryStatus: "已送达", viewedAt: "2026-07-27 19:23:44", retryCount: 0, failureReason: "", lastAttemptAt: "2026-07-27 19:22:14" },
      { id: "SOS-N-009", recipientType: "子女", name: "李惠珍", relation: "女儿", phone: "+65 9188 0427", deliveryStatus: "已送达", viewedAt: "2026-07-27 19:23:44", retryCount: 0, failureReason: "", lastAttemptAt: "2026-07-27 19:22:15" },
    ],
    timeline: [
      { time: "19:22:06", title: "老人发起紧急求助", detail: "由客厅平板长按求助按钮发起" },
      { time: "19:23:44", title: "子女已查看", detail: "李惠珍已打开求助详情" },
      { time: "19:46:35", title: "事件已结束", detail: "家属已到达并接手处理" },
    ],
  },
];

const initialCommunityActivities = [
  { id: "ACT-001", title: "乐龄太极体验课", category: "健康活动", date: "2026-07-19", time: "09:00", location: "红山民众俱乐部", description: "专业老师带领适合长者的舒缓太极练习。", cover: activityTaichiCover, interestCount: 42, status: "报名中", publishedAt: "2026-07-16 10:30" },
  { id: "ACT-002", title: "防诈骗分享会", category: "安全讲座", date: "2026-07-20", time: "14:30", location: "大巴窑关怀中心", description: "结合近期案例讲解常见诈骗手法和核验方式。", cover: activitySafetyCover, interestCount: 28, status: "报名中", publishedAt: "2026-07-15 15:20" },
  { id: "ACT-003", title: "怀旧金曲下午茶", category: "兴趣活动", date: "2026-07-22", time: "15:00", location: "女皇镇乐龄中心", description: "欣赏怀旧金曲，与社区朋友轻松交流。", cover: activityMusicCover, interestCount: 36, status: "已发布", publishedAt: "2026-07-14 09:45" },
  { id: "ACT-004", title: "营养健康咨询日", category: "健康活动", date: "2026-07-12", time: "10:00", location: "宏茂桥活跃乐龄中心", description: "提供日常饮食与营养搭配咨询。", cover: activityHealthCover, interestCount: 51, status: "已结束", publishedAt: "2026-07-08 11:10" },
];

const initialActivityRegistrations = [
  { id: "REG-001", activityId: "ACT-001", elderlyId: "SG-E-000128", registeredAt: "2026-07-16 11:05", status: "已报名" },
  { id: "REG-002", activityId: "ACT-001", elderlyId: "SG-E-000126", registeredAt: "2026-07-16 13:18", status: "已报名" },
  { id: "REG-003", activityId: "ACT-001", elderlyId: "SG-E-000124", registeredAt: "2026-07-17 08:42", status: "已报名" },
  { id: "REG-004", activityId: "ACT-001", elderlyId: "SG-E-000123", registeredAt: "2026-07-17 09:16", status: "已取消" },
  { id: "REG-005", activityId: "ACT-002", elderlyId: "SG-E-000127", registeredAt: "2026-07-15 16:08", status: "已报名" },
  { id: "REG-006", activityId: "ACT-002", elderlyId: "SG-E-000128", registeredAt: "2026-07-16 09:35", status: "已报名" },
  { id: "REG-007", activityId: "ACT-002", elderlyId: "SG-E-000125", registeredAt: "2026-07-16 14:22", status: "已报名" },
  { id: "REG-008", activityId: "ACT-003", elderlyId: "SG-E-000128", registeredAt: "2026-07-14 10:12", status: "已报名" },
  { id: "REG-009", activityId: "ACT-003", elderlyId: "SG-E-000127", registeredAt: "2026-07-14 11:26", status: "已报名" },
  { id: "REG-010", activityId: "ACT-003", elderlyId: "SG-E-000126", registeredAt: "2026-07-15 08:30", status: "已报名" },
  { id: "REG-011", activityId: "ACT-003", elderlyId: "SG-E-000124", registeredAt: "2026-07-15 15:44", status: "已报名" },
  { id: "REG-012", activityId: "ACT-003", elderlyId: "SG-E-000123", registeredAt: "2026-07-16 09:02", status: "已报名" },
  { id: "REG-013", activityId: "ACT-004", elderlyId: "SG-E-000128", registeredAt: "2026-07-09 09:20", status: "已签到" },
  { id: "REG-014", activityId: "ACT-004", elderlyId: "SG-E-000127", registeredAt: "2026-07-09 10:15", status: "已签到" },
  { id: "REG-015", activityId: "ACT-004", elderlyId: "SG-E-000126", registeredAt: "2026-07-10 14:06", status: "未签到" },
];

const initialAlbumCategories = [
  { id: "ALB-CAT-001", name: "家庭日常", description: "记录家人生活、聚餐和日常问候影像", sort: 1, status: "启用", updatedAt: "2026-07-26 16:20" },
  { id: "ALB-CAT-002", name: "节日团聚", description: "生日、节庆和家庭聚会照片或视频", sort: 2, status: "启用", updatedAt: "2026-07-25 11:08" },
  { id: "ALB-CAT-003", name: "旅行时光", description: "家人旅行、郊游和风景影像记录", sort: 3, status: "启用", updatedAt: "2026-07-24 09:36" },
  { id: "ALB-CAT-004", name: "成长记录", description: "孩子成长、毕业和重要纪念影像", sort: 4, status: "启用", updatedAt: "2026-07-22 14:12" },
  { id: "ALB-CAT-005", name: "其他", description: "暂未归入固定主题的家庭影像", sort: 99, status: "停用", updatedAt: "2026-07-20 10:15" },
];

const initialFamilyAlbumBatches = [
  { id: "BATCH-20260727-01", uploaderId: "RU-00031", elderlyId: "SG-E-000128", categoryId: "ALB-CAT-001", categoryNameSnapshot: "家庭日常", contentType: "照片和视频", photoCount: 4, videoCount: 2, hasMessage: true, uploadedAt: "2026-07-27 09:18", publishStatus: "已发布", syncStatus: "已同步", successCount: 6, failedCount: 0, lastSyncAt: "2026-07-27 09:19", syncError: "", firstViewedAt: "2026-07-27 09:42", likedMediaCount: 3, lastLikedAt: "2026-07-27 09:46", relationStatus: "有效" },
  { id: "BATCH-20260726-03", uploaderId: "RU-00030", elderlyId: "SG-E-000127", categoryId: "ALB-CAT-002", categoryNameSnapshot: "节日团聚", contentType: "仅视频", photoCount: 0, videoCount: 3, hasMessage: true, uploadedAt: "2026-07-26 20:36", publishStatus: "已发布", syncStatus: "同步失败", successCount: 0, failedCount: 3, lastSyncAt: "2026-07-26 20:38", syncError: "3 段视频同步失败，等待老人端网络恢复后重试", firstViewedAt: "", likedMediaCount: 0, lastLikedAt: "", relationStatus: "有效" },
  { id: "BATCH-20260726-05", uploaderId: "RU-00029", elderlyId: "SG-E-000126", categoryId: "ALB-CAT-003", categoryNameSnapshot: "旅行时光", contentType: "照片和视频", photoCount: 3, videoCount: 2, hasMessage: true, uploadedAt: "2026-07-26 16:10", publishStatus: "已发布", syncStatus: "部分失败", successCount: 4, failedCount: 1, lastSyncAt: "2026-07-26 16:12", syncError: "4 个影像同步成功，1 段视频同步失败", firstViewedAt: "2026-07-26 18:20", likedMediaCount: 1, lastLikedAt: "2026-07-26 18:24", relationStatus: "有效" },
  { id: "BATCH-20260725-02", uploaderId: "RU-00028", elderlyId: "SG-E-000124", categoryId: "ALB-CAT-004", categoryNameSnapshot: "成长记录", contentType: "仅照片", photoCount: 2, videoCount: 0, hasMessage: true, uploadedAt: "2026-07-25 18:22", publishStatus: "已发布", syncStatus: "同步中", successCount: 1, failedCount: 0, lastSyncAt: "2026-07-25 18:23", syncError: "", firstViewedAt: "", likedMediaCount: 0, lastLikedAt: "", relationStatus: "有效" },
  { id: "BATCH-20260724-04", uploaderId: "RU-00027", elderlyId: "SG-E-000123", categoryId: "ALB-CAT-001", categoryNameSnapshot: "家庭日常", contentType: "照片和视频", photoCount: 4, videoCount: 2, hasMessage: false, uploadedAt: "2026-07-24 11:06", publishStatus: "已撤回", syncStatus: "已撤回", successCount: 6, failedCount: 0, lastSyncAt: "2026-07-26 15:20", syncError: "", firstViewedAt: "2026-07-24 11:30", likedMediaCount: 4, lastLikedAt: "2026-07-24 11:31", relationStatus: "有效", withdrawnBy: "赵亚男", withdrawnAt: "2026-07-26 15:20", withdrawalReason: "子女反馈该批次重复上传" },
  { id: "BATCH-20260723-02", uploaderId: "RU-00029", elderlyId: "SG-E-000124", categoryId: "ALB-CAT-002", categoryNameSnapshot: "节日团聚", contentType: "仅照片", photoCount: 4, videoCount: 0, hasMessage: true, uploadedAt: "2026-07-23 21:15", publishStatus: "已发布", syncStatus: "已同步", successCount: 4, failedCount: 0, lastSyncAt: "2026-07-23 21:17", syncError: "", firstViewedAt: "2026-07-24 07:55", likedMediaCount: 0, lastLikedAt: "", relationStatus: "有效" },
  { id: "BATCH-20260722-01", uploaderId: "RU-00031", elderlyId: "SG-E-000128", categoryId: "ALB-CAT-003", categoryNameSnapshot: "旅行时光", contentType: "仅照片", photoCount: 3, videoCount: 0, hasMessage: true, uploadedAt: "2026-07-22 10:08", publishStatus: "发布失败", syncStatus: "未入队", successCount: 0, failedCount: 3, lastSyncAt: "—", syncError: "Mock 上传批次未完成，没有进入老人端同步队列", firstViewedAt: "", likedMediaCount: 0, lastLikedAt: "", relationStatus: "有效" },
];

const recommendationPools = [
  { key: "wellness", label: "安全资讯池", icon: "📰" },
  { key: "community", label: "社区活动池", icon: "🎈" },
  { key: "service", label: "预约服务池", icon: "🩺" },
];

const initialRecommendationPolicy = {
  mode: "random",
  repeatDays: 7,
  wellnessStart: "08:00",
  wellnessEnd: "11:00",
  communityStart: "09:00",
  communityEnd: "12:00",
  serviceStart: "09:00",
  serviceEnd: "17:00",
};

const initialRecommendationStrategies = [
  { id: "STR-001", pool: "wellness", resourceType: "safety", resourceId: "SAF-001", resourceName: "警惕冒充银行客服诈骗", title: "警惕冒充银行客服诈骗", status: "启用", pushCount: 12, lastPush: "2026-07-20 08:30" },
  { id: "STR-002", pool: "wellness", resourceType: "safety", resourceId: "SAF-002", resourceName: "雨季居家防滑注意事项", title: "雨季居家防滑注意事项", status: "启用", pushCount: 9, lastPush: "昨天 08:10" },
  { id: "STR-003", pool: "community", resourceType: "activity", resourceId: "ACT-001", resourceName: "乐龄太极体验课", title: "明早一起练太极", status: "启用", pushCount: 18, lastPush: "2026-07-22 10:00" },
  { id: "STR-004", pool: "community", resourceType: "activity", resourceId: "ACT-003", resourceName: "怀旧金曲下午茶", title: "怀旧金曲下午茶等您参加", status: "停用", pushCount: 5, lastPush: "2026-07-15 09:20" },
  { id: "STR-005", pool: "service", resourceType: "service", resourceId: "SRV-003", resourceName: "陪诊服务", title: "需要陪诊服务吗？", status: "启用", pushCount: 16, lastPush: "昨天 15:00" },
  { id: "STR-006", pool: "service", resourceType: "service", resourceId: "SRV-001", resourceName: "家政保洁", title: "预约一次居家清洁", status: "启用", pushCount: 7, lastPush: "2026-07-19 14:30" },
];

const genericRows = {
  safety: [
    ["警惕冒充银行客服诈骗", "诈骗提醒", "全部老人", "已发布", "92%", "2026-07-15 16:20"],
    ["雨季居家防滑注意事项", "家居安全", "红山社区", "已发布", "78%", "2026-07-14 09:10"],
    ["社区维修工程通知", "社区公告", "大巴窑关怀中心", "草稿", "—", "2026-07-16 11:05"],
    ["陌生人上门服务核验指南", "生活安全", "全部老人", "已撤回", "88%", "2026-07-08 13:40"],
  ],
  activities: initialCommunityActivities.map((activity) => [activity.title, activity.category, `${activity.date.slice(5)} ${activity.time}`, activity.location, `${activity.interestCount} 人`, activity.status]),
  devices: [
    ["客厅活动感知器", "SN-A20-88931", "陈美玲 / 客厅", "在线", "2 分钟前", "已校验"],
    ["卧室活动感知器", "SN-A20-88932", "陈美玲 / 卧室", "在线", "6 分钟前", "已校验"],
    ["厨房活动感知器", "SN-A18-77304", "黄国强 / 厨房", "离线", "4 小时前", "需检查"],
    ["玄关活动感知器", "SN-A22-93012", "王德昌 / 玄关", "待安装", "—", "待校验"],
  ],
};

const headersByPage = {
  safety: ["资讯标题", "分类", "发布对象", "状态", "已读率", "更新时间"],
  activities: ["活动名称", "分类", "活动时间", "地点", "意向人数", "状态"],
  devices: ["设备名称", "设备 SN", "绑定位置", "在线状态", "最近上报", "安装状态"],
};

function formatDisplayId(value) {
  return String(value || "").replace(/^SG-/, "").replace(/-SG-/g, "-");
}

function maskPhone(phone) {
  const value = String(phone || "").trim();
  if (!value) return "未提供";
  const parts = value.split(/\s+/);
  const countryCode = parts[0]?.startsWith("+") ? parts[0] : "";
  const digits = value.replace(/\D/g, "");
  return `${countryCode} **** ${digits.slice(-4)}`.trim();
}

function StatusTag({ children }) {
  const text = String(children);
  const tone = /正常|在线|服务中|已发布|已完成|已确认|已校验|已激活|已使用|已最新|已报名|已签到|报名中|启用|有效|同步成功|查询成功|成功|已送达|已查看|通知已全部送达/.test(text)
    ? "success"
    : /离线|未完成|未签到|需关注|待回访|停用|已取消|失败|已失效|已作废|已过期|已解除|不可查询|未入队/.test(text)
      ? "danger"
      : /待|草稿|暂停|检查|缓存|尚未查询|同步中|进行中|等待处理/.test(text)
        ? "warning"
        : "neutral";
  return <span className={`status-tag ${tone}`}>{children}</span>;
}

function Overview({ onNavigate, inactivityRule, inactivityStates, onEditInactivityRule }) {
  const pendingInactivity = Object.values(inactivityStates || {}).filter((item) => item.status === "待关注");
  const metrics = [
    ["服务中老人", "286", "较昨日 +3", Users],
    ["今日待处理", "18", "其中高优先级 4", ClipboardList],
    ["设备在线率", "96.8%", "9 台设备需检查", MonitorSmartphone],
    ["提醒完成率", "88.4%", "本周提升 2.6%", Bell],
  ];
  return (
    <>
      <div className="metric-grid">
        {metrics.map(([label, value, hint, Icon]) => (
          <div className="metric-card" key={label}>
            <div className="metric-icon"><Icon size={20} /></div>
            <div><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>
          </div>
        ))}
      </div>
      <section className="panel overview-inactivity-panel">
        <div className="panel-title"><div><h3>无活动轻提醒</h3><p>集中查看全部老人长时间无活动的待关注线索</p></div><div className="overview-inactivity-actions"><button className="secondary-button" onClick={onEditInactivityRule}><Settings size={15}/>设置全局规则</button><button className="text-button" onClick={() => onNavigate("reminders")}>查看提醒记录 <ChevronRight size={15}/></button></div></div>
        <div className="overview-inactivity-body"><div className="overview-inactivity-count"><span>当前待关注</span><b>{pendingInactivity.length}</b><small>位老人</small></div><div className="overview-inactivity-rule"><span>当前全局规则</span><b>{inactivityRule.enabled ? `连续 ${inactivityRule.thresholdHours} 小时无活动` : "规则已停用"}</b><small>{inactivityRule.enabled ? `${inactivityRule.startTime}–${inactivityRule.endTime} · 仅后台提醒` : "停用期间不生成新的无活动提醒"}</small></div><div className="overview-inactivity-latest"><span>最近待关注</span>{pendingInactivity.length ? <><b>黄国强 · 3 小时 05 分无活动</b><small>最后活动：卧室 · 今天 11:31</small></> : <><b>当前没有待关注老人</b><small>所有活动状态正常</small></>}</div><StatusTag>{inactivityRule.enabled ? "全局已启用" : "全局已停用"}</StatusTag></div>
      </section>
      <div className="overview-grid">
        <section className="panel attention-panel">
          <div className="panel-title"><div><h3>今日需关注</h3><p>按优先级汇总异常线索与待办</p></div></div>
          <div className="attention-list">
            {[
              ["高", "黄国强厨房设备已离线 4 小时", "设备异常", "12 分钟前"],
              ["高", "林秀英晚间用药提醒连续 2 次未完成", "提醒异常", "36 分钟前"],
              ["中", "陈美玲的家政保洁预约待确认", "预约服务", "1 小时前"],
              ["中", "王德昌档案缺少紧急联系人", "资料待补", "2 小时前"],
            ].map(([level, title, type, time]) => (
              <button className="attention-row" key={title}>
                <span className={`priority ${level === "高" ? "high" : "medium"}`}>{level}</span>
                <span className="attention-copy"><b>{title}</b><small>{type}</small></span>
                <span className="attention-time">{time}</span><ChevronRight size={16} />
              </button>
            ))}
          </div>
        </section>
        <section className="panel quick-panel">
          <div className="panel-title"><div><h3>快捷入口</h3><p>常用运营动作</p></div></div>
          <div className="quick-grid">
            {[
              ["新增老人", Users, "elderly"], ["新建提醒", Bell, "reminders"],
              ["发布资讯", BookOpen, "safety"], ["录入设备", MonitorSmartphone, "sensorDevices"],
              ["查看预约", ClipboardList, "services"], ["发布活动", CalendarDays, "activities"],
            ].map(([label, Icon, key]) => <button key={label} onClick={() => onNavigate(key)}><Icon size={19}/><span>{label}</span></button>)}
          </div>
        </section>
      </div>
      <section className="panel trend-panel">
        <div className="panel-title"><div><h3>近 7 日运营概况</h3><p>提醒完成、内容阅读与服务处理趋势</p></div><button className="select-button">近 7 日 <ChevronDown size={14}/></button></div>
        <div className="mini-chart" aria-label="运营趋势图">
          {[58, 66, 62, 74, 69, 82, 88].map((v, i) => <div key={i}><span style={{height: `${v}%`}}></span><small>{["周四","周五","周六","周日","周一","周二","今天"][i]}</small></div>)}
        </div>
      </section>
    </>
  );
}

function getProfileCompleteness(record) {
  const emergencyContact = getEmergencyContacts(record)[0];
  const checks = [
    record.name,
    record.phone,
    record.project,
    record.community,
    record.address && record.address !== "待补充",
    emergencyContact?.name,
    emergencyContact?.phone,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function getEmergencyContacts(record) {
  if (record?.emergencyContacts?.length) {
    return record.emergencyContacts.map((contact, index) => ({
      id: contact.id || `contact-${index + 1}`,
      name: contact.name || "",
      relation: contact.relation || "",
      phone: contact.phone || "",
    }));
  }
  if (record?.emergency?.name || record?.emergency?.phone) {
    return [{ id: "contact-1", name: record.emergency.name || "", relation: record.emergency.relation || "", phone: record.emergency.phone || "" }];
  }
  return [];
}

function ElderlyPage({ records, projects, tabletDevices, activationRecords, onOpen }) {
  const initialFilters = { query: "", project: "全部项目", status: "全部状态", attention: "全部关注状态" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [notice, setNotice] = useState("");

  const filteredRecords = useMemo(() => records.filter((record) => {
    const keyword = filters.query.trim().toLowerCase();
    const emergencyKeywords = getEmergencyContacts(record).flatMap((contact) => [contact.name, contact.phone, contact.relation]);
    const keywordMatched = !keyword || [
      record.name, record.id, record.phone, record.project, record.community,
      record.address, ...emergencyKeywords,
    ].join(" ").toLowerCase().includes(keyword);
    const projectMatched = filters.project === "全部项目" || record.project === filters.project;
    const statusMatched = filters.status === "全部状态" || record.status === filters.status;
    const attentionMatched = filters.attention === "全部关注状态" || record.attention === filters.attention;
    return keywordMatched && projectMatched && statusMatched && attentionMatched;
  }), [records, filters]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  };

  return (
    <>
      <div className="page-heading">
        <div><h1>老人档案</h1><p>维护老人基础资料、项目归属和服务关系，进入详情页定义家庭空间并管理设备</p></div>
        <button className="primary-button" onClick={() => onOpen("create")}><Plus size={16}/>新增老人</button>
      </div>
      <section className="panel management-panel elderly-management">
        <div className="filters elderly-filters">
          <label>
            <span>关键字</span>
            <div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters({ ...draftFilters, query: event.target.value })} placeholder="姓名、档案编号、手机号或地址" /></div>
          </label>
          <label>
            <span>所属项目</span>
            <select className="select-control wide" value={draftFilters.project} onChange={(event) => setDraftFilters({ ...draftFilters, project: event.target.value })}>
              <option>全部项目</option>
              {projects.filter((project) => project.status === "启用").map((project) => <option key={project.id}>{project.name}</option>)}
            </select>
          </label>
          <label>
            <span>服务状态</span>
            <select className="select-control" value={draftFilters.status} onChange={(event) => setDraftFilters({ ...draftFilters, status: event.target.value })}>
              {["全部状态", "服务中", "待开通"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label>
            <span>关注状态</span>
            <select className="select-control" value={draftFilters.attention} onChange={(event) => setDraftFilters({ ...draftFilters, attention: event.target.value })}>
              {["全部关注状态", "正常", "设备离线", "提醒未完成", "资料待补充", "待回访"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <div className="filter-actions">
            <button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button>
            <button className="secondary-button" onClick={() => { setDraftFilters(initialFilters); setFilters(initialFilters); }}><RefreshCw size={15}/>重置</button>
          </div>
        </div>
        <div className="table-toolbar">
          <div><span className="result-count">共 {filteredRecords.length} 条档案</span><span className="toolbar-hint">关键资料缺失的老人不可开通正式服务</span></div>
          <button className="icon-button" title="刷新" onClick={() => showNotice("档案数据已刷新")}><RefreshCw size={16}/></button>
        </div>
        <div className="table-scroll">
          <table className="elderly-table">
            <thead><tr><th>老人信息</th><th>所属项目 / 社区</th><th>联系方式</th><th>平板状态</th><th>感知设备</th><th>顾问</th><th>资料完整度</th><th>服务状态</th><th>关注状态</th><th className="sticky-right">操作</th></tr></thead>
            <tbody>
              {filteredRecords.map((record) => {
                const completeness = getProfileCompleteness(record);
                const tablet = tabletDevices.find((device) => device.boundElderlyId === record.id);
                const pendingActivation = activationRecords.find((item) => item.elderlyId === record.id && item.status === "待使用");
                return (
                  <tr key={record.id}>
                    <td><button className="elderly-name-cell" onClick={() => onOpen("view", record)}><span className="person-avatar">{record.name.slice(-1)}</span><span><b>{record.name}</b><small>{record.gender} · {record.age} 岁 · {formatDisplayId(record.id)}</small></span></button></td>
                    <td><div className="stacked-cell"><b>{record.project}</b><small>{record.community}</small></div></td>
                    <td><div className="stacked-cell"><b>{record.phone || "待补充"}</b><small>{record.address}</small></div></td>
                    <td><div className="stacked-cell"><StatusTag>{tablet?.status || (pendingActivation ? "待激活" : "待绑定")}</StatusTag><small>{tablet ? formatDisplayId(tablet.id) : (pendingActivation ? `激活码 ${pendingActivation.code}` : "未生成激活信息")}</small></div></td>
                    <td><StatusTag>{record.device}</StatusTag></td>
                    <td>{record.advisor}</td>
                    <td><div className="completeness-cell"><div><span style={{ width: `${completeness}%` }}/></div><b className={completeness < 100 ? "incomplete" : ""}>{completeness}%</b></div></td>
                    <td><StatusTag>{record.status}</StatusTag></td>
                    <td><StatusTag>{record.attention}</StatusTag></td>
                    <td className="sticky-right elderly-actions">
                      <button className="table-action" onClick={() => onOpen("view", record)}>详情</button>
                      <button className="table-action" onClick={() => onOpen("edit", record)}>编辑</button>
                    </td>
                  </tr>
                );
              })}
              {!filteredRecords.length && <tr><td colSpan="10"><div className="empty-state"><Search size={24}/><b>未找到匹配的老人档案</b><span>请调整筛选条件后重新查询</span></div></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="pagination"><span>当前展示 {filteredRecords.length} 条数据</span><div><button className="select-button">20 条/页 <ChevronDown size={14}/></button><button className="page-arrow" disabled><ChevronLeft size={15}/></button><button className="page-number active">1</button><button className="page-arrow" disabled><ChevronRight size={15}/></button></div></div>
      </section>
      {notice && <div className="toast-message"><ShieldCheck size={16}/>{notice}</div>}
    </>
  );
}

const activityTimeToMinutes = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const formatActivityMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} 小时 ${String(rest).padStart(2, "0")} 分` : `${rest} 分钟`;
};

function DailyRoomActivityPanel({ record, sensors }) {
  const sessions = dailyRoomActivity[record.id] || [];
  const installedRooms = [...new Set(sensors.filter((sensor) => sensor.installStatus === "已安装").map((sensor) => sensor.room))];
  const rooms = record.rooms?.filter((room) => installedRooms.includes(room)) || [];
  const totalMinutes = sessions.reduce((total, item) => total + activityTimeToMinutes(item.end) - activityTimeToMinutes(item.start), 0);
  const recentSessions = [...sessions].sort((a, b) => activityTimeToMinutes(b.start) - activityTimeToMinutes(a.start)).slice(0, 4);
  return <section className="panel daily-room-activity-panel">
    <div className="panel-title"><div><h3>今日房间活动</h3><p>按房间查看活动传感器记录到的活跃时段</p></div><span className="activity-date">今天 · 2026年7月17日</span></div>
    {sessions.length ? <div className="daily-activity-body">
      <div className="activity-summary-strip compact">
        <div><span>首次活动</span><b>{sessions[0].start}</b></div>
        <div><span>最近活动</span><b>{sessions[sessions.length - 1].end}</b></div>
        <div><span>累计活跃时段</span><b>{formatActivityMinutes(totalMinutes)}</b></div>
        <div><span>涉及房间</span><b>{new Set(sessions.map((item) => item.room)).size} 个</b></div>
      </div>
      <div className="activity-visual-grid">
        <div className="room-activity-timeline" role="img" aria-label={`${record.name}今日在不同房间的活动时间轴`}>
          <div className="timeline-axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
          {rooms.map((room, index) => {
            const roomSessions = sessions.filter((item) => item.room === room);
            const roomMinutes = roomSessions.reduce((total, item) => total + activityTimeToMinutes(item.end) - activityTimeToMinutes(item.start), 0);
            return <div className="room-timeline-row" key={room}>
              <div className="room-timeline-label"><span className={`room-color-dot tone-${index % 4}`}/><b>{room}</b><small>{formatActivityMinutes(roomMinutes)}</small></div>
              <div className="room-timeline-track">{roomSessions.map((item) => {
                const start = activityTimeToMinutes(item.start);
                const duration = activityTimeToMinutes(item.end) - start;
                return <span className={`activity-segment tone-${index % 4}`} key={`${room}-${item.start}`} style={{ left: `${start / 14.4}%`, width: `${Math.max(duration / 14.4, 0.8)}%` }} title={`${room} ${item.start}–${item.end}`}><i/></span>;
              })}</div>
            </div>;
          })}
        </div>
        <div className="recent-activity-list"><div className="recent-activity-heading"><b>最近活动记录</b><span>时间</span></div>{recentSessions.map((item, index) => <div key={`${item.room}-${item.start}`}><span className={`room-color-dot tone-${Math.max(0, rooms.indexOf(item.room)) % 4}`}/><b>{item.room}</b><small>{item.start}–{item.end}</small>{index === 0 && <StatusTag>最近</StatusTag>}</div>)}</div>
      </div>
      <p className="activity-data-note">活动时段由房间传感器检测结果汇总，仅反映对应房间出现活动，不用于识别具体人物或动作。</p>
    </div> : <div className="space-empty-state"><Activity size={28}/><h4>今日暂无房间活动记录</h4><p>设备正常上报后，将在这里展示不同房间的活动时间。</p></div>}
  </section>;
}

function InactivityReminderPanel({ rule }) {
  return <section className="panel inactivity-reminder-panel">
    <div className="panel-title"><div><h3>无活动轻提醒</h3><p>长时间没有检测到房间活动时，在后台生成待关注提醒</p></div><StatusTag>使用全局规则</StatusTag></div>
    <div className="inactivity-rule-summary">
      <span className="inactivity-rule-icon"><Bell size={20}/></span>
      <div><b>{rule.enabled ? `连续 ${rule.thresholdHours} 小时无活动` : "暂未启用提醒规则"}</b><small>{rule.enabled ? `监测时段 ${rule.startTime}–${rule.endTime} · 仅后台提醒` : "启用后仅作为轻度关注线索，不触发老人端警报"}</small></div>
      <StatusTag>{rule.enabled ? "已启用" : "未启用"}</StatusTag>
      <div className="inactivity-current-status"><span>当前状态</span><StatusTag>{rule.status}</StatusTag></div>
    </div>
    <div className="inactivity-history"><div className="inactivity-history-head"><b>提醒记录</b><span>最近 7 天</span></div>{rule.history?.length ? rule.history.map((item) => <div className="inactivity-history-row" key={item.id}><div><b>{item.triggeredAt}</b><small>触发时间</small></div><div><b>{item.lastActivity}</b><small>最后活动</small></div><div><b>{item.duration}</b><small>无活动时长</small></div><div><StatusTag>{item.status}</StatusTag><small>{item.status === "已恢复" ? `恢复活动 ${item.recoveredAt}` : "等待后台查看"}</small></div></div>) : <div className="inactivity-history-empty">最近 7 天没有生成无活动提醒</div>}</div>
    <div className="inactivity-rule-note"><ShieldCheck size={16}/><span>仅当已安装的房间传感器正常在线时判断无活动；设备离线时只生成设备异常，不生成老人无活动提醒。</span></div>
  </section>;
}

function InactivityRuleDrawer({ rule, onClose, onSave }) {
  const [form, setForm] = useState(rule);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer inactivity-rule-drawer" role="dialog" aria-modal="true" aria-label="设置全局无活动轻提醒"><header><div><h2>设置全局无活动轻提醒</h2><p>适用于全部已安装房间活动传感器的老人</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="form-section"><h3>全局提醒规则</h3><label><span>规则状态</span><select className="select-control form-select-native" value={form.enabled ? "启用" : "停用"} onChange={(event) => update("enabled", event.target.value === "启用")}><option>启用</option><option>停用</option></select></label><label><span>连续无活动时长</span><select className="select-control form-select-native" value={form.thresholdHours} onChange={(event) => update("thresholdHours", Number(event.target.value))}><option value="1">1 小时</option><option value="2">2 小时</option><option value="3">3 小时</option><option value="4">4 小时</option><option value="6">6 小时</option><option value="8">8 小时</option></select></label><div className="form-two-cols"><label><span>监测开始时间</span><input type="time" value={form.startTime} onChange={(event) => update("startTime", event.target.value)}/></label><label><span>监测结束时间</span><input type="time" value={form.endTime} onChange={(event) => update("endTime", event.target.value)}/></label></div></div><div className="form-tip"><ShieldCheck size={18}/><div><b>全局生效范围</b><p>保存后对全部已安装房间活动传感器的老人统一生效，不需要逐个老人重复设置。</p></div></div><div className="form-tip"><ShieldCheck size={18}/><div><b>轻提醒判断口径</b><p>监测时间段内，所有已安装且在线的房间传感器连续超过设定时长没有检测到活动，后台生成“待关注”提醒。任一设备离线时不判断老人无活动。</p></div></div><div className="form-tip neutral"><Bell size={18}/><div><b>提醒范围</b><p>一期仅在运营后台展示，不触发平板警报、电话或紧急联系人通知。</p></div></div></div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={() => onSave(form)}>保存全局规则</button></footer></aside></div>;
}

function FamilyRelationshipPanel({ invitations, relations, onInvalidateInvite, onUnlinkRelation }) {
  const [pendingAction, setPendingAction] = useState(null);
  const activeRelations = relations.filter((item) => item.status === "正常");
  const activeInvitations = invitations.filter((item) => item.status === "有效");

  const confirmAction = () => {
    if (pendingAction?.type === "invite") onInvalidateInvite(pendingAction.record.id);
    if (pendingAction?.type === "relation") onUnlinkRelation(pendingAction.record.id);
    setPendingAction(null);
  };

  return (
    <div className="family-relationship-page">
      <section className="family-overview-grid">
        <div className="family-overview-card"><span>已绑定子女</span><strong>{activeRelations.length}</strong><small>人数不设上限</small></div>
        <div className="family-overview-card"><span>当前有效邀请</span><strong>{activeInvitations.length}</strong><small>由老人设备生成</small></div>
        <div className="family-overview-note"><ShieldCheck size={19}/><div><b>后台仅负责监管</b><p>不能代替老人生成日常邀请，也不能代替子女完成绑定。</p></div></div>
      </section>

      <section className="panel family-panel">
        <div className="panel-title"><div><h3>家庭绑定邀请记录</h3><p>邀请由老人设备生成，每次邀请在生成后 30 分钟失效</p></div><span className="result-count">共 {invitations.length} 条</span></div>
        <div className="table-scroll"><table className="family-invitation-table"><thead><tr><th>来源设备</th><th>6 位绑定码</th><th>生成时间</th><th>30 分钟失效时间</th><th>当前状态</th><th>本次绑定人数</th><th>操作</th></tr></thead><tbody>
          {invitations.map((item) => <tr key={item.id}><td><div className="stacked-cell"><b>{formatDisplayId(item.deviceId)}</b><small>{item.deviceSn}</small></div></td><td><b className="family-code">{item.code}</b></td><td>{item.generatedAt}</td><td>{item.expiresAt}</td><td><StatusTag>{item.status}</StatusTag></td><td>{item.boundCount} 人</td><td>{item.status === "有效" ? <button className="table-action danger-text" onClick={() => setPendingAction({ type: "invite", record: item })}>强制作废</button> : <span className="muted-action">—</span>}</td></tr>)}
          {!invitations.length && <tr><td colSpan="7"><div className="empty-table-state">暂无老人设备生成的家庭邀请记录</div></td></tr>}
        </tbody></table></div>
      </section>

      <section className="panel family-panel">
        <div className="panel-title"><div><h3>已绑定子女</h3><p>展示当前及历史家庭关系，不提供后台代绑定入口</p></div><span className="result-count">当前 {activeRelations.length} 人</span></div>
        <div className="table-scroll"><table className="family-relation-table"><thead><tr><th>姓名</th><th>脱敏手机号</th><th>与老人关系</th><th>绑定时间</th><th>关系状态</th><th>操作</th></tr></thead><tbody>
          {relations.map((item) => <tr key={item.id}><td><div className="relative-name-cell"><span>{item.name.slice(-1)}</span><b>{item.name}</b></div></td><td>{maskPhone(item.phone)}</td><td>{item.relation}</td><td>{item.boundAt}</td><td><StatusTag>{item.status}</StatusTag></td><td>{item.status === "正常" ? <button className="table-action danger-text" onClick={() => setPendingAction({ type: "relation", record: item })}>解除关系</button> : <span className="muted-action">—</span>}</td></tr>)}
          {!relations.length && <tr><td colSpan="6"><div className="empty-table-state">当前老人尚未绑定子女</div></td></tr>}
        </tbody></table></div>
      </section>

      {pendingAction && <div className="modal-layer"><button className="modal-backdrop" aria-label="关闭确认弹窗" onClick={() => setPendingAction(null)}/><section className="confirm-dialog" role="dialog" aria-modal="true"><span className="confirm-icon danger"><ShieldCheck size={22}/></span><h3>{pendingAction.type === "invite" ? "确认强制作废邀请？" : "确认解除家庭关系？"}</h3><p>{pendingAction.type === "invite" ? `绑定码 ${pendingAction.record.code} 将立即不可再使用；已经完成的家庭绑定不受本次作废影响。` : `${pendingAction.record.name} 将失去后续家庭访问和通知关系；历史互动记录保留，其他已绑定子女不受影响。`}</p><div><button className="secondary-button" onClick={() => setPendingAction(null)}>取消</button><button className="danger-button" onClick={confirmAction}>{pendingAction.type === "invite" ? "确认作废" : "确认解除"}</button></div></section></div>}
    </div>
  );
}

function ElderlyDetailPage({ record, project, tablet, activation, sensors, reminders, familyInvitations, familyRelations, inactivityRule, weatherLocation, weatherQuery, weatherAudits, onBack, onEdit, onManageSpaces, onAddSensor, onViewSensor, onManageTablet, onInvalidateInvite, onUnlinkRelation }) {
  const [tab, setTab] = useState("profile");
  const completeness = getProfileCompleteness(record);
  const emergencyContacts = getEmergencyContacts(record);
  tablet = tablet ? { ...tablet, id: formatDisplayId(tablet.id) } : tablet;
  const boundSensors = sensors.filter((sensor) => sensor.elderlyId === record.id && sensor.installStatus !== "已解绑");
  return <>
    <div className="detail-page-heading"><div><button className="back-link" onClick={onBack}><ChevronLeft size={16}/>返回老人档案</button><div className="profile-summary detail-profile-summary"><span className="profile-avatar">{record.name.slice(-1)}</span><div><div className="profile-name"><h1>{record.name}</h1><StatusTag>{record.status}</StatusTag></div><p>{record.gender} · {record.age} 岁 · {formatDisplayId(record.id)} · {record.project}</p><div className="profile-tags">{record.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></div></div><button className="primary-button" onClick={onEdit}>编辑档案</button></div>
    <div className="elderly-detail-tabs"><button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>档案信息</button><button className={tab === "family" ? "active" : ""} onClick={() => setTab("family")}>家庭关系 <span>{familyRelations.filter((item) => item.status === "正常").length}</span></button><button className={tab === "weather" ? "active" : ""} onClick={() => setTab("weather")}>天气位置</button><button className={tab === "reminders" ? "active" : ""} onClick={() => setTab("reminders")}>提醒事项 <span>{reminders.length}</span></button><button className={tab === "spaces" ? "active" : ""} onClick={() => setTab("spaces")}>房间活动传感器 <span>{boundSensors.length}</span></button><button className={tab === "tablet" ? "active" : ""} onClick={() => setTab("tablet")}>平板设备</button></div>
    {tab === "spaces" && <><DailyRoomActivityPanel record={record} sensors={boundSensors}/><InactivityReminderPanel rule={inactivityRule}/></>} 
  </>;
}

function SpaceManagementDrawer({ record, onClose, onSave }) {
  const [rooms, setRooms] = useState(record.rooms || []);
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");
  const addRoom = () => {
    const nextRoom = roomName.trim();
    if (!nextRoom) return setError("请输入空间名称");
    if (rooms.includes(nextRoom)) return setError("该空间已存在");
    setRooms((items) => [...items, nextRoom]);
    setRoomName("");
    setError("");
  };
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer space-drawer" role="dialog" aria-modal="true" aria-label="定义家庭空间"><header><div><h2>定义家庭空间</h2><p>{record.name} · {record.address}</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="form-section"><h3>添加空间</h3><div className="space-add-row"><input value={roomName} onChange={(event) => setRoomName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addRoom()} placeholder="例如：客厅、卧室、厨房"/><button className="primary-button" onClick={addRoom}><Plus size={15}/>添加</button></div>{error && <small className="field-error space-error">{error}</small>}<h3>已定义空间</h3>{rooms.length ? <div className="defined-space-list">{rooms.map((room) => <div key={room}><span><Home size={17}/></span><b>{room}</b><StatusTag>已定义</StatusTag></div>)}</div> : <div className="space-empty-mini">暂未定义空间</div>}</div><div className="form-tip"><ShieldCheck size={18}/><div><b>空间与设备关系</b><p>保存空间后才能绑定传感器；空间不计入老人档案完整度，也不影响平板和基础服务。</p></div></div></div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={() => onSave(rooms)}>保存空间</button></footer></aside></div>;
}

function ElderlyDrawer({ mode: initialMode, record, projects, tablet, activation, onManageTablet, onClose, onSave }) {
  const [mode, setMode] = useState(initialMode);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: record?.name || "",
    gender: record?.gender || "女",
    birthday: record?.birthday || "",
    phone: record?.phone || "",
    project: record?.project || "",
    community: record?.community || "",
    address: record?.address === "待补充" ? "" : record?.address || "",
    tags: record?.tags?.join("、") || "",
    emergencyContacts: getEmergencyContacts(record).length
      ? getEmergencyContacts(record)
      : [{ id: "contact-1", name: "", relation: "", phone: "" }],
  });

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateEmergencyContact = (id, field, value) => setForm((current) => ({
    ...current,
    emergencyContacts: current.emergencyContacts.map((contact) => contact.id === id ? { ...contact, [field]: value } : contact),
  }));
  const addEmergencyContact = () => setForm((current) => ({
    ...current,
    emergencyContacts: [
      ...current.emergencyContacts,
      { id: `contact-${Date.now()}`, name: "", relation: "", phone: "" },
    ],
  }));
  const removeEmergencyContact = (id) => setForm((current) => ({
    ...current,
    emergencyContacts: current.emergencyContacts.filter((contact) => contact.id !== id),
  }));

  const handleSave = () => {
    const requiredFields = {
      name: "请输入老人姓名",
      phone: "请输入联系电话",
      project: "请选择所属项目",
      community: "请输入所属社区",
      address: "请输入居住地址",
    };
    const nextErrors = Object.fromEntries(Object.entries(requiredFields).filter(([field]) => !form[field].trim()));
    const emergencyContactErrors = form.emergencyContacts.map((contact) => ({
      name: contact.name.trim() ? "" : "请输入联系人姓名",
      phone: contact.phone.trim() ? "" : "请输入紧急联系电话",
    }));
    if (!form.emergencyContacts.length) nextErrors.emergencyContacts = "请至少添加一位紧急联系人";
    if (emergencyContactErrors.some((contact) => contact.name || contact.phone)) nextErrors.emergencyContactItems = emergencyContactErrors;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const birthdayYear = Number(form.birthday.slice(0, 4));
    const emergencyContacts = form.emergencyContacts.map((contact) => ({
      ...contact,
      name: contact.name.trim(),
      relation: contact.relation.trim(),
      phone: contact.phone.trim(),
    }));
    onSave({
      ...record,
      name: form.name.trim(),
      gender: form.gender,
      birthday: form.birthday,
      age: birthdayYear ? 2026 - birthdayYear : record?.age || 0,
      phone: form.phone.trim(),
      project: form.project,
      community: form.community.trim(),
      address: form.address.trim(),
      rooms: record?.rooms || [],
      tags: form.tags.split(/[、,，]/).map((item) => item.trim()).filter(Boolean),
      advisor: record?.advisor || "未开通",
      emergencyContacts,
      emergency: emergencyContacts[0],
    });
  };

  if (mode === "view") {
    const completeness = getProfileCompleteness(record);
    const linkedProject = projects.find((project) => project.name === record.project);
    const emergencyContacts = getEmergencyContacts(record);
    return (
      <div className="drawer-layer" role="presentation">
        <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
        <aside className="drawer elderly-drawer" role="dialog" aria-modal="true" aria-label="老人档案详情">
          <header><div><h2>老人档案详情</h2><p>档案编号 {formatDisplayId(record.id)} · 更新于 {record.updatedAt}</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
          <div className="drawer-body">
            <div className="profile-summary">
              <span className="profile-avatar">{record.name.slice(-1)}</span>
              <div><div className="profile-name"><h3>{record.name}</h3><StatusTag>{record.status}</StatusTag></div><p>{record.gender} · {record.age} 岁 · {record.project}</p><div className="profile-tags">{record.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
            </div>
            <section className="detail-section">
              <div className="detail-section-title"><h3>资料完整度</h3><b className={completeness < 100 ? "incomplete" : ""}>{completeness}%</b></div>
              <div className="profile-progress"><span style={{ width: `${completeness}%` }}/></div>
              {completeness < 100 && <p className="detail-warning">关键资料尚未补齐，当前不能开通正式服务。</p>}
            </section>
            <section className="detail-section"><h3>基础资料</h3><div className="info-grid"><div><span>出生日期</span><b>{record.birthday}</b></div><div><span>联系电话</span><b>{record.phone || "待补充"}</b></div><div><span>所属社区</span><b>{record.community}</b></div><div><span>服务顾问</span><b>{record.advisor}</b></div><div><span>时区</span><b>{linkedProject?.timezone || "项目未配置"}</b></div><div className="full"><span>居住地址</span><b>{record.address}</b></div></div></section>
            <section className="detail-section">
              <div className="detail-section-title"><h3>老人平板绑定</h3><button className="text-button" onClick={onManageTablet}>{tablet ? "查看或解绑" : activation ? "查看激活信息" : "生成激活码"}</button></div>
              <div className="relation-card">
                <div><MonitorSmartphone size={18}/><span><b>{tablet ? `${tablet.model} · ${formatDisplayId(tablet.id)}` : activation ? `激活码 ${activation.code}` : "尚未生成平板激活信息"}</b><small>{tablet ? `激活方式 ${tablet.activationMethod || "激活码"} · 绑定于 ${tablet.boundAt}` : activation ? `目标设备 ${formatDisplayId(activation.deviceId)} · ${activation.deviceSn || "SN 待补充"}` : "生成激活码后，由安装人员在老人平板上完成激活"}</small></span></div>
                <StatusTag>{tablet?.status || activation?.status || "待生成"}</StatusTag>
              </div>
            </section>
            <section className="detail-section"><h3>房间活动感知设备</h3><div className="relation-card"><div><Home size={18}/><span><b>{record.rooms?.length ? `${record.rooms.length} 个已定义空间` : "尚未定义家庭空间"}</b><small>{record.rooms?.join("、") || "请先在老人详情页定义空间，再绑定活动传感器"}</small></span></div><StatusTag>{record.device || "未安装"}</StatusTag></div></section>
            <section className="detail-section"><div className="detail-section-title"><h3>紧急联系人与家庭关系</h3><span className="relation-count">共 {emergencyContacts.length} 位联系人</span></div><div className="emergency-contact-view-list">{emergencyContacts.map((contact) => <div className="relation-card" key={contact.id}><div><HeartHandshake size={18}/><span><b>{contact.name || "待补充紧急联系人"}</b><small>{contact.relation || "关系待补充"} · {contact.phone || "电话待补充"}</small></span></div></div>)}</div></section>
          </div>
          <footer><button className="secondary-button" onClick={onClose}>关闭</button><button className="primary-button" onClick={() => setMode("edit")}>编辑档案</button></footer>
        </aside>
      </div>
    );
  }

  return (
    <div className="drawer-layer" role="presentation">
      <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
      <aside className="drawer elderly-drawer" role="dialog" aria-modal="true" aria-label={mode === "create" ? "新增老人" : "编辑老人档案"}>
        <header><div><h2>{mode === "create" ? "新增老人" : "编辑老人档案"}</h2><p>关键资料填写完整后，老人才能进入正式服务流程</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
        <div className="drawer-body">
          <div className="form-section elderly-form">
            <h3>基础信息</h3>
            <div className="form-row">
              <label><span>老人姓名 *</span><input value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="请输入老人姓名"/>{errors.name && <small className="field-error">{errors.name}</small>}</label>
              <label><span>性别 *</span><select className="select-control form-select-native" value={form.gender} onChange={(event) => updateForm("gender", event.target.value)}><option>女</option><option>男</option></select></label>
            </div>
            <div className="form-row">
              <label><span>出生日期</span><input type="date" value={form.birthday} onChange={(event) => updateForm("birthday", event.target.value)}/></label>
              <label><span>联系电话 *</span><input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} placeholder="+65"/>{errors.phone && <small className="field-error">{errors.phone}</small>}</label>
            </div>
            <h3>服务归属</h3>
            <label><span>所属项目 *</span><select className="select-control form-select-native" value={form.project} onChange={(event) => { const project = projects.find((item) => item.name === event.target.value); setForm((current) => ({ ...current, project: event.target.value, community: project?.community || current.community })); }}><option value="">请选择所属项目</option>{projects.filter((project) => project.status === "启用" || project.name === record?.project).map((project) => <option key={project.id}>{project.name}</option>)}</select>{errors.project && <small className="field-error">{errors.project}</small>}</label>
            <label><span>所属社区 *</span><input value={form.community} onChange={(event) => updateForm("community", event.target.value)} placeholder="请输入社区名称"/>{errors.community && <small className="field-error">{errors.community}</small>}</label>
            <label><span>居住地址 *</span><input value={form.address} onChange={(event) => updateForm("address", event.target.value)} placeholder="请输入完整居住地址"/>{errors.address && <small className="field-error">{errors.address}</small>}</label>
            <h3>运营标签</h3>
            <label><span>基础标签（选填）</span><input value={form.tags} onChange={(event) => updateForm("tags", event.target.value)} placeholder="例如：独居、高龄、用药关注"/><small className="field-help">标签用于后台筛选和运营分类，不作为医疗判断或服务开通条件。</small></label>
            <div className="emergency-section-heading">
              <div><h3>紧急联系人</h3><p>可配置多位联系人，联系人之间不区分优先级</p></div>
              <button type="button" className="secondary-button" onClick={addEmergencyContact}><Plus size={15}/>添加联系人</button>
            </div>
            {errors.emergencyContacts && <small className="field-error emergency-section-error">{errors.emergencyContacts}</small>}
            <div className="emergency-contact-editor-list">
              {form.emergencyContacts.map((contact, index) => (
                <section className="emergency-contact-editor" key={contact.id}>
                  <div className="emergency-contact-editor-head">
                    <div><b>联系人 {index + 1}</b></div>
                    <div>
                      <button type="button" className="danger-text-button" disabled={form.emergencyContacts.length === 1} onClick={() => removeEmergencyContact(contact.id)}>删除</button>
                    </div>
                  </div>
                  <div className="form-row">
                    <label><span>联系人姓名 *</span><input value={contact.name} onChange={(event) => updateEmergencyContact(contact.id, "name", event.target.value)} placeholder="请输入姓名"/>{errors.emergencyContactItems?.[index]?.name && <small className="field-error">{errors.emergencyContactItems[index].name}</small>}</label>
                    <label><span>与老人关系</span><input value={contact.relation} onChange={(event) => updateEmergencyContact(contact.id, "relation", event.target.value)} placeholder="例如：女儿"/></label>
                  </div>
                  <label><span>紧急联系电话 *</span><input value={contact.phone} onChange={(event) => updateEmergencyContact(contact.id, "phone", event.target.value)} placeholder="+65"/>{errors.emergencyContactItems?.[index]?.phone && <small className="field-error">{errors.emergencyContactItems[index].phone}</small>}</label>
                </section>
              ))}
            </div>
          </div>
        </div>
        <footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={handleSave}>{mode === "create" ? "保存档案" : "保存修改"}</button></footer>
      </aside>
    </div>
  );
}

function TabletBindingModal({ record, project, devices, activation, onGenerate, onActivate, onFail, onClose, onUnbind }) {
  const currentTablet = devices.find((device) => device.boundElderlyId === record.id);
  const availableDevices = devices.filter((device) => !device.boundElderlyId);
  const [selectedId, setSelectedId] = useState(activation?.deviceId || "");
  const [stage, setStage] = useState(currentTablet ? "bound" : activation?.status === "待使用" || activation?.status === "激活失败" ? "waiting" : "generate");
  const [confirmUnbind, setConfirmUnbind] = useState(false);
  const [validationError, setValidationError] = useState("");
  const selectedDevice = availableDevices.find((device) => device.id === selectedId);

  const generateActivation = () => {
    if (!selectedDevice) return;
    const createdAt = new Date();
    const format = (date) => date.toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    onGenerate({
      id: `ACT-${Date.now()}`,
      code: String(Math.floor(100000 + Math.random() * 900000)),
      elderlyId: record.id,
      deviceId: selectedDevice.id,
      deviceSn: selectedDevice.sn,
      status: "待使用",
      method: "6位激活码",
      createdAt: format(createdAt),
      operator: "赵亚男",
    });
    setValidationError("");
    setStage("waiting");
  };

  const confirmIdentity = () => {
    setStage("syncing");
    window.setTimeout(() => {
      onActivate(activation.deviceId, activation.id);
      setStage("success");
    }, 900);
  };

  const failActivation = (message) => {
    setValidationError(message);
    if (activation?.status === "待使用") onFail(activation.id);
  };

  const steps = ["指定对象", "设备校验", "身份确认", "数据同步", "激活完成"];
  const stageIndex = { generate: 0, waiting: 1, identity: 2, syncing: 3, success: 4 }[stage] ?? 4;
  const locationReady = Boolean(record.address && record.address !== "待补充" && project?.timezone);
  const activationDevice = devices.find((device) => device.id === activation?.deviceId) || selectedDevice;

  return (
    <div className="modal-layer tablet-modal-layer">
      <button className="modal-backdrop" aria-label="关闭" onClick={onClose}/>
      <div className="tablet-binding-dialog" role="dialog" aria-modal="true">
        <header><div><h3>{currentTablet && stage !== "success" ? "平板绑定详情" : "激活老人平板"}</h3><p>{record.name} · {formatDisplayId(record.id)} · {record.project}</p></div><button className="icon-button" onClick={onClose}><X size={18}/></button></header>
        <div className="tablet-dialog-body">
          {(!currentTablet || stage === "success") && <div className="activation-stepper">{steps.map((item, index) => <div className={index < stageIndex ? "done" : index === stageIndex ? "active" : ""} key={item}><i>{index < stageIndex ? "✓" : index + 1}</i><span>{item}</span></div>)}</div>}
          {currentTablet && stage !== "success" ? (
            <>
            <div className="current-binding-card">
              <div><MonitorSmartphone size={20}/><span><b>{currentTablet.model}</b><small>{formatDisplayId(currentTablet.id)} · {currentTablet.sn} · 最近登录 {currentTablet.lastOnline}</small></span></div>
              <StatusTag>{currentTablet.status}</StatusTag>
            </div>
            <div className="binding-audit-grid"><div><span>激活方式</span><b>{currentTablet.activationMethod || "激活码"}</b></div><div><span>激活时间</span><b>{currentTablet.boundAt}</b></div><div><span>激活操作人</span><b>{currentTablet.operator || "赵亚男"}</b></div><div><span>所属项目</span><b>{record.project}</b></div><div><span>时区</span><b>{project?.timezone || "未配置"}</b></div></div>
            <div className="binding-rule-note"><ShieldCheck size={17}/><p>已绑定设备不能通过新激活码覆盖当前关系。如需转移设备，请先在后台解除绑定。</p></div>
            </>
          ) : stage === "generate" ? (
            <div className="activation-target-form">
              <div className="activation-target-heading"><span><MonitorSmartphone size={21}/></span><div><h4>指定激活对象</h4><p>激活码只允许下方老人和设备使用，生成后不能更换目标。</p></div></div>
              <div className="activation-target-grid">
                <label><span>指定老人</span><div className="activation-readonly-field"><b>{record.name}</b><small>{formatDisplayId(record.id)} · {record.project}</small></div></label>
                <label><span>指定待激活设备</span><select className="select-control form-select-native" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">请选择待激活设备</option>{availableDevices.map((device) => <option key={device.id} value={device.id}>{formatDisplayId(device.id)} · {device.sn}</option>)}</select></label>
              </div>
              {selectedDevice && <div className="activation-device-preview"><div><span>目标设备编号</span><b>{formatDisplayId(selectedDevice.id)}</b></div><div><span>设备 SN</span><b>{selectedDevice.sn}</b></div><div><span>设备型号</span><b>{selectedDevice.model}</b></div><StatusTag>{selectedDevice.status}</StatusTag></div>}
              {activation && <div className="activation-history-note"><StatusTag>{activation.status}</StatusTag><span>上一激活码 {activation.code} · {formatDisplayId(activation.deviceId)}；重新生成后，旧的待使用码立即作废。</span></div>}
              {!locationReady && <div className="activation-error">老人居住地址或项目时区不完整，请先补齐老人档案和所属项目时区。</div>}
              <button className="primary-button activation-generate-button" disabled={!locationReady || !selectedDevice} onClick={generateActivation}>生成平板激活码</button>
            </div>
          ) : stage === "waiting" ? (
            <>
              <div className="activation-code-card"><div className="fake-qr" aria-label="激活二维码"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><div><span>6 位平板激活码</span><strong>{activation?.code || "------"}</strong><small>生成时间 {activation?.createdAt}</small></div><StatusTag>{activation?.status || "待使用"}</StatusTag></div>
              <div className="activation-device-preview"><div><span>指定老人</span><b>{record.name}</b></div><div><span>目标设备编号</span><b>{formatDisplayId(activation?.deviceId)}</b></div><div><span>设备 SN</span><b>{activation?.deviceSn || activationDevice?.sn}</b></div><div><span>设备型号</span><b>{activationDevice?.model || "—"}</b></div></div>
              {validationError && <div className="activation-error">{validationError}</div>}
              <div className="validation-demo-actions"><button onClick={() => failActivation("激活码不正确，本次激活已标记为失败，可重新生成激活码。")}>演示激活码错误</button><button onClick={() => failActivation("当前网络未连接，本次激活已标记为失败，可检查网络后重新生成。")}>演示网络异常</button></div>
            </>
          ) : stage === "identity" ? (
            <div className="identity-confirm-card"><span className="profile-avatar">{record.name.slice(-1)}</span><div><span>请确认使用人</span><h4>{record.name}</h4><p>{record.project} · {record.community}</p><small>{record.address.slice(0, 12)}****</small></div><StatusTag>待确认</StatusTag></div>
          ) : stage === "syncing" ? (
            <div className="syncing-panel"><span className="sync-spinner"><RefreshCw size={22}/></span><h4>正在准备老人平板</h4><p>正在同步老人基础信息、子女关系、联系人、提醒、居住地址与首页配置……</p><div><span className="done">老人身份已同步</span><span>居住地址与时区同步中</span><span>首页配置待同步</span></div></div>
          ) : (
            <div className="activation-success"><span><ShieldCheck size={26}/></span><h4>设备激活成功</h4><p>{record.name} 的身份、家人与基础配置已同步。</p><div><b>{selectedId}</b><StatusTag>已激活</StatusTag></div></div>
          )}
          {confirmUnbind && <div className="unbind-warning"><b>确认解除当前平板？</b><p>解除后该平板将无法进入老人首页，也不再接收该老人的提醒和家庭配置；老人档案、已绑定子女、历史记录及其他设备不受影响。</p></div>}
        </div>
        <footer>
          {currentTablet && stage !== "success" && !confirmUnbind && <button className="danger-outline-button" onClick={() => setConfirmUnbind(true)}>解除绑定</button>}
          {confirmUnbind ? <><button className="secondary-button" onClick={() => setConfirmUnbind(false)}>取消</button><button className="danger-button" onClick={() => onUnbind(currentTablet.id)}>确认解除</button></>
            : currentTablet && stage !== "success" ? <button className="secondary-button" onClick={onClose}>关闭</button>
              : stage === "waiting" ? <><button className="secondary-button" onClick={() => { setSelectedId(activation?.deviceId || ""); setStage("generate"); }}>重新生成激活码</button><button className="primary-button" disabled={activation?.status !== "待使用"} onClick={() => { setValidationError(""); setStage("identity"); }}>模拟设备校验通过</button></>
                : stage === "identity" ? <><button className="secondary-button" onClick={() => setStage("waiting")}>信息不正确</button><button className="primary-button" onClick={confirmIdentity}>确认绑定</button></>
                  : stage === "success" ? <button className="primary-button" onClick={onClose}>完成</button>
                    : <button className="secondary-button" onClick={onClose}>关闭</button>}
        </footer>
      </div>
    </div>
  );
}

function ProjectDrawer({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || "",
    community: project?.community || "",
    country: project?.country || "新加坡",
    city: project?.city || "新加坡",
    district: project?.district || "",
    address: project?.address || "",
    timezone: project?.timezone || "Asia/Singapore (UTC+8)",
    contact: project?.contact || "",
    phone: project?.phone || "",
  });
  const [errors, setErrors] = useState({});
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const save = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "请输入项目名称";
    if (!form.community.trim()) nextErrors.community = "请输入所属社区";
    if (!form.country.trim()) nextErrors.country = "请输入国家/地区";
    if (!form.city.trim()) nextErrors.city = "请输入城市";
    if (!form.district.trim()) nextErrors.district = "请输入区域";
    if (!form.address.trim()) nextErrors.address = "请输入项目详细地址";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const nextProject = Object.fromEntries(Object.entries({ ...project, ...form }).filter(([key]) => key !== "weatherLocation").map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
    onSave(nextProject);
  };
  return (
    <div className="drawer-layer">
      <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
      <aside className="drawer project-drawer" role="dialog" aria-modal="true">
        <header><div><h2>{project ? "编辑项目" : "新增项目"}</h2><p>维护项目归属、服务区域和联系信息</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
        <div className="drawer-body"><div className="form-section">
          <h3>项目信息</h3>
          <label><span>项目名称 *</span><input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="请输入项目名称"/>{errors.name && <small className="field-error">{errors.name}</small>}</label>
          <label><span>所属社区 *</span><input value={form.community} onChange={(event) => update("community", event.target.value)} placeholder="请输入社区名称"/>{errors.community && <small className="field-error">{errors.community}</small>}</label>
          <h3>项目位置</h3>
          <div className="form-row"><label><span>国家/地区 *</span><input value={form.country} onChange={(event) => update("country", event.target.value)} placeholder="例如：新加坡"/>{errors.country && <small className="field-error">{errors.country}</small>}</label><label><span>城市 *</span><input value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="例如：新加坡"/>{errors.city && <small className="field-error">{errors.city}</small>}</label></div>
          <div className="form-row"><label><span>区域 *</span><input value={form.district} onChange={(event) => update("district", event.target.value)} placeholder="例如：Toa Payoh"/>{errors.district && <small className="field-error">{errors.district}</small>}</label><label><span>时区 *</span><select className="select-control form-select-native" value={form.timezone} onChange={(event) => update("timezone", event.target.value)}><option>Asia/Singapore (UTC+8)</option><option>Asia/Shanghai (UTC+8)</option></select></label></div>
          <label><span>详细地址 *</span><input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="请输入项目服务点详细地址"/>{errors.address && <small className="field-error">{errors.address}</small>}</label>
          <h3>联系信息</h3>
          <div className="form-row"><label><span>项目联系人</span><input value={form.contact} onChange={(event) => update("contact", event.target.value)} placeholder="请输入联系人"/></label><label><span>联系电话</span><input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+65"/></label></div>
        </div></div>
        <footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={save}>保存项目</button></footer>
      </aside>
    </div>
  );
}

function ProjectPage({ projects, elderlyRecords, onSave, onToggle }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(undefined);
  const filtered = projects.filter((project) => `${project.name}${project.id}${project.community}${project.country}${project.city}${project.district}${project.address}${project.contact}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <>
      <div className="page-heading"><div><h1>项目与社区</h1><p>统一维护老人档案归属、项目位置和社区服务关系</p></div><button className="primary-button" onClick={() => setEditing(null)}><Plus size={16}/>新增项目</button></div>
      <section className="panel management-panel project-management">
        <div className="filters"><label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="项目名称、编码、社区或联系人"/></div></label></div>
        <div className="table-toolbar"><div><span className="result-count">共 {filtered.length} 个项目</span><span className="toolbar-hint">项目位置用于服务归属与运营管理</span></div></div>
        <div className="table-scroll"><table className="project-table"><thead><tr><th>项目名称</th><th>项目编码</th><th>项目位置</th><th>联系人</th><th>已归属老人</th><th>状态</th><th className="sticky-right">操作</th></tr></thead><tbody>
          {filtered.map((project) => {
            const count = elderlyRecords.filter((record) => record.project === project.name).length;
            return <tr key={project.id}><td><div className="project-name-cell"><span><Building2 size={17}/></span><div><b>{project.name}</b><small>{project.community}</small></div></div></td><td className="mono">{project.id}</td><td><div className="stacked-cell"><b>{project.country} · {project.city} · {project.district}</b><small>{project.address}</small></div></td><td><div className="stacked-cell"><b>{project.contact || "待补充"}</b><small>{project.phone || "电话待补充"}</small></div></td><td>{count} 位</td><td><StatusTag>{project.status}</StatusTag></td><td className="sticky-right"><button className="table-action" onClick={() => setEditing(project)}>编辑</button><button className={`table-action ${project.status === "启用" ? "danger-text" : ""}`} onClick={() => onToggle(project.id)}>{project.status === "启用" ? "停用" : "启用"}</button></td></tr>;
          })}
        </tbody></table></div>
        <div className="pagination"><span>当前展示 {filtered.length} 条数据</span></div>
      </section>
      {editing !== undefined && <ProjectDrawer project={editing} onClose={() => setEditing(undefined)} onSave={(project) => { onSave(project); setEditing(undefined); }}/>}
    </>
  );
}

function DeviceManagementPage({ deviceType, tablets, sensors, elderlyRecords, onAddTablet, onViewTablet, onManageTablet, onAddSensor, onViewSensor }) {
  const [query, setQuery] = useState("");
  const [project, setProject] = useState("全部项目");
  const [status, setStatus] = useState("全部状态");
  const projectOptions = ["全部项目", ...new Set(elderlyRecords.map((record) => record.project).filter(Boolean))];
  const filteredTablets = tablets.filter((device) => {
    const elderly = elderlyRecords.find((record) => record.id === device.boundElderlyId);
    const keywordMatched = `${device.id}${device.model}${elderly?.name || ""}`.toLowerCase().includes(query.trim().toLowerCase());
    const projectMatched = project === "全部项目" || elderly?.project === project;
    const statusMatched = status === "全部状态" || device.status === status;
    return keywordMatched && projectMatched && statusMatched;
  });
  const filteredSensors = sensors.filter((device) => {
    const elderly = elderlyRecords.find((record) => record.id === device.elderlyId);
    return `${device.id}${device.sn}${device.name}${elderly?.name || ""}${device.room}`.toLowerCase().includes(query.trim().toLowerCase()) && (status === "全部状态" || device.onlineStatus === status || device.installStatus === status);
  });
  const resetFilters = () => { setQuery(""); setProject("全部项目"); setStatus("全部状态"); };
  const statuses = deviceType === "tablet" ? ["全部状态", "在线", "离线", "待激活"] : ["全部状态", "在线", "离线", "待安装", "待校验", "已安装", "已解绑"];
  return (
    <>
      <div className="page-heading"><div><h1>{deviceType === "tablet" ? "平板设备" : "房间活动传感器"}</h1><p>{deviceType === "tablet" ? "维护平板资产、老人绑定、激活和在线状态" : "录入传感器、绑定老人和安装房间并完成设备校验"}</p></div><button className="primary-button" onClick={deviceType === "tablet" ? onAddTablet : onAddSensor}><Plus size={16}/>{deviceType === "tablet" ? "录入平板" : "添加传感器"}</button></div>
      <section className="panel management-panel device-management-panel">
        <div className="filters device-filters">
          <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={deviceType === "tablet" ? "设备编号、型号或老人姓名" : "设备名称、SN、老人或房间"}/></div></label>
          {deviceType === "tablet" && <label><span>所属项目</span><select className="select-control filter-select wide" value={project} onChange={(event) => setProject(event.target.value)}>{projectOptions.map((item) => <option key={item}>{item}</option>)}</select></label>}
          <label><span>状态</span><select className="select-control filter-select" value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="filter-actions"><button className="primary-button"><Search size={15}/>查询</button><button className="secondary-button" onClick={resetFilters}><RefreshCw size={15}/>重置</button></div>
        </div>
        <div className="table-toolbar"><div><span className="result-count">共 {deviceType === "tablet" ? filteredTablets.length : filteredSensors.length} 台设备</span><span className="toolbar-hint">{deviceType === "tablet" ? "一位老人一期保留一台当前主平板" : "只有通过安装校验的设备才进入房间活动统计"}</span></div></div>
        <div className="table-scroll">
          {deviceType === "tablet" ? <table className="device-table tablet-device-table"><thead><tr><th>设备编号 / 型号</th><th>绑定老人</th><th>所属项目</th><th>当前版本</th><th>版本状态</th><th>激活状态</th><th>在线状态</th><th>绑定时间</th><th className="sticky-right">操作</th></tr></thead><tbody>
            {filteredTablets.map((device) => { const elderly = elderlyRecords.find((record) => record.id === device.boundElderlyId); return <tr key={device.id}><td><div className="device-name-cell"><span><MonitorSmartphone size={17}/></span><div><b>{formatDisplayId(device.id)}</b><small>{device.model}</small></div></div></td><td>{elderly ? <div className="stacked-cell"><b>{elderly.name}</b></div> : <span className="muted-value">未绑定</span>}</td><td>{elderly?.project || "—"}</td><td className="mono">{device.currentVersion}</td><td><StatusTag>{device.versionStatus}</StatusTag></td><td><StatusTag>{device.boundElderlyId ? "已激活" : "待激活"}</StatusTag></td><td><StatusTag>{device.status}</StatusTag></td><td>{device.boundAt || "—"}</td><td className="sticky-right"><button className="table-action" onClick={() => onViewTablet(device)}>详情</button>{elderly && <button className="table-action" onClick={() => onManageTablet(elderly)}>管理绑定</button>}</td></tr>; })}
            {!filteredTablets.length && <tr><td colSpan="9"><div className="empty-table-state">没有符合条件的平板设备</div></td></tr>}
          </tbody></table> : <table className="device-table sensor-device-table"><thead><tr><th>设备名称 / SN</th><th>所属老人</th><th>安装房间</th><th>安装状态</th><th>运行状态</th><th>最近活动</th><th>最近上报</th><th>信号</th><th className="sticky-right">操作</th></tr></thead><tbody>
            {filteredSensors.map((device) => { const elderly = elderlyRecords.find((record) => record.id === device.elderlyId); return <tr key={device.id}><td><div className="device-name-cell sensor"><span><Activity size={17}/></span><div><b>{device.name}</b><small>{device.sn} · {device.model}</small></div></div></td><td>{elderly ? <div className="stacked-cell"><b>{elderly.name}</b><small>{elderly.address}</small></div> : <span className="muted-value">已解绑</span>}</td><td>{device.room || "—"}</td><td><StatusTag>{device.installStatus}</StatusTag></td><td><StatusTag>{device.onlineStatus}</StatusTag></td><td>{device.lastActivity || "—"}</td><td>{device.lastReport || "—"}</td><td>{device.signal || "—"}</td><td className="sticky-right"><button className="table-action" onClick={() => onViewSensor(device)}>详情</button></td></tr>; })}
            {!filteredSensors.length && <tr><td colSpan="9"><div className="empty-table-state">没有符合条件的房间活动传感器</div></td></tr>}
          </tbody></table>}
        </div>
        <div className="pagination"><span>当前展示 {deviceType === "tablet" ? filteredTablets.length : filteredSensors.length} 条数据</span></div>
      </section>
    </>
  );
}

function RecommendationStrategyPage({ strategies, policy, onSavePolicy, onCreate, onEdit, onToggle }) {
  const [activePool, setActivePool] = useState("wellness");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部状态");
  const [draftPolicy, setDraftPolicy] = useState(policy);
  const [saved, setSaved] = useState(false);
  const poolStrategies = strategies.filter((item) => item.pool === activePool);
  const rows = poolStrategies.filter((item) => {
    const keyword = query.trim().toLowerCase();
    return (!keyword || `${item.title}${item.id}${item.action}`.toLowerCase().includes(keyword)) && (status === "全部状态" || item.status === status);
  });
  const updatePolicy = (field, value) => setDraftPolicy((current) => ({ ...current, [field]: value }));
  const savePolicy = () => {
    onSavePolicy(draftPolicy);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  return (
    <>
      <div className="page-heading"><div><h1>推荐策略</h1><p>从安全资讯、社区活动和预约服务中选择内容，配置老人端每日推荐</p></div><button className="primary-button" onClick={onCreate}><Plus size={16}/>新增推荐策略</button></div>
      <section className="panel recommendation-policy-panel">
        <div className="recommendation-section-heading"><div><span><Settings size={18}/></span><div><h3>全局自动轮播规则</h3><p>规则保存后对所有启用的推荐内容生效</p></div></div><button className="primary-button" onClick={savePolicy}><Save size={15}/>{saved ? "已保存" : "保存规则"}</button></div>
        <div className="recommendation-policy-grid">
          <div className="policy-field policy-mode-field"><span>每日更换策略</span><div className="policy-radio-group"><label><input type="radio" name="recommendation-mode" checked={draftPolicy.mode === "random"} onChange={() => updatePolicy("mode", "random")}/><span><b>随机抽样</b><small>每日从当前内容池抽取 1 条未展示项</small></span></label><label><input type="radio" name="recommendation-mode" checked={draftPolicy.mode === "sequence"} onChange={() => updatePolicy("mode", "sequence")}/><span><b>顺序轮播</b><small>按列表添加顺序每日向后轮播 1 条</small></span></label></div></div>
          <label className="policy-field"><span>防重复保护</span><div className="policy-inline-control"><input type="number" min="1" max="30" value={draftPolicy.repeatDays} onChange={(event) => updatePolicy("repeatDays", Number(event.target.value))}/><em>天内已展示条目不再重复推送</em></div></label>
          <div className="policy-field policy-time-field">
            <span>场景化时段偏好</span>
            <div className="time-preference-row"><b>安全资讯池</b><input type="time" value={draftPolicy.wellnessStart} onChange={(event) => updatePolicy("wellnessStart", event.target.value)}/><i>至</i><input type="time" value={draftPolicy.wellnessEnd} onChange={(event) => updatePolicy("wellnessEnd", event.target.value)}/></div>
            <div className="time-preference-row"><b>社区活动池</b><input type="time" value={draftPolicy.communityStart} onChange={(event) => updatePolicy("communityStart", event.target.value)}/><i>至</i><input type="time" value={draftPolicy.communityEnd} onChange={(event) => updatePolicy("communityEnd", event.target.value)}/></div>
            <div className="time-preference-row"><b>预约服务池</b><input type="time" value={draftPolicy.serviceStart} onChange={(event) => updatePolicy("serviceStart", event.target.value)}/><i>至</i><input type="time" value={draftPolicy.serviceEnd} onChange={(event) => updatePolicy("serviceEnd", event.target.value)}/></div>
          </div>
        </div>
      </section>
      <section className="panel recommendation-pool-panel">
        <div className="recommendation-pool-tabs">{recommendationPools.map((pool) => { const count = strategies.filter((item) => item.pool === pool.key).length; return <button key={pool.key} className={activePool === pool.key ? "active" : ""} onClick={() => setActivePool(pool.key)}><span>{pool.icon}</span>{pool.label}<em>{count}</em></button>; })}</div>
        <div className="recommendation-list-toolbar">
          <div className="recommendation-list-filters"><div className="input-wrap"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、策略 ID 或动作"/></div><select className="select-control filter-select" value={status} onChange={(event) => setStatus(event.target.value)}><option>全部状态</option><option>启用</option><option>停用</option></select></div>
        </div>
        <div className="table-scroll">
          <table className="recommendation-table"><thead><tr><th className="strategy-check-column"><input type="checkbox" aria-label="全选当前内容池"/></th><th>策略 ID</th><th>展示标题 / 大球文案</th><th>关联资源</th><th>累计推送</th><th>上次推送</th><th>状态</th><th className="sticky-right">操作</th></tr></thead><tbody>
            {rows.map((item) => <tr key={item.id}><td className="strategy-check-column"><input type="checkbox" aria-label={`选择${item.title}`}/></td><td className="mono">{item.id}</td><td><div className="strategy-title-cell"><b>{item.title}</b><small>{recommendationPools.find((pool) => pool.key === item.pool)?.label}</small></div></td><td><div className="stacked-cell"><b>{item.resourceName || "原资源待重新关联"}</b><small>{item.resourceId || "未关联资源"}</small></div></td><td>{item.pushCount} 次</td><td>{item.lastPush || "尚未推送"}</td><td><button type="button" role="switch" aria-checked={item.status === "启用"} aria-label={`${item.title}状态`} className={`strategy-status-switch ${item.status === "启用" ? "active" : ""}`} onClick={() => onToggle(item.id)}><i/><span>{item.status}</span></button></td><td className="sticky-right"><button className="table-action" onClick={() => onEdit(item)}>编辑</button></td></tr>)}
            {!rows.length && <tr><td colSpan="8"><div className="empty-table-state">当前内容池暂无符合条件的推荐策略</div></td></tr>}
          </tbody></table>
        </div>
        <div className="pagination"><span>当前内容池共 {poolStrategies.length} 条，筛选后展示 {rows.length} 条</span></div>
      </section>
    </>
  );
}

function RecommendationStrategyDrawer({ record, safetyNews, activities, services, onClose, onSave }) {
  const resourceGroups = {
    safety: {
      label: "安全资讯",
      pool: "wellness",
      items: safetyNews.filter((item) => item.status === "已发布").map((item) => ({ id: item.id, name: item.title, category: item.category, summary: item.description || item.content, date: item.updatedAt, status: item.status })),
    },
    activity: {
      label: "社区活动",
      pool: "community",
      items: activities.filter((item) => item.status !== "已结束").map((item) => ({ id: item.id, name: item.title, category: item.category, summary: `${item.date} ${item.time} · ${item.location} · 已有 ${item.interestCount} 人表达意向`, date: item.publishedAt, status: item.status })),
    },
    service: {
      label: "预约服务",
      pool: "service",
      items: services.filter((item) => item.status === "启用").map((item) => ({ id: item.id, name: item.name, category: item.category, summary: `${item.description} · ${item.provider}`, date: item.updatedAt, status: item.status })),
    },
  };
  const [form, setForm] = useState(() => ({ resourceType: "safety", resourceId: "", resourceName: "", pool: "wellness", title: "", status: "启用", ...record }));
  const [errors, setErrors] = useState({});
  const [resourcePickerOpen, setResourcePickerOpen] = useState(false);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const currentGroup = resourceGroups[form.resourceType] || resourceGroups.safety;
  const selectedResource = currentGroup.items.find((item) => item.id === form.resourceId);
  const changeResourceType = (resourceType) => setForm((current) => ({ ...current, resourceType, resourceId: "", resourceName: "", pool: resourceGroups[resourceType].pool, title: "" }));
  const changeResource = (resource) => {
    setForm((current) => ({ ...current, resourceId: resource.id, resourceName: resource.name, title: resource.name }));
    setErrors((current) => ({ ...current, resourceId: "" }));
    setResourcePickerOpen(false);
  };
  const save = () => {
    const nextErrors = {};
    if (!form.resourceId) nextErrors.resourceId = "请选择关联资源";
    if (!form.title.trim()) nextErrors.title = "请输入前端展示文案";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const { action: _removedAction, target: _removedTarget, ...cleanForm } = form;
    onSave({ ...cleanForm, pool: currentGroup.pool, resourceName: selectedResource?.name || form.resourceName, title: form.title.trim() });
  };
  return (
    <div className="drawer-layer">
      <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
      <aside className="drawer recommendation-drawer" role="dialog" aria-modal="true" aria-label={record ? "编辑推荐策略" : "新增推荐策略"}>
        <header><div><h2>{record ? "编辑推荐策略" : "新增推荐策略"}</h2><p>从已发布的内容资源中选择推荐内容</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
        <div className="drawer-body"><div className="form-section">
          <h3>关联内容资源</h3>
          <label><span>资源类型 *</span><div className="strategy-resource-types">{Object.entries(resourceGroups).map(([key, group]) => <button type="button" key={key} className={form.resourceType === key ? "active" : ""} onClick={() => changeResourceType(key)}><b>{group.label}</b><small>{group.items.length} 条可用资源</small></button>)}</div></label>
          <label><span>选择资源 *</span><button type="button" className={`strategy-resource-picker-trigger ${selectedResource ? "selected" : ""}`} onClick={() => setResourcePickerOpen(true)}>{selectedResource ? <><span><b>{selectedResource.name}</b><small>{selectedResource.category} · {selectedResource.date}</small></span><em>更换</em></> : <><span><b>请选择{currentGroup.label}</b><small>可按标题、摘要、分类和日期辨别资源</small></span><em>选择</em></>}</button>{errors.resourceId && <small className="field-error">{errors.resourceId}</small>}</label>
          {selectedResource && <div className="strategy-resource-preview"><span>{currentGroup.label}</span><div><b>{selectedResource.name}</b><small>{selectedResource.summary}</small></div><em>{selectedResource.id}</em></div>}
          <label><span>前端展示文案（大球 / 卡片）*</span><input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="选择资源后自动带入，可按展示需要调整"/>{errors.title && <small className="field-error">{errors.title}</small>}</label>
          <label><span>策略状态 *</span><div className="strategy-enable-options"><button type="button" className={form.status === "启用" ? "active" : ""} onClick={() => update("status", "启用")}><b>立即加入轮播池</b><small>保存后参与每日推荐抽取</small></button><button type="button" className={form.status === "停用" ? "active" : ""} onClick={() => update("status", "停用")}><b>暂不启用</b><small>保存内容但不参与推送</small></button></div></label>
        </div></div>
        <footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={save}>保存策略</button></footer>
      </aside>
      {resourcePickerOpen && <RecommendationResourcePicker group={currentGroup} selectedId={form.resourceId} onClose={() => setResourcePickerOpen(false)} onConfirm={changeResource}/>} 
    </div>
  );
}

function RecommendationResourcePicker({ group, selectedId, onClose, onConfirm }) {
  const initialFilters = { query: "", category: "全部分类" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [selected, setSelected] = useState(selectedId);
  const categories = ["全部分类", ...new Set(group.items.map((item) => item.category).filter(Boolean))];
  const rows = [...group.items].filter((item) => {
    const keyword = filters.query.trim().toLowerCase();
    return (!keyword || [item.name, item.summary, item.category, item.date].some((value) => `${value || ""}`.toLowerCase().includes(keyword)))
      && (filters.category === "全部分类" || item.category === filters.category);
  }).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const selectedResource = group.items.find((item) => item.id === selected);
  const reset = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
  };
  return <div className="modal-layer recommendation-resource-picker-layer"><button className="modal-backdrop" aria-label="关闭资源选择弹窗" onClick={onClose}/><section className="recommendation-resource-picker" role="dialog" aria-modal="true" aria-label={`选择${group.label}`}>
    <header><div><h3>选择{group.label}</h3><p>按发布时间倒序展示，可结合摘要、分类和日期辨别内容</p></div><button className="icon-button" onClick={onClose}><X size={18}/></button></header>
    <div className="recommendation-resource-filters"><label><span>搜索资源</span><div className="input-wrap"><Search size={16}/><input autoFocus value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="标题、摘要、分类或日期"/></div></label><label><span>内容分类</span><select className="select-control form-select-native" value={draftFilters.category} onChange={(event) => setDraftFilters((current) => ({ ...current, category: event.target.value }))}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><div><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div></div>
    <div className="recommendation-resource-toolbar"><span>共 {rows.length} 条可用资源</span><span>最新内容优先</span></div>
    <div className="recommendation-resource-list">{rows.map((item) => <button type="button" key={item.id} className={`recommendation-resource-item ${selected === item.id ? "selected" : ""}`} onClick={() => setSelected(item.id)}><span className="resource-radio"/><span className="resource-main"><span><b>{item.name}</b><StatusTag>{item.status}</StatusTag></span><small>{item.summary || "暂无内容摘要"}</small></span><span className="resource-category"><small>分类</small><b>{item.category || "未分类"}</b></span><span className="resource-date"><small>上传/更新时间</small><b>{item.date || "时间待补充"}</b></span></button>)}{!rows.length && <div className="elderly-picker-empty"><Search size={22}/><b>未找到匹配资源</b><span>请调整搜索词或内容分类</span></div>}</div>
    <footer><span>{selectedResource ? `已选择：${selectedResource.name}` : "请选择一条资源"}</span><div><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" disabled={!selectedResource} onClick={() => onConfirm(selectedResource)}>确认选择</button></div></footer>
  </section></div>;
}

function getEmergencyEventMetrics(event) {
  const notificationCount = event.notifications.length;
  const deliveredCount = event.notifications.filter((item) => item.deliveryStatus === "已送达").length;
  const failedCount = event.notifications.filter((item) => item.deliveryStatus === "发送失败").length;
  const viewedCount = event.notifications.filter((item) => item.viewedAt).length;
  return { notificationCount, deliveredCount, failedCount, viewedCount };
}

function EmergencyHelpPage({ events, elderlyRecords, onOpen }) {
  const initialFilters = { query: "", project: "全部项目", status: "全部状态" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const today = "2026-07-28";
  const rows = events.map((event) => ({ ...event, elderly: elderlyRecords.find((item) => item.id === event.elderlyId), ...getEmergencyEventMetrics(event) })).filter((event) => {
    const keyword = filters.query.trim().toLowerCase();
    const matchesKeyword = !keyword || [event.id, event.elderly?.name, event.elderly?.phone, event.sourceDevice].some((value) => `${value || ""}`.toLowerCase().includes(keyword));
    const matchesProject = filters.project === "全部项目" || event.elderly?.project === filters.project;
    const matchesStatus = filters.status === "全部状态" || event.result === filters.status || event.status === filters.status;
    return matchesKeyword && matchesProject && matchesStatus;
  });
  const counts = {
    ongoing: events.filter((event) => event.status === "进行中").length,
    partialFailed: events.filter((event) => event.status === "进行中" && getEmergencyEventMetrics(event).failedCount > 0).length,
    mistaken: events.filter((event) => event.startedAt.startsWith(today) && event.endReason === "老人误触").length,
    ended: events.filter((event) => event.startedAt.startsWith(today) && event.status === "已结束").length,
  };
  const projects = ["全部项目", ...new Set(elderlyRecords.map((record) => record.project))];
  const reset = () => { setDraftFilters(initialFilters); setFilters(initialFilters); };

  return <>
    <div className="page-heading"><div><h1>紧急求助</h1><p>跟进老人发起的紧急求助，查看联系人通知、子女查看和事件处理结果</p></div></div>
    <div className="emergency-overview-grid">
      <div><span>进行中</span><b>{counts.ongoing}</b><small>需要运营人员持续跟进</small></div>
      <div><span>部分通知失败</span><b className={counts.partialFailed ? "danger" : ""}>{counts.partialFailed}</b><small>存在未成功送达的联系人</small></div>
      <div><span>今日误触</span><b>{counts.mistaken}</b><small>已确认由老人误触发起</small></div>
      <div><span>今日已结束</span><b>{counts.ended}</b><small>已填写结束原因和处理备注</small></div>
    </div>
    <section className="panel management-panel emergency-help-panel">
      <div className="filters emergency-help-filters">
        <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="老人姓名、手机号、设备或事件编号"/></div></label>
        <label><span>所属项目</span><select className="select-control filter-select wide" value={draftFilters.project} onChange={(event) => setDraftFilters((current) => ({ ...current, project: event.target.value }))}>{projects.map((project) => <option key={project}>{project}</option>)}</select></label>
        <label><span>当前结果</span><select className="select-control filter-select" value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}>{["全部状态", "进行中", "部分通知失败", "等待处理", "误触已结束", "已结束"].map((status) => <option key={status}>{status}</option>)}</select></label>
        <div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div>
      </div>
      <div className="table-toolbar"><div><span className="result-count">共 {rows.length} 条求助事件</span><span className="toolbar-hint">优先处理进行中和部分通知失败的事件</span></div><button className="icon-button" title="刷新"><RefreshCw size={16}/></button></div>
      <div className="table-scroll"><table className="emergency-help-table"><thead><tr><th>老人</th><th>发起时间</th><th>来源设备</th><th>通知人数</th><th>送达数量</th><th>失败数量</th><th>已查看数量</th><th>当前结果</th><th className="sticky-right">操作</th></tr></thead><tbody>
        {rows.map((event) => <tr key={event.id}><td>{event.elderly ? <button className="emergency-elderly-cell" onClick={() => onOpen(event)}><span>{event.elderly.name.slice(-1)}</span><div><b>{event.elderly.name}</b><small>{event.elderly.project}</small></div></button> : "老人档案已移除"}</td><td><div className="stacked-cell"><b>{event.startedAt}</b><small>{event.id}</small></div></td><td><div className="stacked-cell"><b>{event.sourceDevice}</b><small>{event.sourceDeviceId}</small></div></td><td>{event.notificationCount} 人</td><td><b className="metric-success">{event.deliveredCount}</b></td><td><b className={event.failedCount ? "metric-danger" : ""}>{event.failedCount}</b></td><td>{event.viewedCount}</td><td><StatusTag>{event.result}</StatusTag></td><td className="sticky-right"><button className="table-action" onClick={() => onOpen(event)}>详情</button></td></tr>)}
        {!rows.length && <tr><td colSpan="9"><div className="empty-table-state">暂无符合条件的紧急求助事件</div></td></tr>}
      </tbody></table></div>
      <div className="pagination"><span>当前展示 {rows.length} 条数据</span></div>
    </section>
  </>;
}

function EmergencyHelpDrawer({ event, elderly, onClose, onRetry, onEnd }) {
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const metrics = getEmergencyEventMetrics(event);
  const emergencyContacts = event.notifications.filter((item) => item.recipientType === "紧急联系人");
  const children = event.notifications.filter((item) => item.recipientType === "子女");
  const notificationRows = (records, emptyText, showViewStatus = false) => <div className="emergency-contact-table-wrap"><table className="emergency-contact-table"><thead><tr><th>姓名 / 关系</th><th>联系电话</th><th>{showViewStatus ? "通知结果" : "送达结果"}</th>{showViewStatus && <th>查看状态</th>}<th>失败原因 / 重试</th><th>操作</th></tr></thead><tbody>{records.map((contact) => <tr key={contact.id}><td><div className="stacked-cell"><b>{contact.name}</b><small>{contact.relation}</small></div></td><td>{contact.phone}</td><td><StatusTag>{contact.deliveryStatus}</StatusTag></td>{showViewStatus && <td>{contact.viewedAt ? <div className="stacked-cell"><b>已查看</b><small>{contact.viewedAt}</small></div> : <StatusTag>未查看</StatusTag>}</td>}<td><div className="stacked-cell"><b>{contact.failureReason || "—"}</b><small>{contact.retryCount ? `已重试 ${contact.retryCount} 次` : `最近发送 ${contact.lastAttemptAt}`}</small></div></td><td>{contact.deliveryStatus === "发送失败" ? <button className="table-action" onClick={() => onRetry(event.id, contact.id)}>重新通知</button> : "—"}</td></tr>)}{!records.length && <tr><td colSpan={showViewStatus ? 6 : 5}><div className="empty-table-state">{emptyText}</div></td></tr>}</tbody></table></div>;
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer emergency-help-drawer" role="dialog" aria-modal="true" aria-label="紧急求助详情">
    <header><div><h2>紧急求助详情</h2><p>{event.id} · {event.startedAt}</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
    <div className="drawer-body">
      <div className="emergency-event-hero"><span><AlertTriangle size={22}/></span><div><small>当前结果</small><h3>{event.result}</h3><p>{metrics.deliveredCount} 人送达 · {metrics.failedCount} 人失败 · {metrics.viewedCount} 人已查看</p></div><StatusTag>{event.status}</StatusTag></div>
      <section className="detail-section"><h3>老人及发起信息</h3><div className="info-grid"><div><span>老人姓名</span><b>{elderly?.name || "老人档案已移除"}</b></div><div><span>联系电话</span><b>{elderly?.phone || "待补充"}</b></div><div><span>所属项目</span><b>{elderly?.project || "—"}</b></div><div><span>所属社区</span><b>{elderly?.community || "—"}</b></div><div className="full"><span>档案地址</span><b>{elderly?.address || "—"}</b></div><div><span>发起设备</span><b>{event.sourceDevice}</b></div><div><span>发起时间</span><b>{event.startedAt}</b></div></div></section>
      <section className="detail-section"><div className="detail-section-title"><h3>紧急联系人通知结果</h3><span className="relation-count">{emergencyContacts.length} 人</span></div>{notificationRows(emergencyContacts, "未配置紧急联系人")}</section>
      <section className="detail-section"><div className="detail-section-title"><h3>子女查看状态</h3><span className="relation-count">{children.length} 人</span></div>{notificationRows(children, "暂无已绑定子女", true)}</section>
      <section className="detail-section"><h3>事件时间线</h3><div className="emergency-timeline">{event.timeline.map((item, index) => <div key={`${item.time}-${index}`}><i/><span>{item.time}</span><div><b>{item.title}</b><p>{item.detail}</p></div></div>)}</div></section>
      {event.status === "已结束" && <section className="detail-section emergency-end-result"><h3>结束信息</h3><div className="info-grid"><div><span>结束原因</span><b>{event.endReason}</b></div><div><span>结束时间</span><b>{event.endedAt}</b></div><div><span>操作人</span><b>{event.endedBy}</b></div><div className="full"><span>处理备注</span><b>{event.endNote}</b></div></div></section>}
    </div>
    <footer><button className="secondary-button" onClick={onClose}>关闭</button>{event.status === "进行中" && <button className="danger-button" onClick={() => setEndDialogOpen(true)}>结束事件</button>}</footer>
  </aside>{endDialogOpen && <EmergencyEndDialog elderlyName={elderly?.name || "该老人"} onClose={() => setEndDialogOpen(false)} onConfirm={(result) => { onEnd(event.id, result); setEndDialogOpen(false); }}/>}</div>;
}

function EmergencyEndDialog({ elderlyName, onClose, onConfirm }) {
  const [reason, setReason] = useState("老人确认安全");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    if (!note.trim()) { setError("请填写处理备注"); return; }
    onConfirm({ reason, note: note.trim() });
  };
  return <div className="modal-layer emergency-end-modal"><button className="modal-backdrop" aria-label="关闭结束确认" onClick={onClose}/><section className="confirm-dialog emergency-end-dialog" role="dialog" aria-modal="true" aria-label="结束紧急求助事件"><span className="confirm-icon danger"><AlertTriangle size={20}/></span><h3>结束 {elderlyName} 的求助事件</h3><p>结束后事件不再显示为进行中，请确认老人安全或已有人员接手。</p><label><span>结束原因 *</span><select className="select-control form-select-native" value={reason} onChange={(event) => setReason(event.target.value)}><option>老人确认安全</option><option>老人误触</option><option>家属已接手</option><option>工作人员到场</option><option>其他</option></select></label><label><span>处理备注 *</span><textarea rows="3" value={note} onChange={(event) => { setNote(event.target.value); setError(""); }} placeholder="说明核实过程和当前处理结果"/>{error && <small className="field-error">{error}</small>}</label><div><button className="secondary-button" onClick={onClose}>取消</button><button className="danger-button" onClick={submit}>确认结束</button></div></section></div>;
}

function ReminderManagementPage({ reminders, elderlyRecords, onCreate, onEdit, onDelete, onViewPlan }) {
  const initialFilters = { query: "", type: "全部类型", date: "" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const rows = reminders.map((reminder) => ({
    ...reminder,
    elderly: elderlyRecords.find((record) => record.id === reminder.elderlyId),
  })).filter((reminder) => {
    const keyword = filters.query.trim().toLowerCase();
    const matchesKeyword = !keyword || [reminder.title, reminder.elderly?.name, reminder.elderly?.phone, reminder.elderly?.project].some((field) => `${field || ""}`.toLowerCase().includes(keyword));
    return matchesKeyword && (filters.type === "全部类型" || reminder.type === filters.type) && (!filters.date || reminder.date === filters.date);
  });
  const reset = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
  };
  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 2600);
  };
  const confirmDelete = () => {
    const result = onDelete(deleteTarget.id);
    if (result?.ok === false) {
      setDeleteError("删除失败，请重试。");
      showFeedback("error", "删除失败，提醒仍保留在列表中，请重试。");
      return;
    }
    const title = deleteTarget.title;
    setDeleteTarget(null);
    setDeleteError("");
    showFeedback("success", `“${title}”已删除`);
  };

  return (
    <>
      <div className="page-heading"><div><h1>提醒事项</h1><p>为老人创建用药或日常提醒，并同步显示到老人档案</p></div><button className="primary-button" onClick={onCreate}><Plus size={16}/>新建提醒</button></div>
      <section className="panel management-panel reminder-management-panel">
        <div className="filters reminder-filters">
          <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="提醒名称、老人姓名或手机号"/></div></label>
          <label><span>提醒类型</span><select className="select-control filter-select" value={draftFilters.type} onChange={(event) => setDraftFilters((current) => ({ ...current, type: event.target.value }))}><option>全部类型</option><option>用药提醒</option><option>日常提醒</option></select></label>
          <label><span>提醒日期</span><input className="select-control filter-select" type="date" value={draftFilters.date} onChange={(event) => setDraftFilters((current) => ({ ...current, date: event.target.value }))}/></label>
          <div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div>
        </div>
        <div className="table-scroll">
          <table className="reminder-table">
            <thead><tr><th>提醒名称</th><th>所属老人</th><th>提醒类型</th><th>提醒时间</th><th>重复方式</th><th>创建信息</th><th className="sticky-right">操作</th></tr></thead>
            <tbody>
              {rows.map((reminder) => <tr key={reminder.id}><td><div className="reminder-name-cell"><span><Bell size={16}/></span><div><b>{reminder.title}</b><small>{reminder.note || "暂无补充说明"}</small></div></div></td><td>{reminder.elderly ? <div className="stacked-cell"><b>{reminder.elderly.name}</b><small>{reminder.elderly.project}</small></div> : "老人档案已移除"}</td><td><StatusTag>{reminder.type}</StatusTag></td><td><div className="stacked-cell"><b>{reminder.date}</b><small>{reminder.time} · 老人当地时间</small></div></td><td>{reminder.repeat}</td><td><div className="stacked-cell"><b>{reminder.createdBy}</b><small>{reminder.createdAt}</small></div></td><td className="sticky-right"><button className="table-action" onClick={() => onViewPlan(reminder)}>详细计划</button><button className="table-action" onClick={() => onEdit(reminder)}>编辑</button><button className="table-action danger-text" onClick={() => { setDeleteTarget(reminder); setDeleteError(""); }}>删除提醒</button></td></tr>)}
              {!rows.length && <tr><td colSpan="7"><div className="empty-table-state">暂无提醒事项，请新建提醒或调整筛选条件</div></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="pagination"><span>当前展示 {rows.length} 条数据</span></div>
      </section>
      {deleteTarget && <div className="modal-layer"><button className="modal-backdrop" aria-label="关闭删除确认" onClick={() => setDeleteTarget(null)}/><section className="confirm-dialog" role="dialog" aria-modal="true" aria-label="删除提醒"><span className="confirm-icon danger"><Trash2 size={20}/></span><h3>删除“{deleteTarget.title}”？</h3><p>删除后该提醒会从当前列表移除，并且不再产生后续提醒。</p>{deleteError && <div className="reminder-delete-error"><AlertTriangle size={15}/>{deleteError}</div>}<div><button className="secondary-button" onClick={() => setDeleteTarget(null)}>取消</button><button className="danger-button" onClick={confirmDelete}>{deleteError ? "重试删除" : "确认删除"}</button></div></section></div>}
      {feedback && <div className={`reminder-feedback ${feedback.type}`}><span>{feedback.type === "success" ? <ShieldCheck size={16}/> : <AlertTriangle size={16}/>}</span>{feedback.message}</div>}
    </>
  );
}

function ReminderDrawer({ record, elderlyRecords, onClose, onSave }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() => ({ elderlyId: "", type: "日常提醒", title: "", date: "2026-07-30", time: "09:00", repeat: "仅一次", note: "", ...record }));
  const elderly = elderlyRecords.find((record) => record.id === form.elderlyId || formatDisplayId(record.id) === form.elderlyId);
  const elderlyProject = initialProjects.find((project) => project.name === elderly?.project);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const selectElderly = (elderlyId) => {
    update("elderlyId", elderlyId);
    setErrors((current) => ({ ...current, elderlyId: "" }));
    setPickerOpen(false);
  };
  const save = () => {
    const nextErrors = {};
    if (!elderly) nextErrors.elderlyId = "请选择所属老人";
    if (!form.title.trim()) nextErrors.title = "请输入提醒名称";
    if (!form.date) nextErrors.date = "请选择提醒日期";
    if (!form.time) nextErrors.time = "请选择提醒时间";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ ...form, elderlyId: elderly.id, title: form.title.trim(), note: form.note.trim() });
  };

  return (
    <div className="drawer-layer">
      <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
      <aside className="drawer reminder-drawer" role="dialog" aria-modal="true" aria-label={record ? "编辑提醒" : "新建提醒"}>
        <header><div><h2>{record ? "编辑提醒" : "新建提醒"}</h2><p>{record ? "修改后将同步更新老人档案中的提醒" : "选择老人并设置提醒内容，保存后同步到老人档案"}</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
        <div className="drawer-body">
          <div className="form-section">
            <h3>提醒对象</h3>
            <label><span>所属老人 *</span><button type="button" className="elderly-picker-trigger" onClick={() => setPickerOpen(true)}>{elderly ? <><span><b>{elderly.name}</b><small>{formatDisplayId(elderly.id)} · {elderly.project}</small></span><em>更换</em></> : <><span className="placeholder">请选择所属老人</span><em>选择</em></>}</button>{errors.elderlyId && <small className="field-error">{errors.elderlyId}</small>}</label>
            {elderly && <div className="selected-elderly-card"><Home size={18}/><div><b>{elderly.address}</b><small>{elderly.project} · {elderly.community} · 按老人当地时间 {elderlyProject?.timezone || "Asia/Singapore (UTC+8)"}</small></div></div>}
            <h3>提醒内容</h3>
            <label><span>提醒类型 *</span><div className="reminder-type-options"><button type="button" className={form.type === "用药提醒" ? "active" : ""} onClick={() => update("type", "用药提醒")}><Bell size={17}/>用药提醒</button><button type="button" className={form.type === "日常提醒" ? "active" : ""} onClick={() => update("type", "日常提醒")}><CalendarDays size={17}/>日常提醒</button></div></label>
            <label><span>提醒名称 *</span><input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder={form.type === "用药提醒" ? "例如：早间降压药" : "例如：下午去复诊"}/>{errors.title && <small className="field-error">{errors.title}</small>}</label>
            <div className="form-row"><label><span>提醒日期 *</span><input type="date" value={form.date} onChange={(event) => update("date", event.target.value)}/>{errors.date && <small className="field-error">{errors.date}</small>}</label><label><span>提醒时间 *</span><input type="time" value={form.time} onChange={(event) => update("time", event.target.value)}/>{errors.time && <small className="field-error">{errors.time}</small>}</label></div>
            <label><span>重复方式 *</span><div className="reminder-repeat-options">{["仅一次", "每天", "每周四"].map((item) => <button type="button" className={form.repeat === item ? "active" : ""} key={item} onClick={() => update("repeat", item)}>{item}</button>)}</div></label>
            <label><span>事项说明（选填）</span><textarea rows="4" value={form.note} onChange={(event) => update("note", event.target.value)} placeholder="请输入用药剂量、就诊准备等补充说明"/></label>
          </div>
        </div>
        <footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={save}>{record ? "保存修改" : "保存提醒"}</button></footer>
      </aside>
      {pickerOpen && <ElderlyPickerModal records={elderlyRecords} value={form.elderlyId} onClose={() => setPickerOpen(false)} onConfirm={selectElderly}/>}
    </div>
  );
}

function ReminderPlanDrawer({ reminder, elderly, onClose }) {
  const project = initialProjects.find((item) => item.name === elderly?.project);
  const occurrences = reminder.occurrences || [];
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭详细计划" onClick={onClose}/><aside className="drawer reminder-plan-drawer" role="dialog" aria-modal="true" aria-label="提醒详细计划"><header><div><h2>提醒详细计划</h2><p>{reminder.title} · {elderly?.name || "老人档案已移除"}</p></div><button className="icon-button" aria-label="关闭详细计划" onClick={onClose}><X size={19}/></button></header><div className="drawer-body">
    <section className="detail-section"><h3>提醒定义</h3><div className="info-grid"><div><span>提醒类型</span><StatusTag>{reminder.type}</StatusTag></div><div><span>所属老人</span><b>{elderly?.name || "老人档案已移除"}</b></div><div><span>开始日期</span><b>{reminder.date}</b></div><div><span>提醒时间</span><b>{reminder.time}</b></div><div><span>重复方式</span><b>{reminder.repeat}</b></div><div><span>时间口径</span><b>老人当地时间</b></div><div className="full"><span>IANA 时区</span><b>{project?.timezone || "Asia/Singapore (UTC+8)"}</b></div><div className="full"><span>事项说明</span><b>{reminder.note || "暂无补充说明"}</b></div></div></section>
    <section className="detail-section"><div className="detail-section-title"><h3>执行实例</h3><span className="relation-count">{occurrences.length} 条</span></div><p className="reminder-plan-caption">执行状态只属于某一次提醒，不作为提醒定义字段。</p><div className="table-scroll"><table className="reminder-plan-table"><thead><tr><th>计划日期</th><th>提醒时间</th><th>执行状态</th><th>结果时间</th></tr></thead><tbody>{occurrences.map((item) => <tr key={item.id}><td>{item.date}</td><td>{item.time}</td><td><StatusTag>{item.status}</StatusTag></td><td>{item.resultAt}</td></tr>)}{!occurrences.length && <tr><td colSpan="4"><div className="empty-table-state">暂无已生成的执行实例</div></td></tr>}</tbody></table></div></section>
    <section className="detail-section"><h3>管理信息</h3><div className="info-grid"><div><span>创建人</span><b>{reminder.createdBy}</b></div><div><span>创建时间</span><b>{reminder.createdAt}</b></div><div><span>最近修改人</span><b>{reminder.updatedBy || reminder.createdBy}</b></div><div><span>最近修改时间</span><b>{reminder.updatedAt || reminder.createdAt}</b></div></div></section>
    <div className="form-tip"><ShieldCheck size={18}/><div><b>后台仅查看执行结果</b><p>后台不能代替老人确认已服药或已完成；删除提醒定义只停止后续实例，已发生记录不被改写。</p></div></div>
  </div><footer><button className="secondary-button" onClick={onClose}>关闭</button></footer></aside></div>;
}

function TabletAssetDrawer({ device, devices, onClose, onSave }) {
  const [form, setForm] = useState({ id: "", sn: "", model: "U2G Home 14" });
  const [errors, setErrors] = useState({});
  const save = () => {
    const nextErrors = {};
    if (!form.id.trim()) nextErrors.id = "请输入设备编号";
    if (devices.some((item) => item.id.toLowerCase() === form.id.trim().toLowerCase())) nextErrors.id = "该设备编号已存在";
    if (!form.sn.trim()) nextErrors.sn = "请输入设备 SN";
    if (devices.some((item) => item.sn?.toLowerCase() === form.sn.trim().toLowerCase())) nextErrors.sn = "该设备 SN 已存在";
    if (!form.model.trim()) nextErrors.model = "请输入设备型号";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ id: form.id.trim(), sn: form.sn.trim(), model: form.model.trim(), currentVersion: "v2.6.0", versionStatus: "已最新", activationCode: "", activationMethod: "", operator: "", status: "待激活", boundElderlyId: null, boundAt: "", lastOnline: "尚未激活" });
  };
  if (device) return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer device-detail-drawer" role="dialog" aria-modal="true"><header><div><h2>平板设备详情</h2><p>{formatDisplayId(device.id)} · {device.model}</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="device-hero"><span><MonitorSmartphone size={24}/></span><div><h3>{device.model}</h3><p>{formatDisplayId(device.id)} · {device.sn}</p></div><StatusTag>{device.status}</StatusTag></div><section className="detail-section"><h3>设备状态</h3><div className="info-grid"><div><span>设备编号</span><b>{formatDisplayId(device.id)}</b></div><div><span>设备 SN</span><b>{device.sn}</b></div><div><span>当前版本</span><b>{device.currentVersion}</b></div><div><span>版本状态</span><StatusTag>{device.versionStatus}</StatusTag></div><div><span>激活状态</span><b>{device.boundElderlyId ? "已激活" : "待激活"}</b></div><div><span>最近在线</span><b>{device.lastOnline}</b></div><div><span>绑定时间</span><b>{device.boundAt || "尚未绑定"}</b></div><div><span>激活方式</span><b>{device.activationMethod || "尚未激活"}</b></div></div></section><div className="form-tip"><ShieldCheck size={18}/><div><b>平板绑定规则</b><p>平板与老人的激活和解绑需从老人档案或已绑定设备的“管理绑定”入口完成。</p></div></div></div><footer><button className="secondary-button" onClick={onClose}>关闭</button></footer></aside></div>;
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer device-detail-drawer" role="dialog" aria-modal="true"><header><div><h2>录入平板设备</h2><p>先登记设备资产，激活时再绑定老人</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="form-section"><h3>设备信息</h3><label><span>设备编号 *</span><input value={form.id} onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))} placeholder="例如：TAB-20260034"/>{errors.id && <small className="field-error">{errors.id}</small>}</label><label><span>设备 SN *</span><input value={form.sn} onChange={(event) => setForm((current) => ({ ...current, sn: event.target.value }))} placeholder="例如：SN-TAB-260034"/>{errors.sn && <small className="field-error">{errors.sn}</small>}</label><label><span>设备型号 *</span><input value={form.model} onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}/>{errors.model && <small className="field-error">{errors.model}</small>}</label></div><div className="form-tip"><ShieldCheck size={18}/><div><b>录入后状态</b><p>新设备保存后进入“待激活”，不会自动绑定任何老人。</p></div></div></div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={save}>保存设备</button></footer></aside></div>;
}

function ElderlyPickerModal({ records, value, onClose, onConfirm }) {
  const initialFilters = { query: "", project: "全部项目" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedId, setSelectedId] = useState(value);
  const projectOptions = ["全部项目", ...new Set(records.map((record) => record.project).filter(Boolean))];
  const filteredRecords = records.filter((record) => {
    const keyword = filters.query.trim().toLowerCase();
    const matchesKeyword = !keyword || [
      record.name,
      formatDisplayId(record.id),
      record.phone,
      record.project,
      record.community,
      record.address,
    ].some((field) => `${field || ""}`.toLowerCase().includes(keyword));
    return matchesKeyword && (filters.project === "全部项目" || record.project === filters.project);
  });
  const searchRecords = () => setFilters(draftFilters);
  const resetFilters = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
  };

  return (
    <div className="modal-layer elderly-picker-layer">
      <button className="modal-backdrop" aria-label="关闭老人选择弹窗" onClick={onClose}/>
      <section className="elderly-picker-dialog" role="dialog" aria-modal="true" aria-label="选择所属老人">
        <header>
          <div><h3>选择所属老人</h3><p>可按老人信息或所属项目快速查找</p></div>
          <button className="icon-button" onClick={onClose}><X size={18}/></button>
        </header>
        <div className="elderly-picker-filters">
          <label>
            <span>搜索老人</span>
            <div className="input-wrap"><Search size={16}/><input autoFocus value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") searchRecords(); }} placeholder="姓名、电话、档案号或地址"/></div>
          </label>
          <label>
            <span>所属项目</span>
            <select className="select-control form-select-native" value={draftFilters.project} onChange={(event) => setDraftFilters((current) => ({ ...current, project: event.target.value }))}>
              {projectOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <div className="elderly-picker-filter-actions">
            <button className="primary-button" onClick={searchRecords}><Search size={15}/>查询</button>
            <button className="secondary-button" onClick={resetFilters}><RefreshCw size={15}/>重置</button>
          </div>
        </div>
        <div className="elderly-picker-toolbar">共 {filteredRecords.length} 位老人</div>
        <div className="elderly-picker-list">
          {filteredRecords.map((record) => {
            const selected = selectedId === formatDisplayId(record.id);
            return (
              <button
                type="button"
                className={`elderly-picker-item ${selected ? "selected" : ""}`}
                key={record.id}
                onClick={() => setSelectedId(formatDisplayId(record.id))}
              >
                <span className="elderly-picker-avatar">{record.name?.slice(-1)}</span>
                <span className="elderly-picker-main">
                  <span><b>{record.name}</b><small>{formatDisplayId(record.id)}</small></span>
                  <small>{record.project} · {record.community}</small>
                  <small>{record.address || "地址待补充"}</small>
                </span>
                <span className="elderly-picker-meta">
                  <small>已定义房间</small>
                  <b>{record.rooms?.length || 0} 个</b>
                </span>
                <i aria-hidden="true"/>
              </button>
            );
          })}
          {!filteredRecords.length && (
            <div className="elderly-picker-empty"><Search size={22}/><b>未找到匹配的老人</b><span>请调整搜索词或所属项目</span></div>
          )}
        </div>
        <footer>
          <span>{selectedId ? "已选择 1 位老人" : "请选择一位老人"}</span>
          <div><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" disabled={!selectedId} onClick={() => onConfirm(selectedId)}>确认选择</button></div>
        </footer>
      </section>
    </div>
  );
}

function SensorInstallDrawer({ sensors, elderlyRecords, initialElderlyId = "", onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [onlinePassed, setOnlinePassed] = useState(false);
  const [activityPassed, setActivityPassed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [form, setForm] = useState({ sn: "", name: "房间活动感知器", model: "U2G Motion S1", elderlyId: formatDisplayId(initialElderlyId), room: "", installer: "赵亚男" });
  const elderly = elderlyRecords.find((record) => record.id === form.elderlyId || formatDisplayId(record.id) === form.elderlyId);
  const roomName = form.room;
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const selectElderly = (elderlyId) => {
    setForm((current) => ({ ...current, elderlyId, room: "" }));
    setErrors((current) => ({ ...current, elderlyId: "" }));
    setPickerOpen(false);
  };
  const next = () => {
    const nextErrors = {};
    if (step === 1) {
      if (!form.sn.trim()) nextErrors.sn = "请输入设备 SN";
      if (sensors.some((item) => item.sn.toLowerCase() === form.sn.trim().toLowerCase())) nextErrors.sn = "该设备 SN 已存在";
      if (!form.name.trim()) nextErrors.name = "请输入设备名称";
      if (!form.model.trim()) nextErrors.model = "请输入设备型号";
    } else if (step === 2) {
      if (!form.elderlyId) nextErrors.elderlyId = "请选择老人";
      if (elderly && (!elderly.address || elderly.address === "待补充")) nextErrors.elderlyId = "该老人居住地址未补充，不能安装设备";
      if (!roomName) nextErrors.room = "请选择或新建安装房间";
    }
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) setStep((current) => current + 1);
  };
  const complete = () => onSave({ sn: form.sn.trim(), name: form.name.trim(), model: form.model.trim(), elderlyId: elderly?.id || form.elderlyId, room: roomName, installStatus: "已安装", onlineStatus: "在线", lastReport: "刚刚", lastActivity: "刚刚", signal: "良好", installer: form.installer.trim() || "赵亚男", installedAt: new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-") });

  return (
    <div className="drawer-layer">
      <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
      <aside className="drawer sensor-install-drawer" role="dialog" aria-modal="true">
        <header><div><h2>添加房间活动传感器</h2><p>第 {step} 步，共 3 步 · {step === 1 ? "设备录入" : step === 2 ? "老人和房间绑定" : "安装校验"}</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
        <div className="drawer-body">
          <div className="install-stepper">{["录入设备", "绑定房间", "安装校验"].map((label, index) => <div className={step > index + 1 ? "done" : step === index + 1 ? "active" : ""} key={label}><i>{step > index + 1 ? "✓" : index + 1}</i><span>{label}</span></div>)}</div>
          {step === 1 ? (
            <div className="form-section">
              <h3>设备资产</h3>
              <label><span>设备 SN *</span><input value={form.sn} onChange={(event) => update("sn", event.target.value)} placeholder="扫描二维码或输入 SN"/>{errors.sn && <small className="field-error">{errors.sn}</small>}</label>
              <label><span>设备名称 *</span><input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="例如：客厅活动感知器"/>{errors.name && <small className="field-error">{errors.name}</small>}</label>
              <div className="form-row"><label><span>设备型号 *</span><input value={form.model} onChange={(event) => update("model", event.target.value)}/>{errors.model && <small className="field-error">{errors.model}</small>}</label><label><span>安装人员</span><input value={form.installer} onChange={(event) => update("installer", event.target.value)}/></label></div>
            </div>
          ) : step === 2 ? (
            <div className="form-section">
              <h3>老人和家庭空间</h3>
              <label>
                <span>所属老人 *</span>
                <button type="button" className="elderly-picker-trigger" disabled={Boolean(initialElderlyId)} onClick={() => setPickerOpen(true)}>
                  {elderly ? <><span><b>{elderly.name}</b><small>{formatDisplayId(elderly.id)} · {elderly.project}</small></span><em>{initialElderlyId ? "已锁定" : "更换"}</em></> : <><span className="placeholder">请选择所属老人</span><em>选择</em></>}
                </button>
                {errors.elderlyId && <small className="field-error">{errors.elderlyId}</small>}
              </label>
              {elderly && <div className="selected-elderly-card"><Home size={18}/><div><b>{elderly.address}</b><small>{elderly.project} · {elderly.community}</small></div></div>}
              <label><span>安装房间 *</span><select className="select-control form-select-native" value={form.room} onChange={(event) => update("room", event.target.value)} disabled={!elderly || !elderly.rooms?.length}><option value="">请选择已定义房间</option>{elderly?.rooms?.map((room) => <option key={room}>{room}</option>)}</select>{errors.room && <small className="field-error">{errors.room}</small>}</label>
              <div className="form-tip"><ShieldCheck size={18}/><div><b>先定义空间，再绑定设备</b><p>{elderly?.rooms?.length ? "请选择老人详情页中已经定义的家庭空间。" : "该老人尚未定义家庭空间，请先返回老人详情页添加房间。"}</p></div></div>
            </div>
          ) : (
            <div className="sensor-test-section">
              <div className="install-summary"><div><span>设备</span><b>{form.name}</b><small>{form.sn} · {form.model}</small></div><div><span>安装位置</span><b>{elderly?.name} · {roomName}</b><small>{elderly?.address}</small></div></div>
              <h3>安装验收</h3>
              <div className={`test-check-card ${onlinePassed ? "passed" : ""}`}><div><span><MonitorSmartphone size={18}/></span><div><b>设备在线校验</b><small>{onlinePassed ? "设备在线，信号良好" : "检查设备联网、信号和最近上报状态"}</small></div></div><button className={onlinePassed ? "secondary-button" : "primary-button"} onClick={() => setOnlinePassed(true)}>{onlinePassed ? "已通过" : "开始校验"}</button></div>
              <div className={`test-check-card ${activityPassed ? "passed" : ""}`}><div><span><Activity size={18}/></span><div><b>活动上报测试</b><small>{activityPassed ? `已收到 ${roomName} 的人体活动数据` : "请在安装房间内走动，确认后台收到活动数据"}</small></div></div><button className={activityPassed ? "secondary-button" : "primary-button"} disabled={!onlinePassed} onClick={() => setActivityPassed(true)}>{activityPassed ? "已通过" : "测试上报"}</button></div>
              <p className="sensor-scope-note">传感器只识别房间内是否有人活动，不识别具体人物或动作。</p>
            </div>
          )}
        </div>
        <footer>{step > 1 && <button className="secondary-button back-button" onClick={() => setStep((current) => current - 1)}>上一步</button>}<button className="secondary-button" onClick={onClose}>取消</button>{step < 3 ? <button className="primary-button" onClick={next}>下一步</button> : <button className="primary-button" disabled={!onlinePassed || !activityPassed} onClick={complete}>完成安装</button>}</footer>
      </aside>
      {pickerOpen && <ElderlyPickerModal records={elderlyRecords} value={form.elderlyId} onClose={() => setPickerOpen(false)} onConfirm={selectElderly}/>}
    </div>
  );
}

function SensorDetailDrawer({ sensor, elderlyRecords, onClose, onMove, onUnbind }) {
  const elderly = elderlyRecords.find((record) => record.id === sensor.elderlyId);
  const [editingRoom, setEditingRoom] = useState(false);
  const [confirmUnbind, setConfirmUnbind] = useState(false);
  const [room, setRoom] = useState(sensor.room || "");
  const nextRoom = room;
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer device-detail-drawer" role="dialog" aria-modal="true"><header><div><h2>传感器详情</h2><p>{formatDisplayId(sensor.id)} · {sensor.sn}</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="device-hero sensor"><span><Activity size={24}/></span><div><h3>{sensor.name}</h3><p>{sensor.model}</p></div><StatusTag>{sensor.onlineStatus}</StatusTag></div><section className="detail-section"><h3>当前安装关系</h3><div className="relation-card"><div><Home size={18}/><span><b>{elderly ? `${elderly.name} · ${sensor.room}` : "设备已解绑"}</b><small>{elderly?.address || "当前不产生新的房间活动统计"}</small></span></div><StatusTag>{sensor.installStatus}</StatusTag></div></section>{editingRoom && elderly && <section className="detail-section room-change-panel"><h3>更换安装房间</h3><label><span>新安装房间</span><select className="select-control form-select-native" value={room} onChange={(event) => setRoom(event.target.value)}>{elderly.rooms?.map((item) => <option key={item}>{item}</option>)}</select></label><div className="inline-actions"><button className="secondary-button" onClick={() => setEditingRoom(false)}>取消</button><button className="primary-button" disabled={!nextRoom} onClick={() => onMove(sensor.id, nextRoom)}>确认换房</button></div></section>}<section className="detail-section"><h3>运行与安装信息</h3><div className="info-grid"><div><span>最近上报</span><b>{sensor.lastReport}</b></div><div><span>最近活动</span><b>{sensor.lastActivity}</b></div><div><span>信号状态</span><b>{sensor.signal}</b></div><div><span>安装人员</span><b>{sensor.installer}</b></div><div className="full"><span>安装时间</span><b>{sensor.installedAt}</b></div></div></section>{confirmUnbind && <div className="unbind-warning"><b>确认解除传感器绑定？</b><p>解除后该设备不再产生新的房间活动统计；历史设备、房间和活动数据继续保留。</p></div>}</div><footer>{elderly && !editingRoom && !confirmUnbind && <><button className="danger-outline-button" onClick={() => setConfirmUnbind(true)}>解除绑定</button><button className="secondary-button" onClick={() => setEditingRoom(true)}>更换房间</button></>}{confirmUnbind ? <><button className="secondary-button" onClick={() => setConfirmUnbind(false)}>取消</button><button className="danger-button" onClick={() => onUnbind(sensor.id)}>确认解绑</button></> : <button className="secondary-button" onClick={onClose}>关闭</button>}</footer></aside></div>;
}

function RoomActivityPage({ sensors, elderlyRecords }) {
  const [query, setQuery] = useState("");
  const activitySensors = sensors.filter((sensor) => sensor.elderlyId && sensor.installStatus === "已安装");
  const rows = activitySensors.filter((sensor) => {
    const elderly = elderlyRecords.find((record) => record.id === sensor.elderlyId);
    return `${elderly?.name || ""}${elderly?.id || ""}${sensor.room}${sensor.sn}`.toLowerCase().includes(query.trim().toLowerCase());
  });
  const onlineCount = activitySensors.filter((sensor) => sensor.onlineStatus === "在线").length;
  return <><div className="page-heading"><div><h1>房间活动</h1><p>查看各房间最近检测到的人体活动时间和设备数据可信度</p></div><button className="secondary-button">导出数据</button></div><div className="activity-summary-strip"><div><span>已安装传感器</span><b>{activitySensors.length}</b></div><div><span>当前在线</span><b>{onlineCount}</b></div><div><span>涉及老人</span><b>{new Set(activitySensors.map((sensor) => sensor.elderlyId)).size}</b></div><p>房间活动仅作为生活状态线索，不识别具体人物或动作。</p></div><section className="panel management-panel"><div className="filters activity-filters"><label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="老人姓名、档案编号、房间或设备 SN"/></div></label><div className="filter-actions"><button className="primary-button"><Search size={15}/>查询</button><button className="secondary-button" onClick={() => setQuery("")}><RefreshCw size={15}/>重置</button></div></div><div className="table-toolbar"><div><span className="result-count">共 {rows.length} 条房间活动线索</span><span className="toolbar-hint">设备离线时不判断为老人无活动</span></div></div><div className="table-scroll"><table className="activity-data-table"><thead><tr><th>老人</th><th>居住地址</th><th>活动房间</th><th>最近检测时间</th><th>设备来源</th><th>数据状态</th><th>最近上报</th></tr></thead><tbody>{rows.map((sensor) => { const elderly = elderlyRecords.find((record) => record.id === sensor.elderlyId); return <tr key={sensor.id}><td><div className="stacked-cell"><b>{elderly?.name}</b><small>{formatDisplayId(elderly?.id)}</small></div></td><td>{elderly?.address}</td><td><b>{sensor.room}</b></td><td>{sensor.lastActivity}</td><td><div className="stacked-cell"><b>{sensor.name}</b><small>{sensor.sn}</small></div></td><td><StatusTag>{sensor.onlineStatus === "在线" ? "数据可用" : "设备离线"}</StatusTag></td><td>{sensor.lastReport}</td></tr>; })}{!rows.length && <tr><td colSpan="7"><div className="empty-table-state">暂无符合条件的房间活动数据</div></td></tr>}</tbody></table></div><div className="pagination"><span>当前展示 {rows.length} 条数据</span></div></section></>;
}

function DataTable({ page, query }) {
  if (page === "elderly") {
    const rows = elderlyRows.filter((row) => `${row.name}${row.id}${row.project}`.includes(query.trim()));
    return <table><thead><tr><th>老人姓名</th><th>档案编号</th><th>所属项目 / 社区</th><th>年龄</th><th>绑定子女</th><th>设备状态</th><th>服务顾问</th><th>服务状态</th><th>关注状态</th><th className="sticky-right">操作</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><button className="name-link">{row.name}</button></td><td className="mono">{formatDisplayId(row.id)}</td><td>{row.project}</td><td>{row.age} 岁</td><td>{row.family}</td><td><StatusTag>{row.device}</StatusTag></td><td>{row.advisor}</td><td><StatusTag>{row.status}</StatusTag></td><td><StatusTag>{row.attention}</StatusTag></td><td className="sticky-right"><button className="table-action">详情</button><button className="table-action">编辑</button><button className="more"><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table>;
  }
  const headers = headersByPage[page] || ["名称", "关联对象", "类型", "当前状态", "负责人", "更新时间"];
  const source = genericRows[page] || [
    ["陈美玲家庭关系", "陈美玲", "子女绑定", "已通过", "运营一组", "今天 10:26"],
    ["黄国强紧急联系人", "黄国强", "联系人", "待补充", "运营二组", "昨天 17:40"],
    ["林秀英顾问服务", "林秀英", "顾问关系", "服务中", "张文杰", "07-15 09:12"],
    ["李玉珍服务标签", "李玉珍", "运营标签", "正常", "运营一组", "07-14 15:28"],
  ];
  const rows = source.filter(row => row.join("").includes(query.trim()));
  return <table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}<th className="sticky-right">操作</th></tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{j === 0 ? <button className="name-link">{cell}</button> : /状态|在线|已|待|草稿|服务中|需关注/.test(String(cell)) ? <StatusTag>{cell}</StatusTag> : cell}</td>)}<td className="sticky-right"><button className="table-action">详情</button><button className="table-action">编辑</button></td></tr>)}</tbody></table>;
}

function ServiceBookingPage({ bookings, services, elderlyRecords, projects, onOpen, onCreateService, onEditService, onToggleService }) {
  const [activeTab, setActiveTab] = useState("bookings");
  const initialFilters = { query: "", project: "全部项目", service: "全部服务", status: "全部状态" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const serviceOptions = ["全部服务", ...new Set(bookings.map((booking) => booking.serviceName))];
  const projectOptions = ["全部项目", ...projects.filter((project) => project.status === "启用").map((project) => project.name)];
  const rows = bookings.map((booking) => ({
    ...booking,
    elderly: elderlyRecords.find((record) => record.id === booking.elderlyId),
  })).filter((booking) => {
    const keyword = filters.query.trim().toLowerCase();
    const matchesKeyword = !keyword || [booking.id, booking.serviceName, booking.provider, booking.elderly?.name, booking.elderly?.phone].some((value) => `${value || ""}`.toLowerCase().includes(keyword));
    const matchesProject = filters.project === "全部项目" || booking.elderly?.project === filters.project;
    const matchesService = filters.service === "全部服务" || booking.serviceName === filters.service;
    const matchesStatus = filters.status === "全部状态" || booking.status === filters.status;
    return matchesKeyword && matchesProject && matchesService && matchesStatus;
  });
  const reset = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
  };
  const counts = {
    pending: bookings.filter((booking) => booking.status === "待确认").length,
    confirmed: bookings.filter((booking) => booking.status === "已确认").length,
    serving: bookings.filter((booking) => booking.status === "服务中").length,
    completed: bookings.filter((booking) => booking.status === "已完成").length,
  };

  return (
    <>
      <div className="page-heading"><div><h1>预约服务</h1><p>{activeTab === "bookings" ? "查看老人通过中控屏提交的服务预约，并跟进确认与服务进度" : "维护老人中控屏可查看和预约的服务内容"}</p></div>{activeTab === "services" && <button className="primary-button" onClick={onCreateService}><Plus size={16}/>新增服务</button>}</div>
      <div className="service-module-tabs">
        <button className={activeTab === "bookings" ? "active" : ""} onClick={() => setActiveTab("bookings")}>预约记录<span>{bookings.length}</span></button>
        <button className={activeTab === "services" ? "active" : ""} onClick={() => setActiveTab("services")}>服务管理<span>{services.length}</span></button>
      </div>
      {activeTab === "bookings" ? <>
        <div className="service-booking-summary">
          <div><span>待确认</span><b>{counts.pending}</b></div>
          <div><span>已确认</span><b>{counts.confirmed}</b></div>
          <div><span>服务中</span><b>{counts.serving}</b></div>
          <div><span>已完成</span><b>{counts.completed}</b></div>
        </div>
        <section className="panel management-panel service-booking-panel">
          <div className="filters service-booking-filters">
            <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="预约编号、老人、服务或机构"/></div></label>
            <label><span>所属项目</span><select className="select-control filter-select wide" value={draftFilters.project} onChange={(event) => setDraftFilters((current) => ({ ...current, project: event.target.value }))}>{projectOptions.map((project) => <option key={project}>{project}</option>)}</select></label>
            <label><span>预约服务</span><select className="select-control filter-select" value={draftFilters.service} onChange={(event) => setDraftFilters((current) => ({ ...current, service: event.target.value }))}>{serviceOptions.map((service) => <option key={service}>{service}</option>)}</select></label>
            <label><span>预约状态</span><select className="select-control filter-select" value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}>{["全部状态", "待确认", "已确认", "服务中", "已完成", "已取消"].map((status) => <option key={status}>{status}</option>)}</select></label>
            <div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div>
          </div>
          <div className="table-toolbar"><div><span className="result-count">共 {rows.length} 条预约</span><span className="toolbar-hint">预约来自老人中控屏，后台负责确认和更新服务进度</span></div><button className="icon-button" title="刷新"><RefreshCw size={16}/></button></div>
          <div className="table-scroll">
            <table className="service-booking-table">
              <thead><tr><th>预约服务 / 编号</th><th>预约老人</th><th>所属项目 / 地址</th><th>预约时段</th><th>服务机构</th><th>提交时间</th><th>状态</th><th className="sticky-right">操作</th></tr></thead>
              <tbody>
                {rows.map((booking) => <tr key={booking.id}><td><button className="service-booking-name" onClick={() => onOpen(booking)}><b>{booking.serviceName}</b><small>{booking.id} · {booking.category}</small></button></td><td>{booking.elderly ? <div className="stacked-cell"><b>{booking.elderly.name}</b><small>{booking.elderly.phone || "电话待补充"}</small></div> : "老人档案已移除"}</td><td>{booking.elderly ? <div className="stacked-cell"><b>{booking.elderly.project}</b><small>{booking.elderly.address}</small></div> : "—"}</td><td><b>{booking.slotLabel}</b></td><td>{booking.provider}</td><td>{booking.createdAt}</td><td><StatusTag>{booking.status}</StatusTag></td><td className="sticky-right"><button className="table-action" onClick={() => onOpen(booking)}>详情</button></td></tr>)}
                {!rows.length && <tr><td colSpan="8"><div className="empty-table-state">暂无符合条件的预约记录</div></td></tr>}
              </tbody>
            </table>
          </div>
          <div className="pagination"><span>当前展示 {rows.length} 条数据</span></div>
        </section>
      </> : <ServiceCatalogPanel services={services} onCreate={onCreateService} onEdit={onEditService} onToggle={onToggleService}/>} 
    </>
  );
}

function ServiceCatalogPanel({ services, onCreate, onEdit, onToggle }) {
  const [draftFilters, setDraftFilters] = useState({ query: "", status: "全部状态" });
  const [filters, setFilters] = useState({ query: "", status: "全部状态" });
  const rows = services.filter((service) => {
    const keyword = filters.query.trim().toLowerCase();
    return (!keyword || [service.name, service.category, service.provider].some((value) => value.toLowerCase().includes(keyword)))
      && (filters.status === "全部状态" || service.status === filters.status);
  });
  return <section className="panel management-panel service-catalog-panel">
    <div className="filters service-catalog-filters">
      <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="服务名称、分类或服务机构"/></div></label>
      <label><span>服务状态</span><select className="select-control filter-select" value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}><option>全部状态</option><option>启用</option><option>停用</option></select></label>
      <div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={() => { setDraftFilters({ query: "", status: "全部状态" }); setFilters({ query: "", status: "全部状态" }); }}><RefreshCw size={15}/>重置</button></div>
    </div>
    <div className="table-toolbar"><div><span className="result-count">共 {rows.length} 项服务</span><span className="toolbar-hint">启用后将在老人中控屏展示并开放预约</span></div><button className="icon-button" title="刷新"><RefreshCw size={16}/></button></div>
    <div className="table-scroll"><table className="service-catalog-table"><thead><tr><th>服务名称 / 编号</th><th>服务分类</th><th>服务机构</th><th>可预约时段</th><th>状态</th><th>更新时间</th><th className="sticky-right">操作</th></tr></thead><tbody>
      {rows.map((service) => <tr key={service.id}><td><button className="service-booking-name" onClick={() => onEdit(service)}><b>{service.name}</b><small>{service.id}</small></button></td><td>{service.category}</td><td>{service.provider}</td><td><div className="slot-summary"><b>{service.slots.length} 个时段</b><small>{service.slots.slice(0, 2).join("、")}</small></div></td><td><StatusTag>{service.status}</StatusTag></td><td>{service.updatedAt}</td><td className="sticky-right"><button className="table-action" onClick={() => onEdit(service)}>编辑</button><button className={`table-action ${service.status === "启用" ? "danger-text" : ""}`} onClick={() => onToggle(service.id)}>{service.status === "启用" ? "停用" : "启用"}</button></td></tr>)}
      {!rows.length && <tr><td colSpan="7"><div className="empty-table-state">暂无符合条件的服务</div></td></tr>}
    </tbody></table></div>
    <div className="pagination"><span>当前展示 {rows.length} 条数据</span><button className="secondary-button service-empty-create" onClick={onCreate}><Plus size={15}/>新增服务</button></div>
  </section>;
}

function ServiceCatalogDrawer({ record, onClose, onSave }) {
  const [form, setForm] = useState(() => record ? { ...record, slots: [...record.slots] } : { name: "", category: "居家服务", provider: "", description: "", slots: [""], status: "启用" });
  const [errors, setErrors] = useState({});
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "请输入服务名称";
    if (!form.provider.trim()) nextErrors.provider = "请输入服务机构";
    if (!form.description.trim()) nextErrors.description = "请输入服务说明";
    if (!form.slots.some((slot) => slot.trim())) nextErrors.slots = "请至少配置一个可预约时段";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ ...form, name: form.name.trim(), provider: form.provider.trim(), description: form.description.trim(), slots: form.slots.map((slot) => slot.trim()).filter(Boolean) });
  };
  const updateSlot = (index, value) => update("slots", form.slots.map((slot, slotIndex) => slotIndex === index ? value : slot));
  const removeSlot = (index) => update("slots", form.slots.filter((_, slotIndex) => slotIndex !== index));
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer service-catalog-drawer" role="dialog" aria-modal="true" aria-label={record ? "编辑服务" : "新增服务"}>
    <header><div><h2>{record ? "编辑服务" : "新增服务"}</h2><p>保存后，启用的服务将在老人中控屏展示</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
    <div className="drawer-body">
      <div className="form-section"><h3>服务信息</h3><label><span>服务名称 *</span><input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="例如：家政保洁"/>{errors.name && <small className="field-error">{errors.name}</small>}</label><div className="form-row"><label><span>服务分类 *</span><select className="select-control form-select-native" value={form.category} onChange={(event) => update("category", event.target.value)}><option>居家服务</option><option>健康服务</option><option>照护服务</option><option>便民服务</option></select></label><label><span>服务状态 *</span><select className="select-control form-select-native" value={form.status} onChange={(event) => update("status", event.target.value)}><option>启用</option><option>停用</option></select></label></div><label><span>服务机构 *</span><input value={form.provider} onChange={(event) => update("provider", event.target.value)} placeholder="请输入承接服务的机构名称"/>{errors.provider && <small className="field-error">{errors.provider}</small>}</label><label><span>服务说明 *</span><textarea rows="4" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="说明服务内容和适用场景"/>{errors.description && <small className="field-error">{errors.description}</small>}</label></div>
      <div className="form-section service-slot-section"><div className="form-section-heading"><div><h3>可预约时段</h3><p>老人将在中控屏选择其中一个时段提交预约</p></div><button className="secondary-button" onClick={() => update("slots", [...form.slots, ""])}><Plus size={14}/>添加时段</button></div><div className="service-slot-list">{form.slots.map((slot, index) => <div key={index}><span>{index + 1}</span><input value={slot} onChange={(event) => updateSlot(index, event.target.value)} placeholder="例如：明天上午 09:00—11:00"/><button className="icon-button danger-text" disabled={form.slots.length === 1} onClick={() => removeSlot(index)} title="删除时段"><Trash2 size={15}/></button></div>)}</div>{errors.slots && <small className="field-error">{errors.slots}</small>}</div>
    </div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={save}>保存服务</button></footer>
  </aside></div>;
}

function ServiceBookingDrawer({ booking, elderly, onClose, onUpdateStatus }) {
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const statusSteps = ["待确认", "已确认", "服务中", "已完成"];
  const currentStep = statusSteps.indexOf(booking.status);
  const action = booking.status === "待确认"
    ? { label: "确认预约", status: "已确认" }
    : booking.status === "已确认"
      ? { label: "开始服务", status: "服务中" }
      : booking.status === "服务中"
        ? { label: "完成服务", status: "已完成" }
        : null;
  const canCancel = booking.status === "待确认" || booking.status === "已确认";

  return (
    <div className="drawer-layer">
      <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
      <aside className="drawer service-booking-drawer" role="dialog" aria-modal="true" aria-label="预约服务详情">
        <header><div><h2>预约服务详情</h2><p>{booking.id} · 来自{booking.source}</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
        <div className="drawer-body">
          <div className="service-booking-hero"><span><ClipboardList size={20}/></span><div><small>{booking.category}</small><h3>{booking.serviceName}</h3><p>{booking.slotLabel}</p></div><StatusTag>{booking.status}</StatusTag></div>
          <section className="detail-section"><h3>预约信息</h3><div className="info-grid"><div><span>预约老人</span><b>{elderly?.name || "老人档案已移除"}</b></div><div><span>联系电话</span><b>{elderly?.phone || "待补充"}</b></div><div><span>所属项目</span><b>{elderly?.project || "—"}</b></div><div><span>所属社区</span><b>{elderly?.community || "—"}</b></div><div className="full"><span>服务地址</span><b>{elderly?.address || "—"}</b></div><div className="full"><span>服务机构</span><b>{booking.provider}</b></div><div><span>提交时间</span><b>{booking.createdAt}</b></div><div><span>最近更新</span><b>{booking.updatedAt}</b></div></div></section>
          <section className="detail-section"><h3>服务进度</h3>{booking.status === "已取消" ? <div className="service-cancelled-state"><StatusTag>已取消</StatusTag><p>该预约已取消，不再进入后续服务流程。</p></div> : <div className="service-status-flow">{statusSteps.map((status, index) => <div className={index <= currentStep ? "completed" : ""} key={status}><i>{index < currentStep ? "✓" : index + 1}</i><span>{status}</span></div>)}</div>}<div className="service-operation-meta"><span>最近操作人</span><b>{booking.operator || "尚未处理"}</b></div></section>
        </div>
        <footer>{canCancel && <button className="secondary-button danger-text" onClick={() => setCancelConfirm(true)}>取消预约</button>}<span/><button className="secondary-button" onClick={onClose}>关闭</button>{action && <button className="primary-button" onClick={() => onUpdateStatus(booking.id, action.status)}>{action.label}</button>}</footer>
      </aside>
      {cancelConfirm && <div className="modal-layer"><button className="modal-backdrop" aria-label="关闭取消确认" onClick={() => setCancelConfirm(false)}/><section className="confirm-dialog" role="dialog" aria-modal="true" aria-label="取消预约"><span className="confirm-icon danger"><Trash2 size={20}/></span><h3>确认取消“{booking.serviceName}”预约？</h3><p>取消后，该预约不会继续确认或安排服务，老人端的预约状态也应同步显示为已取消。</p><div><button className="secondary-button" onClick={() => setCancelConfirm(false)}>保留预约</button><button className="danger-button" onClick={() => { onUpdateStatus(booking.id, "已取消"); setCancelConfirm(false); }}>确认取消</button></div></section></div>}
    </div>
  );
}

function CommunityActivityPage({ records, registrations, onCreate, onEdit, onDelete, onViewRegistrations }) {
  const initialFilters = { query: "", category: "全部分类", status: "全部状态" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const categories = ["全部分类", ...new Set(records.map((record) => record.category))];
  const rows = records.filter((record) => {
    const keyword = filters.query.trim().toLowerCase();
    return (!keyword || [record.title, record.description, record.location, record.category].some((value) => `${value || ""}`.toLowerCase().includes(keyword)))
      && (filters.category === "全部分类" || record.category === filters.category)
      && (filters.status === "全部状态" || record.status === filters.status);
  });
  const reset = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
  };
  return <>
    <div className="page-heading"><div><h1>社区活动</h1><p>发布面向老人的社区活动，并维护活动时间、地点和报名状态</p></div><button className="primary-button" onClick={onCreate}><Plus size={16}/>发布活动</button></div>
    <section className="panel management-panel community-activity-panel">
      <div className="filters community-activity-filters"><label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="活动名称、说明或地点"/></div></label><label><span>活动分类</span><select className="select-control filter-select" value={draftFilters.category} onChange={(event) => setDraftFilters((current) => ({ ...current, category: event.target.value }))}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label><span>活动状态</span><select className="select-control filter-select" value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}><option>全部状态</option><option>已发布</option><option>报名中</option><option>已结束</option></select></label><div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div></div>
      <div className="table-toolbar"><div><span className="result-count">共 {rows.length} 场活动</span></div><button className="icon-button" title="刷新"><RefreshCw size={16}/></button></div>
      <div className="table-scroll"><table className="community-activity-table"><thead><tr><th>活动名称</th><th>活动分类</th><th>活动时间 / 地点</th><th>意向人数</th><th>状态</th><th>发布时间</th><th className="sticky-right">操作</th></tr></thead><tbody>
        {rows.map((record) => { const registrationCount = registrations.filter((item) => item.activityId === record.id && item.status !== "已取消").length; return <tr key={record.id}><td><button className="activity-title-cell" onClick={() => onEdit(record)}><img src={record.cover || activityHealthCover} alt=""/><span><b>{record.title}</b><small>{record.description || "暂无活动说明"}</small></span></button></td><td><StatusTag>{record.category}</StatusTag></td><td><div className="stacked-cell"><b>{record.date} {record.time}</b><small>{record.location}</small></div></td><td><button className="registration-count-button" onClick={() => onViewRegistrations(record)}>{registrationCount} 人</button></td><td><StatusTag>{record.status}</StatusTag></td><td>{record.publishedAt}</td><td className="sticky-right"><button className="table-action" onClick={() => onViewRegistrations(record)}>报名人员</button><button className="table-action" onClick={() => onEdit(record)}>编辑</button><button className="table-action danger-text" onClick={() => setDeleteTarget(record)}>删除</button></td></tr>; })}
        {!rows.length && <tr><td colSpan="7"><div className="empty-table-state">暂无符合条件的社区活动</div></td></tr>}
      </tbody></table></div><div className="pagination"><span>当前展示 {rows.length} 条数据</span></div>
    </section>
    {deleteTarget && <div className="modal-layer"><button className="modal-backdrop" aria-label="关闭删除确认" onClick={() => setDeleteTarget(null)}/><section className="confirm-dialog" role="dialog" aria-modal="true" aria-label="删除社区活动"><span className="confirm-icon danger"><Trash2 size={20}/></span><h3>确认删除“{deleteTarget.title}”？</h3><p>删除后，该活动会从社区活动列表和推荐策略的可选资源中移除，此操作无法撤销。</p><div><button className="secondary-button" onClick={() => setDeleteTarget(null)}>取消</button><button className="danger-button" onClick={() => { onDelete(deleteTarget.id); setDeleteTarget(null); }}>确认删除</button></div></section></div>}
  </>;
}

function CommunityActivityDrawer({ record, onClose, onSave }) {
  const [form, setForm] = useState(() => record ? { ...record } : { title: "", category: "", date: "", time: "", location: "", description: "", cover: "", interestCount: 0, status: "已发布" });
  const [errors, setErrors] = useState({});
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const uploadCover = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("cover", String(reader.result || ""));
    reader.readAsDataURL(file);
  };
  const save = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "请输入活动名称";
    if (!form.category) nextErrors.category = "请选择活动分类";
    if (!form.date) nextErrors.date = "请选择活动日期";
    if (!form.time) nextErrors.time = "请选择活动时间";
    if (!form.location.trim()) nextErrors.location = "请输入活动地点";
    if (!form.description.trim()) nextErrors.description = "请输入活动说明";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ ...form, title: form.title.trim(), location: form.location.trim(), description: form.description.trim() });
  };
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer community-activity-drawer" role="dialog" aria-modal="true" aria-label={record ? "编辑活动" : "发布活动"}>
    <header><div><h2>{record ? "编辑活动" : "发布活动"}</h2><p>维护老人端展示的活动内容和报名信息</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
    <div className="drawer-body"><div className="form-section"><h3>活动内容</h3><label><span>活动名称 *</span><input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="请输入活动名称"/>{errors.title && <small className="field-error">{errors.title}</small>}</label><div className="form-row"><label><span>活动分类 *</span><select className="select-control form-select-native" value={form.category} onChange={(event) => update("category", event.target.value)}><option value="">请选择活动分类</option><option>健康活动</option><option>安全讲座</option><option>兴趣活动</option><option>社区交流</option></select>{errors.category && <small className="field-error">{errors.category}</small>}</label><label><span>活动状态 *</span><select className="select-control form-select-native" value={form.status} onChange={(event) => update("status", event.target.value)}><option>已发布</option><option>报名中</option><option>已结束</option></select></label></div><label><span>活动说明 *</span><textarea rows="4" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="请输入活动内容和参与说明"/>{errors.description && <small className="field-error">{errors.description}</small>}</label><div className="activity-cover-field"><span>活动封面</span><div className="activity-cover-upload">{form.cover ? <img src={form.cover} alt="活动封面预览"/> : <span><CalendarDays size={22}/></span>}<div><b>{form.cover ? "已选择活动封面" : "上传活动封面"}</b><small>建议横向图片，支持 JPG、PNG</small></div><label className="secondary-button">{form.cover ? "更换图片" : "选择图片"}<input type="file" accept="image/*" onChange={(event) => uploadCover(event.target.files?.[0])}/></label></div></div></div>
      <div className="form-section community-activity-time-section"><h3>时间与地点</h3><div className="form-row"><label><span>活动日期 *</span><input type="date" value={form.date} onChange={(event) => update("date", event.target.value)}/>{errors.date && <small className="field-error">{errors.date}</small>}</label><label><span>活动时间 *</span><input type="time" value={form.time} onChange={(event) => update("time", event.target.value)}/>{errors.time && <small className="field-error">{errors.time}</small>}</label></div><label><span>活动地点 *</span><input value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="请输入活动地点"/>{errors.location && <small className="field-error">{errors.location}</small>}</label></div>
    </div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={save}>保存活动</button></footer>
  </aside></div>;
}

function ActivityRegistrationsModal({ activity, registrations, elderlyRecords, onClose }) {
  const initialFilters = { query: "", status: "全部状态" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const rows = registrations.filter((registration) => registration.activityId === activity.id).map((registration) => ({ ...registration, elderly: elderlyRecords.find((record) => record.id === registration.elderlyId) })).filter((registration) => {
    const keyword = filters.query.trim().toLowerCase();
    return (!keyword || [registration.elderly?.name, registration.elderly?.phone, registration.elderly?.project, registration.elderly?.community].some((value) => `${value || ""}`.toLowerCase().includes(keyword)))
      && (filters.status === "全部状态" || registration.status === filters.status);
  });
  const activeCount = registrations.filter((registration) => registration.activityId === activity.id && registration.status !== "已取消").length;
  const reset = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
  };
  return <div className="modal-layer activity-registration-layer"><button className="modal-backdrop" aria-label="关闭报名人员弹窗" onClick={onClose}/><section className="activity-registration-dialog" role="dialog" aria-modal="true" aria-label={`${activity.title}报名人员`}>
    <header><div><h3>报名人员</h3><p>{activity.title} · {activity.date} {activity.time} · {activity.location}</p></div><button className="icon-button" onClick={onClose}><X size={18}/></button></header>
    <div className="activity-registration-summary"><div><span>当前报名</span><b>{activeCount}</b></div><p>人员信息来自老人档案，联系方式和项目归属会保持同步。</p></div>
    <div className="activity-registration-filters"><label><span>搜索人员</span><div className="input-wrap"><Search size={16}/><input autoFocus value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="姓名、手机号、项目或社区"/></div></label><label><span>报名状态</span><select className="select-control form-select-native" value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}><option>全部状态</option><option>已报名</option><option>已取消</option><option>已签到</option><option>未签到</option></select></label><div><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div></div>
    <div className="activity-registration-table-wrap"><table className="activity-registration-table"><thead><tr><th>老人信息</th><th>联系电话</th><th>所属项目 / 社区</th><th>报名时间</th><th>报名状态</th></tr></thead><tbody>{rows.map((registration) => <tr key={registration.id}><td>{registration.elderly ? <div className="elderly-name-cell"><span className="person-avatar">{registration.elderly.name.slice(-1)}</span><span><b>{registration.elderly.name}</b><small>{registration.elderly.gender} · {registration.elderly.age} 岁</small></span></div> : "老人档案已移除"}</td><td>{registration.elderly?.phone || "电话待补充"}</td><td><div className="stacked-cell"><b>{registration.elderly?.project || "—"}</b><small>{registration.elderly?.community || "—"}</small></div></td><td>{registration.registeredAt}</td><td><StatusTag>{registration.status}</StatusTag></td></tr>)}{!rows.length && <tr><td colSpan="5"><div className="empty-table-state">暂无符合条件的报名人员</div></td></tr>}</tbody></table></div>
    <footer><span>当前展示 {rows.length} 条报名记录</span><button className="secondary-button" onClick={onClose}>关闭</button></footer>
  </section></div>;
}

function SafetyNewsPage({ records, projects, onCreate, onEdit, onDelete }) {
  const initialFilters = { query: "", category: "全部分类", project: "全部项目" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const categories = ["全部分类", ...new Set(records.map((record) => record.category))];
  const projectMap = Object.fromEntries(projects.map((project) => [project.id, project.name]));
  const rows = records.filter((record) => {
    const keyword = filters.query.trim().toLowerCase();
    const matchesKeyword = !keyword || [record.title, record.description, record.content].some((value) => `${value || ""}`.toLowerCase().includes(keyword));
    const matchesCategory = filters.category === "全部分类" || record.category === filters.category;
    const matchesProject = filters.project === "全部项目"
      || record.scope === "all"
      || record.projectIds.includes(filters.project);
    return matchesKeyword && matchesCategory && matchesProject;
  });
  const getScopeText = (record) => {
    if (record.scope === "all") return "全部项目";
    const names = record.projectIds.map((id) => projectMap[id]).filter(Boolean);
    return names.length > 2 ? `${names.slice(0, 2).join("、")}等 ${names.length} 个项目` : names.join("、") || "未配置";
  };
  const reset = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
  };

  return (
    <>
      <div className="page-heading"><div><h1>安全资讯</h1><p>维护面向老人端的安全内容，并按项目范围进行投放</p></div><button className="primary-button" onClick={onCreate}><Plus size={16}/>发布资讯</button></div>
      <section className="panel management-panel safety-news-panel">
        <div className="filters safety-news-filters">
          <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="资讯标题、详情描述或正文内容"/></div></label>
          <label><span>资讯分类</span><select className="select-control filter-select" value={draftFilters.category} onChange={(event) => setDraftFilters((current) => ({ ...current, category: event.target.value }))}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label><span>投放项目</span><select className="select-control filter-select wide" value={draftFilters.project} onChange={(event) => setDraftFilters((current) => ({ ...current, project: event.target.value }))}><option value="全部项目">全部项目</option>{projects.filter((project) => project.status === "启用").map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div>
        </div>
        <div className="table-toolbar"><div><span className="result-count">共 {rows.length} 条资讯</span></div><button className="icon-button" title="刷新"><RefreshCw size={16}/></button></div>
        <div className="table-scroll">
          <table className="safety-news-table">
            <thead><tr><th>资讯标题</th><th>资讯分类</th><th>项目投放范围</th><th>状态</th><th>更新时间</th><th className="sticky-right">操作</th></tr></thead>
            <tbody>
              {rows.map((record) => <tr key={record.id}><td><button className="safety-title-cell" onClick={() => onEdit(record)}><b>{record.title}</b><small>{record.description || "未填写详情描述"}</small></button></td><td><StatusTag>{record.category}</StatusTag></td><td><span className="scope-text">{getScopeText(record)}</span></td><td><StatusTag>{record.status}</StatusTag></td><td>{record.updatedAt}</td><td className="sticky-right"><button className="table-action" onClick={() => onEdit(record)}>编辑</button><button className="table-action danger-text" onClick={() => onDelete(record.id)}>删除</button></td></tr>)}
              {!rows.length && <tr><td colSpan="6"><div className="empty-table-state">暂无符合条件的安全资讯</div></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="pagination"><span>当前展示 {rows.length} 条数据</span></div>
      </section>
    </>
  );
}

function SafetyNewsDrawer({ record, projects, onClose, onSave }) {
  const [form, setForm] = useState(() => record ? { ...record } : {
    title: "",
    category: "",
    content: "",
    description: "",
    cover: "",
    scope: "all",
    projectIds: [],
  });
  const [errors, setErrors] = useState({});
  const enabledProjects = projects.filter((project) => project.status === "启用");
  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      if (field === "scope" && value === "all") delete next.projectIds;
      return next;
    });
  };
  const toggleProject = (projectId) => {
    setForm((current) => ({
      ...current,
      projectIds: current.projectIds.includes(projectId)
        ? current.projectIds.filter((id) => id !== projectId)
        : [...current.projectIds, projectId],
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.projectIds;
      return next;
    });
  };
  const submit = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "请输入资讯标题";
    if (!form.category) nextErrors.category = "请选择资讯分类";
    if (!form.content.trim()) nextErrors.content = "请输入正文内容";
    if (form.scope === "projects" && !form.projectIds.length) nextErrors.projectIds = "请至少选择一个投放项目";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave(form);
  };

  return (
    <div className="drawer-layer" role="presentation">
      <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
      <aside className="drawer safety-news-drawer" role="dialog" aria-modal="true" aria-label={record ? "编辑安全资讯" : "发布安全资讯"}>
        <header><div><h2>{record ? "编辑安全资讯" : "发布安全资讯"}</h2><p>带 * 的字段为必填项，保存后按投放范围展示</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
        <div className="drawer-body">
          <div className="form-section safety-content-section">
            <h3>资讯内容</h3>
            <label><span>资讯标题 *</span><input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="请输入资讯标题"/>{errors.title && <small className="field-error">{errors.title}</small>}</label>
            <label><span>资讯分类 *</span><select className="form-select-native" value={form.category} onChange={(event) => update("category", event.target.value)}><option value="">请选择资讯分类</option><option>诈骗提醒</option><option>家居安全</option><option>生活安全</option><option>社区公告</option><option>健康安全</option></select>{errors.category && <small className="field-error">{errors.category}</small>}</label>
            <label className="safety-body-field"><span>正文内容 *</span><textarea value={form.content} onChange={(event) => update("content", event.target.value)} placeholder="请输入完整资讯正文" rows="5"/>{errors.content && <small className="field-error">{errors.content}</small>}</label>
            <label className="safety-description-field"><span>详情描述</span><textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="请输入补充描述" rows="3"/></label>
            <div className="cover-field"><span>封面图片</span><div className="cover-upload-control"><div className="cover-upload-copy"><span><Upload size={17}/></span><div><b>{form.cover || "上传封面图片"}</b><small>支持 JPG、PNG 格式</small></div></div><label className="secondary-button">{form.cover ? "更换图片" : "选择图片"}<input type="file" accept="image/*" onChange={(event) => update("cover", event.target.files?.[0]?.name || "")}/></label></div></div>
          </div>
          <div className="form-section safety-scope-section">
            <h3>项目投放范围</h3>
            <p className="safety-section-hint">选择这条资讯可以展示到哪些项目。</p>
            <div className="scope-radio-group">
              <label><input type="radio" name="safety-scope" checked={form.scope === "all"} onChange={() => update("scope", "all")}/><span><b>全部项目</b><small>所有项目下的老人均可看到</small></span></label>
              <label><input type="radio" name="safety-scope" checked={form.scope === "projects"} onChange={() => update("scope", "projects")}/><span><b>指定项目</b><small>仅投放到勾选的项目</small></span></label>
            </div>
            {form.scope === "projects" && <div className="project-scope-list">{enabledProjects.map((project) => <label key={project.id}><input type="checkbox" checked={form.projectIds.includes(project.id)} onChange={() => toggleProject(project.id)}/><span><b>{project.name}</b><small>{project.community}</small></span></label>)}</div>}
            {errors.projectIds && <small className="field-error scope-error">{errors.projectIds}</small>}
          </div>
        </div>
        <footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={submit}>保存资讯</button></footer>
      </aside>
    </div>
  );
}

function ManagementPage({ page, onCreate }) {
  const meta = pageMeta[page] || pageMeta.elderly;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部状态");
  return (
    <>
      <div className="page-heading"><div><h1>{meta.title}</h1><p>{meta.description}</p></div><button className="primary-button" onClick={onCreate}><Plus size={16}/>{meta.add}</button></div>
      <section className="panel management-panel">
        <div className="filters">
          <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="输入名称、编号或关联对象" /></div></label>
          <label><span>所属项目</span><button className="select-button wide">全部项目 <ChevronDown size={14}/></button></label>
          <label><span>状态</span><button className="select-button" onClick={() => setStatus(status === "全部状态" ? "服务中" : "全部状态")}>{status}<ChevronDown size={14}/></button></label>
          <div className="filter-actions"><button className="primary-button"><Search size={15}/>查询</button><button className="secondary-button" onClick={() => {setQuery(""); setStatus("全部状态");}}><RefreshCw size={15}/>重置</button></div>
        </div>
        <div className="table-toolbar"><div><span className="result-count">共 {page === "elderly" ? 286 : 42} 条</span><button className="batch-button">批量操作 <ChevronDown size={14}/></button></div><button className="icon-button" title="刷新"><RefreshCw size={16}/></button></div>
        <div className="table-scroll"><DataTable page={page} query={query}/></div>
        <div className="pagination"><span>共 {page === "elderly" ? 286 : 42} 条数据</span><div><button className="select-button">10 条/页 <ChevronDown size={14}/></button><button className="page-arrow"><ChevronLeft size={15}/></button><button className="page-number active">1</button><button className="page-number">2</button><button className="page-number">3</button><button className="page-arrow"><ChevronRight size={15}/></button></div></div>
      </section>
    </>
  );
}

function CareScriptManagementPage({ scripts, onEdit, onToggle }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部状态");
  const rows = weatherConditionCatalog.map((condition) => ({
    ...condition,
    script: careScriptMockApi.getByCondition(scripts, condition.code),
  })).filter((item) => {
    const keyword = query.trim().toLowerCase();
    const matchesKeyword = !keyword || `${item.name}${item.description}${item.script?.template || ""}`.toLowerCase().includes(keyword);
    const rowStatus = item.script?.status || "未配置";
    return matchesKeyword && (status === "全部状态" || rowStatus === status);
  });
  const enabledCount = scripts.filter((item) => item.status === "启用").length;
  const disabledCount = scripts.filter((item) => item.status === "停用").length;
  const unconfiguredCount = weatherConditionCatalog.length - scripts.length;
  const previewVariables = { 老人称呼: "妈妈", 子女称呼: "阿强", 城市: "伦敦", 天气: "下雨", 温度: "18℃" };

  return <>
    <div className="page-heading"><div><h1>关怀话术</h1><p>每种天气情况只维护一条当前话术，供老人端按天气匹配展示</p></div></div>
    <div className="care-script-summary-grid">
      <div><span>天气情况</span><b>{weatherConditionCatalog.length}</b><small>由系统固定定义</small></div>
      <div><span>已启用</span><b>{enabledCount}</b><small>可生成天气关怀话术</small></div>
      <div><span>已停用</span><b>{disabledCount}</b><small>不再生成新话术</small></div>
      <div><span>待配置</span><b className={unconfiguredCount ? "warning" : ""}>{unconfiguredCount}</b><small>暂无可匹配话术</small></div>
    </div>
    <section className="panel management-panel care-script-panel">
      <div className="filters care-script-filters">
        <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="天气情况或话术内容"/></div></label>
        <label><span>状态</span><select className="select-control filter-select" value={status} onChange={(event) => setStatus(event.target.value)}><option>全部状态</option><option>启用</option><option>停用</option><option>未配置</option></select></label>
        <div className="filter-actions"><button className="primary-button"><Search size={15}/>查询</button><button className="secondary-button" onClick={() => { setQuery(""); setStatus("全部状态"); }}><RefreshCw size={15}/>重置</button></div>
      </div>
      <div className="table-toolbar"><div><span className="result-count">共 {rows.length} 种天气情况</span><span className="toolbar-hint">相同天气情况再次维护时直接编辑当前记录，不新增重复话术</span></div></div>
      <div className="table-scroll"><table className="care-script-table"><thead><tr><th>天气情况</th><th>当前话术</th><th>变量预览</th><th>版本</th><th>状态</th><th>最后更新</th><th className="sticky-right">操作</th></tr></thead><tbody>
        {rows.map((item) => <tr key={item.code}><td><div className="care-weather-cell"><span><CloudSun size={17}/></span><div><b>{item.name}</b><small>{item.description}</small></div></div></td><td>{item.script ? <p className="care-script-copy">{item.script.template}</p> : <span className="muted-value">尚未配置话术</span>}</td><td>{item.script ? <p className="care-script-preview-text">{careScriptMockApi.renderTemplate(item.script.template, previewVariables)}</p> : "—"}</td><td>{item.script ? `V${item.script.version}` : "—"}</td><td>{item.script ? <button type="button" role="switch" aria-checked={item.script.status === "启用"} className={`strategy-status-switch ${item.script.status === "启用" ? "active" : ""}`} onClick={() => onToggle(item.script.weatherCode)}><i/><span>{item.script.status}</span></button> : <StatusTag>未配置</StatusTag>}</td><td>{item.script ? <div className="stacked-cell"><b>{item.script.updatedAt}</b><small>{item.script.operator}</small></div> : "—"}</td><td className="sticky-right"><button className="table-action" onClick={() => onEdit(item, item.script)}>{item.script ? "编辑" : "配置"}</button></td></tr>)}
        {!rows.length && <tr><td colSpan="7"><div className="empty-table-state">没有符合条件的天气情况</div></td></tr>}
      </tbody></table></div>
      <div className="pagination"><span>当前展示 {rows.length} 种天气情况</span></div>
    </section>
  </>;
}

function CareScriptDrawer({ condition, record, onClose, onSave }) {
  const [form, setForm] = useState({ template: record?.template || "", status: record?.status || "启用" });
  const [error, setError] = useState("");
  const variables = ["{老人称呼}", "{子女称呼}", "{城市}", "{天气}", "{温度}"];
  const preview = careScriptMockApi.renderTemplate(form.template, { 老人称呼: "妈妈", 子女称呼: "阿强", 城市: "伦敦", 天气: condition.name, 温度: "18℃" });
  const appendVariable = (variable) => setForm((current) => ({ ...current, template: `${current.template}${variable}` }));
  const save = () => {
    const template = form.template.trim();
    if (!template) {
      setError("请输入关怀话术");
      return;
    }
    if (template.length > 160) {
      setError("关怀话术最多 160 个字符");
      return;
    }
    onSave(condition, { ...form, template });
  };

  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer care-script-drawer" role="dialog" aria-modal="true" aria-label={`${record ? "编辑" : "配置"}${condition.name}关怀话术`}>
    <header><div><h2>{record ? "编辑关怀话术" : "配置关怀话术"}</h2><p>{condition.name} · 每种天气情况仅保留一条当前话术</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
    <div className="drawer-body">
      <div className="form-section care-script-form">
        <h3>话术内容</h3>
        <div className="care-condition-card"><span><CloudSun size={20}/></span><div><b>{condition.name}</b><small>{condition.description}</small></div><StatusTag>{record ? `当前 V${record.version}` : "首次配置"}</StatusTag></div>
        <label><span>关怀话术 *</span><textarea rows="6" value={form.template} onChange={(event) => { setForm((current) => ({ ...current, template: event.target.value })); setError(""); }} placeholder="请输入老人端匹配后展示的关怀话术"/><small className="field-help">支持以下变量，匹配时由系统替换为当前老人、子女和天气数据。</small>{error && <small className="field-error">{error}</small>}</label>
        <div className="care-variable-list"><span>可用变量</span><div>{variables.map((variable) => <button type="button" key={variable} onClick={() => appendVariable(variable)}>{variable}</button>)}</div></div>
        <div className="care-script-preview"><span>变量预览</span><p>{preview || "输入话术后将在这里展示替换变量后的效果"}</p><small>示例数据：妈妈、阿强、伦敦、{condition.name}、18℃</small></div>
        <label><span>启用状态 *</span><div className="strategy-enable-options"><button type="button" className={form.status === "启用" ? "active" : ""} onClick={() => setForm((current) => ({ ...current, status: "启用" }))}><b>启用</b><small>老人端可按天气情况匹配展示</small></button><button type="button" className={form.status === "停用" ? "active" : ""} onClick={() => setForm((current) => ({ ...current, status: "停用" }))}><b>停用</b><small>不再生成新的天气话术</small></button></div></label>
      </div>
      <div className="form-tip"><ShieldCheck size={18}/><div><b>历史留言保持不变</b><p>{record?.historyCount ? `当前话术已关联 ${record.historyCount} 条历史留言。` : "保存后生成的留言会记录当时的话术正文。"}编辑或停用只影响后续匹配，已发送留言继续保留生成时的正文快照。</p></div></div>
    </div>
    <footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={save}>{record ? "保存修改" : "保存话术"}</button></footer>
  </aside></div>;
}

function FamilyAlbumBatchManagementPage({ categories, batches, elderlyRecords, relatives, onAddCategory, onEditCategory, onToggleCategory, onDeleteCategory, onViewBatch }) {
  const [activeTab, setActiveTab] = useState("batches");
  const initialFilters = { elderlyId: "全部老人", relativeId: "全部子女", categoryId: "全部分类", contentType: "全部内容类型", date: "", publishStatus: "全部发布状态", syncStatus: "全部同步状态" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [categoryAction, setCategoryAction] = useState(null);
  const categoryMap = new Map(categories.map((item) => [item.id, item]));
  const rows = batches.map((batch) => ({
    ...batch,
    mediaCount: batch.photoCount + batch.videoCount,
    elderly: elderlyRecords.find((item) => item.id === batch.elderlyId),
    uploader: relatives.find((item) => item.id === batch.uploaderId),
    category: categoryMap.get(batch.categoryId),
  })).filter((batch) => (
    (filters.elderlyId === "全部老人" || batch.elderlyId === filters.elderlyId)
    && (filters.relativeId === "全部子女" || batch.uploaderId === filters.relativeId)
    && (filters.categoryId === "全部分类" || batch.categoryId === filters.categoryId)
    && (filters.contentType === "全部内容类型" || batch.contentType === filters.contentType)
    && (!filters.date || batch.uploadedAt.startsWith(filters.date))
    && (filters.publishStatus === "全部发布状态" || batch.publishStatus === filters.publishStatus)
    && (filters.syncStatus === "全部同步状态" || batch.syncStatus === filters.syncStatus)
  ));
  const categoryRows = [...categories].sort((a, b) => a.sort - b.sort).map((category) => {
    const referencedBatches = batches.filter((batch) => batch.categoryId === category.id);
    const photoCount = referencedBatches.reduce((sum, batch) => sum + batch.photoCount, 0);
    const videoCount = referencedBatches.reduce((sum, batch) => sum + batch.videoCount, 0);
    return { ...category, batchCount: referencedBatches.length, photoCount, videoCount, mediaCount: photoCount + videoCount };
  });
  const resetFilters = () => { setDraftFilters(initialFilters); setFilters(initialFilters); };
  const syncedCount = batches.filter((batch) => batch.syncStatus === "已同步").length;
  const failedCount = batches.filter((batch) => ["同步失败", "部分失败", "未入队"].includes(batch.syncStatus)).length;
  const viewedCount = batches.filter((batch) => batch.firstViewedAt).length;
  const totalPhotos = batches.reduce((sum, batch) => sum + batch.photoCount, 0);
  const totalVideos = batches.reduce((sum, batch) => sum + batch.videoCount, 0);
  const totalMedia = totalPhotos + totalVideos;

  return <>
    <div className="page-heading"><div><h1>家庭相册</h1><p>不展示家庭影像内容，仅管理照片和视频批次、送达状态与老人互动结果</p></div>{activeTab === "categories" && <button className="primary-button" onClick={onAddCategory}><Plus size={16}/>新增分类</button>}</div>
    <div className="album-overview-grid">
      <div><span>上传批次</span><b>{batches.length}</b><small>共 {totalMedia} 个影像 · 照片 {totalPhotos} · 视频 {totalVideos}</small></div>
      <div><span>已同步批次</span><b>{syncedCount}</b><small>已送达老人端家庭相册</small></div>
      <div><span>同步异常</span><b className={failedCount ? "danger" : ""}>{failedCount}</b><small>等待自动重试或技术排查</small></div>
      <div><span>老人已查看</span><b>{viewedCount}</b><small>按批次记录首次查看时间</small></div>
    </div>
    <section className="panel album-management-panel">
      <div className="album-management-tabs">
        <button className={activeTab === "batches" ? "active" : ""} onClick={() => setActiveTab("batches")}><Images size={16}/>上传批次 <span>{batches.length}</span></button>
        <button className={activeTab === "categories" ? "active" : ""} onClick={() => setActiveTab("categories")}><SlidersHorizontal size={16}/>相册分类 <span>{categories.length}</span></button>
      </div>
      {activeTab === "batches" ? <>
        <div className="filters album-batch-filters">
          <label><span>接收老人</span><select className="select-control filter-select" value={draftFilters.elderlyId} onChange={(event) => setDraftFilters((current) => ({ ...current, elderlyId: event.target.value }))}><option>全部老人</option>{elderlyRecords.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label><span>上传子女</span><select className="select-control filter-select" value={draftFilters.relativeId} onChange={(event) => setDraftFilters((current) => ({ ...current, relativeId: event.target.value }))}><option>全部子女</option>{relatives.filter((item) => item.links.length).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label><span>相册分类</span><select className="select-control filter-select" value={draftFilters.categoryId} onChange={(event) => setDraftFilters((current) => ({ ...current, categoryId: event.target.value }))}><option>全部分类</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label><span>内容类型</span><select className="select-control filter-select" value={draftFilters.contentType} onChange={(event) => setDraftFilters((current) => ({ ...current, contentType: event.target.value }))}><option>全部内容类型</option><option>仅照片</option><option>仅视频</option><option>照片和视频</option></select></label>
          <label className="album-date-filter"><span>上传日期</span><div className="album-date-control"><CalendarDays size={15}/><input aria-label="上传日期" type="date" value={draftFilters.date} onChange={(event) => setDraftFilters((current) => ({ ...current, date: event.target.value }))}/></div></label>
          <label><span>发布状态</span><select className="select-control filter-select" value={draftFilters.publishStatus} onChange={(event) => setDraftFilters((current) => ({ ...current, publishStatus: event.target.value }))}><option>全部发布状态</option><option>已发布</option><option>已撤回</option><option>发布失败</option></select></label>
          <label><span>同步状态</span><select className="select-control filter-select" value={draftFilters.syncStatus} onChange={(event) => setDraftFilters((current) => ({ ...current, syncStatus: event.target.value }))}><option>全部同步状态</option><option>待同步</option><option>同步中</option><option>已同步</option><option>部分失败</option><option>同步失败</option><option>未入队</option><option>已撤回</option></select></label>
          <div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={resetFilters}><RefreshCw size={15}/>重置</button></div>
        </div>
        <div className="table-scroll"><table className="family-album-batch-table"><thead><tr><th>上传子女</th><th>接收老人</th><th>相册分类</th><th>内容类型</th><th>照片数量</th><th>视频数量</th><th>影像总数</th><th>上传时间</th><th>发布状态</th><th>同步状态</th><th>首次查看时间</th><th>已喜欢影像</th><th>最后喜欢时间</th><th className="sticky-right">操作</th></tr></thead><tbody>
          {rows.map((batch) => <tr key={batch.id}><td><div className="stacked-cell"><b>{batch.uploader?.name || "账号已移除"}</b><small>{batch.uploader?.phone || "—"}</small></div></td><td><div className="stacked-cell"><b>{batch.elderly?.name || "档案已移除"}</b><small>{batch.elderly?.project || "—"}</small></div></td><td><div className="stacked-cell"><b>{batch.categoryNameSnapshot}</b><small>{batch.category?.status === "停用" ? "当前分类已停用" : "分类快照"}</small></div></td><td><StatusTag>{batch.contentType}</StatusTag></td><td><b>{batch.photoCount} 张</b></td><td><b>{batch.videoCount} 个</b></td><td><b>{batch.mediaCount} 个</b></td><td>{batch.uploadedAt}</td><td><StatusTag>{batch.publishStatus}</StatusTag></td><td><div className="stacked-cell"><StatusTag>{batch.syncStatus}</StatusTag><small>{batch.syncError || `${batch.successCount}/${batch.mediaCount} 成功`}</small></div></td><td>{batch.firstViewedAt || "尚未查看"}</td><td><b>{batch.likedMediaCount} 个</b></td><td>{batch.lastLikedAt || "尚无喜欢记录"}</td><td className="sticky-right"><button className="table-action" onClick={() => onViewBatch(batch)}>详情</button></td></tr>)}
          {!rows.length && <tr><td colSpan="14"><div className="empty-table-state">暂无符合条件的上传批次</div></td></tr>}
        </tbody></table></div>
        <div className="pagination"><span>当前展示 {rows.length} 个批次</span></div>
      </> : <>
        <div className="table-toolbar album-category-toolbar"><div><span className="result-count">共 {categoryRows.length} 个系统分类</span><span className="toolbar-hint">停用后不再供新批次选择，历史批次保留分类名称快照</span></div></div>
        <div className="table-scroll"><table className="album-category-table"><thead><tr><th>排序</th><th>分类名称</th><th>分类说明</th><th>引用情况</th><th>状态</th><th>更新时间</th><th className="sticky-right">操作</th></tr></thead><tbody>
          {categoryRows.map((category) => <tr key={category.id}><td className="mono">{category.sort}</td><td><b>{category.name}</b></td><td>{category.description}</td><td><div className="stacked-cell"><b>{category.batchCount} 批 / {category.mediaCount} 个影像</b><small>照片 {category.photoCount} · 视频 {category.videoCount}</small></div></td><td><button type="button" role="switch" aria-checked={category.status === "启用"} className={`strategy-status-switch ${category.status === "启用" ? "active" : ""}`} onClick={() => onToggleCategory(category.id)}><i/><span>{category.status}</span></button></td><td>{category.updatedAt}</td><td className="sticky-right"><button className="table-action" onClick={() => onEditCategory(category)}>编辑</button><button className="table-action danger-text" onClick={() => setCategoryAction({ category, mediaCount: category.mediaCount, type: category.mediaCount ? "blocked" : "confirm" })}>删除</button></td></tr>)}
        </tbody></table></div>
        <div className="pagination"><span>当前展示 {categoryRows.length} 个系统分类</span></div>
      </>}
    </section>
    {categoryAction && <div className="modal-layer"><button className="modal-backdrop" aria-label="关闭分类操作提示" onClick={() => setCategoryAction(null)}/><section className="confirm-dialog" role="dialog" aria-modal="true"><span className={`confirm-icon ${categoryAction.type === "blocked" ? "warning" : "danger"}`}><AlertTriangle size={20}/></span><h3>{categoryAction.type === "blocked" ? "该分类不能删除" : `确认删除“${categoryAction.category.name}”？`}</h3><p>{categoryAction.type === "blocked" ? `该分类已有 ${categoryAction.mediaCount} 个影像（照片与视频合计），不能删除。你可以停用该分类，停用后不会影响历史影像记录。` : "该分类尚未被影像引用，删除后将从分类管理中移除。"}</p><div><button className="secondary-button" onClick={() => setCategoryAction(null)}>关闭</button>{categoryAction.type === "blocked" ? categoryAction.category.status === "启用" && <button className="primary-button" onClick={() => { onToggleCategory(categoryAction.category.id); setCategoryAction(null); }}>停用分类</button> : <button className="danger-button" onClick={() => { onDeleteCategory(categoryAction.category.id); setCategoryAction(null); }}>确认删除</button>}</div></section></div>}
  </>;
}

function FamilyAlbumBatchDetailDrawer({ batch, elderly, uploader, category, onClose }) {
  const mediaCount = batch.photoCount + batch.videoCount;
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer family-album-batch-detail-drawer" role="dialog" aria-modal="true" aria-label="家庭影像批次详情"><header><div><h2>上传批次详情</h2><p>{batch.uploadedAt} · {batch.categoryNameSnapshot}</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body">
    <section className="detail-section"><h3>批次与关系</h3><div className="info-grid"><div><span>上传子女</span><b>{uploader?.name || "账号已移除"}</b></div><div><span>接收老人</span><b>{elderly?.name || "档案已移除"}</b></div><div><span>相册分类</span><b>{batch.categoryNameSnapshot}</b></div><div><span>内容类型</span><StatusTag>{batch.contentType}</StatusTag></div><div><span>照片数量</span><b>{batch.photoCount} 张</b></div><div><span>视频数量</span><b>{batch.videoCount} 个</b></div><div><span>影像总数</span><b>{mediaCount} 个</b></div><div><span>上传时间</span><b>{batch.uploadedAt}</b></div><div><span>关系状态</span><StatusTag>{batch.relationStatus}</StatusTag></div><div><span>当前分类状态</span><StatusTag>{category?.status || "分类已删除"}</StatusTag></div><div className="full"><span>附言情况</span><b>{batch.hasMessage ? "有附言（正文不展示）" : "无附言"}</b></div></div></section>
    <section className="detail-section"><h3>发布与同步</h3><div className="info-grid"><div><span>发布状态</span><StatusTag>{batch.publishStatus}</StatusTag></div><div><span>同步状态</span><StatusTag>{batch.syncStatus}</StatusTag></div><div><span>同步结果</span><b>{batch.successCount} 个成功 / {batch.failedCount} 个失败</b></div><div><span>最近同步</span><b>{batch.lastSyncAt}</b></div>{batch.syncError && <div className="full"><span>异常原因</span><b className="danger-text">{batch.syncError}</b></div>}</div></section>
    <section className="detail-section"><h3>老人互动</h3><div className="info-grid"><div><span>首次查看时间</span><b>{batch.firstViewedAt || "尚未查看"}</b></div><div><span>已喜欢影像数量</span><b>{batch.likedMediaCount} 个</b></div><div><span>最后喜欢时间</span><b>{batch.lastLikedAt || "尚无喜欢记录"}</b></div><div><span>历史互动保留</span><b>是</b></div></div></section>
    {batch.withdrawnAt && <section className="detail-section"><h3>历史状态记录</h3><div className="info-grid"><div><span>记录人</span><b>{batch.withdrawnBy}</b></div><div><span>记录时间</span><b>{batch.withdrawnAt}</b></div><div className="full"><span>状态说明</span><b>{batch.withdrawalReason}</b></div></div></section>}
    <div className="form-tip"><ShieldCheck size={18}/><div><b>家庭隐私保护</b><p>后台仅记录影像数量、同步和互动结果；不展示照片、不播放视频、不展示缩略图或视频封面，也不展示附言正文。后台不能代替老人查看、播放或喜欢影像。</p></div></div>
  </div><footer><button className="secondary-button" onClick={onClose}>关闭</button></footer></aside></div>;
}

function AlbumCategoryDrawer({ record, categories, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", description: "", sort: categories.length + 1, status: "启用", ...record });
  const [errors, setErrors] = useState({});
  const save = () => {
    const nextErrors = {};
    const name = form.name.trim();
    if (!name) nextErrors.name = "请输入分类名称";
    if (categories.some((item) => item.id !== record?.id && item.name === name)) nextErrors.name = "分类名称已存在";
    if (!Number.isInteger(Number(form.sort)) || Number(form.sort) < 1) nextErrors.sort = "排序必须为大于 0 的整数";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ ...form, name, description: form.description.trim(), sort: Number(form.sort) });
  };
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer album-category-drawer" role="dialog" aria-modal="true" aria-label={record ? "编辑相册分类" : "新增相册分类"}><header><div><h2>{record ? "编辑相册分类" : "新增相册分类"}</h2><p>系统分类同时适用于子女发布的照片和视频</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="form-section"><h3>分类信息</h3><label><span>分类名称 *</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="例如：家庭日常"/>{errors.name && <small className="field-error">{errors.name}</small>}</label><label><span>分类说明</span><textarea rows="4" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="说明该分类适合收录的照片与视频内容"/></label><label><span>排序 *</span><input type="number" min="1" step="1" value={form.sort} onChange={(event) => setForm((current) => ({ ...current, sort: event.target.value }))}/>{errors.sort && <small className="field-error">{errors.sort}</small>}</label><label><span>启用状态 *</span><div className="strategy-enable-options"><button type="button" className={form.status === "启用" ? "active" : ""} onClick={() => setForm((current) => ({ ...current, status: "启用" }))}><b>启用</b><small>可供新影像选择</small></button><button type="button" className={form.status === "停用" ? "active" : ""} onClick={() => setForm((current) => ({ ...current, status: "停用" }))}><b>停用</b><small>历史影像继续保留</small></button></div></label></div><div className="form-tip"><ShieldCheck size={18}/><div><b>历史影像分类快照</b><p>分类改名或停用不会改写历史影像保存的分类名称；存在照片或视频引用时不能物理删除。</p></div></div></div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={save}>保存分类</button></footer></aside></div>;
}

function WeatherLocationSummary({ location, query }) {
  const completeness = getWeatherLocationCompleteness(location);
  return <div className="weather-location-summary">
    <div className="weather-location-summary-head"><div><span><MapPin size={17}/></span><div><b>{formatWeatherLocation(location)}</b><small>{location?.timezone || "IANA 时区待完善"}</small></div></div><StatusTag>{location?.status || "待完善"}</StatusTag></div>
    <div className="weather-location-progress"><div><span style={{ width: `${completeness}%` }}/></div><b>{completeness}%</b></div>
    {location?.invalidReason && <p className="weather-location-warning"><AlertTriangle size={15}/>{location.invalidReason}</p>}
    <div className="weather-location-meta"><span>来源：{location?.source || "尚未设置"}</span><span>更新：{location?.updatedAt || "—"}</span><span>同步：{location?.syncStatus || "待同步"}</span><span>天气：{query?.status || (location?.status === "有效" ? "尚未查询" : "不可查询")}</span></div>
  </div>;
}

function WeatherLocationManagementPage({ integrations, onView }) {
  const initialFilters = { query: "", accessStatus: "全部接入状态", queryStatus: "全部查询状态" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const rows = integrations.filter((item) => {
    const keyword = filters.query.trim().toLowerCase();
    const matchesKeyword = !keyword || [item.countryName, item.countryCode, item.coverage, item.interfaceKey, item.interfaceMode].join(" ").toLowerCase().includes(keyword);
    const matchesAccess = filters.accessStatus === "全部接入状态" || item.accessStatus === filters.accessStatus;
    const matchesQuery = filters.queryStatus === "全部查询状态" || item.queryStatus === filters.queryStatus;
    return matchesKeyword && matchesAccess && matchesQuery;
  });
  const connectedCount = integrations.filter((item) => item.accessStatus === "已接入").length;
  const normalCount = integrations.filter((item) => item.queryStatus === "正常").length;
  const cachedCount = integrations.filter((item) => item.queryStatus === "使用缓存").length;
  const pendingCount = integrations.filter((item) => item.accessStatus === "待接入").length;
  return <>
    <div className="page-heading"><div><h1>天气位置</h1><p>按国家和地区维护天气接口接入，不展示个人地址或个人同步记录</p></div></div>
    <div className="weather-overview-grid">
      <div><span>区域配置</span><b>{integrations.length}</b><small>当前按国家 / 地区归集</small></div>
      <div><span>已接入</span><b>{connectedCount}</b><small>可进入天气查询链路</small></div>
      <div><span>查询正常</span><b>{normalCount}</b><small>{cachedCount} 个区域当前使用缓存</small></div>
      <div><span>待接入</span><b className={pendingCount ? "warning" : ""}>{pendingCount}</b><small>暂不提供天气查询</small></div>
    </div>
    <section className="panel management-panel weather-management-panel">
      <div className="filters weather-location-filters">
        <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} placeholder="国家、地区或接口标识"/></div></label>
        <label><span>接入状态</span><select className="select-control filter-select" value={draftFilters.accessStatus} onChange={(event) => setDraftFilters((current) => ({ ...current, accessStatus: event.target.value }))}><option>全部接入状态</option><option>已接入</option><option>待接入</option><option>已停用</option></select></label>
        <label><span>查询状态</span><select className="select-control filter-select" value={draftFilters.queryStatus} onChange={(event) => setDraftFilters((current) => ({ ...current, queryStatus: event.target.value }))}><option>全部查询状态</option><option>正常</option><option>使用缓存</option><option>查询失败</option><option>不可查询</option></select></label>
        <div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={() => { setDraftFilters(initialFilters); setFilters(initialFilters); }}><RefreshCw size={15}/>重置</button></div>
      </div>
      <div className="table-toolbar"><div><span className="result-count">共 {rows.length} 个区域</span><span className="toolbar-hint">当前仅展示 Mock 接入状态，不接入或猜测真实天气供应商</span></div></div>
      <div className="table-scroll"><table className="weather-location-table weather-region-table"><thead><tr><th>国家 / 地区</th><th>接入范围</th><th>天气接口</th><th>关联标准位置</th><th>接入状态</th><th>查询状态</th><th>最近检测</th><th className="sticky-right">操作</th></tr></thead><tbody>
        {rows.map((row) => <tr key={row.id}><td><div className="weather-region-cell"><span>{row.countryCode}</span><div><b>{row.countryName}</b><small>{row.granularity}</small></div></div></td><td>{row.coverage}</td><td><div className="stacked-cell"><b>{row.interfaceMode}</b><small>{row.interfaceKey}</small></div></td><td>{row.linkedLocationCount} 个</td><td><StatusTag>{row.accessStatus}</StatusTag></td><td><div className="stacked-cell"><StatusTag>{row.queryStatus}</StatusTag><small>{row.cacheStatus}</small></div></td><td><div className="stacked-cell"><b>{row.lastCheckedAt}</b><small>最近成功 {row.lastSuccessAt}</small></div></td><td className="sticky-right"><button className="table-action" onClick={() => onView(row)}>详情</button></td></tr>)}
        {!rows.length && <tr><td colSpan="8"><div className="empty-table-state">暂无符合条件的区域接入记录</div></td></tr>}
      </tbody></table></div>
      <div className="pagination"><span>当前展示 {rows.length} 个国家 / 地区</span></div>
    </section>
  </>;
}

function WeatherRegionIntegrationDrawer({ integration, onClose }) {
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer weather-location-drawer weather-region-drawer" role="dialog" aria-modal="true" aria-label="区域天气接入详情"><header><div><h2>区域天气接入详情</h2><p>{integration.countryName} · {integration.countryCode}</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body">
    <div className="weather-region-hero"><span><CloudSun size={22}/></span><div><h3>{integration.countryName}</h3><p>{integration.coverage} · {integration.granularity}</p></div><StatusTag>{integration.accessStatus}</StatusTag></div>
    <section className="detail-section"><h3>接入配置</h3><div className="info-grid"><div><span>区域配置 ID</span><b>{integration.id}</b></div><div><span>国家 / 地区代码</span><b>{integration.countryCode}</b></div><div><span>接入范围</span><b>{integration.coverage}</b></div><div><span>配置颗粒度</span><b>{integration.granularity}</b></div><div><span>接口模式</span><b>{integration.interfaceMode}</b></div><div><span>接口标识</span><b>{integration.interfaceKey}</b></div><div><span>关联标准位置</span><b>{integration.linkedLocationCount} 个</b></div><div><span>接入状态</span><StatusTag>{integration.accessStatus}</StatusTag></div></div></section>
    <section className="detail-section"><h3>技术诊断</h3><div className="info-grid"><div><span>查询状态</span><StatusTag>{integration.queryStatus}</StatusTag></div><div><span>缓存状态</span><StatusTag>{integration.cacheStatus}</StatusTag></div><div><span>最近检测</span><b>{integration.lastCheckedAt}</b></div><div><span>最近成功</span><b>{integration.lastSuccessAt}</b></div><div className="full"><span>诊断说明</span><b>{integration.message}</b></div></div></section>
    <div className="form-tip"><ShieldCheck size={18}/><div><b>区域接入口径</b><p>本页按国家 / 地区维护天气服务接入。老人和亲属的具体常住地址仍在各自档案中维护，不在这里逐人展示。</p></div></div>
  </div><footer><button className="secondary-button" onClick={onClose}>关闭</button></footer></aside></div>;
}

function RelativeWeatherLocationDrawer({ account, location, onClose, onSave }) {
  const [form, setForm] = useState({ countryCode: location?.countryCode || "", regionCode: location?.regionCode || "", cityCode: location?.cityCode || "" });
  const country = weatherLocationCatalog.find((item) => item.code === form.countryCode);
  const region = country?.regions.find((item) => item.code === form.regionCode);
  const city = region?.cities.find((item) => item.code === form.cityCode);
  const updateCountry = (countryCode) => setForm({ countryCode, regionCode: "", cityCode: "" });
  const updateRegion = (regionCode) => setForm((current) => ({ ...current, regionCode, cityCode: "" }));
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer weather-location-edit-drawer" role="dialog" aria-modal="true" aria-label="维护亲属天气位置"><header><div><h2>维护亲属天气位置</h2><p>{account.name} · {account.phone}</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="form-section"><h3>常住位置</h3>
    <label><span>国家 / 地区 *</span><select className="select-control form-select-native" value={form.countryCode} onChange={(event) => updateCountry(event.target.value)}><option value="">请选择国家 / 地区</option>{weatherLocationCatalog.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
    <label><span>行政区 *</span><select className="select-control form-select-native" value={form.regionCode} disabled={!country} onChange={(event) => updateRegion(event.target.value)}><option value="">请选择行政区</option>{country?.regions.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
    <label><span>城市 *</span><select className="select-control form-select-native" value={form.cityCode} disabled={!region} onChange={(event) => setForm((current) => ({ ...current, cityCode: event.target.value }))}><option value="">请选择城市</option>{region?.cities.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
    {city && <div className="resolved-location-preview"><MapPin size={18}/><div><b>{city.name} · {region.name} · {country.name}</b><small>{city.latitude}, {city.longitude} · {city.timezone}</small></div></div>}
  </div><div className="form-tip"><ShieldCheck size={18}/><div><b>位置维护规则</b><p>城市必须通过国家和行政区逐级选择，保存后自动带入经纬度与 IANA 时区；后台不允许编辑天气事实。</p></div></div></div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" disabled={!city} onClick={() => onSave(weatherMockApi.resolveSelection(form.countryCode, form.regionCode, form.cityCode))}>保存位置</button></footer></aside></div>;
}

function RelativeArchivePage({ accounts, elderlyRecords, weatherLocations, onOpen }) {
  const initialFilters = { query: "", project: "全部项目", relationStatus: "全部关联状态" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const projectOptions = ["全部项目", ...new Set(elderlyRecords.map((record) => record.project).filter(Boolean))];
  const rows = accounts.map((account) => ({
    ...account,
    weatherLocation: weatherMockApi.getLocation(weatherLocations, "亲属", account.id),
    linkedElderly: account.links.map((link) => ({
      ...link,
      elderly: elderlyRecords.find((record) => record.id === link.elderlyId),
    })).filter((link) => link.elderly),
  })).filter((account) => {
    const keyword = filters.query.trim().toLowerCase();
    const relationStatus = account.linkedElderly.length ? "已关联" : "未关联";
    const matchesKeyword = !keyword || [
      account.name,
      account.phone,
      account.weatherLocation?.cityName,
      account.weatherLocation?.countryName,
      ...account.linkedElderly.flatMap((link) => [link.elderly.name, link.elderly.phone, link.elderly.project, link.relation]),
    ].some((field) => `${field || ""}`.toLowerCase().includes(keyword));
    const matchesProject = filters.project === "全部项目" || account.linkedElderly.some((link) => link.elderly.project === filters.project);
    return matchesKeyword && matchesProject && (filters.relationStatus === "全部关联状态" || relationStatus === filters.relationStatus);
  });
  const linkedCount = accounts.filter((account) => account.links.length).length;
  const search = () => setFilters(draftFilters);
  const reset = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
  };

  return (
    <>
      <div className="page-heading"><div><h1>亲属档案</h1><p>查看所有手机号注册用户及其关联的老人</p></div></div>
      <section className="panel management-panel relative-archive-panel">
        <div className="filters relative-archive-filters">
          <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") search(); }} placeholder="亲属姓名、手机号或老人姓名"/></div></label>
          <label><span>所属项目</span><select className="select-control filter-select wide" value={draftFilters.project} onChange={(event) => setDraftFilters((current) => ({ ...current, project: event.target.value }))}>{projectOptions.map((project) => <option key={project}>{project}</option>)}</select></label>
          <label><span>关联状态</span><select className="select-control filter-select" value={draftFilters.relationStatus} onChange={(event) => setDraftFilters((current) => ({ ...current, relationStatus: event.target.value }))}><option>全部关联状态</option><option>已关联</option><option>未关联</option></select></label>
          <div className="filter-actions"><button className="primary-button" onClick={search}><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div>
        </div>
        <div className="table-toolbar"><div><span className="result-count">共 {rows.length} 位注册用户</span><span className="toolbar-hint">{linkedCount} 位已关联老人 · {accounts.length - linkedCount} 位尚未关联</span></div></div>
        <div className="table-scroll">
          <table className="relative-archive-table">
            <thead><tr><th>注册用户</th><th>注册手机</th><th>关联老人 / 关系</th><th>天气位置</th><th>关联状态</th><th>注册时间</th><th>最近登录</th><th>账号状态</th><th className="sticky-right">操作</th></tr></thead>
            <tbody>
              {rows.map((account) => (
                <tr key={account.id}>
                  <td><div className="relative-user-cell"><span>{account.name.slice(-1)}</span><b>{account.name}</b></div></td>
                  <td>{account.phone}</td>
                  <td>
                    {account.linkedElderly.length ? (
                      <div className="relative-link-list">
                        {account.linkedElderly.map((link) => <div className="relative-link-row" key={`${account.id}-${link.elderly.id}`}><div><b>{link.elderly.name}</b><small>{link.elderly.project}</small></div><span>{link.relation}</span></div>)}
                      </div>
                    ) : <span className="relative-empty-link">尚未关联老人</span>}
                  </td>
                  <td><div className="stacked-cell"><b>{formatWeatherLocation(account.weatherLocation)}</b><small><StatusTag>{account.weatherLocation?.status || "待完善"}</StatusTag> · 完整度 {getWeatherLocationCompleteness(account.weatherLocation)}%</small></div></td>
                  <td><StatusTag>{account.linkedElderly.length ? "已关联" : "未关联"}</StatusTag></td>
                  <td>{account.registeredAt}</td>
                  <td>{account.lastActive}</td>
                  <td><StatusTag>{account.status}</StatusTag></td>
                  <td className="sticky-right"><button className="table-action" onClick={() => onOpen(account)}>详情</button></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan="9"><div className="empty-table-state">没有符合条件的亲属账号</div></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="pagination"><span>当前展示 {rows.length} 条数据</span></div>
      </section>
    </>
  );
}

function RelativeDetailPage({ account, elderlyRecords, weatherLocation, weatherQuery, weatherAudits, onBack, onEditWeather }) {
  const [tab, setTab] = useState("profile");
  const linkedElderly = account.links.map((link) => ({
    ...link,
    elderly: elderlyRecords.find((record) => record.id === link.elderlyId),
  })).filter((link) => link.elderly);
  const operationRecords = [
    ...linkedElderly.map((link, index) => ({
      id: `link-${link.elderlyId}`,
      action: `关联老人：${link.elderly.name}`,
      detail: `亲属关系设置为“${link.relation}”`,
      operator: "用户本人",
      time: index ? account.registeredAt : account.registeredAt,
    })),
    { id: "register", action: "完成手机号注册", detail: `注册手机 ${account.phone}`, operator: "用户本人", time: account.registeredAt },
  ];

  return (
    <>
      <div className="relative-detail-heading">
        <button className="back-link" onClick={onBack}><ChevronLeft size={16}/>返回亲属档案</button>
        <div className="relative-detail-title-row">
          <span className="relative-detail-avatar">{account.name.slice(-1)}</span>
          <div><div><h1>{account.name}</h1><StatusTag>{account.status}</StatusTag></div><p>{account.phone} · 已关联 {linkedElderly.length} 位老人</p></div>
        </div>
      </div>
      <div className="detail-tabs relative-detail-tabs">
        <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>基本资料</button>
        <button className={tab === "elderly" ? "active" : ""} onClick={() => setTab("elderly")}>关联老人 <span>{linkedElderly.length}</span></button>
        <button className={tab === "weather" ? "active" : ""} onClick={() => setTab("weather")}>天气位置</button>
        <button className={tab === "logs" ? "active" : ""} onClick={() => setTab("logs")}>操作记录</button>
      </div>
      {tab === "profile" && (
        <div className="relative-detail-grid">
          <section className="panel relative-detail-section">
            <header><div><h3>账号资料</h3><p>手机号注册用户的基础信息</p></div></header>
            <div className="info-grid">
              <div><span>亲属姓名</span><b>{account.name}</b></div>
              <div><span>注册手机</span><b>{account.phone}</b></div>
              <div><span>注册时间</span><b>{account.registeredAt}</b></div>
              <div><span>最近登录</span><b>{account.lastActive}</b></div>
              <div><span>账号状态</span><StatusTag>{account.status}</StatusTag></div>
              <div><span>关联老人</span><b>{linkedElderly.length} 位</b></div>
              <div><span>常住国家 / 地区</span><b>{weatherLocation?.countryName || "待完善"}</b></div>
              <div><span>天气位置状态</span><StatusTag>{weatherLocation?.status || "待完善"}</StatusTag></div>
            </div>
          </section>
          <section className="panel relative-detail-section relative-association-summary">
            <header><div><h3>关联概况</h3><p>当前有效的老人关联关系</p></div></header>
            <div className="relative-summary-number"><b>{linkedElderly.length}</b><span>位关联老人</span></div>
            <div className="relative-summary-list">{linkedElderly.length ? linkedElderly.map((link) => <div key={link.elderly.id}><span>{link.elderly.name}</span><small>{link.relation} · {link.elderly.project}</small></div>) : <p>该用户尚未关联老人</p>}</div>
          </section>
        </div>
      )}
      {tab === "elderly" && (
        <section className="panel relative-detail-section relative-elderly-section">
          <header><div><h3>关联老人</h3><p>一个亲属账号可以关联多位老人</p></div><span>共 {linkedElderly.length} 位</span></header>
          <div className="table-scroll">
            <table className="relative-detail-table">
              <thead><tr><th>老人信息</th><th>亲属关系</th><th>所属项目 / 社区</th><th>居住地址</th><th>关联状态</th></tr></thead>
              <tbody>
                {linkedElderly.map((link) => <tr key={link.elderly.id}><td><div className="elderly-name-cell"><span className="person-avatar">{link.elderly.name.slice(-1)}</span><span><b>{link.elderly.name}</b><small>{link.elderly.gender} · {link.elderly.age} 岁</small></span></div></td><td><span className="relative-relation-tag">{link.relation}</span></td><td><div className="stacked-cell"><b>{link.elderly.project}</b><small>{link.elderly.community}</small></div></td><td>{link.elderly.address}</td><td><StatusTag>已关联</StatusTag></td></tr>)}
                {!linkedElderly.length && <tr><td colSpan="5"><div className="empty-table-state">该用户尚未关联老人</div></td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "weather" && (
        <div className="relative-weather-tab">
          <section className="panel relative-detail-section"><header><div><h3>常住天气位置</h3><p>国家、行政区和城市需逐级选择，位置以经纬度和位置对象 ID 为准</p></div><button className="secondary-button" onClick={onEditWeather}>维护位置</button></header><div className="relative-weather-body"><WeatherLocationSummary location={weatherLocation} query={weatherQuery}/><div className="info-grid"><div><span>国家 / 地区</span><b>{weatherLocation?.countryName || "待完善"}</b></div><div><span>行政区</span><b>{weatherLocation?.regionName || "待完善"}</b></div><div><span>城市</span><b>{weatherLocation?.cityName || "待完善"}</b></div><div><span>IANA 时区</span><b>{weatherLocation?.timezone || "待完善"}</b></div><div><span>纬度</span><b>{Number.isFinite(weatherLocation?.latitude) ? weatherLocation.latitude : "待解析"}</b></div><div><span>经度</span><b>{Number.isFinite(weatherLocation?.longitude) ? weatherLocation.longitude : "待解析"}</b></div><div><span>位置来源</span><b>{weatherLocation?.source || "尚未设置"}</b></div><div><span>最后更新时间</span><b>{weatherLocation?.updatedAt || "—"}</b></div></div></div></section>
          <section className="panel relative-detail-section"><header><div><h3>位置变更审计</h3><p>记录来源、操作人及变更前后值</p></div><span>共 {weatherAudits.length} 条</span></header><div className="table-scroll"><table className="relative-log-table"><thead><tr><th>操作内容</th><th>变更前</th><th>变更后</th><th>来源 / 操作人</th><th>时间</th><th>结果</th></tr></thead><tbody>{weatherAudits.map((item) => <tr key={item.id}><td><b>{item.action}</b></td><td>{item.before}</td><td>{item.after}</td><td><div className="stacked-cell"><b>{item.source}</b><small>{item.operator}</small></div></td><td>{item.operatedAt}</td><td><StatusTag>{item.result}</StatusTag></td></tr>)}{!weatherAudits.length && <tr><td colSpan="6"><div className="empty-table-state">暂无位置变更记录</div></td></tr>}</tbody></table></div></section>
        </div>
      )}
      {tab === "logs" && (
        <section className="panel relative-detail-section relative-log-section">
          <header><div><h3>操作记录</h3><p>记录账号注册及老人关联变化</p></div></header>
          <div className="table-scroll">
            <table className="relative-log-table"><thead><tr><th>操作内容</th><th>说明</th><th>操作人</th><th>操作时间</th></tr></thead><tbody>{operationRecords.map((record) => <tr key={record.id}><td><b>{record.action}</b></td><td>{record.detail}</td><td>{record.operator}</td><td>{record.time}</td></tr>)}</tbody></table>
          </div>
        </section>
      )}
    </>
  );
}

function CreateDrawer({ page, onClose }) {
  const meta = pageMeta[page] || pageMeta.elderly;
  return <div className="drawer-layer" role="presentation"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer" role="dialog" aria-modal="true" aria-label={meta.add}><header><div><h2>{meta.add}</h2><p>填写基础信息后保存，带 * 为必填项</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="form-section"><h3>基础信息</h3><label><span>名称 *</span><input placeholder={`请输入${meta.add.replace(/新增|新建|发布|录入|上传|创建/, "") || "名称"}`}/></label><label><span>所属项目 *</span><button className="select-button form-select">请选择项目 <ChevronDown size={14}/></button></label><div className="form-row"><label><span>负责人</span><input placeholder="请输入负责人"/></label><label><span>联系电话</span><input placeholder="请输入联系电话"/></label></div><label><span>备注</span><textarea placeholder="请输入补充说明" rows="4"/></label></div><div className="form-tip"><ShieldCheck size={18}/><div><b>数据范围说明</b><p>保存后仅对当前账号授权的项目和老人范围生效。</p></div></div></div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={onClose}>保存</button></footer></aside></div>;
}

export function App() {
  const [active, setActive] = useState("elderly");
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    if (!availableMenuKeys.has(active)) setActive("elderly");
  }, [active]);
  const [elderlyRecords, setElderlyRecords] = useState(() => {
    try {
      const savedRecords = window.localStorage.getItem("u2g-elderly-records");
      const records = savedRecords ? JSON.parse(savedRecords) : elderlyRows;
      return records.map((record) => record.status === "已暂停" ? { ...record, status: "服务中" } : record);
    } catch {
      return elderlyRows;
    }
  });
  const [projects, setProjects] = useState(() => {
    try {
      const savedProjects = window.localStorage.getItem("u2g-projects");
      if (!savedProjects) return initialProjects;
      return JSON.parse(savedProjects).map((project) => {
        const { weatherLocation: _removedWeatherLocation, ...savedProject } = project;
        return {
          country: "新加坡", city: "新加坡", district: project.community || "", address: "",
          timezone: "Asia/Singapore (UTC+8)",
          ...initialProjects.find((item) => item.id === project.id), ...savedProject,
        };
      });
    } catch {
      return initialProjects;
    }
  });
  const [tabletDevices, setTabletDevices] = useState(() => {
    try {
      const savedDevices = window.localStorage.getItem("u2g-tablet-devices");
      if (!savedDevices) return initialTabletDevices;
      return JSON.parse(savedDevices).map((device) => {
        const preset = initialTabletDevices.find((item) => item.id === device.id);
        return {
          currentVersion: preset?.currentVersion || "v2.6.0",
          versionStatus: preset?.versionStatus || "已最新",
          sn: preset?.sn || device.sn || "SN 待补充",
          ...device,
        };
      });
    } catch {
      return initialTabletDevices;
    }
  });
  const [activationRecords, setActivationRecords] = useState(() => {
    try {
      const savedRecords = window.localStorage.getItem("u2g-tablet-activations-v11");
      return savedRecords ? JSON.parse(savedRecords) : initialActivationRecords;
    } catch {
      return initialActivationRecords;
    }
  });
  const [familyInvitations, setFamilyInvitations] = useState(initialFamilyInvitations);
  const [familyRelations, setFamilyRelations] = useState(initialFamilyRelations);
  const [reminderRecords, setReminderRecords] = useState(() => {
    try {
      const savedReminders = window.localStorage.getItem("u2g-reminders-v12-final");
      return savedReminders ? JSON.parse(savedReminders) : initialReminders;
    } catch {
      return initialReminders;
    }
  });
  const reminderDeleteAttempts = useRef(new Set());
  const [emergencyHelpEvents, setEmergencyHelpEvents] = useState(() => {
    try {
      const savedEvents = window.localStorage.getItem("u2g-emergency-help-events-v1");
      return savedEvents ? JSON.parse(savedEvents) : initialEmergencyHelpEvents;
    } catch {
      return initialEmergencyHelpEvents;
    }
  });
  const [recommendationStrategies, setRecommendationStrategies] = useState(() => {
    try {
      const savedStrategies = window.localStorage.getItem("u2g-recommendation-strategies");
      if (!savedStrategies) return initialRecommendationStrategies;
      return JSON.parse(savedStrategies).map((item) => {
        if (item.resourceId && item.pool !== "entertainment") return item;
        const preset = initialRecommendationStrategies.find((strategy) => strategy.id === item.id);
        return preset ? { ...item, pool: preset.pool, resourceType: preset.resourceType, resourceId: preset.resourceId, resourceName: preset.resourceName, title: preset.title } : null;
      }).filter(Boolean);
    } catch {
      return initialRecommendationStrategies;
    }
  });
  const [recommendationPolicy, setRecommendationPolicy] = useState(() => {
    try {
      const savedPolicy = window.localStorage.getItem("u2g-recommendation-policy");
      if (!savedPolicy) return initialRecommendationPolicy;
      const parsedPolicy = JSON.parse(savedPolicy);
      return {
        ...initialRecommendationPolicy,
        ...parsedPolicy,
        wellnessStart: parsedPolicy.wellnessStart || parsedPolicy.morningStart || initialRecommendationPolicy.wellnessStart,
        wellnessEnd: parsedPolicy.wellnessEnd || parsedPolicy.morningEnd || initialRecommendationPolicy.wellnessEnd,
      };
    } catch {
      return initialRecommendationPolicy;
    }
  });
  const [safetyNews, setSafetyNews] = useState(() => {
    try {
      const savedNews = window.localStorage.getItem("u2g-safety-news");
      if (!savedNews) return initialSafetyNews;
      return JSON.parse(savedNews).map((item) => {
        const { source: _removedSource, summary: previousSummary, contact: _removedContact, ...news } = item;
        return { ...news, description: item.description ?? previousSummary ?? "" };
      });
    } catch {
      return initialSafetyNews;
    }
  });
  const [serviceBookings, setServiceBookings] = useState(() => {
    try {
      const savedBookings = window.localStorage.getItem("u2g-service-bookings");
      return savedBookings ? JSON.parse(savedBookings) : initialServiceBookings;
    } catch {
      return initialServiceBookings;
    }
  });
  const [serviceCatalog, setServiceCatalog] = useState(() => {
    try {
      const savedServices = window.localStorage.getItem("u2g-service-catalog");
      return savedServices ? JSON.parse(savedServices) : initialServiceCatalog;
    } catch {
      return initialServiceCatalog;
    }
  });
  const [communityActivities, setCommunityActivities] = useState(() => {
    try {
      const savedActivities = window.localStorage.getItem("u2g-community-activities");
      return savedActivities ? JSON.parse(savedActivities) : initialCommunityActivities;
    } catch {
      return initialCommunityActivities;
    }
  });
  const [albumCategories, setAlbumCategories] = useState(() => {
    try {
      const savedCategories = window.localStorage.getItem("u2g-album-categories-v12");
      return savedCategories ? JSON.parse(savedCategories) : initialAlbumCategories;
    } catch {
      return initialAlbumCategories;
    }
  });
  const [familyAlbumBatches] = useState(() => {
    try {
      const savedBatches = window.localStorage.getItem("u2g-family-album-batches-v12");
      return savedBatches ? JSON.parse(savedBatches) : initialFamilyAlbumBatches;
    } catch {
      return initialFamilyAlbumBatches;
    }
  });
  const [sensorDevices, setSensorDevices] = useState(() => {
    try {
      const savedDevices = window.localStorage.getItem("u2g-sensor-devices");
      return savedDevices ? JSON.parse(savedDevices) : initialSensorDevices;
    } catch {
      return initialSensorDevices;
    }
  });
  const [inactivityRules, setInactivityRules] = useState(() => {
    try {
      const savedRules = window.localStorage.getItem("u2g-inactivity-rules");
      return savedRules ? { ...initialInactivityRules, ...JSON.parse(savedRules) } : initialInactivityRules;
    } catch {
      return initialInactivityRules;
    }
  });
  const [globalInactivityRule, setGlobalInactivityRule] = useState(() => {
    try {
      const savedRule = window.localStorage.getItem("u2g-global-inactivity-rule");
      return savedRule ? { ...initialGlobalInactivityRule, ...JSON.parse(savedRule) } : initialGlobalInactivityRule;
    } catch {
      return initialGlobalInactivityRule;
    }
  });
  const [weatherLocations, setWeatherLocations] = useState(() => {
    try {
      const savedLocations = window.localStorage.getItem("u2g-weather-locations-v11");
      return savedLocations ? JSON.parse(savedLocations) : initialWeatherLocations;
    } catch {
      return initialWeatherLocations;
    }
  });
  const [weatherQueries] = useState(initialWeatherQueries);
  const [weatherAudits, setWeatherAudits] = useState(() => {
    try {
      const savedAudits = window.localStorage.getItem("u2g-weather-location-audits-v11");
      return savedAudits ? JSON.parse(savedAudits) : initialWeatherLocationAudits;
    } catch {
      return initialWeatherLocationAudits;
    }
  });
  const [careScripts, setCareScripts] = useState(() => {
    try {
      const savedScripts = window.localStorage.getItem("u2g-care-scripts-v1");
      return savedScripts ? JSON.parse(savedScripts) : initialCareScripts;
    } catch {
      return initialCareScripts;
    }
  });
  const [drawer, setDrawer] = useState(null);
  const [deviceDrawer, setDeviceDrawer] = useState(null);
  const [tabletTarget, setTabletTarget] = useState(null);
  const [elderlyDetailId, setElderlyDetailId] = useState(null);
  const [relativeDetailId, setRelativeDetailId] = useState(null);
  const [spaceTarget, setSpaceTarget] = useState(null);
  const [globalRuleOpen, setGlobalRuleOpen] = useState(false);
  const [deviceMenuOpen, setDeviceMenuOpen] = useState(true);
  const activeLabel = useMemo(() => menuGroups.flatMap((group) => group.items.flatMap((item) => [item, ...(item.children || [])])).find((item) => item.key === active)?.label, [active]);
  const elderlyDetailRecord = elderlyRecords.find((record) => record.id === elderlyDetailId);
  const relativeDetailRecord = relativeAccounts.find((account) => account.id === relativeDetailId);
  const communityActivityRecords = useMemo(() => communityActivities.map((activity) => ({ ...activity, interestCount: initialActivityRegistrations.filter((registration) => registration.activityId === activity.id && registration.status !== "已取消").length })), [communityActivities]);

  useEffect(() => {
    window.localStorage.setItem("u2g-elderly-records", JSON.stringify(elderlyRecords));
  }, [elderlyRecords]);

  useEffect(() => {
    window.localStorage.setItem("u2g-projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    window.localStorage.setItem("u2g-tablet-devices", JSON.stringify(tabletDevices));
  }, [tabletDevices]);

  useEffect(() => {
    window.localStorage.setItem("u2g-tablet-activations-v11", JSON.stringify(activationRecords));
  }, [activationRecords]);

  useEffect(() => {
    window.localStorage.setItem("u2g-reminders-v12-final", JSON.stringify(reminderRecords));
  }, [reminderRecords]);

  useEffect(() => {
    window.localStorage.setItem("u2g-emergency-help-events-v1", JSON.stringify(emergencyHelpEvents));
  }, [emergencyHelpEvents]);

  useEffect(() => {
    window.localStorage.setItem("u2g-recommendation-strategies", JSON.stringify(recommendationStrategies));
  }, [recommendationStrategies]);

  useEffect(() => {
    window.localStorage.setItem("u2g-recommendation-policy", JSON.stringify(recommendationPolicy));
  }, [recommendationPolicy]);

  useEffect(() => {
    window.localStorage.setItem("u2g-safety-news", JSON.stringify(safetyNews));
  }, [safetyNews]);

  useEffect(() => {
    window.localStorage.setItem("u2g-service-bookings", JSON.stringify(serviceBookings));
  }, [serviceBookings]);

  useEffect(() => {
    window.localStorage.setItem("u2g-service-catalog", JSON.stringify(serviceCatalog));
  }, [serviceCatalog]);

  useEffect(() => {
    window.localStorage.setItem("u2g-community-activities", JSON.stringify(communityActivities));
  }, [communityActivities]);

  useEffect(() => {
    window.localStorage.setItem("u2g-album-categories-v12", JSON.stringify(albumCategories));
  }, [albumCategories]);

  useEffect(() => {
    window.localStorage.setItem("u2g-family-album-batches-v12", JSON.stringify(familyAlbumBatches));
  }, [familyAlbumBatches]);

  useEffect(() => {
    window.localStorage.setItem("u2g-sensor-devices", JSON.stringify(sensorDevices));
  }, [sensorDevices]);

  useEffect(() => {
    window.localStorage.setItem("u2g-inactivity-rules", JSON.stringify(inactivityRules));
  }, [inactivityRules]);

  useEffect(() => {
    window.localStorage.setItem("u2g-global-inactivity-rule", JSON.stringify(globalInactivityRule));
  }, [globalInactivityRule]);

  useEffect(() => {
    window.localStorage.setItem("u2g-weather-locations-v11", JSON.stringify(weatherLocations));
  }, [weatherLocations]);

  useEffect(() => {
    window.localStorage.setItem("u2g-weather-location-audits-v11", JSON.stringify(weatherAudits));
  }, [weatherAudits]);

  useEffect(() => {
    window.localStorage.setItem("u2g-care-scripts-v1", JSON.stringify(careScripts));
  }, [careScripts]);

  const saveElderlyRecord = (nextRecord) => {
    if (nextRecord.id) {
      const previousRecord = elderlyRecords.find((record) => record.id === nextRecord.id);
      if (previousRecord && previousRecord.address !== nextRecord.address) {
        const now = "2026-07-27 10:30";
        const currentLocation = weatherMockApi.getLocation(weatherLocations, "老人", nextRecord.id);
        const pendingLocation = {
          ...(currentLocation || {}),
          id: currentLocation?.id || `LOC-E-${nextRecord.id.split("-").pop()}`,
          ownerType: "老人",
          ownerId: nextRecord.id,
          status: "待完善",
          countryCode: "",
          countryName: "",
          regionCode: "",
          regionName: "",
          cityCode: "",
          cityName: "",
          latitude: null,
          longitude: null,
          timezone: "",
          source: "老人档案地址解析",
          sourceDetail: nextRecord.address || "待补充",
          updatedAt: now,
          syncStatus: "待同步",
          syncedAt: "",
          invalidReason: nextRecord.address && nextRecord.address !== "待补充" ? "居住地址已变更，等待地址解析并确认唯一城市" : "居住地址缺失，无法解析天气位置",
        };
        setWeatherLocations((records) => currentLocation ? records.map((item) => item.id === currentLocation.id ? pendingLocation : item) : [pendingLocation, ...records]);
        setWeatherAudits((items) => [{ id: `WA-${String(items.length + 1).padStart(3, "0")}`, ownerType: "老人", ownerId: nextRecord.id, action: "居住地址变更", before: previousRecord.address, after: nextRecord.address || "待补充", source: "老人档案", operator: "赵亚男", operatedAt: now, result: "等待重新解析" }, ...items]);
      }
      setElderlyRecords((records) => records.map((record) => record.id === nextRecord.id ? { ...nextRecord, updatedAt: "2026-07-16 17:20" } : record));
    } else {
      const nextNumber = Math.max(...elderlyRecords.map((record) => Number(record.id.split("-").pop()))) + 1;
      setElderlyRecords((records) => [{
        ...nextRecord,
        id: `SG-E-${String(nextNumber).padStart(6, "0")}`,
        family: 0,
        device: "待安装",
        status: "待开通",
        attention: "正常",
        updatedAt: "2026-07-16 17:20",
      }, ...records]);
    }
    setDrawer(null);
  };

  const saveRelativeWeatherLocation = (account, selection) => {
    const result = weatherMockApi.saveRelativeLocation(weatherLocations, weatherAudits, account.id, selection);
    setWeatherLocations(result.records);
    setWeatherAudits(result.audits);
    setDrawer(null);
  };

  const saveCareScript = (condition, input) => {
    setCareScripts((records) => careScriptMockApi.save(records, condition, input));
    setDrawer(null);
  };

  const toggleCareScript = (weatherCode) => {
    setCareScripts((records) => records.map((item) => item.weatherCode === weatherCode
      ? { ...item, status: item.status === "启用" ? "停用" : "启用", updatedAt: "2026-07-27 11:20", operator: "赵亚男" }
      : item));
  };

  const saveAlbumCategory = (category) => {
    if (category.id) {
      setAlbumCategories((records) => records.map((item) => item.id === category.id
        ? { ...item, ...category, updatedAt: "2026-07-27 11:40" }
        : item));
    } else {
      const nextNumber = Math.max(0, ...albumCategories.map((item) => Number(item.id.split("-").pop()))) + 1;
      setAlbumCategories((records) => [...records, {
        ...category,
        id: `ALB-CAT-${String(nextNumber).padStart(3, "0")}`,
        updatedAt: "2026-07-27 11:40",
      }]);
    }
    setDrawer(null);
  };

  const toggleAlbumCategory = (categoryId) => {
    setAlbumCategories((records) => records.map((item) => item.id === categoryId
      ? { ...item, status: item.status === "启用" ? "停用" : "启用", updatedAt: "2026-07-27 11:40" }
      : item));
  };

  const deleteAlbumCategory = (categoryId) => {
    if (familyAlbumBatches.some((batch) => batch.categoryId === categoryId)) return;
    setAlbumCategories((records) => records.filter((item) => item.id !== categoryId));
  };

  const saveReminder = (reminder) => {
    const operatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    if (reminder.id) {
      setReminderRecords((records) => records.map((item) => item.id === reminder.id ? {
        ...item,
        ...reminder,
        occurrences: item.occurrences || [],
        updatedBy: "赵亚男",
        updatedAt: operatedAt,
      } : item));
      setDrawer(null);
      return;
    }
    const nextNumber = Math.max(0, ...reminderRecords.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
    setReminderRecords((records) => [{
      ...reminder,
      id: `REM-${String(nextNumber).padStart(6, "0")}`,
      createdBy: "赵亚男",
      createdAt: operatedAt,
      updatedBy: "赵亚男",
      updatedAt: operatedAt,
      occurrences: [{ id: `OCC-${String(nextNumber).padStart(6, "0")}-01`, date: reminder.date, time: reminder.time, status: "未到时间", resultAt: "—" }],
    }, ...records]);
    setDrawer(null);
  };

  const deleteReminder = (id) => {
    const target = reminderRecords.find((reminder) => reminder.id === id);
    if (target?.deleteFailureOnce && !reminderDeleteAttempts.current.has(id)) {
      reminderDeleteAttempts.current.add(id);
      return { ok: false };
    }
    setReminderRecords((records) => records.filter((reminder) => reminder.id !== id));
    return { ok: true };
  };

  const retryEmergencyNotification = (eventId, notificationId) => {
    const retriedAt = "2026-07-28 10:18:30";
    setEmergencyHelpEvents((events) => events.map((event) => {
      if (event.id !== eventId) return event;
      const target = event.notifications.find((item) => item.id === notificationId);
      const notifications = event.notifications.map((item) => item.id === notificationId ? { ...item, deliveryStatus: "已送达", retryCount: item.retryCount + 1, failureReason: "", lastAttemptAt: retriedAt } : item);
      const stillFailed = notifications.some((item) => item.deliveryStatus === "发送失败");
      return {
        ...event,
        notifications,
        result: stillFailed ? "部分通知失败" : "通知已全部送达",
        timeline: [...event.timeline, { time: "10:18:30", title: "失败联系人已重新通知", detail: `${target?.name || "联系人"}已补发成功，本次为第 ${(target?.retryCount || 0) + 1} 次重试` }],
      };
    }));
  };

  const endEmergencyEvent = (eventId, input) => {
    const endedAt = "2026-07-28 10:20:16";
    setEmergencyHelpEvents((events) => events.map((event) => event.id === eventId ? {
      ...event,
      status: "已结束",
      result: input.reason === "老人误触" ? "误触已结束" : "已结束",
      endReason: input.reason,
      endNote: input.note,
      endedAt,
      endedBy: "赵亚男",
      timeline: [...event.timeline, { time: "10:20:16", title: "事件已结束", detail: `赵亚男确认结束原因：${input.reason}` }],
    } : event));
  };

  const saveRecommendationStrategy = (strategy) => {
    if (strategy.id) {
      setRecommendationStrategies((items) => items.map((item) => item.id === strategy.id ? { ...item, ...strategy } : item));
    } else {
      const nextNumber = Math.max(0, ...recommendationStrategies.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
      setRecommendationStrategies((items) => [{ ...strategy, id: `STR-${String(nextNumber).padStart(3, "0")}`, pushCount: 0, lastPush: "" }, ...items]);
    }
    setDrawer(null);
  };

  const toggleRecommendationStrategy = (id) => {
    setRecommendationStrategies((items) => items.map((item) => item.id === id ? { ...item, status: item.status === "启用" ? "停用" : "启用" } : item));
  };

  const saveSafetyNews = (record) => {
    const updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    if (record.id) {
      setSafetyNews((items) => items.map((item) => item.id === record.id ? { ...item, ...record, updatedAt } : item));
    } else {
      const nextNumber = Math.max(0, ...safetyNews.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
      setSafetyNews((items) => [{ ...record, id: `SAF-${String(nextNumber).padStart(3, "0")}`, status: "已发布", updatedAt }, ...items]);
    }
    setDrawer(null);
  };

  const deleteSafetyNews = (id) => {
    setSafetyNews((items) => items.filter((item) => item.id !== id));
  };

  const updateServiceBookingStatus = (id, status) => {
    const updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    setServiceBookings((items) => items.map((item) => item.id === id ? { ...item, status, operator: "赵亚男", updatedAt } : item));
    setDrawer((current) => current?.kind === "serviceBooking" && current.record?.id === id
      ? { ...current, record: { ...current.record, status, operator: "赵亚男", updatedAt } }
      : current);
  };

  const saveServiceCatalogItem = (service) => {
    const updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    if (service.id) {
      setServiceCatalog((items) => items.map((item) => item.id === service.id ? { ...item, ...service, updatedAt } : item));
    } else {
      const nextNumber = Math.max(0, ...serviceCatalog.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
      setServiceCatalog((items) => [{ ...service, id: `SRV-${String(nextNumber).padStart(3, "0")}`, updatedAt }, ...items]);
    }
    setDrawer(null);
  };

  const toggleServiceCatalogItem = (id) => {
    const updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    setServiceCatalog((items) => items.map((item) => item.id === id ? { ...item, status: item.status === "启用" ? "停用" : "启用", updatedAt } : item));
  };

  const saveCommunityActivity = (activity) => {
    const publishedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    if (activity.id) {
      setCommunityActivities((items) => items.map((item) => item.id === activity.id ? { ...item, ...activity, publishedAt } : item));
    } else {
      const nextNumber = Math.max(0, ...communityActivities.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
      setCommunityActivities((items) => [{ ...activity, id: `ACT-${String(nextNumber).padStart(3, "0")}`, publishedAt }, ...items]);
    }
    setDrawer(null);
  };

  const deleteCommunityActivity = (id) => {
    setCommunityActivities((items) => items.filter((item) => item.id !== id));
    setRecommendationStrategies((items) => items.filter((item) => !(item.resourceType === "activity" && item.resourceId === id)));
  };

  const saveProject = (nextProject) => {
    if (nextProject.id) {
      setProjects((items) => items.map((project) => project.id === nextProject.id ? nextProject : project));
      setElderlyRecords((records) => records.map((record) => {
        const previousProject = projects.find((project) => project.id === nextProject.id);
        return previousProject && record.project === previousProject.name ? { ...record, project: nextProject.name, community: nextProject.community } : record;
      }));
    } else {
      const nextNumber = Math.max(...projects.map((project) => Number(project.id.split("-").pop()))) + 1;
      setProjects((items) => [...items, { ...nextProject, id: `PRJ-${String(nextNumber).padStart(3, "0")}`, status: "启用" }]);
    }
  };

  const toggleProject = (id) => {
    setProjects((items) => items.map((project) => project.id === id ? { ...project, status: project.status === "启用" ? "停用" : "启用" } : project));
  };

  const generateTabletActivation = (activation) => {
    setActivationRecords((records) => [activation, ...records.map((item) => (item.elderlyId === activation.elderlyId || item.deviceId === activation.deviceId) && item.status === "待使用" ? { ...item, status: "已作废" } : item)]);
  };

  const failTabletActivation = (activationId) => {
    setActivationRecords((records) => records.map((item) => item.id === activationId ? { ...item, status: "激活失败" } : item));
  };

  const activateTablet = (elderlyId, tabletId, activationId) => {
    const activation = activationRecords.find((item) => item.id === activationId);
    const boundAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    setTabletDevices((devices) => devices.map((device) => {
      if (device.boundElderlyId === elderlyId) return { ...device, boundElderlyId: null, boundAt: "", status: "待激活", lastOnline: "尚未激活" };
      if (device.id === tabletId) return { ...device, boundElderlyId: elderlyId, boundAt, status: "在线", lastOnline: "刚刚", activationCode: activation?.code || "", activationMethod: "激活码", operator: "赵亚男" };
      return device;
    }));
    setActivationRecords((records) => records.map((item) => item.id === activationId ? { ...item, status: "已使用", usedAt: boundAt, deviceId: tabletId } : item));
  };

  const unbindTablet = (tabletId) => {
    setTabletDevices((devices) => devices.map((device) => device.id === tabletId ? { ...device, boundElderlyId: null, boundAt: "", status: "待激活", lastOnline: "尚未激活" } : device));
    setTabletTarget(null);
  };

  const invalidateFamilyInvitation = (invitationId) => {
    setFamilyInvitations((items) => items.map((item) => item.id === invitationId && item.status === "有效" ? { ...item, status: "后台已作废" } : item));
  };

  const unlinkFamilyRelation = (relationId) => {
    setFamilyRelations((items) => items.map((item) => item.id === relationId && item.status === "正常" ? { ...item, status: "已解除" } : item));
  };

  const saveTabletDevice = (device) => {
    setTabletDevices((devices) => [...devices, device]);
    setDeviceDrawer(null);
  };

  const saveSensorDevice = (device) => {
    const nextNumber = Math.max(0, ...sensorDevices.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
    setSensorDevices((devices) => [...devices, { ...device, id: `SEN-SG-${String(nextNumber).padStart(6, "0")}` }]);
    setElderlyRecords((records) => records.map((record) => {
      if (record.id !== device.elderlyId) return record;
      const match = String(record.device).match(/(\d+)\s*\/\s*(\d+)/);
      const online = match ? Number(match[1]) + 1 : 1;
      const total = match ? Number(match[2]) + 1 : 1;
      return { ...record, rooms: [...new Set([...(record.rooms || []), device.room])], device: `${online} / ${total} 在线`, updatedAt: "2026-07-17 11:20" };
    }));
    setDeviceDrawer(null);
  };

  const moveSensorRoom = (sensorId, room) => {
    const sensor = sensorDevices.find((item) => item.id === sensorId);
    setSensorDevices((devices) => devices.map((item) => item.id === sensorId ? { ...item, room, lastReport: "刚刚" } : item));
    if (sensor?.elderlyId) setElderlyRecords((records) => records.map((record) => record.id === sensor.elderlyId ? { ...record, rooms: [...new Set([...(record.rooms || []), room])], updatedAt: "2026-07-17 11:20" } : record));
    setDeviceDrawer(null);
  };

  const unbindSensor = (sensorId) => {
    const sensor = sensorDevices.find((item) => item.id === sensorId);
    setSensorDevices((devices) => devices.map((item) => item.id === sensorId ? { ...item, elderlyId: null, room: "", installStatus: "已解绑", onlineStatus: "停用", lastActivity: "—" } : item));
    if (sensor?.elderlyId) setElderlyRecords((records) => records.map((record) => {
      if (record.id !== sensor.elderlyId) return record;
      const match = String(record.device).match(/(\d+)\s*\/\s*(\d+)/);
      if (!match) return record;
      const online = Math.max(0, Number(match[1]) - (sensor.onlineStatus === "在线" ? 1 : 0));
      const total = Math.max(0, Number(match[2]) - 1);
      return { ...record, device: total ? `${online} / ${total} 在线` : "待安装", updatedAt: "2026-07-17 11:20" };
    }));
    setDeviceDrawer(null);
  };

  const saveElderlySpaces = (rooms) => {
    setElderlyRecords((records) => records.map((record) => record.id === spaceTarget.id ? { ...record, rooms, updatedAt: "2026-07-17 14:20" } : record));
    setSpaceTarget(null);
  };

  return (
    <div className={`app-shell admin-style-theme ${collapsed ? "collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><HeartHandshake size={21}/></div><div className="brand-copy"><strong>U2G 乐龄服务平台</strong><span>运营管理后台</span></div></div>
        <nav>{menuGroups.map((group) => <div className="menu-group" key={group.label}><div className="menu-label">{group.label}</div>{group.items.map((item) => { const Icon = item.icon; const childActive = item.children?.some((child) => child.key === active); return item.children ? <div className={`submenu-group ${childActive ? "has-active" : ""}`} key={item.key}><button title={item.label} className="submenu-parent" onClick={() => setDeviceMenuOpen((open) => !open)}><Icon size={18}/><span>{item.label}</span><ChevronDown className={`submenu-chevron ${deviceMenuOpen ? "open" : ""}`} size={14}/></button>{deviceMenuOpen && <div className="submenu">{item.children.map((child) => <button title={child.label} className={`submenu-button ${active === child.key ? "active" : ""}`} key={child.key} onClick={() => setActive(child.key)}><span>{child.label}</span>{active === child.key && <i/>}</button>)}</div>}</div> : <button title={item.label} className={active === item.key ? "active" : ""} key={item.key} onClick={() => { setActive(item.key); if (item.key === "elderly") setElderlyDetailId(null); if (item.key === "relations") setRelativeDetailId(null); }}><Icon size={18}/><span>{item.label}</span>{active === item.key && <i/>}</button>; })}</div>)}</nav>
        <div className="sidebar-footer"><button onClick={() => setCollapsed(!collapsed)}><Menu size={18}/><span>收起菜单</span></button></div>
      </aside>
      <div className="main-shell">
        <header className="topbar"><div className="breadcrumb"><Home size={15}/><span>首页</span><ChevronRight size={14}/><b>{activeLabel}</b></div><div className="top-actions"><button className="top-icon"><Bell size={18}/><i/></button><span className="divider"/><button className="profile"><span className="avatar">赵</span><span><b>赵亚男</b><small>超级管理员</small></span><ChevronDown size={14}/></button></div></header>
        <main className="content">
          {active === "overview"
            ? <><div className="page-heading overview-heading"><div><h1>运营概览</h1><p>下午好，以下是 U2G 乐龄服务平台今日运营情况</p></div><span className="today">2026年7月17日 · 星期五</span></div><Overview onNavigate={setActive} inactivityRule={globalInactivityRule} inactivityStates={inactivityRules} onEditInactivityRule={() => setGlobalRuleOpen(true)}/></>
            : active === "elderly"
              ? elderlyDetailRecord
                ? <ElderlyDetailPage record={elderlyDetailRecord} project={projects.find((project) => project.name === elderlyDetailRecord.project)} tablet={tabletDevices.find((device) => device.boundElderlyId === elderlyDetailRecord.id)} activation={activationRecords.find((item) => item.elderlyId === elderlyDetailRecord.id && ["待使用", "激活失败"].includes(item.status))} sensors={sensorDevices} reminders={reminderRecords.filter((reminder) => reminder.elderlyId === elderlyDetailRecord.id)} familyInvitations={familyInvitations.filter((item) => item.elderlyId === elderlyDetailRecord.id)} familyRelations={familyRelations.filter((item) => item.elderlyId === elderlyDetailRecord.id)} onInvalidateInvite={invalidateFamilyInvitation} onUnlinkRelation={unlinkFamilyRelation} inactivityRule={{ ...globalInactivityRule, ...(inactivityRules[elderlyDetailRecord.id] || defaultInactivityState), enabled: globalInactivityRule.enabled, thresholdHours: globalInactivityRule.thresholdHours, startTime: globalInactivityRule.startTime, endTime: globalInactivityRule.endTime }} weatherLocation={weatherMockApi.getLocation(weatherLocations, "老人", elderlyDetailRecord.id)} weatherQuery={weatherMockApi.getWeatherQuery(weatherQueries, weatherMockApi.getLocation(weatherLocations, "老人", elderlyDetailRecord.id)?.id)} weatherAudits={weatherMockApi.getAudits(weatherAudits, "老人", elderlyDetailRecord.id)} onBack={() => setElderlyDetailId(null)} onEdit={() => setDrawer({ kind: "elderly", mode: "edit", record: elderlyDetailRecord })} onManageSpaces={() => setSpaceTarget(elderlyDetailRecord)} onAddSensor={() => setDeviceDrawer({ kind: "sensorCreate", elderlyId: elderlyDetailRecord.id })} onViewSensor={(sensor) => setDeviceDrawer({ kind: "sensorView", sensor })} onManageTablet={() => setTabletTarget(elderlyDetailRecord)}/>
                : <ElderlyPage records={elderlyRecords} projects={projects} tabletDevices={tabletDevices} activationRecords={activationRecords} onOpen={(mode, record) => mode === "view" ? setElderlyDetailId(record.id) : setDrawer({ kind: "elderly", mode, record })}/>
              : active === "relations"
                ? relativeDetailRecord
                  ? <RelativeDetailPage account={relativeDetailRecord} elderlyRecords={elderlyRecords} weatherLocation={weatherMockApi.getLocation(weatherLocations, "亲属", relativeDetailRecord.id)} weatherQuery={weatherMockApi.getWeatherQuery(weatherQueries, weatherMockApi.getLocation(weatherLocations, "亲属", relativeDetailRecord.id)?.id)} weatherAudits={weatherMockApi.getAudits(weatherAudits, "亲属", relativeDetailRecord.id)} onBack={() => setRelativeDetailId(null)} onEditWeather={() => setDrawer({ kind: "relativeWeather", account: relativeDetailRecord })}/>
                  : <RelativeArchivePage accounts={relativeAccounts} elderlyRecords={elderlyRecords} weatherLocations={weatherLocations} onOpen={(account) => setRelativeDetailId(account.id)}/>
              : active === "reminders"
                ? <ReminderManagementPage reminders={reminderRecords} elderlyRecords={elderlyRecords} onCreate={() => setDrawer({ kind: "reminder" })} onEdit={(record) => setDrawer({ kind: "reminder", record })} onDelete={deleteReminder} onViewPlan={(record) => setDrawer({ kind: "reminderPlan", record })}/>
              : active === "emergencyHelp"
                ? <EmergencyHelpPage events={emergencyHelpEvents} elderlyRecords={elderlyRecords} onOpen={(event) => setDrawer({ kind: "emergencyHelp", eventId: event.id })}/>
              : active === "familyAlbums"
                ? <FamilyAlbumBatchManagementPage categories={albumCategories} batches={familyAlbumBatches} elderlyRecords={elderlyRecords} relatives={relativeAccounts} onAddCategory={() => setDrawer({ kind: "albumCategory" })} onEditCategory={(record) => setDrawer({ kind: "albumCategory", record })} onToggleCategory={toggleAlbumCategory} onDeleteCategory={deleteAlbumCategory} onViewBatch={(batch) => setDrawer({ kind: "familyAlbumBatch", batchId: batch.id })}/>
              : active === "recommendations"
                ? <RecommendationStrategyPage strategies={recommendationStrategies} policy={recommendationPolicy} onSavePolicy={setRecommendationPolicy} onCreate={() => setDrawer({ kind: "recommendation" })} onEdit={(record) => setDrawer({ kind: "recommendation", record })} onToggle={toggleRecommendationStrategy}/>
              : active === "activities"
                ? <CommunityActivityPage records={communityActivityRecords} registrations={initialActivityRegistrations} onCreate={() => setDrawer({ kind: "activity" })} onEdit={(record) => setDrawer({ kind: "activity", record })} onDelete={deleteCommunityActivity} onViewRegistrations={(record) => setDrawer({ kind: "activityRegistrations", record })}/>
              : active === "safety"
                ? <SafetyNewsPage records={safetyNews} projects={projects} onCreate={() => setDrawer({ kind: "safety" })} onEdit={(record) => setDrawer({ kind: "safety", record })} onDelete={deleteSafetyNews}/>
              : active === "services"
                ? <ServiceBookingPage bookings={serviceBookings} services={serviceCatalog} elderlyRecords={elderlyRecords} projects={projects} onOpen={(record) => setDrawer({ kind: "serviceBooking", record })} onCreateService={() => setDrawer({ kind: "serviceCatalog" })} onEditService={(record) => setDrawer({ kind: "serviceCatalog", record })} onToggleService={toggleServiceCatalogItem}/>
              : active === "projects"
                ? <ProjectPage projects={projects} elderlyRecords={elderlyRecords} onSave={saveProject} onToggle={toggleProject}/>
                : active === "tabletDevices" || active === "sensorDevices"
                  ? <DeviceManagementPage key={active} deviceType={active === "tabletDevices" ? "tablet" : "sensor"} tablets={tabletDevices} sensors={sensorDevices} elderlyRecords={elderlyRecords} onAddTablet={() => setDeviceDrawer({ kind: "tabletCreate" })} onViewTablet={(device) => setDeviceDrawer({ kind: "tabletView", device })} onManageTablet={setTabletTarget} onAddSensor={() => setDeviceDrawer({ kind: "sensorCreate" })} onViewSensor={(sensor) => setDeviceDrawer({ kind: "sensorView", sensor })}/>
                  : active === "activity"
                    ? <RoomActivityPage sensors={sensorDevices} elderlyRecords={elderlyRecords}/>
                    : active === "weatherLocations"
                      ? <WeatherLocationManagementPage integrations={initialWeatherRegionIntegrations} onView={(integration) => setDrawer({ kind: "weatherRegion", integration })}/>
                    : active === "careScripts"
                      ? <CareScriptManagementPage scripts={careScripts} onEdit={(condition, record) => setDrawer({ kind: "careScript", condition, record })} onToggle={toggleCareScript}/>
                    : <ManagementPage page={active} onCreate={() => setDrawer({ kind: "generic" })}/>} 
        </main>
      </div>
      {drawer?.kind === "elderly" && <ElderlyDrawer key={`${drawer.mode}-${drawer.record?.id || "new"}`} mode={drawer.mode} record={drawer.record} projects={projects} tablet={tabletDevices.find((device) => device.boundElderlyId === drawer.record?.id)} activation={activationRecords.find((item) => item.elderlyId === drawer.record?.id && item.status === "待使用")} onManageTablet={() => setTabletTarget(drawer.record)} onClose={() => setDrawer(null)} onSave={saveElderlyRecord}/>} 
      {drawer?.kind === "reminder" && <ReminderDrawer key={drawer.record?.id || "new-reminder"} record={drawer.record} elderlyRecords={elderlyRecords} onClose={() => setDrawer(null)} onSave={saveReminder}/>} 
      {drawer?.kind === "reminderPlan" && <ReminderPlanDrawer reminder={drawer.record} elderly={elderlyRecords.find((record) => record.id === drawer.record.elderlyId)} onClose={() => setDrawer(null)}/>} 
      {drawer?.kind === "emergencyHelp" && (() => {
        const event = emergencyHelpEvents.find((item) => item.id === drawer.eventId);
        if (!event) return null;
        return <EmergencyHelpDrawer event={event} elderly={elderlyRecords.find((item) => item.id === event.elderlyId)} onClose={() => setDrawer(null)} onRetry={retryEmergencyNotification} onEnd={endEmergencyEvent}/>;
      })()}
      {drawer?.kind === "albumCategory" && <AlbumCategoryDrawer key={drawer.record?.id || "new-album-category"} record={drawer.record} categories={albumCategories} onClose={() => setDrawer(null)} onSave={saveAlbumCategory}/>} 
      {drawer?.kind === "familyAlbumBatch" && (() => {
        const batch = familyAlbumBatches.find((item) => item.id === drawer.batchId);
        if (!batch) return null;
        return <FamilyAlbumBatchDetailDrawer batch={batch} elderly={elderlyRecords.find((item) => item.id === batch.elderlyId)} uploader={relativeAccounts.find((item) => item.id === batch.uploaderId)} category={albumCategories.find((item) => item.id === batch.categoryId)} onClose={() => setDrawer(null)}/>;
      })()}
      {drawer?.kind === "recommendation" && <RecommendationStrategyDrawer key={drawer.record?.id || "new-recommendation"} record={drawer.record} safetyNews={safetyNews} activities={communityActivityRecords} services={serviceCatalog} onClose={() => setDrawer(null)} onSave={saveRecommendationStrategy}/>} 
      {drawer?.kind === "activity" && <CommunityActivityDrawer key={drawer.record?.id || "new-activity"} record={drawer.record} onClose={() => setDrawer(null)} onSave={saveCommunityActivity}/>} 
      {drawer?.kind === "activityRegistrations" && <ActivityRegistrationsModal activity={drawer.record} registrations={initialActivityRegistrations} elderlyRecords={elderlyRecords} onClose={() => setDrawer(null)}/>} 
      {drawer?.kind === "safety" && <SafetyNewsDrawer key={drawer.record?.id || "new-safety-news"} record={drawer.record} projects={projects} onClose={() => setDrawer(null)} onSave={saveSafetyNews}/>} 
      {drawer?.kind === "serviceBooking" && <ServiceBookingDrawer booking={drawer.record} elderly={elderlyRecords.find((record) => record.id === drawer.record.elderlyId)} onClose={() => setDrawer(null)} onUpdateStatus={updateServiceBookingStatus}/>} 
      {drawer?.kind === "serviceCatalog" && <ServiceCatalogDrawer key={drawer.record?.id || "new-service"} record={drawer.record} onClose={() => setDrawer(null)} onSave={saveServiceCatalogItem}/>} 
      {drawer?.kind === "weatherRegion" && <WeatherRegionIntegrationDrawer integration={drawer.integration} onClose={() => setDrawer(null)}/>} 
      {drawer?.kind === "relativeWeather" && <RelativeWeatherLocationDrawer key={drawer.account.id} account={drawer.account} location={weatherMockApi.getLocation(weatherLocations, "亲属", drawer.account.id)} onClose={() => setDrawer(null)} onSave={(selection) => saveRelativeWeatherLocation(drawer.account, selection)}/>} 
      {drawer?.kind === "careScript" && <CareScriptDrawer key={drawer.condition.code} condition={drawer.condition} record={drawer.record} onClose={() => setDrawer(null)} onSave={saveCareScript}/>} 
      {drawer?.kind === "generic" && <CreateDrawer page={active} onClose={() => setDrawer(null)}/>} 
      {deviceDrawer?.kind === "tabletCreate" && <TabletAssetDrawer devices={tabletDevices} onClose={() => setDeviceDrawer(null)} onSave={saveTabletDevice}/>} 
      {deviceDrawer?.kind === "tabletView" && <TabletAssetDrawer device={deviceDrawer.device} devices={tabletDevices} onClose={() => setDeviceDrawer(null)} onSave={saveTabletDevice}/>} 
      {deviceDrawer?.kind === "sensorCreate" && <SensorInstallDrawer sensors={sensorDevices} elderlyRecords={elderlyRecords} initialElderlyId={deviceDrawer.elderlyId} onClose={() => setDeviceDrawer(null)} onSave={saveSensorDevice}/>} 
      {deviceDrawer?.kind === "sensorView" && <SensorDetailDrawer sensor={deviceDrawer.sensor} elderlyRecords={elderlyRecords} onClose={() => setDeviceDrawer(null)} onMove={moveSensorRoom} onUnbind={unbindSensor}/>} 
      {spaceTarget && <SpaceManagementDrawer record={spaceTarget} onClose={() => setSpaceTarget(null)} onSave={saveElderlySpaces}/>} 
      {tabletTarget && <TabletBindingModal record={tabletTarget} project={projects.find((project) => project.name === tabletTarget.project)} devices={tabletDevices} activation={activationRecords.find((item) => item.elderlyId === tabletTarget.id && ["待使用", "激活失败"].includes(item.status))} onGenerate={generateTabletActivation} onFail={failTabletActivation} onActivate={(tabletId, activationId) => activateTablet(tabletTarget.id, tabletId, activationId)} onClose={() => setTabletTarget(null)} onUnbind={unbindTablet}/>} 
      {globalRuleOpen && <InactivityRuleDrawer rule={globalInactivityRule} onClose={() => setGlobalRuleOpen(false)} onSave={(rule) => { setGlobalInactivityRule(rule); setGlobalRuleOpen(false); }}/>} 
    </div>
  );
}
