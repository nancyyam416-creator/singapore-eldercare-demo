import { useEffect, useMemo, useRef, useState } from "react";
import activityTaichiCover from "./activity-taichi.svg";
import activitySafetyCover from "./activity-safety.svg";
import activityMusicCover from "./activity-music.svg";
import activityHealthCover from "./activity-health.svg";
import u2gLogo from "./u2g-logo.png";
import communityLifeMock from "../../产品理解/90 原型与Mock素材/mock/社区生活跨端统一Mock.json";
import serviceCategoryMock from "../../产品理解/90 原型与Mock素材/mock/特约服务分类统一Mock.json";
import tabletActivationMock from "../../产品理解/90 原型与Mock素材/mock/设备激活跨端统一Mock.json";
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
import { AcceptanceWorkbench } from "./AcceptanceWorkbench";
import { ComponentCenter } from "./ComponentCenter";
import { AdminConfirm, AdminDrawer, AdminToast } from "./AdminOverlay";
import {
  CommunityMembersPage,
  PlatformRoleManagementPage,
  PlatformUserManagementPage,
  RoleManagementPage,
  UserManagementPage,
  communityMembersStorageKey,
  createCommunityRoles,
  normalizeRoleRecords,
  readCommunityMembers,
  readRoles,
  roleStorageKey,
} from "./CommunityMembers";
import { CommunityStaffDrawer, CommunityStaffPage, initialCommunityStaff } from "./CommunityStaff";
import { LeisureEntertainmentPage, leisureEntertainmentStorageKey, readLeisureEntertainmentEntries } from "./LeisureEntertainment";
import { ServiceCommunicationPage } from "./ServiceCommunication";
import { PlatformTabletDevicesPage } from "./PlatformTabletDevices";
import { TabletOtaPage, tabletOtaStorageKey } from "./TabletOta";
import { MetricHelp } from "./MetricHelp";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  ClipboardList,
  FileClock,
  Gamepad2,
  GripVertical,
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
  RadioTower,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

const u2gPortalUrl = import.meta.env.VITE_U2G_PORTAL_URL || "http://localhost:53110/";

const communityMenuGroups = [
  { label: "工作台", items: [
    { key: "overview", label: "运营概览", icon: LayoutDashboard },
    { key: "elderlyDataDashboard", label: "老人使用分析", icon: Activity },
  ] },
  {
    label: "老人服务",
    items: [
      { key: "elderly", label: "老人档案", icon: Users },
      { key: "relations", label: "亲属档案", icon: HeartHandshake },
      { key: "emergencyHelp", label: "在线协助", icon: AlertTriangle },
      { key: "serviceCommunication", label: "服务沟通", icon: MessageSquareText },
    ],
  },
  {
    label: "运营内容",
    items: [
      { key: "recommendations", label: "推荐策略", icon: Sparkles },
      { key: "services", label: "预约服务", icon: ClipboardList },
    ],
  },
  {
    label: "社区生活",
    items: [
      { key: "communityAnnouncements", label: "社区公告", icon: MessageSquareText },
      { key: "lifeInformation", label: "生活资讯", icon: BookOpen },
      { key: "alertItems", label: "警惕事项", icon: AlertTriangle },
      { key: "activities", label: "社区活动", icon: CalendarDays },
      { key: "communityStaff", label: "社区人员", icon: Users },
    ],
  },
  {
    label: "设备与数据",
    items: [
      { key: "tabletDevices", label: "平板设备", icon: MonitorSmartphone },
    ],
  },
  {
    label: "系统管理",
    items: [
      { key: "userManagement", label: "用户管理", icon: Users },
      { key: "roleManagement", label: "角色管理", icon: ShieldCheck },
    ],
  },
];

const platformMenuGroups = [
  { label: "平台工作台", items: [{ key: "platformOverview", label: "平台总览", icon: LayoutDashboard }] },
  {
    label: "社区管理",
    items: [
      { key: "projects", label: "项目与社区", icon: Building2 },
    ],
  },
  {
    label: "公共能力",
    items: [
      { key: "careScripts", label: "天气关怀话术", icon: MessageSquareText },
      { key: "reminderPolicies", label: "消息推送", icon: Bell },
      { key: "leisureEntertainment", label: "休闲娱乐", icon: Gamepad2 },
    ],
  },
  {
    label: "设备管理",
    items: [
      { key: "platformTabletDevices", label: "平板设备", icon: MonitorSmartphone },
      { key: "tabletOta", label: "平板 OTA 升级", icon: Upload },
    ],
  },
  {
    label: "平台管理",
    items: [
      { key: "userManagement", label: "用户管理", icon: Users },
      { key: "roleManagement", label: "角色管理", icon: ShieldCheck },
      { key: "logs", label: "操作日志", icon: FileClock },
    ],
  },
];

const allMenuGroups = [...communityMenuGroups, ...platformMenuGroups];
const availableMenuKeys = new Set(allMenuGroups.flatMap((group) => group.items.map((item) => item.key)));
const platformMenuKeys = new Set(platformMenuGroups.flatMap((group) => group.items.map((item) => item.key)));
const communityContentTypeByMenu = {
  communityAnnouncements: "社区公告",
  lifeInformation: "生活资讯",
  alertItems: "警惕事项",
};

const pageMeta = {
  platformOverview: { title: "平台总览", description: "查看全部项目与社区的运行状态和数据范围", add: "" },
  elderlyDataDashboard: { title: "老人使用分析", description: "查看当前社区老人活动情况、屏幕使用、设备数据与趋势分析", add: "" },
  elderly: { title: "老人档案", description: "维护老人基础资料、所属项目与服务关系", add: "新增老人" },
  relations: { title: "亲属档案", description: "查看所有手机号注册用户及其关联的老人", add: "新增联系人" },
  emergencyHelp: { title: "在线协助", description: "跟进老人发起的协助请求、联系情况与处理结果", add: "" },
  serviceCommunication: { title: "服务沟通", description: "查看服务留言、老人查看状态与语音回复", add: "" },
  familyAlbums: { title: "家庭相册", description: "管理照片与视频批次，查看同步、首次查看和喜欢状态", add: "" },
  recommendations: { title: "推荐策略", description: "维护老人端每日推荐内容及自动轮播规则", add: "新增推荐策略" },
  communityAnnouncements: { title: "社区公告", description: "管理当前社区面向老人的公告内容", add: "新增公告" },
  lifeInformation: { title: "生活资讯", description: "管理当前社区面向老人的生活资讯", add: "新增资讯" },
  alertItems: { title: "警惕事项", description: "管理当前社区面向老人的警惕事项", add: "新增事项" },
  activities: { title: "社区活动", description: "发布活动并跟踪老人参与意向与触达结果", add: "发布活动" },
  communityStaff: { title: "社区人员", description: "维护面向当前社区老人展示的社区人员与服务联系人", add: "新增人员" },
  services: { title: "预约服务", description: "查看并处理老人通过中控屏提交的上门服务预约", add: "" },
  tabletDevices: { title: "平板设备", description: "维护平板资产、老人绑定、激活和在线状态", add: "录入平板" },
  platformTabletDevices: { title: "平板设备", description: "跨项目查看平板版本、升级进度与执行结果", add: "" },
  tabletOta: { title: "平板 OTA 升级", description: "统一管理平板 ROM 固件与 APK 应用版本，并向指定项目下发升级任务", add: "上传升级包" },
  careScripts: { title: "天气关怀话术", description: "按和风天气现象代码分组维护老人端可匹配展示的话术", add: "" },
  reminderPolicies: { title: "消息推送", description: "管理平台自动消息的触发规则、推送终端与启停状态", add: "" },
  leisureEntertainment: { title: "休闲娱乐", description: "统一维护所有社区老人端的多个娱乐入口", add: "" },
  projects: { title: "项目与社区", description: "维护老人档案可选择的服务项目和所属社区", add: "新增项目" },
  userManagement: { title: "用户管理", description: "维护后台用户、关联角色和账号状态", add: "新增用户" },
  roleManagement: { title: "角色管理", description: "维护菜单权限、操作权限和数据范围", add: "新增角色" },
  logs: { title: "操作日志", description: "追溯关键业务操作、结果与责任边界", add: "" },
};

const initialPlatformAuditLogs = [
  { id: "LOG-20261023-001", time: "2026-10-23 10:26:18", operator: "赵亚男", accountRole: "platform.admin / 平台管理员", module: "项目与社区", action: "新增", target: "红山社区", summary: "创建社区并配置项目管理员", result: "成功", client: "10.10.2.18 · Chrome / macOS", before: "无", after: "社区状态：启用；管理员：王淑芬", failureReason: "" },
  { id: "LOG-20261023-002", time: "2026-10-23 10:18:42", operator: "赵亚男", accountRole: "platform.admin / 平台管理员", module: "项目与社区", action: "编辑", target: "大巴窑社区", summary: "更新社区详细地址和联系人", result: "成功", client: "10.10.2.18 · Chrome / macOS", before: "联系人：待补充", after: "联系人：陈志伟；地址：85 Lorong 4 Toa Payoh", failureReason: "" },
  { id: "LOG-20261023-003", time: "2026-10-23 10:02:09", operator: "赵亚男", accountRole: "platform.admin / 平台管理员", module: "项目与社区", action: "停用", target: "宏茂桥社区", summary: "停用社区运营入口", result: "成功", client: "10.10.2.18 · Chrome / macOS", before: "状态：启用", after: "状态：停用", failureReason: "" },
  { id: "LOG-20261023-004", time: "2026-10-23 09:56:31", operator: "平台运营", accountRole: "platform.ops / 平台运营员", module: "项目与社区", action: "删除", target: "测试社区", summary: "删除未投入运营的测试社区", result: "失败", client: "10.10.2.22 · Edge / Windows", before: "社区存在 2 位关联老人", after: "无变更", failureReason: "社区存在关联老人，不允许删除" },
  { id: "LOG-20261022-005", time: "2026-10-22 17:42:16", operator: "赵亚男", accountRole: "platform.admin / 平台管理员", module: "平台用户", action: "新增", target: "platform.audit", summary: "创建平台审计用户", result: "成功", client: "10.10.2.18 · Chrome / macOS", before: "无", after: "角色：平台运营员；状态：已启用", failureReason: "" },
  { id: "LOG-20261022-006", time: "2026-10-22 16:33:40", operator: "赵亚男", accountRole: "platform.admin / 平台管理员", module: "平台用户", action: "编辑", target: "platform.ops", summary: "更新平台运营用户手机号", result: "成功", client: "10.10.2.18 · Chrome / macOS", before: "手机号：+65 9000 1000", after: "手机号：+65 9000 1002", failureReason: "" },
  { id: "LOG-20261022-007", time: "2026-10-22 15:18:05", operator: "赵亚男", accountRole: "platform.admin / 平台管理员", module: "平台用户", action: "停用", target: "platform.temp", summary: "停用临时运营账号", result: "成功", client: "10.10.2.18 · Chrome / macOS", before: "状态：已启用", after: "状态：已停用", failureReason: "" },
  { id: "LOG-20261022-008", time: "2026-10-22 14:52:27", operator: "赵亚男", accountRole: "platform.admin / 平台管理员", module: "平台角色", action: "新增", target: "审计查看员", summary: "新增只读审计角色", result: "成功", client: "10.10.2.18 · Chrome / macOS", before: "无", after: "菜单：操作日志；操作：查看", failureReason: "" },
  { id: "LOG-20261022-009", time: "2026-10-22 14:20:13", operator: "赵亚男", accountRole: "platform.admin / 平台管理员", module: "平台角色", action: "删除", target: "临时配置员", summary: "删除未被引用的自定义角色", result: "成功", client: "10.10.2.18 · Chrome / macOS", before: "状态：已停用；用户数：0", after: "角色已删除", failureReason: "" },
  { id: "LOG-20261022-010", time: "2026-10-22 11:48:56", operator: "平台运营", accountRole: "platform.ops / 平台运营员", module: "天气位置", action: "编辑", target: "新加坡区域接入", summary: "更新天气接入服务状态", result: "成功", client: "10.10.2.22 · Edge / Windows", before: "状态：待校验", after: "状态：有效", failureReason: "" },
  { id: "LOG-20261022-011", time: "2026-10-22 10:35:22", operator: "平台运营", accountRole: "platform.ops / 平台运营员", module: "天气关怀话术", action: "编辑", target: "普通降雨天气关怀话术", summary: "更新普通降雨话术与状态", result: "成功", client: "10.10.2.22 · Edge / Windows", before: "状态：停用", after: "状态：启用；文案已更新", failureReason: "" },
  { id: "LOG-20261021-012", time: "2026-10-21 18:06:44", operator: "赵亚男", accountRole: "platform.admin / 平台管理员", module: "休闲娱乐", action: "新增", target: "经典音乐入口", summary: "新增老人端娱乐入口并配置白名单", result: "成功", client: "10.10.2.18 · Chrome / macOS", before: "无", after: "状态：启用；白名单：2 条", failureReason: "" },
];

const elderlyPackageCatalog = [
  { value: "mobile_care", label: "手机关怀套餐" },
  { value: "tablet_care", label: "平板关怀套餐" },
  { value: "home_guard", label: "全屋守护套餐" },
  { value: "unconfigured", label: "未配置" },
];
const selectableElderlyPackages = elderlyPackageCatalog.filter((item) => item.value !== "unconfigured");

const getElderlyPackageLabel = (value) => elderlyPackageCatalog.find((item) => item.value === value)?.label || "未配置";

const elderlyRows = [
  {
    name: "陈美玲", id: "SG-E-000128", gender: "女", birthday: "1950-03-18", age: 76,
    phone: "+65 9123 6208", project: "红山社区养老计划", community: "红山社区", packageType: "home_guard",
    address: "12 Bukit Merah View #08-31", rooms: ["客厅", "卧室", "厨房"], tags: ["独居", "高龄"],
    family: 2, device: "3 / 3 在线",
    emergency: { name: "陈伟强", relation: "儿子", phone: "+65 9881 2036" }, updatedAt: "2026-07-16 10:24",
  },
  {
    name: "黄国强", id: "SG-E-000127", gender: "男", birthday: "1945-11-02", age: 81,
    phone: "+65 9018 3321", project: "大巴窑关怀中心", community: "大巴窑社区", packageType: "tablet_care",
    address: "85 Lorong 4 Toa Payoh #06-112", rooms: ["客厅", "卧室", "厨房"], tags: ["独居", "设备关注"],
    family: 1, device: "2 / 3 在线",
    emergency: { name: "黄丽芬", relation: "女儿", phone: "+65 9766 4102" }, updatedAt: "2026-07-16 09:42",
  },
  {
    name: "林秀英", id: "SG-E-000126", gender: "女", birthday: "1953-05-26", age: 73,
    phone: "+65 8890 7136", project: "女皇镇乐龄中心", community: "女皇镇社区", packageType: "mobile_care",
    address: "46 Commonwealth Drive #10-127", rooms: ["客厅", "主卧", "厨房", "卫生间"], tags: ["慢病关注", "用药提醒"],
    family: 3, device: "4 / 4 在线",
    emergency: { name: "林志明", relation: "儿子", phone: "+65 9332 5771" }, updatedAt: "2026-07-15 18:06",
  },
  {
    name: "王德昌", id: "SG-E-000125", gender: "男", birthday: "1947-08-14", age: 79,
    phone: "", project: "红山社区养老计划", community: "红山社区", packageType: "unconfigured",
    address: "待补充", rooms: [], tags: ["资料待补"],
    family: 2, device: "待安装",
    emergency: { name: "", relation: "", phone: "" }, updatedAt: "2026-07-15 14:18",
  },
  {
    name: "李玉珍", id: "SG-E-000124", gender: "女", birthday: "1942-01-09", age: 84,
    phone: "+65 8227 1645", project: "宏茂桥活跃乐龄中心", community: "宏茂桥社区", packageType: "home_guard",
    address: "305 Ang Mo Kio Avenue 1 #11-1161", rooms: ["客厅", "卧室", "厨房"], tags: ["高龄", "家庭同住"],
    family: 1, device: "3 / 3 在线",
    emergency: { name: "李惠珍", relation: "女儿", phone: "+65 9188 0427" }, updatedAt: "2026-07-14 16:35",
  },
  {
    name: "周阿顺", id: "SG-E-000123", gender: "男", birthday: "1949-06-30", age: 77,
    phone: "+65 8660 2941", project: "大巴窑关怀中心", community: "大巴窑社区", packageType: "unconfigured",
    address: "123 Lorong 1 Toa Payoh #04-308", rooms: ["客厅", "卧室", "玄关"], tags: ["待回访"],
    family: 2, device: "3 / 3 在线",
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
  { id: "PRJ-001", name: "红山社区", country: "新加坡", city: "新加坡", district: "Bukit Merah", address: "12 Bukit Merah View", timezone: "Asia/Singapore (UTC+8)", contact: "王淑芬", phone: "+65 6123 8801", status: "启用" },
  { id: "PRJ-002", name: "大巴窑社区", country: "新加坡", city: "新加坡", district: "Toa Payoh", address: "85 Lorong 4 Toa Payoh", timezone: "Asia/Singapore (UTC+8)", contact: "陈志伟", phone: "+65 6258 1902", status: "启用" },
  { id: "PRJ-003", name: "女皇镇社区", country: "新加坡", city: "新加坡", district: "Queenstown", address: "46 Commonwealth Drive", timezone: "Asia/Singapore (UTC+8)", contact: "林美芳", phone: "+65 6472 3306", status: "启用" },
  { id: "PRJ-004", name: "宏茂桥社区", country: "新加坡", city: "新加坡", district: "Ang Mo Kio", address: "305 Ang Mo Kio Avenue 1", timezone: "Asia/Singapore (UTC+8)", contact: "黄国民", phone: "", status: "启用" },
];

const communityContentTypes = ["社区公告", "生活资讯", "警惕事项"];
const communityContentMockNow = "2026-08-27 10:00";
const legacySafetyNews = [
  { id: "SAF-001", projectId: "PRJ-001", type: "警惕事项", title: "警惕冒充银行客服诈骗", description: "银行工作人员不会通过电话索取密码或验证码。", content: "近期出现冒充银行客服，以账户异常为由索取验证码的诈骗行为。请勿向陌生人提供银行卡信息、密码或短信验证码。", cover: "", source: "红山社区服务站", audience: "当前社区全部老人", publishAt: "2026-08-20 08:00", validUntil: "2026-09-20 23:59", displayOrder: 1, status: "已发布", updatedAt: "2026-08-20 08:00" },
  { id: "SAF-002", projectId: "PRJ-001", type: "生活资讯", title: "雨季居家防滑注意事项", description: "及时清理积水，重点检查卫生间和玄关。", content: "雨季地面容易湿滑，请及时擦干玄关、厨房和卫生间积水，穿着防滑鞋，并保持夜间照明充足。", cover: "", source: "红山社区健康组", audience: "当前社区全部老人", publishAt: "2026-08-21 09:00", validUntil: "2026-09-30 23:59", displayOrder: 2, status: "已发布", updatedAt: "2026-08-21 09:00" },
  { id: "SAF-005", projectId: "PRJ-001", type: "社区公告", title: "周三公共区域清洁安排", description: "上午十点前完成走廊清洁，请注意避让作业区域。", content: "本周三上午将进行公共走廊和活动室清洁，作业期间部分区域临时封闭，请按照现场指引通行。", cover: "", source: "红山社区运营组", audience: "当前社区全部老人", publishAt: "2026-08-24 08:00", validUntil: "2026-08-27 18:00", displayOrder: 1, status: "已发布", updatedAt: "2026-08-23 16:30" },
  { id: "SAF-007", projectId: "PRJ-001", type: "警惕事项", title: "雨天外出注意台阶积水", description: "雨天出行提示，外出时请放慢脚步。", content: "近期午后阵雨较多，社区入口台阶可能短时积水，建议外出时穿防滑鞋并使用扶手。", cover: "", source: "红山社区服务站", audience: "当前社区全部老人", publishAt: "2026-08-10 08:00", validUntil: "2026-08-20 23:59", displayOrder: 4, status: "已发布", updatedAt: "2026-08-10 08:00" },
  { id: "SAF-008", projectId: "PRJ-001", type: "生活资讯", title: "午后补水小提示", description: "该生活资讯已停止继续展示。", content: "天气炎热时请少量多次饮水，如有身体不适请及时联系家人或社区人员。", cover: "", source: "红山社区健康组", audience: "当前社区全部老人", publishAt: "2026-08-12 09:00", validUntil: "2026-09-12 23:59", displayOrder: 5, status: "已停用", updatedAt: "2026-08-22 15:10" },
  { id: "SAF-003", projectId: "PRJ-002", type: "社区公告", title: "社区维修工程通知", description: "公共区域照明维护，请按现场指引绕行。", content: "大巴窑关怀中心公共区域将进行照明维护，施工期间请老人注意绕行，并听从现场工作人员指引。", cover: "", source: "大巴窑社区运营组", audience: "当前社区全部老人", publishAt: "2026-08-22 08:00", validUntil: "2026-08-28 18:00", displayOrder: 1, status: "已发布", updatedAt: "2026-08-22 08:00" },
  { id: "SAF-004", projectId: "PRJ-002", type: "警惕事项", title: "陌生人上门服务核验指南", description: "无法核验身份时，不开门、不转账。", content: "如有陌生人自称维修、送货或社区工作人员上门，请先通过官方电话核验身份。", cover: "", source: "大巴窑社区服务站", audience: "当前社区全部老人", publishAt: "2026-08-18 08:00", validUntil: "2026-09-18 23:59", displayOrder: 2, status: "已发布", updatedAt: "2026-08-18 08:00" },
];

function getCommunityContentStatus(record) {
  if (record.status === "已停用") return "已停用";
  if (record.status === "未发布" || record.publishAt > communityContentMockNow) return "未发布";
  return "已发布";
}

function isCommunityContentAvailable(record) {
  if (getCommunityContentStatus(record) !== "已发布") return false;
  return !record.validUntil || record.validUntil >= communityContentMockNow;
}

const legacyServiceBookings = [
  { id: "RSV-20260726001", serviceId: "cleaning", serviceName: "家政保洁", category: "居家服务", elderlyId: "SG-E-000128", provider: "安心到家社区服务中心", slotId: "clean-tomorrow-am", slotLabel: "明天上午 09:00—11:00", status: "待确认", createdAt: "2026-07-26 09:18", source: "老人中控屏", operator: "", updatedAt: "2026-07-26 09:18" },
  { id: "RSV-20260726002", serviceId: "repair", serviceName: "上门维修", category: "居家服务", elderlyId: "SG-E-000127", provider: "社区便民维修站", slotId: "repair-tomorrow-pm", slotLabel: "明天下午 14:00—16:00", status: "已确认", createdAt: "2026-07-26 08:42", source: "老人中控屏", operator: "赵亚男", updatedAt: "2026-07-26 09:05" },
  { id: "RSV-20260725003", serviceId: "medical-companion", serviceName: "陪诊服务", category: "健康服务", elderlyId: "SG-E-000126", provider: "社区健康管家中心", slotId: "medical-tomorrow-am", slotLabel: "明天上午 07:30—12:00", status: "服务中", createdAt: "2026-07-25 16:20", source: "老人中控屏", operator: "张文杰", updatedAt: "2026-07-26 07:25" },
  { id: "RSV-20260724004", serviceId: "care", serviceName: "助老生活照护", category: "照护服务", elderlyId: "SG-E-000124", provider: "社区综合助老服务站", slotId: "care-tomorrow-pm", slotLabel: "明天下午 14:30—16:30", status: "已完成", createdAt: "2026-07-24 11:08", source: "老人中控屏", operator: "赵亚男", updatedAt: "2026-07-25 16:45" },
  { id: "RSV-20260724005", serviceId: "cleaning", serviceName: "家政保洁", category: "居家服务", elderlyId: "SG-E-000123", provider: "安心到家社区服务中心", slotId: "clean-after-am", slotLabel: "后天上午 09:00—11:00", status: "已取消", createdAt: "2026-07-24 10:16", source: "老人中控屏", operator: "老人本人", updatedAt: "2026-07-24 10:28" },
];

const legacyServiceCatalog = [
  { id: "SRV-001", name: "家政保洁", category: "居家服务", provider: "安心到家社区服务中心", description: "提供日常居家清洁、地面清洁和基础整理服务。", slots: ["明天上午 09:00—11:00", "明天下午 14:00—16:00", "后天上午 09:00—11:00"], status: "启用", updatedAt: "2026-07-24 10:20" },
  { id: "SRV-002", name: "上门维修", category: "居家服务", provider: "社区便民维修站", description: "提供水电、门锁及常用居家设施的上门检查和维修。", slots: ["明天上午 10:00—12:00", "明天下午 14:00—16:00"], status: "启用", updatedAt: "2026-07-23 16:45" },
  { id: "SRV-003", name: "陪诊服务", category: "健康服务", provider: "社区健康管家中心", description: "协助老人就医报到、院内陪同及返程联系。", slots: ["明天上午 07:30—12:00", "后天上午 07:30—12:00"], status: "启用", updatedAt: "2026-07-22 09:18" },
  { id: "SRV-004", name: "助老生活照护", category: "照护服务", provider: "社区综合助老服务站", description: "提供生活协助、简单照护和日常陪伴。", slots: ["明天上午 09:30—11:30", "明天下午 14:30—16:30"], status: "启用", updatedAt: "2026-07-21 14:06" },
];

const initialServiceCategories = serviceCategoryMock.serviceCategories.map((category) => ({
  ...category,
  status: category.status === "enabled" ? "启用" : "已停用",
}));

const initialServiceBookings = serviceCategoryMock.serviceBookings.map((booking) => ({
  ...booking,
  category: booking.categoryNameSnapshot,
  slotId: `${booking.serviceId}-${booking.id}`,
}));

const initialServiceCatalog = serviceCategoryMock.serviceItems.map((service) => ({
  ...service,
  category: service.categoryName,
  description: `${service.categoryName}可预约服务`,
  slots: ["明天上午 09:00—11:00"],
  status: service.status === "enabled" && service.available ? "启用" : "停用",
  updatedAt: serviceCategoryMock.mockNow.slice(0, 16).replace("T", " "),
}));

const initialTabletDevices = [
  { id: "TAB-SG-20260031", projectId: "PRJ-001", sn: "SN-TAB-260031", model: "U2G Home 14", currentVersion: "v2.5.3", romVersion: "v1.5.0", apkVersion: "v2.1.0", versionStatus: "待更新", networkType: "Wi-Fi", ipAddress: "192.168.10.31", activationCode: "583104", operator: "赵亚男", activationStatus: "已激活", onlineStatus: "在线", boundElderlyId: "SG-E-000128", boundAt: "2026-07-02 10:18", lastOnline: "2 分钟前", usageRecords: [{ id: "USE-20261026-001", type: "完成提醒", occurredAt: "2026-10-26 08:12", valid: true }] },
  { id: "TAB-SG-20260030", projectId: "PRJ-002", sn: "SN-TAB-260030", model: "U2G Home 14", currentVersion: "v2.6.0", romVersion: "v1.6.0", apkVersion: "v2.2.0", versionStatus: "已最新", networkType: "Wi-Fi", ipAddress: "192.168.10.30", activationCode: "271946", operator: "张文杰", activationStatus: "已激活", onlineStatus: "在线", boundElderlyId: "SG-E-000126", boundAt: "2026-06-28 15:40", lastOnline: "5 分钟前", usageRecords: [{ id: "USE-20261026-002", type: "提交预约服务", occurredAt: "2026-10-26 09:20", valid: true }] },
  { id: "TAB-SG-20260029", projectId: "PRJ-003", sn: "SN-TAB-260029", model: "U2G Home 14", currentVersion: "v2.4.8", romVersion: "v1.4.8", apkVersion: "v2.0.8", versionStatus: "待更新", networkType: "有线", ipAddress: "192.168.10.29", activationCode: "806315", operator: "赵亚男", activationStatus: "已激活", onlineStatus: "离线", boundElderlyId: "SG-E-000127", boundAt: "2026-06-25 09:32", lastOnline: "4 小时前", usageRecords: [{ id: "USE-20261026-003", type: "使用休闲娱乐", occurredAt: "2026-10-26 07:45", valid: true }] },
  { id: "TAB-SG-20260032", projectId: "PRJ-004", sn: "SN-TAB-260032", model: "U2G Home 14", currentVersion: "v2.6.0", romVersion: "v1.6.0", apkVersion: "v2.2.0", versionStatus: "已最新", networkType: "Wi-Fi", ipAddress: "未分配", activationCode: "", operator: "", activationStatus: "待激活", onlineStatus: "离线", boundElderlyId: null, boundAt: "", lastOnline: "尚未激活" },
  { id: "TAB-SG-20260033", projectId: "PRJ-001", sn: "SN-TAB-260033", model: "U2G Home 14", currentVersion: "v2.6.0", romVersion: "v1.5.0", apkVersion: "v2.1.0", versionStatus: "待更新", networkType: "有线", ipAddress: "192.168.10.33", activationCode: "", operator: "", activationStatus: "待激活", onlineStatus: "离线", boundElderlyId: null, boundAt: "", lastOnline: "尚未激活" },
];

const normalizeTabletActivationStatus = (status) => status === "待激活" ? "待使用" : status;
const isPendingTabletActivation = (status) => normalizeTabletActivationStatus(status) === "待使用";
const isFailedTabletActivation = (status) => ["激活失败", "已过期"].includes(normalizeTabletActivationStatus(status));
const normalizeTabletActivationRecord = (record) => ({ ...record, status: normalizeTabletActivationStatus(record.status) });

const initialActivationRecords = [
  normalizeTabletActivationRecord({ id: "ACT-CROSS-END-001", code: tabletActivationMock.activationCode, elderlyId: tabletActivationMock.elderlyId, deviceId: tabletActivationMock.deviceId, deviceSn: tabletActivationMock.deviceSn, status: tabletActivationMock.states.generated.activationCodeStatus, method: "6位激活码", createdAt: tabletActivationMock.createdAt, operator: tabletActivationMock.operator }),
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
  { id: "REM-000101", elderlyId: "SG-E-000128", type: "用药提醒", title: "早间降压药", date: "2026-07-30", time: "08:00", repeat: "每天", dosage: "1 片", usage: "早餐后服用", note: "", createdBy: "赵亚男", createdAt: "2026-07-18 10:24", updatedBy: "赵亚男", updatedAt: "2026-07-28 16:10", occurrences: [{ id: "OCC-101-01", date: "2026-07-29", time: "08:00", status: "已完成", resultAt: "2026-07-29 08:12" }, { id: "OCC-101-02", date: "2026-07-30", time: "08:00", status: "未到时间", resultAt: "—" }] },
  { id: "REM-000102", elderlyId: "SG-E-000126", type: "日常提醒", title: "社区体检", date: "2026-07-29", time: "09:30", repeat: "仅一次", note: "携带身份证和既往病历", createdBy: "张文杰", createdAt: "2026-07-20 15:16", updatedBy: "张文杰", updatedAt: "2026-07-20 15:16", deleteFailureOnce: true, occurrences: [{ id: "OCC-102-01", date: "2026-07-29", time: "09:30", status: "待完成", resultAt: "—" }] },
  { id: "REM-000103", elderlyId: "SG-E-000127", type: "用药提醒", title: "晚间用药", date: "2026-07-28", time: "20:00", repeat: "每天", dosage: "", usage: "睡前服用", note: "", createdBy: "赵亚男", createdAt: "2026-07-21 09:42", updatedBy: "赵亚男", updatedAt: "2026-07-27 09:20", occurrences: [{ id: "OCC-103-01", date: "2026-07-27", time: "20:00", status: "未确认", resultAt: "—" }, { id: "OCC-103-02", date: "2026-07-28", time: "20:00", status: "已过期", resultAt: "—" }] },
  { id: "REM-000104", elderlyId: "SG-E-000124", type: "日常提醒", title: "与女儿视频通话", date: "2026-07-31", time: "19:00", repeat: "每周四", note: "每周四视频通话", createdBy: "赵亚男", createdAt: "2026-07-22 11:08", updatedBy: "赵亚男", updatedAt: "2026-07-22 11:08", occurrences: [{ id: "OCC-104-01", date: "2026-07-31", time: "19:00", status: "未到时间", resultAt: "—" }] },
  { id: "REM-000105", elderlyId: "SG-E-000128", type: "日常提醒", title: "晚间测量血压", date: "2026-07-26", time: "20:30", repeat: "每天", note: "测量后记录结果", createdBy: "赵亚男", createdAt: "2026-07-24 09:15", updatedBy: "赵亚男", updatedAt: "2026-07-25 10:20", deletedBy: "赵亚男", deletedAt: "2026-07-28 17:05", stoppedFutureCount: 1, occurrences: [{ id: "OCC-105-01", date: "2026-07-26", time: "20:30", status: "已完成", resultAt: "2026-07-26 20:36" }, { id: "OCC-105-02", date: "2026-07-27", time: "20:30", status: "未确认", resultAt: "—" }] },
];

const emergencyAssistanceStatuses = ["待接听", "处理中", "已完成"];

const initialEmergencyHelpEvents = [
  {
    id: "SOS-20260728001", elderlyId: "SG-E-000128", startedAt: "2026-07-28 09:42:18", sourceDevice: "客厅平板", sourceDeviceId: "TAB-SG-20260031",
    status: "处理中", handler: "赵亚男", result: "呼叫中心已与老人建立通话，正在持续处理；子女通知状态已同步。", childrenContacted: true, completedAt: "", completedBy: "",
    callCenter: { status: "已接听", lastAttemptAt: "2026-07-28 09:42:22", answeredAt: "2026-07-28 09:42:24", callbackAt: "", agent: "呼叫中心 01", result: "已与老人建立通话，确认老人意识清醒，正在持续处理。", note: "老人当时意识清醒，能正常沟通；坐席已告知其保持电话畅通。" },
    notifications: [
      { id: "SOS-N-001", recipientType: "子女", name: "陈伟强", relation: "儿子", phone: "+65 9881 2036", deliveryStatus: "已送达", viewedAt: "2026-07-28 09:43:05", contactStatus: "已联系", contactedAt: "2026-07-28 09:46:20", retryCount: 0, failureReason: "", lastAttemptAt: "2026-07-28 09:42:26" },
      { id: "SOS-N-002", recipientType: "子女", name: "陈丽华", relation: "女儿", phone: "+65 8123 7701", deliveryStatus: "发送失败", viewedAt: "", contactStatus: "未联系", contactedAt: "", retryCount: 2, failureReason: "推送通道暂时不可用", lastAttemptAt: "2026-07-28 09:44:12" },
    ],
    timeline: [
      { time: "09:42:18", title: "老人发起在线协助", detail: "由客厅平板长按协助按钮发起，系统同步呼叫呼叫中心并通知全部已绑定子女" },
      { time: "09:42:24", title: "呼叫中心已接听", detail: "呼叫中心 01 接听并由赵亚男负责处理" },
      { time: "09:43:05", title: "子女已查看", detail: "陈伟强已查看通知，当前仅同步知情进度" },
      { time: "09:44:12", title: "部分通知失败", detail: "陈丽华的通知发送失败，不影响事件继续由呼叫中心处理" },
    ],
  },
  {
    id: "SOS-20260728002", elderlyId: "SG-E-000127", startedAt: "2026-07-28 08:16:42", sourceDevice: "卧室协助按钮", sourceDeviceId: "SOS-BTN-00027",
    status: "待接听", handler: "张文杰", result: "", childrenContacted: false, completedAt: "", completedBy: "",
    callCenter: { status: "待回拨", lastAttemptAt: "2026-07-28 08:16:48", answeredAt: "", callbackAt: "", agent: "呼叫中心 02", result: "", note: "" },
    notifications: [{ id: "SOS-N-003", recipientType: "子女", name: "黄丽芬", relation: "女儿", phone: "+65 9766 4102", deliveryStatus: "已送达", viewedAt: "2026-07-28 08:18:03", contactStatus: "未联系", contactedAt: "", retryCount: 0, failureReason: "", lastAttemptAt: "2026-07-28 08:16:50" }],
    timeline: [
      { time: "08:16:42", title: "老人发起在线协助", detail: "由卧室协助按钮发起，系统同步呼叫呼叫中心并通知已绑定子女" },
      { time: "08:17:18", title: "呼叫中心未接通", detail: "首次呼叫无人接听，事件已进入待回拨队列" },
      { time: "08:18:03", title: "子女已查看", detail: "黄丽芬已查看通知，尚未确认联系老人" },
    ],
  },
  {
    id: "SOS-20260728003", elderlyId: "SG-E-000126", startedAt: "2026-07-28 07:35:10", sourceDevice: "客厅平板", sourceDeviceId: "TAB-SG-20260030",
    status: "已完成", handler: "赵亚男", result: "确认由老人误触，无需继续协助。", childrenContacted: true, completedAt: "2026-07-28 07:41:28", completedBy: "赵亚男",
    callCenter: { status: "已接听", lastAttemptAt: "2026-07-28 07:35:15", answeredAt: "2026-07-28 07:35:18", callbackAt: "", agent: "呼叫中心 01" },
    notifications: [{ id: "SOS-N-004", recipientType: "子女", name: "林志明", relation: "儿子", phone: "+65 9332 5771", deliveryStatus: "已送达", viewedAt: "2026-07-28 07:37:16", contactStatus: "已联系", contactedAt: "2026-07-28 07:39:05", retryCount: 0, failureReason: "", lastAttemptAt: "2026-07-28 07:35:19" }],
    timeline: [
      { time: "07:35:10", title: "老人发起在线协助", detail: "由客厅平板长按协助按钮发起" },
      { time: "07:35:18", title: "呼叫中心已接听", detail: "通话中确认老人误触" },
      { time: "07:41:28", title: "事件已取消", detail: "赵亚男记录处理结果并结束本次误触事件" },
    ],
  },
  {
    id: "SOS-20260727004", elderlyId: "SG-E-000124", startedAt: "2026-07-27 19:22:06", sourceDevice: "客厅平板", sourceDeviceId: "TAB-SG-20260032",
    status: "已完成", handler: "张文杰", result: "女儿已到达老人住所并继续陪同。", childrenContacted: true, completedAt: "2026-07-27 19:46:35", completedBy: "张文杰",
    callCenter: { status: "回拨成功", lastAttemptAt: "2026-07-27 19:25:10", answeredAt: "", callbackAt: "2026-07-27 19:25:10", agent: "呼叫中心 02", result: "已确认老人安全，女儿已到达住所陪同。", note: "呼叫中心已提醒家属继续观察老人状态。\n如出现意识不清或身体不适，请立即再次发起在线协助。" },
    childResult: { status: "已同步", resultSummary: "女儿已到达老人住所并继续陪同。", callCenterNote: "呼叫中心已提醒家属继续观察老人状态。\n如出现意识不清或身体不适，请立即再次发起在线协助。", publishedAt: "2026-07-27 19:46:35" },
    notifications: [{ id: "SOS-N-005", recipientType: "子女", name: "李惠珍", relation: "女儿", phone: "+65 9188 0427", deliveryStatus: "已送达", viewedAt: "2026-07-27 19:23:44", contactStatus: "已联系", contactedAt: "2026-07-27 19:28:16", retryCount: 0, failureReason: "", lastAttemptAt: "2026-07-27 19:22:15" }],
    timeline: [
      { time: "19:22:06", title: "老人发起在线协助", detail: "由客厅平板长按协助按钮发起" },
      { time: "19:22:15", title: "子女通知已送达", detail: "在线协助信息已送达李惠珍" },
      { time: "19:23:44", title: "子女已查看", detail: "李惠珍已查看本次在线协助进度" },
      { time: "19:25:10", title: "呼叫中心回拨成功", detail: "确认老人需要家人陪同" },
      { time: "19:46:35", title: "呼叫中心提交处理结果", detail: "张文杰完成事件，处理结果已同步给已绑定子女" },
    ],
  },
  {
    id: "SOS-20260728005", elderlyId: "SG-E-000128", startedAt: "2026-07-28 10:05:30", sourceDevice: "客厅平板", sourceDeviceId: "TAB-SG-20260031",
    status: "待接听", handler: "待分配", result: "", childrenContacted: false, completedAt: "", completedBy: "",
    callCenter: { status: "待接听", lastAttemptAt: "2026-07-28 10:05:31", answeredAt: "", callbackAt: "", agent: "待分配" },
    notifications: [{ id: "SOS-N-006", recipientType: "子女", name: "陈伟强", relation: "儿子", phone: "+65 9881 2036", deliveryStatus: "已送达", viewedAt: "", contactStatus: "未联系", contactedAt: "", retryCount: 0, failureReason: "", lastAttemptAt: "2026-07-28 10:05:34" }],
    timeline: [{ time: "10:05:30", title: "老人发起在线协助", detail: "系统正在呼叫呼叫中心，并已向全部已绑定子女发送通知" }],
  },
  {
    id: "SOS-20260728006", elderlyId: "SG-E-000127", startedAt: "2026-07-28 06:58:12", sourceDevice: "卧室协助按钮", sourceDeviceId: "SOS-BTN-00027",
    status: "处理中", handler: "赵亚男", result: "老人反馈卧室协助按钮偶发无响应，需要安排人员检查设备。", childrenContacted: true, completedAt: "", completedBy: "",
    callCenter: { status: "回拨成功", lastAttemptAt: "2026-07-28 07:05:08", answeredAt: "", callbackAt: "2026-07-28 07:05:08", agent: "呼叫中心 01" },
    notifications: [{ id: "SOS-N-007", recipientType: "子女", name: "黄丽芬", relation: "女儿", phone: "+65 9766 4102", deliveryStatus: "已送达", viewedAt: "2026-07-28 07:01:20", contactStatus: "已联系", contactedAt: "2026-07-28 07:08:42", retryCount: 0, failureReason: "", lastAttemptAt: "2026-07-28 06:58:20" }],
    timeline: [
      { time: "06:58:12", title: "老人发起在线协助", detail: "由卧室协助按钮发起" },
      { time: "07:05:08", title: "呼叫中心回拨成功", detail: "老人反馈设备偶发无响应" },
      { time: "07:08:42", title: "子女已查看", detail: "黄丽芬已查看本次在线协助进度" },
      { time: "07:12:30", title: "处理记录已更新", detail: "赵亚男安排后续设备检查" },
    ],
  },
];

function normalizeEmergencyAssistanceEvent(event) {
  const { assistanceType: _removedAssistanceType, ...baseEvent } = event;
  const initialEvent = initialEmergencyHelpEvents.find((item) => item.id === event.id);
  const initialCallCenter = initialEvent?.callCenter || {};
  const initialChildResult = initialEvent?.childResult || {};
  const persistedChildResult = event.childResult || {};
  const timelineSource = initialChildResult.status === "已同步" ? initialEvent.timeline : (event.timeline || []);
  const normalizeCopy = (value) => String(value || "")
    .replaceAll("紧急求助", "在线协助")
    .replaceAll("紧急呼叫", "在线协助")
    .replaceAll("紧急协助", "在线协助")
    .replaceAll("求助按钮", "协助按钮")
    .replaceAll("求助详情", "协助详情")
    .replaceAll("求助事件", "协助事件")
    .replaceAll("正在联系未收到通知的女儿，儿子已知情并协同处理。", "呼叫中心已与老人建立通话，正在持续处理；子女通知状态已同步。")
    .replaceAll("已与老人建立通话，确认需要联系家人协同处理。", "已与老人建立通话，确认老人意识清醒，正在持续处理。")
    .replaceAll("随后确认可以协同处理", "当前仅同步知情进度")
    .replaceAll("已知情并确认可协同", "已查看本次在线协助进度");
  return {
    ...baseEvent,
    status: emergencyAssistanceStatuses.includes(event.status)
      ? event.status
      : ["未接通", "待回拨"].includes(event.status)
        ? "待接听"
        : ["已取消", "已结束"].includes(event.status)
          ? "已完成"
          : "处理中",
    handler: event.handler || event.endedBy || "赵亚男",
    result: normalizeCopy(["部分通知失败", "通知已全部送达", "等待处理", "误触已结束", "已结束"].includes(event.result) ? (event.endNote || "") : (event.result || "")),
    childrenContacted: Boolean(event.childrenContacted),
    completedAt: event.completedAt || event.endedAt || "",
    completedBy: event.completedBy || event.endedBy || "",
    callCenter: {
      status: "—", lastAttemptAt: "", answeredAt: "", callbackAt: "", agent: "—",
      ...initialCallCenter,
      ...(event.callCenter || {}),
      result: normalizeCopy(event.callCenter?.result || initialCallCenter.result || ""),
      note: normalizeCopy(event.callCenter?.note || initialCallCenter.note || ""),
    },
    childResult: {
      status: persistedChildResult.status || initialChildResult.status || "未同步",
      resultSummary: normalizeCopy(persistedChildResult.resultSummary || persistedChildResult.result || initialChildResult.resultSummary || initialChildResult.result || ""),
      callCenterNote: normalizeCopy(persistedChildResult.callCenterNote || persistedChildResult.note || initialChildResult.callCenterNote || initialChildResult.note || event.callCenter?.note || initialCallCenter.note || ""),
      publishedAt: persistedChildResult.publishedAt || initialChildResult.publishedAt || "",
    },
    sourceDevice: normalizeCopy(event.sourceDevice),
    notifications: (event.notifications || []).map((item) => ({ ...item, recipientType: "子女", contactStatus: item.contactStatus || (item.viewedAt ? "已联系" : "未联系"), contactedAt: item.contactedAt || "" })),
    timeline: timelineSource.map((item) => ({
      ...item,
      title: normalizeCopy(item.title),
      detail: normalizeCopy(item.detail),
    })),
  };
}

const communityContentTypeLabels = {
  announcement: "社区公告",
  life_info: "生活资讯",
  topic: "社区话题",
  alert: "警惕事项",
};
const communityContentStatusLabels = { unpublished: "未发布", published: "已发布", disabled: "已停用" };
const communityParticipationStatusLabels = { interested: "想参加", not_interested: "暂不参加" };
const communityLiveStatusLabels = { not_started: "未开始", live: "直播中", ended: "已结束" };
const communityActivityMockNow = new Date("2026-08-24T15:00:00+08:00").getTime();
const getCommunityActivityStatus = (activity) => {
  if (activity.isOffline) return "已下架";
  const startAt = new Date(activity.startAt).getTime();
  const endAt = new Date(activity.endAt).getTime();
  if (Number.isFinite(endAt) && communityActivityMockNow >= endAt) return "已结束";
  if (Number.isFinite(startAt) && communityActivityMockNow >= startAt) return "进行中";
  return "未开始";
};
const getCommunityActivityRegistrationPhase = (activity) => {
  if (activity.isOffline) return "报名结束";
  const registrationStartAt = new Date(activity.registrationStartAt).getTime();
  const registrationEndAt = new Date(activity.registrationEndAt).getTime();
  if (Number.isFinite(registrationEndAt) && communityActivityMockNow >= registrationEndAt) return "报名结束";
  if (Number.isFinite(registrationStartAt) && communityActivityMockNow >= registrationStartAt) return "报名中";
  return "未开始报名";
};
const isValidHttpUrl = (value = "") => {
  try {
    const url = new URL(String(value).trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};
const validateActivityLiveConfig = (activity) => {
  if (!activity.liveEnabled) return {};
  const errors = {};
  if (!activity.scheduledLiveStartAt) errors.scheduledLiveStartAt = "请选择预计开播时间";
  const meetingId = String(activity.zoomMeetingId || "").trim();
  const meetingIdDigits = meetingId.replace(/\D/g, "");
  if (!meetingId) errors.zoomMeetingId = "请输入 Zoom 会议 ID";
  else if (!/^[\d\s-]+$/.test(meetingId) || meetingIdDigits.length < 9 || meetingIdDigits.length > 11) errors.zoomMeetingId = "请输入 9–11 位数字的 Zoom 会议 ID";
  if (String(activity.zoomJoinUrl || "").trim() && !isValidHttpUrl(activity.zoomJoinUrl)) errors.zoomJoinUrl = "请输入合法的 http/https Zoom 加入链接";
  return errors;
};
const getActivityLivePresentation = (activity) => {
  if (!activity.liveEnabled) return activity.scheduledLiveStartAt || activity.zoomMeetingId || activity.zoomJoinUrl
    ? { label: "未提供", tone: "muted", detail: "Zoom 会议信息已保留" }
    : { label: "不提供直播", tone: "muted", detail: "仅支持线下参加" };
  const errors = validateActivityLiveConfig(activity);
  if (Object.keys(errors).length) return { label: "配置异常", tone: "danger", detail: Object.values(errors)[0] };
  if (activity.liveMockState === "load_failed") return { label: "加载失败", tone: "danger", detail: "可重试，不改变参加意向" };
  if (activity.liveMockState === "interrupted") return { label: "直播中断", tone: "danger", detail: "可恢复，不改变活动状态" };
  return { label: communityLiveStatusLabels[activity.liveStatus] || "未开始", tone: activity.liveStatus === "live" ? "success" : "default", detail: activity.scheduledLiveStartAt ? `预计 ${activity.scheduledLiveStartAt.replace("T", " ")}` : "—" };
};
const communityCoverAssets = {
  alert: activitySafetyCover,
  announcement: activityTaichiCover,
  life_info: activityHealthCover,
  topic: activityMusicCover,
  "ACT-001": activityTaichiCover,
  "ACT-002": activitySafetyCover,
  "ACT-005": activityMusicCover,
  "ACT-006": activityHealthCover,
  "ACT-007": activityHealthCover,
  "ACT-008": activitySafetyCover,
};
const formatMockDateTime = (value = "") => value ? value.slice(0, 16).replace("T", " ") : "";
const formatMockInputDateTime = (value = "") => value ? value.slice(0, 16) : "";

const initialSafetyNews = communityLifeMock.communityContents.map((item) => ({
  id: item.id,
  projectId: item.projectId,
  communityId: item.communityId,
  resourceType: item.resourceType,
  type: communityContentTypeLabels[item.resourceType],
  title: item.title,
  description: item.summary,
  content: richTextToPlainText(item.bodyHtml),
  contentHtml: item.bodyHtml,
  cover: communityCoverAssets[item.resourceType] || "",
  coverUrl: item.coverUrl,
  source: item.source,
  audience: item.audience,
  publishAt: formatMockDateTime(item.publishAt),
  validUntil: formatMockDateTime(item.validUntil),
  displayOrder: item.displayOrder,
  status: communityContentStatusLabels[item.publishStatus],
  updatedAt: formatMockDateTime(item.updatedAt),
}));

const initialCommunityTopics = (communityLifeMock.communityTopics || []).map((item) => ({
  ...item,
  createdAt: formatMockDateTime(item.createdAt),
  body: richTextToPlainText(item.bodyHtml),
}));

const initialTopicComments = (communityLifeMock.topicComments || []).map((item) => ({
  ...item,
  createdAt: formatMockDateTime(item.createdAt),
}));

const initialCommunityActivities = communityLifeMock.communityActivities.map((item) => ({
  id: item.id,
  projectId: item.projectId,
  communityId: item.communityId,
  resourceType: item.resourceType,
  title: item.title,
  category: item.category,
  description: item.summary,
  contentHtml: item.bodyHtml,
  cover: communityCoverAssets[item.id] || "",
  coverUrl: item.coverUrl,
  startAt: formatMockInputDateTime(item.startAt),
  endAt: formatMockInputDateTime(item.endAt),
  location: item.location,
  capacity: item.capacity,
  registrationStartAt: formatMockInputDateTime(item.registrationStartAt),
  registrationEndAt: formatMockInputDateTime(item.registrationEndAt),
  isOffline: Boolean(item.isOffline),
  contact: item.contact,
  liveEnabled: Boolean(item.liveEnabled),
  liveStatus: item.liveStatus || "not_started",
  scheduledLiveStartAt: formatMockInputDateTime(item.scheduledLiveStartAt),
  zoomMeetingId: item.zoomMeetingId || "",
  zoomMeetingPassword: item.zoomMeetingPassword || "",
  zoomJoinUrl: item.zoomJoinUrl || "",
  liveMockState: item.liveMockState || "normal",
  publishedAt: formatMockDateTime(item.publishAt),
  updatedAt: formatMockDateTime(item.updatedAt),
}));

const initialActivityRegistrations = communityLifeMock.activityParticipationIntents.map((item) => ({
  id: item.id,
  projectId: item.projectId,
  communityId: item.communityId,
  activityId: item.activityId,
  elderlyId: item.elderlyId,
  registeredAt: formatMockDateTime(item.submittedAt),
  status: communityParticipationStatusLabels[item.participationStatus],
}));

const initialFamilyAlbumBatches = [
  { id: "BATCH-20260727-01", uploaderId: "RU-00031", elderlyId: "SG-E-000128", categoryNameSnapshot: "家庭日常", contentType: "照片和视频", photoCount: 4, videoCount: 2, hasMessage: true, uploadedAt: "2026-07-27 09:18", publishStatus: "已发布", syncStatus: "已同步", successCount: 6, failedCount: 0, lastSyncAt: "2026-07-27 09:19", syncError: "", firstViewedAt: "2026-07-27 09:42", likedMediaCount: 3, lastLikedAt: "2026-07-27 09:46", relationStatus: "有效" },
  { id: "BATCH-20260726-03", uploaderId: "RU-00030", elderlyId: "SG-E-000127", categoryNameSnapshot: "节日团聚", contentType: "仅视频", photoCount: 0, videoCount: 3, hasMessage: true, uploadedAt: "2026-07-26 20:36", publishStatus: "已发布", syncStatus: "同步失败", successCount: 0, failedCount: 3, lastSyncAt: "2026-07-26 20:38", syncError: "3 段视频同步失败，等待老人端网络恢复后重试", firstViewedAt: "", likedMediaCount: 0, lastLikedAt: "", relationStatus: "有效" },
  { id: "BATCH-20260726-05", uploaderId: "RU-00029", elderlyId: "SG-E-000126", categoryNameSnapshot: "旅行时光", contentType: "照片和视频", photoCount: 3, videoCount: 2, hasMessage: true, uploadedAt: "2026-07-26 16:10", publishStatus: "已发布", syncStatus: "部分失败", successCount: 4, failedCount: 1, lastSyncAt: "2026-07-26 16:12", syncError: "4 个影像同步成功，1 段视频同步失败", firstViewedAt: "2026-07-26 18:20", likedMediaCount: 1, lastLikedAt: "2026-07-26 18:24", relationStatus: "有效" },
  { id: "BATCH-20260725-02", uploaderId: "RU-00028", elderlyId: "SG-E-000124", categoryNameSnapshot: "成长记录", contentType: "仅照片", photoCount: 2, videoCount: 0, hasMessage: true, uploadedAt: "2026-07-25 18:22", publishStatus: "已发布", syncStatus: "同步中", successCount: 1, failedCount: 0, lastSyncAt: "2026-07-25 18:23", syncError: "", firstViewedAt: "", likedMediaCount: 0, lastLikedAt: "", relationStatus: "有效" },
  { id: "BATCH-20260724-04", uploaderId: "RU-00027", elderlyId: "SG-E-000123", categoryNameSnapshot: "家庭日常", contentType: "照片和视频", photoCount: 4, videoCount: 2, hasMessage: false, uploadedAt: "2026-07-24 11:06", publishStatus: "已撤回", syncStatus: "已撤回", successCount: 6, failedCount: 0, lastSyncAt: "2026-07-26 15:20", syncError: "", firstViewedAt: "2026-07-24 11:30", likedMediaCount: 4, lastLikedAt: "2026-07-24 11:31", relationStatus: "有效", withdrawnBy: "赵亚男", withdrawnAt: "2026-07-26 15:20", withdrawalReason: "子女反馈该批次重复上传" },
  { id: "BATCH-20260723-02", uploaderId: "RU-00029", elderlyId: "SG-E-000124", categoryNameSnapshot: "节日团聚", contentType: "仅照片", photoCount: 4, videoCount: 0, hasMessage: true, uploadedAt: "2026-07-23 21:15", publishStatus: "已发布", syncStatus: "已同步", successCount: 4, failedCount: 0, lastSyncAt: "2026-07-23 21:17", syncError: "", firstViewedAt: "2026-07-24 07:55", likedMediaCount: 0, lastLikedAt: "", relationStatus: "有效" },
  { id: "BATCH-20260722-01", uploaderId: "RU-00031", elderlyId: "SG-E-000128", categoryNameSnapshot: "旅行时光", contentType: "仅照片", photoCount: 3, videoCount: 0, hasMessage: true, uploadedAt: "2026-07-22 10:08", publishStatus: "发布失败", syncStatus: "未入队", successCount: 0, failedCount: 3, lastSyncAt: "—", syncError: "上传批次未完成，没有进入老人端同步队列", firstViewedAt: "", likedMediaCount: 0, lastLikedAt: "", relationStatus: "有效" },
];

const recommendationTypes = [
  { key: "announcement", label: "社区公告" },
  { key: "life_info", label: "生活资讯" },
  { key: "alert", label: "警惕事项" },
  { key: "activity", label: "社区活动" },
  { key: "third_party_entertainment", label: "第三方娱乐" },
];

const recommendationTypeByCommunityContent = {
  "社区公告": "announcement",
  "生活资讯": "life_info",
  "警惕事项": "alert",
};

function normalizeRecommendationSourceDateTime(value, endOfDay = false) {
  if (!value) return endOfDay ? "2099-12-31T23:59" : recommendationMockNow;
  const normalized = String(value).replace(" ", "T");
  if (normalized.includes("T")) return normalized.slice(0, 16);
  return `${normalized.slice(0, 10)}T${endOfDay ? "23:59" : "00:00"}`;
}

const recommendationMockNow = "2026-08-21T10:00";

const initialRecommendationStrategies = [
  { id: "REC-001", projectId: "PRJ-001", name: "明早一起练太极", type: "activity", sourceId: "ACT-001", sourceName: "乐龄太极体验课", sourceUpdatedAt: "2026-08-20 10:30", startsAt: "2026-08-19T08:00", endsAt: "2026-08-22T18:00", enabled: true, displayOrder: 1, durationSeconds: 18, afterView: "continue", createdAt: "2026-08-18T17:30" },
  { id: "REC-002", projectId: "PRJ-001", name: "雨天居家防滑提醒", type: "life_info", sourceId: "SAF-002", sourceName: "雨季居家防滑注意事项", sourceUpdatedAt: "2026-08-21 09:00", startsAt: "2026-08-18T08:00", endsAt: "2026-08-31T23:59", enabled: true, displayOrder: 2, durationSeconds: 20, afterView: "exit", createdAt: "2026-08-19T09:20" },
  { id: "REC-003", projectId: "PRJ-001", name: "周三清洁安排提醒", type: "announcement", sourceId: "SAF-005", sourceName: "周三公共区域清洁安排", sourceUpdatedAt: "2026-08-23 16:30", startsAt: "2026-08-24T08:00", endsAt: "2026-08-27T18:00", enabled: true, displayOrder: 2, durationSeconds: 25, afterView: "continue", createdAt: "2026-08-23T16:30" },
  { id: "REC-004", projectId: "PRJ-002", name: "大巴窑防诈骗分享会", type: "activity", sourceId: "ACT-002", sourceName: "大巴窑防诈骗分享会", sourceUpdatedAt: "2026-08-20 15:20", startsAt: "2026-08-22T09:00", endsAt: "2026-08-24T19:00", enabled: true, displayOrder: 3, durationSeconds: 18, afterView: "exit", createdAt: "2026-08-18T11:00" },
  { id: "REC-005", projectId: "PRJ-001", name: "银行客服诈骗核验", type: "alert", sourceId: "SAF-001", sourceName: "警惕冒充银行客服诈骗", sourceUpdatedAt: "2026-08-20 08:00", startsAt: "2026-08-01T08:00", endsAt: "2026-08-18T23:59", enabled: true, displayOrder: 4, durationSeconds: 22, afterView: "continue", createdAt: "2026-08-01T10:15" },
  { id: "REC-006", projectId: "PRJ-001", name: "防骗提醒暂停投放", type: "alert", sourceId: "SAF-001", sourceName: "警惕冒充银行客服诈骗", sourceUpdatedAt: "2026-08-20 08:00", startsAt: "2026-08-10T08:00", endsAt: "2026-08-31T23:59", enabled: false, displayOrder: 5, durationSeconds: 30, afterView: "continue", createdAt: "2026-08-17T16:00" },
  { id: "REC-007", projectId: "PRJ-001", name: "雨季防滑日常提醒", type: "life_info", sourceId: "SAF-002", sourceName: "雨季居家防滑注意事项", sourceUpdatedAt: "2026-08-21 09:00", startsAt: "2026-08-19T08:00", endsAt: "2026-08-31T23:59", enabled: true, displayOrder: 6, durationSeconds: 30, afterView: "continue", createdAt: "2026-08-19T10:00" },
  { id: "REC-008", projectId: "PRJ-001", name: "社区防骗小课堂", type: "alert", sourceId: "SAF-001", sourceName: "警惕冒充银行客服诈骗", sourceUpdatedAt: "2026-08-20 08:00", startsAt: "2026-08-19T08:00", endsAt: "2026-08-31T23:59", enabled: true, displayOrder: 7, durationSeconds: 20, afterView: "continue", createdAt: "2026-08-19T12:00" },
  { id: "REC-009", projectId: "PRJ-001", name: "周末防诈骗提醒", type: "alert", sourceId: "SAF-001", sourceName: "警惕冒充银行客服诈骗", sourceUpdatedAt: "2026-08-20 08:00", startsAt: "2026-08-23T09:00", endsAt: "2026-08-30T18:00", enabled: true, displayOrder: 3, durationSeconds: 20, afterView: "exit", createdAt: "2026-08-20T14:30" },
  { id: "REC-010", projectId: "PRJ-001", name: "Spotify", type: "third_party_entertainment", sourceId: "ENT-002", sourceName: "Spotify", sourceUpdatedAt: "2026-10-23 10:00", thirdPartyUrl: "https://open.spotify.com/", startsAt: "2026-08-20T08:00", endsAt: "2026-08-31T23:59", enabled: true, displayOrder: 3, durationSeconds: 25, afterView: "continue", createdAt: "2026-08-20T16:20" },
];

function getRecommendationAvailability(item, now = recommendationMockNow) {
  if (item.sourceUnavailable) return "来源不可用";
  if (!item.enabled) return "已停用";
  if (item.startsAt > now) return "未生效";
  if (item.endsAt < now) return "已过期";
  return "可展示";
}

function sortRecommendations(items) {
  return [...items].sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder)
    || String(a.createdAt).localeCompare(String(b.createdAt)));
}

function isRecommendationScheduledForDate(item, date) {
  return !item.sourceUnavailable && item.enabled && item.startsAt.slice(0, 10) <= date && item.endsAt.slice(0, 10) >= date;
}

function getRecommendationDayItems(items, date) {
  return sortRecommendations(items.filter((item) => isRecommendationScheduledForDate(item, date)));
}

function formatRecommendationDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildRecommendationCalendar(year, month) {
  const days = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, index) => formatRecommendationDate(year, month, index + 1))];
}

function buildRecommendationWeek(date) {
  const anchor = new Date(`${date}T12:00:00`);
  const offset = (anchor.getDay() + 6) % 7;
  anchor.setDate(anchor.getDate() - offset);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(anchor);
    day.setDate(anchor.getDate() + index);
    return formatRecommendationDate(day.getFullYear(), day.getMonth(), day.getDate());
  });
}

function formatRecommendationWeekRange(days) {
  const first = days[0];
  const last = days[days.length - 1];
  const firstYear = Number(first.slice(0, 4));
  const lastYear = Number(last.slice(0, 4));
  const firstLabel = `${firstYear} 年 ${Number(first.slice(5, 7))} 月 ${Number(first.slice(8, 10))} 日`;
  const lastLabel = firstYear === lastYear
    ? `${Number(last.slice(5, 7))} 月 ${Number(last.slice(8, 10))} 日`
    : `${lastYear} 年 ${Number(last.slice(5, 7))} 月 ${Number(last.slice(8, 10))} 日`;
  return `${firstLabel} – ${lastLabel}`;
}

const genericRows = {
  safety: [
    ["警惕冒充银行客服诈骗", "诈骗提醒", "全部老人", "已发布", "92%", "2026-07-15 16:20"],
    ["雨季居家防滑注意事项", "家居安全", "红山社区", "已发布", "78%", "2026-07-14 09:10"],
    ["社区维修工程通知", "社区公告", "大巴窑关怀中心", "草稿", "—", "2026-07-16 11:05"],
    ["陌生人上门服务核验指南", "生活安全", "全部老人", "已撤回", "88%", "2026-07-08 13:40"],
  ],
  activities: initialCommunityActivities.map((activity) => [activity.title, activity.category, activity.startAt.replace("T", " "), activity.location, getCommunityActivityStatus(activity)]),
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

function ExpandableTagList({ items, limit = 3, className = "" }) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, limit);
  const remainingCount = Math.max(0, items.length - limit);
  return <div className={`multi-value-tag-list ${className}`.trim()}>
    {visibleItems.map((item) => <span key={item.code}><b>{item.text}</b><code>{item.code}</code></span>)}
    {remainingCount > 0 && <button type="button" className="multi-value-tag-toggle" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>{expanded ? "收起" : `+${remainingCount} 展开`}</button>}
  </div>;
}

function TabletOnlineStatusTag({ children }) {
  return <span className={`status-tag ${children === "在线" ? "success" : "neutral"}`}>{children}</span>;
}

const overviewAttentionMock = [
  { id: "clue-001", type: "在线协助", elderly: "陈美玲", description: "在线协助正在处理中", source: "在线协助", generatedAt: "2026-07-28 09:42", status: "处理中", handler: "赵亚男", callStatus: "呼叫已接通，社区人员已介入", notificationStatus: "子女 2 人已送达，1 人通知失败", page: "emergencyHelp" },
  { id: "clue-002", type: "在线协助", elderly: "王德昌", description: "在线协助已接通，等待运营确认", source: "在线协助", generatedAt: "2026-07-28 09:26", status: "待确认", handler: "赵亚男", callStatus: "呼叫中心已接听，老人情况稳定", notificationStatus: "子女 1 人已送达", page: "emergencyHelp" },
  { id: "clue-003", type: "房间传感器离线", elderly: "陈美玲", description: "卧室活动传感器离线", source: "房间活动传感器", generatedAt: "2026-07-28 09:18", status: "离线", deviceName: "卧室活动传感器", deviceCode: "SN-A20-88932", validationStatus: "已离线 24 分钟", page: "sensorDevices" },
  { id: "clue-004", type: "房间传感器离线", elderly: "王德昌", description: "玄关活动传感器离线", source: "房间活动传感器", generatedAt: "2026-07-28 08:52", status: "离线", deviceName: "玄关活动传感器", deviceCode: "SN-A22-93012", validationStatus: "已离线 50 分钟", page: "sensorDevices" },
];

const inactivityTodoTemplates = [
  { name: "陈美玲", hours: 3, room: "客厅", lastAt: "2026-07-28 06:38", generatedAt: "2026-07-28 09:38" },
  { name: "王德昌", hours: 4, room: "卧室", lastAt: "2026-07-28 05:12", generatedAt: "2026-07-28 09:12" },
];

function buildInactivityTodoItems(records) {
  const uniqueRecords = [...new Map(records.map((record) => [record.name, record])).values()];
  return inactivityTodoTemplates.map((template, index) => {
    const record = uniqueRecords[index];
    const elderly = record?.name || template.name;
    return {
      id: `inactivity-${record?.id || index + 1}`,
      type: "无活动",
      elderly,
      description: `连续 ${template.hours} 小时无活动`,
      clue: `最后活动：${template.room} · ${template.lastAt}`,
      inactiveHours: template.hours,
      lastActivityRoom: template.room,
      lastActivityAt: template.lastAt,
      matchedRule: `连续 ${template.hours} 小时无活动`,
      source: "无活动提醒",
      generatedAt: template.generatedAt,
      status: "待处理",
      page: "elderlyDataDashboard",
    };
  });
}

const overviewTrendMock = {
  reminder: { label: "提醒完成率", unit: "%", values: [82, 86, null, 75, 88, 91, 67] },
  device: { label: "设备在线率", unit: "%", values: [80, 80, 100, 100, 80, 80, 80] },
  safety: { label: "社区内容阅读率", unit: "%", values: [65, 71, 74, null, 78, 82, 84] },
  service: { label: "已完成预约服务", unit: "单", values: [2, 3, null, 4, 1, 5, 3] },
};

const platformOverviewNow = new Date("2026-10-26T15:00:00+08:00").getTime();
const platformOverviewDate = "2026-10-26";
const platformProjectCreatedAt = Object.freeze({ "PRJ-001": "2026-06-18 09:42", "PRJ-002": "2026-06-20 14:18", "PRJ-003": "2026-06-22 18:06", "PRJ-004": "2026-07-01 10:20" });
const platformDeviceRecordedAt = Object.freeze({ "TAB-SG-20260031": "2026-07-02 09:30", "TAB-SG-20260030": "2026-06-28 14:20", "TAB-SG-20260029": "2026-06-25 08:50", "TAB-SG-20260032": "2026-10-24 09:10", "TAB-SG-20260033": "2026-10-25 08:40" });
const platformOtaAttentionDemo = Object.freeze({
  executions: [
    { packageId: "OTA-ROM-001", taskId: "OTA-TASK-001", deviceId: "TAB-SG-20260030", targetVersion: "v1.6.0", status: "失败", createdAt: "2026-10-26 10:12", lastReportAt: "2026-10-26 10:12", message: "下载校验失败，可重新发起" },
    { packageId: "OTA-ROM-002", taskId: "OTA-TASK-002", deviceId: "TAB-SG-20260031", targetVersion: "v1.6.0", status: "安装中", progress: "62%", createdAt: "2026-10-26 09:35", lastReportAt: "2026-10-26 13:48", message: "安装进度已超过 30 分钟未更新" },
  ],
});
const platformIssueMeta = Object.freeze({
  "平板离线": { severity: "中", severityRank: 2, reason: "已激活平板连续离线超过 30 分钟", destination: "devices", actionLabel: "前往平板设备", columns: [["projectName", "项目 / 社区"], ["deviceId", "设备编号"], ["lastOnline", "最后在线时间"], ["offlineDuration", "离线时长"]] },
  "升级失败": { severity: "高", severityRank: 3, reason: "设备最近一次升级执行失败，需要重新处理", destination: "ota", actionLabel: "前往 OTA 任务", columns: [["deviceId", "设备编号"], ["targetVersion", "目标版本"], ["taskId", "任务编号"], ["occurredAt", "失败时间"], ["failureReason", "失败原因"]] },
  "升级停滞": { severity: "高", severityRank: 3, reason: "设备升级中连续 30 分钟没有进度或心跳上报", destination: "ota", actionLabel: "前往 OTA 任务", columns: [["deviceId", "设备编号"], ["progress", "当前进度"], ["lastReportAt", "最后上报时间"], ["taskId", "任务编号"]] },
  "设备待激活超时": { severity: "中", severityRank: 2, reason: "平板录入超过 24 小时后仍未完成激活", destination: "devices", actionLabel: "前往平板设备", columns: [["deviceId", "设备编号"], ["recordedAt", "录入时间"], ["projectName", "项目 / 社区"], ["elapsed", "等待时长"]] },
  "项目信息缺失": { severity: "低", severityRank: 1, reason: "项目联系人姓名或联系电话尚未填写完整", destination: "editProject", actionLabel: "编辑项目", columns: [["projectName", "项目 / 社区"], ["missingFields", "缺失字段"]] },
  "老人档案未配置": { severity: "低", severityRank: 1, reason: "项目创建超过 24 小时后仍未配置服务老人", destination: "project", actionLabel: "查看项目", columns: [["projectName", "项目 / 社区"], ["createdAt", "项目创建时间"], ["elapsed", "已创建时长"], ["elderlyCount", "服务老人"]] },
});

function parsePlatformDate(value) {
  if (!value || value === "立即生效") return Number.NaN;
  return new Date(String(value).replace(" ", "T") + (String(value).includes("T") ? "" : "+08:00")).getTime();
}

function platformElapsedMinutes(value) {
  const timestamp = parsePlatformDate(value);
  return Number.isFinite(timestamp) ? Math.max(0, Math.floor((platformOverviewNow - timestamp) / 60000)) : 0;
}

function platformDurationLabel(minutes) {
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)} 天 ${Math.floor((minutes % 1440) / 60)} 小时`;
  if (minutes >= 60) return `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分`;
  return `${minutes} 分钟`;
}

function platformOfflineMinutes(lastOnline) {
  const value = String(lastOnline || "");
  const day = value.match(/(\d+)\s*天/);
  const hour = value.match(/(\d+)\s*小时/);
  const minute = value.match(/(\d+)\s*分钟/);
  if (day) return Number(day[1]) * 1440;
  if (hour) return Number(hour[1]) * 60;
  if (minute) return Number(minute[1]);
  return 0;
}

function PlatformProjectDetailDrawer({ row, onClose }) {
  return <AdminDrawer title="项目详情" className="platform-project-detail-drawer" onClose={onClose} footer={<button className="secondary-button" onClick={onClose}>关闭</button>}>
    <section className="detail-section"><h3>基本信息</h3><div className="info-grid"><div><span>项目名称</span><b>{row.name}</b></div><div><span>项目状态</span><b><StatusTag>{row.status}</StatusTag></b></div><div><span>国家 / 地区</span><b>{row.country || "待补充"}</b></div><div><span>时区</span><b>{row.timezone || "待补充"}</b></div><div className="full"><span>项目位置</span><b>{row.address || "地址待补充"}</b></div></div></section>
    <section className="detail-section"><h3>联系信息</h3><div className="info-grid"><div><span>项目联系人</span><b>{row.contact || "待补充"}</b></div><div><span>联系电话</span><b>{row.phone || "待补充"}</b></div></div></section>
    <section className="detail-section"><h3>服务与终端概况</h3><div className="info-grid"><div><span>服务老人</span><b>{row.elderlyCount} 位</b></div><div><span>已录入平板</span><b>{row.tabletCount} 台</b></div><div><span>在线平板</span><b>{row.onlineTabletCount} 台</b></div><div><span>平板运行状态</span><b>{row.tabletCount ? `${row.onlineTabletCount} / ${row.tabletCount} 在线` : "未配置"}</b></div></div></section>
    <section className="detail-section"><h3>运行概况</h3><div className="info-grid"><div><span>待处理问题类型</span><b>{row.pendingCount ? `${row.pendingCount} 类` : "正常"}</b></div></div></section>
  </AdminDrawer>;
}

function PlatformIssueDetailDrawer({ issue, onClose, onHandle }) {
  return <AdminDrawer title={`${issue.type}明细`} className="platform-issue-detail-drawer" onClose={onClose} footer={<><button className="secondary-button" onClick={onClose}>关闭</button><button className="primary-button" onClick={() => onHandle(issue)}>{issue.actionLabel}</button></>}>
    <section className="detail-section"><h3>影响范围</h3><div className="info-grid"><div><span>问题类型</span><b>{issue.type}</b></div><div><span>优先级</span><b>{issue.severity}</b></div><div><span>影响项目</span><b>{issue.projectCount} 个</b></div>{issue.deviceCount > 0 && <div><span>影响设备</span><b>{issue.deviceCount} 台</b></div>}<div className="full"><span>触发原因</span><b>{issue.reason}</b></div><div className="full"><span>项目范围</span><b>{issue.projectNames.join("、")}</b></div></div></section>
    <section className="detail-section"><div className="detail-section-title"><h3>问题明细</h3><b>{issue.details.length} 条</b></div><div className="table-scroll"><table className="platform-issue-detail-table"><thead><tr>{issue.columns.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>{issue.details.map((detail) => <tr key={detail.id}>{issue.columns.map(([field, label]) => <td key={label}>{field === "deviceId" ? formatDisplayId(detail[field]) : detail[field] ?? "—"}</td>)}</tr>)}</tbody></table></div></section>
  </AdminDrawer>;
}

function PlatformOverview({ projects, elderlyRecords, tablets, members, onSaveProject, onOpenPlatformDevices, onOpenPlatformOta }) {
  const [detailProjectId, setDetailProjectId] = useState("");
  const [detailIssueType, setDetailIssueType] = useState("");
  const [editingProjectId, setEditingProjectId] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const baseRows = projects.map((project) => {
    const communityElderly = elderlyRecords.filter((record) => record.community === project.name);
    const projectTablets = tablets.filter((device) => device.projectId === project.id);
    const onlineTabletCount = projectTablets.filter((device) => device.onlineStatus === "在线").length;
    return { ...project, elderlyCount: communityElderly.length, tabletCount: projectTablets.length, onlineTabletCount };
  });
  const storedOtaPackages = (() => {
    try {
      const otaPackages = JSON.parse(window.localStorage.getItem(tabletOtaStorageKey) || "[]");
      return Array.isArray(otaPackages) ? otaPackages : [];
    } catch {
      return [];
    }
  })();
  const storedOtaExecutions = storedOtaPackages.flatMap((otaPackage) => (otaPackage.tasks || []).flatMap((task) => (task.results || []).map((result) => ({
    ...result,
    packageId: otaPackage.id,
    taskId: task.id,
    targetVersion: otaPackage.targetVersion,
    strategy: otaPackage.strategy,
    packageType: otaPackage.packageType,
    createdAt: task.createdAt,
    lastReportAt: result.lastReportAt || task.updatedAt || task.createdAt,
  }))));
  const otaExecutions = [...storedOtaExecutions, ...platformOtaAttentionDemo.executions.filter((demo) => !storedOtaExecutions.some((item) => item.deviceId === demo.deviceId && item.status === demo.status))];
  const latestOtaExecutions = tablets.map((device) => otaExecutions.filter((item) => item.deviceId === device.id).sort((left, right) => String(right.lastReportAt || right.createdAt || "").localeCompare(String(left.lastReportAt || left.createdAt || "")))[0]).filter(Boolean);
  const issueDetails = [
    ...tablets.filter((device) => device.activationStatus === "已激活" && device.onlineStatus !== "在线" && platformOfflineMinutes(device.lastOnline) >= 30).map((device) => {
      const project = projects.find((item) => item.id === device.projectId);
      const offlineMinutes = platformOfflineMinutes(device.lastOnline);
      return { id: `offline-${device.id}`, type: "平板离线", projectId: device.projectId, projectName: project?.name || "未知项目", deviceId: device.id, lastOnline: device.lastOnline, offlineDuration: platformDurationLabel(offlineMinutes), offlineMinutes, occurredAt: new Date(platformOverviewNow - offlineMinutes * 60000).toISOString() };
    }),
    ...latestOtaExecutions.filter((execution) => execution.status === "失败").map((execution) => {
      const device = tablets.find((item) => item.id === execution.deviceId);
      const project = projects.find((item) => item.id === device?.projectId);
      return { id: `ota-failed-${execution.deviceId}`, type: "升级失败", projectId: device?.projectId || "", projectName: project?.name || "未归属项目", deviceId: execution.deviceId, targetVersion: execution.targetVersion || "—", taskId: execution.taskId || "—", occurredAt: execution.lastReportAt || execution.createdAt || "—", failureReason: execution.message || "升级失败，请重新发起" };
    }),
    ...latestOtaExecutions.filter((execution) => /下载中|安装中|执行中/.test(execution.status || "") && platformElapsedMinutes(execution.lastReportAt || execution.createdAt) >= 30).map((execution) => {
      const device = tablets.find((item) => item.id === execution.deviceId);
      const project = projects.find((item) => item.id === device?.projectId);
      const progress = execution.progress || (execution.status === "安装中" ? "72%" : execution.status === "下载中" ? "35%" : "0%");
      return { id: `ota-stalled-${execution.deviceId}`, type: "升级停滞", projectId: device?.projectId || "", projectName: project?.name || "未归属项目", deviceId: execution.deviceId, progress, lastReportAt: execution.lastReportAt || execution.createdAt || "—", taskId: execution.taskId || "—", occurredAt: execution.lastReportAt || execution.createdAt || "" };
    }),
    ...tablets.filter((device) => device.activationStatus === "待激活" && platformElapsedMinutes(device.recordedAt || platformDeviceRecordedAt[device.id]) >= 1440).map((device) => {
      const project = projects.find((item) => item.id === device.projectId);
      const recordedAt = device.recordedAt || platformDeviceRecordedAt[device.id];
      return { id: `activation-timeout-${device.id}`, type: "设备待激活超时", projectId: device.projectId, projectName: project?.name || "未归属项目", deviceId: device.id, recordedAt, elapsed: platformDurationLabel(platformElapsedMinutes(recordedAt)), occurredAt: recordedAt };
    }),
    ...projects.filter((project) => project.status === "启用" && (!project.contact?.trim() || !project.phone?.trim())).map((project) => {
      const missingFields = [["contact", "联系人姓名"], ["phone", "联系电话"]].filter(([field]) => !project[field]?.trim()).map(([, label]) => label);
      return { id: `project-info-${project.id}`, type: "项目信息缺失", projectId: project.id, projectName: project.name, deviceId: "", missingFields: missingFields.join("、"), occurredAt: platformProjectCreatedAt[project.id] };
    }),
    ...baseRows.filter((project) => project.status === "启用" && project.elderlyCount === 0 && platformElapsedMinutes(project.createdAt || platformProjectCreatedAt[project.id]) >= 1440).map((project) => {
      const createdAt = project.createdAt || platformProjectCreatedAt[project.id];
      return { id: `no-elderly-${project.id}`, type: "老人档案未配置", projectId: project.id, projectName: project.name, deviceId: "", createdAt, elapsed: platformDurationLabel(platformElapsedMinutes(createdAt)), elderlyCount: "0 位", occurredAt: createdAt };
    }),
  ];
  const issueGroups = Object.values(issueDetails.reduce((groups, detail) => {
    const current = groups[detail.type] || { type: detail.type, details: [], ...platformIssueMeta[detail.type] };
    current.details.push(detail);
    groups[detail.type] = current;
    return groups;
  }, {})).map((group) => {
    const projectNames = [...new Set(group.details.map((detail) => detail.projectName))];
    const deviceIds = [...new Set(group.details.map((detail) => detail.deviceId).filter(Boolean))];
    const offlineHigh = group.type === "平板离线" && (group.details.length >= 3 || group.details.some((detail) => detail.offlineMinutes >= 120));
    const occurredTimes = group.details.map((detail) => parsePlatformDate(detail.occurredAt)).filter(Number.isFinite);
    const latestAt = occurredTimes.length ? Math.max(...occurredTimes) : 0;
    return { ...group, ...(offlineHigh ? { severity: "高", severityRank: 3 } : {}), projectNames, projectCount: projectNames.length, deviceCount: deviceIds.length, impactCount: deviceIds.length || projectNames.length, latestAt };
  }).sort((a, b) => b.severityRank - a.severityRank || b.latestAt - a.latestAt);
  const rows = baseRows.map((row) => ({ ...row, pendingCount: new Set(issueDetails.filter((issue) => issue.projectId === row.id).map((issue) => issue.type)).size }));
  const allTablets = rows.reduce((sum, row) => sum + row.tabletCount, 0);
  const onlineTablets = rows.reduce((sum, row) => sum + row.onlineTabletCount, 0);
  const todayUsedTablets = tablets.filter((device) => (device.usageRecords || []).some((record) => record.valid !== false && String(record.occurredAt || "").startsWith(platformOverviewDate))).length;
  const detailRow = rows.find((row) => row.id === detailProjectId);
  const detailIssue = issueGroups.find((issue) => issue.type === detailIssueType);
  const editingProject = projects.find((project) => project.id === editingProjectId);
  const handleIssue = (issue) => {
    const projectId = issue.details[0]?.projectId || "";
    setDetailIssueType("");
    if (issue.destination === "devices") return onOpenPlatformDevices();
    if (issue.destination === "ota") return onOpenPlatformOta();
    if (issue.destination === "editProject") return setEditingProjectId(projectId);
    setDetailProjectId(projectId);
  };
  return <>
    <div className="page-heading platform-overview-heading"><div><h1>平台总览</h1><p>查看各项目运行状态、服务规模与待处理问题</p></div><button className="primary-button" onClick={() => setCreatingProject(true)}><Plus size={16}/>新建项目</button></div>
    <div className="platform-metric-grid platform-overview-metrics">
      <div className="platform-metric-card"><span>项目总数</span><b>{projects.length}<small> 个</small></b><p>平台已建立项目</p></div>
      <div className="platform-metric-card"><span>运营中项目</span><b>{rows.filter((row) => row.status === "启用").length}<small> 个</small></b><p>项目状态为启用</p></div>
      <div className="platform-metric-card"><span>服务老人</span><b>{rows.reduce((sum, row) => sum + row.elderlyCount, 0)}<small> 位</small></b><p>全部项目老人档案</p></div>
      <div className="platform-metric-card"><span>平板总数</span><b>{allTablets}<small> 台</small></b><p>全部已录入平板</p></div>
      <div className="platform-metric-card"><span>今日使用</span><b>{todayUsedTablets}<small> 台</small></b><p>{todayUsedTablets} / {allTablets} 台今日使用</p></div>
      <div className="platform-metric-card"><span>平板在线率</span><b>{allTablets ? Math.round((onlineTablets / allTablets) * 100) : "—"}<small>{allTablets ? "%" : ""}</small></b><p>{allTablets ? `${onlineTablets} 台在线 / ${allTablets} 台已录入` : "暂无已录入平板"}</p></div>
    </div>
    <section className="panel platform-attention-panel">
      <div className="panel-title"><div><h3>待处理事项</h3><p>按优先级和产生时间排序，聚合展示同类运行问题</p></div><span>{issueGroups.length} 类</span></div>
      <div className="platform-action-scroll">
        <div className="platform-action-list" role="table" aria-label="待处理事项列表">
          <div className="platform-action-header" role="row"><span role="columnheader">优先级</span><span role="columnheader">问题</span><span role="columnheader">影响对象</span><span role="columnheader">社区范围</span><span role="columnheader">操作</span></div>
          {issueGroups.map((issue) => {
            const scopeLabel = issue.projectNames.join("、") || "未归属项目";
            const openIssue = () => setDetailIssueType(issue.type);
            return <div className={`platform-action-row severity-${issue.severityRank}`} role="row" tabIndex={0} key={issue.type} onClick={openIssue} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openIssue(); } }}>
              <span className="platform-issue-priority" role="cell">{issue.severity}优先级</span>
              <span className="platform-issue-copy" role="cell"><b title={issue.type}>{issue.type}</b><small title={issue.reason}>{issue.reason}</small></span>
              <span className="platform-issue-impact" role="cell"><b>{issue.deviceCount || issue.projectCount}</b> {issue.deviceCount ? "台设备" : "个项目"}{issue.deviceCount ? <small>{issue.projectCount} 个项目</small> : null}</span>
              <span className="platform-issue-scope" role="cell" title={scopeLabel}>{scopeLabel}</span>
              <button className="table-action" onClick={(event) => { event.stopPropagation(); openIssue(); }}>查看明细</button>
            </div>;
          })}
          {!issueGroups.length && <div className="platform-action-empty">当前没有待处理事项</div>}
        </div>
      </div>
    </section>
    <section className="panel management-panel platform-community-panel"><div className="panel-title"><div><h3>项目运行概况</h3><p>集中查看项目状态、联系信息与终端运行情况</p></div></div><div className="table-scroll"><table className="platform-community-table"><thead><tr><th>项目 / 位置</th><th>项目状态</th><th>联系信息</th><th>服务老人</th><th>平板在线</th><th>待处理</th><th className="sticky-right">操作</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>
      <td><div className="project-name-cell"><span><Building2 size={17}/></span><div><b>{row.name}</b><small>{row.address || "地址待补充"}</small></div></div></td><td><StatusTag>{row.status}</StatusTag></td><td><div className="stacked-cell"><b>{row.contact || "待补充"}</b><small>{row.phone || "电话待补充"}</small></div></td><td>{row.elderlyCount} 位</td><td>{row.tabletCount ? `${row.onlineTabletCount} / ${row.tabletCount} 台` : <span className="muted-value">未配置</span>}</td><td><StatusTag>{row.pendingCount ? `${row.pendingCount} 类` : "正常"}</StatusTag></td><td className="sticky-right platform-overview-actions"><button className="table-action" onClick={() => setDetailProjectId(row.id)}>查看项目</button></td>
    </tr>)}</tbody></table></div><div className="pagination"><span>当前展示 {rows.length} 个项目</span></div></section>
    {detailRow && <PlatformProjectDetailDrawer row={detailRow} onClose={() => setDetailProjectId("")}/>} 
    {detailIssue && <PlatformIssueDetailDrawer issue={detailIssue} onClose={() => setDetailIssueType("")} onHandle={handleIssue}/>} 
    {editingProject && <ProjectDrawer project={editingProject} adminMember={members.find((member) => member.projectId === editingProject.id && member.roleId?.endsWith("-ADMIN"))} allMembers={members} onClose={() => setEditingProjectId("")} onSave={(project, adminMember) => { onSaveProject(project, adminMember); setEditingProjectId(""); }}/>} 
    {creatingProject && <ProjectDrawer allMembers={members} onClose={() => setCreatingProject(false)} onSave={(project, adminMember) => { onSaveProject(project, adminMember); setCreatingProject(false); }}/>} 
  </>;
}

function OverviewAttentionDrawer({ item, onClose, onResolve }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const isNotificationFailure = item.type === "通知失败";
  const actionLabel = isNotificationFailure ? "重试通知" : item.source === "无活动提醒" ? "标记已关注" : item.source === "房间活动传感器" ? "确认处理" : item.source === "提醒事项" ? "标记已关注" : "确认已处理";
  const submit = () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    window.setTimeout(() => {
      if (isNotificationFailure && attempts === 0) {
        setAttempts(1);
        setSubmitting(false);
        setError("通知重试失败，联系人通道暂时不可用，请稍后再试。");
        return;
      }
      onResolve(item, isNotificationFailure ? "通知重试成功" : `${actionLabel}成功`);
    }, 450);
  };
  const commonFields = [
    ["事项类型", item.type], ["老人", item.elderly], ["问题摘要", item.description], ["来源模块", item.source],
    ["发生时间", item.generatedAt], ["当前状态", item.status], ["处理人", item.handler], ["处理结果", item.result],
  ].filter(([, value]) => value);
  return <AdminDrawer title="待处理事项详情" ariaLabel={`${item.elderly}${item.description}`} className="overview-attention-drawer" onClose={onClose} footer={<><button className="secondary-button" disabled={submitting} onClick={onClose}>关闭</button><button className="primary-button" disabled={submitting} onClick={submit}>{submitting ? "处理中…" : actionLabel}</button></>}>
    <section className="detail-section"><h3>事项信息</h3><div className="info-grid">{commonFields.map(([label, value]) => <div className={label === "问题摘要" ? "full" : ""} key={label}><span>{label}</span><b>{value}</b></div>)}</div></section>
    {item.source === "在线协助" && <section className="detail-section"><h3>在线协助处理</h3><div className="info-grid"><div className="full"><span>呼叫处理</span><b>{item.callStatus}</b></div><div className="full"><span>子女通知</span><b>{item.notificationStatus}</b></div></div></section>}
    {item.source === "无活动提醒" && <section className="detail-section"><h3>无活动判断</h3><div className="info-grid"><div><span>持续时长</span><b>{item.inactiveHours} 小时</b></div><div><span>最后活动位置</span><b>{item.lastActivityRoom}</b></div><div><span>最后活动时间</span><b>{item.lastActivityAt}</b></div><div><span>命中规则</span><b>{item.matchedRule}</b></div></div></section>}
    {item.source === "房间活动传感器" && <section className="detail-section"><h3>房间传感器离线</h3><div className="info-grid"><div><span>设备</span><b>{item.deviceName}</b></div><div><span>设备编号</span><b>{item.deviceCode}</b></div><div className="full"><span>离线状态</span><b>{item.validationStatus}</b></div></div></section>}
    {error && <div className="overview-attention-error" role="alert"><AlertTriangle size={16}/><span>{error}</span></div>}
  </AdminDrawer>;
}

function Overview({ onNavigate, onQuickAction, quickPermissions, scenario, resetSignal, scope, records, tablets, sensors, reminders }) {
  const [updatedAt, setUpdatedAt] = useState("2026-07-31 15:40:00");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState("");
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [selectedAttention, setSelectedAttention] = useState(null);
  const [resolvedAttentionIds, setResolvedAttentionIds] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem("u2g-overview-resolved-attention-v1") || "[]"); } catch { return []; }
  });
  const [attentionNotice, setAttentionNotice] = useState("");
  const overviewLifecycleKey = useRef(`${resetSignal}:${scenario}`);
  useEffect(() => {
    setUpdatedAt("2026-07-31 15:40:00");
    setRefreshing(false);
    setRefreshNotice("");
    setQuickActionsOpen(false);
    setSelectedAttention(null);
    setAttentionNotice("");
    const nextLifecycleKey = `${resetSignal}:${scenario}`;
    if (overviewLifecycleKey.current !== nextLifecycleKey) {
      overviewLifecycleKey.current = nextLifecycleKey;
      setResolvedAttentionIds([]);
      window.localStorage.removeItem("u2g-overview-resolved-attention-v1");
    }
  }, [resetSignal, scenario]);
  const scopedNames = new Set(records.map((record) => record.name));
  const scopedAttentionItems = [...overviewAttentionMock.filter((item) => scopedNames.has(item.elderly)), ...buildInactivityTodoItems(records)]
    .filter((item) => item.type !== "通知失败")
    .filter((item) => !resolvedAttentionIds.includes(item.id))
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  const availableAttentionItems = scenario === "partial" ? scopedAttentionItems.filter((item) => item.source !== "提醒事项") : scopedAttentionItems;
  const attentionItems = scenario === "noAttention" ? [] : availableAttentionItems.slice(0, 6);
  const validDevices = [...tablets.filter((device) => device.boundElderlyId), ...sensors.filter((device) => device.installStatus === "已安装" && device.onlineStatus !== "停用")];
  const onlineDevices = validDevices.filter((device) => device.onlineStatus === "在线").length;
  const dueOccurrences = reminders.flatMap((reminder) => reminder.occurrences || []).filter((item) => item.status !== "未到时间");
  const completedOccurrences = dueOccurrences.filter((item) => item.status === "已完成").length;
  const metrics = [
    { label: "社区老人", value: String(records.length), unit: "位", hint: "当前社区老人档案数", icon: Users },
    { label: "待处理事项", value: String(scopedAttentionItems.length), unit: "条", hint: "按尚未完成的待办统计，不按老人去重", icon: ClipboardList },
    { label: "设备在线率", value: validDevices.length ? ((onlineDevices / validDevices.length) * 100).toFixed(1) : "—", unit: validDevices.length ? "%" : "", hint: validDevices.length ? `${onlineDevices} 台在线 ÷ ${validDevices.length} 台应在线有效设备` : "当前社区暂无应在线有效设备", icon: MonitorSmartphone },
    { label: "今日提醒完成率", value: dueOccurrences.length ? ((completedOccurrences / dueOccurrences.length) * 100).toFixed(1) : "—", unit: dueOccurrences.length ? "%" : "", hint: dueOccurrences.length ? `${completedOccurrences} 条已完成 ÷ ${dueOccurrences.length} 条已到执行时间` : "今日暂无已到执行时间提醒", icon: Bell },
  ];
  const quickActions = [
    { key: "elderly", label: "新增老人", icon: Users, allowed: quickPermissions.elderly },
    { key: "reminder", label: "配置老人提醒", icon: Bell, allowed: quickPermissions.reminder },
    { key: "announcement", label: "新增社区公告", icon: BookOpen, allowed: quickPermissions.announcement },
    { key: "activity", label: "发布社区活动", icon: CalendarDays, allowed: quickPermissions.activity },
  ].filter((item) => item.allowed);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshNotice("");
    window.setTimeout(() => {
      setRefreshing(false);
      if (["partial", "allFailed"].includes(scenario)) {
        setRefreshNotice("刷新未全部成功，已保留上次成功数据与更新时间");
        return;
      }
      setUpdatedAt("2026-07-31 15:45:00");
      setRefreshNotice("数据已刷新");
    }, 500);
  };
  const resolveAttention = (item, message) => {
    setResolvedAttentionIds((ids) => {
      const nextIds = ids.includes(item.id) ? ids : [...ids, item.id];
      window.localStorage.setItem("u2g-overview-resolved-attention-v1", JSON.stringify(nextIds));
      return nextIds;
    });
    setSelectedAttention(null);
    setAttentionNotice(`${item.elderly}的待办已更新：${message}`);
  };

  if (scenario === "noProject") {
    return (
      <>
        <div className="page-heading overview-heading overview-page-heading">
          <div><h1>运营概览</h1><p>当前账号没有可访问项目</p></div>
        </div>
        <section className="panel overview-empty-state">
          <Building2 size={34}/>
          <h3>当前账号无项目</h3>
          <p>请联系管理员分配项目和社区数据权限后再查看运营概览。</p>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="page-heading overview-heading overview-page-heading">
        <div>
          <h1>运营概览</h1>
          <div className="overview-time-meta">
            <span>项目当地日期：2026年7月31日 · 星期五</span>
            <span>IANA 时区：Asia/Singapore (UTC+8)</span>
            <span>最近更新：{scenario === "stale" ? "2026-07-30 09:10:00" : updatedAt}</span>
          </div>
        </div>
        <div className="overview-heading-actions">
          {quickActions.length > 0 && <div className="overview-quick-menu">
            <button type="button" className="secondary-button" aria-haspopup="menu" aria-expanded={quickActionsOpen} onClick={() => setQuickActionsOpen((open) => !open)}>快捷操作<ChevronDown size={15}/></button>
            {quickActionsOpen && <div className="overview-quick-popover" role="menu" aria-label="快捷操作">{quickActions.map(({ key, label, icon: Icon }) => <button type="button" role="menuitem" key={key} onClick={() => { setQuickActionsOpen(false); onQuickAction(key); }}><Icon size={16}/><span>{label}</span></button>)}</div>}
          </div>}
          <button className="secondary-button" onClick={handleRefresh} disabled={refreshing}><RefreshCw className={refreshing ? "spinning" : ""} size={15}/>{refreshing ? "刷新中" : "刷新数据"}</button>
        </div>
      </div>

      {scenario === "partial" && <div className="overview-state-banner warning"><AlertTriangle size={17}/><div><b>部分来源失败</b><span>提醒事项来源暂不可用，失败数据以“—”展示；其他正常模块继续显示。</span></div></div>}
      {scenario === "allFailed" && <div className="overview-state-banner danger"><AlertTriangle size={17}/><div><b>全部来源失败</b><span>当前无法获取运营数据，页面未将失败结果显示为 0，请稍后刷新重试。</span></div></div>}
      {scenario === "stale" && <div className="overview-state-banner warning"><FileClock size={17}/><div><b>数据过旧</b><span>数据最后更新于 2026-07-30 09:10:00，请刷新后再用于运营判断。</span></div></div>}
      {refreshNotice && <div className="overview-refresh-notice">{refreshNotice}</div>}

      <div className="metric-grid">
        {metrics.map(({ label, value, unit, hint, icon: Icon }) => (
          <div className="metric-card" key={label}>
            <div className="metric-icon"><Icon size={20} /></div>
            <div className="metric-card-copy"><div className="admin-metric-heading"><span>{label}</span><MetricHelp label={`${label}指标说明`} content={hint}/></div><strong>{value}{unit && <em>{unit}</em>}</strong></div>
          </div>
        ))}
      </div>

      <div className="overview-grid overview-attention-grid">
        <section className="panel attention-panel">
          <div className="panel-title"><div><h3>待处理事项</h3><p>按发生时间倒序，最多显示 6 条</p></div><div className="attention-heading-actions"><span className="attention-count">{scenario === "allFailed" ? "—" : scenario === "partial" ? `已获取 ${availableAttentionItems.length} 条` : `${scenario === "noAttention" ? 0 : scopedAttentionItems.length} 条`}</span>{scenario !== "allFailed" && scenario !== "noAttention" && availableAttentionItems.length > 6 && <button className="text-button" onClick={() => onNavigate({ page: "elderlyDataDashboard", filter: `${scope.name} · 无活动待处理` })}>查看全部 <ChevronRight size={15}/></button>}</div></div>
          {scenario === "allFailed"
            ? <div className="overview-module-failed"><AlertTriangle size={20}/><div><b>关注线索获取失败</b><span>请刷新后重试。</span></div></div>
            : attentionItems.length
              ? <div className="attention-list"><div className="attention-list-head" aria-hidden="true"><span>发生时间</span><span>事项类型</span><span>老人</span><span>事项内容 / 关键线索</span><span>状态</span><span>操作</span><span/></div>{attentionItems.map((item) => <button className="attention-row" key={item.id} onClick={() => setSelectedAttention(item)}>
                <time className="attention-time">{item.generatedAt}</time>
                <span className="attention-type" title={item.type}>{item.type}</span>
                <b className="attention-elderly" title={item.elderly}>{item.elderly}</b>
                <span className="attention-problem"><b title={item.description}>{item.description}</b>{item.clue && <small title={item.clue}>{item.clue}</small>}</span>
                <StatusTag>{item.status}</StatusTag>
                <span className="attention-detail">{item.source === "无活动提醒" ? "处理" : "详情"}</span>
                <ChevronRight size={16}/>
              </button>)}</div>
              : <div className="overview-module-empty"><ShieldCheck size={24}/><b>暂无待处理事项</b><span>当前没有尚未结束的关注线索。</span></div>}
        </section>
      </div>
      {selectedAttention && <OverviewAttentionDrawer item={selectedAttention} onClose={() => setSelectedAttention(null)} onResolve={resolveAttention}/>} 
      {attentionNotice && <AdminToast message={attentionNotice} onClose={() => setAttentionNotice("")}/>} 
    </>
  );
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

function ElderlyPage({ records, tabletDevices, activationRecords, onOpen }) {
  const initialFilters = { query: "", packageType: "all" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);

  const filteredRecords = useMemo(() => records.filter((record) => {
    const keyword = filters.query.trim().toLowerCase();
    const emergencyKeywords = getEmergencyContacts(record).flatMap((contact) => [contact.name, contact.phone, contact.relation]);
    const keywordMatched = !keyword || [
      record.name, record.phone, record.project, record.community,
      record.address, ...emergencyKeywords,
    ].join(" ").toLowerCase().includes(keyword);
    const packageMatched = filters.packageType === "all" || (record.packageType || "unconfigured") === filters.packageType;
    return keywordMatched && packageMatched;
  }), [records, filters]);

  return (
    <>
      <div className="page-heading">
        <div><h1>老人档案</h1><p>维护当前社区老人的基础资料和服务关系，进入详情页定义家庭空间并管理设备</p></div>
        <button className="primary-button" onClick={() => onOpen("create")}><Plus size={16}/>新增老人</button>
      </div>
      <section className="panel management-panel elderly-management">
        <div className="filters elderly-filters">
          <label>
            <span>关键字</span>
            <div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters({ ...draftFilters, query: event.target.value })} placeholder="姓名、手机号或地址" /></div>
          </label>
          <label><span>套餐类型</span><select className="select-control filter-select wide" value={draftFilters.packageType} onChange={(event) => setDraftFilters({ ...draftFilters, packageType: event.target.value })}><option value="all">全部套餐类型</option>{elderlyPackageCatalog.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <div className="filter-actions">
            <button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button>
            <button className="secondary-button" onClick={() => { setDraftFilters(initialFilters); setFilters(initialFilters); }}><RefreshCw size={15}/>重置</button>
          </div>
        </div>
        <div className="table-scroll">
          <table className="elderly-table">
            <thead><tr><th>老人信息</th><th>联系电话 / 居住地址</th><th>套餐类型</th><th>平板状态</th><th>房间活动传感器</th><th className="sticky-right">操作</th></tr></thead>
            <tbody>
              {filteredRecords.map((record) => {
                const tablet = tabletDevices.find((device) => device.boundElderlyId === record.id);
                const currentActivation = activationRecords.find((item) => item.elderlyId === record.id && (isPendingTabletActivation(item.status) || isFailedTabletActivation(item.status)));
                const activationStatus = normalizeTabletActivationStatus(currentActivation?.status);
                return (
                  <tr key={record.id}>
                    <td><button className="elderly-name-cell" onClick={() => onOpen("view", record)}><span className="person-avatar">{record.name.slice(-1)}</span><span><b>{record.name}</b><small>{record.gender} · {record.age} 岁</small></span></button></td>
                    <td><div className="stacked-cell"><b>{record.phone || "待补充"}</b><small>{record.address}</small></div></td>
                    <td><StatusTag>{getElderlyPackageLabel(record.packageType)}</StatusTag></td>
                    <td><div className="stacked-cell">{tablet ? <TabletOnlineStatusTag>{tablet.onlineStatus}</TabletOnlineStatusTag> : <StatusTag>{currentActivation ? activationStatus : "待绑定"}</StatusTag>}<small>{tablet ? `设备 ${formatDisplayId(tablet.id)}` : (currentActivation ? `设备 ${formatDisplayId(currentActivation.deviceId)}` : "尚未绑定平板")}</small></div></td>
                    <td><StatusTag>{record.device}</StatusTag></td>
                    <td className="sticky-right elderly-actions">
                      <button className="table-action" onClick={() => onOpen("view", record)}>详情</button>
                      <button className="table-action" onClick={() => onOpen("edit", record)}>编辑</button>
                    </td>
                  </tr>
                );
              })}
              {!filteredRecords.length && <tr><td colSpan="6"><div className="empty-state"><Search size={24}/><b>未找到匹配的老人档案</b><span>请调整筛选条件后重新查询</span></div></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="pagination"><span>当前展示 {filteredRecords.length} 条数据</span><div><button className="select-button">20 条/页 <ChevronDown size={14}/></button><button className="page-arrow" disabled><ChevronLeft size={15}/></button><button className="page-number active">1</button><button className="page-arrow" disabled><ChevronRight size={15}/></button></div></div>
      </section>
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
    <div className="panel-title"><div><h3>今日房间活动</h3></div><span className="activity-date">今天 · 2026年7月17日</span></div>
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
    <div className="panel-title"><div><h3>无活动轻提醒</h3></div><StatusTag>使用全局规则</StatusTag></div>
    <div className="inactivity-rule-summary">
      <span className="inactivity-rule-icon"><Bell size={20}/></span>
      <div><b>{rule.enabled ? `连续 ${rule.thresholdHours} 小时无活动` : "暂未启用提醒规则"}</b><small>{rule.enabled ? `监测时段 ${rule.startTime}–${rule.endTime} · 仅后台提醒` : "启用后仅作为轻度关注线索，不触发老人端警报"}</small></div>
      <StatusTag>{rule.enabled ? "已启用" : "未启用"}</StatusTag>
      <div className="inactivity-current-status"><span>当前状态</span><StatusTag>{rule.status}</StatusTag></div>
    </div>
    <div className="inactivity-history"><div className="inactivity-history-head"><b>提醒记录</b><span>最近 7 天</span></div>{rule.history?.length ? rule.history.map((item) => <div className="inactivity-history-row" key={item.id}><div><b>{item.triggeredAt}</b><small>触发时间</small></div><div><b>{item.lastActivity}</b><small>最后活动</small></div><div><b>{item.duration}</b><small>无活动时长</small></div><div><StatusTag>{item.status}</StatusTag><small>{item.status === "已恢复" ? `恢复活动 ${item.recoveredAt}` : "等待后台查看"}</small></div></div>) : <div className="inactivity-history-empty">最近 7 天没有生成无活动提醒</div>}</div>
    <div className="inactivity-rule-note"><ShieldCheck size={16}/><span>仅当已安装的房间传感器正常在线时判断无活动；设备离线时只生成房间传感器离线提醒，不生成老人无活动提醒。</span></div>
  </section>;
}

const elderlyStatisticsPeriods = [
  { value: "today", label: "今日" },
  { value: "7days", label: "近 7 天" },
  { value: "30days", label: "近 30 天" },
];

const activityStatisticsMock = {
  today: { lastActivity: "15:06", activityCount: "8 次", inactiveDuration: "1 小时 52 分", completeness: "98%", trend: [18, 32, 46, 29, 58, 44, 63, 52], labels: ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"] },
  "7days": { lastActivity: "今天 15:06", activityCount: "61 次", inactiveDuration: "1 小时 52 分", completeness: "97%", trend: [54, 62, 48, 71, 66, 58, 76], labels: ["10/16", "10/17", "10/18", "10/19", "10/20", "10/21", "10/22"] },
  "30days": { lastActivity: "今天 15:06", activityCount: "258 次", inactiveDuration: "1 小时 52 分", completeness: "95%", trend: [62, 48, 73, 56, 68, 79, 64, 82, 72, 76], labels: ["第1周", "", "第2周", "", "第3周", "", "第4周", "", "", "今日"] },
};

const screenStatisticsMock = {
  today: { onlineDuration: "9 小时 18 分", activeDuration: "2 小时 36 分", useCount: "34 次", lastOperation: "15:18", trend: [22, 35, 28, 53, 44, 68, 57, 39], labels: ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"] },
  "7days": { onlineDuration: "64 小时 12 分", activeDuration: "17 小时 48 分", useCount: "226 次", lastOperation: "今天 15:18", trend: [48, 56, 62, 51, 68, 73, 66], labels: ["10/16", "10/17", "10/18", "10/19", "10/20", "10/21", "10/22"] },
  "30days": { onlineDuration: "276 小时 40 分", activeDuration: "71 小时 25 分", useCount: "938 次", lastOperation: "今天 15:18", trend: [45, 58, 52, 69, 61, 76, 67, 72, 64, 79], labels: ["第1周", "", "第2周", "", "第3周", "", "第4周", "", "", "今日"] },
};

function StatisticsMetricGrid({ items, muted = false }) {
  return <div className={`elderly-statistics-metrics ${muted ? "is-muted" : ""}`}>{items.map((item) => <div key={item.label}><div className="admin-metric-heading"><span>{item.label}</span>{item.help && <MetricHelp label={`${item.label}指标说明`} content={item.help}/>}</div><b>{item.value}</b><small>{item.note}</small></div>)}</div>;
}

function StatisticsTrendChart({ title, description, values, labels, tone = "blue" }) {
  return <section className="statistics-chart-card"><div className="statistics-card-heading"><div><h4>{title}</h4><p>{description}</p></div></div><div className={`statistics-bar-chart tone-${tone}`} role="img" aria-label={title}>{values.map((value, index) => <div className="statistics-bar-item" key={`${labels[index]}-${index}`}><span className="statistics-bar-value">{value}</span><i style={{ height: `${Math.max(value, 8)}%` }}/><small>{labels[index]}</small></div>)}</div></section>;
}

function StatisticsDistribution({ title, description, items, tone = "blue" }) {
  return <section className="statistics-chart-card"><div className="statistics-card-heading"><div><h4>{title}</h4><p>{description}</p></div></div><div className={`statistics-distribution-list tone-${tone}`}>{items.map((item) => <div key={item.label}><span>{item.label}</span><div><i style={{ width: `${item.value}%` }}/></div><b>{item.value}%</b></div>)}</div></section>;
}

function StatisticsEmptyState({ type, scenario, scope = "elderly" }) {
  const offline = scenario === "offline";
  const emptyCopy = scope === "community" ? "当前社区本周期没有有效数据；后续产生记录后将恢复汇总趋势和分布。" : "本页只展示当前老人的数据；产生有效记录后，将在这里展示趋势、分布和异常记录。";
  return <div className="statistics-empty-state"><span>{offline ? <AlertTriangle size={24}/> : type === "activity" ? <Activity size={24}/> : <MonitorSmartphone size={24}/>}</span><h4>{offline ? "设备离线，当前数据不足" : "当前周期暂无统计数据"}</h4><p>{offline ? (type === "activity" ? "房间活动传感器恢复在线并持续上报后，将重新生成老人维度统计。" : "老人平板恢复在线并产生操作记录后，将重新生成屏幕使用统计。") : emptyCopy}</p></div>;
}

function CommunityElderlyUsageOverview({ communityName, records, tablets, sensors, view, onViewChange, onOpenElderly, inactivityRule, onEditInactivityRule }) {
  const { type, period, scenario } = view;
  const inactivityRecordsRef = useRef(null);
  const setView = (patch) => onViewChange((current) => ({ ...current, ...patch }));
  const periodLabel = elderlyStatisticsPeriods.find((item) => item.value === period)?.label || "今日";
  const durationByPeriod = { today: 156, "7days": 1068, "30days": 4285 };
  const countByPeriod = { today: 34, "7days": 226, "30days": 938 };
  const activityData = activityStatisticsMock[period];
  const screenData = screenStatisticsMock[period];

  const screenRows = records.map((record, index) => {
    const tablet = tablets.find((item) => item.boundElderlyId === record.id);
    let status = "活跃";
    if (scenario === "empty") status = "无记录";
    else if (scenario === "offline") status = "设备离线 / 不足";
    else if (!tablet || tablet.activationStatus !== "已激活" || tablet.onlineStatus !== "在线") status = "设备离线 / 不足";
    else if (!(tablet.usageRecords || []).length) status = "无记录";
    const lowUsage = status === "活跃" && (tablet?.usageRecords || []).length <= 1;
    return {
      record,
      status,
      lowUsage,
      activeMinutes: status === "活跃" ? durationByPeriod[period] + index * 17 : null,
      useCount: status === "活跃" ? countByPeriod[period] + index * 5 : null,
      lastActive: status === "活跃" ? (index ? `今天 ${String(14 - index).padStart(2, "0")}:36` : "今天 15:18") : "—",
    };
  });
  const activeScreenRows = screenRows.filter((item) => item.status === "活跃");
  const screenAttentionRows = screenRows.filter((item) => item.status !== "活跃" || item.lowUsage);
  const averageMinutes = activeScreenRows.length ? Math.round(activeScreenRows.reduce((sum, item) => sum + item.activeMinutes, 0) / activeScreenRows.length) : null;
  const totalUseCount = activeScreenRows.reduce((sum, item) => sum + item.useCount, 0);

  const activityRows = records.map((record) => {
    const installedSensors = sensors.filter((item) => item.elderlyId === record.id && item.installStatus === "已安装");
    let status = "正常";
    if (scenario === "empty") status = "无数据";
    else if (scenario === "offline") status = "设备离线";
    else if (!installedSensors.length) status = "无数据";
    else if (installedSensors.some((item) => item.onlineStatus !== "在线")) status = "设备离线";
    else if (Number(record.id.slice(-1)) % 2 === 0) status = "低活动";
    return { record, installedSensors, status, lastActivity: installedSensors[0]?.lastActivity || "—" };
  });
  const activityAttentionRows = activityRows.filter((item) => item.status !== "正常");
  const installedSensorCount = activityRows.reduce((sum, item) => sum + item.installedSensors.length, 0);
  const onlineSensorCount = activityRows.reduce((sum, item) => sum + item.installedSensors.filter((sensor) => sensor.onlineStatus === "在线").length, 0);
  const screenMetrics = [
    { label: "有效数据覆盖", value: `${activeScreenRows.length} / ${records.length}`, note: "有效老人 / 当前社区老人", help: "分子为本周期产生有效屏幕操作的老人，分母为当前社区老人；无记录、未激活和离线设备不计入有效人数。" },
    { label: "活跃", value: `${activeScreenRows.length} 位`, note: "当前周期产生有效操作" },
    { label: "无记录", value: `${screenRows.filter((item) => item.status === "无记录").length} 位`, note: "设备在线但无有效操作" },
    { label: "设备离线 / 不足", value: `${screenRows.filter((item) => item.status === "设备离线 / 不足").length} 位`, note: "不进入人均时长分母" },
    { label: "人均活跃时长", value: averageMinutes === null ? "—" : `${Math.floor(averageMinutes / 60)} 小时 ${averageMinutes % 60} 分`, note: `仅计 ${activeScreenRows.length} 位有效老人` },
    { label: "使用次数", value: activeScreenRows.length ? `${totalUseCount} 次` : "—", note: `${periodLabel}有效操作会话` },
    { label: "最近活跃", value: activeScreenRows[0]?.lastActive || "—", note: "社区内最近有效操作" },
  ];
  const activityMetrics = [
    { label: "有效传感器覆盖", value: `${onlineSensorCount} / ${installedSensorCount}`, note: "在线 / 已安装传感器", help: "分子为当前在线传感器，分母为当前社区已安装传感器；离线设备不进入有效活动判断。" },
    { label: "正常", value: `${activityRows.filter((item) => item.status === "正常").length} 位`, note: "活动记录在常规范围" },
    { label: "低活动", value: `${activityRows.filter((item) => item.status === "低活动").length} 位`, note: "需运营结合记录关注" },
    { label: "无数据", value: `${activityRows.filter((item) => item.status === "无数据").length} 位`, note: "不进入有效统计" },
    { label: "设备离线", value: `${activityRows.filter((item) => item.status === "设备离线").length} 位`, note: "不判断为老人无活动" },
  ];
  const featureDistribution = [{ label: "家庭相册", value: 31 }, { label: "留言", value: 24 }, { label: "提醒", value: 18 }, { label: "社区活动", value: 12 }, { label: "直播", value: 8 }, { label: "服务沟通", value: 7 }];
  const roomDistribution = [{ label: "客厅", value: 43 }, { label: "卧室", value: 32 }, { label: "厨房", value: 25 }];
  const isNormal = scenario === "normal";
  const attentionRows = type === "screen" ? screenAttentionRows : activityAttentionRows;

  return <section className="panel community-usage-overview">
    <div className="statistics-toolbar community-usage-toolbar">
      <div className="statistics-type-tabs" role="tablist" aria-label="社区老人使用统计类型"><button className={type === "activity" ? "active" : ""} onClick={() => setView({ type: "activity" })}><Activity size={15}/>活动情况</button><button className={type === "screen" ? "active" : ""} onClick={() => setView({ type: "screen" })}><MonitorSmartphone size={15}/>屏幕使用</button></div>
      <div className="statistics-toolbar-controls"><div className="statistics-period-tabs" role="tablist" aria-label="统计周期">{elderlyStatisticsPeriods.map((item) => <button className={period === item.value ? "active" : ""} key={item.value} onClick={() => setView({ period: item.value })}>{item.label}</button>)}</div><label className="statistics-scenario-select"><span>数据状态</span><select value={scenario} onChange={(event) => setView({ scenario: event.target.value })}><option value="normal">常规</option><option value="empty">无数据</option><option value="offline">设备离线</option></select></label></div>
    </div>
    {type === "activity" && <div className="community-inactivity-toolbar"><div><b>无活动规则</b><span>{inactivityRule?.enabled ? `连续 ${inactivityRule.thresholdHours} 小时无活动 · ${inactivityRule.startTime}–${inactivityRule.endTime}` : "规则已停用"}</span></div><div><button className="secondary-button" onClick={onEditInactivityRule}><Settings size={15}/>设置规则</button><button className="text-button" onClick={() => inactivityRecordsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>查看记录 <ChevronRight size={15}/></button></div></div>}
    <div className="statistics-context"><div><b>{type === "activity" ? "活动情况" : "屏幕使用"}</b><span>{periodLabel} · 仅当前社区</span></div><StatusTag>{scenario === "normal" ? "数据正常" : scenario === "empty" ? "无数据" : "数据不足"}</StatusTag></div>
    <StatisticsMetricGrid items={type === "screen" ? screenMetrics : activityMetrics} muted={!isNormal}/>
    {isNormal ? <div className="statistics-grid two-columns">{type === "screen" ? <><StatisticsTrendChart title="社区屏幕使用趋势" description={`${periodLabel}有效操作会话分布`} values={screenData.trend} labels={screenData.labels} tone="violet"/><StatisticsDistribution title="功能使用分布" description="按有效操作次数汇总" items={featureDistribution} tone="violet"/></> : <><StatisticsTrendChart title="社区活动趋势" description={`${periodLabel}检测到活动的次数变化`} values={activityData.trend} labels={activityData.labels}/><StatisticsDistribution title="房间分布" description="各房间检测到活动的占比" items={roomDistribution} tone="teal"/></>}</div> : <StatisticsEmptyState type={type} scenario={scenario} scope="community"/>} 
    {type === "activity" && <section ref={inactivityRecordsRef} className="statistics-records community-inactivity-records"><div className="statistics-card-heading"><div><h4>无活动记录</h4><p>每位老人独立记录，设备离线不计为无活动</p></div><span className="result-count">共 {buildInactivityTodoItems(records).length} 条</span></div><div className="inactivity-record-list">{buildInactivityTodoItems(records).map((item) => <button key={item.id} onClick={() => onOpenElderly(records.find((record) => record.name === item.elderly) || records[0])}><span><b>{item.elderly} · {item.description}</b><small>{item.clue} · {item.status}</small></span><em>查看统计 <ChevronRight size={14}/></em></button>)}</div></section>}
    <section className="statistics-records community-usage-attention"><div className="statistics-card-heading"><div><h4>关注老人</h4><p>{type === "screen" ? "低频使用、无记录或设备数据不足" : "低活动、无数据或传感器离线"}；点击老人查看单人统计</p></div><span className="result-count">共 {attentionRows.length} 位</span></div>
      <div className="statistics-record-table community-usage-table"><div className="statistics-record-head"><span>老人</span><span>当前状态</span><span>数据摘要</span><span>最近记录</span><span>操作</span></div>{attentionRows.map((item) => { const status = item.status; const summary = type === "screen" ? (item.lowUsage ? "本周期使用频率偏低" : status === "无记录" ? "设备在线但无有效操作" : "平板离线或未完成激活") : status === "低活动" ? "活动次数低于社区关注阈值" : status === "无数据" ? "未安装传感器或无有效上报" : "传感器离线，不判断无活动"; return <div key={item.record.id}><button className="name-link" onClick={() => onOpenElderly(item.record)}>{item.record.name}</button><StatusTag>{item.lowUsage ? "低频使用" : status}</StatusTag><span>{summary}</span><span>{type === "screen" ? item.lastActive : item.lastActivity}</span><button className="table-action" onClick={() => onOpenElderly(item.record)}>查看统计</button></div>; })}{!attentionRows.length && <div className="community-usage-no-attention"><ShieldCheck size={18}/><span>当前周期没有需要关注的老人</span></div>}</div>
    </section>
    <div className="community-usage-definition"><ShieldCheck size={16}/><p>{type === "screen" ? "人均活跃时长仅以产生有效屏幕操作的老人为分母；无记录、未激活和离线设备不纳入人均值。" : "活动数据只表示房间传感器检测到活动；无数据和设备离线不进入有效分母，也不能解读为健康或安全结论。"}</p></div>
  </section>;
}

function ElderlyDataDashboardPage(props) {
  return <><div className="page-heading"><div><h1>老人使用分析</h1><p>查看当前社区老人活动情况、屏幕使用、设备数据与趋势分析</p></div></div><CommunityElderlyUsageOverview {...props}/></>;
}

function ElderlyDataStatisticsPanel({ record, sensors }) {
  const [type, setType] = useState("activity");
  const [period, setPeriod] = useState("today");
  const [scenario, setScenario] = useState("normal");
  const activityData = activityStatisticsMock[period];
  const screenData = screenStatisticsMock[period];
  const hasOfflineSensor = sensors.some((sensor) => sensor.onlineStatus === "离线");
  const isNormal = scenario === "normal";
  const mutedMetrics = scenario !== "normal";
  const activityMetrics = isNormal ? [
    { label: "今日最后活动时间", value: activityData.lastActivity, note: "最近检测到房间活动" },
    { label: "今日活动次数", value: activityData.activityCount, note: "按连续活动时段合并" },
    { label: "连续未活动时长", value: activityData.inactiveDuration, note: "截至当前统计时间" },
    { label: "传感器数据完整度", value: activityData.completeness, note: "已安装设备上报完整度" },
  ] : [
    { label: "今日最后活动时间", value: "—", note: "暂无可用记录" },
    { label: "今日活动次数", value: "—", note: "暂无可用记录" },
    { label: "连续未活动时长", value: "—", note: "无法计算" },
    { label: "传感器数据完整度", value: scenario === "offline" ? "不足" : "—", note: scenario === "offline" ? "存在设备离线" : "暂无上报" },
  ];
  const screenMetrics = isNormal ? [
    { label: "今日在线时长", value: screenData.onlineDuration, note: "平板保持在线的累计时长" },
    { label: "屏幕活跃时长", value: screenData.activeDuration, note: "屏幕点亮且产生操作" },
    { label: "使用次数", value: screenData.useCount, note: "本周期有效操作会话" },
    { label: "最近一次操作时间", value: screenData.lastOperation, note: "老人端最近有效操作" },
  ] : [
    { label: "今日在线时长", value: "—", note: "暂无可用记录" },
    { label: "屏幕活跃时长", value: "—", note: "暂无可用记录" },
    { label: "使用次数", value: "—", note: "暂无可用记录" },
    { label: "最近一次操作时间", value: "—", note: scenario === "offline" ? "平板当前离线" : "暂无操作" },
  ];
  const roomDistribution = [{ label: "客厅", value: 43 }, { label: "卧室", value: 32 }, { label: "厨房", value: 25 }];
  const timeDistribution = [{ label: "清晨 06–09", value: 18 }, { label: "上午 09–12", value: 34 }, { label: "下午 12–18", value: 38 }, { label: "夜间 18–24", value: 10 }];
  const featureDistribution = [{ label: "家庭相册", value: 31 }, { label: "留言", value: 24 }, { label: "提醒", value: 18 }, { label: "社区活动", value: 12 }, { label: "直播", value: 8 }, { label: "服务沟通", value: 7 }];
  return <div className="elderly-data-statistics elderly-detail-content">
    <section className="panel statistics-shell">
      <div className="statistics-toolbar">
        <div className="statistics-type-tabs" role="tablist" aria-label="统计类型"><button className={type === "activity" ? "active" : ""} onClick={() => setType("activity")}><Activity size={15}/>活动情况</button><button className={type === "screen" ? "active" : ""} onClick={() => setType("screen")}><MonitorSmartphone size={15}/>屏幕使用</button></div>
        <div className="statistics-toolbar-controls"><div className="statistics-period-tabs" role="tablist" aria-label="统计周期">{elderlyStatisticsPeriods.map((item) => <button className={period === item.value ? "active" : ""} key={item.value} onClick={() => setPeriod(item.value)}>{item.label}</button>)}</div><label className="statistics-scenario-select"><span>数据状态</span><select value={scenario} onChange={(event) => setScenario(event.target.value)}><option value="normal">正常</option><option value="empty">暂无数据</option><option value="offline">设备离线 / 数据不足</option></select></label></div>
      </div>
      <div className="statistics-context"><div><b>{type === "activity" ? "活动情况" : "屏幕使用"}</b><span>{record.name} · 当前老人数据</span></div><StatusTag>{scenario === "normal" ? (hasOfflineSensor && type === "activity" ? "部分设备离线" : "数据正常") : scenario === "empty" ? "暂无数据" : "数据不足"}</StatusTag></div>
      {type === "activity" ? <>
        <StatisticsMetricGrid items={activityMetrics} muted={mutedMetrics}/>
        {isNormal ? <>
          <div className="statistics-grid two-columns"><StatisticsTrendChart title="活动趋势" description="统计周期内检测到活动的次数变化" values={activityData.trend} labels={activityData.labels}/><StatisticsDistribution title="房间分布" description="各房间检测到活动的占比" items={roomDistribution}/></div>
          <div className="statistics-grid two-columns"><StatisticsDistribution title="时段分布" description="按活动发生时间汇总" items={timeDistribution} tone="teal"/><section className="statistics-chart-card statistics-clarification"><div className="statistics-card-heading"><div><h4>统计口径说明</h4><p>避免将设备数据误解为人物行为或健康结论</p></div></div><div><ShieldCheck size={18}/><p>活动传感器只表示对应房间检测到活动，不能判断具体人物、具体动作、跌倒、睡眠或任何健康结论。</p></div></section></div>
          <section className="statistics-records"><div className="statistics-card-heading"><div><h4>长时间无活动或夜间活动记录</h4><p>仅作为运营关注线索，不作为安全或健康判断</p></div></div><div className="statistics-record-table"><div className="statistics-record-head"><span>发生时间</span><span>记录类型</span><span>关联房间</span><span>持续/发生时段</span><span>状态</span></div><div><span>2026-10-21 18:24</span><b>长时间无活动</b><span>全部房间</span><span>3 小时 04 分</span><StatusTag>已恢复</StatusTag></div><div><span>2026-10-19 23:18</span><b>夜间活动</b><span>客厅</span><span>23:18–23:31</span><StatusTag>已记录</StatusTag></div></div></section>
        </> : <StatisticsEmptyState type="activity" scenario={scenario}/>} 
      </> : <>
        <StatisticsMetricGrid items={screenMetrics} muted={mutedMetrics}/>
        {isNormal ? <>
          <div className="statistics-grid two-columns"><StatisticsTrendChart title="使用趋势" description="统计周期内屏幕活跃时长变化" values={screenData.trend} labels={screenData.labels} tone="violet"/><StatisticsDistribution title="功能使用分布" description="按有效操作次数统计" items={featureDistribution} tone="violet"/></div>
          <div className="statistics-grid two-columns"><section className="statistics-chart-card statistics-summary-card"><div className="statistics-card-heading"><div><h4>音视频通话</h4><p>当前统计周期内的有效通话</p></div></div><div className="statistics-call-summary"><div><span>通话次数</span><b>{period === "today" ? "3 次" : period === "7days" ? "18 次" : "76 次"}</b></div><div><span>累计时长</span><b>{period === "today" ? "42 分钟" : period === "7days" ? "3 小时 26 分" : "14 小时 18 分"}</b></div></div></section><section className="statistics-chart-card statistics-summary-card"><div className="statistics-card-heading"><div><h4>提醒确认率</h4><p>已到时间提醒中由老人完成确认的比例</p></div></div><div className="statistics-confirmation"><div><b>86%</b><span>已确认 6 次 / 应确认 7 次</span></div><div><i style={{ width: "86%" }}/></div></div></section></div>
          <section className="statistics-records"><div className="statistics-card-heading"><div><h4>连续未使用或长时间离线记录</h4><p>用于判断设备可用性与是否需要运营跟进</p></div></div><div className="statistics-record-table"><div className="statistics-record-head"><span>发生时间</span><span>记录类型</span><span>持续时长</span><span>最后操作</span><span>状态</span></div><div><span>2026-10-20 22:10</span><b>连续未使用</b><span>4 小时 18 分</span><span>17:52</span><StatusTag>已恢复</StatusTag></div><div><span>2026-10-17 09:36</span><b>长时间离线</b><span>1 小时 12 分</span><span>08:24</span><StatusTag>已恢复</StatusTag></div></div></section>
        </> : <StatisticsEmptyState type="screen" scenario={scenario}/>} 
      </>}
    </section>
  </div>;
}

function InactivityRuleDrawer({ rule, onClose, onSave }) {
  const [form, setForm] = useState(rule);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer inactivity-rule-drawer" role="dialog" aria-modal="true" aria-label="设置全局无活动轻提醒"><header><div><h2>设置全局无活动轻提醒</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="form-section"><h3>全局提醒规则</h3><label><span>规则状态</span><select className="select-control form-select-native" value={form.enabled ? "启用" : "停用"} onChange={(event) => update("enabled", event.target.value === "启用")}><option>启用</option><option>停用</option></select></label><label><span>连续无活动时长</span><select className="select-control form-select-native" value={form.thresholdHours} onChange={(event) => update("thresholdHours", Number(event.target.value))}><option value="1">1 小时</option><option value="2">2 小时</option><option value="3">3 小时</option><option value="4">4 小时</option><option value="6">6 小时</option><option value="8">8 小时</option></select></label><div className="form-two-cols"><label><span>监测开始时间</span><input type="time" value={form.startTime} onChange={(event) => update("startTime", event.target.value)}/></label><label><span>监测结束时间</span><input type="time" value={form.endTime} onChange={(event) => update("endTime", event.target.value)}/></label></div></div><div className="form-tip"><ShieldCheck size={18}/><div><b>全局生效范围</b><p>保存后对全部已安装房间活动传感器的老人统一生效，不需要逐个老人重复设置。</p></div></div><div className="form-tip"><ShieldCheck size={18}/><div><b>轻提醒判断口径</b><p>监测时间段内，所有已安装且在线的房间传感器连续超过设定时长没有检测到活动，后台生成“待关注”提醒。任一设备离线时不判断老人无活动。</p></div></div><div className="form-tip neutral"><Bell size={18}/><div><b>提醒范围</b><p>一期仅在运营后台展示，不触发平板警报、电话或紧急联系人通知。</p></div></div></div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={() => onSave(form)}>保存全局规则</button></footer></aside></div>;
}

function FamilyRelationshipPanel({ relations, onUnlinkRelation }) {
  const [pendingAction, setPendingAction] = useState(null);
  const activeRelations = relations.filter((item) => item.status === "正常");

  const confirmAction = () => {
    if (pendingAction) onUnlinkRelation(pendingAction.id);
    setPendingAction(null);
  };

  return (
    <div className="family-relationship-page">
      <section className="panel family-panel">
        <div className="panel-title"><div><h3>已绑定子女</h3></div></div>
        <div className="table-scroll"><table className="family-relation-table"><thead><tr><th>姓名</th><th>脱敏手机号</th><th>与老人关系</th><th>绑定时间</th><th>关系状态</th><th>操作</th></tr></thead><tbody>
          {relations.map((item) => <tr key={item.id}><td><div className="relative-name-cell"><span>{item.name.slice(-1)}</span><b>{item.name}</b></div></td><td>{maskPhone(item.phone)}</td><td>{item.relation}</td><td>{item.boundAt}</td><td><StatusTag>{item.status}</StatusTag></td><td>{item.status === "正常" ? <button className="table-action danger-text" onClick={() => setPendingAction(item)}>解除关系</button> : <span className="muted-action">—</span>}</td></tr>)}
          {!relations.length && <tr><td colSpan="6"><div className="empty-table-state">当前老人尚未绑定子女</div></td></tr>}
        </tbody></table></div>
      </section>

      {pendingAction && <div className="modal-layer"><button className="modal-backdrop" aria-label="关闭确认弹窗" onClick={() => setPendingAction(null)}/><section className="confirm-dialog" role="dialog" aria-modal="true"><span className="confirm-icon danger"><ShieldCheck size={22}/></span><h3>确认解除家庭关系？</h3><p>解除后，{pendingAction.name} 不再能查看该老人的提醒、近况和已授权家庭信息，也不再接收该老人的后续通知。历史留言、通话、影像和操作记录继续保留；老人与其他家人的绑定关系不受影响。如需恢复，需由子女端重新发起申请并由老人确认。</p><div><button className="secondary-button" onClick={() => setPendingAction(null)}>取消</button><button className="danger-button" onClick={confirmAction}>确认解除</button></div></section></div>}
    </div>
  );
}

function ElderlyReminderPanel({ reminders, onCreate, onEdit, onDelete, onViewPlan }) {
  const [view, setView] = useState("current");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const currentDefinitions = reminders.filter((reminder) => !reminder.deletedAt);
  const deletedHistory = reminders.filter((reminder) => reminder.deletedAt).sort((left, right) => right.deletedAt.localeCompare(left.deletedAt));
  const rows = view === "current" ? currentDefinitions : deletedHistory;

  const confirmDelete = () => {
    const result = onDelete(deleteTarget.id);
    if (!result?.ok) {
      setDeleteError("删除失败，当前提醒已保留，请重试。");
      return;
    }
    setDeleteTarget(null);
    setDeleteError("");
  };

  return <>
    <section className="panel detail-page-panel elderly-reminder-panel elderly-detail-content">
      <div className="panel-title"><div><h3>提醒事项</h3></div><div className="panel-title-actions"><div className="reminder-view-tabs" role="tablist" aria-label="提醒记录范围"><button className={view === "current" ? "active" : ""} onClick={() => setView("current")}>当前提醒 <span>{currentDefinitions.length}</span></button><button className={view === "history" ? "active" : ""} onClick={() => setView("history")}>已删除记录 <span>{deletedHistory.length}</span></button></div>{view === "current" && <button className="primary-button" onClick={onCreate}><Plus size={15}/>新建提醒</button>}</div></div>
      <div className="table-scroll"><table className="elderly-reminder-table"><thead><tr><th>提醒名称</th><th>类型</th><th>计划时间</th><th>重复方式</th><th>{view === "current" ? "最后更新" : "删除时间"}</th><th className="sticky-right">操作</th></tr></thead><tbody>{rows.map((reminder) => <tr key={reminder.id}><td><div className="reminder-name-cell"><span>{view === "current" ? <Bell size={16}/> : <FileClock size={16}/>}</span><div><b>{reminder.title}</b><small>{view === "history" ? "提醒定义已删除，不再产生后续实例" : reminder.type === "用药提醒" ? [reminder.dosage, reminder.usage].filter(Boolean).join(" · ") || reminder.note || "暂无用药说明" : reminder.note || "暂无补充说明"}</small></div></div></td><td><StatusTag>{reminder.type}</StatusTag></td><td><div className="stacked-cell"><b>{reminder.date}</b><small>{reminder.time} · 老人当地时间</small></div></td><td>{reminder.repeat}</td><td><div className="stacked-cell"><b>{view === "current" ? reminder.updatedBy || reminder.createdBy : reminder.deletedBy}</b><small>{view === "current" ? reminder.updatedAt || reminder.createdAt : reminder.deletedAt}</small></div></td><td className="sticky-right">{view === "current" ? <><button className="table-action" onClick={() => onViewPlan(reminder)}>详细计划</button><button className="table-action" onClick={() => onEdit(reminder)}>编辑</button><button className="table-action danger-text" onClick={() => { setDeleteTarget(reminder); setDeleteError(""); }}>删除</button></> : <button className="table-action" onClick={() => onViewPlan(reminder)}>查看执行历史</button>}</td></tr>)}{!rows.length && <tr><td colSpan="6"><div className="empty-table-state">{view === "current" ? "当前老人暂无提醒事项，可点击“新建提醒”进行配置" : "当前老人暂无已删除提醒记录"}</div></td></tr>}</tbody></table></div>
    </section>
    {deleteTarget && <AdminConfirm title={`删除“${deleteTarget.title}”？`} description="删除后该提醒会从当前列表移除，并且不再产生后续提醒。已经发生的执行记录不会被改写。" error={deleteError} confirmLabel={deleteError ? "重试删除" : "确认删除"} icon={<Trash2 size={20}/>} onClose={() => { setDeleteTarget(null); setDeleteError(""); }} onConfirm={confirmDelete}/>} 
  </>;
}

function ArchiveSubjectSummary({ name, details }) {
  return <section className="archive-subject-summary" aria-label="档案对象信息">
    <span className="archive-subject-avatar" aria-hidden="true">{name.slice(-1)}</span>
    <div><b>{name}</b><p>{details.filter(Boolean).map((detail, index) => <span key={`${detail}-${index}`}>{detail}</span>)}</p></div>
  </section>;
}

function ElderlyDetailDrawer({ record, tablet, activation, activationDevice, sensors, reminders, familyRelations, inactivityRule, initialTab = "profile", onClose, onEdit, onManageSpaces, onAddSensor, onViewSensor, onManageTablet, onUnlinkRelation, onCreateReminder, onEditReminder, onDeleteReminder, onViewReminderPlan }) {
  const [tab, setTab] = useState(initialTab);
  const emergencyContacts = getEmergencyContacts(record);
  tablet = tablet ? { ...tablet, id: formatDisplayId(tablet.id) } : tablet;
  const boundSensors = sensors.filter((sensor) => sensor.elderlyId === record.id && sensor.installStatus !== "已解绑");
  const activationStatus = normalizeTabletActivationStatus(activation?.status);
  const activationPending = Boolean(activation && isPendingTabletActivation(activation.status));
  const activationFailed = Boolean(activation && isFailedTabletActivation(activation.status));
  const tabletActionLabel = tablet ? "管理绑定" : (activationFailed || activationPending) ? "查看激活详情" : "绑定平板";
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭老人档案详情" onClick={onClose}/><aside className="drawer record-detail-drawer elderly-record-detail-drawer" role="dialog" aria-modal="true" aria-label="老人档案详情">
    <header><h2>老人档案详情</h2><button className="icon-button" aria-label="关闭" onClick={onClose}><X size={19}/></button></header>
    <div className="drawer-body"><div className="elderly-detail-page">
    <ArchiveSubjectSummary name={record.name} details={[record.gender, `${record.age} 岁`]}/>
    <div className="elderly-detail-tabs"><button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>档案信息</button><button className={tab === "family" ? "active" : ""} onClick={() => setTab("family")}>家庭关系 <span>{familyRelations.filter((item) => item.status === "正常").length}</span></button><button className={tab === "reminders" ? "active" : ""} onClick={() => setTab("reminders")}>提醒事项 <span>{reminders.filter((reminder) => !reminder.deletedAt).length}</span></button><button className={tab === "spaces" ? "active" : ""} onClick={() => setTab("spaces")}>房间活动传感器 <span>{boundSensors.length}</span></button><button className={tab === "tablet" ? "active" : ""} onClick={() => setTab("tablet")}>平板设备</button><button className={tab === "statistics" ? "active" : ""} onClick={() => setTab("statistics")}>数据统计</button></div>
    {tab === "profile" && <div className="elderly-detail-grid elderly-detail-content">
      <section className="panel detail-page-panel">
        <div className="panel-title"><div><h3>基础资料</h3></div><span className="result-count">更新于 {record.updatedAt || "—"}</span></div>
        <div className="elderly-detail-section-body"><div className="info-grid elderly-profile-info-grid">
          <div><span>出生日期</span><b>{record.birthday || "待补充"}</b></div><div><span>联系电话</span><b>{record.phone || "待补充"}</b></div>
          <div><span>所属项目</span><b>{record.project || "待补充"}</b></div><div><span>所属社区</span><b>{record.community || "待补充"}</b></div>
          <div><span>套餐类型</span><StatusTag>{getElderlyPackageLabel(record.packageType)}</StatusTag></div>
          <div className="full"><span>居住地址</span><b>{record.address || "待补充"}</b></div>
          <div className="full"><span>运营标签</span><div className="profile-tags">{record.tags?.length ? record.tags.map((tag) => <span key={tag}>{tag}</span>) : <b>暂无标签</b>}</div></div>
        </div></div>
      </section>
      <div className="elderly-detail-side">
        <section className="panel detail-page-panel elderly-contact-panel"><div className="panel-title"><div><h3>紧急联系人</h3></div></div><div className="elderly-detail-section-body emergency-contact-view-list">{emergencyContacts.map((contact) => <div className="relation-card" key={contact.id}><div><HeartHandshake size={18}/><span><b>{contact.name || "待补充"}</b><small>{contact.relation || "关系待补充"} · {contact.phone || "电话待补充"}</small></span></div></div>)}</div></section>
      </div>
    </div>}
    {tab === "family" && <FamilyRelationshipPanel relations={familyRelations} onUnlinkRelation={onUnlinkRelation}/>} 
    {tab === "reminders" && <ElderlyReminderPanel reminders={reminders} onCreate={onCreateReminder} onEdit={onEditReminder} onDelete={onDeleteReminder} onViewPlan={onViewReminderPlan}/>} 
    {tab === "spaces" && <section className="panel sensor-relation-panel elderly-detail-content"><div className="panel-title"><div><h3>房间与活动传感器</h3></div><div className="panel-title-actions"><button className="secondary-button" onClick={onManageSpaces}>管理房间</button><button className="primary-button" onClick={onAddSensor}><Plus size={15}/>添加传感器</button></div></div><div className="table-scroll"><table className="elderly-sensor-table"><thead><tr><th>设备名称</th><th>安装房间</th><th>设备型号 / SN</th><th>在线状态</th><th>最近上报</th><th>操作</th></tr></thead><tbody>{boundSensors.map((sensor) => <tr key={sensor.id}><td><b>{sensor.name}</b></td><td>{sensor.room}</td><td><div className="stacked-cell"><b>{sensor.model}</b><small>{sensor.sn}</small></div></td><td><StatusTag>{sensor.onlineStatus}</StatusTag></td><td>{sensor.lastReport}</td><td><button className="table-action" onClick={() => onViewSensor(sensor)}>详情</button></td></tr>)}{!boundSensors.length && <tr><td colSpan="6"><div className="empty-table-state">当前老人尚未绑定房间活动传感器</div></td></tr>}</tbody></table></div></section>} 
    {tab === "tablet" && <section className="panel tablet-detail-page elderly-detail-content">
      <div className="panel-title"><div><h3>平板设备</h3></div><button className="primary-button" onClick={onManageTablet}>{tabletActionLabel}</button></div>
      <div className="elderly-detail-section-body">
        {tablet ? <>
          <div className="tablet-profile-card"><span><MonitorSmartphone size={22}/></span><div><b>{tablet.model}</b><small>{tablet.id} · {tablet.sn}</small></div><TabletOnlineStatusTag>{tablet.onlineStatus}</TabletOnlineStatusTag></div>
          <div className="info-grid tablet-profile-info-grid">
            <div><span>设备编号</span><b>{tablet.id}</b></div><div><span>设备 SN</span><b>{tablet.sn}</b></div>
            <div><span>当前版本</span><b>{tablet.currentVersion}</b></div><div><span>版本状态</span><StatusTag>{tablet.versionStatus}</StatusTag></div>
            <div><span>激活状态</span><StatusTag>{tablet.activationStatus}</StatusTag></div><div><span>在线状态</span><TabletOnlineStatusTag>{tablet.onlineStatus}</TabletOnlineStatusTag></div>
            <div><span>激活时间</span><b>{tablet.boundAt || "—"}</b></div><div><span>最近在线</span><b>{tablet.lastOnline || "—"}</b></div>
          </div>
        </> : activation ? <div className={`tablet-activation-state-card ${activationFailed ? "is-error" : "is-pending"}`}>
          <div className="tablet-activation-state-heading">
            <span><MonitorSmartphone size={22}/></span>
            <div><b>{activationDevice?.model || "待激活设备"}</b><small>{formatDisplayId(activation.deviceId)} · {activation.deviceSn || activationDevice?.sn || "SN 待补充"}</small></div>
            <StatusTag>{activationStatus}</StatusTag>
          </div>
          <div className="info-grid tablet-profile-info-grid">
            <div><span>设备编号</span><b>{formatDisplayId(activation.deviceId)}</b></div><div><span>设备 SN</span><b>{activation.deviceSn || activationDevice?.sn || "—"}</b></div>
            <div><span>激活状态</span><StatusTag>{activationStatus}</StatusTag></div>{activation.code && <div><span>6 位激活码</span><b className="mono activation-code-value">{activation.code}</b></div>}
            {activation.createdAt && <div><span>生成时间</span><b>{activation.createdAt}</b></div>}
            {(activation.failureReason || activation.reason) && <div className="full"><span>失败原因</span><b>{activation.failureReason || activation.reason}</b></div>}
          </div>
          <div className="tablet-activation-state-message">{activationPending ? "完成激活后展示在线状态与使用数据" : "本次激活未完成，原激活码仍为待使用，请在指定平板上重试。"}</div>
        </div> : <div className="space-empty-state"><MonitorSmartphone size={28}/><h4>尚未绑定平板</h4><p>当前老人尚未绑定平板设备，可选择一台待激活设备并生成激活码。</p></div>}
      </div>
    </section>}
    {tab === "statistics" && <ElderlyDataStatisticsPanel record={record} sensors={boundSensors}/>} 
    </div></div>
    <footer><button className="secondary-button" onClick={onClose}>关闭</button><button className="primary-button" onClick={onEdit}>编辑档案</button></footer>
  </aside></div>;
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
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer space-drawer" role="dialog" aria-modal="true" aria-label="定义家庭空间"><header><div><h2>定义家庭空间</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="form-section"><h3>添加空间</h3><div className="space-add-row"><input value={roomName} onChange={(event) => setRoomName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addRoom()} placeholder="例如：客厅、卧室、厨房"/><button className="primary-button" onClick={addRoom}><Plus size={15}/>添加</button></div>{error && <small className="field-error space-error">{error}</small>}<h3>已定义空间</h3>{rooms.length ? <div className="defined-space-list">{rooms.map((room) => <div key={room}><span><Home size={17}/></span><b>{room}</b><StatusTag>已定义</StatusTag></div>)}</div> : <div className="space-empty-mini">暂未定义空间</div>}</div><div className="form-tip"><ShieldCheck size={18}/><div><b>空间与设备关系</b><p>保存空间后即可绑定对应房间的活动传感器。</p></div></div></div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={() => onSave(rooms)}>保存空间</button></footer></aside></div>;
}

function parseSingaporeAddress(record) {
  const rawAddress = record?.address === "待补充" ? "" : record?.address || "";
  const postalCode = record?.postalCode || rawAddress.match(/(?:Singapore|新加坡)\s*(\d{6})\s*$/i)?.[1] || "";
  const addressWithoutCountry = rawAddress
    .replace(/,?\s*(?:Singapore|新加坡)(?:\s*\d{6})?\s*$/i, "")
    .trim();
  const unitMatch = addressWithoutCountry.match(/\s+(#\d{1,3}-[A-Za-z0-9]+)\s*$/);
  const unitNumber = record?.unitNumber || unitMatch?.[1] || "";
  const streetAddress = record?.streetAddress || (unitMatch
    ? addressWithoutCountry.slice(0, unitMatch.index).trim()
    : addressWithoutCountry);

  return { streetAddress, unitNumber, postalCode };
}

function ElderlyDrawer({ mode: initialMode, record, projects, tablet, activation, onManageTablet, onClose, onSave }) {
  const [mode, setMode] = useState(initialMode);
  const [errors, setErrors] = useState({});
  const [tagDraft, setTagDraft] = useState("");
  const tagInputRef = useRef(null);
  const scopedProject = projects.find((project) => project.name === record?.project) || projects[0];
  const singaporeAddress = parseSingaporeAddress(record);
  const [form, setForm] = useState({
    name: record?.name || "",
    gender: record?.gender || "女",
    birthday: record?.birthday || "",
    phone: record?.phone || "",
    packageType: selectableElderlyPackages.some((item) => item.value === record?.packageType) ? record.packageType : "",
    project: record?.project || scopedProject?.name || "",
    community: record?.community || scopedProject?.name || "",
    streetAddress: singaporeAddress.streetAddress,
    unitNumber: singaporeAddress.unitNumber,
    postalCode: singaporeAddress.postalCode,
    tags: [...(record?.tags || [])],
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
  const addTags = (value = tagDraft) => {
    const nextTags = value.split(/[、,，]/).map((item) => item.trim()).filter(Boolean);
    if (!nextTags.length) return;
    setForm((current) => ({ ...current, tags: [...new Set([...current.tags, ...nextTags])] }));
    setTagDraft("");
  };
  const removeTag = (tag) => setForm((current) => ({
    ...current,
    tags: current.tags.filter((item) => item !== tag),
  }));
  const handleSave = () => {
    const requiredFields = {
      name: "请输入老人姓名",
      phone: "请输入联系电话",
      packageType: "请选择套餐类型",
      streetAddress: "请输入街道地址",
    };
    const nextErrors = Object.fromEntries(Object.entries(requiredFields).filter(([field]) => !form[field].trim()));
    if (form.postalCode.trim() && !/^\d{6}$/.test(form.postalCode.trim())) nextErrors.postalCode = "请输入 6 位新加坡邮政编码";
    const emergencyContactErrors = form.emergencyContacts.map((contact) => ({
      name: contact.name.trim() ? "" : "请输入联系人姓名",
      phone: contact.phone.trim() ? "" : "请输入紧急联系电话",
    }));
    if (!form.emergencyContacts.length) nextErrors.emergencyContacts = "请至少添加一位紧急联系人";
    if (emergencyContactErrors.some((contact) => contact.name || contact.phone)) nextErrors.emergencyContactItems = emergencyContactErrors;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const birthdayYear = Number(form.birthday.slice(0, 4));
    const rawUnitNumber = form.unitNumber.trim();
    const unitNumber = rawUnitNumber && !rawUnitNumber.startsWith("#") ? `#${rawUnitNumber}` : rawUnitNumber;
    const postalCode = form.postalCode.trim();
    const localAddress = [form.streetAddress.trim(), unitNumber].filter(Boolean).join(" ");
    const address = postalCode ? `${localAddress}, Singapore ${postalCode}` : localAddress;
    const pendingTags = tagDraft.split(/[、,，]/).map((item) => item.trim()).filter(Boolean);
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
      packageType: form.packageType,
      project: form.project,
      community: form.community.trim(),
      country: "新加坡",
      streetAddress: form.streetAddress.trim(),
      unitNumber,
      postalCode,
      address,
      rooms: record?.rooms || [],
      tags: [...new Set([...form.tags, ...pendingTags])],
      emergencyContacts,
      emergency: emergencyContacts[0],
    });
  };

  if (mode === "view") {
    const emergencyContacts = getEmergencyContacts(record);
    return (
      <div className="drawer-layer" role="presentation">
        <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
        <aside className="drawer record-detail-drawer elderly-record-detail-drawer" role="dialog" aria-modal="true" aria-label="老人档案详情">
          <header><h2>老人档案详情</h2><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
          <div className="drawer-body">
            <ArchiveSubjectSummary name={record.name} details={[record.gender, `${record.age} 岁`]}/>
            <section className="detail-section"><h3>基础资料</h3><div className="info-grid"><div><span>出生日期</span><b>{record.birthday}</b></div><div><span>联系电话</span><b>{record.phone || "待补充"}</b></div><div><span>所属社区</span><b>{record.community}</b></div><div className="full"><span>居住地址</span><b>{record.address}</b></div></div></section>
            <section className="detail-section">
              <div className="detail-section-title"><h3>老人平板绑定</h3><button className="text-button" onClick={onManageTablet}>{tablet ? "查看或解绑" : activation ? "查看激活详情" : "生成激活码"}</button></div>
              <div className="relation-card">
                <div><MonitorSmartphone size={18}/><span><b>{tablet ? `${tablet.model} · ${formatDisplayId(tablet.id)}` : activation ? `激活码 ${activation.code}` : "尚未生成平板激活信息"}</b><small>{tablet ? `6 位激活码 ${tablet.activationCode || "—"} · 绑定于 ${tablet.boundAt}` : activation ? `目标设备 ${formatDisplayId(activation.deviceId)} · ${activation.deviceSn || "SN 待补充"}` : "生成激活码后，由安装人员在老人平板上完成激活"}</small></span></div>
                <StatusTag>{tablet?.activationStatus || activation?.status || "待生成"}</StatusTag>
              </div>
            </section>
            <section className="detail-section"><h3>房间活动传感器</h3><div className="relation-card"><div><Home size={18}/><span><b>{record.rooms?.length ? `${record.rooms.length} 个已定义空间` : "尚未定义家庭空间"}</b><small>{record.rooms?.join("、") || "请先在老人详情页定义空间，再绑定活动传感器"}</small></span></div><StatusTag>{record.device || "未安装"}</StatusTag></div></section>
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
        <header><h2>{mode === "create" ? "新增老人" : "编辑老人档案"}</h2><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
        <div className="drawer-body">
          {mode === "edit" && record && (
            <ArchiveSubjectSummary name={record.name} details={[record.gender, `${record.age} 岁`]}/>
          )}
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
            <label><span>套餐类型 *</span><select className="select-control form-select-native" value={form.packageType} onChange={(event) => updateForm("packageType", event.target.value)}><option value="">请选择套餐类型</option>{selectableElderlyPackages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{record?.packageType === "unconfigured" && !form.packageType && <small className="field-help">历史套餐为未配置，请选择正式套餐后保存。</small>}{errors.packageType && <small className="field-error">{errors.packageType}</small>}</label>
            <h3>居住地址</h3>
            <div className="form-row">
              <label><span>国家 / 地区</span><input className="readonly-input" value="新加坡" readOnly/></label>
              <label><span>邮政编码</span><input inputMode="numeric" maxLength="6" value={form.postalCode} onChange={(event) => updateForm("postalCode", event.target.value.replace(/\D/g, ""))} placeholder="请输入 6 位邮政编码"/>{errors.postalCode && <small className="field-error">{errors.postalCode}</small>}</label>
            </div>
            <label><span>楼栋 / 街道地址 *</span><input value={form.streetAddress} onChange={(event) => updateForm("streetAddress", event.target.value)} placeholder="请输入楼栋或街道地址"/>{errors.streetAddress && <small className="field-error">{errors.streetAddress}</small>}</label>
            <label><span>单元号（选填）</span><input value={form.unitNumber} onChange={(event) => updateForm("unitNumber", event.target.value)} placeholder="例如：#08-31"/><small className="field-help">组屋或公寓请填写楼层与门牌号。</small></label>
            <h3>运营标签</h3>
            <div className="tag-editor-field">
              <span className="tag-editor-label">基础标签（选填）</span>
              <div className="tag-input-control" onClick={() => tagInputRef.current?.focus()}>
                {form.tags.map((tag) => <span className="tag-editor-chip" key={tag}>{tag}<button type="button" aria-label={`删除标签 ${tag}`} onClick={(event) => { event.stopPropagation(); removeTag(tag); }}><X size={12}/></button></span>)}
                <input ref={tagInputRef} aria-label="输入运营标签" value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} onKeyDown={(event) => { if (["Enter", ",", "，", "、"].includes(event.key)) { event.preventDefault(); addTags(); } else if (event.key === "Backspace" && !tagDraft && form.tags.length) { removeTag(form.tags.at(-1)); } }} placeholder={form.tags.length ? "" : "输入标签，按 Enter 添加"}/>
              </div>
            </div>
            <div className="emergency-section-heading">
              <div><h3>紧急联系人</h3></div>
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

function TabletBindingModal({ record, project, devices, activation, onGenerate, onClose, onUnbind }) {
  const currentTablet = devices.find((device) => device.boundElderlyId === record.id);
  const availableDevices = devices.filter((device) => !device.boundElderlyId);
  const [selectedId, setSelectedId] = useState(activation?.deviceId || "");
  const [stage, setStage] = useState(currentTablet ? "bound" : activation ? "waiting" : "generate");
  const [confirmUnbind, setConfirmUnbind] = useState(false);
  const [unbindError, setUnbindError] = useState("");
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
    setStage("waiting");
  };

  const steps = ["指定对象", "生成激活码"];
  const stageIndex = stage === "generate" ? 0 : steps.length;
  const locationReady = Boolean(record.address && record.address !== "待补充");
  const activationDevice = devices.find((device) => device.id === activation?.deviceId) || selectedDevice;
  const submitUnbind = () => {
    const result = onUnbind(currentTablet.id);
    if (result?.ok === false) setUnbindError(result.message);
  };

  return (
    <div className="modal-layer tablet-modal-layer">
      <button className="modal-backdrop" aria-label="关闭" onClick={onClose}/>
      <div className="tablet-binding-dialog" role="dialog" aria-modal="true">
        <header><div><h3>{currentTablet ? "平板绑定详情" : "激活老人平板"}</h3></div><button className="icon-button" onClick={onClose}><X size={18}/></button></header>
        <div className="tablet-dialog-body">
          {!currentTablet && <div className="activation-stepper">{steps.map((item, index) => <div className={index < stageIndex ? "done" : index === stageIndex ? "active" : ""} key={item}><i>{index < stageIndex ? "✓" : index + 1}</i><span>{item}</span></div>)}</div>}
          {currentTablet ? (
            <>
            <div className="current-binding-card">
              <div><MonitorSmartphone size={20}/><span><b>{currentTablet.model}</b><small>{formatDisplayId(currentTablet.id)} · {currentTablet.sn} · 最近登录 {currentTablet.lastOnline}</small></span></div>
              <StatusTag>{currentTablet.status}</StatusTag>
            </div>
            <div className="binding-audit-grid"><div><span>6 位激活码</span><b className="mono activation-code-value">{currentTablet.activationCode || "—"}</b></div><div><span>激活时间</span><b>{currentTablet.boundAt}</b></div></div>
            </>
          ) : stage === "generate" ? (
            <div className="activation-target-form">
              <div className="activation-target-heading"><span><MonitorSmartphone size={21}/></span><div><h4>指定激活对象</h4><p>激活码只允许下方老人和设备使用，生成后不能更换目标。</p></div></div>
              <div className="activation-target-grid">
                <label><span>指定老人</span><div className="activation-readonly-field"><b>{record.name}</b><small>{record.project}</small></div></label>
                <label><span>指定待激活设备</span><select className="select-control form-select-native" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">请选择待激活设备</option>{availableDevices.map((device) => <option key={device.id} value={device.id}>{formatDisplayId(device.id)} · {device.sn}</option>)}</select></label>
              </div>
              {selectedDevice && <div className="activation-device-preview"><div><span>目标设备编号</span><b>{formatDisplayId(selectedDevice.id)}</b></div><div><span>设备 SN</span><b>{selectedDevice.sn}</b></div><div><span>设备型号</span><b>{selectedDevice.model}</b></div><StatusTag>{selectedDevice.status}</StatusTag></div>}
              {!locationReady && <div className="activation-notice">老人居住地址尚未完整，不影响生成激活码；可稍后在老人档案中补充。</div>}
              <button className="primary-button activation-generate-button" disabled={!selectedDevice} onClick={generateActivation}>生成平板激活码</button>
            </div>
          ) : stage === "waiting" ? (
            <>
              <div className="activation-code-card"><div><span>6 位平板激活码</span><strong>{activation?.code || "------"}</strong><small>生成时间 {activation?.createdAt}</small></div><StatusTag>{isFailedTabletActivation(activation?.status) ? "待使用" : normalizeTabletActivationStatus(activation?.status) || "待使用"}</StatusTag></div>
              <div className="activation-device-preview"><div><span>指定老人</span><b>{record.name}</b></div><div><span>目标设备编号</span><b>{formatDisplayId(activation?.deviceId)}</b></div><div><span>设备 SN</span><b>{activation?.deviceSn || activationDevice?.sn}</b></div><div><span>设备型号</span><b>{activationDevice?.model || "—"}</b></div></div>
              {activation?.failureReason && <div className="activation-notice">上次激活失败：{activation.failureReason}。原激活码仍可由指定平板重新提交。</div>}
              <div className="binding-rule-note"><ShieldCheck size={17}/><p>激活码已生成，请在目标平板上输入该激活码完成使用。</p></div>
            </>
          ) : (
            null
          )}
          {confirmUnbind && <div className="unbind-warning"><b>确认解除当前平板？</b><p>解除后，该平板将退出当前老人首页，并不再展示该老人的子女、联系人、留言、提醒和其他个人内容。老人档案、子女账号与老人关系、历史记录及其他设备不受影响。</p>{unbindError && <div className="unbind-error" role="alert">{unbindError}原绑定关系已保留，请重试。</div>}</div>}
        </div>
        <footer>
          {currentTablet && !confirmUnbind && <button className="danger-outline-button" onClick={() => setConfirmUnbind(true)}>解除绑定</button>}
          {confirmUnbind ? <><button className="secondary-button" onClick={() => { setConfirmUnbind(false); setUnbindError(""); }}>取消</button><button className="danger-button" onClick={submitUnbind}>{unbindError ? "重试解除" : "确认解除"}</button></>
            : currentTablet ? <button className="secondary-button" onClick={onClose}>关闭</button>
              : stage === "waiting" ? <button className="primary-button" onClick={onClose}>关闭</button>
                : <button className="secondary-button" onClick={onClose}>关闭</button>}
        </footer>
      </div>
    </div>
  );
}

function ProjectDrawer({ project, adminMember, allMembers, onClose, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || "",
    country: project?.country || "新加坡",
    address: project?.address || "",
    contact: project?.contact || "",
    phone: project?.phone || "",
    adminUsername: adminMember?.username || "",
    adminName: adminMember?.name || "",
    adminPhone: adminMember?.phone || "+65 ",
    adminEmail: adminMember?.email || "",
  });
  const [errors, setErrors] = useState({});
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const save = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "请输入社区名称";
    if (!form.country.trim()) nextErrors.country = "请输入国家/地区";
    if (!form.address.trim()) nextErrors.address = "请输入项目详细地址";
    if (!form.adminUsername.trim()) nextErrors.adminUsername = "请输入账号名";
    else if (allMembers.some((member) => member.id !== adminMember?.id && member.username.toLowerCase() === form.adminUsername.trim().toLowerCase())) nextErrors.adminUsername = "该账号名已存在，请更换";
    if (!form.adminName.trim()) nextErrors.adminName = "请输入姓名";
    if (!/^\+65\s?\d{8}$/.test(form.adminPhone.trim())) nextErrors.adminPhone = "请输入 +65 开头的 8 位手机号";
    if (form.adminEmail.trim() && !/^\S+@\S+\.\S+$/.test(form.adminEmail.trim())) nextErrors.adminEmail = "请输入正确的邮箱地址";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const { adminUsername, adminName, adminPhone, adminEmail, ...projectForm } = form;
    const nextProject = Object.fromEntries(Object.entries({ ...project, ...projectForm }).filter(([key]) => key !== "weatherLocation").map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
    onSave(nextProject, { ...adminMember, username: adminUsername.trim(), name: adminName.trim(), phone: adminPhone.trim(), email: adminEmail.trim(), status: adminMember?.status || "已启用" });
  };
  return (
    <div className="drawer-layer">
      <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
      <aside className="drawer project-drawer" role="dialog" aria-modal="true">
        <header><h2>{project ? "编辑项目" : "新增项目"}</h2><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
        <div className="drawer-body"><div className="form-section">
          <h3>项目信息</h3>
          <label><span>社区名称 *</span><input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="请输入社区名称"/>{errors.name && <small className="field-error">{errors.name}</small>}</label>
          <h3>项目位置</h3>
          <label><span>国家/地区 *</span><input value={form.country} onChange={(event) => update("country", event.target.value)} placeholder="例如：新加坡"/>{errors.country && <small className="field-error">{errors.country}</small>}</label>
          <label><span>详细地址 *</span><input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="请输入项目服务点详细地址"/>{errors.address && <small className="field-error">{errors.address}</small>}</label>
          <h3>联系信息</h3>
          <div className="form-row"><label><span>项目联系人</span><input value={form.contact} onChange={(event) => update("contact", event.target.value)} placeholder="请输入联系人"/></label><label><span>联系电话</span><input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+65"/></label></div>
          <h3>项目管理员账号</h3>
          <div className="form-row"><label><span>账号名 *</span><input value={form.adminUsername} onChange={(event) => update("adminUsername", event.target.value)} placeholder="请输入登录账号"/>{errors.adminUsername && <small className="field-error">{errors.adminUsername}</small>}</label><label><span>姓名 *</span><input value={form.adminName} onChange={(event) => update("adminName", event.target.value)} placeholder="请输入姓名"/>{errors.adminName && <small className="field-error">{errors.adminName}</small>}</label></div>
          <div className="form-row"><label><span>手机号 *</span><input value={form.adminPhone} onChange={(event) => update("adminPhone", event.target.value)} placeholder="+65 9123 4567"/>{errors.adminPhone && <small className="field-error">{errors.adminPhone}</small>}</label><label><span>邮箱（选填）</span><input value={form.adminEmail} onChange={(event) => update("adminEmail", event.target.value)} placeholder="name@example.com"/>{errors.adminEmail && <small className="field-error">{errors.adminEmail}</small>}</label></div>
        </div></div>
        <footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={save}>保存项目</button></footer>
      </aside>
    </div>
  );
}

function ProjectPage({ projects, members, roles, onSave, onToggle, onSaveMember, onToggleMember }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(undefined);
  const [memberProjectId, setMemberProjectId] = useState("");
  const [toggleTarget, setToggleTarget] = useState(null);
  const filtered = projects.filter((project) => `${project.name}${project.contact}`.toLowerCase().includes(query.trim().toLowerCase()));
  const memberProject = projects.find((project) => project.id === memberProjectId);
  return (
    <>
      <div className="page-heading"><div><h1>项目与社区</h1><p>统一维护老人档案归属、项目位置和社区服务关系</p></div><button className="primary-button" onClick={() => setEditing(null)}><Plus size={16}/>新增项目</button></div>
      <section className="panel management-panel project-management">
        <div className="filters"><label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="社区名称或联系人"/></div></label></div>
        <div className="table-scroll"><table className="project-table"><thead><tr><th>社区名称</th><th>项目位置</th><th>联系人</th><th>状态</th><th className="sticky-right">操作</th></tr></thead><tbody>
          {filtered.map((project) => <tr key={project.id}><td><div className="project-name-cell"><span><Building2 size={17}/></span><div><b>{project.name}</b></div></div></td><td><div className="stacked-cell"><b>{project.address || "地址待补充"}</b><small>{project.country || "国家/地区待补充"}</small></div></td><td><div className="stacked-cell"><b>{project.contact || "待补充"}</b><small>{project.phone || "电话待补充"}</small></div></td><td><StatusTag>{project.status}</StatusTag></td><td className="sticky-right project-actions"><button className="table-action" onClick={() => setMemberProjectId(project.id)}>成员管理</button><button className="table-action" onClick={() => setEditing(project)}>编辑</button><button className={`table-action ${project.status === "启用" ? "danger-text" : ""}`} onClick={() => setToggleTarget(project)}>{project.status === "启用" ? "停用" : "启用"}</button></td></tr>)}
        </tbody></table></div>
        <div className="pagination"><span>当前展示 {filtered.length} 条数据</span></div>
      </section>
      {editing !== undefined && <ProjectDrawer project={editing} adminMember={members.find((member) => member.projectId === editing?.id && roles.find((role) => role.id === member.roleId)?.isAdmin)} allMembers={members} onClose={() => setEditing(undefined)} onSave={(project, adminMember) => { onSave(project, adminMember); setEditing(undefined); }}/>} 
      {memberProject && <CommunityMembersPage currentProject={memberProject} projects={projects} roles={roles} users={members} onClose={() => setMemberProjectId("")} onSave={onSaveMember} onToggle={onToggleMember}/>} 
      {toggleTarget && <AdminConfirm
        title={`确认${toggleTarget.status === "启用" ? "停用" : "启用"}「${toggleTarget.name}」？`}
        description={toggleTarget.status === "启用" ? "停用后该社区运营入口不可用，相关社区后台用户不能继续进入该社区。" : "启用后将恢复该社区的运营入口及相关后台账号访问。"}
        impacts={toggleTarget.status === "启用" ? ["老人档案、设备绑定和历史业务记录保留，不做删除。", "后续可通过重新启用恢复运营入口。"] : []}
        danger={toggleTarget.status === "启用"}
        confirmLabel={`确认${toggleTarget.status === "启用" ? "停用" : "启用"}`}
        loadingLabel={`${toggleTarget.status === "启用" ? "停用" : "启用"}中…`}
        onClose={() => setToggleTarget(null)}
        onConfirm={async () => { await onToggle(toggleTarget.id); setToggleTarget(null); }}
      />}
    </>
  );
}

function DeviceManagementPage({ deviceType, tablets, sensors, elderlyRecords, currentProject, onAddTablet, onViewTablet, onManageTablet, onAddSensor, onViewSensor }) {
  const [query, setQuery] = useState("");
  const [project, setProject] = useState("全部项目");
  const [status, setStatus] = useState("全部状态");
  const [activationStatus, setActivationStatus] = useState("全部激活状态");
  const [onlineStatus, setOnlineStatus] = useState("全部在线状态");
  const projectOptions = ["全部项目", ...new Set([currentProject?.name, ...elderlyRecords.map((record) => record.project)].filter(Boolean))];
  const filteredTablets = tablets.filter((device) => {
    const elderly = elderlyRecords.find((record) => record.id === device.boundElderlyId);
    const keywordMatched = `${device.id}${device.model}${elderly?.name || ""}`.toLowerCase().includes(query.trim().toLowerCase());
    const projectMatched = project === "全部项目" || (device.projectId ? device.projectId === currentProject?.id && project === currentProject?.name : elderly?.project === project);
    const activationMatched = activationStatus === "全部激活状态" || device.activationStatus === activationStatus;
    const onlineMatched = onlineStatus === "全部在线状态" || device.onlineStatus === onlineStatus;
    return keywordMatched && projectMatched && activationMatched && onlineMatched;
  });
  const filteredSensors = sensors.filter((device) => {
    const elderly = elderlyRecords.find((record) => record.id === device.elderlyId);
    return `${device.id}${device.sn}${device.name}${elderly?.name || ""}${device.room}`.toLowerCase().includes(query.trim().toLowerCase()) && (status === "全部状态" || device.onlineStatus === status || device.installStatus === status);
  });
  const resetFilters = () => { setQuery(""); setProject("全部项目"); setStatus("全部状态"); setActivationStatus("全部激活状态"); setOnlineStatus("全部在线状态"); };
  const statuses = ["全部状态", "在线", "离线", "待安装", "待校验", "已安装", "已解绑"];
  return (
    <>
      <div className="page-heading"><div><h1>{deviceType === "tablet" ? "平板设备" : "房间活动传感器"}</h1><p>{deviceType === "tablet" ? "维护平板资产、老人绑定、激活和在线状态" : "录入传感器、绑定老人和安装房间并完成设备校验"}</p></div><button className="primary-button" onClick={deviceType === "tablet" ? onAddTablet : onAddSensor}><Plus size={16}/>{deviceType === "tablet" ? "录入平板" : "添加传感器"}</button></div>
      <section className="panel management-panel device-management-panel">
        <div className="filters device-filters">
          <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={deviceType === "tablet" ? "设备编号、型号或老人姓名" : "设备名称、SN、老人或房间"}/></div></label>
          {deviceType === "tablet" && <label><span>所属项目</span><select className="select-control filter-select wide" value={project} onChange={(event) => setProject(event.target.value)}>{projectOptions.map((item) => <option key={item}>{item}</option>)}</select></label>}
          {deviceType === "tablet" ? <><label><span>激活状态</span><select className="select-control filter-select" value={activationStatus} onChange={(event) => setActivationStatus(event.target.value)}><option>全部激活状态</option><option>已激活</option><option>待激活</option></select></label><label><span>在线状态</span><select className="select-control filter-select" value={onlineStatus} onChange={(event) => setOnlineStatus(event.target.value)}><option>全部在线状态</option><option>在线</option><option>离线</option></select></label></> : <label><span>状态</span><select className="select-control filter-select" value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>}
          <div className="filter-actions"><button className="primary-button"><Search size={15}/>查询</button><button className="secondary-button" onClick={resetFilters}><RefreshCw size={15}/>重置</button></div>
        </div>
        {deviceType === "sensor" && <div className="table-toolbar"><div><span className="result-count">共 {filteredSensors.length} 台设备</span><span className="toolbar-hint">只有通过安装校验的设备才进入房间活动统计</span></div></div>}
        <div className="table-scroll">
          {deviceType === "tablet" ? <table className="device-table tablet-device-table"><thead><tr><th>设备编号 / 型号</th><th>绑定老人</th><th>版本信息</th><th>网络信息</th><th>版本状态</th><th>激活状态</th><th>在线状态</th><th>绑定时间</th><th className="sticky-right">操作</th></tr></thead><tbody>
            {filteredTablets.map((device) => { const elderly = elderlyRecords.find((record) => record.id === device.boundElderlyId); return <tr key={device.id}><td><div className="device-name-cell"><span><MonitorSmartphone size={17}/></span><div><b>{formatDisplayId(device.id)}</b><small>{device.model}</small></div></div></td><td>{elderly ? <div className="stacked-cell"><b>{elderly.name}</b></div> : <span className="muted-value">未绑定</span>}</td><td><div className="stacked-cell mono"><b>ROM {device.romVersion}</b><small>APK {device.apkVersion}</small></div></td><td><div className="stacked-cell"><b>{device.networkType}</b><small>{device.ipAddress}</small></div></td><td><StatusTag>{device.versionStatus}</StatusTag></td><td><StatusTag>{device.activationStatus}</StatusTag></td><td><TabletOnlineStatusTag>{device.onlineStatus}</TabletOnlineStatusTag></td><td>{device.boundAt || "—"}</td><td className="sticky-right"><button className="table-action" onClick={() => onViewTablet(device)}>详情</button>{elderly && <button className="table-action" onClick={() => onManageTablet(elderly)}>管理绑定</button>}</td></tr>; })}
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

const recommendationScheduleOverrideStorageKey = "u2g-right-recommendation-schedule-overrides-v1";
const reminderPolicyStatusStorageKey = "u2g-reminder-policy-status-v1";

const initialReminderPolicies = [
  { id: "RP-CONTENT-ANNOUNCEMENT", group: "内容发布提醒", source: "社区公告", trigger: "公告发布成功后自动生成提醒", terminals: ["老人中控屏"], priority: "中", lastTriggeredAt: "2026-08-21 09:20", icon: "公告", enabled: true },
  { id: "RP-CONTENT-LIFE", group: "内容发布提醒", source: "生活资讯", trigger: "资讯发布成功后自动生成提醒", terminals: ["老人中控屏"], priority: "低", lastTriggeredAt: "2026-08-20 16:45", icon: "资讯", enabled: true },
  { id: "RP-CONTENT-ALERT", group: "内容发布提醒", source: "警惕事项", trigger: "事项发布成功后自动生成提醒", terminals: ["老人中控屏", "老人小程序", "子女手机端"], priority: "高", lastTriggeredAt: "2026-08-21 08:35", icon: "警示", enabled: true },
  { id: "RP-CONTENT-ACTIVITY", group: "内容发布提醒", source: "社区活动", trigger: "活动发布成功后自动生成提醒", terminals: ["老人中控屏", "老人小程序"], priority: "低", lastTriggeredAt: "2026-08-18 14:10", icon: "活动", enabled: true },
  { id: "RP-EVENT-CALL", group: "事件触发提醒", source: "新来电", trigger: "老人端产生未接来电后自动提醒", terminals: ["老人中控屏"], priority: "中", lastTriggeredAt: "2026-08-21 10:02", icon: "来电", enabled: true },
  { id: "RP-EVENT-ACTIVITY-START", group: "事件触发提醒", source: "活动开始提醒", trigger: "社区活动报名成功且活动未取消，在活动开始前30分钟自动提醒报名人；活动取消、报名取消或活动已开始时不触发；同一报名仅提醒一次。", terminals: ["老人中控屏", "老人小程序"], priority: "中", lastTriggeredAt: "2026-08-21 09:55", icon: "活动前", enabled: true },
  { id: "RP-EVENT-MESSAGE", group: "事件触发提醒", source: "未读留言", trigger: "收到留言且老人尚未查看时自动提醒", terminals: ["老人中控屏", "老人小程序", "子女手机端"], priority: "中", lastTriggeredAt: "2026-08-21 09:48", icon: "留言", enabled: true },
  { id: "RP-EVENT-SCHEDULE", group: "事件触发提醒", source: "到期日程", trigger: "日程到达预设提醒时间时自动提醒", terminals: ["老人中控屏", "老人小程序", "子女手机端"], priority: "高", lastTriggeredAt: "2026-08-21 08:00", icon: "日程", enabled: true },
  { id: "RP-EVENT-ALBUM", group: "事件触发提醒", source: "新相册内容", trigger: "家庭相册新增内容后自动提醒", terminals: ["老人中控屏", "老人小程序"], priority: "低", lastTriggeredAt: "2026-08-19 20:12", icon: "相册", enabled: true },
  { id: "RP-FALLBACK-AI-VOICE", group: "兜底展示", source: "AI语音兜底", trigger: "老人中控屏当前无任何待展示消息时持续展示AI语音入口；任一消息进入立即让位，消息队列清空后恢复展示；不进入消息队列，不产生未读或待处理状态，也不计入消息送达。", terminals: ["老人中控屏"], priority: "兜底", lastTriggeredAt: "", icon: "AI", enabled: true, fixed: true, queueExcluded: true },
];

const reminderSourceIcons = {
  "社区公告": Bell,
  "生活资讯": BookOpen,
  "警惕事项": AlertTriangle,
  "社区活动": CalendarDays,
  "新来电": RadioTower,
  "活动开始提醒": CalendarDays,
  "未读留言": MessageSquareText,
  "到期日程": CalendarDays,
  "新相册内容": Images,
  "AI语音兜底": Sparkles,
};

function ReminderSourceIcon({ source }) {
  const SourceIcon = reminderSourceIcons[source] || Bell;
  return <span className="policy-source-icon" aria-hidden="true"><SourceIcon size={18} strokeWidth={1.8}/></span>;
}

function ReminderPoliciesPage({ policies, onToggle }) {
  const [toggleTarget, setToggleTarget] = useState(null);
  const coveredTerminals = [...new Set(policies.flatMap((item) => item.terminals))];
  const enabledCount = policies.filter((item) => item.enabled).length;
  const contentCount = policies.filter((item) => item.group === "内容发布提醒").length;
  const eventCount = policies.filter((item) => item.group === "事件触发提醒").length;
  const fallbackCount = policies.filter((item) => item.group === "兜底展示").length;
  const priorityRank = { 高: 0, 中: 1, 低: 2, 兜底: 3 };
  const rows = [...policies].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || (a.group === b.group ? 0 : a.group === "事件触发提醒" ? -1 : 1) || String(b.lastTriggeredAt || "").localeCompare(String(a.lastTriggeredAt || "")));
  return <>
    <div className="page-heading"><div><h1>消息推送</h1><p>管理平台自动消息的触发规则、推送终端与启停状态</p></div></div>
    <div className="reminder-policy-overview">
      <div><div className="admin-metric-heading"><span>推送规则</span><MetricHelp label="推送规则指标说明" content={`内容发布 ${contentCount} 项 · 事件触发 ${eventCount} 项 · 兜底展示 ${fallbackCount} 项`}/></div><b>{policies.length}</b></div>
      <div><div className="admin-metric-heading"><span>已启用</span><MetricHelp label="已启用指标说明" content="当前处于启用状态的固定推送规则数量"/></div><b>{enabledCount}</b></div>
      <div><div className="admin-metric-heading"><span>覆盖终端</span><MetricHelp label="覆盖终端指标说明" content={coveredTerminals.join("、")}/></div><b>{coveredTerminals.length}</b></div>
    </div>
    <section className="panel management-panel reminder-policy-panel">
      <div className="panel-title"><div><h3>固定推送规则</h3><p>规则字段由系统固定；非系统固定规则可由平台启停，社区不可覆盖</p></div><span>{rows.length} 项</span></div>
      <div className="table-scroll"><table className="reminder-policy-table"><thead><tr><th>消息来源</th><th><div className="admin-metric-heading"><span>消息类型</span><MetricHelp label="消息类型说明" content="内容发布：对应内容发布成功后自动触发；事件触发：业务事件发生或达到预设提醒时间时自动触发；兜底展示：没有待展示消息时由系统持续提供入口，不进入消息队列。"/></div></th><th>触发条件</th><th><div className="admin-metric-heading"><span>优先级</span><MetricHelp label="优先级排序说明" content="按高、中、低、兜底处理；同级先事件触发、后内容发布，再按触发时间，完全同时间按固定来源顺序。多条同时触发全部入队，不合并、不覆盖、不丢弃；兜底展示不进入队列。"/></div></th><th>推送终端</th><th>状态</th><th className="sticky-right">操作</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><div className="policy-source-cell"><ReminderSourceIcon source={item.source}/><div><b>{item.source}</b></div></div></td><td><span className={`reminder-type-tag ${item.group === "事件触发提醒" ? "reminder-type-tag--event" : item.group === "兜底展示" ? "reminder-type-tag--fallback" : "reminder-type-tag--content"}`}>{item.group.replace("提醒", "")}</span></td><td>{item.trigger}</td><td><span className={`reminder-priority-tag priority-${item.priority}`}>{item.priority}</span></td><td><div className="reminder-terminal-tags">{item.terminals.map((terminal) => <span key={terminal}>{terminal}</span>)}</div></td><td><StatusTag>{item.enabled ? "已启用" : "已停用"}</StatusTag></td><td className="sticky-right reminder-policy-actions">{item.fixed ? <span className="muted-action">系统固定</span> : <button className={`table-action ${item.enabled ? "danger-text" : ""}`} onClick={() => setToggleTarget(item)}>{item.enabled ? "停用" : "启用"}</button>}</td></tr>)}</tbody></table></div>
    </section>
    {toggleTarget && <AdminConfirm
      title={`${toggleTarget.enabled ? "停用" : "启用"}“${toggleTarget.source}”？`}
      description={toggleTarget.enabled ? "停用后，该能力将停止处理新的触发条件。" : "重新启用后，该能力只对新的触发条件生效。"}
      impacts={toggleTarget.enabled
        ? [`覆盖终端：${toggleTarget.terminals.join("、")}`, "停止生成新的提醒，并取消尚未发送的未来提醒。", "已生成或已送达的提醒记录继续保留。"]
        : [`覆盖终端：${toggleTarget.terminals.join("、")}`, "仅对重新启用后的新触发生效。", "停用期间未生成或已取消的提醒不会补发。"]}
      danger={toggleTarget.enabled}
      confirmLabel={`确认${toggleTarget.enabled ? "停用" : "启用"}`}
      onClose={() => setToggleTarget(null)}
      onConfirm={() => { onToggle(toggleTarget.id); setToggleTarget(null); }}
    />}
  </>;
}

function RecommendationDayScheduleDrawer({ mode, date, record, strategies, scheduledIds, onClose, onSave }) {
  const candidates = sortRecommendations(strategies.filter((item) => item.enabled && !item.sourceUnavailable && (!scheduledIds.includes(item.id) || item.id === record?.id)));
  const [itemId, setItemId] = useState(record?.id || candidates[0]?.id || "");
  const selectedItem = strategies.find((item) => item.id === itemId);
  const [durationSeconds, setDurationSeconds] = useState(record?.dayDurationSeconds || record?.durationSeconds || candidates[0]?.durationSeconds || 20);
  const [afterView, setAfterView] = useState(record?.dayAfterView || record?.afterView || candidates[0]?.afterView || "continue");
  const [saveError, setSaveError] = useState("");
  const save = () => {
    const duration = Number(durationSeconds);
    if (!selectedItem) { setSaveError("请选择推荐内容"); return; }
    if (!Number.isFinite(duration) || duration < 5 || duration > 300) { setSaveError("当天展示时长需为 5–300 秒"); return; }
    setSaveError("");
    const saved = onSave({ itemId: selectedItem.id, durationSeconds: duration, afterView });
    if (saved === false) setSaveError("保存失败，请保留当前内容后重试");
  };
  return <AdminDrawer title={`${mode === "edit" ? "编辑" : "新增"}${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日排期`} className="recommendation-schedule-drawer" onClose={onClose} footer={<><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" disabled={!selectedItem} onClick={save}>保存当天排期</button></>}>
    <div className="form-section"><h3>当天展示参数</h3><div className="form-row"><label><span>推荐内容 *</span><select className="select-control form-select-native" value={itemId} disabled={mode === "edit"} onChange={(event) => { const nextId = event.target.value; const nextItem = strategies.find((item) => item.id === nextId); setItemId(nextId); setDurationSeconds(nextItem?.durationSeconds || 20); setAfterView(nextItem?.afterView || "continue"); }}>{candidates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
      {!candidates.length && <div className="form-tip">当前没有可加入的启用内容，请先在“内容管理”中启用内容。</div>}
      {selectedItem && <div className="recommendation-schedule-source"><span>内容来源</span><b>{selectedItem.sourceName || "未关联内容"}</b><small>{recommendationTypes.find((option) => option.key === selectedItem.type)?.label} · 全局有效期 {selectedItem.startsAt.slice(0, 10)} 至 {selectedItem.endsAt.slice(0, 10)}</small></div>}
      <div className="form-row"><label><span>当天单次展示时长 *</span><div className="input-suffix"><input type="number" min="5" max="300" value={durationSeconds} onChange={(event) => setDurationSeconds(event.target.value)}/><em>秒</em></div></label><label><span>当天轮换参数 *</span><select className="select-control form-select-native" value={afterView} onChange={(event) => setAfterView(event.target.value)}><option value="continue">查看后继续轮换</option><option value="exit">查看后退出推荐</option></select></label></div>
      {saveError && <small className="field-error" role="alert">{saveError}</small>}
      <div className="form-tip"><b>仅修改当天排期</b><span>本次保存不会改动内容管理中的全局有效期、启用状态或默认展示参数。</span></div>
    </div>
  </AdminDrawer>;
}

function RecommendationStrategyPage({ strategies, reminderPolicies, communityName, acceptanceScenario = "normal", onCreate, onEdit, onToggle, onMove }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("全部类型");
  const [status, setStatus] = useState("全部状态");
  const [calendarMonth, setCalendarMonth] = useState({ year: 2026, month: 7 });
  const [calendarMode, setCalendarMode] = useState("month");
  const [selectedDate, setSelectedDate] = useState(recommendationMockNow.slice(0, 10));
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false);
  const [activeView, setActiveView] = useState("calendar");
  const [scheduleOverrides, setScheduleOverrides] = useState(() => {
    try {
      const saved = window.localStorage.getItem(recommendationScheduleOverrideStorageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [scheduleDrawer, setScheduleDrawer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [scheduleToast, setScheduleToast] = useState(null);
  const [calendarDrag, setCalendarDrag] = useState(null);
  const [calendarDropState, setCalendarDropState] = useState(null);
  const [daySortDrag, setDaySortDrag] = useState(null);
  const sortedStrategies = sortRecommendations(strategies);
  const todayKey = recommendationMockNow.slice(0, 10);
  const weekDays = buildRecommendationWeek(selectedDate);
  const calendarDays = calendarMode === "month" ? buildRecommendationCalendar(calendarMonth.year, calendarMonth.month) : weekDays;
  const calendarTitle = calendarMode === "month" ? `${calendarMonth.year} 年 ${calendarMonth.month + 1} 月` : formatRecommendationWeekRange(weekDays);
  const selectedIsToday = selectedDate === todayKey;
  useEffect(() => {
    try {
      window.localStorage.setItem(recommendationScheduleOverrideStorageKey, JSON.stringify(scheduleOverrides));
    } catch {
      // 原型环境禁用存储时保留当前会话状态。
    }
  }, [scheduleOverrides]);
  useEffect(() => {
    if (!scheduleToast) return undefined;
    const timer = window.setTimeout(() => setScheduleToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [scheduleToast]);
  const defaultDayConfigs = (date) => (acceptanceScenario === "empty" ? [] : getRecommendationDayItems(sortedStrategies, date).map((item) => ({ itemId: item.id, durationSeconds: item.durationSeconds, afterView: item.afterView })));
  const dayConfigs = (date, overrides = scheduleOverrides) => acceptanceScenario === "empty"
    ? []
    : (Object.prototype.hasOwnProperty.call(overrides, date) ? overrides[date] : defaultDayConfigs(date));
  const dayItems = (date, overrides = scheduleOverrides) => dayConfigs(date, overrides).map((config) => {
    const item = strategies.find((candidate) => candidate.id === config.itemId);
    return item ? { ...item, dayDurationSeconds: config.durationSeconds, dayAfterView: config.afterView } : null;
  }).filter(Boolean);
  const automaticDayItems = (date) => date === todayKey ? reminderPolicies.map((policy, index) => ({ id: `AUTO-${policy.id}`, automatic: true, policy, name: `${policy.source}自动提醒`, sourceName: policy.trigger, type: ["社区公告", "新来电", "未读留言", "到期日程", "新相册内容"].includes(policy.source) ? "announcement" : policy.source === "生活资讯" ? "life_info" : policy.source === "警惕事项" ? "alert" : "activity", displayOrder: 90 + index })) : [];
  const selectedScheduledItems = dayItems(selectedDate);
  const selectedDayItems = [...selectedScheduledItems, ...automaticDayItems(selectedDate)];
  const toDayConfig = (item) => ({ itemId: item.id, durationSeconds: item.dayDurationSeconds ?? item.durationSeconds, afterView: item.dayAfterView ?? item.afterView });
  const setDayItems = (date, items) => setScheduleOverrides((current) => ({ ...current, [date]: items.map(toDayConfig) }));
  const selectedDateLabel = `${Number(selectedDate.slice(5, 7))}月${Number(selectedDate.slice(8, 10))}日`;
  const sevenDayCoverage = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2026, 7, 21 + index);
    const key = formatRecommendationDate(date.getFullYear(), date.getMonth(), date.getDate());
    return dayItems(key).length;
  });
  const displayedSevenDayCoverage = sevenDayCoverage;
  const todayAvailableCount = dayItems(todayKey).filter((item) => getRecommendationAvailability(item) === "可展示").length;
  const moveCalendarPeriod = (offset) => {
    const next = calendarMode === "month"
      ? new Date(calendarMonth.year, calendarMonth.month + offset, 1)
      : new Date(`${selectedDate}T12:00:00`);
    if (calendarMode === "week") next.setDate(next.getDate() + offset * 7);
    const nextMonth = { year: next.getFullYear(), month: next.getMonth() };
    setCalendarMonth(nextMonth);
    setSelectedDate(formatRecommendationDate(nextMonth.year, nextMonth.month, next.getDate()));
    setDateFilterEnabled(false);
  };
  const goToRecommendationToday = () => {
    const today = new Date(`${todayKey}T12:00:00`);
    setCalendarMonth({ year: today.getFullYear(), month: today.getMonth() });
    setSelectedDate(todayKey);
    setDateFilterEnabled(false);
  };
  const changeCalendarMode = (mode) => {
    setCalendarMode(mode);
    const selected = new Date(`${selectedDate}T12:00:00`);
    setCalendarMonth({ year: selected.getFullYear(), month: selected.getMonth() });
  };
  const manageDate = (date) => {
    setSelectedDate(date);
  };
  const openAddSchedule = (date) => {
    setSelectedDate(date);
    setScheduleDrawer({ mode: "add", date });
  };
  const openEditSchedule = (date, item) => {
    setSelectedDate(date);
    setScheduleDrawer({ mode: "edit", date, itemId: item.id });
  };
  const saveDaySchedule = (input) => {
    const date = scheduleDrawer.date;
    const currentItems = dayItems(date);
    const source = strategies.find((item) => item.id === input.itemId);
    if (!source) return false;
    const nextItem = { ...source, dayDurationSeconds: input.durationSeconds, dayAfterView: input.afterView };
    const nextItems = scheduleDrawer.mode === "edit"
      ? currentItems.map((item) => item.id === input.itemId ? nextItem : item)
      : [...currentItems, nextItem];
    setDayItems(date, nextItems);
    setScheduleDrawer(null);
    setScheduleToast({ message: `${source.name}的当天排期已${scheduleDrawer.mode === "edit" ? "更新" : "新增"}` });
    return true;
  };
  const reorderDayItem = (date, itemId, offset) => {
    const items = dayItems(date);
    const index = items.findIndex((item) => item.id === itemId);
    const nextIndex = Math.max(0, Math.min(items.length - 1, index + offset));
    if (index < 0 || index === nextIndex) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(nextIndex, 0, moved);
    setDayItems(date, next);
    setScheduleToast({ message: `已调整${selectedDateLabel}的展示顺序` });
  };
  const moveDayItemToDate = (sourceDate, targetDate, itemId) => {
    if (sourceDate === targetDate) {
      setScheduleToast({ message: "请选择其他日期，原日期排期未变" });
      return false;
    }
    const sourceItems = dayItems(sourceDate);
    const targetItems = dayItems(targetDate);
    const moved = sourceItems.find((item) => item.id === itemId);
    if (!moved || targetItems.some((item) => item.id === itemId)) {
      setScheduleToast({ message: targetItems.some((item) => item.id === itemId) ? "目标日期已有相同内容，无法重复排期" : "未找到需要移动的当天排期" });
      return false;
    }
    setScheduleOverrides((current) => ({ ...current, [sourceDate]: sourceItems.filter((item) => item.id !== itemId).map(toDayConfig), [targetDate]: [...targetItems, moved].map(toDayConfig) }));
    setSelectedDate(targetDate);
    setScheduleToast({ message: `已将“${moved.name}”移至${Number(targetDate.slice(5, 7))}月${Number(targetDate.slice(8, 10))}日` });
    return true;
  };
  const moveDayItemByKeyboard = (date, itemId, offset) => {
    const target = new Date(`${date}T12:00:00`);
    target.setDate(target.getDate() + offset);
    moveDayItemToDate(date, formatRecommendationDate(target.getFullYear(), target.getMonth(), target.getDate()), itemId);
  };
  const confirmDeleteSchedule = () => {
    const items = dayItems(deleteTarget.date);
    const index = items.findIndex((item) => item.id === deleteTarget.itemId);
    const deleted = items[index];
    if (!deleted) return;
    setDayItems(deleteTarget.date, items.filter((item) => item.id !== deleteTarget.itemId));
    setScheduleToast({ message: `已删除${Number(deleteTarget.date.slice(5, 7))}月${Number(deleteTarget.date.slice(8, 10))}日的“${deleted.name}”`, undo: { date: deleteTarget.date, index, config: toDayConfig(deleted) } });
    setDeleteTarget(null);
  };
  const undoDeleteSchedule = () => {
    const undo = scheduleToast?.undo;
    if (!undo) return;
    const items = dayItems(undo.date);
    const source = strategies.find((item) => item.id === undo.config.itemId);
    if (!source) return;
    const next = [...items];
    next.splice(Math.min(undo.index, next.length), 0, { ...source, dayDurationSeconds: undo.config.durationSeconds, dayAfterView: undo.config.afterView });
    setDayItems(undo.date, next);
    setSelectedDate(undo.date);
    setScheduleToast({ message: "已撤销删除，当天排期已恢复" });
  };
  const handleChipKeyDown = (event, date, item, index) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      moveDayItemByKeyboard(date, item.id, event.key === "ArrowLeft" ? -1 : 1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      reorderDayItem(date, item.id, event.key === "ArrowUp" ? -1 : 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      openEditSchedule(date, item);
    } else if (event.key === "Delete") {
      event.preventDefault();
      setDeleteTarget({ date, itemId: item.id, name: item.name });
    }
  };
  const rows = sortedStrategies.filter((item) => {
    const keyword = query.trim().toLowerCase();
    const availability = getRecommendationAvailability(item);
    return (!keyword || `${item.name}${item.id}${item.sourceName}${item.sourceId}`.toLowerCase().includes(keyword))
      && (type === "全部类型" || item.type === type)
      && (status === "全部状态" || availability === status)
      && (!dateFilterEnabled || isRecommendationScheduledForDate(item, selectedDate));
  });

  return (
    <>
      <div className="page-heading"><div><h1>推荐策略</h1><p>配置老人端推荐内容的展示顺序、有效时间与轮换参数</p></div>{activeView === "content" && <button className="primary-button" onClick={() => onCreate()}><Plus size={16}/>新增推荐内容</button>}</div>
      <div className="recommendation-calendar-summary"><div><div className="admin-metric-heading"><span>当前可展示</span><MetricHelp label="当前可展示指标说明" content="当前启用且处于生效时间的内容"/></div><b>{todayAvailableCount}<small>条</small></b></div><div><div className="admin-metric-heading"><span>未来 7 天有排期</span><MetricHelp label="未来 7 天有排期指标说明" content="未来7天至少有1条有效内容的天数"/></div><b>{displayedSevenDayCoverage.filter(Boolean).length}<small>天</small></b></div><div className={displayedSevenDayCoverage.some((count) => !count) ? "warning" : ""}><div className="admin-metric-heading"><span>未来 7 天无排期</span><MetricHelp label="未来 7 天无排期指标说明" content="未来7天没有有效内容的天数"/></div><b>{displayedSevenDayCoverage.filter((count) => !count).length}<small>天</small></b></div></div>
      <div className="service-module-tabs recommendation-view-tabs" role="tablist" aria-label="推荐策略视图"><button type="button" role="tab" aria-selected={activeView === "calendar"} className={activeView === "calendar" ? "active" : ""} onClick={() => setActiveView("calendar")}>排期日历</button><button type="button" role="tab" aria-selected={activeView === "content"} className={activeView === "content" ? "active" : ""} onClick={() => { setActiveView("content"); setDateFilterEnabled(false); }}>内容管理 <small>{strategies.length}</small></button></div>
      {activeView === "calendar" && <section className="panel recommendation-calendar-panel"><div className={`recommendation-calendar-layout ${calendarMode === "week" ? "week-view" : "month-view"}`}>
          <div className="recommendation-calendar-box">
            <div className="recommendation-calendar-toolbar"><div className="recommendation-calendar-navigation"><button type="button" aria-label={calendarMode === "month" ? "上个月" : "上一周"} onClick={() => moveCalendarPeriod(-1)}><ChevronLeft size={16}/></button><b>{calendarTitle}</b><button type="button" aria-label={calendarMode === "month" ? "下个月" : "下一周"} onClick={() => moveCalendarPeriod(1)}><ChevronRight size={16}/></button></div><div className="recommendation-calendar-toolbar-actions"><button type="button" className="recommendation-calendar-today" aria-label="回到今天" onClick={goToRecommendationToday}>今天</button><div className="recommendation-calendar-mode" role="group" aria-label="日历显示方式"><button type="button" aria-pressed={calendarMode === "week"} className={calendarMode === "week" ? "active" : ""} onClick={() => changeCalendarMode("week")}>周</button><button type="button" aria-pressed={calendarMode === "month"} className={calendarMode === "month" ? "active" : ""} onClick={() => changeCalendarMode("month")}>月</button></div></div></div>
            <div className="recommendation-calendar-weekdays">{["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((item) => <span key={item}>{item}</span>)}</div>
            <div className={`recommendation-calendar-grid ${calendarMode === "week" ? "week" : "month"}`}>{calendarDays.map((date, index) => {
              if (!date) return <span className="calendar-blank" key={`blank-${index}`}/>;
              const scheduledItems = dayItems(date);
              const items = [...scheduledItems, ...automaticDayItems(date)];
              const count = items.length;
              const hasNoSchedule = scheduledItems.length === 0;
              const isDropTarget = calendarDropState?.date === date;
              return <div key={date} role="button" tabIndex="0" aria-label={`查看 ${date} 推荐内容，共${count}条`} className={`recommendation-calendar-day ${date === selectedDate ? "selected" : ""} ${date === todayKey ? "today" : ""} ${isDropTarget ? calendarDropState.invalid ? "drop-invalid" : "drop-target" : ""}`} onClick={() => manageDate(date)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); manageDate(date); } }} onDragOver={(event) => { if (!calendarDrag) return; event.preventDefault(); const invalid = calendarDrag.sourceDate === date || items.some((item) => item.id === calendarDrag.itemId); event.dataTransfer.dropEffect = invalid ? "none" : "move"; setCalendarDropState({ date, invalid }); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setCalendarDropState(null); }} onDrop={(event) => { event.preventDefault(); if (calendarDrag && !calendarDropState?.invalid) moveDayItemToDate(calendarDrag.sourceDate, date, calendarDrag.itemId); else if (calendarDrag) setScheduleToast({ message: calendarDrag.sourceDate === date ? "不能拖回原日期" : "目标日期已有相同内容" }); setCalendarDrag(null); setCalendarDropState(null); }}>
                <div className="recommendation-calendar-day-head"><span>{Number(date.slice(8, 10))}</span><button type="button" aria-label={`新增${date}当天排期`} onClick={(event) => { event.stopPropagation(); openAddSchedule(date); }}><Plus size={12}/></button></div>
                <div className="recommendation-calendar-chips">{items.slice(0, calendarMode === "week" ? items.length : 2).map((item, itemIndex) => <button type="button" key={item.id} draggable={!item.automatic} aria-label={item.automatic ? `${item.name}，系统自动来源：${item.sourceName}` : `${item.name}，第${itemIndex + 1}条。左右方向键移动日期，上下方向键调整顺序，回车编辑，Delete删除`} className={`type-${item.type} ${item.automatic ? "automatic" : ""} ${calendarDrag?.sourceDate === date && calendarDrag?.itemId === item.id ? "dragging" : ""}`} onClick={(event) => event.stopPropagation()} onDoubleClick={() => { if (!item.automatic) openEditSchedule(date, item); }} onKeyDown={(event) => { if (!item.automatic) handleChipKeyDown(event, date, item, itemIndex); }} onDragStart={(event) => { if (item.automatic) return; event.stopPropagation(); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", `${date}|${item.id}`); setCalendarDrag({ sourceDate: date, itemId: item.id }); }} onDragEnd={() => { setCalendarDrag(null); setCalendarDropState(null); }}>{item.automatic && <small>自动</small>}{item.name}</button>)}{calendarMode === "month" && count > 2 && <small>+{count - 2}</small>}</div>
                {hasNoSchedule && <small className="recommendation-calendar-empty">无排期</small>}
              </div>;
            })}</div>
            <div className="recommendation-calendar-legend recommendation-type-legend" aria-label="推荐内容类型颜色说明"><b>内容类型</b>{recommendationTypes.map((item) => <span key={item.key}><i className={`type-${item.key}`}/>{item.label}</span>)}</div>
          </div>
          <div className="recommendation-day-preview">
            <div className="recommendation-day-preview-heading"><div><span>{selectedDateLabel}</span><h4>当天排期</h4></div><div className="recommendation-day-preview-actions"><StatusTag>{selectedIsToday ? "可展示" : "排期"} {selectedScheduledItems.length} 条</StatusTag><button type="button" className="primary-button" aria-label={`新增${selectedDateLabel}排期`} onClick={() => openAddSchedule(selectedDate)}><Plus size={15}/>新增排期</button></div></div>
            {selectedScheduledItems.length === 0 && <div className="recommendation-preview-empty"><CalendarDays size={22}/><div><b>当天暂无推荐内容</b><span>可新增当天排期，或前往内容管理维护推荐内容。</span></div></div>}
            {selectedDayItems.length > 0 && <div className="recommendation-day-list">{selectedDayItems.map((item, index) => item.automatic ? <div key={item.id} className="automatic-reminder-row"><span className="recommendation-auto-handle"><Bell size={14}/></span><em>自动</em><span><b>{item.name}</b><small>触发来源：{item.sourceName} · 终端：{item.policy.terminals.join("、")}</small></span></div> : <div key={item.id} className={daySortDrag === item.id ? "sorting" : ""} onDragOver={(event) => { if (daySortDrag) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); if (!daySortDrag || daySortDrag === item.id) return; const items = dayItems(selectedDate); const sourceIndex = items.findIndex((candidate) => candidate.id === daySortDrag); const targetIndex = items.findIndex((candidate) => candidate.id === item.id); const next = [...items]; const [moved] = next.splice(sourceIndex, 1); next.splice(targetIndex, 0, moved); setDayItems(selectedDate, next); setDaySortDrag(null); setScheduleToast({ message: `已调整${selectedDateLabel}的展示顺序` }); }}><span className="recommendation-sort-handle" draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; setDaySortDrag(item.id); }} onDragEnd={() => setDaySortDrag(null)} aria-label={`拖拽调整${item.name}顺序`}><GripVertical size={15}/></span><em>{index + 1}</em><span><b>{item.name}</b><small>{item.sourceName || "未关联来源"} · 展示 {item.dayDurationSeconds ?? item.durationSeconds} 秒 · {(item.dayAfterView ?? item.afterView) === "exit" ? "查看后退出" : "继续轮换"}</small></span><div className="recommendation-day-actions"><button type="button" className="icon-button" disabled={index === 0} aria-label={`${item.name}上移`} onClick={() => reorderDayItem(selectedDate, item.id, -1)}><ChevronLeft size={14}/></button><button type="button" className="icon-button" disabled={index === selectedDayItems.length - 1} aria-label={`${item.name}下移`} onClick={() => reorderDayItem(selectedDate, item.id, 1)}><ChevronRight size={14}/></button><button type="button" className="table-action" onClick={() => openEditSchedule(selectedDate, item)}>编辑</button><button type="button" className="table-action danger-text" onClick={() => setDeleteTarget({ date: selectedDate, itemId: item.id, name: item.name })}>删除</button></div></div>)}</div>}
          </div>
        </div></section>}
      {activeView === "content" && <section className="panel recommendation-pool-panel">
        <div className="recommendation-list-toolbar">
          <div className="recommendation-list-filters"><div className="input-wrap"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索内容名称、编号或来源"/></div><select className="select-control filter-select" value={type} onChange={(event) => setType(event.target.value)}><option>全部类型</option>{recommendationTypes.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select><select className="select-control filter-select" value={status} onChange={(event) => setStatus(event.target.value)}><option>全部状态</option><option>可展示</option><option>未生效</option><option>已过期</option><option>已停用</option><option>来源不可用</option></select>{dateFilterEnabled && <button type="button" className="recommendation-date-chip" onClick={() => setDateFilterEnabled(false)}>{selectedDateLabel}排期 <X size={13}/></button>}</div>
        </div>
        <div className="table-scroll">
          <table className="recommendation-table right-content-table"><thead><tr><th>推荐文案</th><th>内容来源</th><th>内容类型</th><th>生效时间 / 失效时间</th><th>顺序</th><th>展示时长</th><th>查看后</th><th>同步状态</th><th>当前状态</th><th className="sticky-right">操作</th></tr></thead><tbody>
            {rows.map((item) => { const availability = getRecommendationAvailability(item); const isThirdParty = item.type === "third_party_entertainment"; const linkedSource = Boolean(item.sourceId) && !isThirdParty; return <tr key={item.id}><td><div className="strategy-title-cell"><b>{item.name}</b><small>{item.id} · 创建 {item.createdAt.replace("T", " ")}</small></div></td><td><div className="stacked-cell recommendation-source-cell"><b>{item.sourceName || "未关联内容"}</b><small>{isThirdParty ? item.thirdPartyUrl || "来源链接不可用" : `${item.sourceId || "—"} · ${item.sourceStatus || "来源状态未知"}`}</small></div></td><td><b>{recommendationTypes.find((option) => option.key === item.type)?.label}</b></td><td><div className="stacked-cell"><b>{item.startsAt.replace("T", " ")}</b><small>至 {item.endsAt.replace("T", " ")}</small></div></td><td><div className="recommendation-order-control"><button aria-label="上移" onClick={() => onMove(item.id, -1)}><ChevronLeft size={14}/></button><b>{item.displayOrder}</b><button aria-label="下移" onClick={() => onMove(item.id, 1)}><ChevronRight size={14}/></button></div></td><td><b>{item.durationSeconds} 秒 / 次</b></td><td>{item.afterView === "exit" ? "退出推荐" : "继续轮换"}</td><td><StatusTag>{linkedSource ? item.sourceSyncEnabled ? "已同步" : "未同步" : "独立维护"}</StatusTag></td><td><div className="stacked-cell"><StatusTag>{availability}</StatusTag><button type="button" role="switch" aria-checked={item.sourceSyncEnabled ?? item.enabled} aria-label={`${item.name}同步到推荐状态`} className={`strategy-status-switch ${(item.sourceSyncEnabled ?? item.enabled) ? "active" : ""}`} onClick={() => onToggle(item.id)}><i/><span>{(item.sourceSyncEnabled ?? item.enabled) ? "启用" : "停用"}</span></button></div></td><td className="sticky-right"><button className="table-action" onClick={() => onEdit(item)}>编辑</button></td></tr>; })}
            {!rows.length && <tr><td colSpan="10"><div className="empty-table-state">暂无符合条件的推荐内容</div></td></tr>}
          </tbody></table>
        </div>
        <div className="pagination"><span>共 {strategies.length} 条推荐内容，筛选后展示 {rows.length} 条{dateFilterEnabled ? ` · 当前仅看 ${selectedDateLabel}` : ""}</span></div>
      </section>}
      {scheduleDrawer && <RecommendationDayScheduleDrawer key={`${scheduleDrawer.mode}-${scheduleDrawer.date}-${scheduleDrawer.itemId || "new"}`} mode={scheduleDrawer.mode} date={scheduleDrawer.date} record={scheduleDrawer.itemId ? dayItems(scheduleDrawer.date).find((item) => item.id === scheduleDrawer.itemId) : null} strategies={strategies} scheduledIds={dayItems(scheduleDrawer.date).map((item) => item.id)} onClose={() => setScheduleDrawer(null)} onSave={saveDaySchedule}/>} 
      {deleteTarget && <AdminConfirm title={`删除${Number(deleteTarget.date.slice(5, 7))}月${Number(deleteTarget.date.slice(8, 10))}日的“${deleteTarget.name}”？`} description="仅删除某日排期：本次只删除该日期的单日排期，不会修改内容库中的全局有效期、启用状态或其他日期排期。" confirmLabel="删除当天排期" icon={<Trash2 size={20}/>} onClose={() => setDeleteTarget(null)} onConfirm={confirmDeleteSchedule}/>} 
      {scheduleToast && <AdminToast message={scheduleToast.message} actionLabel={scheduleToast.undo ? "撤销" : undefined} onAction={scheduleToast.undo ? undoDeleteSchedule : undefined} onClose={() => setScheduleToast(null)}/>} 
    </>
  );
}

function RecommendationStrategyDrawer({ record, presetDate, safetyNews, activities, entertainmentEntries, currentProject, onClose, onSave }) {
  const activityResources = [
    ...activities.filter((item) => !["已结束", "已下架"].includes(item.status)).map((item) => ({ id: item.id, name: item.title, category: item.category, summary: `${item.startAt.replace("T", " ")} · ${item.location} · ${item.description}`, date: item.publishedAt, status: item.status })),
  ];
  const contentResources = (type) => safetyNews
    .filter((item) => item.type === type && getCommunityContentStatus(item) === "已发布")
    .map((item) => ({ id: item.id, name: item.title, category: item.type, summary: item.description || item.content, date: item.updatedAt, status: "已发布" }));
  const resourceGroups = {
    announcement: { label: "社区公告", items: contentResources("社区公告") },
    life_info: { label: "生活资讯", items: contentResources("生活资讯") },
    alert: { label: "警惕事项", items: contentResources("警惕事项") },
    activity: { label: "社区活动", items: activityResources },
    third_party_entertainment: { label: "平台娱乐入口", items: entertainmentEntries.map((item) => ({ id: item.id, name: item.name, category: item.category, summary: item.description, date: item.updatedAt, status: "已启用", url: item.entryUrl })) },
  };
  const [form, setForm] = useState(() => ({ projectId: currentProject?.id, name: "", type: "announcement", sourceId: "", sourceName: "", sourceUpdatedAt: "", thirdPartyUrl: "", startsAt: presetDate ? `${presetDate}T08:00` : "2026-08-21T08:00", endsAt: presetDate ? `${presetDate}T23:59` : "2026-08-31T23:59", enabled: true, displayOrder: 1, durationSeconds: 20, afterView: "continue", createdAt: recommendationMockNow, ...record }));
  const [errors, setErrors] = useState({});
  const [resourcePickerOpen, setResourcePickerOpen] = useState(false);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const isThirdParty = form.type === "third_party_entertainment";
  const currentGroup = resourceGroups[form.type];
  const selectedResource = currentGroup?.items.find((item) => item.id === form.sourceId) || (currentGroup && form.sourceId ? { id: form.sourceId, name: form.sourceName, date: form.sourceUpdatedAt, category: recommendationTypes.find((item) => item.key === form.type)?.label, summary: "当前推荐已关联的来源内容", status: isThirdParty ? "已停用" : "已发布", url: form.thirdPartyUrl } : null);
  const changeType = (type) => setForm((current) => ({ ...current, type, sourceId: "", sourceName: "", sourceUpdatedAt: "", thirdPartyUrl: "" }));
  const selectResource = (resource) => {
    setForm((current) => ({ ...current, sourceId: resource.id, sourceName: resource.name, sourceUpdatedAt: resource.date, thirdPartyUrl: resource.url || "", name: resource.url ? resource.name : current.name || resource.name }));
    setErrors((current) => ({ ...current, sourceId: "" }));
    setResourcePickerOpen(false);
  };
  const save = () => {
    const nextErrors = {};
    if (!form.sourceId) nextErrors.sourceId = isThirdParty ? "请选择平台已启用的娱乐入口" : "请选择需要推荐的来源内容";
    else if (isThirdParty && !currentGroup.items.some((item) => item.id === form.sourceId)) nextErrors.sourceId = "当前娱乐入口已停用，请重新选择平台已启用的入口";
    if (!isThirdParty && !form.name.trim()) nextErrors.name = "请输入内容名称";
    if (!["continue", "exit"].includes(form.afterView)) nextErrors.afterView = "请选择老人查看后的处理方式";
    if (!form.startsAt || !form.endsAt) nextErrors.validity = "请选择生效和失效时间";
    if (form.startsAt && form.endsAt && form.startsAt >= form.endsAt) nextErrors.validity = "失效时间必须晚于生效时间";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const { sourceUnavailable: _sourceUnavailable, audience: _audience, ...cleanForm } = form;
    onSave({ ...cleanForm, name: isThirdParty ? selectedResource.name : form.name.trim(), sourceId: selectedResource.id, sourceName: selectedResource.name, sourceUpdatedAt: selectedResource.date, thirdPartyUrl: isThirdParty ? selectedResource.url : "", enabled: isThirdParty ? true : form.enabled, displayOrder: Number(form.displayOrder), durationSeconds: Number(form.durationSeconds) });
  };
  return (
    <div className="drawer-layer">
      <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
      <aside className="drawer recommendation-drawer" role="dialog" aria-modal="true" aria-label={record ? "编辑推荐内容" : "新增推荐内容"}>
        <header><div><h2>{record ? "编辑推荐内容" : "新增推荐内容"}</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
        <div className="drawer-body"><div className="form-section">
          <h3>内容信息</h3>
          <label><span>内容类型 *</span><select className="select-control form-select-native" value={form.type} onChange={(event) => changeType(event.target.value)}>{recommendationTypes.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></label>
          <div className="recommendation-resource-field"><span>{isThirdParty ? "娱乐入口" : "关联内容"} *</span><button type="button" className={`strategy-resource-picker-trigger ${selectedResource ? "selected" : ""}`} onClick={() => setResourcePickerOpen(true)}>{selectedResource ? <><span><b>{selectedResource.name}</b><small>{selectedResource.id} · {isThirdParty ? selectedResource.url : `更新 ${selectedResource.date}`}</small></span><em>更换</em></> : <><span><b>请选择{currentGroup.label}</b><small>{isThirdParty ? "只能引用平台已启用的娱乐入口" : "推荐必须关联一条当前社区已发布的来源内容"}</small></span><em>选择</em></>}</button>{errors.sourceId && <small className="field-error">{errors.sourceId}</small>}</div>
          {!isThirdParty && <label><span>内容名称 *</span><input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="例如：明早一起练太极"/>{errors.name && <small className="field-error">{errors.name}</small>}</label>}
          {isThirdParty && <div className="form-tip"><ShieldCheck size={18}/><div><b>平台统一维护</b><p>社区只能选择娱乐入口并配置推荐参数，不能修改名称、URL 或白名单。</p></div></div>}
          <div className="form-row"><label><span>生效时间 *</span><input type="datetime-local" value={form.startsAt} onChange={(event) => update("startsAt", event.target.value)}/></label><label><span>失效时间 *</span><input type="datetime-local" value={form.endsAt} onChange={(event) => update("endsAt", event.target.value)}/></label></div>{errors.validity && <small className="field-error">{errors.validity}</small>}
          <h3>排序与轮换</h3>
          <div className="form-row"><label><span>展示顺序 *</span><input type="number" min="1" value={form.displayOrder} onChange={(event) => update("displayOrder", event.target.value)}/></label><label><span>单次展示时长（秒）*</span><input type="number" min="5" max="120" value={form.durationSeconds} onChange={(event) => update("durationSeconds", event.target.value)}/></label></div>
          <label><span>老人查看后 *</span><div className="strategy-enable-options"><button type="button" className={form.afterView === "continue" ? "active" : ""} onClick={() => update("afterView", "continue")}><b>继续轮换</b><small>下一轮仍可按规则再次展示</small></button><button type="button" className={form.afterView === "exit" ? "active" : ""} onClick={() => update("afterView", "exit")}><b>退出推荐</b><small>本轮退出，不删除原内容记录</small></button></div>{errors.afterView && <small className="field-error">{errors.afterView}</small>}<small className="section-helper">仅成功进入内容详情或第三方链接页后执行；打开失败不触发。</small></label>
          {!isThirdParty && <label><span>启用状态 *</span><div className="strategy-enable-options"><button type="button" className={form.enabled ? "active" : ""} onClick={() => update("enabled", true)}><b>启用</b><small>符合有效期与轮换条件时可展示</small></button><button type="button" className={!form.enabled ? "active" : ""} onClick={() => update("enabled", false)}><b>停用</b><small>保留配置但不进入有效顺序</small></button></div></label>}
        </div></div>
        <footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={save}>保存内容</button></footer>
      </aside>
      {resourcePickerOpen && currentGroup && <RecommendationResourcePicker group={currentGroup} selectedId={form.sourceId} onClose={() => setResourcePickerOpen(false)} onConfirm={selectResource}/>} 
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
    <header><div><h3>选择{group.label}</h3></div><button className="icon-button" onClick={onClose}><X size={18}/></button></header>
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

function getEmergencyNotificationResult(event) {
  const { failedCount, notificationCount, viewedCount } = getEmergencyEventMetrics(event);
  if (!notificationCount) return "暂无绑定子女";
  if (failedCount > 0 && failedCount < notificationCount) return "部分通知失败";
  if (failedCount === notificationCount && notificationCount > 0) return "通知失败";
  return viewedCount === notificationCount ? "已查看" : "已通知";
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
    const matchesStatus = filters.status === "全部状态" || event.status === filters.status;
    return matchesKeyword && matchesProject && matchesStatus;
  });
  const counts = {
    waiting: events.filter((event) => event.status === "待接听").length,
    processing: events.filter((event) => event.status === "处理中").length,
    completed: events.filter((event) => event.startedAt.startsWith(today) && event.status === "已完成").length,
  };
  const projects = ["全部项目", ...new Set(elderlyRecords.map((record) => record.project))];
  const reset = () => { setDraftFilters(initialFilters); setFilters(initialFilters); };

  return <>
    <div className="page-heading"><div><h1>在线协助</h1><p>查看老人发起的协助事件，由呼叫中心负责联系与处置，后台运营记录进度和结果</p></div></div>
    <div className="emergency-overview-grid">
      <div><div className="admin-metric-heading"><span>待接听</span><MetricHelp label="待接听指标说明" content="呼叫中心尚未接听"/></div><b className={counts.waiting ? "danger" : ""}>{counts.waiting}</b></div>
      <div><div className="admin-metric-heading"><span>处理中</span><MetricHelp label="处理中指标说明" content="呼叫中心正在处理"/></div><b>{counts.processing}</b></div>
      <div><div className="admin-metric-heading"><span>今日已完成</span><MetricHelp label="今日已完成指标说明" content="已填写处理说明并完成事件"/></div><b>{counts.completed}</b></div>
    </div>
    <section className="panel management-panel emergency-help-panel">
      <div className="filters emergency-help-filters">
        <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="老人姓名、手机号、设备或事件编号"/></div></label>
        <label><span>所属项目</span><select className="select-control filter-select wide" value={draftFilters.project} onChange={(event) => setDraftFilters((current) => ({ ...current, project: event.target.value }))}>{projects.map((project) => <option key={project}>{project}</option>)}</select></label>
        <label><span>主状态</span><select className="select-control filter-select" value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}>{["全部状态", ...emergencyAssistanceStatuses].map((status) => <option key={status}>{status}</option>)}</select></label>
        <div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div>
      </div>
      <div className="table-scroll"><table className="emergency-help-table"><thead><tr><th>老人</th><th>发起时间</th><th>来源设备</th><th>主状态</th><th>呼叫中心</th><th>子女通知</th><th>当前处理人</th><th className="sticky-right">操作</th></tr></thead><tbody>
        {rows.map((event) => <tr key={event.id}><td>{event.elderly ? <button className="emergency-elderly-cell" onClick={() => onOpen(event)}><span>{event.elderly.name.slice(-1)}</span><div><b>{event.elderly.name}</b><small>{event.elderly.project}</small></div></button> : "老人档案已移除"}</td><td><div className="stacked-cell"><b>{event.startedAt}</b><small>{event.id}</small></div></td><td><div className="stacked-cell"><b>{event.sourceDevice}</b><small>{event.sourceDeviceId}</small></div></td><td><StatusTag>{event.status}</StatusTag></td><td><div className="stacked-cell"><b>{event.callCenter.status}</b><small>{event.callCenter.agent}</small></div></td><td><div className="stacked-cell"><b className={event.failedCount ? "metric-danger" : "metric-success"}>{getEmergencyNotificationResult(event)}</b><small>{event.viewedCount} 人查看</small></div></td><td>{event.handler}</td><td className="sticky-right"><button className="table-action" onClick={() => onOpen(event)}>详情</button></td></tr>)}
        {!rows.length && <tr><td colSpan="8"><div className="empty-table-state">暂无符合条件的在线协助事件</div></td></tr>}
      </tbody></table></div>
      <div className="pagination"><span>当前展示 {rows.length} 条数据</span></div>
    </section>
  </>;
}

function EmergencyHelpDrawer({ event, elderly, onClose, onRetry, onSaveProcessing, onComplete }) {
  const metrics = getEmergencyEventMetrics(event);
  const [form, setForm] = useState({ result: event.result || "" });
  const [error, setError] = useState("");
  const isClosed = event.status === "已完成";
  const notificationRows = <div className="emergency-contact-table-wrap"><table className="emergency-contact-table"><thead><tr><th>姓名 / 关系</th><th>联系电话</th><th>送达状态</th><th>查看状态</th><th>失败原因 / 重试</th><th>操作</th></tr></thead><tbody>{event.notifications.map((contact) => <tr key={contact.id}><td><div className="stacked-cell"><b>{contact.name}</b><small>{contact.relation}</small></div></td><td>{contact.phone}</td><td><StatusTag>{contact.deliveryStatus}</StatusTag></td><td>{contact.viewedAt ? <div className="stacked-cell"><b>已查看</b><small>{contact.viewedAt}</small></div> : <StatusTag>未查看</StatusTag>}</td><td><div className="stacked-cell"><b>{contact.failureReason || "—"}</b><small>{contact.retryCount ? `已重试 ${contact.retryCount} 次` : `最近发送 ${contact.lastAttemptAt}`}</small></div></td><td>{contact.deliveryStatus === "发送失败" ? <button className="table-action" onClick={() => onRetry(event.id, contact.id)}>重新通知</button> : "—"}</td></tr>)}{!event.notifications.length && <tr><td colSpan="6"><div className="empty-table-state">暂无已绑定子女</div></td></tr>}</tbody></table></div>;
  const saveProcessing = () => { onSaveProcessing(event.id, form); setError(""); };
  const complete = () => {
    if (!form.result.trim()) { setError("完成事件前请填写处理说明"); return; }
    onComplete(event.id, { ...form, result: form.result.trim() });
    setError("");
  };
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer emergency-help-drawer" role="dialog" aria-modal="true" aria-label="在线协助详情">
    <header><h2>在线协助详情</h2><button className="icon-button" aria-label="关闭" onClick={onClose}><X size={19}/></button></header>
    <div className="drawer-body">
      <ArchiveSubjectSummary name={elderly?.name || "老人档案已移除"} details={[event.id, `发起于 ${event.startedAt}`]}/>
      <div className="emergency-event-hero"><span className="emergency-event-icon"><AlertTriangle size={16}/></span><div className="emergency-event-status"><small>主状态</small><StatusTag>{event.status}</StatusTag></div><div className="emergency-event-status"><small>呼叫中心状态</small><b>{event.callCenter.status}</b></div><div className="emergency-event-status"><small>子女通知</small><b>{getEmergencyNotificationResult(event)}</b></div></div>
      <section className="detail-section"><h3>老人及发起信息</h3><div className="info-grid"><div><span>老人姓名</span><b>{elderly?.name || "老人档案已移除"}</b></div><div><span>联系电话</span><b>{elderly?.phone || "待补充"}</b></div><div className="full"><span>档案地址</span><b>{elderly?.address || "—"}</b></div><div><span>设备编码</span><b className="mono">{event.sourceDeviceId || "—"}</b></div><div><span>发起时间</span><b>{event.startedAt}</b></div></div></section>
      <section className="detail-section"><h3>呼叫中心处理</h3><div className="info-grid"><div><span>最近呼叫</span><b>{event.callCenter.lastAttemptAt || "—"}</b></div><div><span>接听时间</span><b>{event.callCenter.answeredAt || "—"}</b></div><div><span>当前处理人</span><b>{event.handler}</b></div><div className="full"><span>呼叫结果</span><b className="emergency-call-center-note">{event.callCenter.result || "—"}</b></div></div></section>
      <section className="detail-section"><div className="detail-section-title"><h3>子女通知与联系状态</h3><span className="relation-count">{metrics.notificationCount} 人</span></div>{notificationRows}</section>
      <section className="detail-section emergency-processing-section"><h3>协助处理</h3><div className="emergency-processing-form"><label className="full"><span>处理说明 *</span><textarea rows="3" disabled={isClosed} value={form.result} onChange={(changeEvent) => { setForm((current) => ({ ...current, result: changeEvent.target.value })); setError(""); }} placeholder="记录联系过程、当前结果和后续安排"/></label></div>{error && <small className="field-error emergency-processing-error">{error}</small>}</section>
      {event.status === "已完成" && <section className="detail-section emergency-child-result-section"><h3>跨端结果预览</h3><div className="info-grid"><div><span>同步状态</span><StatusTag>{event.childResult?.status || "已同步"}</StatusTag></div><div><span>同步时间</span><b>{event.childResult?.publishedAt || event.completedAt || "—"}</b></div><div className="full"><span>结果摘要</span><b className="emergency-call-center-note">{event.childResult?.resultSummary || event.result || "—"}</b></div><div className="full"><span>呼叫中心备注</span><b className="emergency-call-center-note">{event.childResult?.callCenterNote || "—"}</b></div></div></section>}
      <section className="detail-section"><h3>事件时间线</h3><div className="emergency-timeline">{event.timeline.map((item, index) => <div className="emergency-timeline-item" key={`${item.time}-${index}`}><time>{item.time}</time><span className="emergency-timeline-axis" aria-hidden="true"><i/></span><div className="emergency-timeline-content"><b>{item.title}</b><p>{item.detail}</p></div></div>)}</div></section>
      {isClosed && <section className="detail-section emergency-end-result"><h3>完成信息</h3><div className="info-grid"><div><span>最终状态</span><StatusTag>{event.status}</StatusTag></div><div><span>完成时间</span><b>{event.completedAt || "—"}</b></div><div><span>操作人</span><b>{event.completedBy || "—"}</b></div></div></section>}
    </div>
    <footer className="emergency-help-footer"><button className="secondary-button" onClick={onClose}>关闭</button>{event.status === "处理中" && <div className="emergency-help-footer-actions"><button className="secondary-button" onClick={saveProcessing}>保存处理信息</button><button className="primary-button" onClick={complete}>完成事件</button></div>}</footer>
  </aside></div>;
}

function ReminderManagementPage({ reminders, elderlyRecords, onCreate, onEdit, onDelete, onViewPlan }) {
  const initialFilters = { query: "", type: "全部类型", date: "" };
  const [view, setView] = useState("current");
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const currentDefinitions = reminders.filter((reminder) => !reminder.deletedAt);
  const deletedHistory = reminders.filter((reminder) => reminder.deletedAt).sort((left, right) => right.deletedAt.localeCompare(left.deletedAt));
  const rows = (view === "current" ? currentDefinitions : deletedHistory).map((reminder) => ({
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
    showFeedback("success", `“${title}”已删除，历史执行记录仍可查询`);
  };

  return (
    <>
      <div className="page-heading"><div><h1>提醒事项</h1><p>为老人创建用药或日常提醒，并同步显示到老人档案</p></div><button className="primary-button" onClick={onCreate}><Plus size={16}/>新建提醒</button></div>
      <section className="panel management-panel reminder-management-panel">
        <div className="reminder-view-tabs" role="tablist" aria-label="提醒记录范围">
          <button type="button" role="tab" aria-selected={view === "current"} className={view === "current" ? "active" : ""} onClick={() => setView("current")}>当前提醒定义 <span>{currentDefinitions.length}</span></button>
          <button type="button" role="tab" aria-selected={view === "history"} className={view === "history" ? "active" : ""} onClick={() => setView("history")}>已删除执行记录 <span>{deletedHistory.length}</span></button>
        </div>
        <div className="filters reminder-filters">
          <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="提醒名称、老人姓名或手机号"/></div></label>
          <label><span>提醒类型</span><select className="select-control filter-select" value={draftFilters.type} onChange={(event) => setDraftFilters((current) => ({ ...current, type: event.target.value }))}><option>全部类型</option><option>用药提醒</option><option>日常提醒</option></select></label>
          <label><span>提醒日期</span><input className="select-control filter-select" type="date" value={draftFilters.date} onChange={(event) => setDraftFilters((current) => ({ ...current, date: event.target.value }))}/></label>
          <div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div>
        </div>
        <div className="table-scroll">
          {view === "current" ? <table className="reminder-table">
            <thead><tr><th>提醒名称</th><th>所属老人</th><th>提醒类型</th><th>提醒时间</th><th>重复方式</th><th>创建信息</th><th className="sticky-right">操作</th></tr></thead>
            <tbody>{rows.map((reminder) => <tr key={reminder.id}><td><div className="reminder-name-cell"><span><Bell size={16}/></span><div><b>{reminder.title}</b><small>{reminder.type === "用药提醒" ? [reminder.dosage, reminder.usage].filter(Boolean).join(" · ") || reminder.note || "暂无用药说明" : reminder.note || "暂无补充说明"}</small></div></div></td><td>{reminder.elderly ? <div className="stacked-cell"><b>{reminder.elderly.name}</b><small>{reminder.elderly.project}</small></div> : "老人档案已移除"}</td><td><StatusTag>{reminder.type}</StatusTag></td><td><div className="stacked-cell"><b>{reminder.date}</b><small>{reminder.time} · 老人当地时间</small></div></td><td>{reminder.repeat}</td><td><div className="stacked-cell"><b>{reminder.createdBy}</b><small>{reminder.createdAt}</small></div></td><td className="sticky-right"><button className="table-action" onClick={() => onViewPlan(reminder)}>详细计划</button><button className="table-action" onClick={() => onEdit(reminder)}>编辑</button><button className="table-action danger-text" onClick={() => { setDeleteTarget(reminder); setDeleteError(""); }}>删除提醒</button></td></tr>)}{!rows.length && <tr><td colSpan="7"><div className="empty-table-state">暂无提醒事项，请新建提醒或调整筛选条件</div></td></tr>}</tbody>
          </table> : <table className="reminder-table reminder-history-table">
            <thead><tr><th>提醒名称</th><th>所属老人</th><th>提醒类型</th><th>原计划</th><th>删除信息</th><th>保留记录</th><th className="sticky-right">操作</th></tr></thead>
            <tbody>{rows.map((reminder) => <tr key={reminder.id}><td><div className="reminder-name-cell"><span><FileClock size={16}/></span><div><b>{reminder.title}</b><small>提醒定义已删除，不再产生后续实例</small></div></div></td><td>{reminder.elderly ? <div className="stacked-cell"><b>{reminder.elderly.name}</b><small>{reminder.elderly.project}</small></div> : "老人档案已移除"}</td><td><StatusTag>{reminder.type}</StatusTag></td><td><div className="stacked-cell"><b>{reminder.date} {reminder.time}</b><small>{reminder.repeat} · 老人当地时间</small></div></td><td><div className="stacked-cell"><b>{reminder.deletedBy}</b><small>{reminder.deletedAt}</small></div></td><td><div className="stacked-cell"><b>{reminder.occurrences?.length || 0} 条执行记录</b><small>已停止 {reminder.stoppedFutureCount || 0} 条后续实例</small></div></td><td className="sticky-right"><button className="table-action" onClick={() => onViewPlan(reminder)}>查看执行历史</button></td></tr>)}{!rows.length && <tr><td colSpan="7"><div className="empty-table-state">暂无已删除提醒的执行记录</div></td></tr>}</tbody>
          </table>}
        </div>
        <div className="pagination"><span>当前展示 {rows.length} 条数据</span></div>
      </section>
      {deleteTarget && <div className="modal-layer"><button className="modal-backdrop" aria-label="关闭删除确认" onClick={() => setDeleteTarget(null)}/><section className="confirm-dialog" role="dialog" aria-modal="true" aria-label="删除提醒"><span className="confirm-icon danger"><Trash2 size={20}/></span><h3>删除“{deleteTarget.title}”？</h3><p>删除后该提醒会从当前列表移除，并且不再产生后续提醒。已经发生的执行记录不会被改写。</p>{deleteError && <div className="reminder-delete-error"><AlertTriangle size={15}/>{deleteError}</div>}<div><button className="secondary-button" onClick={() => setDeleteTarget(null)}>取消</button><button className="danger-button" onClick={confirmDelete}>{deleteError ? "重试删除" : "确认删除"}</button></div></section></div>}
      {feedback && <div className={`reminder-feedback ${feedback.type}`}><span>{feedback.type === "success" ? <ShieldCheck size={16}/> : <AlertTriangle size={16}/>}</span>{feedback.message}</div>}
    </>
  );
}

function ReminderDrawer({ record, elderlyRecords, initialElderlyId = "", lockElderly = false, onClose, onSave }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const initialRepeat = record?.repeat || "仅一次";
  const [weeklyDays, setWeeklyDays] = useState(() => initialRepeat.match(/周[一二三四五六日]/g) || []);
  const [form, setForm] = useState(() => ({ elderlyId: initialElderlyId, type: "日常提醒", title: "", date: "2026-07-30", time: "09:00", repeat: "仅一次", note: "", ...record, dosage: record?.dosage || "", usage: record?.usage || (record?.type === "用药提醒" ? record?.note || "" : "") }));
  const elderly = elderlyRecords.find((record) => record.id === form.elderlyId || formatDisplayId(record.id) === form.elderlyId);
  const repeatMode = form.repeat.startsWith("每周") ? "每周" : form.repeat;
  const weekdayOptions = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "", ...(field === "dosage" || field === "usage" ? { medicationDetails: "" } : {}) }));
  };
  const selectRepeatMode = (mode) => {
    update("repeat", mode);
    if (mode !== "每周") setWeeklyDays([]);
  };
  const toggleWeekday = (day) => {
    setWeeklyDays((current) => current.includes(day) ? current.filter((item) => item !== day) : weekdayOptions.filter((item) => current.includes(item) || item === day));
    setErrors((current) => ({ ...current, repeat: "" }));
  };
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
    if (repeatMode === "每周" && !weeklyDays.length) nextErrors.repeat = "请至少选择一个星期";
    if (form.type === "用药提醒" && !form.dosage.trim() && !form.usage.trim()) nextErrors.medicationDetails = "剂量或用法至少填写一项";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ ...form, elderlyId: elderly.id, title: form.title.trim(), repeat: repeatMode === "每周" ? `每${weeklyDays.join("、")}` : repeatMode, dosage: form.dosage.trim(), usage: form.usage.trim(), note: form.note.trim() });
  };

  return (
    <div className="drawer-layer">
      <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
      <aside className="drawer reminder-drawer" role="dialog" aria-modal="true" aria-label={record ? "编辑提醒" : "新建提醒"}>
        <header><div><h2>{record ? "编辑提醒" : "新建提醒"}</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
        <div className="drawer-body">
          <div className="form-section">
            <h3>提醒对象</h3>
            <label><span>所属老人 *</span><button type="button" className="elderly-picker-trigger" onClick={() => !lockElderly && setPickerOpen(true)} disabled={lockElderly}>{elderly ? <><span><b>{elderly.name}</b><small>{elderly.project}</small></span>{!lockElderly && <em>更换</em>}</> : <><span className="placeholder">请选择所属老人</span><em>选择</em></>}</button>{errors.elderlyId && <small className="field-error">{errors.elderlyId}</small>}</label>
            {elderly && <div className="selected-elderly-card"><Home size={18}/><div><b>{elderly.address}</b><small>{elderly.project} · {elderly.community}</small></div></div>}
            <h3>提醒内容</h3>
            <label><span>提醒类型 *</span><div className="reminder-type-options"><button type="button" className={form.type === "用药提醒" ? "active" : ""} onClick={() => update("type", "用药提醒")}><Bell size={17}/>用药提醒</button><button type="button" className={form.type === "日常提醒" ? "active" : ""} onClick={() => update("type", "日常提醒")}><CalendarDays size={17}/>日常提醒</button></div></label>
            <label><span>提醒名称 *</span><input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder={form.type === "用药提醒" ? "例如：早间降压药" : "例如：下午去复诊"}/>{errors.title && <small className="field-error">{errors.title}</small>}</label>
            <div className="form-row"><label><span>提醒日期 *</span><input type="date" value={form.date} onChange={(event) => update("date", event.target.value)}/>{errors.date && <small className="field-error">{errors.date}</small>}</label><label><span>提醒时间 *</span><input type="time" value={form.time} onChange={(event) => update("time", event.target.value)}/>{errors.time && <small className="field-error">{errors.time}</small>}</label></div>
            <label><span>重复方式 *</span><div className="reminder-repeat-options">{["仅一次", "每天", "每周"].map((item) => <button type="button" className={repeatMode === item ? "active" : ""} key={item} onClick={() => selectRepeatMode(item)}>{item}</button>)}</div>{repeatMode === "每周" && <div className="reminder-weekday-options" aria-label="每周重复日期">{weekdayOptions.map((day) => <button type="button" aria-pressed={weeklyDays.includes(day)} className={weeklyDays.includes(day) ? "active" : ""} key={day} onClick={() => toggleWeekday(day)}>{day}</button>)}</div>}{errors.repeat && <small className="field-error">{errors.repeat}</small>}</label>
            {form.type === "用药提醒" && <><div className="form-row"><label><span>剂量</span><input value={form.dosage} onChange={(event) => update("dosage", event.target.value)} placeholder="例如：1 片"/></label><label><span>用法</span><input value={form.usage} onChange={(event) => update("usage", event.target.value)} placeholder="例如：早餐后服用"/></label></div>{errors.medicationDetails && <small className="field-error reminder-medication-error">{errors.medicationDetails}</small>}</>}
            <label><span>事项说明（选填）</span><textarea rows="4" value={form.note} onChange={(event) => update("note", event.target.value)} placeholder="请输入就诊准备、注意事项等补充说明"/></label>
            {record && <><h3>最近修改信息</h3><div className="reminder-edit-metadata"><div><span>最近修改人</span><b>{record.updatedBy || record.createdBy}</b></div><div><span>最近修改时间</span><b>{record.updatedAt || record.createdAt}</b></div></div></>}
          </div>
        </div>
        <footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={save}>{record ? "保存修改" : "保存提醒"}</button></footer>
      </aside>
      {pickerOpen && !lockElderly && <ElderlyPickerModal records={elderlyRecords} value={form.elderlyId} onClose={() => setPickerOpen(false)} onConfirm={selectElderly}/>} 
    </div>
  );
}

function ReminderPlanDrawer({ reminder, elderly, onClose }) {
  const occurrences = reminder.occurrences || [];
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭详细计划" onClick={onClose}/><aside className="drawer reminder-plan-drawer" role="dialog" aria-modal="true" aria-label="提醒详细计划"><header><div><h2>{reminder.deletedAt ? "提醒执行历史" : "提醒详细计划"}</h2></div><button className="icon-button" aria-label="关闭详细计划" onClick={onClose}><X size={19}/></button></header><div className="drawer-body">
    {reminder.deletedAt && <div className="reminder-history-notice"><FileClock size={18}/><div><b>提醒定义已删除</b><p>后续实例已停止，以下仅保留删除前已经发生的执行记录。</p></div></div>}
    <section className="detail-section"><h3>提醒定义快照</h3><div className="info-grid"><div><span>提醒类型</span><StatusTag>{reminder.type}</StatusTag></div><div><span>所属老人</span><b>{elderly?.name || "老人档案已移除"}</b></div><div><span>开始日期</span><b>{reminder.date}</b></div><div><span>提醒时间</span><b>{reminder.time}</b></div><div><span>重复方式</span><b>{reminder.repeat}</b></div><div><span>时间口径</span><b>老人当地时间</b></div>{reminder.type === "用药提醒" && <><div><span>剂量</span><b>{reminder.dosage || "未填写"}</b></div><div><span>用法</span><b>{reminder.usage || reminder.note || "未填写"}</b></div></>}<div className="full"><span>事项说明</span><b>{reminder.note || "暂无补充说明"}</b></div></div></section>
    <section className="detail-section"><div className="detail-section-title"><h3>执行实例</h3><span className="relation-count">{occurrences.length} 条</span></div><p className="reminder-plan-caption">执行状态只属于某一次提醒，不作为提醒定义字段。</p><div className="table-scroll"><table className="reminder-plan-table"><thead><tr><th>计划日期</th><th>提醒时间</th><th>执行状态</th><th>结果时间</th></tr></thead><tbody>{occurrences.map((item) => <tr key={item.id}><td>{item.date}</td><td>{item.time}</td><td><StatusTag>{item.status}</StatusTag></td><td>{item.resultAt}</td></tr>)}{!occurrences.length && <tr><td colSpan="4"><div className="empty-table-state">暂无已生成的执行实例</div></td></tr>}</tbody></table></div></section>
    <section className="detail-section"><h3>管理信息</h3><div className="info-grid"><div><span>创建人</span><b>{reminder.createdBy}</b></div><div><span>创建时间</span><b>{reminder.createdAt}</b></div><div><span>最近修改人</span><b>{reminder.updatedBy || reminder.createdBy}</b></div><div><span>最近修改时间</span><b>{reminder.updatedAt || reminder.createdAt}</b></div>{reminder.deletedAt && <><div><span>删除人</span><b>{reminder.deletedBy}</b></div><div><span>删除时间</span><b>{reminder.deletedAt}</b></div><div className="full"><span>停止的后续实例</span><b>{reminder.stoppedFutureCount || 0} 条</b></div></>}</div></section>
    <div className="form-tip"><ShieldCheck size={18}/><div><b>后台仅查看执行结果</b><p>后台不能代替老人确认已服药或已完成；删除提醒定义只停止后续实例，已发生记录不被改写。</p></div></div>
  </div><footer><button className="secondary-button" onClick={onClose}>关闭</button></footer></aside></div>;
}

function TabletAssetDrawer({ device, devices, projectId, onClose, onSave }) {
  const [form, setForm] = useState({ sn: "", model: "U2G Home 14" });
  const [errors, setErrors] = useState({});
  const save = () => {
    const nextErrors = {};
    if (!form.sn.trim()) nextErrors.sn = "请输入设备 SN";
    if (devices.some((item) => item.sn?.toLowerCase() === form.sn.trim().toLowerCase())) nextErrors.sn = "该设备 SN 已存在";
    if (!form.model.trim()) nextErrors.model = "请输入设备型号";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const nextNumber = Math.max(20260000, ...devices.map((item) => Number(String(item.id).match(/(\d+)$/)?.[1]) || 0)) + 1;
    onSave({ id: `TAB-SG-${nextNumber}`, projectId, sn: form.sn.trim(), model: form.model.trim(), currentVersion: "v2.6.0", romVersion: "v1.6.0", apkVersion: "v2.2.0", versionStatus: "已最新", networkType: "Wi-Fi", ipAddress: "未分配", activationCode: "", operator: "", activationStatus: "待激活", onlineStatus: "离线", boundElderlyId: null, boundAt: "", lastOnline: "尚未激活" });
  };
  if (device) return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer device-detail-drawer" role="dialog" aria-modal="true"><header><div><h2>平板设备详情</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="device-hero"><span><MonitorSmartphone size={24}/></span><div><h3>{device.model}</h3><p>{formatDisplayId(device.id)} · {device.sn}</p></div><TabletOnlineStatusTag>{device.onlineStatus}</TabletOnlineStatusTag></div><section className="detail-section"><h3>设备状态</h3><div className="info-grid"><div><span>设备编号</span><b>{formatDisplayId(device.id)}</b></div><div><span>设备 SN</span><b>{device.sn}</b></div><div><span>ROM 固件版本</span><b>ROM {device.romVersion}</b></div><div><span>APK 应用版本</span><b>APK {device.apkVersion}</b></div><div><span>版本状态</span><StatusTag>{device.versionStatus}</StatusTag></div><div><span>激活状态</span><StatusTag>{device.activationStatus}</StatusTag></div><div><span>在线状态</span><TabletOnlineStatusTag>{device.onlineStatus}</TabletOnlineStatusTag></div><div><span>联网方式</span><b>{device.networkType}</b></div><div><span>IP 地址</span><b className="mono">{device.ipAddress}</b></div><div><span>6 位激活码</span><b className="mono activation-code-value">{device.activationCode || "—"}</b></div><div><span>最近在线</span><b>{device.lastOnline}</b></div><div><span>绑定时间</span><b>{device.boundAt || "尚未绑定"}</b></div></div></section></div><footer><button className="secondary-button" onClick={onClose}>关闭</button></footer></aside></div>;
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer device-detail-drawer" role="dialog" aria-modal="true"><header><div><h2>录入平板设备</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="form-section"><h3>设备信息</h3><label><span>设备 SN *</span><input value={form.sn} onChange={(event) => setForm((current) => ({ ...current, sn: event.target.value }))} placeholder="例如：SN-TAB-260034"/>{errors.sn && <small className="field-error">{errors.sn}</small>}</label><label><span>设备型号 *</span><input value={form.model} onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}/>{errors.model && <small className="field-error">{errors.model}</small>}</label></div></div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={save}>保存设备</button></footer></aside></div>;
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
          <div><h3>选择所属老人</h3></div>
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
        <header><div><h2>添加房间活动传感器</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
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
  return <div className="drawer-layer">
    <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
    <aside className="drawer device-detail-drawer" role="dialog" aria-modal="true">
      <header><div><h2>传感器详情</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
      <div className="drawer-body">
        <div className="device-hero sensor"><span><Activity size={24}/></span><div><h3>{sensor.name}</h3><p>{sensor.model}</p></div><StatusTag>{sensor.onlineStatus}</StatusTag></div>
        <section className="detail-section"><h3>当前安装关系</h3><div className="relation-card"><div><Home size={18}/><span><b>{elderly ? `${elderly.name} · ${sensor.room}` : "设备已解绑"}</b><small>{elderly?.address || "当前不产生新的房间活动统计"}</small></span></div><StatusTag>{sensor.installStatus}</StatusTag></div></section>
        {editingRoom && elderly && <section className="detail-section room-change-panel"><h3>更换安装房间</h3><label><span>新安装房间</span><select className="select-control form-select-native" value={room} onChange={(event) => setRoom(event.target.value)}>{elderly.rooms?.map((item) => <option key={item}>{item}</option>)}</select></label><div className="inline-actions"><button className="secondary-button" onClick={() => setEditingRoom(false)}>取消</button><button className="primary-button" disabled={!nextRoom} onClick={() => onMove(sensor.id, nextRoom)}>确认换房</button></div></section>}
        <section className="detail-section"><h3>运行与安装信息</h3><div className="info-grid"><div><span>最近上报</span><b>{sensor.lastReport}</b></div><div><span>最近活动</span><b>{sensor.lastActivity}</b></div><div><span>信号状态</span><b>{sensor.signal}</b></div><div><span>安装人员</span><b>{sensor.installer}</b></div><div className="full"><span>安装时间</span><b>{sensor.installedAt}</b></div></div></section>
      </div>
      <footer>{elderly && !editingRoom && <><button className="danger-outline-button" onClick={() => setConfirmUnbind(true)}>解除绑定</button><button className="secondary-button" onClick={() => setEditingRoom(true)}>更换房间</button></>}<button className="secondary-button" onClick={onClose}>关闭</button></footer>
    </aside>
    {confirmUnbind && <AdminConfirm title={`解除“${sensor.name}”绑定？`} description="解除后该设备不再产生新的房间活动统计；历史设备、房间和活动数据继续保留。" confirmLabel="确认解绑" onClose={() => setConfirmUnbind(false)} onConfirm={() => { onUnbind(sensor.id); setConfirmUnbind(false); }}/>} 
  </div>;
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
    return <table><thead><tr><th>老人姓名</th><th>所属项目 / 社区</th><th>年龄</th><th>绑定子女</th><th>房间活动传感器</th><th className="sticky-right">操作</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><button className="name-link">{row.name}</button></td><td>{row.project}</td><td>{row.age} 岁</td><td>{row.family}</td><td><StatusTag>{row.device}</StatusTag></td><td className="sticky-right"><button className="table-action">详情</button><button className="table-action">编辑</button><button className="more"><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table>;
  }
  const headers = headersByPage[page] || ["名称", "关联对象", "类型", "当前状态", "负责人", "更新时间"];
  const source = genericRows[page] || [
    ["陈美玲家庭关系", "陈美玲", "子女绑定", "已通过", "运营一组", "今天 10:26"],
    ["黄国强紧急联系人", "黄国强", "联系人", "待补充", "运营二组", "昨天 17:40"],
    ["李玉珍服务标签", "李玉珍", "运营标签", "正常", "运营一组", "07-14 15:28"],
  ];
  const rows = source.filter(row => row.join("").includes(query.trim()));
  return <table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}<th className="sticky-right">操作</th></tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{j === 0 ? <button className="name-link">{cell}</button> : /状态|在线|已|待|草稿|服务中|需关注/.test(String(cell)) ? <StatusTag>{cell}</StatusTag> : cell}</td>)}<td className="sticky-right"><button className="table-action">详情</button><button className="table-action">编辑</button></td></tr>)}</tbody></table>;
}

function ServiceBookingPage({ bookings, categories, elderlyRecords, communityName, onOpen, onCreateCategory, onEditCategory, onMoveCategory, onToggleCategory }) {
  const [activeTab, setActiveTab] = useState("bookings");
  const initialFilters = { query: "", category: "全部分类", service: "全部服务", status: "全部状态" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const serviceOptions = ["全部服务", ...new Set(bookings.map((booking) => booking.serviceName))];
  const categoryOptions = ["全部分类", ...categories.slice().sort((a, b) => a.displayOrder - b.displayOrder).map((category) => category.name)];
  const rows = bookings.map((booking) => ({
    ...booking,
    elderly: elderlyRecords.find((record) => record.id === booking.elderlyId),
  })).filter((booking) => {
    const keyword = filters.query.trim().toLowerCase();
    const matchesKeyword = !keyword || [booking.id, booking.serviceName, booking.provider, booking.elderly?.name, booking.elderly?.phone].some((value) => `${value || ""}`.toLowerCase().includes(keyword));
    const matchesCategory = filters.category === "全部分类" || booking.categoryNameSnapshot === filters.category;
    const matchesService = filters.service === "全部服务" || booking.serviceName === filters.service;
    const matchesStatus = filters.status === "全部状态" || booking.status === filters.status;
    return matchesKeyword && matchesCategory && matchesService && matchesStatus;
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
      <div className="page-heading"><div><h1>预约服务</h1><p>{activeTab === "bookings" ? `查看${communityName}老人提交的服务预约，并跟进确认与服务进度` : `维护${communityName}统一使用的特约服务分类`}</p></div>{activeTab === "categories" && <button className="primary-button" onClick={onCreateCategory}><Plus size={16}/>新增分类</button>}</div>
      {activeTab === "bookings" && <div className="service-booking-summary">
          <div><span>待确认</span><b>{counts.pending}</b></div>
          <div><span>已确认</span><b>{counts.confirmed}</b></div>
          <div><span>服务中</span><b>{counts.serving}</b></div>
          <div><span>已完成</span><b>{counts.completed}</b></div>
        </div>}
      <div className="service-module-tabs">
        <button className={activeTab === "bookings" ? "active" : ""} onClick={() => setActiveTab("bookings")}>预约记录<span>{bookings.length}</span></button>
        <button className={activeTab === "categories" ? "active" : ""} onClick={() => setActiveTab("categories")}>服务分类<span>{categories.length}</span></button>
      </div>
      {activeTab === "bookings" ? <>
        <section className="panel management-panel service-booking-panel">
          <div className="filters service-booking-filters">
            <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="预约编号、老人、服务或机构"/></div></label>
            <label><span>服务分类</span><select className="select-control filter-select" value={draftFilters.category} onChange={(event) => setDraftFilters((current) => ({ ...current, category: event.target.value }))}>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label><span>预约服务</span><select className="select-control filter-select" value={draftFilters.service} onChange={(event) => setDraftFilters((current) => ({ ...current, service: event.target.value }))}>{serviceOptions.map((service) => <option key={service}>{service}</option>)}</select></label>
            <label><span>预约状态</span><select className="select-control filter-select" value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}>{["全部状态", "待确认", "已确认", "服务中", "已完成", "已取消"].map((status) => <option key={status}>{status}</option>)}</select></label>
            <div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div>
          </div>
          <div className="table-toolbar"><div><span className="result-count">共 {rows.length} 条预约</span><span className="toolbar-hint">预约来自老人中控屏，后台负责确认和更新服务进度</span></div><button className="icon-button" title="刷新"><RefreshCw size={16}/></button></div>
          <div className="table-scroll">
            <table className="service-booking-table">
              <thead><tr><th>预约服务 / 编号</th><th>服务分类快照</th><th>预约老人</th><th>服务地址</th><th>预约时段</th><th>服务机构</th><th>提交时间</th><th>状态</th><th className="sticky-right">操作</th></tr></thead>
              <tbody>
                {rows.map((booking) => <tr key={booking.id}><td><button className="service-booking-name" onClick={() => onOpen(booking)}><b>{booking.serviceName}</b><small>{booking.id}</small></button></td><td><StatusTag>{booking.categoryNameSnapshot}</StatusTag></td><td>{booking.elderly ? <div className="stacked-cell"><b>{booking.elderly.name}</b><small>{booking.elderly.phone || "电话待补充"}</small></div> : "老人档案已移除"}</td><td>{booking.elderly?.address || "—"}</td><td><b>{booking.slotLabel}</b></td><td>{booking.provider}</td><td>{booking.createdAt}</td><td><StatusTag>{booking.status}</StatusTag></td><td className="sticky-right"><button className="table-action" onClick={() => onOpen(booking)}>详情</button></td></tr>)}
                {!rows.length && <tr><td colSpan="9"><div className="empty-table-state">暂无符合条件的预约记录</div></td></tr>}
              </tbody>
            </table>
          </div>
          <div className="pagination"><span>当前展示 {rows.length} 条数据</span></div>
        </section>
      </> : <ServiceCategoryPanel categories={categories} onCreate={onCreateCategory} onEdit={onEditCategory} onMove={onMoveCategory} onToggle={onToggleCategory}/>} 
    </>
  );
}

function ServiceCategoryPanel({ categories, onCreate, onEdit, onMove, onToggle }) {
  const [draftFilters, setDraftFilters] = useState({ query: "", status: "全部状态" });
  const [filters, setFilters] = useState({ query: "", status: "全部状态" });
  const [confirmTarget, setConfirmTarget] = useState(null);
  const sorted = categories.slice().sort((a, b) => a.displayOrder - b.displayOrder || a.code.localeCompare(b.code));
  const rows = sorted.filter((category) => {
    const keyword = filters.query.trim().toLowerCase();
    return (!keyword || [category.name, category.code, category.description].some((value) => `${value || ""}`.toLowerCase().includes(keyword)))
      && (filters.status === "全部状态" || category.status === filters.status);
  });
  const reset = () => {
    const next = { query: "", status: "全部状态" };
    setDraftFilters(next);
    setFilters(next);
  };
  return <>
    <section className="panel management-panel service-category-panel">
      <div className="filters service-category-filters">
        <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="分类名称、标识或说明"/></div></label>
        <label><span>分类状态</span><select className="select-control filter-select" value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}><option>全部状态</option><option>启用</option><option>已停用</option></select></label>
        <div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div>
      </div>
      <div className="table-toolbar"><div><span className="result-count">共 {rows.length} 个分类</span><span className="toolbar-hint">分类停用后不进入新预约入口，历史预约继续保留分类快照</span></div><button className="icon-button" title="刷新"><RefreshCw size={16}/></button></div>
      <div className="table-scroll"><table className="service-category-table"><thead><tr><th>分类名称 / 标识</th><th>分类说明</th><th>展示顺序</th><th>可预约服务</th><th>分类状态</th><th>更新时间</th><th className="sticky-right">操作</th></tr></thead><tbody>
        {rows.map((category) => { const sourceIndex = sorted.findIndex((item) => item.id === category.id); return <tr key={category.id}><td><button className="service-booking-name" onClick={() => onEdit(category)}><b>{category.name}</b><small>{category.code}</small></button></td><td>{category.description || "—"}</td><td><div className="category-order-cell"><b>{category.displayOrder}</b><span><button disabled={sourceIndex === 0} onClick={() => onMove(category.id, "up")}>上移</button><button disabled={sourceIndex === sorted.length - 1} onClick={() => onMove(category.id, "down")}>下移</button></span></div></td><td><b>{category.availableServiceCount}</b> 项</td><td><StatusTag>{category.status}</StatusTag></td><td>{category.updatedAt}</td><td className="sticky-right"><button className="table-action" onClick={() => onEdit(category)}>编辑</button><button className={`table-action ${category.status === "启用" ? "danger-text" : ""}`} onClick={() => category.status === "启用" ? setConfirmTarget(category) : onToggle(category.id)}>{category.status === "启用" ? "停用" : "启用"}</button></td></tr>; })}
        {!rows.length && <tr><td colSpan="7"><div className="empty-table-state">暂无符合条件的服务分类</div></td></tr>}
      </tbody></table></div>
      <div className="pagination"><span>当前展示 {rows.length} 条数据</span><button className="secondary-button service-empty-create" onClick={onCreate}><Plus size={15}/>新增分类</button></div>
    </section>
    {confirmTarget && <div className="modal-layer"><button className="modal-backdrop" aria-label="关闭停用确认" onClick={() => setConfirmTarget(null)}/><section className="confirm-dialog" role="dialog" aria-modal="true" aria-label="停用服务分类"><span className="confirm-icon warning"><AlertTriangle size={20}/></span><h3>停用“{confirmTarget.name}”？</h3><p>停用后，该分类及其中的服务将不再出现在老人端和子女端的新预约入口中；已有预约和订单不受影响。</p><div><button className="secondary-button" onClick={() => setConfirmTarget(null)}>取消</button><button className="danger-button" onClick={() => { onToggle(confirmTarget.id); setConfirmTarget(null); }}>确认停用</button></div></section></div>}
  </>;
}

function ServiceCategoryDrawer({ record, categories, communityName, onClose, onSave }) {
  const [form, setForm] = useState(() => record ? { ...record } : { name: "", code: "", description: "", displayOrder: categories.length + 1, status: "启用", availableServiceCount: 0 });
  const [errors, setErrors] = useState({});
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => {
    const nextErrors = {};
    const name = form.name.trim();
    if (!name) nextErrors.name = "请输入分类名称";
    const duplicated = categories.some((category) => category.id !== record?.id && category.status === "启用" && category.name.trim().toLowerCase() === name.toLowerCase());
    if (duplicated) nextErrors.name = "当前社区已存在同名的启用分类";
    if (!Number.isInteger(Number(form.displayOrder)) || Number(form.displayOrder) < 1) nextErrors.displayOrder = "展示顺序必须为大于 0 的整数";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ ...form, name, description: form.description.trim(), displayOrder: Number(form.displayOrder) });
  };
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer service-category-drawer" role="dialog" aria-modal="true" aria-label={record ? "编辑服务分类" : "新增服务分类"}>
    <header><div><h2>{record ? "编辑服务分类" : "新增服务分类"}</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
    <div className="drawer-body"><div className="form-section"><h3>分类信息</h3><label><span>分类名称 *</span><input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="例如：陪伴服务"/>{errors.name && <small className="field-error">{errors.name}</small>}</label><label><span>分类标识</span><input value={record?.code || "保存后自动生成"} disabled/><small className="field-help">分类标识保存后不可修改，供老人端和子女端稳定识别。</small></label><label><span>分类说明</span><textarea rows="4" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="说明该分类包含的服务范围"/></label><div className="form-row"><label><span>展示顺序 *</span><input type="number" min="1" value={form.displayOrder} onChange={(event) => update("displayOrder", event.target.value)}/>{errors.displayOrder && <small className="field-error">{errors.displayOrder}</small>}</label><label><span>分类状态</span><input value={form.status} disabled/></label></div>{record && <div className="form-tip"><div><b>当前可预约服务</b><p>{record.availableServiceCount} 项；修改名称后，新预约入口使用新名称，历史预约仍保留下单时的名称快照。</p></div></div>}</div></div>
    <footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={save}>保存分类</button></footer>
  </aside></div>;
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
    <header><div><h2>{record ? "编辑服务" : "新增服务"}</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
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
        <header><div><h2>预约服务详情</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
        <div className="drawer-body">
          <div className="service-booking-hero"><span><ClipboardList size={20}/></span><div><small>{booking.categoryNameSnapshot || booking.category}</small><h3>{booking.serviceName}</h3><p>{booking.slotLabel}</p></div><StatusTag>{booking.status}</StatusTag></div>
          <section className="detail-section"><h3>预约信息</h3><div className="info-grid"><div><span>预约老人</span><b>{elderly?.name || "老人档案已移除"}</b></div><div><span>联系电话</span><b>{elderly?.phone || "待补充"}</b></div><div><span>服务分类快照</span><b>{booking.categoryNameSnapshot || booking.category}</b></div><div><span>所属社区</span><b>{elderly?.community || "—"}</b></div><div className="full"><span>服务地址</span><b>{elderly?.address || "—"}</b></div><div className="full"><span>服务机构</span><b>{booking.provider}</b></div><div><span>提交时间</span><b>{booking.createdAt}</b></div><div><span>最近更新</span><b>{booking.updatedAt}</b></div></div></section>
          <section className="detail-section"><h3>服务进度</h3>{booking.status === "已取消" ? <div className="service-cancelled-state"><StatusTag>已取消</StatusTag><p>该预约已取消，不再进入后续服务流程。</p></div> : <div className="service-status-flow">{statusSteps.map((status, index) => <div className={index <= currentStep ? "completed" : ""} key={status}><i>{index < currentStep ? "✓" : index + 1}</i><span>{status}</span></div>)}</div>}<div className="service-operation-meta"><span>最近操作人</span><b>{booking.operator || "尚未处理"}</b></div></section>
        </div>
        <footer>{canCancel && <button className="secondary-button danger-text" onClick={() => setCancelConfirm(true)}>取消预约</button>}<span/><button className="secondary-button" onClick={onClose}>关闭</button>{action && <button className="primary-button" onClick={() => onUpdateStatus(booking.id, action.status)}>{action.label}</button>}</footer>
      </aside>
      {cancelConfirm && <div className="modal-layer"><button className="modal-backdrop" aria-label="关闭取消确认" onClick={() => setCancelConfirm(false)}/><section className="confirm-dialog" role="dialog" aria-modal="true" aria-label="取消预约"><span className="confirm-icon danger"><Trash2 size={20}/></span><h3>确认取消“{booking.serviceName}”预约？</h3><p>取消后，该预约不会继续确认或安排服务，老人端的预约状态也应同步显示为已取消。</p><div><button className="secondary-button" onClick={() => setCancelConfirm(false)}>保留预约</button><button className="danger-button" onClick={() => { onUpdateStatus(booking.id, "已取消"); setCancelConfirm(false); }}>确认取消</button></div></section></div>}
    </div>
  );
}

function CommunityActivityPage({ records, registrations, communityName, onCreate, onView, onEdit, onUnpublish, onRestore, onViewRegistrations }) {
  const initialFilters = { query: "", category: "全部分类", status: "全部状态" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [unpublishTarget, setUnpublishTarget] = useState(null);
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
    <div className="page-heading"><div><h1>社区活动</h1><p>管理{communityName}的活动安排、参加意向及可选直播</p></div><button className="primary-button" onClick={onCreate}><Plus size={16}/>新增活动</button></div>
    <section className="panel management-panel community-activity-panel">
      <div className="filters community-activity-filters"><label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="活动名称、说明或地点"/></div></label><label><span>活动分类</span><select className="select-control filter-select" value={draftFilters.category} onChange={(event) => setDraftFilters((current) => ({ ...current, category: event.target.value }))}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label><span>活动状态</span><select className="select-control filter-select" value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}><option>全部状态</option><option>未开始</option><option>进行中</option><option>已结束</option><option>已下架</option></select></label><div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div></div>
      <div className="table-scroll"><table className="community-activity-table"><thead><tr><th>活动名称</th><th>时间 / 地点</th><th>报名阶段</th><th>参加意向</th><th>直播</th><th>推荐同步</th><th>活动状态</th><th className="sticky-right">操作</th></tr></thead><tbody>
        {rows.map((record) => { const registrationCount = registrations.filter((item) => item.activityId === record.id && item.status === "想参加").length; const live = getActivityLivePresentation(record); return <tr key={record.id}><td><button className="activity-title-cell" onClick={() => onView(record)}><img src={record.cover || activityHealthCover} alt=""/><span><b>{record.title}</b><small>{record.category} · {record.description || "暂无活动说明"}</small></span></button></td><td><div className="stacked-cell"><b>{record.startAt.replace("T", " ")}</b><small>{record.location}</small></div></td><td><div className="stacked-cell"><StatusTag>{record.registrationPhase}</StatusTag><small>截止 {record.registrationEndAt.replace("T", " ")}</small></div></td><td><button className="registration-count-button" onClick={() => onViewRegistrations(record)}>{registrationCount} 人想参加</button></td><td><div className="stacked-cell activity-live-cell"><StatusTag>{live.label}</StatusTag><small>{live.detail}</small></div></td><td><StatusTag>{record.syncToRecommendation ? "已同步" : "未同步"}</StatusTag></td><td><StatusTag>{record.status}</StatusTag></td><td className="sticky-right"><button className="table-action" onClick={() => onView(record)}>详情</button><button className="table-action" onClick={() => onViewRegistrations(record)}>参加意向</button><button className="table-action" onClick={() => onEdit(record)}>编辑</button>{record.isOffline ? <button className="table-action" onClick={() => onRestore(record.id)}>重新上架</button> : <button className="table-action danger-text" onClick={() => setUnpublishTarget(record)}>下架</button>}</td></tr>; })}
        {!rows.length && <tr><td colSpan="8"><div className="empty-table-state">当前社区暂无符合条件的活动</div></td></tr>}
      </tbody></table></div><div className="pagination"><span>当前展示 {rows.length} 条数据</span></div>
    </section>
    {unpublishTarget && <div className="modal-layer"><button className="modal-backdrop" aria-label="取消下架活动" onClick={() => setUnpublishTarget(null)}/><section className="confirm-dialog" role="dialog" aria-modal="true" aria-label="下架活动确认"><span className="confirm-icon warning"><AlertTriangle size={20}/></span><h3>下架“{unpublishTarget.title}”？</h3><p>下架后老人端不再展示该活动，推荐策略中的相关投放也不再生效；历史参加意向保留。</p><div><button className="secondary-button" onClick={() => setUnpublishTarget(null)}>取消</button><button className="danger-button" onClick={() => { onUnpublish(unpublishTarget.id); setUnpublishTarget(null); }}>确认下架</button></div></section></div>}
  </>;
}

function compressUploadedImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error("图片格式无法识别"));
      image.onload = () => {
        const maxSide = 1200;
        const scale = Math.min(1, maxSide / image.width, maxSide / image.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve({ id: `IMG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: file.name, url: canvas.toDataURL("image/jpeg", 0.78) });
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function escapeRichText(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function legacyContentToHtml(text = "", images = []) {
  const paragraphs = String(text).split(/\n+/).filter(Boolean).map((paragraph) => `<p>${escapeRichText(paragraph)}</p>`).join("");
  const imageHtml = images.filter((image) => image?.url).map((image) => `<p><img src="${escapeRichText(image.url)}" alt="${escapeRichText(image.name || "正文图片")}" /></p>`).join("");
  return paragraphs || imageHtml ? `${paragraphs}${imageHtml}` : "<p><br></p>";
}

function richTextToPlainText(html = "") {
  const container = document.createElement("div");
  container.innerHTML = html;
  return (container.textContent || "").replace(/\s+/g, " ").trim();
}

function RichTextEditor({ label, value, readOnly = false, error, onChange }) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [uploadError, setUploadError] = useState("");
  const [fontSize, setFontSize] = useState("3");

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value || "<p><br></p>";
  }, [value]);

  const rememberSelection = () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editorRef.current?.contains(selection.anchorNode)) return;
    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
  };
  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !savedRangeRef.current) return;
    selection.removeAllRanges();
    selection.addRange(savedRangeRef.current);
  };
  const emitValue = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };
  const runCommand = (command, commandValue = null) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, commandValue);
    emitValue();
    rememberSelection();
  };
  const insertImages = async (fileList) => {
    const currentCount = editorRef.current?.querySelectorAll("img").length || 0;
    const files = Array.from(fileList || []).slice(0, Math.max(0, 6 - currentCount));
    if (!files.length) {
      setUploadError(currentCount >= 6 ? "正文中最多插入 6 张图片" : "");
      return;
    }
    try {
      const images = await Promise.all(files.map(compressUploadedImage));
      editorRef.current?.focus();
      restoreSelection();
      const html = images.map((image) => `<p><img src="${image.url}" alt="${escapeRichText(image.name)}" /></p>`).join("");
      document.execCommand("insertHTML", false, `${html}<p><br></p>`);
      emitValue();
      rememberSelection();
      setUploadError("");
    } catch (imageError) {
      setUploadError(imageError.message || "图片插入失败，请重试");
    }
  };

  if (readOnly) return <div className="rich-text-field rich-text-readonly"><span>{label}</span><div className="rich-text-preview" dangerouslySetInnerHTML={{ __html: value || "<p>未填写内容</p>" }}/></div>;

  return <div className="rich-text-field">
    <span>{label}</span>
    <div className="rich-text-editor-shell">
      <div className="rich-text-toolbar">
        <select aria-label="字体大小" value={fontSize} onMouseDown={rememberSelection} onChange={(event) => { setFontSize(event.target.value); runCommand("fontSize", event.target.value); }}><option value="2">小号</option><option value="3">正文</option><option value="5">大号</option></select>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("bold")}><b>B</b> 加粗</button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertUnorderedList")}>项目符号</button>
        <label>插入图片<input type="file" accept="image/*" multiple onClick={rememberSelection} onChange={(event) => { insertImages(event.target.files); event.target.value = ""; }}/></label>
      </div>
      <div ref={editorRef} className="rich-text-editor" contentEditable suppressContentEditableWarning data-placeholder="请输入文字，也可以在光标位置插入图片" onInput={emitValue} onMouseUp={rememberSelection} onKeyUp={rememberSelection} onBlur={rememberSelection} onPaste={(event) => { event.preventDefault(); document.execCommand("insertText", false, event.clipboardData.getData("text/plain")); emitValue(); }} onDrop={(event) => event.preventDefault()}/>
    </div>
    {(error || uploadError) && <small className="field-error">{error || uploadError}</small>}
  </div>;
}

function CommunityActivityDrawer({ record, mode = "edit", currentProject, onClose, onSave, onSetLiveMockState }) {
  const readOnly = mode === "view";
  const [form, setForm] = useState(() => {
    if (record) {
      const { contentImages = [], ...rest } = record;
      return { ...rest, syncToRecommendation: record.syncToRecommendation ?? true, contentHtml: record.contentHtml || legacyContentToHtml(record.description, contentImages) };
    }
    return { projectId: currentProject?.id, title: "", category: "", description: "", contentHtml: "<p><br></p>", cover: "", startAt: "", endAt: "", location: "", capacity: 30, registrationStartAt: "", registrationEndAt: "", isOffline: false, contact: "", liveEnabled: false, liveStatus: "not_started", scheduledLiveStartAt: "", zoomMeetingId: "", zoomMeetingPassword: "", zoomJoinUrl: "", liveMockState: "normal", syncToRecommendation: true };
  });
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
    if (!form.startAt || !form.endAt) nextErrors.time = "请选择活动开始和结束时间";
    if (form.startAt && form.endAt && form.startAt >= form.endAt) nextErrors.time = "结束时间必须晚于开始时间";
    if (!form.registrationStartAt || !form.registrationEndAt) nextErrors.registration = "请选择报名开始和截止时间";
    if (!form.location.trim()) nextErrors.location = "请输入活动地点";
    if (!form.contact.trim()) nextErrors.contact = "请输入联系电话";
    Object.assign(nextErrors, validateActivityLiveConfig(form));
    const plainContent = richTextToPlainText(form.contentHtml);
    if (!plainContent) nextErrors.contentHtml = "请输入活动详情内容";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ ...form, title: form.title.trim(), location: form.location.trim(), contact: form.contact.trim(), zoomMeetingId: form.zoomMeetingId.trim(), zoomMeetingPassword: form.zoomMeetingPassword.trim(), zoomJoinUrl: form.zoomJoinUrl.trim(), description: plainContent, contentHtml: form.contentHtml });
  };
  const retainedLiveConfig = Boolean(form.scheduledLiveStartAt || form.zoomMeetingId || form.zoomMeetingPassword || form.zoomJoinUrl);
  const livePresentation = getActivityLivePresentation(form);
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className={`drawer community-activity-drawer ${readOnly ? "drawer-readonly" : ""}`} role="dialog" aria-modal="true" aria-label={readOnly ? "活动详情" : record ? "编辑活动" : "新增活动"}>
    <header><div><h2>{readOnly ? "活动详情" : record ? "编辑活动" : "新增活动"}</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
    <div className="drawer-body"><div className="form-section"><h3>活动内容</h3><div className="activity-cover-field"><span>活动封面</span><div className="activity-cover-upload">{form.cover ? <img src={form.cover} alt="活动封面预览"/> : <span><CalendarDays size={22}/></span>}<div><b>{form.cover ? "已选择活动封面" : "上传活动封面"}</b><small>用于活动列表入口，与详情正文分开维护</small></div><label className="secondary-button">{form.cover ? "更换图片" : "选择图片"}<input type="file" accept="image/*" onChange={(event) => uploadCover(event.target.files?.[0])}/></label></div></div><label><span>活动名称 *</span><input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="请输入活动名称"/>{errors.title && <small className="field-error">{errors.title}</small>}</label><label><span>活动分类 *</span><select className="select-control form-select-native" value={form.category} onChange={(event) => update("category", event.target.value)}><option value="">请选择活动分类</option><option>健康活动</option><option>安全讲座</option><option>兴趣活动</option><option>社区交流</option></select>{errors.category && <small className="field-error">{errors.category}</small>}</label><RichTextEditor label="活动详情内容 *" value={form.contentHtml} readOnly={readOnly} error={errors.contentHtml} onChange={(html) => update("contentHtml", html)}/></div>
      <div className="form-section community-activity-time-section"><h3>时间、地点与报名</h3><div className="form-row"><label><span>开始时间 *</span><input type="datetime-local" value={form.startAt} onChange={(event) => update("startAt", event.target.value)}/></label><label><span>结束时间 *</span><input type="datetime-local" value={form.endAt} onChange={(event) => update("endAt", event.target.value)}/></label></div>{errors.time && <small className="field-error">{errors.time}</small>}<label><span>活动地点 *</span><input value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="请输入活动地点"/>{errors.location && <small className="field-error">{errors.location}</small>}</label><div className="form-row"><label><span>报名开始 *</span><input type="datetime-local" value={form.registrationStartAt} onChange={(event) => update("registrationStartAt", event.target.value)}/></label><label><span>报名截止 *</span><input type="datetime-local" value={form.registrationEndAt} onChange={(event) => update("registrationEndAt", event.target.value)}/></label></div>{errors.registration && <small className="field-error">{errors.registration}</small>}<label><span>名额</span><input type="number" min="1" value={form.capacity} onChange={(event) => update("capacity", Number(event.target.value))}/></label><label><span>联系电话 *</span><input type="tel" value={form.contact} onChange={(event) => update("contact", event.target.value)} placeholder="例如：+65 6273 2288"/>{errors.contact && <small className="field-error">{errors.contact}</small>}</label><small className="field-help">活动状态由报名时间和活动时间自动计算，无需手动选择。</small></div>
      <div className="form-section community-activity-live-section"><div className="form-section-heading"><div><h3>Zoom 直播</h3><p>仅维护活动的 Zoom 会议信息，不在后台控制开始或结束</p></div>{!readOnly && <label className="activity-live-toggle"><input type="checkbox" checked={form.liveEnabled} onChange={(event) => update("liveEnabled", event.target.checked)}/><span>{form.liveEnabled ? "提供直播" : "不提供"}</span></label>}</div>
        {readOnly && <div className="activity-live-summary"><div><span>Zoom 直播状态</span><StatusTag>{livePresentation.label}</StatusTag></div><small>{livePresentation.detail}；状态由 Zoom 同步，社区后台不控制开始或结束。</small></div>}
        {(form.liveEnabled || (readOnly && retainedLiveConfig)) && <div className="activity-live-fields"><label><span>预计开播时间 *</span><input type="datetime-local" value={form.scheduledLiveStartAt} disabled={readOnly || !form.liveEnabled} onChange={(event) => update("scheduledLiveStartAt", event.target.value)}/>{errors.scheduledLiveStartAt && <small className="field-error">{errors.scheduledLiveStartAt}</small>}</label><div className="form-row"><label><span>Zoom 会议 ID *</span><input inputMode="numeric" value={form.zoomMeetingId} disabled={readOnly || !form.liveEnabled} onChange={(event) => update("zoomMeetingId", event.target.value)} placeholder="例如：856 2011 4028"/>{errors.zoomMeetingId && <small className="field-error">{errors.zoomMeetingId}</small>}</label><label><span>Zoom 会议密码</span><input value={form.zoomMeetingPassword} disabled={readOnly || !form.liveEnabled} onChange={(event) => update("zoomMeetingPassword", event.target.value)} placeholder="如会议设置密码则填写"/></label></div><label><span>Zoom 加入链接</span><input value={form.zoomJoinUrl} disabled={readOnly || !form.liveEnabled} onChange={(event) => update("zoomJoinUrl", event.target.value)} placeholder="可选，例如：https://zoom.us/j/85620114028"/><small className="field-help">老人端优先拉起 Zoom App；拉起失败时使用该链接进入 Zoom H5。</small>{errors.zoomJoinUrl && <small className="field-error">{errors.zoomJoinUrl}</small>}</label></div>}
        {!form.liveEnabled && !retainedLiveConfig && <div className="activity-live-empty">当前活动不提供直播，老人端仅展示线下活动信息。</div>}
      </div>
      <div className="form-section recommendation-sync-section"><h3>推荐同步</h3><label className="recommendation-sync-control"><input type="checkbox" role="switch" checked={Boolean(form.syncToRecommendation)} disabled={readOnly} onChange={(event) => update("syncToRecommendation", event.target.checked)}/><span><b>同步到推荐</b><small>保存活动后自动创建或恢复唯一推荐；关闭后仅停止推荐同步，不删除关联记录。</small></span><StatusTag>{form.syncToRecommendation ? "已开启" : "未开启"}</StatusTag></label></div>
    </div><footer><button className="secondary-button" onClick={onClose}>{readOnly ? "关闭" : "取消"}</button>{!readOnly && <button className="primary-button" onClick={save}>保存活动</button>}</footer>
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
  const activeCount = registrations.filter((registration) => registration.activityId === activity.id && registration.status === "想参加").length;
  const reset = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
  };
  return <div className="modal-layer activity-registration-layer"><button className="modal-backdrop" aria-label="关闭参加意向弹窗" onClick={onClose}/><section className="activity-registration-dialog" role="dialog" aria-modal="true" aria-label={`${activity.title}参加意向`}>
    <header><div><h3>老人参加意向</h3></div><button className="icon-button" onClick={onClose}><X size={18}/></button></header>
    <div className="activity-registration-summary"><div><span>有参加意向</span><b>{activeCount}</b></div><p>这里只记录老人端反馈结果，不代表社区已经确认报名名额。</p></div>
    <div className="activity-registration-filters"><label><span>搜索老人</span><div className="input-wrap"><Search size={16}/><input autoFocus value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="姓名或手机号"/></div></label><label><span>意向结果</span><select className="select-control form-select-native" value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}><option>全部状态</option><option>想参加</option><option>暂不参加</option></select></label><div><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div></div>
    <div className="activity-registration-table-wrap"><table className="activity-registration-table"><thead><tr><th>老人信息</th><th>联系电话</th><th>提交时间</th><th>参加意向</th></tr></thead><tbody>{rows.map((registration) => <tr key={registration.id}><td>{registration.elderly ? <div className="elderly-name-cell"><span className="person-avatar">{registration.elderly.name.slice(-1)}</span><span><b>{registration.elderly.name}</b><small>{registration.elderly.gender} · {registration.elderly.age} 岁</small></span></div> : "老人档案已移除"}</td><td>{registration.elderly?.phone || "电话待补充"}</td><td>{registration.registeredAt}</td><td><StatusTag>{registration.status}</StatusTag></td></tr>)}{!rows.length && <tr><td colSpan="4"><div className="empty-table-state">暂无符合条件的参加意向</div></td></tr>}</tbody></table></div>
    <footer><span>当前展示 {rows.length} 条意向记录</span><button className="secondary-button" onClick={onClose}>关闭</button></footer>
  </section></div>;
}

function CommunityTopicPanel({ records, contentRecords, onCreate, onView }) {
  const initialFilters = { query: "", initiator: "全部来源", referenced: "全部", status: "全部状态" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const rows = records.filter((record) => {
    const keyword = filters.query.trim().toLowerCase();
    const matchesKeyword = !keyword || [record.title, record.body, record.initiatorName, record.referenceSnapshot?.title].some((value) => `${value || ""}`.toLowerCase().includes(keyword));
    return matchesKeyword
      && (filters.initiator === "全部来源" || (filters.initiator === "老人发起" ? record.initiatorType === "elderly" : record.initiatorType === "admin"))
      && (filters.referenced === "全部" || (filters.referenced === "已引用" ? Boolean(record.referenceContentId) : !record.referenceContentId))
      && (filters.status === "全部状态" || (filters.status === "进行中" ? record.status === "open" : record.status === "closed"));
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const referenceStatus = (record) => {
    if (!record.referenceContentId) return "";
    const source = contentRecords.find((item) => item.id === record.referenceContentId);
    return source && getCommunityContentStatus(source) === "已发布" && source.type === "生活资讯" ? "有效" : "已失效";
  };
  const reset = () => { setDraftFilters(initialFilters); setFilters(initialFilters); };
  return <>
    <div className="topic-filter-heading"><span>话题管理</span></div>
    <div className="filters community-topic-filters">
      <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="话题标题、发起人或引用资讯"/></div></label>
      <label><span>发起来源</span><select className="select-control filter-select" value={draftFilters.initiator} onChange={(event) => setDraftFilters((current) => ({ ...current, initiator: event.target.value }))}><option>全部来源</option><option>后台发起</option><option>老人发起</option></select></label>
      <label><span>引用资讯</span><select className="select-control filter-select" value={draftFilters.referenced} onChange={(event) => setDraftFilters((current) => ({ ...current, referenced: event.target.value }))}><option>全部</option><option>已引用</option><option>未引用</option></select></label>
      <label><span>话题状态</span><select className="select-control filter-select" value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}><option>全部状态</option><option>进行中</option><option>已关闭</option></select></label>
      <div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div>
    </div>
    <div className="table-toolbar"><div><span className="result-count">共 {rows.length} 个话题</span><span className="toolbar-note">老人发起的话题会进入当前社区列表</span></div><button className="icon-button" title="刷新"><RefreshCw size={16}/></button></div>
    <div className="table-scroll"><table className="community-topic-table"><thead><tr><th>话题标题</th><th>发起人</th><th>引用生活资讯</th><th>评论数</th><th>创建时间</th><th>状态</th><th className="sticky-right">操作</th></tr></thead><tbody>
        {rows.map((record) => <tr key={record.id}><td><button className="topic-title-cell" onClick={() => onView(record)}><b>{record.title}</b><small>{record.body}</small></button></td><td><div className="stacked-cell"><StatusTag>{record.initiatorType === "elderly" ? "老人发起" : "后台发起"}</StatusTag><small>{record.initiatorName}</small></div></td><td>{record.referenceSnapshot ? <div className="stacked-cell"><b>{record.referenceSnapshot.title}</b><small className={referenceStatus(record) === "已失效" ? "danger-text" : ""}>{referenceStatus(record) === "已失效" ? "引用资讯已失效" : "引用快照已保存"}</small></div> : <span className="muted-text">未引用</span>}</td><td>{record.commentCount} 条</td><td>{record.createdAt}</td><td><StatusTag>{record.status === "open" ? "进行中" : "已关闭"}</StatusTag></td><td className="sticky-right"><button className="table-action" onClick={() => onView(record)}>详情</button></td></tr>)}
        {!rows.length && <tr><td colSpan="7"><div className="empty-table-state">暂无符合条件的社区话题</div></td></tr>}
    </tbody></table></div><div className="pagination"><span>当前展示 {rows.length} 条数据</span></div>
  </>;
}

function SafetyNewsPage({ records, contentType, communityName, onCreate, onView, onEdit, onStatusChange }) {
  const initialFilters = { query: "", status: "全部状态" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const rows = records.filter((record) => {
    const keyword = filters.query.trim().toLowerCase();
    const matchesKeyword = !keyword || [record.title, record.description, record.content].some((value) => `${value || ""}`.toLowerCase().includes(keyword));
    const derivedStatus = getCommunityContentStatus(record);
    return record.type === contentType
      && matchesKeyword
      && (filters.status === "全部状态" || derivedStatus === filters.status);
  });
  const reset = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
  };

  return (
    <>
      <div className="page-heading"><div><h1>{contentType}</h1><p>管理{communityName}的{contentType}，内容仅在当前社区内维护</p></div><button className="primary-button" onClick={onCreate}><Plus size={16}/>新增{contentType === "生活资讯" ? "资讯" : contentType === "社区公告" ? "公告" : "事项"}</button></div>
      <section className="panel management-panel safety-news-panel">
        <div className="filters safety-news-filters">
          <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="内容标题、摘要或正文"/></div></label>
          <label><span>发布状态</span><select className="select-control filter-select" value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}><option>全部状态</option><option>未发布</option><option>已发布</option><option>已停用</option></select></label>
          <div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div>
        </div>
        <div className="table-scroll">
          <table className="safety-news-table">
            <thead><tr><th>内容标题</th><th>适用对象</th><th>发布时间</th><th>展示顺序</th><th>推荐同步</th><th>状态</th><th className="sticky-right">操作</th></tr></thead>
            <tbody>
              {rows.map((record) => { const status = getCommunityContentStatus(record); return <tr key={record.id}><td><button className="safety-title-cell" onClick={() => onView(record)}><b>{record.title}</b><small>{record.description || "未填写摘要"}</small></button></td><td>{record.audience}</td><td>{status === "未发布" ? <span className="muted-text">—</span> : record.publishAt}</td><td>{record.displayOrder}</td><td><StatusTag>{record.syncToRecommendation ? "已同步" : "未同步"}</StatusTag></td><td><StatusTag>{status}</StatusTag></td><td className="sticky-right"><button className="table-action" onClick={() => onView(record)}>详情</button><button className="table-action" onClick={() => onEdit(record)}>编辑</button><button className={`table-action ${status === "已发布" ? "danger-text" : ""}`} onClick={() => status === "已发布" ? setConfirmTarget(record) : onStatusChange(record.id, "已发布")}>{status === "已发布" ? "停用" : "发布"}</button></td></tr>; })}
              {!rows.length && <tr><td colSpan="7"><div className="empty-table-state">当前社区暂无符合条件的内容</div></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="pagination"><span>当前展示 {rows.length} 条数据</span></div>
      </section>
      {confirmTarget && <div className="modal-layer"><button className="modal-backdrop" aria-label="关闭停用确认" onClick={() => setConfirmTarget(null)}/><section className="confirm-dialog" role="dialog" aria-modal="true" aria-label="停用社区内容"><span className="confirm-icon warning"><AlertTriangle size={20}/></span><h3>停用“{confirmTarget.title}”？</h3><p>停用后内容不再进入老人端展示，也不会再出现在推荐策略的可选来源中。</p><div><button className="secondary-button" onClick={() => setConfirmTarget(null)}>取消</button><button className="danger-button" onClick={() => { onStatusChange(confirmTarget.id, "已停用"); setConfirmTarget(null); }}>确认停用</button></div></section></div>}
    </>
  );
}

function SafetyNewsDrawer({ record, mode = "edit", contentType = "社区公告", currentProject, onClose, onSave }) {
  const readOnly = mode === "view";
  const [form, setForm] = useState(() => {
    if (record) {
      const { contentImages = [], ...rest } = record;
      return { ...rest, syncToRecommendation: record.syncToRecommendation ?? true, contentHtml: record.contentHtml || legacyContentToHtml(record.content, contentImages) };
    }
    return {
      projectId: currentProject?.id,
      title: "",
      type: contentType,
      content: "",
      contentHtml: "<p><br></p>",
      description: "",
      cover: "",
      source: currentProject?.name || "",
      audience: "当前社区全部老人",
      publishAt: "2026-08-24 10:00",
      validUntil: "2026-09-24 23:59",
      displayOrder: 1,
      status: "未发布",
      syncToRecommendation: true,
    };
  });
  const [errors, setErrors] = useState({});
  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };
  const submit = () => {
    const nextErrors = {};
    const plainContent = richTextToPlainText(form.contentHtml);
    if (!form.title.trim()) nextErrors.title = "请输入内容标题";
    if (!plainContent) nextErrors.contentHtml = "请输入正文内容";
    if (!Number.isInteger(Number(form.displayOrder)) || Number(form.displayOrder) < 1) nextErrors.displayOrder = "展示顺序必须为大于等于 1 的整数";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({
      ...form,
      title: form.title.trim(),
      content: plainContent,
      contentHtml: form.contentHtml,
      audience: "当前社区全部老人",
      source: `${form.source || ""}`.trim() || currentProject?.name || "",
      displayOrder: Number(form.displayOrder),
      publishAt: form.publishAt || "2026-08-24 10:00",
    });
  };

  return (
    <div className="drawer-layer" role="presentation">
      <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
      <aside className={`drawer safety-news-drawer ${readOnly ? "drawer-readonly" : ""}`} role="dialog" aria-modal="true" aria-label={readOnly ? `${form.type}详情` : record ? `编辑${form.type}` : `新增${form.type}`}>
        <header><div><h2>{readOnly ? `${form.type}详情` : record ? `编辑${form.type}` : `新增${form.type}`}</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
        <div className="drawer-body" inert={readOnly ? true : undefined}>
          <div className="form-section safety-content-section">
            <h3>内容信息</h3>
            <div className="cover-field"><span>封面图片</span><div className="cover-upload-control"><div className="cover-upload-copy"><span><Upload size={17}/></span><div><b>{form.cover || "上传封面图片"}</b><small>用于内容列表入口，与正文图片分开维护</small></div></div><label className="secondary-button">{form.cover ? "更换图片" : "选择图片"}<input type="file" accept="image/*" onChange={(event) => update("cover", event.target.files?.[0]?.name || "")}/></label></div></div>
            <label><span>内容标题 *</span><input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="请输入内容标题"/>{errors.title && <small className="field-error">{errors.title}</small>}</label>
            <label className="safety-description-field"><span>内容摘要</span><textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="用于列表和推荐资源选择时快速辨别" rows="3"/></label>
            <RichTextEditor label="正文内容 *" value={form.contentHtml} readOnly={readOnly} error={errors.contentHtml} onChange={(html) => update("contentHtml", html)}/>
          </div>
          <div className="form-section safety-publish-section">
            <h3>发布设置</h3>
            <div className="form-row"><label><span>展示顺序 *</span><input type="number" min="1" value={form.displayOrder} onChange={(event) => update("displayOrder", event.target.value)} placeholder="请输入大于等于 1 的整数"/>{errors.displayOrder && <small className="field-error">{errors.displayOrder}</small>}</label><label><span>发布来源</span><input value={form.source} onChange={(event) => update("source", event.target.value)} placeholder={currentProject?.name || "当前社区名称"}/></label></div>
            <label><span>适用对象</span><input value="当前社区全部老人" disabled/><small className="field-help">本轮适用对象固定为当前社区全部老人，不支持手工选择老人、标签或人群。</small></label>
            <label className="recommendation-sync-control"><input type="checkbox" role="switch" checked={Boolean(form.syncToRecommendation)} disabled={readOnly} onChange={(event) => update("syncToRecommendation", event.target.checked)}/><span><b>同步到推荐</b><small>{getCommunityContentStatus(form) === "已发布" ? "修改后立即同步到推荐内容；关闭后保留关联记录但停止展示。" : "发布时自动创建推荐；草稿阶段不会生成推荐记录。"}</small></span><StatusTag>{form.syncToRecommendation ? "已开启" : "未开启"}</StatusTag></label>
          </div>
        </div>
        <footer><button className="secondary-button" onClick={onClose}>{readOnly ? "关闭" : "取消"}</button>{!readOnly && <button className="primary-button" onClick={submit}>{record ? "保存修改" : "保存内容"}</button>}</footer>
      </aside>
    </div>
  );
}

function CommunityTopicDrawer({ currentProject, contentRecords, onClose, onSave }) {
  const [form, setForm] = useState({ title: "", bodyHtml: "<p><br></p>", referenceContentId: "" });
  const [errors, setErrors] = useState({});
  const availableReferences = contentRecords.filter((record) => record.type === "生活资讯" && getCommunityContentStatus(record) === "已发布");
  const selectedReference = availableReferences.find((record) => record.id === form.referenceContentId);
  const update = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: "" })); };
  const submit = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "请输入话题标题";
    if (!richTextToPlainText(form.bodyHtml)) nextErrors.bodyHtml = "请输入话题正文";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({
      ...form,
      title: form.title.trim(),
      body: richTextToPlainText(form.bodyHtml),
      projectId: currentProject.id,
      communityId: communityLifeMock.communities.find((item) => item.projectId === currentProject.id)?.communityId || currentProject.id,
      initiatorType: "admin",
      initiatorId: "ADMIN-CURRENT",
      initiatorName: "赵亚男",
      referenceContentId: selectedReference?.id || null,
      referenceSnapshot: selectedReference ? { title: selectedReference.title, summary: selectedReference.description, coverUrl: selectedReference.coverUrl || "" } : null,
      commentCount: 0,
      status: "open",
    });
  };
  return <div className="drawer-layer" role="presentation"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer community-topic-drawer" role="dialog" aria-modal="true" aria-label="发起社区话题">
    <header><div><h2>发起社区话题</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
    <div className="drawer-body"><div className="form-section"><h3>话题内容</h3><label><span>话题标题 *</span><input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="请输入清晰、可交流的话题标题"/>{errors.title && <small className="field-error">{errors.title}</small>}</label><RichTextEditor label="话题正文 *" value={form.bodyHtml} error={errors.bodyHtml} onChange={(html) => update("bodyHtml", html)}/></div>
      <div className="form-section"><h3>引用生活资讯</h3><p className="section-helper">可选。仅能引用当前社区已发布且有效的生活资讯，保存时同步留存标题、摘要和封面快照。</p><label><span>选择资讯</span><select className="form-select-native" value={form.referenceContentId} onChange={(event) => update("referenceContentId", event.target.value)}><option value="">不引用资讯</option>{availableReferences.map((record) => <option key={record.id} value={record.id}>{record.title} · {record.updatedAt}</option>)}</select></label>{selectedReference && <div className="topic-reference-card"><span className="topic-reference-cover">{selectedReference.cover ? <img src={selectedReference.cover} alt=""/> : <BookOpen size={20}/>}</span><div><small>已选择生活资讯</small><b>{selectedReference.title}</b><p>{selectedReference.description}</p><span>更新于 {selectedReference.updatedAt}</span></div></div>}</div>
    </div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={submit}>保存话题</button></footer>
  </aside></div>;
}

function CommunityTopicDetailDrawer({ topic, comments, contentRecords, onClose, onCloseTopic }) {
  const [confirmClose, setConfirmClose] = useState(false);
  const referenceSource = contentRecords.find((record) => record.id === topic.referenceContentId);
  const referenceExpired = topic.referenceContentId && (!referenceSource || referenceSource.type !== "生活资讯" || getCommunityContentStatus(referenceSource) !== "已发布");
  return <><div className="drawer-layer" role="presentation"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer community-topic-drawer topic-detail-drawer" role="dialog" aria-modal="true" aria-label="社区话题详情">
    <header><div><h2>话题详情</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
    <div className="drawer-body"><div className="topic-detail-heading"><div><StatusTag>{topic.initiatorType === "elderly" ? "老人发起" : "后台发起"}</StatusTag><StatusTag>{topic.status === "open" ? "进行中" : "已关闭"}</StatusTag></div><h3>{topic.title}</h3><p>{topic.initiatorName} · {topic.createdAt}</p></div>
      <section className="topic-detail-section"><h3>话题正文</h3><div className="rich-text-preview" dangerouslySetInnerHTML={{ __html: topic.bodyHtml }}/></section>
      {topic.referenceSnapshot && <section className="topic-detail-section"><div className="topic-section-heading"><h3>引用生活资讯</h3>{referenceExpired && <StatusTag>已失效</StatusTag>}</div><div className={`topic-reference-card ${referenceExpired ? "is-expired" : ""}`}><span className="topic-reference-cover"><BookOpen size={20}/></span><div><b>{topic.referenceSnapshot.title}</b><p>{topic.referenceSnapshot.summary}</p><span>{referenceExpired ? "原资讯已停用或失效，话题仍保留创建时快照" : "引用资讯当前有效"}</span></div></div></section>}
      <section className="topic-detail-section topic-comment-section"><div className="topic-section-heading"><div><h3>一级评论</h3><p>后台仅查看，不提供回复或多级评论</p></div><span>{comments.length} 条</span></div><div className="topic-comment-list">{comments.map((comment) => <article key={comment.id}><span className="person-avatar">{comment.authorName.slice(-1)}</span><div><header><b>{comment.authorName}</b><StatusTag>{comment.authorType === "elderly" ? "老人" : "社区"}</StatusTag><time>{comment.createdAt}</time></header><p>{comment.content}</p></div></article>)}{!comments.length && <div className="topic-empty-comments"><MessageSquareText size={26}/><b>暂无评论</b><span>话题已发布，尚未收到老人留言。</span></div>}</div></section>
    </div><footer><button className="secondary-button" onClick={onClose}>关闭</button>{topic.status === "open" && <button className="danger-button" onClick={() => setConfirmClose(true)}>关闭话题</button>}</footer>
  </aside></div>{confirmClose && <div className="modal-layer"><button className="modal-backdrop" aria-label="取消关闭话题" onClick={() => setConfirmClose(false)}/><section className="confirm-dialog" role="dialog" aria-modal="true" aria-label="关闭社区话题"><span className="confirm-icon warning"><AlertTriangle size={20}/></span><h3>关闭“{topic.title}”？</h3><p>关闭后保留话题正文和历史评论，但老人端不能再提交新评论。</p><div><button className="secondary-button" onClick={() => setConfirmClose(false)}>取消</button><button className="danger-button" onClick={() => { onCloseTopic(topic.id); setConfirmClose(false); }}>确认关闭</button></div></section></div>}</>;
}

function AuditLogDetailDrawer({ record, onClose }) {
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭日志详情" onClick={onClose}/><aside className="drawer audit-log-drawer" role="dialog" aria-modal="true" aria-label="操作日志详情"><header><div><h2>日志详情</h2></div><button className="icon-button" aria-label="关闭" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><section className="detail-section"><h3>操作信息</h3><div className="info-grid"><div><span>操作时间</span><b>{record.time}</b></div><div><span>操作结果</span><b className={`audit-result ${record.result === "成功" ? "success" : "failed"}`}>{record.result}</b></div><div><span>操作人</span><b>{record.operator}</b></div><div><span>所属账号 / 角色</span><b>{record.accountRole}</b></div><div><span>功能模块</span><b>{record.module}</b></div><div><span>操作类型</span><b>{record.action}</b></div><div className="full"><span>操作对象</span><b>{record.target}</b></div><div className="full"><span>IP / 终端</span><b>{record.client}</b></div></div></section><section className="detail-section"><h3>变更摘要</h3><div className="audit-change-grid"><div><span>变更前</span><p>{record.before}</p></div><div><span>变更后</span><p>{record.after}</p></div></div></section><section className="detail-section"><h3>操作摘要</h3><p className="audit-summary-detail">{record.summary}</p>{record.failureReason && <div className="audit-failure-note"><b>失败原因</b><p>{record.failureReason}</p></div>}</section></div><footer><button className="secondary-button" onClick={onClose}>关闭</button></footer></aside></div>;
}

function OperationLogPage({ records = initialPlatformAuditLogs }) {
  const [query, setQuery] = useState("");
  const [operator, setOperator] = useState("");
  const [module, setModule] = useState("全部模块");
  const [action, setAction] = useState("全部类型");
  const [result, setResult] = useState("全部结果");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState(null);
  const modules = [...new Set(records.map((record) => record.module))];
  const actions = [...new Set(records.map((record) => record.action))];
  const filtered = records.filter((record) => {
    const keyword = query.trim().toLowerCase();
    const keywordMatched = !keyword || `${record.operator}${record.target}`.toLowerCase().includes(keyword);
    const operatorMatched = !operator.trim() || record.operator.includes(operator.trim());
    const date = record.time.slice(0, 10);
    return keywordMatched && operatorMatched && (module === "全部模块" || record.module === module) && (action === "全部类型" || record.action === action) && (result === "全部结果" || record.result === result) && (!startDate || date >= startDate) && (!endDate || date <= endDate);
  });
  const reset = () => { setQuery(""); setOperator(""); setModule("全部模块"); setAction("全部类型"); setResult("全部结果"); setStartDate(""); setEndDate(""); };
  return <><div className="page-heading"><div><h1>操作日志</h1><p>追溯平台管理操作、变更结果与失败原因；日志不可编辑</p></div></div><section className="panel management-panel audit-log-panel"><div className="filters audit-log-filters"><label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="操作人或操作对象"/></div></label><label><span>操作人</span><input value={operator} onChange={(event) => setOperator(event.target.value)} placeholder="输入操作人"/></label><label><span>功能模块</span><select className="select-control filter-select" value={module} onChange={(event) => setModule(event.target.value)}><option>全部模块</option>{modules.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>操作类型</span><select className="select-control filter-select" value={action} onChange={(event) => setAction(event.target.value)}><option>全部类型</option>{actions.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>操作结果</span><select className="select-control filter-select" value={result} onChange={(event) => setResult(event.target.value)}><option>全部结果</option><option>成功</option><option>失败</option></select></label><label className="audit-date-range"><span>时间范围</span><div><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)}/><i>至</i><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)}/></div></label><div className="filter-actions"><button className="primary-button"><Search size={15}/>查询</button><button className="secondary-button" onClick={reset}><RefreshCw size={15}/>重置</button></div></div><div className="table-scroll"><table className="audit-log-table"><thead><tr><th>操作时间</th><th>操作人</th><th>功能模块</th><th>操作类型</th><th>操作对象</th><th>操作摘要</th><th>操作结果</th><th>IP / 终端</th><th className="sticky-right">操作</th></tr></thead><tbody>{filtered.map((record) => <tr key={record.id}><td>{record.time}</td><td>{record.operator}</td><td>{record.module}</td><td>{record.action}</td><td>{record.target}</td><td className="audit-summary-cell">{record.summary}</td><td><span className={`audit-result ${record.result === "成功" ? "success" : "failed"}`}>{record.result}</span></td><td>{record.client}</td><td className="sticky-right"><button className="table-action" onClick={() => setSelected(record)}>详情</button></td></tr>)}{!filtered.length && <tr><td colSpan="9"><div className="table-empty-state">当前筛选条件下暂无日志</div></td></tr>}</tbody></table></div><div className="pagination"><span>当前展示 {filtered.length} 条日志</span></div></section>{selected && <AuditLogDetailDrawer record={selected} onClose={() => setSelected(null)}/>}</>;
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
  const [toggleTarget, setToggleTarget] = useState(null);
  const rows = weatherConditionCatalog.map((condition) => ({
    ...condition,
    script: careScriptMockApi.getByCondition(scripts, condition.code),
  })).filter((item) => {
    const keyword = query.trim().toLowerCase();
    const conditionKeywords = item.conditions.map((condition) => `${condition.text}${condition.code}`).join("");
    const matchesKeyword = !keyword || `${item.name}${conditionKeywords}${item.script?.template || ""}`.toLowerCase().includes(keyword);
    const rowStatus = item.script?.status || "未配置";
    return matchesKeyword && (status === "全部状态" || rowStatus === status);
  });
  const previewVariables = { 老人称呼: "妈妈", 子女称呼: "阿强", 城市: "伦敦", 天气: "下雨", 温度: "18℃" };

  return <>
    <div className="page-heading"><div><h1>天气关怀话术</h1><p>按和风天气 condition.code 将相近天气归为一组，每组维护一条话术；接口返回具体代码后直接命中所属分组</p></div></div>
    <section className="panel management-panel care-script-panel">
      <div className="filters care-script-filters">
        <label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="话术分组、天气名称、代码或话术内容"/></div></label>
        <label><span>状态</span><select className="select-control filter-select" value={status} onChange={(event) => setStatus(event.target.value)}><option>全部状态</option><option>启用</option><option>停用</option><option>内置兜底</option></select></label>
        <div className="filter-actions"><button className="primary-button"><Search size={15}/>查询</button><button className="secondary-button" onClick={() => { setQuery(""); setStatus("全部状态"); }}><RefreshCw size={15}/>重置</button></div>
      </div>
      <div className="table-scroll"><table className="care-script-table"><thead><tr><th>话术分组</th><th>包含天气</th><th>当前话术</th><th>变量预览</th><th>状态</th><th>最后更新</th><th className="sticky-right">操作</th></tr></thead><tbody>
        {rows.map((item) => <tr key={item.code}><td><div className="care-weather-cell"><span><CloudSun size={17}/></span><div><b>{item.name}</b><small>{item.description}</small></div></div></td><td><ExpandableTagList items={item.conditions} className="weather-condition-list"/></td><td>{item.script ? <p className="care-script-copy">{item.script.template}</p> : <span className="muted-value">系统话术待补全</span>}</td><td>{item.script ? <p className="care-script-preview-text">{careScriptMockApi.renderTemplate(item.script.template, previewVariables)}</p> : "—"}</td><td>{item.script?.builtIn ? <StatusTag>内置兜底</StatusTag> : item.script ? <StatusTag>{item.script.status}</StatusTag> : <StatusTag>待补全</StatusTag>}</td><td>{item.script ? <div className="stacked-cell"><b>{item.script.updatedAt}</b><small>{item.script.operator}</small></div> : "—"}</td><td className="sticky-right">{item.script?.builtIn ? <span className="muted-value">系统内置</span> : item.script ? <><button className="table-action" onClick={() => onEdit(item, item.script)}>编辑</button><button className={`table-action ${item.script.status === "启用" ? "danger-text" : ""}`} onClick={() => item.script.status === "启用" ? setToggleTarget(item) : onToggle(item.script.weatherCode)}>{item.script.status === "启用" ? "停用" : "启用"}</button></> : <span className="muted-value">系统待补全</span>}</td></tr>)}
        {!rows.length && <tr><td colSpan="7"><div className="empty-table-state">没有符合条件的天气关怀话术</div></td></tr>}
      </tbody></table></div>
      <div className="pagination"><span>当前展示 {rows.length} 个话术分组</span></div>
    </section>
    {toggleTarget && <AdminConfirm title={`停用“${toggleTarget.name}”天气关怀话术？`} description="停用后，该分组包含的天气代码将不再生成或匹配话术。" confirmLabel="确认停用" onClose={() => setToggleTarget(null)} onConfirm={() => { onToggle(toggleTarget.script.weatherCode); setToggleTarget(null); }}/>} 
  </>;
}

function CareScriptDrawer({ condition, availableConditions = [], record, onClose, onSave }) {
  const selectableConditions = availableConditions.length ? availableConditions : condition ? [condition] : [];
  const [selectedCode, setSelectedCode] = useState(condition?.code || selectableConditions[0]?.code || "");
  const [form, setForm] = useState({ template: record?.template || "", status: record?.status || "启用" });
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedCondition = record ? condition : selectableConditions.find((item) => item.code === selectedCode) || selectableConditions[0];
  const variables = ["{老人称呼}", "{子女称呼}", "{城市}", "{天气}", "{温度}"];
  const preview = careScriptMockApi.renderTemplate(form.template, { 老人称呼: "妈妈", 子女称呼: "阿强", 城市: "伦敦", 天气: selectedCondition?.name || "", 温度: "18℃" });
  const appendVariable = (variable) => setForm((current) => ({ ...current, template: `${current.template}${variable}` }));
  const save = async () => {
    const template = form.template.trim();
    setSaveError("");
    if (!selectedCondition) {
      setError("请选择天气场景");
      return;
    }
    if (!template) {
      setError("请输入天气关怀话术");
      return;
    }
    if (template.length > 160) {
      setError("天气关怀话术最多 160 个字符");
      return;
    }
    setSaving(true);
    try {
      const result = await onSave(selectedCondition, { ...form, template }, record);
      if (result?.ok === false) {
        setSaveError(result.message || "保存失败，已保留当前填写内容，请重试");
        return;
      }
      onClose();
    } catch {
      setSaveError("保存失败，已保留当前填写内容，请重试");
    } finally {
      setSaving(false);
    }
  };

  return <AdminDrawer title={record ? "编辑天气关怀话术" : "新增天气关怀话术"} ariaLabel={record ? `编辑${condition.name}天气关怀话术` : "新增天气关怀话术"} className="care-script-drawer" onClose={onClose} footer={<><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" disabled={saving} onClick={save}>{saving ? "保存中..." : record ? "保存修改" : "保存话术"}</button></>}>
      <div className="form-section care-script-form">
        <h3>话术内容</h3>
        {!record && <label><span>天气场景 *</span><select className="select-control form-select-native" value={selectedCondition?.code || ""} onChange={(event) => { setSelectedCode(event.target.value); setError(""); setSaveError(""); }}>{selectableConditions.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select><small className="field-help">仅显示尚未配置话术的系统归一化场景。</small>{error === "请选择天气场景" && <small className="field-error">{error}</small>}</label>}
        <div className="care-condition-card"><span><CloudSun size={20}/></span><div><b>{selectedCondition?.name}</b><small>{selectedCondition?.description}</small><div className="weather-condition-inline">{selectedCondition?.conditions?.map((item) => <span key={item.code}>{item.text} {item.code}</span>)}</div></div><StatusTag>{record ? "已配置" : "待配置"}</StatusTag></div>
        <label><span>天气关怀话术 *</span><textarea rows="6" value={form.template} onChange={(event) => { setForm((current) => ({ ...current, template: event.target.value })); setError(""); setSaveError(""); }} placeholder="请输入该天气分组匹配后展示的话术"/><small className="field-help">支持以下变量，匹配时由系统替换为当前老人、子女和天气数据。</small>{error && error !== "请选择天气场景" && <small className="field-error">{error}</small>}</label>
        <div className="care-variable-list"><span>可用变量</span><div>{variables.map((variable) => <button type="button" key={variable} onClick={() => appendVariable(variable)}>{variable}</button>)}</div></div>
        <div className="care-script-preview"><span>变量预览</span><p>{preview || "输入话术后将在这里展示替换变量后的效果"}</p><small>预览值：妈妈、阿强、伦敦、{selectedCondition?.name}、18℃</small></div>
        <label><span>启用状态 *</span><div className="strategy-enable-options"><button type="button" className={form.status === "启用" ? "active" : ""} onClick={() => setForm((current) => ({ ...current, status: "启用" }))}><b>启用</b><small>老人端可按天气情况匹配展示</small></button><button type="button" className={form.status === "停用" ? "active" : ""} onClick={() => setForm((current) => ({ ...current, status: "停用" }))}><b>停用</b><small>不再生成新的天气话术</small></button></div></label>
      </div>
      {saveError && <div className="reminder-feedback error" role="alert"><span><AlertTriangle size={16}/></span>{saveError}</div>}
  </AdminDrawer>;
}

function FamilyAlbumBatchManagementPage({ batches, elderlyRecords, relatives, onViewBatch }) {
  const initialFilters = { elderlyId: "全部老人", relativeId: "全部子女", categoryNameSnapshot: "全部分类", contentType: "全部内容类型", date: "", publishStatus: "全部发布状态", syncStatus: "全部同步状态" };
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const categorySnapshots = [...new Set(batches.map((batch) => batch.categoryNameSnapshot).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  const rows = batches.map((batch) => ({
    ...batch,
    mediaCount: batch.photoCount + batch.videoCount,
    elderly: elderlyRecords.find((item) => item.id === batch.elderlyId),
    uploader: relatives.find((item) => item.id === batch.uploaderId),
  })).filter((batch) => (
    (filters.elderlyId === "全部老人" || batch.elderlyId === filters.elderlyId)
    && (filters.relativeId === "全部子女" || batch.uploaderId === filters.relativeId)
    && (filters.categoryNameSnapshot === "全部分类" || batch.categoryNameSnapshot === filters.categoryNameSnapshot)
    && (filters.contentType === "全部内容类型" || batch.contentType === filters.contentType)
    && (!filters.date || batch.uploadedAt.startsWith(filters.date))
    && (filters.publishStatus === "全部发布状态" || batch.publishStatus === filters.publishStatus)
    && (filters.syncStatus === "全部同步状态" || batch.syncStatus === filters.syncStatus)
  ));
  const resetFilters = () => { setDraftFilters(initialFilters); setFilters(initialFilters); };
  const syncedCount = batches.filter((batch) => batch.syncStatus === "已同步").length;
  const failedCount = batches.filter((batch) => ["同步失败", "部分失败", "未入队"].includes(batch.syncStatus)).length;
  const viewedCount = batches.filter((batch) => batch.firstViewedAt).length;
  const totalPhotos = batches.reduce((sum, batch) => sum + batch.photoCount, 0);
  const totalVideos = batches.reduce((sum, batch) => sum + batch.videoCount, 0);
  const totalMedia = totalPhotos + totalVideos;

  return <>
    <div className="page-heading"><div><h1>家庭相册</h1><p>查看子女上传的照片和视频批次、分类快照、送达状态与老人互动结果</p></div></div>
    <div className="album-overview-grid">
      <div><span>上传批次</span><b>{batches.length}</b><small>共 {totalMedia} 个影像 · 照片 {totalPhotos} · 视频 {totalVideos}</small></div>
      <div><span>已同步批次</span><b>{syncedCount}</b><small>已送达老人端家庭相册</small></div>
      <div><span>同步异常</span><b className={failedCount ? "danger" : ""}>{failedCount}</b><small>等待自动重试或技术排查</small></div>
      <div><span>老人已查看</span><b>{viewedCount}</b><small>按批次记录首次查看时间</small></div>
    </div>
    <section className="panel album-management-panel">
      <div className="filters album-batch-filters">
        <label><span>接收老人</span><select className="select-control filter-select" value={draftFilters.elderlyId} onChange={(event) => setDraftFilters((current) => ({ ...current, elderlyId: event.target.value }))}><option>全部老人</option>{elderlyRecords.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span>上传子女</span><select className="select-control filter-select" value={draftFilters.relativeId} onChange={(event) => setDraftFilters((current) => ({ ...current, relativeId: event.target.value }))}><option>全部子女</option>{relatives.filter((item) => item.links.length).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span>相册分类</span><select className="select-control filter-select" value={draftFilters.categoryNameSnapshot} onChange={(event) => setDraftFilters((current) => ({ ...current, categoryNameSnapshot: event.target.value }))}><option>全部分类</option>{categorySnapshots.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <label><span>内容类型</span><select className="select-control filter-select" value={draftFilters.contentType} onChange={(event) => setDraftFilters((current) => ({ ...current, contentType: event.target.value }))}><option>全部内容类型</option><option>仅照片</option><option>仅视频</option><option>照片和视频</option></select></label>
        <label className="album-date-filter"><span>上传日期</span><div className="album-date-control"><CalendarDays size={15}/><input aria-label="上传日期" type="date" value={draftFilters.date} onChange={(event) => setDraftFilters((current) => ({ ...current, date: event.target.value }))}/></div></label>
        <label><span>发布状态</span><select className="select-control filter-select" value={draftFilters.publishStatus} onChange={(event) => setDraftFilters((current) => ({ ...current, publishStatus: event.target.value }))}><option>全部发布状态</option><option>已发布</option><option>已撤回</option><option>发布失败</option></select></label>
        <label><span>同步状态</span><select className="select-control filter-select" value={draftFilters.syncStatus} onChange={(event) => setDraftFilters((current) => ({ ...current, syncStatus: event.target.value }))}><option>全部同步状态</option><option>待同步</option><option>同步中</option><option>已同步</option><option>部分失败</option><option>同步失败</option><option>未入队</option><option>已撤回</option></select></label>
        <div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}><Search size={15}/>查询</button><button className="secondary-button" onClick={resetFilters}><RefreshCw size={15}/>重置</button></div>
      </div>
      <div className="table-toolbar"><div><span className="result-count">共 {batches.length} 个上传批次</span><span className="toolbar-hint">相册分类由子女端随批次提交，后台按分类名称快照筛选与展示</span></div></div>
      <div className="table-scroll"><table className="family-album-batch-table"><thead><tr><th>上传子女</th><th>接收老人</th><th>相册分类</th><th>内容类型</th><th>照片数量</th><th>视频数量</th><th>影像总数</th><th>上传时间</th><th>发布状态</th><th>同步状态</th><th>首次查看时间</th><th>已喜欢影像</th><th>最后喜欢时间</th><th className="sticky-right">操作</th></tr></thead><tbody>
        {rows.map((batch) => <tr key={batch.id}><td><div className="stacked-cell"><b>{batch.uploader?.name || "账号已移除"}</b><small>{batch.uploader?.phone || "—"}</small></div></td><td><div className="stacked-cell"><b>{batch.elderly?.name || "档案已移除"}</b><small>{batch.elderly?.project || "—"}</small></div></td><td><div className="stacked-cell"><b>{batch.categoryNameSnapshot || "未分类"}</b><small>子女端提交快照</small></div></td><td><StatusTag>{batch.contentType}</StatusTag></td><td><b>{batch.photoCount} 张</b></td><td><b>{batch.videoCount} 个</b></td><td><b>{batch.mediaCount} 个</b></td><td>{batch.uploadedAt}</td><td><StatusTag>{batch.publishStatus}</StatusTag></td><td><div className="stacked-cell"><StatusTag>{batch.syncStatus}</StatusTag><small>{batch.syncError || `${batch.successCount}/${batch.mediaCount} 成功`}</small></div></td><td>{batch.firstViewedAt || "尚未查看"}</td><td><b>{batch.likedMediaCount} 个</b></td><td>{batch.lastLikedAt || "尚无喜欢记录"}</td><td className="sticky-right"><button className="table-action" onClick={() => onViewBatch(batch)}>详情</button></td></tr>)}
        {!rows.length && <tr><td colSpan="14"><div className="empty-table-state">暂无符合条件的上传批次</div></td></tr>}
      </tbody></table></div>
      <div className="pagination"><span>当前展示 {rows.length} 个批次</span></div>
    </section>
  </>;
}

function FamilyAlbumBatchDetailDrawer({ batch, elderly, uploader, onClose }) {
  const mediaCount = batch.photoCount + batch.videoCount;
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer family-album-batch-detail-drawer" role="dialog" aria-modal="true" aria-label="家庭影像批次详情"><header><div><h2>上传批次详情</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body">
    <section className="detail-section"><h3>批次与关系</h3><div className="info-grid"><div><span>上传子女</span><b>{uploader?.name || "账号已移除"}</b></div><div><span>接收老人</span><b>{elderly?.name || "档案已移除"}</b></div><div><span>相册分类</span><b>{batch.categoryNameSnapshot || "未分类"}</b></div><div><span>内容类型</span><StatusTag>{batch.contentType}</StatusTag></div><div><span>照片数量</span><b>{batch.photoCount} 张</b></div><div><span>视频数量</span><b>{batch.videoCount} 个</b></div><div><span>影像总数</span><b>{mediaCount} 个</b></div><div><span>上传时间</span><b>{batch.uploadedAt}</b></div><div><span>关系状态</span><StatusTag>{batch.relationStatus}</StatusTag></div><div className="full"><span>附言情况</span><b>{batch.hasMessage ? "有附言（正文不展示）" : "无附言"}</b></div></div></section>
    <section className="detail-section"><h3>发布与同步</h3><div className="info-grid"><div><span>发布状态</span><StatusTag>{batch.publishStatus}</StatusTag></div><div><span>同步状态</span><StatusTag>{batch.syncStatus}</StatusTag></div><div><span>同步结果</span><b>{batch.successCount} 个成功 / {batch.failedCount} 个失败</b></div><div><span>最近同步</span><b>{batch.lastSyncAt}</b></div>{batch.syncError && <div className="full"><span>异常原因</span><b className="danger-text">{batch.syncError}</b></div>}</div></section>
    <section className="detail-section"><h3>老人互动</h3><div className="info-grid"><div><span>首次查看时间</span><b>{batch.firstViewedAt || "尚未查看"}</b></div><div><span>已喜欢影像数量</span><b>{batch.likedMediaCount} 个</b></div><div><span>最后喜欢时间</span><b>{batch.lastLikedAt || "尚无喜欢记录"}</b></div><div><span>历史互动保留</span><b>是</b></div></div></section>
    {batch.withdrawnAt && <section className="detail-section"><h3>历史状态记录</h3><div className="info-grid"><div><span>记录人</span><b>{batch.withdrawnBy}</b></div><div><span>记录时间</span><b>{batch.withdrawnAt}</b></div><div className="full"><span>状态说明</span><b>{batch.withdrawalReason}</b></div></div></section>}
    <div className="form-tip"><ShieldCheck size={18}/><div><b>家庭隐私保护</b><p>后台仅记录影像数量、同步和互动结果；不展示照片、不播放视频、不展示缩略图或视频封面，也不展示附言正文。后台不能代替老人查看、播放或喜欢影像。</p></div></div>
  </div><footer><button className="secondary-button" onClick={onClose}>关闭</button></footer></aside></div>;
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
      <div className="table-toolbar"><div><span className="result-count">共 {rows.length} 个区域</span><span className="toolbar-hint">展示各区域天气服务的接入与缓存状态</span></div></div>
      <div className="table-scroll"><table className="weather-location-table weather-region-table"><thead><tr><th>国家 / 地区</th><th>接入范围</th><th>天气接口</th><th>关联标准位置</th><th>接入状态</th><th>查询状态</th><th>最近检测</th><th className="sticky-right">操作</th></tr></thead><tbody>
        {rows.map((row) => <tr key={row.id}><td><div className="weather-region-cell"><span>{row.countryCode}</span><div><b>{row.countryName}</b><small>{row.granularity}</small></div></div></td><td>{row.coverage}</td><td><div className="stacked-cell"><b>{row.interfaceMode}</b><small>{row.interfaceKey}</small></div></td><td>{row.linkedLocationCount} 个</td><td><StatusTag>{row.accessStatus}</StatusTag></td><td><div className="stacked-cell"><StatusTag>{row.queryStatus}</StatusTag><small>{row.cacheStatus}</small></div></td><td><div className="stacked-cell"><b>{row.lastCheckedAt}</b><small>最近成功 {row.lastSuccessAt}</small></div></td><td className="sticky-right"><button className="table-action" onClick={() => onView(row)}>详情</button></td></tr>)}
        {!rows.length && <tr><td colSpan="8"><div className="empty-table-state">暂无符合条件的区域接入记录</div></td></tr>}
      </tbody></table></div>
      <div className="pagination"><span>当前展示 {rows.length} 个国家 / 地区</span></div>
    </section>
  </>;
}

function WeatherRegionIntegrationDrawer({ integration, onClose }) {
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer weather-location-drawer weather-region-drawer" role="dialog" aria-modal="true" aria-label="区域天气接入详情"><header><div><h2>区域天气接入详情</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body">
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
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer weather-location-edit-drawer" role="dialog" aria-modal="true" aria-label="维护亲属天气位置"><header><div><h2>维护亲属天气位置</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="form-section"><h3>常住位置</h3>
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
        <div className="table-scroll">
          <table className="relative-archive-table">
            <thead><tr><th>注册用户</th><th>注册手机</th><th>关联老人</th><th>常住地址</th><th>关联状态</th><th>注册时间</th><th>最近登录</th><th>账号状态</th><th className="sticky-right">操作</th></tr></thead>
            <tbody>
              {rows.map((account) => (
                <tr key={account.id}>
                  <td><div className="relative-user-cell"><span>{account.name.slice(-1)}</span><b>{account.name}</b></div></td>
                  <td>{account.phone}</td>
                  <td>
                    {account.linkedElderly.length ? (
                      <div className="relative-link-list">
                        {account.linkedElderly.map((link) => <div className="relative-link-row" key={`${account.id}-${link.elderly.id}`}><b>{link.elderly.name}</b><span>{link.relation}</span></div>)}
                      </div>
                    ) : <span className="relative-empty-link">尚未关联老人</span>}
                  </td>
                  <td><b>{formatWeatherLocation(account.weatherLocation)}</b></td>
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

function RelativeDetailDrawer({ account, elderlyRecords, weatherLocation, onClose, onOpenElderly }) {
  const [tab, setTab] = useState("profile");
  const linkedElderly = account.links.map((link) => ({
    ...link,
    elderly: elderlyRecords.find((record) => record.id === link.elderlyId),
  })).filter((link) => link.elderly);
  const relationshipSummary = [...new Set(linkedElderly.map((link) => link.relation).filter(Boolean))].join("、") || "暂无关联关系";

  return (
    <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭亲属档案详情" onClick={onClose}/><aside className="drawer record-detail-drawer relative-record-detail-drawer" role="dialog" aria-modal="true" aria-label="亲属档案详情">
      <header><h2>亲属档案详情</h2><button className="icon-button" aria-label="关闭" onClick={onClose}><X size={19}/></button></header>
      <div className="drawer-body">
      <ArchiveSubjectSummary name={account.name} details={[maskPhone(account.phone), relationshipSummary, `已关联 ${linkedElderly.length} 位老人`]}/>
      <div className="detail-tabs relative-detail-tabs">
        <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>基本资料</button>
        <button className={tab === "elderly" ? "active" : ""} onClick={() => setTab("elderly")}>关联老人 <span>{linkedElderly.length}</span></button>
      </div>
      {tab === "profile" && (
        <div className="relative-detail-grid relative-detail-grid-single">
          <section className="panel relative-detail-section">
            <header><div><h3>账号资料</h3></div></header>
            <div className="info-grid">
              <div><span>亲属姓名</span><b>{account.name}</b></div>
              <div><span>注册手机</span><b>{account.phone}</b></div>
              <div><span>注册时间</span><b>{account.registeredAt}</b></div>
              <div><span>最近登录</span><b>{account.lastActive}</b></div>
              <div><span>账号状态</span><StatusTag>{account.status}</StatusTag></div>
              <div><span>关联老人</span><b>{linkedElderly.length} 位</b></div>
              <div className="full"><span>常住地址</span><b>{formatWeatherLocation(weatherLocation)}</b></div>
            </div>
          </section>
        </div>
      )}
      {tab === "elderly" && (
        <section className="panel relative-detail-section relative-elderly-section">
          <header><div><h3>关联老人</h3></div><span>共 {linkedElderly.length} 位</span></header>
          <div className="table-scroll">
            <table className="relative-detail-table">
              <thead><tr><th>老人信息</th><th>亲属关系</th><th>居住地址</th><th>关联状态</th><th>操作</th></tr></thead>
              <tbody>
                {linkedElderly.map((link) => <tr key={link.elderly.id}><td><div className="elderly-name-cell"><span className="person-avatar">{link.elderly.name.slice(-1)}</span><span><b>{link.elderly.name}</b><small>{link.elderly.gender} · {link.elderly.age} 岁</small></span></div></td><td><span className="relative-relation-tag">{link.relation}</span></td><td>{link.elderly.address}</td><td><StatusTag>已关联</StatusTag></td><td><button className="table-action" onClick={() => onOpenElderly(link.elderly)}>详情</button></td></tr>)}
                {!linkedElderly.length && <tr><td colSpan="5"><div className="empty-table-state">该用户尚未关联老人</div></td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
      </div>
      <footer><button className="secondary-button" onClick={onClose}>关闭</button></footer>
    </aside></div>
  );
}

function CreateDrawer({ page, onClose }) {
  const meta = pageMeta[page] || pageMeta.elderly;
  return <div className="drawer-layer" role="presentation"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer" role="dialog" aria-modal="true" aria-label={meta.add}><header><div><h2>{meta.add}</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="form-section"><h3>基础信息</h3><label><span>名称 *</span><input placeholder={`请输入${meta.add.replace(/新增|新建|发布|录入|上传|创建/, "") || "名称"}`}/></label><label><span>所属项目 *</span><button className="select-button form-select">请选择项目 <ChevronDown size={14}/></button></label><div className="form-row"><label><span>负责人</span><input placeholder="请输入负责人"/></label><label><span>联系电话</span><input placeholder="请输入联系电话"/></label></div><label><span>备注</span><textarea placeholder="请输入补充说明" rows="4"/></label></div><div className="form-tip"><ShieldCheck size={18}/><div><b>数据范围说明</b><p>保存后仅对当前账号授权的项目和老人范围生效。</p></div></div></div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={onClose}>保存</button></footer></aside></div>;
}

export function App() {
  const acceptanceParams = new URLSearchParams(window.location.search);
  const acceptanceMode = import.meta.env.DEV && acceptanceParams.has("acceptance");
  const componentCenterMode = acceptanceMode && acceptanceParams.has("component-center");
  const [platformMode, setPlatformMode] = useState("community");
  const [active, setActive] = useState("overview");
  const [overviewScenario, setOverviewScenario] = useState("normal");
  const [recommendationScenario, setRecommendationScenario] = useState("normal");
  const [elderlyScenario, setElderlyScenario] = useState("normal");
  const [communityUsageView, setCommunityUsageView] = useState({ type: "activity", period: "today", scenario: "normal" });
  const [leisureEntertainmentScenario, setLeisureEntertainmentScenario] = useState("normal");
  const [leisureEntertainmentDirty, setLeisureEntertainmentDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [acceptanceResetSignal, setAcceptanceResetSignal] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [elderlyRecords, setElderlyRecords] = useState(() => {
    try {
      const savedRecords = window.localStorage.getItem("u2g-elderly-records");
      const records = savedRecords ? JSON.parse(savedRecords) : elderlyRows;
      return records.map((record) => ({
        ...record,
        packageType: record.packageType || "unconfigured",
        ...(record.community ? { project: record.community } : {}),
      }));
    } catch {
      return elderlyRows;
    }
  });
  const [projects, setProjects] = useState(() => {
    try {
      const savedProjects = window.localStorage.getItem("u2g-projects");
      if (!savedProjects) return initialProjects;
      return JSON.parse(savedProjects).map((project) => {
        const { weatherLocation: _removedWeatherLocation, community, ...savedProject } = project;
        const communityName = community || project.name;
        return {
          country: "新加坡", city: "新加坡", district: communityName || "", address: "",
          timezone: "Asia/Singapore (UTC+8)",
          ...initialProjects.find((item) => item.id === project.id), ...savedProject,
          name: communityName,
        };
      });
    } catch {
      return initialProjects;
    }
  });
  const [operationLogs, setOperationLogs] = useState(() => {
    try {
      const savedLogs = window.localStorage.getItem("u2g-platform-operation-logs-v1");
      return savedLogs ? JSON.parse(savedLogs) : initialPlatformAuditLogs;
    } catch {
      return initialPlatformAuditLogs;
    }
  });
  const [reminderPolicies, setReminderPolicies] = useState(() => {
    try {
      const savedStatuses = JSON.parse(window.localStorage.getItem(reminderPolicyStatusStorageKey) || "{}");
      return initialReminderPolicies.map((item) => ({ ...item, enabled: item.fixed ? true : savedStatuses[item.id] !== false }));
    } catch {
      return initialReminderPolicies;
    }
  });
  const [tabletDevices, setTabletDevices] = useState(() => {
    try {
      const savedDevices = window.localStorage.getItem("u2g-tablet-devices");
      if (!savedDevices) return initialTabletDevices;
      return JSON.parse(savedDevices).map((device) => {
        const preset = initialTabletDevices.find((item) => item.id === device.id);
        const { status: legacyStatus, ...savedDevice } = device;
        const onlineStatus = ["在线", "离线"].includes(device.onlineStatus)
          ? device.onlineStatus
          : ["在线", "离线"].includes(legacyStatus)
            ? legacyStatus
            : preset?.onlineStatus || (/刚刚|分钟/.test(device.lastOnline || "") ? "在线" : "离线");
        return {
          projectId: device.projectId || preset?.projectId || "",
          currentVersion: device.currentVersion || preset?.currentVersion || "v2.6.0",
          romVersion: device.romVersion || preset?.romVersion || "v1.5.0",
          apkVersion: device.apkVersion || preset?.apkVersion || "v2.1.0",
          networkType: device.networkType || preset?.networkType || "Wi-Fi",
          ipAddress: device.ipAddress || preset?.ipAddress || "未分配",
          sn: device.sn || preset?.sn || "SN 待补充",
          ...savedDevice,
          usageRecords: Array.isArray(device.usageRecords) ? device.usageRecords : preset?.usageRecords || [],
          versionStatus: device.versionStatus || preset?.versionStatus || "已最新",
          activationStatus: device.activationStatus || (device.boundElderlyId ? "已激活" : "待激活"),
          onlineStatus,
        };
      });
    } catch {
      return initialTabletDevices;
    }
  });
  const [activationRecords, setActivationRecords] = useState(() => {
    try {
      const savedRecords = window.localStorage.getItem("u2g-tablet-activations-v12-cross-end");
      return savedRecords ? JSON.parse(savedRecords).map(normalizeTabletActivationRecord) : initialActivationRecords;
    } catch {
      return initialActivationRecords;
    }
  });
  const [familyRelations, setFamilyRelations] = useState(initialFamilyRelations);
  const [reminderRecords, setReminderRecords] = useState(() => {
    try {
      const savedReminders = window.localStorage.getItem("u2g-reminders-v12-final");
      if (!savedReminders) return initialReminders;
      const parsedReminders = JSON.parse(savedReminders);
      const savedIds = new Set(parsedReminders.map((reminder) => reminder.id));
      return [...parsedReminders, ...initialReminders.filter((reminder) => !savedIds.has(reminder.id))];
    } catch {
      return initialReminders;
    }
  });
  const reminderDeleteAttempts = useRef(new Set());
  const [emergencyHelpEvents, setEmergencyHelpEvents] = useState(() => {
    try {
      window.localStorage.removeItem("u2g-emergency-assistance-events-v2");
      window.localStorage.removeItem("u2g-emergency-assistance-events-v3");
      const savedEvents = window.localStorage.getItem("u2g-emergency-assistance-events-v4");
      return (savedEvents ? JSON.parse(savedEvents) : initialEmergencyHelpEvents).map(normalizeEmergencyAssistanceEvent);
    } catch {
      return initialEmergencyHelpEvents.map(normalizeEmergencyAssistanceEvent);
    }
  });
  const [leisureEntertainmentEntries, setLeisureEntertainmentEntries] = useState(readLeisureEntertainmentEntries);
  const [recommendationStrategies, setRecommendationStrategies] = useState(() => {
    try {
      const savedStrategies = window.localStorage.getItem("u2g-right-recommendations-v19-created-at-order");
      if (!savedStrategies) return initialRecommendationStrategies;
      const mergedStrategies = JSON.parse(savedStrategies).map((item) => {
        const preset = initialRecommendationStrategies.find((record) => record.id === item.id);
        const merged = preset ? { ...preset, ...item, createdAt: item.createdAt || preset.createdAt, sourceId: item.sourceId || preset.sourceId, sourceName: item.sourceName || preset.sourceName, sourceUpdatedAt: item.sourceUpdatedAt || preset.sourceUpdatedAt } : { ...item, createdAt: item.createdAt || recommendationMockNow };
        if (merged.type !== "third_party_entertainment") return merged;
        const { sourceUnavailable: _sourceUnavailable, ...directEntertainment } = merged;
        return directEntertainment;
      });
      const savedIds = new Set(mergedStrategies.map((item) => item.id));
      return [...mergedStrategies, ...initialRecommendationStrategies.filter((item) => !savedIds.has(item.id))];
    } catch {
      return initialRecommendationStrategies;
    }
  });
  const [communityStaff, setCommunityStaff] = useState(initialCommunityStaff);
  const [communityMembers, setCommunityMembers] = useState(readCommunityMembers);
  const [roles, setRoles] = useState(readRoles);
  const [safetyNews, setSafetyNews] = useState(() => {
    try {
      const savedNews = window.localStorage.getItem("u2g-community-content-v22-topics-split");
      const records = savedNews ? JSON.parse(savedNews) : initialSafetyNews;
      return records.map((record) => ({ ...record, syncToRecommendation: typeof record.syncToRecommendation === "boolean" ? record.syncToRecommendation : recommendationStrategies.some((item) => item.sourceId === record.id && item.type === recommendationTypeByCommunityContent[record.type] && item.enabled) }));
    } catch {
      return initialSafetyNews.map((record) => ({ ...record, syncToRecommendation: recommendationStrategies.some((item) => item.sourceId === record.id && item.type === recommendationTypeByCommunityContent[record.type] && item.enabled) }));
    }
  });
  const [communityTopics, setCommunityTopics] = useState(() => {
    try {
      const savedTopics = window.localStorage.getItem("u2g-community-topics-v11");
      return savedTopics ? JSON.parse(savedTopics) : initialCommunityTopics;
    } catch {
      return initialCommunityTopics;
    }
  });
  const [topicComments] = useState(initialTopicComments);
  const [serviceCategories, setServiceCategories] = useState(() => {
    try {
      const savedCategories = window.localStorage.getItem("u2g-service-categories-v10-unified");
      return savedCategories ? JSON.parse(savedCategories) : initialServiceCategories;
    } catch {
      return initialServiceCategories;
    }
  });
  const [serviceBookings, setServiceBookings] = useState(() => {
    try {
      const savedBookings = window.localStorage.getItem("u2g-service-bookings-v10-unified");
      return savedBookings ? JSON.parse(savedBookings) : initialServiceBookings;
    } catch {
      return initialServiceBookings;
    }
  });
  const [serviceCatalog, setServiceCatalog] = useState(() => {
    try {
      const savedServices = window.localStorage.getItem("u2g-service-catalog-v10-unified");
      return savedServices ? JSON.parse(savedServices) : initialServiceCatalog;
    } catch {
      return initialServiceCatalog;
    }
  });
  const [communityActivities, setCommunityActivities] = useState(() => {
    try {
      const savedActivities = window.localStorage.getItem("u2g-community-activities-v26-derived-status");
      const records = savedActivities ? JSON.parse(savedActivities) : initialCommunityActivities;
      return records.map((record) => ({ ...record, syncToRecommendation: typeof record.syncToRecommendation === "boolean" ? record.syncToRecommendation : recommendationStrategies.some((item) => item.sourceId === record.id && item.type === "activity" && item.enabled) }));
    } catch {
      return initialCommunityActivities.map((record) => ({ ...record, syncToRecommendation: recommendationStrategies.some((item) => item.sourceId === record.id && item.type === "activity" && item.enabled) }));
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
      const records = savedScripts ? JSON.parse(savedScripts) : initialCareScripts;
      return careScriptMockApi.hydrate(records);
    } catch {
      return initialCareScripts;
    }
  });
  const [drawer, setDrawer] = useState(null);
  const [deviceDrawer, setDeviceDrawer] = useState(null);
  const [tabletTarget, setTabletTarget] = useState(null);
  const [elderlyDetailId, setElderlyDetailId] = useState(null);
  const [elderlyDetailInitialTab, setElderlyDetailInitialTab] = useState("profile");
  const [relativeDetailId, setRelativeDetailId] = useState(null);
  const [spaceTarget, setSpaceTarget] = useState(null);
  const [globalRuleOpen, setGlobalRuleOpen] = useState(false);
  const [overviewContext, setOverviewContext] = useState("");
  const [overviewToast, setOverviewToast] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState("PRJ-001");
  const [pendingProjectId, setPendingProjectId] = useState("");
  const currentMenuGroups = platformMode === "platform" ? platformMenuGroups : communityMenuGroups;
  const currentProject = projects.find((project) => project.id === currentProjectId) || projects.find((project) => project.status === "启用") || projects[0];
  const currentCommunityMember = communityMembers.find((member) => member.projectId === currentProject?.id && member.name === "赵亚男" && member.status === "已启用")
    || communityMembers.find((member) => member.projectId === currentProject?.id && member.status === "已启用");
  const currentCommunityRole = roles.find((role) => role.id === currentCommunityMember?.roleId);
  const hasCommunityPermission = (moduleId, action) => Boolean(currentCommunityRole?.isAdmin || currentCommunityRole?.permissionMatrix?.[moduleId]?.includes(action));
  const currentPlatformMember = communityMembers.find((member) => !member.projectId && member.name === "赵亚男" && member.status === "已启用")
    || communityMembers.find((member) => !member.projectId && member.status === "已启用");
  const currentPlatformRole = roles.find((role) => role.id === currentPlatformMember?.roleId);
  const permissionModuleId = (moduleId) => ({ tabletDevices: "devices", platformTabletDevices: "tabletOta" })[moduleId] || moduleId;
  const canViewMenuItem = (moduleId) => platformMode === "platform"
    ? Boolean(currentPlatformRole?.isAdmin || currentPlatformRole?.permissionMatrix?.[permissionModuleId(moduleId)]?.includes("view"))
    : hasCommunityPermission(permissionModuleId(moduleId), "view");
  const visibleMenuGroups = currentMenuGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => canViewMenuItem(item.key)) }))
    .filter((group) => group.items.length);
  const currentMenuKeys = useMemo(() => new Set(visibleMenuGroups.flatMap((group) => group.items.map((item) => item.key))), [visibleMenuGroups]);
  const overviewQuickPermissions = {
    elderly: hasCommunityPermission("elderly", "create"),
    reminder: hasCommunityPermission("elderly", "edit"),
    announcement: hasCommunityPermission("communityAnnouncements", "create"),
    activity: hasCommunityPermission("activities", "create"),
  };
  const authorizedProjects = projects.filter((project) => project.status === "启用");
  const scopedElderlyRecords = useMemo(() => elderlyRecords.filter((record) => record.community === currentProject?.name), [elderlyRecords, currentProject?.name]);
  const scopedElderlyIds = useMemo(() => new Set(scopedElderlyRecords.map((record) => record.id)), [scopedElderlyRecords]);
  const scopedRelativeAccounts = useMemo(() => relativeAccounts.filter((account) => account.links.some((link) => scopedElderlyIds.has(link.elderlyId))), [scopedElderlyIds]);
  const scopedTabletDevices = useMemo(() => tabletDevices.filter((device) => device.projectId ? device.projectId === currentProject?.id : scopedElderlyIds.has(device.boundElderlyId)), [tabletDevices, currentProject?.id, scopedElderlyIds]);
  const scopedSensorDevices = useMemo(() => sensorDevices.filter((device) => scopedElderlyIds.has(device.elderlyId)), [sensorDevices, scopedElderlyIds]);
  const scopedReminderRecords = useMemo(() => reminderRecords.filter((record) => scopedElderlyIds.has(record.elderlyId)), [reminderRecords, scopedElderlyIds]);
  const scopedEmergencyEvents = useMemo(() => emergencyHelpEvents.filter((event) => scopedElderlyIds.has(event.elderlyId)), [emergencyHelpEvents, scopedElderlyIds]);
  const scopedAlbumBatches = useMemo(() => familyAlbumBatches.filter((batch) => scopedElderlyIds.has(batch.elderlyId)), [familyAlbumBatches, scopedElderlyIds]);
  const scopedCommunityActivities = useMemo(() => communityActivities.filter((activity) => activity.projectId === currentProject?.id), [communityActivities, currentProject?.id]);
  const scopedActivityIds = useMemo(() => new Set(scopedCommunityActivities.map((activity) => activity.id)), [scopedCommunityActivities]);
  const scopedRegistrations = useMemo(() => initialActivityRegistrations.filter((registration) => scopedActivityIds.has(registration.activityId) && scopedElderlyIds.has(registration.elderlyId)), [scopedActivityIds, scopedElderlyIds]);
  const scopedSafetyNews = useMemo(() => safetyNews.filter((record) => record.projectId === currentProject?.id), [safetyNews, currentProject?.id]);
  const scopedCommunityStaff = useMemo(() => communityStaff.filter((record) => record.projectId === currentProject?.id), [communityStaff, currentProject?.id]);
  const scopedCommunityTopics = useMemo(() => communityTopics.filter((record) => record.projectId === currentProject?.id), [communityTopics, currentProject?.id]);
  const scopedTopicComments = useMemo(() => topicComments.filter((record) => record.projectId === currentProject?.id), [topicComments, currentProject?.id]);
  const scopedServiceCategories = useMemo(() => serviceCategories.filter((category) => category.projectId === currentProject?.id), [serviceCategories, currentProject?.id]);
  const scopedServiceBookings = useMemo(() => serviceBookings.filter((booking) => booking.projectId === currentProject?.id && scopedElderlyIds.has(booking.elderlyId)), [serviceBookings, currentProject?.id, scopedElderlyIds]);
  const scopedServiceCatalog = useMemo(() => serviceCatalog.filter((service) => service.projectId === currentProject?.id), [serviceCatalog, currentProject?.id]);
  const scopedRecommendationStrategies = useMemo(() => recommendationStrategies
    .filter((record) => (record.projectId || "PRJ-001") === currentProject?.id)
    .map((record) => {
      if (record.type === "third_party_entertainment") {
        const entry = leisureEntertainmentEntries.find((item) => item.id === record.sourceId);
        return { ...record, name: entry?.name || record.name, sourceName: entry?.name || record.sourceName, thirdPartyUrl: entry?.entryUrl || record.thirdPartyUrl, sourceUnavailable: !entry?.enabled };
      }
      const source = record.type === "activity"
        ? scopedCommunityActivities.find((item) => item.id === record.sourceId)
        : scopedSafetyNews.find((item) => item.id === record.sourceId);
      if (!source) return record;
      const sourceStatus = record.type === "activity" ? getCommunityActivityStatus(source) : getCommunityContentStatus(source);
      return { ...record, sourceSyncEnabled: Boolean(source.syncToRecommendation), sourceStatus, sourceUnavailable: record.type === "activity" ? source.isOffline : !isCommunityContentAvailable(source) };
    }), [recommendationStrategies, currentProject?.id, leisureEntertainmentEntries, scopedCommunityActivities, scopedSafetyNews]);
  const activeLabel = useMemo(() => allMenuGroups.flatMap((group) => group.items).find((item) => item.key === active)?.label, [active]);
  const elderlyDetailRecord = scopedElderlyRecords.find((record) => record.id === elderlyDetailId);
  const elderlyDetailActivation = elderlyDetailRecord ? activationRecords.find((item) => item.elderlyId === elderlyDetailRecord.id && (isPendingTabletActivation(item.status) || isFailedTabletActivation(item.status))) : null;
  const elderlyDetailActivationDevice = elderlyDetailActivation ? tabletDevices.find((device) => device.id === elderlyDetailActivation.deviceId) : null;
  const relativeDetailRecord = scopedRelativeAccounts.find((account) => account.id === relativeDetailId);
  const communityActivityRecords = useMemo(() => scopedCommunityActivities.map((activity) => ({ ...activity, status: getCommunityActivityStatus(activity), registrationPhase: getCommunityActivityRegistrationPhase(activity), interestCount: scopedRegistrations.filter((registration) => registration.activityId === activity.id && registration.status === "想参加").length })), [scopedCommunityActivities, scopedRegistrations]);
  const hasOpenEditor = Boolean(drawer || deviceDrawer || tabletTarget || spaceTarget || globalRuleOpen || elderlyDetailRecord || relativeDetailRecord || pendingNavigation);
  useEffect(() => {
    if (!currentMenuKeys.has(active)) setActive(visibleMenuGroups[0]?.items[0]?.key || (platformMode === "platform" ? "platformOverview" : "overview"));
  }, [active, currentMenuKeys, platformMode]);
  const closeOpenEditors = () => {
    setDrawer(null); setDeviceDrawer(null); setTabletTarget(null); setSpaceTarget(null); setGlobalRuleOpen(false);
    setElderlyDetailId(null); setElderlyDetailInitialTab("profile"); setRelativeDetailId(null); setOverviewContext("");
  };

  const applyPlatformMode = (nextMode) => {
    closeOpenEditors();
    setPlatformMode(nextMode);
    setActive(nextMode === "platform" ? "platformOverview" : "overview");
  };

  const switchPlatformMode = (nextMode) => {
    if (nextMode === platformMode) return;
    if (active === "leisureEntertainment" && leisureEntertainmentDirty) {
      setPendingNavigation({ type: "mode", value: nextMode });
      return;
    }
    applyPlatformMode(nextMode);
  };

  const applyModuleNavigation = (moduleId) => {
    setActive(["sensorDevices", "activity"].includes(moduleId) ? "tabletDevices" : moduleId);
    setOverviewContext("");
    if (moduleId !== "elderly") setElderlyDetailId(null);
    if (moduleId !== "relations") setRelativeDetailId(null);
  };

  const requestModuleNavigation = (moduleId) => {
    if (moduleId === active) return;
    if (active === "leisureEntertainment" && leisureEntertainmentDirty) {
      setPendingNavigation({ type: "module", value: moduleId });
      return;
    }
    applyModuleNavigation(moduleId);
  };

  const applyCommunitySwitch = (projectId) => {
    setCurrentProjectId(projectId);
    closeOpenEditors();
    setActive(active === "elderlyDataDashboard" ? "elderlyDataDashboard" : "overview");
    setPendingProjectId("");
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const requestCommunitySwitch = (projectId) => {
    if (projectId === currentProjectId) return;
    if (hasOpenEditor) setPendingProjectId(projectId);
    else applyCommunitySwitch(projectId);
  };

  const enterCommunity = (projectId) => {
    setPlatformMode("community");
    applyCommunitySwitch(projectId);
  };
  const openCommunityModule = (projectId, moduleId) => {
    setPlatformMode("community");
    setCurrentProjectId(projectId);
    closeOpenEditors();
    setActive(moduleId);
    setPendingProjectId("");
    setOverviewContext("");
    window.scrollTo({ top: 0, behavior: "auto" });
  };
  const resetAcceptance = () => {
    setPlatformMode("community"); setCurrentProjectId("PRJ-001"); setOverviewScenario("normal"); setRecommendationScenario("normal"); setElderlyScenario("normal"); setLeisureEntertainmentScenario("normal"); setLeisureEntertainmentDirty(false); setPendingNavigation(null); setActive("overview"); setDrawer(null); setDeviceDrawer(null); setTabletTarget(null);
    setElderlyDetailId(null); setRelativeDetailId(null); setSpaceTarget(null); setGlobalRuleOpen(false); setOverviewContext(""); setOverviewToast("");
    setCareScripts(initialCareScripts);
    setReminderPolicies(initialReminderPolicies);
    setTabletDevices(initialTabletDevices);
    setEmergencyHelpEvents(initialEmergencyHelpEvents.map(normalizeEmergencyAssistanceEvent));
    window.localStorage.removeItem(tabletOtaStorageKey);
    window.localStorage.removeItem(reminderPolicyStatusStorageKey);
    window.localStorage.removeItem("u2g-emergency-assistance-events-v2");
    window.localStorage.removeItem("u2g-emergency-assistance-events-v3");
    window.localStorage.removeItem("u2g-emergency-assistance-events-v4");
    setAcceptanceResetSignal((value) => value + 1);
    window.scrollTo({ top: 0, behavior: "auto" });
  };
  const applyAcceptanceNavigation = (moduleId) => {
    if (["sensorDevices", "activity"].includes(moduleId)) moduleId = "tabletDevices";
    if (!availableMenuKeys.has(moduleId)) return;
    setPlatformMode(platformMenuKeys.has(moduleId) ? "platform" : "community"); setActive(moduleId); setDrawer(null); setDeviceDrawer(null); setTabletTarget(null); setSpaceTarget(null); setGlobalRuleOpen(false); setOverviewContext("");
    if (moduleId !== "elderly") setElderlyDetailId(null);
    if (moduleId !== "relations") setRelativeDetailId(null);
    if (moduleId !== "overview") setOverviewScenario("normal");
    setAcceptanceResetSignal((value) => value + 1);
  };
  const navigateFromAcceptance = (moduleId) => {
    if (!availableMenuKeys.has(moduleId)) return;
    if (moduleId !== active && active === "leisureEntertainment" && leisureEntertainmentDirty) {
      setPendingNavigation({ type: "acceptance", value: moduleId });
      return;
    }
    applyAcceptanceNavigation(moduleId);
  };
  const confirmPendingNavigation = () => {
    const next = pendingNavigation;
    setPendingNavigation(null);
    setLeisureEntertainmentDirty(false);
    if (!next) return;
    if (next.type === "mode") applyPlatformMode(next.value);
    else if (next.type === "acceptance") applyAcceptanceNavigation(next.value);
    else applyModuleNavigation(next.value);
  };

  const navigateFromOverview = ({ page, filter = "", drawer: nextDrawer, elderlyName = "", detailTab = "profile" } = {}) => {
    if (!page) return;
    if (["sensorDevices", "activity"].includes(page)) {
      setActive("tabletDevices");
      setOverviewContext("");
      setDeviceDrawer(null);
      return;
    }
    setActive(page);
    setOverviewContext(filter);
    if (page === "elderly") {
      setElderlyDetailInitialTab(detailTab);
      setElderlyDetailId(elderlyName ? scopedElderlyRecords.find((record) => record.name === elderlyName)?.id || null : null);
    }
    if (page === "relations") setRelativeDetailId(null);
    if (!nextDrawer) return;
    if (nextDrawer.kind === "sensorCreate") setDeviceDrawer(nextDrawer);
    else setDrawer(nextDrawer);
  };

  const openOverviewQuickAction = (action) => {
    setOverviewToast("");
    if (action === "elderly") setDrawer({ kind: "elderly", mode: "create", source: "overview" });
    if (action === "reminder") setDrawer({ kind: "overviewReminderPicker", source: "overview" });
    if (action === "announcement") setDrawer({ kind: "safety", mode: "edit", contentType: "社区公告", source: "overview" });
    if (action === "activity") setDrawer({ kind: "activity", mode: "edit", source: "overview" });
  };

  const completeOverviewQuickAction = (message) => {
    if (drawer?.source !== "overview") return;
    setActive("overview");
    setOverviewContext("");
    setOverviewToast(message);
  };

  useEffect(() => {
    window.localStorage.setItem("u2g-elderly-records", JSON.stringify(elderlyRecords));
  }, [elderlyRecords]);

  useEffect(() => {
    window.localStorage.setItem("u2g-projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    window.localStorage.setItem("u2g-platform-operation-logs-v1", JSON.stringify(operationLogs));
  }, [operationLogs]);

  useEffect(() => {
    window.localStorage.setItem(reminderPolicyStatusStorageKey, JSON.stringify(Object.fromEntries(reminderPolicies.map((item) => [item.id, item.fixed ? true : item.enabled]))));
  }, [reminderPolicies]);

  useEffect(() => {
    window.localStorage.setItem("u2g-tablet-devices", JSON.stringify(tabletDevices));
  }, [tabletDevices]);

  useEffect(() => {
    window.localStorage.setItem("u2g-tablet-activations-v12-cross-end", JSON.stringify(activationRecords));
  }, [activationRecords]);

  useEffect(() => {
    window.localStorage.setItem("u2g-reminders-v12-final", JSON.stringify(reminderRecords));
  }, [reminderRecords]);

  useEffect(() => {
    window.localStorage.setItem("u2g-emergency-assistance-events-v4", JSON.stringify(emergencyHelpEvents));
  }, [emergencyHelpEvents]);

  useEffect(() => {
    window.localStorage.setItem(leisureEntertainmentStorageKey, JSON.stringify(leisureEntertainmentEntries));
  }, [leisureEntertainmentEntries]);

  useEffect(() => {
    window.localStorage.setItem(communityMembersStorageKey, JSON.stringify(communityMembers));
  }, [communityMembers]);

  useEffect(() => {
    const normalizedRoles = normalizeRoleRecords(roles);
    if (JSON.stringify(normalizedRoles) !== JSON.stringify(roles)) {
      setRoles(normalizedRoles);
      return;
    }
    window.localStorage.setItem(roleStorageKey, JSON.stringify(normalizedRoles));
  }, [roles]);

  useEffect(() => {
    window.localStorage.setItem("u2g-right-recommendations-v19-created-at-order", JSON.stringify(recommendationStrategies));
  }, [recommendationStrategies]);


  useEffect(() => {
    window.localStorage.setItem("u2g-community-content-v22-topics-split", JSON.stringify(safetyNews));
  }, [safetyNews]);

  useEffect(() => {
    window.localStorage.setItem("u2g-community-topics-v11", JSON.stringify(communityTopics));
  }, [communityTopics]);

  useEffect(() => {
    window.localStorage.setItem("u2g-community-activities-v26-derived-status", JSON.stringify(communityActivities));
  }, [communityActivities]);

  useEffect(() => {
    window.localStorage.setItem("u2g-service-categories-v10-unified", JSON.stringify(serviceCategories));
  }, [serviceCategories]);

  useEffect(() => {
    window.localStorage.setItem("u2g-service-bookings-v10-unified", JSON.stringify(serviceBookings));
  }, [serviceBookings]);

  useEffect(() => {
    window.localStorage.setItem("u2g-service-catalog-v10-unified", JSON.stringify(serviceCatalog));
  }, [serviceCatalog]);

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
    const created = !nextRecord.id;
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
        updatedAt: "2026-07-16 17:20",
      }, ...records]);
    }
    if (created) completeOverviewQuickAction("老人档案已新增，运营概览已刷新");
    setDrawer(null);
  };

  const saveRelativeWeatherLocation = (account, selection) => {
    const result = weatherMockApi.saveRelativeLocation(weatherLocations, weatherAudits, account.id, selection);
    setWeatherLocations(result.records);
    setWeatherAudits(result.audits);
    setDrawer(null);
  };

  const saveCareScript = async (condition, input, record) => {
    try {
      const persistedRecords = JSON.parse(window.localStorage.getItem("u2g-care-scripts-v1") || "null");
      const currentRecords = careScriptMockApi.hydrate(Array.isArray(persistedRecords) ? persistedRecords : careScripts);
      if (!record && careScriptMockApi.getByCondition(currentRecords, condition.code)) {
        return { ok: false, message: `${condition.name}已配置话术，请在列表中编辑现有话术` };
      }
      if (record && !careScriptMockApi.getByCondition(currentRecords, condition.code)) {
        return { ok: false, message: "未找到可编辑的话术，请刷新后重试" };
      }
      const nextRecords = careScriptMockApi.save(currentRecords, condition, input);
      window.localStorage.setItem("u2g-care-scripts-v1", JSON.stringify(nextRecords));
      setCareScripts(nextRecords);
      return { ok: true };
    } catch {
      return { ok: false, message: "保存失败，已保留当前填写内容，请重试" };
    }
  };

  const toggleCareScript = (weatherCode) => {
    const operatedAt = new Date().toLocaleString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" }).replaceAll("/", "-");
    setCareScripts((records) => records.map((item) => item.weatherCode === weatherCode && !item.builtIn
      ? { ...item, status: item.status === "启用" ? "停用" : "启用", updatedAt: operatedAt, operator: "赵亚男" }
      : item));
  };

  const saveReminder = (reminder) => {
    const operatedAt = new Date().toLocaleString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" }).replaceAll("/", "-");
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
    completeOverviewQuickAction("老人提醒已配置，运营概览已刷新");
    setDrawer(null);
  };

  const deleteReminder = (id) => {
    const target = reminderRecords.find((reminder) => reminder.id === id);
    if (target?.deleteFailureOnce && !reminderDeleteAttempts.current.has(id)) {
      reminderDeleteAttempts.current.add(id);
      return { ok: false };
    }
    const operatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    setReminderRecords((records) => records.map((reminder) => {
      if (reminder.id !== id) return reminder;
      const occurrences = reminder.occurrences || [];
      const historicalOccurrences = occurrences.filter((item) => item.status !== "未到时间");
      return {
        ...reminder,
        deletedBy: "赵亚男",
        deletedAt: operatedAt,
        stoppedFutureCount: occurrences.length - historicalOccurrences.length,
        occurrences: historicalOccurrences,
      };
    }));
    return { ok: true };
  };

  const retryEmergencyNotification = (eventId, notificationId) => {
    const retriedAt = "2026-07-28 10:18:30";
    setEmergencyHelpEvents((events) => events.map((event) => {
      if (event.id !== eventId) return event;
      const target = event.notifications.find((item) => item.id === notificationId);
      const notifications = event.notifications.map((item) => item.id === notificationId ? { ...item, deliveryStatus: "已送达", retryCount: item.retryCount + 1, failureReason: "", lastAttemptAt: retriedAt } : item);
      return {
        ...event,
        notifications,
        timeline: [...event.timeline, { time: "10:18:30", title: "失败联系人已重新通知", detail: `${target?.name || "联系人"}已补发成功，本次为第 ${(target?.retryCount || 0) + 1} 次重试` }],
      };
    }));
  };

  const saveEmergencyProcessing = (eventId, input) => {
    setEmergencyHelpEvents((events) => events.map((event) => {
      if (event.id !== eventId || event.status !== "处理中") return event;
      return {
        ...event,
        result: input.result,
        timeline: [...event.timeline, { time: "10:21:18", title: "处理信息已更新", detail: "赵亚男更新处理说明" }],
      };
    }));
  };

  const completeEmergencyEvent = (eventId, input) => {
    const completedAt = "2026-07-28 10:22:16";
    setEmergencyHelpEvents((events) => events.map((event) => {
      if (event.id !== eventId || event.status !== "处理中") return event;
      const timeline = [...event.timeline];
      const deliveredNotifications = event.notifications.filter((item) => item.deliveryStatus === "已送达");
      const failedNotifications = event.notifications.filter((item) => item.deliveryStatus === "发送失败");
      const viewedNotifications = event.notifications.filter((item) => item.viewedAt);
      if (event.notifications.length && !timeline.some((item) => item.title.includes("通知"))) {
        const notificationTitle = failedNotifications.length
          ? (deliveredNotifications.length ? "部分通知失败" : "子女通知失败")
          : "子女通知已送达";
        timeline.push({ time: (event.notifications[0].lastAttemptAt || completedAt).slice(-8), title: notificationTitle, detail: getEmergencyNotificationResult(event) });
      }
      if (viewedNotifications.length && !timeline.some((item) => item.title === "子女已查看")) {
        timeline.push({ time: viewedNotifications[0].viewedAt.slice(-8), title: "子女已查看", detail: `${viewedNotifications.map((item) => item.name).join("、")}已查看本次在线协助进度` });
      }
      return {
        ...event,
        status: "已完成",
        result: input.result,
        childResult: { status: "已同步", resultSummary: input.result, callCenterNote: event.callCenter.note || "", publishedAt: completedAt },
        completedAt,
        completedBy: "赵亚男",
        timeline: [...timeline, { time: "10:22:16", title: "呼叫中心提交处理结果", detail: `赵亚男完成处理，结果已同步给已绑定子女：${input.result}` }],
      };
    }));
  };

  const saveRecommendationStrategy = (strategy) => {
    const nextSyncEnabled = Boolean(strategy.enabled);
    if (strategy.id) {
      const linkedSource = recommendationStrategies.find((item) => item.id === strategy.id);
      setRecommendationStrategies((items) => items.map((item) => item.id === strategy.id
        ? { ...item, ...strategy, enabled: nextSyncEnabled && !item.sourceUnavailable, sourceSyncEnabled: nextSyncEnabled }
        : linkedSource?.sourceId && item.sourceId === linkedSource.sourceId && item.type === linkedSource.type
          ? { ...item, enabled: nextSyncEnabled && !item.sourceUnavailable, sourceSyncEnabled: nextSyncEnabled }
          : item));
    } else {
      const nextNumber = Math.max(0, ...recommendationStrategies.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
      setRecommendationStrategies((items) => [{ ...strategy, id: `REC-${String(nextNumber).padStart(3, "0")}`, createdAt: strategy.createdAt || recommendationMockNow }, ...items]);
    }
    if (strategy.type === "activity") setCommunityActivities((items) => items.map((item) => item.id === strategy.sourceId ? { ...item, syncToRecommendation: nextSyncEnabled } : item));
    else if (["announcement", "life_info", "alert"].includes(strategy.type)) setSafetyNews((items) => items.map((item) => item.id === strategy.sourceId ? { ...item, syncToRecommendation: nextSyncEnabled } : item));
    setDrawer(null);
  };

  const toggleRecommendationStrategy = (id) => {
    const target = recommendationStrategies.find((item) => item.id === id);
    if (!target) return;
    const nextSyncEnabled = !(target.sourceSyncEnabled ?? target.enabled);
    setRecommendationStrategies((items) => items.map((item) => item.id === id || (target.sourceId && item.sourceId === target.sourceId && item.type === target.type) ? { ...item, enabled: nextSyncEnabled && !item.sourceUnavailable, sourceSyncEnabled: nextSyncEnabled } : item));
    if (target.type === "activity") setCommunityActivities((items) => items.map((item) => item.id === target.sourceId ? { ...item, syncToRecommendation: nextSyncEnabled } : item));
    else if (["announcement", "life_info", "alert"].includes(target.type)) setSafetyNews((items) => items.map((item) => item.id === target.sourceId ? { ...item, syncToRecommendation: nextSyncEnabled } : item));
  };

  const moveRecommendationStrategy = (id, offset) => {
    setRecommendationStrategies((items) => items.map((item) => item.id === id
      ? { ...item, displayOrder: Math.max(1, Number(item.displayOrder) + offset) }
      : item));
  };

  const saveCommunityStaff = (record) => {
    const updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    if (record.id) {
      setCommunityStaff((items) => items.map((item) => item.id === record.id ? { ...item, ...record, projectId: item.projectId, updatedAt } : item));
    } else {
      const nextNumber = Math.max(0, ...communityStaff.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
      setCommunityStaff((items) => [...items, { ...record, projectId: currentProject.id, id: `STF-${String(nextNumber).padStart(3, "0")}`, updatedAt }]);
    }
    setDrawer(null);
  };

  const deleteCommunityStaff = (id) => {
    setCommunityStaff((items) => {
      const target = items.find((item) => item.id === id);
      if (!target) return items;
      const remainingProjectItems = items
        .filter((item) => item.projectId === target.projectId && item.id !== id)
        .sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id));
      const orderById = new Map(remainingProjectItems.map((item, index) => [item.id, index + 1]));
      return items.filter((item) => item.id !== id).map((item) => orderById.has(item.id) ? { ...item, displayOrder: orderById.get(item.id) } : item);
    });
  };

  const moveCommunityStaff = (id, offset) => {
    const updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    setCommunityStaff((items) => {
      const ordered = items.filter((item) => item.projectId === currentProject.id).sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id));
      const index = ordered.findIndex((item) => item.id === id);
      const nextIndex = Math.min(Math.max(index + offset, 0), ordered.length - 1);
      if (index < 0 || index === nextIndex) return items;
      const [moved] = ordered.splice(index, 1);
      ordered.splice(nextIndex, 0, moved);
      const orderById = new Map(ordered.map((item, orderIndex) => [item.id, orderIndex + 1]));
      return items.map((item) => orderById.has(item.id) ? { ...item, displayOrder: orderById.get(item.id), updatedAt: item.id === id ? updatedAt : item.updatedAt } : item);
    });
  };

  const syncRecommendationSource = (source, recommendationType, sourceAvailable) => {
    if (!source?.id || !recommendationType) return;
    const shouldSync = Boolean(source.syncToRecommendation);
    setRecommendationStrategies((items) => {
      const matches = items.filter((item) => item.sourceId === source.id && item.type === recommendationType);
      const linked = matches.find((item) => item.sourceManaged) || matches[0];
      if (!linked && (!shouldSync || !sourceAvailable)) return items;
      const isActivity = recommendationType === "activity";
      const startsAt = normalizeRecommendationSourceDateTime(isActivity ? source.startAt : source.publishAt);
      const endsAt = normalizeRecommendationSourceDateTime(isActivity ? source.endAt : source.validUntil || linked?.endsAt, true);
      const sourceFields = {
        projectId: source.projectId || currentProject.id,
        name: source.title,
        type: recommendationType,
        sourceId: source.id,
        sourceName: source.title,
        sourceUpdatedAt: source.updatedAt || source.publishedAt || source.publishAt || recommendationMockNow.replace("T", " "),
        startsAt,
        endsAt,
        enabled: shouldSync && sourceAvailable,
        sourceUnavailable: !sourceAvailable,
        sourceSyncEnabled: shouldSync,
        sourceStatus: isActivity ? getCommunityActivityStatus(source) : getCommunityContentStatus(source),
        sourceManaged: true,
      };
      if (linked) return items.map((item) => item.sourceId === source.id && item.type === recommendationType ? { ...item, ...sourceFields, sourceManaged: item.id === linked.id || item.sourceManaged } : item);
      const nextNumber = Math.max(0, ...items.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
      const nextOrder = Math.max(0, ...items.filter((item) => (item.projectId || "PRJ-001") === (source.projectId || currentProject.id)).map((item) => Number(item.displayOrder) || 0)) + 1;
      return [...items, { ...sourceFields, id: `REC-${String(nextNumber).padStart(3, "0")}`, displayOrder: nextOrder, durationSeconds: 20, afterView: "continue", createdAt: recommendationMockNow }];
    });
  };

  const saveSafetyNews = (record) => {
    const created = !record.id;
    const updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    let savedRecord;
    if (record.id) {
      savedRecord = { ...safetyNews.find((item) => item.id === record.id), ...record, updatedAt };
      setSafetyNews((items) => items.map((item) => item.id === record.id ? savedRecord : item));
    } else {
      const nextNumber = Math.max(0, ...safetyNews.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
      savedRecord = { ...record, projectId: currentProject.id, id: `SAF-${String(nextNumber).padStart(3, "0")}`, status: record.status || "未发布", updatedAt };
      setSafetyNews((items) => [savedRecord, ...items]);
    }
    syncRecommendationSource(savedRecord, recommendationTypeByCommunityContent[savedRecord.type], isCommunityContentAvailable(savedRecord));
    if (created && savedRecord.type === "社区公告") completeOverviewQuickAction("社区公告已新增，运营概览已刷新");
    setDrawer(null);
  };

  const changeSafetyNewsStatus = (id, status) => {
    const updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    const source = safetyNews.find((item) => item.id === id);
    if (!source) return;
    const next = { ...source, status, publishAt: status === "已发布" && getCommunityContentStatus(source) === "未发布" ? communityContentMockNow : source.publishAt, updatedAt };
    setSafetyNews((items) => items.map((item) => item.id === id ? next : item));
    syncRecommendationSource(next, recommendationTypeByCommunityContent[next.type], status === "已发布" && isCommunityContentAvailable(next));
  };

  const saveCommunityTopic = (topic) => {
    const nextNumber = Math.max(0, ...communityTopics.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
    const createdAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    setCommunityTopics((items) => [{ ...topic, id: `TOPIC-${String(nextNumber).padStart(3, "0")}`, createdAt }, ...items]);
    setDrawer(null);
  };

  const closeCommunityTopic = (id) => {
    setCommunityTopics((items) => items.map((item) => item.id === id ? { ...item, status: "closed" } : item));
    setDrawer((current) => current?.kind === "communityTopicDetail" ? { ...current, topicId: id } : current);
  };

  const updateServiceBookingStatus = (id, status) => {
    const updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    setServiceBookings((items) => items.map((item) => item.id === id ? { ...item, status, operator: "赵亚男", updatedAt } : item));
    setDrawer((current) => current?.kind === "serviceBooking" && current.record?.id === id
      ? { ...current, record: { ...current.record, status, operator: "赵亚男", updatedAt } }
      : current);
  };

  const saveServiceCategory = (category) => {
    const updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    if (category.id) {
      setServiceCategories((items) => items.map((item) => item.id === category.id ? { ...item, ...category, updatedAt } : item));
      setServiceCatalog((items) => items.map((item) => item.projectId === category.projectId && item.categoryCode === category.code ? { ...item, category: category.name, categoryName: category.name, updatedAt } : item));
    } else {
      const customNumbers = serviceCategories.map((item) => Number(`${item.code}`.match(/^custom-(\d+)$/)?.[1]) || 0);
      const nextNumber = Math.max(0, ...customNumbers) + 1;
      const suffix = String(nextNumber).padStart(3, "0");
      setServiceCategories((items) => [...items, {
        ...category,
        id: `SC-${currentProject.id}-CUSTOM-${suffix}`,
        projectId: currentProject.id,
        communityId: serviceCategoryMock.communities.find((item) => item.projectId === currentProject.id)?.communityId || currentProject.id,
        code: `custom-${suffix}`,
        status: "启用",
        availableServiceCount: 0,
        updatedAt,
      }]);
    }
    setDrawer(null);
  };

  const moveServiceCategory = (id, direction) => {
    const scoped = serviceCategories.filter((item) => item.projectId === currentProject.id).sort((a, b) => a.displayOrder - b.displayOrder || a.code.localeCompare(b.code));
    const currentIndex = scoped.findIndex((item) => item.id === id);
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= scoped.length) return;
    const current = scoped[currentIndex];
    const target = scoped[nextIndex];
    const updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    setServiceCategories((items) => items.map((item) => item.id === current.id
      ? { ...item, displayOrder: target.displayOrder, updatedAt }
      : item.id === target.id
        ? { ...item, displayOrder: current.displayOrder, updatedAt }
        : item));
  };

  const toggleServiceCategory = (id) => {
    const updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    setServiceCategories((items) => items.map((item) => item.id === id ? { ...item, status: item.status === "启用" ? "已停用" : "启用", updatedAt } : item));
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
    const created = !activity.id;
    const publishedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    let savedActivity;
    if (activity.id) {
      savedActivity = { ...communityActivities.find((item) => item.id === activity.id), ...activity, publishedAt };
      setCommunityActivities((items) => items.map((item) => item.id === activity.id ? savedActivity : item));
    } else {
      const nextNumber = Math.max(0, ...communityActivities.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
      savedActivity = { ...activity, projectId: currentProject.id, id: `ACT-${String(nextNumber).padStart(3, "0")}`, publishedAt };
      setCommunityActivities((items) => [savedActivity, ...items]);
    }
    syncRecommendationSource(savedActivity, "activity", !savedActivity.isOffline);
    if (created) completeOverviewQuickAction("社区活动已发布，运营概览已刷新");
    setDrawer(null);
  };

  const unpublishCommunityActivity = (id) => {
    const source = communityActivities.find((item) => item.id === id);
    if (!source) return;
    const next = { ...source, isOffline: true };
    setCommunityActivities((items) => items.map((item) => item.id === id ? next : item));
    syncRecommendationSource(next, "activity", false);
  };

  const restoreCommunityActivity = (id) => {
    const source = communityActivities.find((item) => item.id === id);
    if (!source) return;
    const next = { ...source, isOffline: false };
    setCommunityActivities((items) => items.map((item) => item.id === id ? next : item));
    syncRecommendationSource(next, "activity", true);
  };

  const setCommunityActivityLiveMockState = (id, liveMockState) => {
    setCommunityActivities((items) => items.map((item) => item.id === id ? { ...item, liveMockState } : item));
  };

  const saveProject = (nextProject, adminMember) => {
    if (nextProject.id) {
      setProjects((items) => items.map((project) => project.id === nextProject.id ? nextProject : project));
      setElderlyRecords((records) => records.map((record) => {
        const previousProject = projects.find((project) => project.id === nextProject.id);
        return previousProject && (record.project === previousProject.name || record.community === previousProject.name) ? { ...record, project: nextProject.name, community: nextProject.name } : record;
      }));
      setCommunityMembers((items) => {
        if (adminMember.id) return items.map((member) => member.id === adminMember.id ? { ...member, ...adminMember, projectId: nextProject.id, roleId: `ROLE-${nextProject.id}-ADMIN` } : member);
        const nextMemberNumber = Math.max(0, ...items.map((member) => Number(member.id.split("-").pop()) || 0)) + 1;
        return [...items, { ...adminMember, id: `USR-${String(nextMemberNumber).padStart(3, "0")}`, projectId: nextProject.id, roleId: `ROLE-${nextProject.id}-ADMIN`, lastLogin: "从未登录" }];
      });
    } else {
      const nextNumber = Math.max(...projects.map((project) => Number(project.id.split("-").pop()))) + 1;
      const projectId = `PRJ-${String(nextNumber).padStart(3, "0")}`;
      setProjects((items) => [...items, { ...nextProject, id: projectId, status: "启用" }]);
      setRoles((items) => [...items, ...createCommunityRoles(projectId)]);
      setCommunityMembers((items) => {
        const nextMemberNumber = Math.max(0, ...items.map((member) => Number(member.id.split("-").pop()) || 0)) + 1;
        return [...items, { ...adminMember, id: `USR-${String(nextMemberNumber).padStart(3, "0")}`, projectId, roleId: `ROLE-${projectId}-ADMIN`, lastLogin: "从未登录" }];
      });
    }
  };

  const toggleProject = async (id) => {
    const project = projects.find((item) => item.id === id);
    if (!project) throw new Error("社区不存在或已被移除，请刷新后重试。");
    const previousStatus = project.status;
    const nextStatus = previousStatus === "启用" ? "停用" : "启用";
    const operatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    if (project.statusChangeFailureOnce) {
      setProjects((items) => items.map((item) => item.id === id ? { ...item, statusChangeFailureOnce: false } : item));
      setOperationLogs((items) => [{ id: `LOG-${Date.now()}`, time: operatedAt, operator: "赵亚男", accountRole: "platform.admin / 平台管理员", module: "项目与社区", action: nextStatus === "停用" ? "停用" : "启用", target: project.name, summary: `${nextStatus}社区运营入口`, result: "失败", client: "10.10.2.18 · Chrome / macOS", before: `状态：${previousStatus}`, after: "无变更", failureReason: "状态更新失败，请重试" }, ...items]);
      throw new Error("状态更新失败，原状态已保留，请重试。");
    }
    setProjects((items) => items.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
    setOperationLogs((items) => [{ id: `LOG-${Date.now()}`, time: operatedAt, operator: "赵亚男", accountRole: "platform.admin / 平台管理员", module: "项目与社区", action: nextStatus === "停用" ? "停用" : "启用", target: project.name, summary: `${nextStatus}社区运营入口`, result: "成功", client: "10.10.2.18 · Chrome / macOS", before: `状态：${previousStatus}`, after: `状态：${nextStatus}`, failureReason: "" }, ...items]);
  };

  const saveCommunityMember = (member) => {
    if (member.id) {
      setCommunityMembers((items) => items.map((item) => item.id === member.id ? { ...item, ...member } : item));
      return;
    }
    const nextNumber = Math.max(0, ...communityMembers.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
    setCommunityMembers((items) => [...items, { ...member, id: `USR-${String(nextNumber).padStart(3, "0")}`, lastLogin: "从未登录" }]);
  };

  const toggleCommunityMember = (id, nextStatus) => {
    setCommunityMembers((items) => items.map((member) => member.id === id ? { ...member, status: nextStatus || (member.status === "已启用" ? "已停用" : "已启用") } : member));
  };

  const addAdminAuditLog = ({ module, action, target, summary, before, after }) => {
    const operatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    setOperationLogs((items) => [{ id: `LOG-${Date.now()}`, time: operatedAt, operator: "赵亚男", accountRole: "platform.admin / 平台管理员", module, action, target, summary, result: "成功", client: "10.10.2.18 · Chrome / macOS", before, after, failureReason: "" }, ...items]);
  };

  const saveRole = (role) => {
    if (role.id) {
      setRoles((items) => items.map((item) => item.id === role.id ? { ...item, ...role } : item));
      return;
    }
    const nextNumber = Math.max(0, ...roles.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
    setRoles((items) => [...items, { ...role, id: `ROLE-CUSTOM-${String(nextNumber).padStart(3, "0")}` }]);
  };

  const toggleRole = (id) => {
    setRoles((items) => items.map((role) => role.id === id ? { ...role, status: role.status === "已启用" ? "已停用" : "已启用" } : role));
  };

  const deleteRole = (id) => {
    setRoles((items) => items.filter((role) => role.id !== id));
  };

  const generateTabletActivation = (activation) => {
    const normalizedActivation = normalizeTabletActivationRecord(activation);
    setActivationRecords((records) => [normalizedActivation, ...records]);
  };

  const unbindTablet = (tabletId) => {
    const currentDevice = tabletDevices.find((device) => device.id === tabletId);
    if (currentDevice?.unbindFailureOnce) {
      setTabletDevices((devices) => devices.map((device) => device.id === tabletId ? { ...device, unbindFailureOnce: false } : device));
      return { ok: false, message: "解绑失败，当前网络异常。" };
    }
    setTabletDevices((devices) => devices.map((device) => device.id === tabletId ? { ...device, boundElderlyId: null, boundAt: "", activationStatus: "待激活", onlineStatus: "离线", lastOnline: "尚未激活" } : device));
    setTabletTarget(null);
    return { ok: true };
  };

  const applyElderlyScenario = (scenario) => {
    const contractElderly = elderlyRecords.find((item) => item.id === "SG-E-000125") || elderlyRows.find((item) => item.id === "SG-E-000125");
    const boundElderly = elderlyRecords.find((item) => item.id === "SG-E-000128") || elderlyRows.find((item) => item.id === "SG-E-000128");
    const scenarioDeviceId = "TAB-SG-20260032";
    const scenarioDeviceSn = "SN-TAB-260032";
    const scenarioActivationId = "ACT-TABLET-STATE-001";
    const openTabletDetail = () => {
      setElderlyDetailInitialTab("tablet");
      setElderlyDetailId(contractElderly.id);
      setTabletTarget(null);
    };
    const replaceScenarioActivation = (nextActivation) => {
      setActivationRecords((records) => [nextActivation, ...records.filter((item) => item.id !== scenarioActivationId && item.elderlyId !== contractElderly.id && item.deviceId !== scenarioDeviceId)]);
    };
    setElderlyScenario(scenario);
    setPlatformMode("community");
    setActive("elderly");
    setElderlyDetailId(null);
    setDrawer(null);
    setDeviceDrawer(null);
    if (scenario === "tabletUnbound" || scenario === "normal") {
      setTabletDevices((devices) => devices.map((device) => device.id === scenarioDeviceId ? { ...device, projectId: "PRJ-001", boundElderlyId: null, boundAt: "", activationCode: "", activationStatus: "待激活", onlineStatus: "离线", lastOnline: "尚未激活" } : device));
      setActivationRecords((records) => records.filter((item) => item.elderlyId !== contractElderly.id && item.deviceId !== scenarioDeviceId));
      if (scenario === "tabletUnbound") openTabletDetail();
      return;
    }
    if (scenario === "tabletPending" || scenario === "activationPending") {
      setTabletDevices((devices) => devices.map((device) => device.id === scenarioDeviceId ? { ...device, projectId: "PRJ-001", boundElderlyId: null, boundAt: "", activationCode: "", activationStatus: "待激活", onlineStatus: "离线", lastOnline: "尚未激活" } : device));
      replaceScenarioActivation({ id: scenarioActivationId, code: tabletActivationMock.activationCode, elderlyId: contractElderly.id, deviceId: scenarioDeviceId, deviceSn: scenarioDeviceSn, status: "待使用", method: "6位激活码", createdAt: tabletActivationMock.createdAt, operator: tabletActivationMock.operator });
      openTabletDetail();
      return;
    }
    if (scenario === "tabletActivated" || scenario === "activationSuccess") {
      setTabletDevices((devices) => devices.map((device) => device.id === scenarioDeviceId ? { ...device, projectId: "PRJ-001", boundElderlyId: contractElderly.id, boundAt: tabletActivationMock.completedAt, activationCode: tabletActivationMock.activationCode, operator: tabletActivationMock.operator, activationStatus: "已激活", onlineStatus: "在线", lastOnline: "刚刚" } : device));
      replaceScenarioActivation({ id: scenarioActivationId, code: tabletActivationMock.activationCode, elderlyId: contractElderly.id, deviceId: scenarioDeviceId, deviceSn: scenarioDeviceSn, status: "已使用", method: "6位激活码", createdAt: tabletActivationMock.createdAt, usedAt: tabletActivationMock.completedAt, operator: tabletActivationMock.operator });
      openTabletDetail();
      return;
    }
    if (scenario === "tabletActivationFailed") {
      setTabletDevices((devices) => devices.map((device) => device.id === scenarioDeviceId ? { ...device, projectId: "PRJ-001", boundElderlyId: null, boundAt: "", activationCode: "", activationStatus: "待激活", onlineStatus: "离线", lastOnline: "尚未激活" } : device));
      replaceScenarioActivation({ id: scenarioActivationId, code: tabletActivationMock.activationCode, elderlyId: contractElderly.id, deviceId: scenarioDeviceId, deviceSn: scenarioDeviceSn, status: "激活失败", method: "6位激活码", createdAt: tabletActivationMock.createdAt, failureReason: "激活码与目标设备不匹配", operator: tabletActivationMock.operator });
      openTabletDetail();
      return;
    }
    if (scenario === "unbindFailure") {
      setTabletDevices((devices) => devices.map((device) => device.id === "TAB-SG-20260031" ? { ...device, boundElderlyId: "SG-E-000128", activationStatus: "已激活", onlineStatus: "在线", unbindFailureOnce: true, unbindFailureVisible: false } : device));
      setTabletTarget(boundElderly);
      return;
    }
    setTabletTarget(null);
  };

  const unlinkFamilyRelation = (relationId) => {
    setFamilyRelations((items) => items.map((item) => item.id === relationId && item.status === "正常" ? { ...item, status: "已解除" } : item));
  };

  const saveTabletDevice = (device) => {
    setTabletDevices((devices) => [...devices, device]);
    setDeviceDrawer(null);
  };

  const applyTabletOtaUpgrade = ({ deviceId, packageType, targetVersion, versionStatus }) => {
    setTabletDevices((devices) => devices.map((device) => device.id !== deviceId ? device : {
      ...device,
      ...(packageType === "ROM" ? { romVersion: targetVersion } : { apkVersion: targetVersion, currentVersion: targetVersion }),
      versionStatus,
      lastOnline: device.onlineStatus === "在线" ? "刚刚" : device.lastOnline,
    }));
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
    <div className={`app-shell admin-style-theme ${collapsed ? "collapsed" : ""} ${platformMode === "platform" ? "platform-mode" : "community-mode"}`}>
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><img className="brand-logo" src={u2gLogo} alt="U2G"/></div><div className="brand-copy"><strong>U2G 乐龄服务平台</strong><span>{platformMode === "platform" ? "平台管理端" : "社区运营端"}</span></div></div>
        <nav>{visibleMenuGroups.map((group) => <div className="menu-group" key={group.label}><div className="menu-label">{group.label}</div>{group.items.map((item) => { const Icon = item.icon; return <button title={item.label} className={active === item.key ? "active" : ""} key={item.key} onClick={() => requestModuleNavigation(item.key)}><Icon size={18}/><span>{item.label}</span>{active === item.key && <i/>}</button>; })}</div>)}</nav>
        <div className="sidebar-footer"><button onClick={() => setCollapsed(!collapsed)}><Menu size={18}/><span>收起菜单</span></button></div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-navigation">
            <a className="portal-return-link" href={u2gPortalUrl} aria-label="返回 U2G智慧养老"><ArrowLeft size={16}/><span>返回 U2G智慧养老</span></a>
            <span className="topbar-navigation-divider" aria-hidden="true"/>
            <div className="breadcrumb"><Home size={15}/><span>{platformMode === "platform" ? "平台管理端" : currentProject?.name}</span><ChevronRight size={14}/><b>{activeLabel}</b></div>
          </div>
          <div className="top-actions">
            <label className="top-context-select platform-context-select"><span>当前平台</span><select value={platformMode} onChange={(event) => switchPlatformMode(event.target.value)}><option value="community">社区运营端</option><option value="platform">平台管理端</option></select></label>
            {platformMode === "community" && <label className="top-context-select community-context-select"><span>当前社区</span><select value={currentProject?.id || ""} onChange={(event) => requestCommunitySwitch(event.target.value)}>{authorizedProjects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label>}
            <button className="top-icon"><Bell size={18}/><i/></button><span className="divider"/><button className="profile"><span className="avatar">赵</span><span><b>赵亚男</b><small>{platformMode === "platform" ? "平台管理员" : "社区运营管理员"}</small></span><ChevronDown size={14}/></button>
          </div>
        </header>
        <main className="content">
          {active !== "overview" && overviewContext && <div className="overview-filter-context"><div><SlidersHorizontal size={16}/><span>来自运营概览</span><b>{overviewContext}</b></div><button type="button" onClick={() => setOverviewContext("")}>清除条件</button></div>}
          {active === "platformOverview"
            ? <PlatformOverview projects={projects} elderlyRecords={elderlyRecords} tablets={tabletDevices} members={communityMembers} onSaveProject={saveProject} onOpenPlatformDevices={() => setActive("platformTabletDevices")} onOpenPlatformOta={() => setActive("tabletOta")}/>
            : active === "overview"
            ? <Overview onNavigate={navigateFromOverview} onQuickAction={openOverviewQuickAction} quickPermissions={overviewQuickPermissions} scenario={overviewScenario} resetSignal={acceptanceResetSignal} scope={{ name: currentProject?.name || "未选择社区", project: currentProject?.name || "未选择社区" }} records={scopedElderlyRecords} tablets={scopedTabletDevices} sensors={scopedSensorDevices} reminders={scopedReminderRecords.filter((reminder) => !reminder.deletedAt)}/>
            : active === "elderlyDataDashboard"
              ? <ElderlyDataDashboardPage communityName={currentProject?.name || "未选择社区"} records={scopedElderlyRecords} tablets={scopedTabletDevices} sensors={scopedSensorDevices} view={communityUsageView} onViewChange={setCommunityUsageView} inactivityRule={globalInactivityRule} onEditInactivityRule={() => setGlobalRuleOpen(true)} onOpenElderly={(record) => navigateFromOverview({ page: "elderly", elderlyName: record.name, detailTab: "statistics", filter: `${currentProject?.name || "当前社区"} · ${record.name} · 数据统计` })}/>
            : active === "elderly"
              ? <ElderlyPage records={scopedElderlyRecords} tabletDevices={scopedTabletDevices} activationRecords={activationRecords.filter((item) => scopedElderlyIds.has(item.elderlyId))} onOpen={(mode, record) => { if (mode === "view") { setElderlyDetailInitialTab("profile"); setElderlyDetailId(record.id); } else setDrawer({ kind: "elderly", mode, record }); }}/>
              : active === "relations"
                ? <RelativeArchivePage accounts={scopedRelativeAccounts} elderlyRecords={scopedElderlyRecords} weatherLocations={weatherLocations} onOpen={(account) => setRelativeDetailId(account.id)}/>
              : active === "emergencyHelp"
                ? <EmergencyHelpPage events={scopedEmergencyEvents} elderlyRecords={scopedElderlyRecords} onOpen={(event) => setDrawer({ kind: "emergencyHelp", eventId: event.id })}/>
              : active === "serviceCommunication"
                ? <ServiceCommunicationPage projectId={currentProject?.id} communityName={currentProject?.name || "当前社区"}/>
              : active === "familyAlbums"
                ? <FamilyAlbumBatchManagementPage batches={scopedAlbumBatches} elderlyRecords={scopedElderlyRecords} relatives={scopedRelativeAccounts} onViewBatch={(batch) => setDrawer({ kind: "familyAlbumBatch", batchId: batch.id })}/>
              : active === "recommendations"
                ? <RecommendationStrategyPage strategies={scopedRecommendationStrategies} reminderPolicies={reminderPolicies.filter((item) => item.enabled && !item.queueExcluded)} communityName={currentProject?.name} acceptanceScenario={recommendationScenario} onCreate={(presetDate) => setDrawer({ kind: "recommendation", presetDate })} onEdit={(record) => setDrawer({ kind: "recommendation", record })} onToggle={toggleRecommendationStrategy} onMove={moveRecommendationStrategy}/>
              : active === "activities"
                ? <CommunityActivityPage records={communityActivityRecords} registrations={scopedRegistrations} communityName={currentProject?.name} onCreate={() => setDrawer({ kind: "activity", mode: "edit" })} onView={(record) => setDrawer({ kind: "activity", mode: "view", record })} onEdit={(record) => setDrawer({ kind: "activity", mode: "edit", record })} onUnpublish={unpublishCommunityActivity} onRestore={restoreCommunityActivity} onViewRegistrations={(record) => setDrawer({ kind: "activityRegistrations", record })}/>
              : active === "communityStaff"
                ? <CommunityStaffPage records={scopedCommunityStaff} communityName={currentProject?.name} onCreate={() => setDrawer({ kind: "communityStaff" })} onEdit={(record) => setDrawer({ kind: "communityStaff", record })} onDelete={deleteCommunityStaff} onMove={moveCommunityStaff}/>
              : communityContentTypeByMenu[active]
                ? <SafetyNewsPage records={scopedSafetyNews} contentType={communityContentTypeByMenu[active]} communityName={currentProject?.name} onCreate={() => setDrawer({ kind: "safety", mode: "edit", contentType: communityContentTypeByMenu[active] })} onView={(record) => setDrawer({ kind: "safety", mode: "view", record, contentType: record.type })} onEdit={(record) => setDrawer({ kind: "safety", mode: "edit", record, contentType: record.type })} onStatusChange={changeSafetyNewsStatus}/>
              : active === "services"
                ? <ServiceBookingPage bookings={scopedServiceBookings} categories={scopedServiceCategories} elderlyRecords={scopedElderlyRecords} communityName={currentProject?.name || "当前社区"} onOpen={(record) => setDrawer({ kind: "serviceBooking", record })} onCreateCategory={() => setDrawer({ kind: "serviceCategory" })} onEditCategory={(record) => setDrawer({ kind: "serviceCategory", record })} onMoveCategory={moveServiceCategory} onToggleCategory={toggleServiceCategory}/>
              : active === "projects"
                ? <ProjectPage projects={projects} members={communityMembers} roles={roles} onSave={saveProject} onToggle={toggleProject} onSaveMember={saveCommunityMember} onToggleMember={toggleCommunityMember}/>
                : active === "userManagement"
                  ? platformMode === "platform"
                    ? <PlatformUserManagementPage roles={roles} users={communityMembers} onSave={saveCommunityMember} onToggle={toggleCommunityMember} onChangeStatus={toggleCommunityMember} onAudit={addAdminAuditLog}/>
                    : <UserManagementPage currentProject={currentProject} projects={projects} roles={roles} users={communityMembers} onSave={saveCommunityMember} onToggle={toggleCommunityMember} onChangeStatus={toggleCommunityMember} onAudit={addAdminAuditLog}/>
                  : active === "roleManagement"
                    ? platformMode === "platform"
                      ? <PlatformRoleManagementPage roles={roles} users={communityMembers} onSave={saveRole} onDelete={deleteRole} onAudit={addAdminAuditLog}/>
                      : <RoleManagementPage currentProject={currentProject} projects={projects} roles={roles} users={communityMembers} onSave={saveRole} onDelete={deleteRole} onAudit={addAdminAuditLog}/>
                : active === "platformTabletDevices"
                  ? <PlatformTabletDevicesPage devices={tabletDevices} projects={projects} onOpenOta={() => setActive("tabletOta")}/>
                  : active === "tabletDevices"
                    ? <DeviceManagementPage key={`${active}-${currentProjectId}`} deviceType="tablet" tablets={scopedTabletDevices} sensors={scopedSensorDevices} elderlyRecords={scopedElderlyRecords} currentProject={currentProject} onAddTablet={() => setDeviceDrawer({ kind: "tabletCreate" })} onViewTablet={(device) => setDeviceDrawer({ kind: "tabletView", device })} onManageTablet={setTabletTarget} onAddSensor={() => setDeviceDrawer({ kind: "sensorCreate" })} onViewSensor={(sensor) => setDeviceDrawer({ kind: "sensorView", sensor })}/>
                  : active === "tabletOta"
                    ? <TabletOtaPage projects={projects} devices={tabletDevices.map((device) => ({ ...device, projectName: projects.find((project) => project.id === device.projectId)?.name || "未归属项目", elderlyName: elderlyRecords.find((record) => record.id === device.boundElderlyId)?.name || "" }))} resetSignal={acceptanceResetSignal} onApplyUpgrade={applyTabletOtaUpgrade}/>
                  : active === "careScripts"
                      ? <CareScriptManagementPage scripts={careScripts} onEdit={(condition, record) => setDrawer({ kind: "careScript", condition, availableConditions: [], record })} onToggle={toggleCareScript}/>
                    : active === "reminderPolicies"
                      ? <ReminderPoliciesPage policies={reminderPolicies} onToggle={(id) => setReminderPolicies((items) => items.map((item) => item.id === id && !item.fixed ? { ...item, enabled: !item.enabled } : item))}/>
                    : active === "leisureEntertainment"
                      ? <LeisureEntertainmentPage entries={leisureEntertainmentEntries} onChange={setLeisureEntertainmentEntries} scenario={leisureEntertainmentScenario} resetSignal={acceptanceResetSignal} onDirtyChange={setLeisureEntertainmentDirty}/>
                    : active === "logs"
                      ? <OperationLogPage records={operationLogs}/>
                    : <ManagementPage page={active} onCreate={() => setDrawer({ kind: "generic" })}/>} 
        </main>
      </div>
      {elderlyDetailRecord && <ElderlyDetailDrawer key={`${elderlyDetailRecord.id}-${elderlyDetailInitialTab}`} initialTab={elderlyDetailInitialTab} record={elderlyDetailRecord} tablet={tabletDevices.find((device) => device.boundElderlyId === elderlyDetailRecord.id)} activation={elderlyDetailActivation} activationDevice={elderlyDetailActivationDevice} sensors={sensorDevices} reminders={reminderRecords.filter((reminder) => reminder.elderlyId === elderlyDetailRecord.id)} familyRelations={familyRelations.filter((item) => item.elderlyId === elderlyDetailRecord.id)} onUnlinkRelation={unlinkFamilyRelation} inactivityRule={{ ...globalInactivityRule, ...(inactivityRules[elderlyDetailRecord.id] || defaultInactivityState), enabled: globalInactivityRule.enabled, thresholdHours: globalInactivityRule.thresholdHours, startTime: globalInactivityRule.startTime, endTime: globalInactivityRule.endTime }} onClose={() => { setElderlyDetailId(null); setElderlyDetailInitialTab("profile"); }} onEdit={() => { setElderlyDetailId(null); setElderlyDetailInitialTab("profile"); setDrawer({ kind: "elderly", mode: "edit", record: elderlyDetailRecord }); }} onCreateReminder={() => setDrawer({ kind: "reminder", elderlyId: elderlyDetailRecord.id })} onEditReminder={(record) => setDrawer({ kind: "reminder", elderlyId: elderlyDetailRecord.id, record })} onDeleteReminder={deleteReminder} onViewReminderPlan={(record) => setDrawer({ kind: "reminderPlan", record })} onManageSpaces={() => setSpaceTarget(elderlyDetailRecord)} onAddSensor={() => setDeviceDrawer({ kind: "sensorCreate", elderlyId: elderlyDetailRecord.id })} onViewSensor={(sensor) => setDeviceDrawer({ kind: "sensorView", sensor })} onManageTablet={() => setTabletTarget(elderlyDetailRecord)}/>} 
      {relativeDetailRecord && <RelativeDetailDrawer account={relativeDetailRecord} elderlyRecords={elderlyRecords} weatherLocation={weatherMockApi.getLocation(weatherLocations, "亲属", relativeDetailRecord.id)} onClose={() => setRelativeDetailId(null)} onOpenElderly={(record) => { setActive("elderly"); setRelativeDetailId(null); setElderlyDetailId(record.id); window.scrollTo({ top: 0, behavior: "auto" }); }}/>} 
      {drawer?.kind === "elderly" && <ElderlyDrawer key={`${drawer.mode}-${drawer.record?.id || "new"}`} mode={drawer.mode} record={drawer.record} projects={currentProject ? [currentProject] : []} tablet={scopedTabletDevices.find((device) => device.boundElderlyId === drawer.record?.id)} activation={activationRecords.find((item) => item.elderlyId === drawer.record?.id && (isPendingTabletActivation(item.status) || isFailedTabletActivation(item.status)))} onManageTablet={() => setTabletTarget(drawer.record)} onClose={() => setDrawer(null)} onSave={saveElderlyRecord}/>} 
      {drawer?.kind === "overviewReminderPicker" && <ElderlyPickerModal records={scopedElderlyRecords} value="" onClose={() => setDrawer(null)} onConfirm={(elderlyId) => setDrawer({ kind: "reminder", elderlyId, source: "overview" })}/>} 
      {drawer?.kind === "reminder" && <ReminderDrawer key={drawer.record?.id || `new-reminder-${drawer.elderlyId}`} record={drawer.record} elderlyRecords={scopedElderlyRecords} initialElderlyId={drawer.elderlyId} lockElderly onClose={() => setDrawer(null)} onSave={saveReminder}/>} 
      {drawer?.kind === "reminderPlan" && <ReminderPlanDrawer reminder={drawer.record} elderly={scopedElderlyRecords.find((record) => record.id === drawer.record.elderlyId)} onClose={() => setDrawer(null)}/>} 
      {drawer?.kind === "emergencyHelp" && (() => {
        const event = emergencyHelpEvents.find((item) => item.id === drawer.eventId);
        if (!event) return null;
        return <EmergencyHelpDrawer event={event} elderly={scopedElderlyRecords.find((item) => item.id === event.elderlyId)} onClose={() => setDrawer(null)} onRetry={retryEmergencyNotification} onSaveProcessing={saveEmergencyProcessing} onComplete={completeEmergencyEvent}/>;
      })()}
      {drawer?.kind === "familyAlbumBatch" && (() => {
        const batch = familyAlbumBatches.find((item) => item.id === drawer.batchId);
        if (!batch) return null;
        return <FamilyAlbumBatchDetailDrawer batch={batch} elderly={scopedElderlyRecords.find((item) => item.id === batch.elderlyId)} uploader={scopedRelativeAccounts.find((item) => item.id === batch.uploaderId)} onClose={() => setDrawer(null)}/>;
      })()}
      {drawer?.kind === "recommendation" && <RecommendationStrategyDrawer key={drawer.record?.id || `new-recommendation-${drawer.presetDate || "default"}`} record={drawer.record} presetDate={drawer.presetDate} safetyNews={scopedSafetyNews} activities={communityActivityRecords} entertainmentEntries={leisureEntertainmentEntries.filter((item) => item.enabled)} currentProject={currentProject} onClose={() => setDrawer(null)} onSave={saveRecommendationStrategy}/>} 
      {drawer?.kind === "activity" && <CommunityActivityDrawer key={`${drawer.mode}-${drawer.record?.id || "new-activity"}`} mode={drawer.mode} currentProject={currentProject} record={drawer.record} onClose={() => setDrawer(null)} onSave={saveCommunityActivity} onSetLiveMockState={setCommunityActivityLiveMockState}/>} 
      {drawer?.kind === "activityRegistrations" && <ActivityRegistrationsModal activity={drawer.record} registrations={scopedRegistrations} elderlyRecords={scopedElderlyRecords} onClose={() => setDrawer(null)}/>} 
      {drawer?.kind === "communityStaff" && <CommunityStaffDrawer key={drawer.record?.id || `new-community-staff-${currentProjectId}`} record={drawer.record} currentProject={currentProject} nextDisplayOrder={Math.max(0, ...scopedCommunityStaff.map((item) => Number(item.displayOrder) || 0)) + 1} onClose={() => setDrawer(null)} onSave={saveCommunityStaff}/>} 
      {drawer?.kind === "safety" && <SafetyNewsDrawer key={`${drawer.mode}-${drawer.record?.id || `new-${drawer.contentType || "community-content"}`}`} mode={drawer.mode} record={drawer.record} contentType={drawer.contentType} currentProject={currentProject} onClose={() => setDrawer(null)} onSave={saveSafetyNews}/>} 
      {drawer?.kind === "communityTopicCreate" && <CommunityTopicDrawer currentProject={currentProject} contentRecords={scopedSafetyNews} onClose={() => setDrawer(null)} onSave={saveCommunityTopic}/>} 
      {drawer?.kind === "communityTopicDetail" && (() => {
        const topic = communityTopics.find((item) => item.id === drawer.topicId);
        if (!topic) return null;
        return <CommunityTopicDetailDrawer topic={topic} comments={scopedTopicComments.filter((comment) => comment.topicId === topic.id)} contentRecords={scopedSafetyNews} onClose={() => setDrawer(null)} onCloseTopic={closeCommunityTopic}/>;
      })()}
      {drawer?.kind === "serviceBooking" && <ServiceBookingDrawer booking={drawer.record} elderly={scopedElderlyRecords.find((record) => record.id === drawer.record.elderlyId)} onClose={() => setDrawer(null)} onUpdateStatus={updateServiceBookingStatus}/>} 
      {drawer?.kind === "serviceCategory" && <ServiceCategoryDrawer key={drawer.record?.id || `new-service-category-${currentProjectId}`} record={drawer.record} categories={scopedServiceCategories} communityName={currentProject?.name || "当前社区"} onClose={() => setDrawer(null)} onSave={saveServiceCategory}/>} 
      {drawer?.kind === "serviceCatalog" && <ServiceCatalogDrawer key={drawer.record?.id || "new-service"} record={drawer.record} onClose={() => setDrawer(null)} onSave={saveServiceCatalogItem}/>} 
      {drawer?.kind === "relativeWeather" && <RelativeWeatherLocationDrawer key={drawer.account.id} account={drawer.account} location={weatherMockApi.getLocation(weatherLocations, "亲属", drawer.account.id)} onClose={() => setDrawer(null)} onSave={(selection) => saveRelativeWeatherLocation(drawer.account, selection)}/>} 
      {drawer?.kind === "careScript" && <CareScriptDrawer key={drawer.record?.id || drawer.condition?.code || "new-care-script"} condition={drawer.condition} availableConditions={drawer.availableConditions} record={drawer.record} onClose={() => setDrawer(null)} onSave={saveCareScript}/>} 
      {drawer?.kind === "generic" && <CreateDrawer page={active} onClose={() => setDrawer(null)}/>} 
      {deviceDrawer?.kind === "tabletCreate" && <TabletAssetDrawer devices={tabletDevices} projectId={currentProject?.id} onClose={() => setDeviceDrawer(null)} onSave={saveTabletDevice}/>} 
      {deviceDrawer?.kind === "tabletView" && <TabletAssetDrawer device={deviceDrawer.device} devices={tabletDevices} projectId={currentProject?.id} onClose={() => setDeviceDrawer(null)} onSave={saveTabletDevice}/>} 
      {deviceDrawer?.kind === "sensorCreate" && <SensorInstallDrawer sensors={scopedSensorDevices} elderlyRecords={scopedElderlyRecords} initialElderlyId={deviceDrawer.elderlyId} onClose={() => setDeviceDrawer(null)} onSave={saveSensorDevice}/>} 
      {deviceDrawer?.kind === "sensorView" && <SensorDetailDrawer sensor={deviceDrawer.sensor} elderlyRecords={scopedElderlyRecords} onClose={() => setDeviceDrawer(null)} onMove={moveSensorRoom} onUnbind={unbindSensor}/>} 
      {spaceTarget && <SpaceManagementDrawer record={spaceTarget} onClose={() => setSpaceTarget(null)} onSave={saveElderlySpaces}/>} 
      {tabletTarget && <TabletBindingModal record={tabletTarget} project={projects.find((project) => project.name === tabletTarget.project)} devices={tabletDevices} activation={activationRecords.find((item) => item.elderlyId === tabletTarget.id && (isPendingTabletActivation(item.status) || isFailedTabletActivation(item.status) || item.status === "已使用"))} onGenerate={generateTabletActivation} onClose={() => setTabletTarget(null)} onUnbind={unbindTablet}/>} 
      {globalRuleOpen && <InactivityRuleDrawer rule={globalInactivityRule} onClose={() => setGlobalRuleOpen(false)} onSave={(rule) => { setGlobalInactivityRule(rule); setGlobalRuleOpen(false); }}/>} 
      {pendingProjectId && <div className="modal-layer"><button className="modal-backdrop" aria-label="取消切换社区" onClick={() => setPendingProjectId("")}/><section className="confirm-dialog" role="dialog" aria-modal="true" aria-label="切换社区确认"><span className="confirm-icon warning"><Building2 size={20}/></span><h3>切换到“{projects.find((project) => project.id === pendingProjectId)?.name}”？</h3><p>当前打开的编辑内容尚未保存。切换社区后将关闭当前弹窗，并按新社区的数据权限重新加载页面。</p><div><button className="secondary-button" onClick={() => setPendingProjectId("")}>继续当前操作</button><button className="primary-button" onClick={() => applyCommunitySwitch(pendingProjectId)}>确认切换</button></div></section></div>}
      {pendingNavigation && <div className="modal-layer"><button className="modal-backdrop" aria-label="继续编辑" onClick={() => setPendingNavigation(null)}/><section className="confirm-dialog" role="dialog" aria-modal="true" aria-label="离开休闲娱乐配置"><span className="confirm-icon warning"><AlertTriangle size={20}/></span><h3>离开当前页面？</h3><p>当前休闲娱乐配置尚未保存。离开后，本次修改将不会保留。</p><div><button className="secondary-button" onClick={() => setPendingNavigation(null)}>继续编辑</button><button className="danger-button" onClick={confirmPendingNavigation}>放弃修改并离开</button></div></section></div>}
      {overviewToast && <AdminToast message={overviewToast} onClose={() => setOverviewToast("")}/>} 
      {acceptanceMode && !componentCenterMode && <AcceptanceWorkbench activeModuleId={active} overviewScenario={overviewScenario} recommendationScenario={recommendationScenario} elderlyScenario={elderlyScenario} leisureEntertainmentScenario={leisureEntertainmentScenario} overlayOpen={hasOpenEditor} onModuleChange={navigateFromAcceptance} onOverviewScenarioChange={(scenario) => { setOverviewScenario(scenario); setActive("overview"); setDrawer(null); setDeviceDrawer(null); setTabletTarget(null); setAcceptanceResetSignal((value) => value + 1); }} onRecommendationScenarioChange={(scenario) => { setRecommendationScenario(scenario); setActive("recommendations"); setDrawer(null); setDeviceDrawer(null); setTabletTarget(null); setAcceptanceResetSignal((value) => value + 1); }} onElderlyScenarioChange={applyElderlyScenario} onLeisureEntertainmentScenarioChange={(scenario) => { setLeisureEntertainmentScenario(scenario); setLeisureEntertainmentDirty(false); setPlatformMode("platform"); setActive("leisureEntertainment"); closeOpenEditors(); setAcceptanceResetSignal((value) => value + 1); }} onReset={resetAcceptance}/>} 
      {componentCenterMode && <ComponentCenter/>}
    </div>
  );
}
