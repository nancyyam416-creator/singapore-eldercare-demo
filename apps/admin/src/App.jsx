import { useEffect, useMemo, useRef, useState } from "react";
import activityTaichiCover from "./activity-taichi.svg";
import activitySafetyCover from "./activity-safety.svg";
import activityMusicCover from "./activity-music.svg";
import activityHealthCover from "./activity-health.svg";
import communityLifeMock from "./communityLifeMock.json";
import serviceCategoryMock from "./serviceCategoryMock.json";
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
import { CommunityStaffDrawer, CommunityStaffPage, initialCommunityStaff } from "./CommunityStaff";
import { ServiceCommunicationPage } from "./ServiceCommunication";
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
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

const communityMenuGroups = [
  { label: "工作台", items: [{ key: "overview", label: "运营概览", icon: LayoutDashboard }] },
  {
    label: "老人服务",
    items: [
      { key: "elderly", label: "老人档案", icon: Users },
      { key: "relations", label: "亲属档案", icon: HeartHandshake },
      { key: "reminders", label: "提醒事项", icon: Bell },
      { key: "emergencyHelp", label: "紧急求助", icon: AlertTriangle },
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
      { key: "devices", label: "设备管理", icon: MonitorSmartphone, children: [
        { key: "tabletDevices", label: "平板设备" },
        { key: "sensorDevices", label: "房间活动传感器" },
      ] },
      { key: "activity", label: "房间活动", icon: Activity },
    ],
  },
];

const platformMenuGroups = [
  { label: "平台工作台", items: [{ key: "platformOverview", label: "平台总览", icon: LayoutDashboard }] },
  {
    label: "组织与权限",
    items: [
      { key: "projects", label: "项目与社区", icon: Building2 },
      { key: "accounts", label: "账号与角色", icon: CircleUserRound },
    ],
  },
  {
    label: "公共能力",
    items: [
      { key: "weatherLocations", label: "天气位置", icon: CloudSun },
      { key: "careScripts", label: "关怀话术", icon: MessageSquareText },
    ],
  },
  {
    label: "平台管理",
    items: [
      { key: "logs", label: "操作日志", icon: FileClock },
      { key: "settings", label: "基础配置", icon: Settings },
    ],
  },
];

const allMenuGroups = [...communityMenuGroups, ...platformMenuGroups];
const availableMenuKeys = new Set(allMenuGroups.flatMap((group) => group.items.flatMap((item) => [item.key, ...(item.children || []).map((child) => child.key)])));
const communityContentTypeByMenu = {
  communityAnnouncements: "社区公告",
  lifeInformation: "生活资讯",
  alertItems: "警惕事项",
};

const pageMeta = {
  platformOverview: { title: "平台总览", description: "查看全部项目与社区的运行状态和数据范围", add: "" },
  elderly: { title: "老人档案", description: "维护老人基础资料、所属项目与服务关系", add: "新增老人" },
  relations: { title: "亲属档案", description: "查看所有手机号注册用户及其关联的老人", add: "新增联系人" },
  reminders: { title: "提醒事项", description: "维护用药提醒和日常提醒定义，并查看后台详细计划", add: "新建提醒" },
  emergencyHelp: { title: "紧急求助", description: "跟进老人发起的紧急求助、通知送达与事件处理结果", add: "" },
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

const communityContentTypes = ["社区公告", "生活资讯", "警惕事项"];
const communityContentMockNow = "2026-08-27 10:00";
const legacySafetyNews = [
  { id: "SAF-001", projectId: "PRJ-001", type: "警惕事项", title: "警惕冒充银行客服诈骗", description: "银行工作人员不会通过电话索取密码或验证码。", content: "近期出现冒充银行客服，以账户异常为由索取验证码的诈骗行为。请勿向陌生人提供银行卡信息、密码或短信验证码。", cover: "", source: "红山社区服务站", audience: "当前社区全部老人", publishAt: "2026-08-20 08:00", validUntil: "2026-09-20 23:59", displayOrder: 1, status: "已发布", updatedAt: "2026-08-20 08:00" },
  { id: "SAF-002", projectId: "PRJ-001", type: "生活资讯", title: "雨季居家防滑注意事项", description: "及时清理积水，重点检查卫生间和玄关。", content: "雨季地面容易湿滑，请及时擦干玄关、厨房和卫生间积水，穿着防滑鞋，并保持夜间照明充足。", cover: "", source: "红山社区健康组", audience: "当前社区全部老人", publishAt: "2026-08-21 09:00", validUntil: "2026-09-30 23:59", displayOrder: 2, status: "已发布", updatedAt: "2026-08-21 09:00" },
  { id: "SAF-005", projectId: "PRJ-001", type: "社区公告", title: "周三公共区域清洁安排", description: "上午十点前完成走廊清洁，请注意避让作业区域。", content: "本周三上午将进行公共走廊和活动室清洁，作业期间部分区域临时封闭，请按照现场指引通行。", cover: "", source: "红山社区运营组", audience: "当前社区全部老人", publishAt: "2026-08-24 08:00", validUntil: "2026-08-27 18:00", displayOrder: 1, status: "已发布", updatedAt: "2026-08-23 16:30" },
  { id: "SAF-007", projectId: "PRJ-001", type: "警惕事项", title: "雨天外出注意台阶积水", description: "雨天出行提示，外出时请放慢脚步。", content: "近期午后阵雨较多，社区入口台阶可能短时积水，建议外出时穿防滑鞋并使用扶手。", cover: "", source: "红山社区服务站", audience: "当前社区全部老人", publishAt: "2026-08-10 08:00", validUntil: "2026-08-20 23:59", displayOrder: 4, status: "已发布", updatedAt: "2026-08-10 08:00" },
  { id: "SAF-008", projectId: "PRJ-001", type: "生活资讯", title: "午后补水小提示", description: "已停止继续展示的生活资讯示例。", content: "天气炎热时请少量多次饮水，如有身体不适请及时联系家人或社区人员。", cover: "", source: "红山社区健康组", audience: "当前社区全部老人", publishAt: "2026-08-12 09:00", validUntil: "2026-09-12 23:59", displayOrder: 5, status: "已停用", updatedAt: "2026-08-22 15:10" },
  { id: "SAF-003", projectId: "PRJ-002", type: "社区公告", title: "社区维修工程通知", description: "公共区域照明维护，请按现场指引绕行。", content: "大巴窑关怀中心公共区域将进行照明维护，施工期间请老人注意绕行，并听从现场工作人员指引。", cover: "", source: "大巴窑社区运营组", audience: "当前社区全部老人", publishAt: "2026-08-22 08:00", validUntil: "2026-08-28 18:00", displayOrder: 1, status: "已发布", updatedAt: "2026-08-22 08:00" },
  { id: "SAF-004", projectId: "PRJ-002", type: "警惕事项", title: "陌生人上门服务核验指南", description: "无法核验身份时，不开门、不转账。", content: "如有陌生人自称维修、送货或社区工作人员上门，请先通过官方电话核验身份。", cover: "", source: "大巴窑社区服务站", audience: "当前社区全部老人", publishAt: "2026-08-18 08:00", validUntil: "2026-09-18 23:59", displayOrder: 2, status: "已发布", updatedAt: "2026-08-18 08:00" },
];

function getCommunityContentStatus(record) {
  if (record.status === "已停用") return "已停用";
  if (record.status === "未发布" || record.publishAt > communityContentMockNow) return "未发布";
  return "已发布";
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
  { id: "FINV-001", projectId: "PRJ-001", elderlyId: "SG-E-000128", deviceId: "TAB-SG-20260031", deviceSn: "SN-TAB-260031", code: "736521", generatedAt: "2026-07-28 10:10", expiresAt: "2026-07-28 10:40", status: "有效", boundCount: 0, bindingDetails: [] },
  { id: "FINV-002", projectId: "PRJ-001", elderlyId: "SG-E-000128", deviceId: "TAB-SG-20260031", deviceSn: "SN-TAB-260031", code: "284913", generatedAt: "2026-07-26 18:06", expiresAt: "2026-07-26 18:36", status: "已被新邀请替换", boundCount: 1, bindingDetails: [
    { id: "FBND-003", maskedAccount: "+65 9*** 1842", name: "陈丽华", relation: "女儿", boundAt: "2026-07-26 18:12", result: "绑定成功" },
  ] },
  { id: "FINV-003", projectId: "PRJ-001", elderlyId: "SG-E-000128", deviceId: "TAB-SG-20260031", deviceSn: "SN-TAB-260031", code: "592804", generatedAt: "2026-07-20 09:22", expiresAt: "2026-07-20 09:52", status: "老人端已结束", boundCount: 2, bindingDetails: [
    { id: "FBND-001", maskedAccount: "+65 9*** 2036", name: "陈伟强", relation: "儿子", boundAt: "2026-07-20 09:28", result: "绑定成功" },
    { id: "FBND-002", maskedAccount: "c***@mail.sg", name: "陈美芳", relation: "侄女", boundAt: "2026-07-20 09:31", result: "绑定成功" },
  ] },
  { id: "FINV-004", projectId: "PRJ-001", elderlyId: "SG-E-000127", deviceId: "TAB-SG-20260029", deviceSn: "SN-TAB-260029", code: "168305", generatedAt: "2026-07-27 14:05", expiresAt: "2026-07-27 14:35", status: "已过期", boundCount: 0, bindingDetails: [] },
  { id: "FINV-005", projectId: "PRJ-001", elderlyId: "SG-E-000126", deviceId: "TAB-SG-20260030", deviceSn: "SN-TAB-260030", code: "940217", generatedAt: "2026-07-25 11:30", expiresAt: "2026-07-25 12:00", status: "后台已作废", boundCount: 0, bindingDetails: [] },
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
  { id: "REC-010", projectId: "PRJ-001", name: "经典华语金曲", type: "third_party_entertainment", sourceId: "", sourceName: "经典华语金曲", sourceUpdatedAt: "", thirdPartyUrl: "https://www.youtube.com/watch?v=u2g-classic-songs", startsAt: "2026-08-20T08:00", endsAt: "2026-08-31T23:59", enabled: true, displayOrder: 3, durationSeconds: 25, afterView: "continue", createdAt: "2026-08-20T16:20" },
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

const overviewAttentionMock = [
  { id: "clue-001", priority: "紧急", elderly: "陈美玲", description: "紧急求助仍在进行中，部分联系人通知失败", source: "紧急求助", generatedAt: "2026-07-28 09:42", status: "进行中", page: "emergencyHelp", drawer: { kind: "emergencyHelp", eventId: "SOS-20260728001" } },
  { id: "clue-002", priority: "高", elderly: "陈美玲", description: "紧急联系人陈丽华通知失败，已重试 2 次", source: "紧急求助", generatedAt: "2026-07-28 09:44", status: "待重试", page: "emergencyHelp", drawer: { kind: "emergencyHelp", eventId: "SOS-20260728001" } },
  { id: "clue-003", priority: "高", elderly: "王德昌", description: "玄关传感器安装后尚未通过在线校验", source: "房间活动传感器", generatedAt: "2026-07-28 09:18", status: "设备异常", page: "sensorDevices" },
  { id: "clue-004", priority: "高", elderly: "陈美玲", description: "连续 3 小时未检测到有效房间活动", source: "房间活动", generatedAt: "2026-07-27 18:24", status: "待关注", page: "activity" },
  { id: "clue-005", priority: "中", elderly: "陈美玲", description: "早间降压药提醒已到时间但尚未确认", source: "提醒事项", generatedAt: "2026-07-27 08:30", status: "未确认", page: "reminders" },
  { id: "clue-006", priority: "低", elderly: "王德昌", description: "档案中的紧急联系人资料尚未补全", source: "老人档案", generatedAt: "2026-07-26 16:10", status: "待补充", page: "elderly" },
  { id: "clue-007", priority: "低", elderly: "陈美玲", description: "家庭影像批次未进入老人端同步队列", source: "家庭相册", generatedAt: "2026-07-22 10:08", status: "未入队", page: "familyAlbums", drawer: { kind: "familyAlbumBatch", batchId: "BATCH-20260722-01" } },
];

const overviewTrendMock = {
  reminder: { label: "提醒完成率", unit: "%", values: [82, 86, null, 75, 88, 91, 67] },
  device: { label: "设备在线率", unit: "%", values: [80, 80, 100, 100, 80, 80, 80] },
  safety: { label: "社区内容阅读率", unit: "%", values: [65, 71, 74, null, 78, 82, 84] },
  service: { label: "已完成预约服务", unit: "单", values: [2, 3, null, 4, 1, 5, 3] },
};

function PlatformOverview({ projects, elderlyRecords, tablets, sensors, onEnterCommunity }) {
  const rows = projects.map((project) => {
    const communityElderly = elderlyRecords.filter((record) => record.community === project.community);
    const elderlyIds = new Set(communityElderly.map((record) => record.id));
    const validDevices = [
      ...tablets.filter((device) => device.boundElderlyId && elderlyIds.has(device.boundElderlyId)),
      ...sensors.filter((device) => elderlyIds.has(device.elderlyId) && device.installStatus === "已安装" && device.onlineStatus !== "停用"),
    ];
    const onlineDevices = validDevices.filter((device) => device.status === "在线" || device.onlineStatus === "在线").length;
    const attentionCount = communityElderly.filter((record) => record.attention !== "正常").length;
    return {
      ...project,
      elderlyCount: communityElderly.filter((record) => record.status === "服务中").length,
      attentionCount,
      onlineRate: validDevices.length ? `${Math.round((onlineDevices / validDevices.length) * 100)}%` : "—",
    };
  });
  const activeRows = rows.filter((row) => row.status === "启用");
  return (
    <>
      <div className="page-heading platform-overview-heading">
        <div><h1>平台总览</h1><p>集中查看全部项目与社区的运行状态；具体运营工作需进入对应社区</p></div>
        <span className="scope-badge"><Building2 size={15}/>跨社区数据范围</span>
      </div>
      <div className="platform-metric-grid">
        <div className="platform-metric-card"><span>项目数量</span><b>{projects.length}<small> 个</small></b><p>平台已建立项目</p></div>
        <div className="platform-metric-card"><span>启用社区</span><b>{activeRows.length}<small> 个</small></b><p>当前可进入运营</p></div>
        <div className="platform-metric-card"><span>在服务老人</span><b>{rows.reduce((sum, row) => sum + row.elderlyCount, 0)}<small> 位</small></b><p>全部授权项目汇总</p></div>
        <div className="platform-metric-card"><span>待关注线索</span><b>{rows.reduce((sum, row) => sum + row.attentionCount, 0)}<small> 条</small></b><p>按社区线索汇总</p></div>
      </div>
      <section className="panel platform-community-panel">
        <div className="panel-title"><div><h3>项目与社区运行概况</h3><p>平台端只查看跨社区汇总；点击“进入社区”切换到该社区运营端</p></div></div>
        <div className="table-scroll">
          <table className="platform-community-table">
            <thead><tr><th>项目 / 社区</th><th>区域</th><th>在服务老人</th><th>设备在线率</th><th>待关注</th><th>负责人</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id}>
              <td><div className="stacked-cell"><b>{row.name}</b><small>{row.community}</small></div></td>
              <td>{row.district}</td><td>{row.elderlyCount} 位</td><td>{row.onlineRate}</td><td><StatusTag>{row.attentionCount ? `${row.attentionCount} 条待关注` : "正常"}</StatusTag></td>
              <td><div className="stacked-cell"><b>{row.contact}</b><small>{row.phone}</small></div></td><td><StatusTag>{row.status}</StatusTag></td>
              <td><button className="table-action" disabled={row.status !== "启用"} onClick={() => onEnterCommunity(row.id)}>进入社区</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Overview({ onNavigate, inactivityRule, onEditInactivityRule, scenario, resetSignal, scope, records, tablets, sensors, reminders }) {
  const [trendKey, setTrendKey] = useState("reminder");
  const [updatedAt, setUpdatedAt] = useState("2026-07-31 15:40:00");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState("");
  useEffect(() => {
    setTrendKey("reminder");
    setUpdatedAt("2026-07-31 15:40:00");
    setRefreshing(false);
    setRefreshNotice("");
  }, [resetSignal, scenario]);
  const trend = overviewTrendMock[trendKey];
  const sourceFailed = scenario === "partial" || scenario === "allFailed";
  const scopedNames = new Set(records.map((record) => record.name));
  const scopedAttentionItems = overviewAttentionMock.filter((item) => scopedNames.has(item.elderly));
  const availableAttentionItems = scenario === "partial" ? scopedAttentionItems.filter((item) => item.source !== "提醒事项") : scopedAttentionItems;
  const attentionItems = scenario === "noAttention" ? [] : availableAttentionItems.slice(0, 6);
  const maxTrendValue = trend.unit === "%" ? 100 : Math.max(...trend.values.filter((value) => value !== null), 1);

  const validDevices = [...tablets.filter((device) => device.boundElderlyId), ...sensors.filter((device) => device.installStatus === "已安装" && device.onlineStatus !== "停用")];
  const onlineDevices = validDevices.filter((device) => device.status === "在线" || device.onlineStatus === "在线").length;
  const dueOccurrences = reminders.flatMap((reminder) => reminder.occurrences || []).filter((item) => item.status !== "未到时间");
  const completedOccurrences = dueOccurrences.filter((item) => item.status === "已完成").length;
  const metrics = [
    { label: "在服务老人", value: String(records.filter((record) => record.status === "服务中").length), unit: "位", hint: "有效在服务老人；停用或移除不计", icon: Users, page: "elderly", filter: `${scope.name} · 服务状态：服务中` },
    { label: "当前待关注", value: String(scopedAttentionItems.length), unit: "条", hint: "按未结束线索统计，不按老人去重", icon: ClipboardList, page: "emergencyHelp", filter: `${scope.name} · 当前未结束线索` },
    { label: "设备在线率", value: validDevices.length ? ((onlineDevices / validDevices.length) * 100).toFixed(1) : "—", unit: validDevices.length ? "%" : "", hint: validDevices.length ? `${onlineDevices} 台在线 ÷ ${validDevices.length} 台应在线有效设备` : "当前社区暂无应在线有效设备", icon: MonitorSmartphone, page: "tabletDevices", filter: `${scope.name} · 已激活绑定及安装校验设备` },
    { label: "今日提醒完成率", value: dueOccurrences.length ? ((completedOccurrences / dueOccurrences.length) * 100).toFixed(1) : "—", unit: dueOccurrences.length ? "%" : "", hint: dueOccurrences.length ? `${completedOccurrences} 条已完成 ÷ ${dueOccurrences.length} 条已到执行时间` : "今日暂无已到执行时间提醒", icon: Bell, page: "reminders", filter: `${scope.name} · 今日已到执行时间` },
  ].map((metric, index) => {
    if (scenario === "allFailed") return { ...metric, value: "—", unit: "", hint: "数据源获取失败，未按 0 展示" };
    if (scenario === "partial" && index === 1) return { ...metric, value: `≥${availableAttentionItems.length}`, unit: "条", hint: `已获取 ${availableAttentionItems.length} 条；提醒来源失败未计入` };
    if (scenario === "partial" && index === 3) return { ...metric, value: "—", unit: "", hint: "提醒来源获取失败，其他指标仍可查看" };
    if (scenario === "noAttention" && index === 1) return { ...metric, value: "0", hint: "当前没有尚未结束的关注线索" };
    return metric;
  });

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
          <p>{scope.project} · {scope.name}</p>
          <div className="overview-time-meta">
            <span>项目当地日期：2026年7月31日 · 星期五</span>
            <span>IANA 时区：Asia/Singapore (UTC+8)</span>
            <span>最近更新：{scenario === "stale" ? "2026-07-30 09:10:00" : updatedAt}</span>
          </div>
        </div>
        <div className="overview-heading-actions">
          <button className="secondary-button" onClick={handleRefresh} disabled={refreshing}><RefreshCw className={refreshing ? "spinning" : ""} size={15}/>{refreshing ? "刷新中" : "刷新数据"}</button>
        </div>
      </div>

      {scenario === "partial" && <div className="overview-state-banner warning"><AlertTriangle size={17}/><div><b>部分来源失败</b><span>提醒事项来源暂不可用，失败数据以“—”展示；其他正常模块继续显示。</span></div></div>}
      {scenario === "allFailed" && <div className="overview-state-banner danger"><AlertTriangle size={17}/><div><b>全部来源失败</b><span>当前无法获取运营数据，页面未将失败结果显示为 0，请稍后刷新重试。</span></div></div>}
      {scenario === "stale" && <div className="overview-state-banner warning"><FileClock size={17}/><div><b>数据过旧</b><span>数据最后更新于 2026-07-30 09:10:00，请刷新后再用于运营判断。</span></div></div>}
      {refreshNotice && <div className="overview-refresh-notice">{refreshNotice}</div>}

      <div className="metric-grid">
        {metrics.map(({ label, value, unit, hint, icon: Icon, page, filter }) => (
          <button className="metric-card" key={label} onClick={() => onNavigate({ page, filter })}>
            <div className="metric-icon"><Icon size={20} /></div>
            <div><span>{label}</span><strong>{value}{unit && <em>{unit}</em>}</strong><small>{hint}</small></div>
            <ChevronRight className="metric-link-icon" size={17}/>
          </button>
        ))}
      </div>

      <section className="panel overview-inactivity-panel">
        <div className="panel-title"><div><h3>无活动轻提醒</h3><p>仅在有效传感器全部在线时判断；设备离线单独归为设备异常</p></div><div className="overview-inactivity-actions"><button className="secondary-button" onClick={onEditInactivityRule}><Settings size={15}/>设置规则</button><button className="text-button" onClick={() => onNavigate({ page: "activity", filter: `${scope.project} / ${scope.name} · 无活动待关注` })}>查看记录 <ChevronRight size={15}/></button></div></div>
        {scenario === "allFailed"
          ? <div className="overview-module-failed"><AlertTriangle size={20}/><div><b>无活动数据获取失败</b><span>无法确认待关注人数，未按 0 展示。</span></div></div>
          : <div className="overview-inactivity-body"><div className="overview-inactivity-count"><span>待关注人数</span><b>{scenario === "noAttention" ? 0 : scopedAttentionItems.filter((item) => item.source === "房间活动").length}</b><small>位老人</small></div><div className="overview-inactivity-rule"><span>当前社区规则</span><b>{inactivityRule.enabled ? `连续 ${inactivityRule.thresholdHours} 小时无活动` : "规则已停用"}</b><small>{inactivityRule.enabled ? `${inactivityRule.startTime}–${inactivityRule.endTime} · 仅后台轻提醒` : "停用期间不生成新的无活动提醒"}</small></div><div className="overview-inactivity-latest"><span>最近线索</span>{scenario === "noAttention" || !scopedAttentionItems.some((item) => item.source === "房间活动") ? <><b>当前暂无待关注线索</b><small>设备异常不会被记作老人无活动</small></> : <><b>{scopedAttentionItems.find((item) => item.source === "房间活动")?.elderly} · 连续 3 小时无活动</b><small>最后活动：客厅 · 2026-07-27 15:20</small></>}</div><StatusTag>{inactivityRule.enabled ? "规则已启用" : "规则已停用"}</StatusTag></div>}
      </section>

      <div className="overview-grid">
        <section className="panel attention-panel">
          <div className="panel-title"><div><h3>当前需关注</h3><p>最多展示 6 条尚未结束线索；同级按产生时间由新到旧</p></div><span className="attention-count">{scenario === "allFailed" ? "—" : scenario === "partial" ? `已获取 ${availableAttentionItems.length} 条` : `${scenario === "noAttention" ? 0 : scopedAttentionItems.length} 条`}</span></div>
          {scenario === "allFailed"
            ? <div className="overview-module-failed"><AlertTriangle size={20}/><div><b>关注线索获取失败</b><span>请刷新后重试。</span></div></div>
            : attentionItems.length
              ? <div className="attention-list">{attentionItems.map((item) => <button className="attention-row" key={item.id} onClick={() => onNavigate({ page: item.page, filter: `${scope.project} / ${scope.name} · ${item.status}`, drawer: item.drawer })}><span className={`priority ${item.priority === "紧急" ? "urgent" : item.priority === "高" ? "high" : item.priority === "中" ? "medium" : "low"}`}>{item.priority}</span><span className="attention-copy"><b>{item.elderly} · {item.description}</b><small><span>{item.source}</span><span>{item.generatedAt}</span><span>{item.status}</span></small></span><span className="attention-detail">详情</span><ChevronRight size={16}/></button>)}</div>
              : <div className="overview-module-empty"><ShieldCheck size={24}/><b>暂无待关注</b><span>当前没有尚未结束的关注线索。</span></div>}
        </section>

        <section className="panel quick-panel">
          <div className="panel-title"><div><h3>快捷入口</h3><p>当前账号拥有以下操作权限</p></div></div>
          <div className="quick-grid">
            {[
              ["新增老人", Users, { page: "elderly", drawer: { kind: "elderly", mode: "create" } }],
              ["新建提醒", Bell, { page: "reminders", drawer: { kind: "reminder" } }],
              ["新增社区公告", BookOpen, { page: "communityAnnouncements", drawer: { kind: "safety", mode: "edit", contentType: "社区公告" } }],
              ["录入房间活动传感器", MonitorSmartphone, { page: "sensorDevices", drawer: { kind: "sensorCreate" } }],
              ["查看预约服务", ClipboardList, { page: "services", filter: `${scope.project} / ${scope.name}` }],
              ["发布社区活动", CalendarDays, { page: "activities", drawer: { kind: "activity" } }],
            ].map(([label, Icon, target]) => <button key={label} onClick={() => onNavigate(target)}><Icon size={19}/><span>{label}</span></button>)}
          </div>
        </section>
      </div>

      <section className="panel trend-panel">
        <div className="panel-title"><div><h3>近 7 日运营概况</h3><p>按项目当地自然日统计，一次仅展示一种同单位指标</p></div><span className="trend-current-unit">当前单位：{trend.unit}</span></div>
        <div className="trend-tabs" role="tablist" aria-label="趋势指标切换">
          {Object.entries(overviewTrendMock).map(([key, item]) => <button className={trendKey === key ? "active" : ""} key={key} onClick={() => setTrendKey(key)} role="tab" aria-selected={trendKey === key}>{item.label}</button>)}
        </div>
        {scenario === "allFailed" || (scenario === "partial" && trendKey === "reminder")
          ? <div className="overview-module-failed trend-failed"><AlertTriangle size={20}/><div><b>{scenario === "allFailed" ? "趋势数据获取失败" : "提醒趋势来源失败"}</b><span>失败数据以“—”展示，不生成伪造走势。</span></div></div>
          : <div className="mini-chart" aria-label={`${trend.label}近7日趋势图`}>{trend.values.map((value, index) => <div key={index} className={value === null ? "no-data" : ""}><b>{value === null ? "—" : `${value}${trend.unit}`}</b>{value === null ? <span className="empty-bar"/> : <span style={{height: `${Math.max(8, (value / maxTrendValue) * 100)}%`}}/>}<small>{["7月25日","7月26日","7月27日","7月28日","7月29日","7月30日","7月31日"][index]}</small></div>)}</div>}
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

function ElderlyPage({ records, tabletDevices, activationRecords, onOpen }) {
  const initialFilters = { query: "", status: "全部状态", attention: "全部关注状态" };
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
    const statusMatched = filters.status === "全部状态" || record.status === filters.status;
    const attentionMatched = filters.attention === "全部关注状态" || record.attention === filters.attention;
    return keywordMatched && statusMatched && attentionMatched;
  }), [records, filters]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  };

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
            <div className="input-wrap"><Search size={16}/><input value={draftFilters.query} onChange={(event) => setDraftFilters({ ...draftFilters, query: event.target.value })} placeholder="姓名、档案编号、手机号或地址" /></div>
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
            <thead><tr><th>老人信息</th><th>联系方式</th><th>平板状态</th><th>感知设备</th><th>顾问</th><th>资料完整度</th><th>服务状态</th><th>关注状态</th><th className="sticky-right">操作</th></tr></thead>
            <tbody>
              {filteredRecords.map((record) => {
                const completeness = getProfileCompleteness(record);
                const tablet = tabletDevices.find((device) => device.boundElderlyId === record.id);
                const pendingActivation = activationRecords.find((item) => item.elderlyId === record.id && item.status === "待使用");
                return (
                  <tr key={record.id}>
                    <td><button className="elderly-name-cell" onClick={() => onOpen("view", record)}><span className="person-avatar">{record.name.slice(-1)}</span><span><b>{record.name}</b><small>{record.gender} · {record.age} 岁 · {formatDisplayId(record.id)}</small></span></button></td>
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
              {!filteredRecords.length && <tr><td colSpan="9"><div className="empty-state"><Search size={24}/><b>未找到匹配的老人档案</b><span>请调整筛选条件后重新查询</span></div></td></tr>}
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
  const [bindingDetailInvite, setBindingDetailInvite] = useState(null);
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
          {invitations.map((item) => <tr key={item.id}><td><div className="stacked-cell"><b>{formatDisplayId(item.deviceId)}</b><small>{item.deviceSn}</small></div></td><td><b className="family-code">{item.code}</b></td><td>{item.generatedAt}</td><td>{item.expiresAt}</td><td><StatusTag>{item.status}</StatusTag></td><td><div className="invitation-binding-cell"><b>{item.boundCount} 人</b><button className="table-action" onClick={() => setBindingDetailInvite(item)}>{item.boundCount > 0 ? "查看绑定明细" : "查看空记录"}</button></div></td><td>{item.status === "有效" ? <button className="table-action danger-text" onClick={() => setPendingAction({ type: "invite", record: item })}>强制作废</button> : <span className="muted-action">—</span>}</td></tr>)}
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
      {bindingDetailInvite && <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭绑定明细" onClick={() => setBindingDetailInvite(null)}/><aside className="drawer family-binding-detail-drawer" role="dialog" aria-modal="true" aria-label="家庭邀请绑定明细"><header><div><h2>家庭邀请绑定明细</h2><p>只读查看本次邀请产生的绑定结果</p></div><button className="icon-button" aria-label="关闭" onClick={() => setBindingDetailInvite(null)}><X size={19}/></button></header><div className="drawer-body"><section className="family-binding-summary"><div><span>6 位绑定码</span><b className="family-code">{bindingDetailInvite.code}</b></div><div><span>生成时间</span><b>{bindingDetailInvite.generatedAt}</b></div><div><span>邀请状态</span><StatusTag>{bindingDetailInvite.status}</StatusTag></div><div><span>本次绑定人数</span><b>{bindingDetailInvite.boundCount} 人</b></div></section><section className="form-section family-binding-detail-section"><div className="form-section-heading"><div><h3>绑定结果</h3><p>历史绑定关系不因邀请作废而失效</p></div><span className="result-count">共 {bindingDetailInvite.bindingDetails?.length || 0} 条</span></div>{bindingDetailInvite.bindingDetails?.length ? <div className="family-binding-detail-list">{bindingDetailInvite.bindingDetails.map((detail) => <article key={detail.id}><div className="relative-name-cell"><span>{detail.name.slice(-1)}</span><div><b>{detail.name}</b><small>{detail.maskedAccount}</small></div></div><div><span>家庭关系</span><b>{detail.relation}</b></div><div><span>绑定时间</span><b>{detail.boundAt}</b></div><StatusTag>{detail.result}</StatusTag></article>)}</div> : <div className="family-binding-empty"><Users size={30}/><b>本次邀请没有绑定账号</b><p>邀请已保留为历史记录，没有产生新的家庭关系。</p></div>}</section><div className="form-tip neutral"><ShieldCheck size={18}/><div><b>只读监管</b><p>后台仅查看绑定结果，不提供代绑定、审核或生成家庭邀请码能力。</p></div></div></div><footer><button className="secondary-button" onClick={() => setBindingDetailInvite(null)}>关闭</button></footer></aside></div>}
    </div>
  );
}

function ElderlyDetailPage({ record, project, tablet, activation, sensors, reminders, familyInvitations, familyRelations, inactivityRule, weatherLocation, weatherQuery, weatherAudits, onBack, onEdit, onManageSpaces, onAddSensor, onViewSensor, onManageTablet, onInvalidateInvite, onUnlinkRelation }) {
  const [tab, setTab] = useState("profile");
  const completeness = getProfileCompleteness(record);
  const emergencyContacts = getEmergencyContacts(record);
  tablet = tablet ? { ...tablet, id: formatDisplayId(tablet.id) } : tablet;
  const boundSensors = sensors.filter((sensor) => sensor.elderlyId === record.id && sensor.installStatus !== "已解绑");
  const latestReminderOccurrence = (reminder) => reminder.occurrences?.[reminder.occurrences.length - 1];
  return <>
    <div className="detail-page-heading"><div><button className="back-link" onClick={onBack}><ChevronLeft size={16}/>返回老人档案</button><div className="profile-summary detail-profile-summary"><span className="profile-avatar">{record.name.slice(-1)}</span><div><div className="profile-name"><h1>{record.name}</h1><StatusTag>{record.status}</StatusTag></div><p>{record.gender} · {record.age} 岁 · {formatDisplayId(record.id)} · {record.project}</p><div className="profile-tags">{record.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></div></div><button className="primary-button" onClick={onEdit}>编辑档案</button></div>
    <div className="elderly-detail-tabs"><button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>档案信息</button><button className={tab === "family" ? "active" : ""} onClick={() => setTab("family")}>家庭关系 <span>{familyRelations.filter((item) => item.status === "正常").length}</span></button><button className={tab === "weather" ? "active" : ""} onClick={() => setTab("weather")}>天气位置</button><button className={tab === "reminders" ? "active" : ""} onClick={() => setTab("reminders")}>提醒事项 <span>{reminders.length}</span></button><button className={tab === "spaces" ? "active" : ""} onClick={() => setTab("spaces")}>房间活动传感器 <span>{boundSensors.length}</span></button><button className={tab === "tablet" ? "active" : ""} onClick={() => setTab("tablet")}>平板设备</button></div>
    {tab === "profile" && <div className="elderly-detail-grid elderly-detail-content">
      <section className="panel detail-page-panel">
        <div className="panel-title"><div><h3>基础资料</h3><p>老人身份、联系方式及当前服务归属</p></div><span className="result-count">更新于 {record.updatedAt || "—"}</span></div>
        <div className="elderly-detail-section-body"><div className="info-grid elderly-profile-info-grid">
          <div><span>出生日期</span><b>{record.birthday || "待补充"}</b></div><div><span>联系电话</span><b>{record.phone || "待补充"}</b></div>
          <div><span>所属项目</span><b>{record.project || "待补充"}</b></div><div><span>所属社区</span><b>{record.community || "待补充"}</b></div>
          <div><span>服务状态</span><StatusTag>{record.status}</StatusTag></div><div><span>关注状态</span><StatusTag>{record.attention}</StatusTag></div>
          <div className="full"><span>居住地址</span><b>{record.address || "待补充"}</b></div>
          <div className="full"><span>运营标签</span><div className="profile-tags">{record.tags?.length ? record.tags.map((tag) => <span key={tag}>{tag}</span>) : <b>暂无标签</b>}</div></div>
        </div></div>
      </section>
      <div className="elderly-detail-side">
        <section className="panel detail-page-panel elderly-completeness-panel"><div className="panel-title"><div><h3>资料完整度</h3><p>按基础资料必填项计算</p></div><strong className={completeness < 100 ? "incomplete" : ""}>{completeness}%</strong></div><div className="elderly-detail-section-body"><div className="profile-progress"><span style={{ width: `${completeness}%` }}/></div>{completeness < 100 && <p className="detail-warning">仍有必填资料待补充。</p>}</div></section>
        <section className="panel detail-page-panel elderly-contact-panel"><div className="panel-title"><div><h3>紧急联系人</h3><p>联系人之间不区分优先级</p></div><span className="result-count">{emergencyContacts.length} 位</span></div><div className="elderly-detail-section-body emergency-contact-view-list">{emergencyContacts.map((contact) => <div className="relation-card" key={contact.id}><div><HeartHandshake size={18}/><span><b>{contact.name || "待补充"}</b><small>{contact.relation || "关系待补充"} · {contact.phone || "电话待补充"}</small></span></div></div>)}</div></section>
      </div>
    </div>}
    {tab === "family" && <FamilyRelationshipPanel invitations={familyInvitations} relations={familyRelations} onInvalidateInvite={onInvalidateInvite} onUnlinkRelation={onUnlinkRelation}/>}
    {tab === "weather" && <div className="elderly-weather-tab elderly-detail-content">
      <section className="panel detail-page-panel"><div className="panel-title"><div><h3>居住地址解析结果</h3><p>天气位置由老人档案的居住地址解析，不在此处单独维护</p></div><StatusTag>{weatherLocation?.status || "待完善"}</StatusTag></div><div className="elderly-detail-section-body"><WeatherLocationSummary location={weatherLocation} query={weatherQuery}/><div className="info-grid weather-detail-info-grid"><div><span>国家 / 地区</span><b>{weatherLocation?.countryName || "待解析"}</b></div><div><span>行政区</span><b>{weatherLocation?.regionName || "待解析"}</b></div><div><span>城市</span><b>{weatherLocation?.cityName || "待解析"}</b></div><div><span>IANA 时区</span><b>{weatherLocation?.timezone || project?.timezone || "待解析"}</b></div><div><span>纬度</span><b>{Number.isFinite(weatherLocation?.latitude) ? weatherLocation.latitude : "待解析"}</b></div><div><span>经度</span><b>{Number.isFinite(weatherLocation?.longitude) ? weatherLocation.longitude : "待解析"}</b></div><div className="full"><span>解析地址</span><b>{weatherLocation?.sourceDetail || record.address || "待补充"}</b></div></div></div></section>
      <section className="panel detail-page-panel"><div className="panel-title"><div><h3>技术状态与变更记录</h3><p>仅用于位置解析、同步和天气查询诊断</p></div><span className="result-count">{weatherAudits.length} 条变更</span></div><div className="elderly-detail-section-body"><div className="info-grid weather-technical-grid"><div><span>同步状态</span><StatusTag>{weatherLocation?.syncStatus || "待同步"}</StatusTag></div><div><span>天气查询状态</span><StatusTag>{weatherQuery?.status || "尚未查询"}</StatusTag></div><div><span>最后更新时间</span><b>{weatherLocation?.updatedAt || "—"}</b></div><div><span>最后查询时间</span><b>{weatherQuery?.fetchedAt || "—"}</b></div></div>{weatherAudits.length ? <div className="weather-audit-list elderly-weather-audit-list">{weatherAudits.map((audit) => <div key={audit.id}><div><b>{audit.action}</b><small>{audit.operatedAt} · {audit.operator}</small></div><StatusTag>{audit.result}</StatusTag><p>{audit.before} → {audit.after}</p></div>)}</div> : <div className="empty-table-state compact">暂无位置变更记录</div>}</div></section>
    </div>}
    {tab === "reminders" && <section className="panel detail-page-panel elderly-reminder-panel elderly-detail-content"><div className="panel-title"><div><h3>提醒事项</h3><p>仅展示当前老人已创建的用药提醒和日常提醒定义</p></div><span className="result-count">共 {reminders.length} 条</span></div><div className="table-scroll"><table className="elderly-reminder-table"><thead><tr><th>提醒名称</th><th>类型</th><th>计划时间</th><th>重复方式</th><th>最近实例状态</th><th>最后更新</th></tr></thead><tbody>{reminders.map((reminder) => { const occurrence = latestReminderOccurrence(reminder); return <tr key={reminder.id}><td><div className="reminder-name-cell"><span><Bell size={16}/></span><div><b>{reminder.title}</b><small>{reminder.note || "暂无补充说明"}</small></div></div></td><td><StatusTag>{reminder.type}</StatusTag></td><td><div className="stacked-cell"><b>{reminder.date}</b><small>{reminder.time} · 老人当地时间</small></div></td><td>{reminder.repeat}</td><td>{occurrence ? <div className="stacked-cell"><StatusTag>{occurrence.status}</StatusTag><small>{occurrence.date} {occurrence.time}</small></div> : "—"}</td><td><div className="stacked-cell"><b>{reminder.updatedBy || reminder.createdBy}</b><small>{reminder.updatedAt || reminder.createdAt}</small></div></td></tr>; })}{!reminders.length && <tr><td colSpan="6"><div className="empty-table-state">当前老人暂无提醒事项</div></td></tr>}</tbody></table></div></section>}
    {tab === "spaces" && <><section className="panel sensor-relation-panel elderly-detail-content"><div className="panel-title"><div><h3>房间与活动传感器</h3><p>先定义房间，再将活动传感器绑定至对应房间</p></div><div className="panel-title-actions"><button className="secondary-button" onClick={onManageSpaces}>管理房间</button><button className="primary-button" onClick={onAddSensor}><Plus size={15}/>添加传感器</button></div></div><div className="table-scroll"><table className="elderly-sensor-table"><thead><tr><th>设备名称</th><th>安装房间</th><th>设备型号 / SN</th><th>在线状态</th><th>最近上报</th><th>操作</th></tr></thead><tbody>{boundSensors.map((sensor) => <tr key={sensor.id}><td><b>{sensor.name}</b></td><td>{sensor.room}</td><td><div className="stacked-cell"><b>{sensor.model}</b><small>{sensor.sn}</small></div></td><td><StatusTag>{sensor.onlineStatus}</StatusTag></td><td>{sensor.lastReport}</td><td><button className="table-action" onClick={() => onViewSensor(sensor)}>详情</button></td></tr>)}{!boundSensors.length && <tr><td colSpan="6"><div className="empty-table-state">当前老人尚未绑定房间活动传感器</div></td></tr>}</tbody></table></div></section><DailyRoomActivityPanel record={record} sensors={boundSensors}/><InactivityReminderPanel rule={inactivityRule}/></>}
    {tab === "tablet" && <section className="panel tablet-detail-page elderly-detail-content"><div className="panel-title"><div><h3>平板设备</h3><p>查看当前老人绑定的平板、版本和激活状态</p></div><button className="primary-button" onClick={onManageTablet}>{tablet ? "管理绑定" : activation ? "查看激活信息" : "绑定平板"}</button></div><div className="elderly-detail-section-body">{tablet ? <><div className="tablet-profile-card"><span><MonitorSmartphone size={22}/></span><div><b>{tablet.model}</b><small>{tablet.id} · {tablet.sn}</small></div><StatusTag>{tablet.status}</StatusTag></div><div className="info-grid tablet-profile-info-grid"><div><span>当前版本</span><b>{tablet.currentVersion}</b></div><div><span>版本状态</span><StatusTag>{tablet.versionStatus}</StatusTag></div><div><span>激活方式</span><b>{tablet.activationMethod || "—"}</b></div><div><span>绑定时间</span><b>{tablet.boundAt || "—"}</b></div><div><span>最近在线</span><b>{tablet.lastOnline || "—"}</b></div><div><span>操作人员</span><b>{tablet.operator || "—"}</b></div></div></> : <div className="space-empty-state"><MonitorSmartphone size={28}/><h4>{activation ? `当前激活状态：${activation.status}` : "尚未绑定平板"}</h4><p>{activation ? `目标设备 ${formatDisplayId(activation.deviceId)} · ${activation.deviceSn}` : "请先指定老人和待激活设备，再生成激活码。"}</p></div>}</div></section>}
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
  const scopedProject = projects.find((project) => project.name === record?.project) || projects[0];
  const [form, setForm] = useState({
    name: record?.name || "",
    gender: record?.gender || "女",
    birthday: record?.birthday || "",
    phone: record?.phone || "",
    project: record?.project || scopedProject?.name || "",
    community: record?.community || scopedProject?.community || "",
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

function TabletBindingModal({ record, project, devices, activation, failureSignal, onGenerate, onActivate, onFail, onClose, onUnbind }) {
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
  useEffect(() => {
    if (!failureSignal?.id || stage !== "waiting") return;
    failActivation(failureSignal.type === "offline"
      ? "当前网络未连接，本次激活已标记为失败，可检查网络后重新生成。"
      : "激活码不正确，本次激活已标记为失败，可重新生成激活码。");
  }, [failureSignal?.id]);

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
              : stage === "waiting" ? <><button className="secondary-button" onClick={() => { setSelectedId(activation?.deviceId || ""); setStage("generate"); }}>重新生成激活码</button><button className="primary-button" disabled={activation?.status !== "待使用"} onClick={() => { setValidationError(""); setStage("identity"); }}>设备校验通过</button></>
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

function RecommendationStrategyPage({ strategies, communityName, acceptanceScenario = "normal", onCreate, onEdit, onToggle, onMove }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("全部类型");
  const [status, setStatus] = useState("全部状态");
  const [calendarMonth, setCalendarMonth] = useState({ year: 2026, month: 7 });
  const [selectedDate, setSelectedDate] = useState(recommendationMockNow.slice(0, 10));
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false);
  const [activeView, setActiveView] = useState("calendar");
  const sortedStrategies = sortRecommendations(strategies);
  const calendarDays = buildRecommendationCalendar(calendarMonth.year, calendarMonth.month);
  const todayKey = recommendationMockNow.slice(0, 10);
  const selectedIsToday = selectedDate === todayKey;
  const selectedScheduledItems = getRecommendationDayItems(sortedStrategies, selectedDate);
  const selectedDayItems = acceptanceScenario === "empty"
    ? []
    : selectedIsToday
      ? selectedScheduledItems.filter((item) => getRecommendationAvailability(item) === "可展示")
      : selectedScheduledItems;
  const selectedDateLabel = `${Number(selectedDate.slice(5, 7))}月${Number(selectedDate.slice(8, 10))}日`;
  const sevenDayCoverage = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2026, 7, 21 + index);
    const key = formatRecommendationDate(date.getFullYear(), date.getMonth(), date.getDate());
    return getRecommendationDayItems(sortedStrategies, key).length;
  });
  const displayedSevenDayCoverage = acceptanceScenario === "empty" ? sevenDayCoverage.map(() => 0) : sevenDayCoverage;
  const todayAvailableCount = acceptanceScenario === "empty" ? 0 : getRecommendationDayItems(sortedStrategies, todayKey).filter((item) => getRecommendationAvailability(item) === "可展示").length;
  const moveCalendarMonth = (offset) => {
    const next = new Date(calendarMonth.year, calendarMonth.month + offset, 1);
    const nextMonth = { year: next.getFullYear(), month: next.getMonth() };
    setCalendarMonth(nextMonth);
    setSelectedDate(formatRecommendationDate(nextMonth.year, nextMonth.month, 1));
    setDateFilterEnabled(false);
  };
  const manageDate = (date) => {
    setSelectedDate(date);
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
      <div className="page-heading"><div><h1>推荐策略</h1><p>{communityName} · 配置当前社区老人端右侧推荐内容的展示顺序、有效时间与轮换参数</p></div>{activeView === "content" && <button className="primary-button" onClick={() => onCreate()}><Plus size={16}/>新增推荐内容</button>}</div>
      <section className="panel recommendation-calendar-panel">
        <div className="recommendation-preview-heading"><div><span><CalendarDays size={18}/></span><div><h3>排期覆盖概览</h3><p>点击日历日期查看当天推荐，并可在右侧直接新增内容</p></div></div></div>
        <div className="recommendation-calendar-summary"><div><span>当前可展示</span><b>{todayAvailableCount} 条</b></div><div><span>未来 7 天有排期</span><b>{displayedSevenDayCoverage.filter(Boolean).length} 天</b></div><div className={displayedSevenDayCoverage.some((count) => !count) ? "warning" : "success"}><span>未来 7 天无排期</span><b>{displayedSevenDayCoverage.filter((count) => !count).length} 天</b></div><p>今天按启用状态和生效时间计算实际顺序；未来日期只校验排期覆盖。</p></div>
        <div className="recommendation-view-tabs" role="tablist" aria-label="推荐策略视图"><button type="button" role="tab" aria-selected={activeView === "calendar"} className={activeView === "calendar" ? "active" : ""} onClick={() => setActiveView("calendar")}><CalendarDays size={15}/>排期日历</button><button type="button" role="tab" aria-selected={activeView === "content"} className={activeView === "content" ? "active" : ""} onClick={() => { setActiveView("content"); setDateFilterEnabled(false); }}><SlidersHorizontal size={15}/>内容管理 <span>{strategies.length}</span></button></div>
        {activeView === "calendar" && <div className="recommendation-calendar-layout">
          <div className="recommendation-calendar-box">
            <div className="recommendation-calendar-toolbar"><button type="button" aria-label="上个月" onClick={() => moveCalendarMonth(-1)}><ChevronLeft size={16}/></button><b>{calendarMonth.year} 年 {calendarMonth.month + 1} 月</b><button type="button" aria-label="下个月" onClick={() => moveCalendarMonth(1)}><ChevronRight size={16}/></button></div>
            <div className="recommendation-calendar-weekdays">{["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((item) => <span key={item}>{item}</span>)}</div>
            <div className="recommendation-calendar-grid">{calendarDays.map((date, index) => {
              if (!date) return <span className="calendar-blank" key={`blank-${index}`}/>;
              const count = acceptanceScenario === "empty" ? 0 : getRecommendationDayItems(sortedStrategies, date).length;
              const coverage = count === 0 ? "gap" : count === 1 ? "low" : "covered";
              return <button type="button" key={date} aria-label={`查看 ${date} 推荐内容`} title="点击查看当天推荐内容" className={`${coverage} ${date === selectedDate ? "selected" : ""} ${date === todayKey ? "today" : ""}`} onClick={() => manageDate(date)}><span>{Number(date.slice(8, 10))}</span><small>{count ? `${count} 条` : "无排期"}</small></button>;
            })}</div>
            <div className="recommendation-calendar-legend"><span><i className="covered"/>2 条及以上</span><span><i className="low"/>仅 1 条</span><span><i className="gap"/>无排期</span></div>
          </div>
          <div className="recommendation-day-preview">
            <div className="recommendation-day-preview-heading"><div><span>{selectedDateLabel}</span><h4>{selectedIsToday ? "当前生效顺序预览" : "当天排期顺序"}</h4></div><StatusTag>{selectedDayItems.length ? `${selectedIsToday ? "可展示" : "排期"} ${selectedDayItems.length} 条` : selectedIsToday ? "今日暂无内容" : "当天暂无内容"}</StatusTag></div>
            {selectedDayItems.length ? <div className="recommendation-day-list">{selectedDayItems.map((item, index) => <div key={item.id}><em>{index + 1}</em><span><b>{item.name}</b><small>{recommendationTypes.find((option) => option.key === item.type)?.label} · 展示 {item.durationSeconds} 秒</small></span><button type="button" className="table-action" onClick={() => onEdit(item)}>编辑</button></div>)}</div> : <div className="recommendation-preview-empty"><Sparkles size={22}/><div><b>{selectedIsToday ? "今日暂无内容" : "当天暂无内容"}</b><span>当前没有符合启用状态和生效时间的推荐内容。</span></div></div>}
            <button type="button" className="primary-button recommendation-date-filter-button" onClick={() => onCreate(selectedDate)}><Plus size={15}/>新增 {selectedDateLabel} 内容</button>
          </div>
        </div>}
      </section>
      {activeView === "content" && <section className="panel recommendation-pool-panel">
        <div className="recommendation-list-toolbar">
          <div className="recommendation-list-filters"><div className="input-wrap"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索内容名称、编号或来源"/></div><select className="select-control filter-select" value={type} onChange={(event) => setType(event.target.value)}><option>全部类型</option>{recommendationTypes.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select><select className="select-control filter-select" value={status} onChange={(event) => setStatus(event.target.value)}><option>全部状态</option><option>可展示</option><option>未生效</option><option>已过期</option><option>已停用</option><option>来源不可用</option></select>{dateFilterEnabled && <button type="button" className="recommendation-date-chip" onClick={() => setDateFilterEnabled(false)}>{selectedDateLabel}排期 <X size={13}/></button>}</div>
        </div>
        <div className="table-scroll">
          <table className="recommendation-table right-content-table"><thead><tr><th>推荐文案</th><th>内容来源 / 第三方链接</th><th>内容类型</th><th>生效时间 / 失效时间</th><th>顺序</th><th>展示时长</th><th>查看后</th><th>当前状态</th><th className="sticky-right">操作</th></tr></thead><tbody>
            {rows.map((item) => { const availability = getRecommendationAvailability(item); const isThirdParty = item.type === "third_party_entertainment"; return <tr key={item.id}><td><div className="strategy-title-cell"><b>{item.name}</b><small>{item.id} · 创建 {item.createdAt.replace("T", " ")}</small></div></td><td><div className="stacked-cell recommendation-source-cell"><b>{item.sourceName || "未关联内容"}</b><small>{isThirdParty ? item.thirdPartyUrl || "来源链接不可用" : `${item.sourceId || "—"} · 更新 ${item.sourceUpdatedAt || "—"}`}</small></div></td><td><b>{recommendationTypes.find((option) => option.key === item.type)?.label}</b></td><td><div className="stacked-cell"><b>{item.startsAt.replace("T", " ")}</b><small>至 {item.endsAt.replace("T", " ")}</small></div></td><td><div className="recommendation-order-control"><button aria-label="上移" onClick={() => onMove(item.id, -1)}><ChevronLeft size={14}/></button><b>{item.displayOrder}</b><button aria-label="下移" onClick={() => onMove(item.id, 1)}><ChevronRight size={14}/></button></div></td><td><b>{item.durationSeconds} 秒 / 次</b></td><td>{item.afterView === "exit" ? "退出推荐" : "继续轮换"}</td><td><div className="stacked-cell"><StatusTag>{availability}</StatusTag><button type="button" role="switch" aria-checked={item.enabled} aria-label={`${item.name}启用状态`} className={`strategy-status-switch ${item.enabled ? "active" : ""}`} onClick={() => onToggle(item.id)}><i/><span>{item.enabled ? "启用" : "停用"}</span></button></div></td><td className="sticky-right"><button className="table-action" onClick={() => onEdit(item)}>编辑</button></td></tr>; })}
            {!rows.length && <tr><td colSpan="9"><div className="empty-table-state">暂无符合条件的推荐内容</div></td></tr>}
          </tbody></table>
        </div>
        <div className="pagination"><span>共 {strategies.length} 条推荐内容，筛选后展示 {rows.length} 条{dateFilterEnabled ? ` · 当前仅看 ${selectedDateLabel}` : ""}</span><span>内容类型不决定排序</span></div>
      </section>}
    </>
  );
}

function RecommendationStrategyDrawer({ record, presetDate, safetyNews, activities, currentProject, onClose, onSave }) {
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
  };
  const [form, setForm] = useState(() => ({ projectId: currentProject?.id, name: "", type: "announcement", sourceId: "", sourceName: "", sourceUpdatedAt: "", thirdPartyUrl: "", startsAt: presetDate ? `${presetDate}T08:00` : "2026-08-21T08:00", endsAt: presetDate ? `${presetDate}T23:59` : "2026-08-31T23:59", enabled: true, displayOrder: 1, durationSeconds: 20, afterView: "continue", createdAt: recommendationMockNow, ...record }));
  const [errors, setErrors] = useState({});
  const [resourcePickerOpen, setResourcePickerOpen] = useState(false);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const isThirdParty = form.type === "third_party_entertainment";
  const currentGroup = resourceGroups[form.type];
  const selectedResource = currentGroup?.items.find((item) => item.id === form.sourceId) || (currentGroup && form.sourceId ? { id: form.sourceId, name: form.sourceName, date: form.sourceUpdatedAt, category: recommendationTypes.find((item) => item.key === form.type)?.label, summary: "当前推荐已关联的来源内容", status: "已发布" } : null);
  const changeType = (type) => setForm((current) => ({ ...current, type, sourceId: "", sourceName: "", sourceUpdatedAt: "", thirdPartyUrl: "" }));
  const selectResource = (resource) => {
    setForm((current) => ({ ...current, sourceId: resource.id, sourceName: resource.name, sourceUpdatedAt: resource.date, thirdPartyUrl: resource.url || "", name: resource.url ? resource.name : current.name || resource.name }));
    setErrors((current) => ({ ...current, sourceId: "" }));
    setResourcePickerOpen(false);
  };
  const save = () => {
    const nextErrors = {};
    if (!isThirdParty && !form.sourceId) nextErrors.sourceId = "请选择需要推荐的来源内容";
    if (!form.name.trim()) nextErrors.name = "请输入内容名称";
    if (isThirdParty && !form.thirdPartyUrl.trim()) nextErrors.thirdPartyUrl = "请输入第三方链接";
    else if (isThirdParty && !isValidHttpUrl(form.thirdPartyUrl)) nextErrors.thirdPartyUrl = "请输入合法的 http/https 第三方链接";
    if (!["continue", "exit"].includes(form.afterView)) nextErrors.afterView = "请选择老人查看后的处理方式";
    if (!form.startsAt || !form.endsAt) nextErrors.validity = "请选择生效和失效时间";
    if (form.startsAt && form.endsAt && form.startsAt >= form.endsAt) nextErrors.validity = "失效时间必须晚于生效时间";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const { sourceUnavailable: _sourceUnavailable, audience: _audience, ...cleanForm } = form;
    onSave({ ...cleanForm, name: form.name.trim(), sourceId: isThirdParty ? "" : selectedResource.id, sourceName: isThirdParty ? form.name.trim() : selectedResource.name, sourceUpdatedAt: isThirdParty ? "" : selectedResource.date, thirdPartyUrl: isThirdParty ? form.thirdPartyUrl.trim() : "", displayOrder: Number(form.displayOrder), durationSeconds: Number(form.durationSeconds) });
  };
  return (
    <div className="drawer-layer">
      <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
      <aside className="drawer recommendation-drawer" role="dialog" aria-modal="true" aria-label={record ? "编辑推荐内容" : "新增推荐内容"}>
        <header><div><h2>{record ? "编辑推荐内容" : "新增推荐内容"}</h2><p>配置老人端右侧内容的展示顺序与轮换参数</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
        <div className="drawer-body"><div className="form-section">
          <h3>内容信息</h3>
          <label><span>内容类型 *</span><select className="select-control form-select-native" value={form.type} onChange={(event) => changeType(event.target.value)}>{recommendationTypes.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></label>
          {!isThirdParty && <div className="recommendation-resource-field"><span>关联内容 *</span><button type="button" className={`strategy-resource-picker-trigger ${selectedResource ? "selected" : ""}`} onClick={() => setResourcePickerOpen(true)}>{selectedResource ? <><span><b>{selectedResource.name}</b><small>{selectedResource.id} · 更新 ${selectedResource.date}</small></span><em>更换</em></> : <><span><b>请选择{currentGroup.label}</b><small>推荐必须关联一条当前社区已发布的来源内容</small></span><em>选择</em></>}</button>{errors.sourceId && <small className="field-error">{errors.sourceId}</small>}</div>}
          <label><span>内容名称 *</span><input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder={isThirdParty ? "例如：经典华语金曲" : "例如：明早一起练太极"}/>{errors.name && <small className="field-error">{errors.name}</small>}</label>
          {isThirdParty && <label><span>第三方链接 *</span><input type="url" value={form.thirdPartyUrl} onChange={(event) => update("thirdPartyUrl", event.target.value)} placeholder="例如：https://www.youtube.com/watch?v=..."/>{errors.thirdPartyUrl && <small className="field-error">{errors.thirdPartyUrl}</small>}<small className="section-helper">保存后同时作为老人端休闲娱乐聚合页的有效内容来源。</small></label>}
          <div className="form-row"><label><span>生效时间 *</span><input type="datetime-local" value={form.startsAt} onChange={(event) => update("startsAt", event.target.value)}/></label><label><span>失效时间 *</span><input type="datetime-local" value={form.endsAt} onChange={(event) => update("endsAt", event.target.value)}/></label></div>{errors.validity && <small className="field-error">{errors.validity}</small>}
          <h3>排序与轮换</h3>
          <div className="form-row"><label><span>展示顺序 *</span><input type="number" min="1" value={form.displayOrder} onChange={(event) => update("displayOrder", event.target.value)}/></label><label><span>单次展示时长（秒）*</span><input type="number" min="5" max="120" value={form.durationSeconds} onChange={(event) => update("durationSeconds", event.target.value)}/></label></div>
          <label><span>老人查看后 *</span><div className="strategy-enable-options"><button type="button" className={form.afterView === "continue" ? "active" : ""} onClick={() => update("afterView", "continue")}><b>继续轮换</b><small>下一轮仍可按规则再次展示</small></button><button type="button" className={form.afterView === "exit" ? "active" : ""} onClick={() => update("afterView", "exit")}><b>退出推荐</b><small>本轮退出，不删除原内容记录</small></button></div>{errors.afterView && <small className="field-error">{errors.afterView}</small>}<small className="section-helper">仅成功进入内容详情或第三方链接页后执行；打开失败不触发。</small></label>
          <label><span>启用状态 *</span><div className="strategy-enable-options"><button type="button" className={form.enabled ? "active" : ""} onClick={() => update("enabled", true)}><b>启用</b><small>符合有效期与轮换条件时可展示</small></button><button type="button" className={!form.enabled ? "active" : ""} onClick={() => update("enabled", false)}><b>停用</b><small>保留配置但不进入有效顺序</small></button></div></label>
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
    <header><div><h3>选择{group.label}</h3><p>按最近更新时间展示，可结合摘要、分类和日期辨别内容</p></div><button className="icon-button" onClick={onClose}><X size={18}/></button></header>
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
    onSave({ id: `TAB-SG-${nextNumber}`, sn: form.sn.trim(), model: form.model.trim(), currentVersion: "v2.6.0", versionStatus: "已最新", activationCode: "", activationMethod: "", operator: "", status: "待激活", boundElderlyId: null, boundAt: "", lastOnline: "尚未激活" });
  };
  if (device) return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer device-detail-drawer" role="dialog" aria-modal="true"><header><div><h2>平板设备详情</h2><p>{formatDisplayId(device.id)} · {device.model}</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="device-hero"><span><MonitorSmartphone size={24}/></span><div><h3>{device.model}</h3><p>{formatDisplayId(device.id)} · {device.sn}</p></div><StatusTag>{device.status}</StatusTag></div><section className="detail-section"><h3>设备状态</h3><div className="info-grid"><div><span>设备编号</span><b>{formatDisplayId(device.id)}</b></div><div><span>设备 SN</span><b>{device.sn}</b></div><div><span>当前版本</span><b>{device.currentVersion}</b></div><div><span>版本状态</span><StatusTag>{device.versionStatus}</StatusTag></div><div><span>激活状态</span><b>{device.boundElderlyId ? "已激活" : "待激活"}</b></div><div><span>最近在线</span><b>{device.lastOnline}</b></div><div><span>绑定时间</span><b>{device.boundAt || "尚未绑定"}</b></div><div><span>激活方式</span><b>{device.activationMethod || "尚未激活"}</b></div></div></section><div className="form-tip"><ShieldCheck size={18}/><div><b>平板绑定规则</b><p>平板与老人的激活和解绑需从老人档案或已绑定设备的“管理绑定”入口完成。</p></div></div></div><footer><button className="secondary-button" onClick={onClose}>关闭</button></footer></aside></div>;
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer device-detail-drawer" role="dialog" aria-modal="true"><header><div><h2>录入平板设备</h2><p>先登记设备资产，激活时再绑定老人</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="form-section"><h3>设备信息</h3><label><span>设备 SN *</span><input value={form.sn} onChange={(event) => setForm((current) => ({ ...current, sn: event.target.value }))} placeholder="例如：SN-TAB-260034"/>{errors.sn && <small className="field-error">{errors.sn}</small>}</label><label><span>设备型号 *</span><input value={form.model} onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}/>{errors.model && <small className="field-error">{errors.model}</small>}</label></div><div className="form-tip"><ShieldCheck size={18}/><div><b>录入后状态</b><p>新设备保存后进入“待激活”，不会自动绑定任何老人。</p></div></div></div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={save}>保存设备</button></footer></aside></div>;
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
      <div className="service-module-tabs">
        <button className={activeTab === "bookings" ? "active" : ""} onClick={() => setActiveTab("bookings")}>预约记录<span>{bookings.length}</span></button>
        <button className={activeTab === "categories" ? "active" : ""} onClick={() => setActiveTab("categories")}>服务分类<span>{categories.length}</span></button>
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
    <header><div><h2>{record ? "编辑服务分类" : "新增服务分类"}</h2><p>{communityName} · 分类仅在当前社区生效</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
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

function CommunityActivityPage({ records, registrations, communityName, onCreate, onView, onEdit, onUnpublish, onViewRegistrations }) {
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
      <div className="table-toolbar"><div><span className="result-count">共 {rows.length} 场活动</span></div><button className="icon-button" title="刷新"><RefreshCw size={16}/></button></div>
      <div className="table-scroll"><table className="community-activity-table"><thead><tr><th>活动名称</th><th>时间 / 地点</th><th>报名阶段</th><th>参加意向</th><th>直播</th><th>活动状态</th><th className="sticky-right">操作</th></tr></thead><tbody>
        {rows.map((record) => { const registrationCount = registrations.filter((item) => item.activityId === record.id && item.status === "想参加").length; const live = getActivityLivePresentation(record); return <tr key={record.id}><td><button className="activity-title-cell" onClick={() => onView(record)}><img src={record.cover || activityHealthCover} alt=""/><span><b>{record.title}</b><small>{record.category} · {record.description || "暂无活动说明"}</small></span></button></td><td><div className="stacked-cell"><b>{record.startAt.replace("T", " ")}</b><small>{record.location}</small></div></td><td><div className="stacked-cell"><StatusTag>{record.registrationPhase}</StatusTag><small>截止 {record.registrationEndAt.replace("T", " ")}</small></div></td><td><button className="registration-count-button" onClick={() => onViewRegistrations(record)}>{registrationCount} 人想参加</button></td><td><div className="stacked-cell activity-live-cell"><StatusTag>{live.label}</StatusTag><small>{live.detail}</small></div></td><td><StatusTag>{record.status}</StatusTag></td><td className="sticky-right"><button className="table-action" onClick={() => onView(record)}>详情</button><button className="table-action" onClick={() => onViewRegistrations(record)}>参加意向</button><button className="table-action" onClick={() => onEdit(record)}>编辑</button>{!record.isOffline && <button className="table-action danger-text" onClick={() => setUnpublishTarget(record)}>下架</button>}</td></tr>; })}
        {!rows.length && <tr><td colSpan="7"><div className="empty-table-state">当前社区暂无符合条件的活动</div></td></tr>}
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
      return { ...rest, contentHtml: record.contentHtml || legacyContentToHtml(record.description, contentImages) };
    }
    return { projectId: currentProject?.id, title: "", category: "", description: "", contentHtml: "<p><br></p>", cover: "", startAt: "", endAt: "", location: "", capacity: 30, registrationStartAt: "", registrationEndAt: "", isOffline: false, contact: "", liveEnabled: false, liveStatus: "not_started", scheduledLiveStartAt: "", zoomMeetingId: "", zoomMeetingPassword: "", zoomJoinUrl: "", liveMockState: "normal" };
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
    <header><div><h2>{readOnly ? "活动详情" : record ? "编辑活动" : "新增活动"}</h2><p>{currentProject?.community} · 活动与内容数据相互独立</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
    <div className="drawer-body"><div className="form-section"><h3>活动内容</h3><div className="activity-cover-field"><span>活动封面</span><div className="activity-cover-upload">{form.cover ? <img src={form.cover} alt="活动封面预览"/> : <span><CalendarDays size={22}/></span>}<div><b>{form.cover ? "已选择活动封面" : "上传活动封面"}</b><small>用于活动列表入口，与详情正文分开维护</small></div><label className="secondary-button">{form.cover ? "更换图片" : "选择图片"}<input type="file" accept="image/*" onChange={(event) => uploadCover(event.target.files?.[0])}/></label></div></div><label><span>活动名称 *</span><input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="请输入活动名称"/>{errors.title && <small className="field-error">{errors.title}</small>}</label><label><span>活动分类 *</span><select className="select-control form-select-native" value={form.category} onChange={(event) => update("category", event.target.value)}><option value="">请选择活动分类</option><option>健康活动</option><option>安全讲座</option><option>兴趣活动</option><option>社区交流</option></select>{errors.category && <small className="field-error">{errors.category}</small>}</label><RichTextEditor label="活动详情内容 *" value={form.contentHtml} readOnly={readOnly} error={errors.contentHtml} onChange={(html) => update("contentHtml", html)}/></div>
      <div className="form-section community-activity-time-section"><h3>时间、地点与报名</h3><div className="form-row"><label><span>开始时间 *</span><input type="datetime-local" value={form.startAt} onChange={(event) => update("startAt", event.target.value)}/></label><label><span>结束时间 *</span><input type="datetime-local" value={form.endAt} onChange={(event) => update("endAt", event.target.value)}/></label></div>{errors.time && <small className="field-error">{errors.time}</small>}<label><span>活动地点 *</span><input value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="请输入活动地点"/>{errors.location && <small className="field-error">{errors.location}</small>}</label><div className="form-row"><label><span>报名开始 *</span><input type="datetime-local" value={form.registrationStartAt} onChange={(event) => update("registrationStartAt", event.target.value)}/></label><label><span>报名截止 *</span><input type="datetime-local" value={form.registrationEndAt} onChange={(event) => update("registrationEndAt", event.target.value)}/></label></div>{errors.registration && <small className="field-error">{errors.registration}</small>}<label><span>名额</span><input type="number" min="1" value={form.capacity} onChange={(event) => update("capacity", Number(event.target.value))}/></label><label><span>联系电话 *</span><input type="tel" value={form.contact} onChange={(event) => update("contact", event.target.value)} placeholder="例如：+65 6273 2288"/>{errors.contact && <small className="field-error">{errors.contact}</small>}</label><small className="field-help">活动状态由报名时间和活动时间自动计算，无需手动选择。</small></div>
      <div className="form-section community-activity-live-section"><div className="form-section-heading"><div><h3>Zoom 直播</h3><p>仅维护活动的 Zoom 会议信息，不在后台控制开始或结束</p></div>{!readOnly && <label className="activity-live-toggle"><input type="checkbox" checked={form.liveEnabled} onChange={(event) => update("liveEnabled", event.target.checked)}/><span>{form.liveEnabled ? "提供直播" : "不提供"}</span></label>}</div>
        {readOnly && <div className="activity-live-summary"><div><span>Zoom 直播状态</span><StatusTag>{livePresentation.label}</StatusTag></div><small>{livePresentation.detail}；状态由 Zoom 同步，社区后台不控制开始或结束。</small></div>}
        {(form.liveEnabled || (readOnly && retainedLiveConfig)) && <div className="activity-live-fields"><label><span>预计开播时间 *</span><input type="datetime-local" value={form.scheduledLiveStartAt} disabled={readOnly || !form.liveEnabled} onChange={(event) => update("scheduledLiveStartAt", event.target.value)}/>{errors.scheduledLiveStartAt && <small className="field-error">{errors.scheduledLiveStartAt}</small>}</label><div className="form-row"><label><span>Zoom 会议 ID *</span><input inputMode="numeric" value={form.zoomMeetingId} disabled={readOnly || !form.liveEnabled} onChange={(event) => update("zoomMeetingId", event.target.value)} placeholder="例如：856 2011 4028"/>{errors.zoomMeetingId && <small className="field-error">{errors.zoomMeetingId}</small>}</label><label><span>Zoom 会议密码</span><input value={form.zoomMeetingPassword} disabled={readOnly || !form.liveEnabled} onChange={(event) => update("zoomMeetingPassword", event.target.value)} placeholder="如会议设置密码则填写"/></label></div><label><span>Zoom 加入链接</span><input value={form.zoomJoinUrl} disabled={readOnly || !form.liveEnabled} onChange={(event) => update("zoomJoinUrl", event.target.value)} placeholder="可选，例如：https://zoom.us/j/85620114028"/><small className="field-help">老人端优先拉起 Zoom App；拉起失败时使用该链接进入 Zoom H5。</small>{errors.zoomJoinUrl && <small className="field-error">{errors.zoomJoinUrl}</small>}</label></div>}
        {!form.liveEnabled && !retainedLiveConfig && <div className="activity-live-empty">当前活动不提供直播，老人端仅展示线下活动信息。</div>}
      </div>
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
    <header><div><h3>老人参加意向</h3><p>{activity.title} · {activity.startAt.replace("T", " ")} · {activity.location}</p></div><button className="icon-button" onClick={onClose}><X size={18}/></button></header>
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
        <div className="table-toolbar"><div><span className="result-count">共 {rows.length} 条内容</span><span className="toolbar-note">仅展示当前社区数据</span></div><button className="icon-button" title="刷新"><RefreshCw size={16}/></button></div>
        <div className="table-scroll">
          <table className="safety-news-table">
            <thead><tr><th>内容标题</th><th>适用对象</th><th>发布时间</th><th>展示顺序</th><th>状态</th><th className="sticky-right">操作</th></tr></thead>
            <tbody>
              {rows.map((record) => { const status = getCommunityContentStatus(record); return <tr key={record.id}><td><button className="safety-title-cell" onClick={() => onView(record)}><b>{record.title}</b><small>{record.description || "未填写摘要"}</small></button></td><td>{record.audience}</td><td>{status === "未发布" ? <span className="muted-text">—</span> : record.publishAt}</td><td>{record.displayOrder}</td><td><StatusTag>{status}</StatusTag></td><td className="sticky-right"><button className="table-action" onClick={() => onView(record)}>详情</button><button className="table-action" onClick={() => onEdit(record)}>编辑</button><button className={`table-action ${status === "已发布" ? "danger-text" : ""}`} onClick={() => status === "已发布" ? setConfirmTarget(record) : onStatusChange(record.id, "已发布")}>{status === "已发布" ? "停用" : "发布"}</button></td></tr>; })}
              {!rows.length && <tr><td colSpan="6"><div className="empty-table-state">当前社区暂无符合条件的内容</div></td></tr>}
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
      delete rest.validUntil;
      return { ...rest, contentHtml: record.contentHtml || legacyContentToHtml(record.content, contentImages) };
    }
    return {
      projectId: currentProject?.id,
      title: "",
      type: contentType,
      content: "",
      contentHtml: "<p><br></p>",
      description: "",
      cover: "",
      source: currentProject?.community || "",
      audience: "当前社区全部老人",
      publishAt: "2026-08-24 10:00",
      displayOrder: 1,
      status: "未发布",
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
      source: `${form.source || ""}`.trim() || currentProject?.community || "",
      displayOrder: Number(form.displayOrder),
      publishAt: form.publishAt || "2026-08-24 10:00",
    });
  };

  return (
    <div className="drawer-layer" role="presentation">
      <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
      <aside className={`drawer safety-news-drawer ${readOnly ? "drawer-readonly" : ""}`} role="dialog" aria-modal="true" aria-label={readOnly ? `${form.type}详情` : record ? `编辑${form.type}` : `新增${form.type}`}>
        <header><div><h2>{readOnly ? `${form.type}详情` : record ? `编辑${form.type}` : `新增${form.type}`}</h2><p>{currentProject?.community} · 内容只在当前社区内维护</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
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
            <div className="form-row"><label><span>展示顺序 *</span><input type="number" min="1" value={form.displayOrder} onChange={(event) => update("displayOrder", event.target.value)} placeholder="请输入大于等于 1 的整数"/>{errors.displayOrder && <small className="field-error">{errors.displayOrder}</small>}</label><label><span>发布来源</span><input value={form.source} onChange={(event) => update("source", event.target.value)} placeholder={currentProject?.community || "当前社区名称"}/></label></div>
            <label><span>适用对象</span><input value="当前社区全部老人" disabled/><small className="field-help">本轮适用对象固定为当前社区全部老人，不支持手工选择老人、标签或人群。</small></label>
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
    <header><div><h2>发起社区话题</h2><p>{currentProject?.community} · 由当前后台账号发起</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
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
    <header><div><h2>话题详情</h2><p>{topic.status === "open" ? "进行中，老人端可继续提交评论" : "已关闭，保留正文和历史评论"}</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
    <div className="drawer-body"><div className="topic-detail-heading"><div><StatusTag>{topic.initiatorType === "elderly" ? "老人发起" : "后台发起"}</StatusTag><StatusTag>{topic.status === "open" ? "进行中" : "已关闭"}</StatusTag></div><h3>{topic.title}</h3><p>{topic.initiatorName} · {topic.createdAt}</p></div>
      <section className="topic-detail-section"><h3>话题正文</h3><div className="rich-text-preview" dangerouslySetInnerHTML={{ __html: topic.bodyHtml }}/></section>
      {topic.referenceSnapshot && <section className="topic-detail-section"><div className="topic-section-heading"><h3>引用生活资讯</h3>{referenceExpired && <StatusTag>已失效</StatusTag>}</div><div className={`topic-reference-card ${referenceExpired ? "is-expired" : ""}`}><span className="topic-reference-cover"><BookOpen size={20}/></span><div><b>{topic.referenceSnapshot.title}</b><p>{topic.referenceSnapshot.summary}</p><span>{referenceExpired ? "原资讯已停用或失效，话题仍保留创建时快照" : "引用资讯当前有效"}</span></div></div></section>}
      <section className="topic-detail-section topic-comment-section"><div className="topic-section-heading"><div><h3>一级评论</h3><p>后台仅查看，不提供回复或多级评论</p></div><span>{comments.length} 条</span></div><div className="topic-comment-list">{comments.map((comment) => <article key={comment.id}><span className="person-avatar">{comment.authorName.slice(-1)}</span><div><header><b>{comment.authorName}</b><StatusTag>{comment.authorType === "elderly" ? "老人" : "社区"}</StatusTag><time>{comment.createdAt}</time></header><p>{comment.content}</p></div></article>)}{!comments.length && <div className="topic-empty-comments"><MessageSquareText size={26}/><b>暂无评论</b><span>话题已发布，尚未收到老人留言。</span></div>}</div></section>
    </div><footer><button className="secondary-button" onClick={onClose}>关闭</button>{topic.status === "open" && <button className="danger-button" onClick={() => setConfirmClose(true)}>关闭话题</button>}</footer>
  </aside></div>{confirmClose && <div className="modal-layer"><button className="modal-backdrop" aria-label="取消关闭话题" onClick={() => setConfirmClose(false)}/><section className="confirm-dialog" role="dialog" aria-modal="true" aria-label="关闭社区话题"><span className="confirm-icon warning"><AlertTriangle size={20}/></span><h3>关闭“{topic.title}”？</h3><p>关闭后保留话题正文和历史评论，但老人端不能再提交新评论。</p><div><button className="secondary-button" onClick={() => setConfirmClose(false)}>取消</button><button className="danger-button" onClick={() => { onCloseTopic(topic.id); setConfirmClose(false); }}>确认关闭</button></div></section></div>}</>;
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
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer family-album-batch-detail-drawer" role="dialog" aria-modal="true" aria-label="家庭影像批次详情"><header><div><h2>上传批次详情</h2><p>{batch.uploadedAt} · {batch.categoryNameSnapshot}</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body">
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
  const [platformMode, setPlatformMode] = useState("community");
  const [active, setActive] = useState("overview");
  const [overviewScenario, setOverviewScenario] = useState("normal");
  const [recommendationScenario, setRecommendationScenario] = useState("normal");
  const [acceptanceResetSignal, setAcceptanceResetSignal] = useState(0);
  const [activationFailureSignal, setActivationFailureSignal] = useState({ id: 0, type: "" });
  const [collapsed, setCollapsed] = useState(false);
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
      const savedStrategies = window.localStorage.getItem("u2g-right-recommendations-v19-created-at-order");
      if (!savedStrategies) return initialRecommendationStrategies;
      const mergedStrategies = JSON.parse(savedStrategies).map((item) => {
        const preset = initialRecommendationStrategies.find((record) => record.id === item.id);
        const merged = preset ? { ...preset, ...item, createdAt: item.createdAt || preset.createdAt, sourceId: item.sourceId || preset.sourceId, sourceName: item.sourceName || preset.sourceName, sourceUpdatedAt: item.sourceUpdatedAt || preset.sourceUpdatedAt } : { ...item, createdAt: item.createdAt || recommendationMockNow };
        if (merged.type !== "third_party_entertainment") return merged;
        const { sourceUnavailable: _sourceUnavailable, ...directEntertainment } = merged;
        return { ...directEntertainment, sourceId: "", sourceName: merged.name, sourceUpdatedAt: "" };
      });
      const savedIds = new Set(mergedStrategies.map((item) => item.id));
      return [...mergedStrategies, ...initialRecommendationStrategies.filter((item) => !savedIds.has(item.id))];
    } catch {
      return initialRecommendationStrategies;
    }
  });
  const [communityStaff, setCommunityStaff] = useState(initialCommunityStaff);
  const [safetyNews, setSafetyNews] = useState(() => {
    try {
      const savedNews = window.localStorage.getItem("u2g-community-content-v22-topics-split");
      return savedNews ? JSON.parse(savedNews) : initialSafetyNews;
    } catch {
      return initialSafetyNews;
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
      return savedActivities ? JSON.parse(savedActivities) : initialCommunityActivities;
    } catch {
      return initialCommunityActivities;
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
  const [overviewContext, setOverviewContext] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState("PRJ-001");
  const [pendingProjectId, setPendingProjectId] = useState("");
  const currentMenuGroups = platformMode === "platform" ? platformMenuGroups : communityMenuGroups;
  const currentMenuKeys = useMemo(() => new Set(currentMenuGroups.flatMap((group) => group.items.flatMap((item) => [item.key, ...(item.children || []).map((child) => child.key)]))), [currentMenuGroups]);
  const currentProject = projects.find((project) => project.id === currentProjectId) || projects.find((project) => project.status === "启用") || projects[0];
  const authorizedProjects = projects.filter((project) => project.status === "启用");
  const scopedElderlyRecords = useMemo(() => elderlyRecords.filter((record) => record.community === currentProject?.community), [elderlyRecords, currentProject?.community]);
  const scopedElderlyIds = useMemo(() => new Set(scopedElderlyRecords.map((record) => record.id)), [scopedElderlyRecords]);
  const scopedRelativeAccounts = useMemo(() => relativeAccounts.filter((account) => account.links.some((link) => scopedElderlyIds.has(link.elderlyId))), [scopedElderlyIds]);
  const scopedTabletDevices = useMemo(() => tabletDevices.filter((device) => scopedElderlyIds.has(device.boundElderlyId)), [tabletDevices, scopedElderlyIds]);
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
  const scopedRecommendationStrategies = useMemo(() => recommendationStrategies.filter((record) => (record.projectId || "PRJ-001") === currentProject?.id), [recommendationStrategies, currentProject?.id]);
  const activeLabel = useMemo(() => allMenuGroups.flatMap((group) => group.items.flatMap((item) => [item, ...(item.children || [])])).find((item) => item.key === active)?.label, [active]);
  const elderlyDetailRecord = scopedElderlyRecords.find((record) => record.id === elderlyDetailId);
  const relativeDetailRecord = scopedRelativeAccounts.find((account) => account.id === relativeDetailId);
  const communityActivityRecords = useMemo(() => scopedCommunityActivities.map((activity) => ({ ...activity, status: getCommunityActivityStatus(activity), registrationPhase: getCommunityActivityRegistrationPhase(activity), interestCount: scopedRegistrations.filter((registration) => registration.activityId === activity.id && registration.status === "想参加").length })), [scopedCommunityActivities, scopedRegistrations]);
  const hasOpenEditor = Boolean(drawer || deviceDrawer || tabletTarget || spaceTarget || globalRuleOpen);
  useEffect(() => {
    if (!currentMenuKeys.has(active)) setActive(platformMode === "platform" ? "platformOverview" : "overview");
  }, [active, currentMenuKeys, platformMode]);

  const closeOpenEditors = () => {
    setDrawer(null); setDeviceDrawer(null); setTabletTarget(null); setSpaceTarget(null); setGlobalRuleOpen(false);
    setElderlyDetailId(null); setRelativeDetailId(null); setOverviewContext("");
  };

  const switchPlatformMode = (nextMode) => {
    if (nextMode === platformMode) return;
    closeOpenEditors();
    setPlatformMode(nextMode);
    setActive(nextMode === "platform" ? "platformOverview" : "overview");
  };

  const applyCommunitySwitch = (projectId) => {
    setCurrentProjectId(projectId);
    closeOpenEditors();
    setActive("overview");
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
  const resetAcceptance = () => {
    setPlatformMode("community"); setCurrentProjectId("PRJ-001"); setOverviewScenario("normal"); setRecommendationScenario("normal"); setActive("overview"); setDrawer(null); setDeviceDrawer(null); setTabletTarget(null);
    setElderlyDetailId(null); setRelativeDetailId(null); setSpaceTarget(null); setGlobalRuleOpen(false); setOverviewContext("");
    setActivationFailureSignal({ id: 0, type: "" }); setAcceptanceResetSignal((value) => value + 1);
    window.scrollTo({ top: 0, behavior: "auto" });
  };
  const navigateFromAcceptance = (moduleId) => {
    if (!availableMenuKeys.has(moduleId)) return;
    setPlatformMode("community"); setActive(moduleId); setDrawer(null); setDeviceDrawer(null); setTabletTarget(null); setSpaceTarget(null); setGlobalRuleOpen(false); setOverviewContext("");
    if (moduleId !== "elderly") setElderlyDetailId(null);
    if (moduleId !== "relations") setRelativeDetailId(null);
    if (moduleId !== "overview") setOverviewScenario("normal");
    setAcceptanceResetSignal((value) => value + 1);
  };

  const navigateFromOverview = ({ page, filter = "", drawer: nextDrawer } = {}) => {
    if (!page) return;
    setActive(page);
    setOverviewContext(filter);
    if (page === "elderly") setElderlyDetailId(null);
    if (page === "relations") setRelativeDetailId(null);
    if (!nextDrawer) return;
    if (nextDrawer.kind === "sensorCreate") setDeviceDrawer(nextDrawer);
    else setDrawer(nextDrawer);
  };

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
      setRecommendationStrategies((items) => [{ ...strategy, id: `REC-${String(nextNumber).padStart(3, "0")}`, createdAt: strategy.createdAt || recommendationMockNow }, ...items]);
    }
    setDrawer(null);
  };

  const toggleRecommendationStrategy = (id) => {
    setRecommendationStrategies((items) => items.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item));
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

  const toggleCommunityStaff = (id) => {
    const updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    setCommunityStaff((items) => items.map((item) => item.id === id ? { ...item, enabled: !item.enabled, updatedAt } : item));
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

  const saveSafetyNews = (record) => {
    const updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    if (record.id) {
      setSafetyNews((items) => items.map((item) => item.id === record.id ? { ...item, ...record, updatedAt } : item));
    } else {
      const nextNumber = Math.max(0, ...safetyNews.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
      setSafetyNews((items) => [{ ...record, projectId: currentProject.id, id: `SAF-${String(nextNumber).padStart(3, "0")}`, status: record.status || "未发布", updatedAt }, ...items]);
    }
    setDrawer(null);
  };

  const changeSafetyNewsStatus = (id, status) => {
    const updatedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    setSafetyNews((items) => items.map((item) => item.id === id ? { ...item, status, publishAt: status === "已发布" && getCommunityContentStatus(item) === "未发布" ? communityContentMockNow : item.publishAt, updatedAt } : item));
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
    const publishedAt = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    if (activity.id) {
      setCommunityActivities((items) => items.map((item) => item.id === activity.id ? { ...item, ...activity, publishedAt } : item));
    } else {
      const nextNumber = Math.max(0, ...communityActivities.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
      setCommunityActivities((items) => [{ ...activity, projectId: currentProject.id, id: `ACT-${String(nextNumber).padStart(3, "0")}`, publishedAt }, ...items]);
    }
    setDrawer(null);
  };

  const unpublishCommunityActivity = (id) => {
    setCommunityActivities((items) => items.map((item) => item.id === id ? { ...item, isOffline: true } : item));
    setRecommendationStrategies((items) => items.map((item) => item.sourceId === id ? { ...item, enabled: false } : item));
  };

  const setCommunityActivityLiveMockState = (id, liveMockState) => {
    setCommunityActivities((items) => items.map((item) => item.id === id ? { ...item, liveMockState } : item));
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
    <div className={`app-shell admin-style-theme ${collapsed ? "collapsed" : ""} ${platformMode === "platform" ? "platform-mode" : "community-mode"}`}>
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><HeartHandshake size={21}/></div><div className="brand-copy"><strong>U2G 乐龄服务平台</strong><span>{platformMode === "platform" ? "平台管理端" : "社区运营端"}</span></div></div>
        <nav>{currentMenuGroups.map((group) => <div className="menu-group" key={group.label}><div className="menu-label">{group.label}</div>{group.items.map((item) => { const Icon = item.icon; const childActive = item.children?.some((child) => child.key === active); return item.children ? <div className={`submenu-group ${childActive ? "has-active" : ""}`} key={item.key}><button title={item.label} className="submenu-parent" onClick={() => setDeviceMenuOpen((open) => !open)}><Icon size={18}/><span>{item.label}</span><ChevronDown className={`submenu-chevron ${deviceMenuOpen ? "open" : ""}`} size={14}/></button>{deviceMenuOpen && <div className="submenu">{item.children.map((child) => <button title={child.label} className={`submenu-button ${active === child.key ? "active" : ""}`} key={child.key} onClick={() => { setActive(child.key); setOverviewContext(""); }}><span>{child.label}</span>{active === child.key && <i/>}</button>)}</div>}</div> : <button title={item.label} className={active === item.key ? "active" : ""} key={item.key} onClick={() => { setActive(item.key); setOverviewContext(""); if (item.key === "elderly") setElderlyDetailId(null); if (item.key === "relations") setRelativeDetailId(null); }}><Icon size={18}/><span>{item.label}</span>{active === item.key && <i/>}</button>; })}</div>)}</nav>
        <div className="sidebar-footer"><button onClick={() => setCollapsed(!collapsed)}><Menu size={18}/><span>收起菜单</span></button></div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb"><Home size={15}/><span>{platformMode === "platform" ? "平台管理端" : currentProject?.community}</span><ChevronRight size={14}/><b>{activeLabel}</b></div>
          <div className="top-actions">
            <label className="top-context-select platform-context-select"><span>当前平台</span><select value={platformMode} onChange={(event) => switchPlatformMode(event.target.value)}><option value="community">社区运营端</option><option value="platform">平台管理端</option></select></label>
            {platformMode === "community" && <label className="top-context-select community-context-select"><span>当前社区</span><select value={currentProject?.id || ""} onChange={(event) => requestCommunitySwitch(event.target.value)}>{authorizedProjects.map((project) => <option value={project.id} key={project.id}>{project.community}</option>)}</select></label>}
            <button className="top-icon"><Bell size={18}/><i/></button><span className="divider"/><button className="profile"><span className="avatar">赵</span><span><b>赵亚男</b><small>{platformMode === "platform" ? "平台管理员" : "社区运营管理员"}</small></span><ChevronDown size={14}/></button>
          </div>
        </header>
        <main className="content">
          {active !== "overview" && overviewContext && <div className="overview-filter-context"><div><SlidersHorizontal size={16}/><span>来自运营概览</span><b>{overviewContext}</b></div><button type="button" onClick={() => setOverviewContext("")}>清除条件</button></div>}
          {active === "platformOverview"
            ? <PlatformOverview projects={projects} elderlyRecords={elderlyRecords} tablets={tabletDevices} sensors={sensorDevices} onEnterCommunity={enterCommunity}/>
            : active === "overview"
            ? <Overview onNavigate={navigateFromOverview} inactivityRule={globalInactivityRule} onEditInactivityRule={() => setGlobalRuleOpen(true)} scenario={overviewScenario} resetSignal={acceptanceResetSignal} scope={{ name: currentProject?.community || "未选择社区", project: currentProject?.name || "未选择项目" }} records={scopedElderlyRecords} tablets={scopedTabletDevices} sensors={scopedSensorDevices} reminders={scopedReminderRecords}/>
            : active === "elderly"
              ? elderlyDetailRecord
                ? <ElderlyDetailPage record={elderlyDetailRecord} project={projects.find((project) => project.name === elderlyDetailRecord.project)} tablet={tabletDevices.find((device) => device.boundElderlyId === elderlyDetailRecord.id)} activation={activationRecords.find((item) => item.elderlyId === elderlyDetailRecord.id && ["待使用", "激活失败"].includes(item.status))} sensors={sensorDevices} reminders={reminderRecords.filter((reminder) => reminder.elderlyId === elderlyDetailRecord.id)} familyInvitations={familyInvitations.filter((item) => item.elderlyId === elderlyDetailRecord.id)} familyRelations={familyRelations.filter((item) => item.elderlyId === elderlyDetailRecord.id)} onInvalidateInvite={invalidateFamilyInvitation} onUnlinkRelation={unlinkFamilyRelation} inactivityRule={{ ...globalInactivityRule, ...(inactivityRules[elderlyDetailRecord.id] || defaultInactivityState), enabled: globalInactivityRule.enabled, thresholdHours: globalInactivityRule.thresholdHours, startTime: globalInactivityRule.startTime, endTime: globalInactivityRule.endTime }} weatherLocation={weatherMockApi.getLocation(weatherLocations, "老人", elderlyDetailRecord.id)} weatherQuery={weatherMockApi.getWeatherQuery(weatherQueries, weatherMockApi.getLocation(weatherLocations, "老人", elderlyDetailRecord.id)?.id)} weatherAudits={weatherMockApi.getAudits(weatherAudits, "老人", elderlyDetailRecord.id)} onBack={() => setElderlyDetailId(null)} onEdit={() => setDrawer({ kind: "elderly", mode: "edit", record: elderlyDetailRecord })} onManageSpaces={() => setSpaceTarget(elderlyDetailRecord)} onAddSensor={() => setDeviceDrawer({ kind: "sensorCreate", elderlyId: elderlyDetailRecord.id })} onViewSensor={(sensor) => setDeviceDrawer({ kind: "sensorView", sensor })} onManageTablet={() => setTabletTarget(elderlyDetailRecord)}/>
                : <ElderlyPage records={scopedElderlyRecords} tabletDevices={scopedTabletDevices} activationRecords={activationRecords.filter((item) => scopedElderlyIds.has(item.elderlyId))} onOpen={(mode, record) => mode === "view" ? setElderlyDetailId(record.id) : setDrawer({ kind: "elderly", mode, record })}/>
              : active === "relations"
                ? relativeDetailRecord
                  ? <RelativeDetailPage account={relativeDetailRecord} elderlyRecords={elderlyRecords} weatherLocation={weatherMockApi.getLocation(weatherLocations, "亲属", relativeDetailRecord.id)} weatherQuery={weatherMockApi.getWeatherQuery(weatherQueries, weatherMockApi.getLocation(weatherLocations, "亲属", relativeDetailRecord.id)?.id)} weatherAudits={weatherMockApi.getAudits(weatherAudits, "亲属", relativeDetailRecord.id)} onBack={() => setRelativeDetailId(null)} onEditWeather={() => setDrawer({ kind: "relativeWeather", account: relativeDetailRecord })}/>
                  : <RelativeArchivePage accounts={scopedRelativeAccounts} elderlyRecords={scopedElderlyRecords} weatherLocations={weatherLocations} onOpen={(account) => setRelativeDetailId(account.id)}/>
              : active === "reminders"
                ? <ReminderManagementPage reminders={scopedReminderRecords} elderlyRecords={scopedElderlyRecords} onCreate={() => setDrawer({ kind: "reminder" })} onEdit={(record) => setDrawer({ kind: "reminder", record })} onDelete={deleteReminder} onViewPlan={(record) => setDrawer({ kind: "reminderPlan", record })}/>
              : active === "emergencyHelp"
                ? <EmergencyHelpPage events={scopedEmergencyEvents} elderlyRecords={scopedElderlyRecords} onOpen={(event) => setDrawer({ kind: "emergencyHelp", eventId: event.id })}/>
              : active === "serviceCommunication"
                ? <ServiceCommunicationPage projectId={currentProject?.id} communityName={currentProject?.community || "当前社区"}/>
              : active === "familyAlbums"
                ? <FamilyAlbumBatchManagementPage batches={scopedAlbumBatches} elderlyRecords={scopedElderlyRecords} relatives={scopedRelativeAccounts} onViewBatch={(batch) => setDrawer({ kind: "familyAlbumBatch", batchId: batch.id })}/>
              : active === "recommendations"
                ? <RecommendationStrategyPage strategies={scopedRecommendationStrategies} communityName={currentProject?.community} acceptanceScenario={recommendationScenario} onCreate={(presetDate) => setDrawer({ kind: "recommendation", presetDate })} onEdit={(record) => setDrawer({ kind: "recommendation", record })} onToggle={toggleRecommendationStrategy} onMove={moveRecommendationStrategy}/>
              : active === "activities"
                ? <CommunityActivityPage records={communityActivityRecords} registrations={scopedRegistrations} communityName={currentProject?.community} onCreate={() => setDrawer({ kind: "activity", mode: "edit" })} onView={(record) => setDrawer({ kind: "activity", mode: "view", record })} onEdit={(record) => setDrawer({ kind: "activity", mode: "edit", record })} onUnpublish={unpublishCommunityActivity} onViewRegistrations={(record) => setDrawer({ kind: "activityRegistrations", record })}/>
              : active === "communityStaff"
                ? <CommunityStaffPage records={scopedCommunityStaff} communityName={currentProject?.community} onCreate={() => setDrawer({ kind: "communityStaff" })} onEdit={(record) => setDrawer({ kind: "communityStaff", record })} onToggle={toggleCommunityStaff} onMove={moveCommunityStaff}/>
              : communityContentTypeByMenu[active]
                ? <SafetyNewsPage records={scopedSafetyNews} contentType={communityContentTypeByMenu[active]} communityName={currentProject?.community} onCreate={() => setDrawer({ kind: "safety", mode: "edit", contentType: communityContentTypeByMenu[active] })} onView={(record) => setDrawer({ kind: "safety", mode: "view", record, contentType: record.type })} onEdit={(record) => setDrawer({ kind: "safety", mode: "edit", record, contentType: record.type })} onStatusChange={changeSafetyNewsStatus}/>
              : active === "services"
                ? <ServiceBookingPage bookings={scopedServiceBookings} categories={scopedServiceCategories} elderlyRecords={scopedElderlyRecords} communityName={currentProject?.community || "当前社区"} onOpen={(record) => setDrawer({ kind: "serviceBooking", record })} onCreateCategory={() => setDrawer({ kind: "serviceCategory" })} onEditCategory={(record) => setDrawer({ kind: "serviceCategory", record })} onMoveCategory={moveServiceCategory} onToggleCategory={toggleServiceCategory}/>
              : active === "projects"
                ? <ProjectPage projects={projects} elderlyRecords={elderlyRecords} onSave={saveProject} onToggle={toggleProject}/>
                : active === "tabletDevices" || active === "sensorDevices"
                  ? <DeviceManagementPage key={`${active}-${currentProjectId}`} deviceType={active === "tabletDevices" ? "tablet" : "sensor"} tablets={scopedTabletDevices} sensors={scopedSensorDevices} elderlyRecords={scopedElderlyRecords} onAddTablet={() => setDeviceDrawer({ kind: "tabletCreate" })} onViewTablet={(device) => setDeviceDrawer({ kind: "tabletView", device })} onManageTablet={setTabletTarget} onAddSensor={() => setDeviceDrawer({ kind: "sensorCreate" })} onViewSensor={(sensor) => setDeviceDrawer({ kind: "sensorView", sensor })}/>
                  : active === "activity"
                    ? <RoomActivityPage sensors={scopedSensorDevices} elderlyRecords={scopedElderlyRecords}/>
                    : active === "weatherLocations"
                      ? <WeatherLocationManagementPage integrations={initialWeatherRegionIntegrations} onView={(integration) => setDrawer({ kind: "weatherRegion", integration })}/>
                    : active === "careScripts"
                      ? <CareScriptManagementPage scripts={careScripts} onEdit={(condition, record) => setDrawer({ kind: "careScript", condition, record })} onToggle={toggleCareScript}/>
                    : <ManagementPage page={active} onCreate={() => setDrawer({ kind: "generic" })}/>}
        </main>
      </div>
      {drawer?.kind === "elderly" && <ElderlyDrawer key={`${drawer.mode}-${drawer.record?.id || "new"}`} mode={drawer.mode} record={drawer.record} projects={currentProject ? [currentProject] : []} tablet={scopedTabletDevices.find((device) => device.boundElderlyId === drawer.record?.id)} activation={activationRecords.find((item) => item.elderlyId === drawer.record?.id && item.status === "待使用")} onManageTablet={() => setTabletTarget(drawer.record)} onClose={() => setDrawer(null)} onSave={saveElderlyRecord}/>}
      {drawer?.kind === "reminder" && <ReminderDrawer key={drawer.record?.id || "new-reminder"} record={drawer.record} elderlyRecords={scopedElderlyRecords} onClose={() => setDrawer(null)} onSave={saveReminder}/>}
      {drawer?.kind === "reminderPlan" && <ReminderPlanDrawer reminder={drawer.record} elderly={scopedElderlyRecords.find((record) => record.id === drawer.record.elderlyId)} onClose={() => setDrawer(null)}/>}
      {drawer?.kind === "emergencyHelp" && (() => {
        const event = emergencyHelpEvents.find((item) => item.id === drawer.eventId);
        if (!event) return null;
        return <EmergencyHelpDrawer event={event} elderly={scopedElderlyRecords.find((item) => item.id === event.elderlyId)} onClose={() => setDrawer(null)} onRetry={retryEmergencyNotification} onEnd={endEmergencyEvent}/>;
      })()}
      {drawer?.kind === "familyAlbumBatch" && (() => {
        const batch = familyAlbumBatches.find((item) => item.id === drawer.batchId);
        if (!batch) return null;
        return <FamilyAlbumBatchDetailDrawer batch={batch} elderly={scopedElderlyRecords.find((item) => item.id === batch.elderlyId)} uploader={scopedRelativeAccounts.find((item) => item.id === batch.uploaderId)} onClose={() => setDrawer(null)}/>;
      })()}
      {drawer?.kind === "recommendation" && <RecommendationStrategyDrawer key={drawer.record?.id || `new-recommendation-${drawer.presetDate || "default"}`} record={drawer.record} presetDate={drawer.presetDate} safetyNews={scopedSafetyNews} activities={communityActivityRecords} currentProject={currentProject} onClose={() => setDrawer(null)} onSave={saveRecommendationStrategy}/>}
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
      {drawer?.kind === "serviceCategory" && <ServiceCategoryDrawer key={drawer.record?.id || `new-service-category-${currentProjectId}`} record={drawer.record} categories={scopedServiceCategories} communityName={currentProject?.community || "当前社区"} onClose={() => setDrawer(null)} onSave={saveServiceCategory}/>}
      {drawer?.kind === "serviceCatalog" && <ServiceCatalogDrawer key={drawer.record?.id || "new-service"} record={drawer.record} onClose={() => setDrawer(null)} onSave={saveServiceCatalogItem}/>}
      {drawer?.kind === "weatherRegion" && <WeatherRegionIntegrationDrawer integration={drawer.integration} onClose={() => setDrawer(null)}/>}
      {drawer?.kind === "relativeWeather" && <RelativeWeatherLocationDrawer key={drawer.account.id} account={drawer.account} location={weatherMockApi.getLocation(weatherLocations, "亲属", drawer.account.id)} onClose={() => setDrawer(null)} onSave={(selection) => saveRelativeWeatherLocation(drawer.account, selection)}/>}
      {drawer?.kind === "careScript" && <CareScriptDrawer key={drawer.condition.code} condition={drawer.condition} record={drawer.record} onClose={() => setDrawer(null)} onSave={saveCareScript}/>}
      {drawer?.kind === "generic" && <CreateDrawer page={active} onClose={() => setDrawer(null)}/>}
      {deviceDrawer?.kind === "tabletCreate" && <TabletAssetDrawer devices={tabletDevices} onClose={() => setDeviceDrawer(null)} onSave={saveTabletDevice}/>}
      {deviceDrawer?.kind === "tabletView" && <TabletAssetDrawer device={deviceDrawer.device} devices={tabletDevices} onClose={() => setDeviceDrawer(null)} onSave={saveTabletDevice}/>}
      {deviceDrawer?.kind === "sensorCreate" && <SensorInstallDrawer sensors={scopedSensorDevices} elderlyRecords={scopedElderlyRecords} initialElderlyId={deviceDrawer.elderlyId} onClose={() => setDeviceDrawer(null)} onSave={saveSensorDevice}/>}
      {deviceDrawer?.kind === "sensorView" && <SensorDetailDrawer sensor={deviceDrawer.sensor} elderlyRecords={scopedElderlyRecords} onClose={() => setDeviceDrawer(null)} onMove={moveSensorRoom} onUnbind={unbindSensor}/>}
      {spaceTarget && <SpaceManagementDrawer record={spaceTarget} onClose={() => setSpaceTarget(null)} onSave={saveElderlySpaces}/>}
      {tabletTarget && <TabletBindingModal record={tabletTarget} project={projects.find((project) => project.name === tabletTarget.project)} devices={tabletDevices} activation={activationRecords.find((item) => item.elderlyId === tabletTarget.id && ["待使用", "激活失败"].includes(item.status))} failureSignal={activationFailureSignal} onGenerate={generateTabletActivation} onFail={failTabletActivation} onActivate={(tabletId, activationId) => activateTablet(tabletTarget.id, tabletId, activationId)} onClose={() => setTabletTarget(null)} onUnbind={unbindTablet}/>}
      {globalRuleOpen && <InactivityRuleDrawer rule={globalInactivityRule} onClose={() => setGlobalRuleOpen(false)} onSave={(rule) => { setGlobalInactivityRule(rule); setGlobalRuleOpen(false); }}/>}
      {pendingProjectId && <div className="modal-layer"><button className="modal-backdrop" aria-label="取消切换社区" onClick={() => setPendingProjectId("")}/><section className="confirm-dialog" role="dialog" aria-modal="true" aria-label="切换社区确认"><span className="confirm-icon warning"><Building2 size={20}/></span><h3>切换到“{projects.find((project) => project.id === pendingProjectId)?.community}”？</h3><p>当前打开的编辑内容尚未保存。切换社区后将关闭当前弹窗，并按新社区的数据权限重新加载页面。</p><div><button className="secondary-button" onClick={() => setPendingProjectId("")}>继续当前操作</button><button className="primary-button" onClick={() => applyCommunitySwitch(pendingProjectId)}>确认切换</button></div></section></div>}
      {import.meta.env.DEV && new URLSearchParams(window.location.search).has("acceptance") && <AcceptanceWorkbench activeModuleId={active} overviewScenario={overviewScenario} recommendationScenario={recommendationScenario} overlayOpen={hasOpenEditor} onModuleChange={navigateFromAcceptance} onOverviewScenarioChange={(scenario) => { setOverviewScenario(scenario); setActive("overview"); setDrawer(null); setDeviceDrawer(null); setTabletTarget(null); setAcceptanceResetSignal((value) => value + 1); }} onRecommendationScenarioChange={(scenario) => { setRecommendationScenario(scenario); setActive("recommendations"); setDrawer(null); setDeviceDrawer(null); setTabletTarget(null); setAcceptanceResetSignal((value) => value + 1); }} onActivationFailure={(type) => setActivationFailureSignal((signal) => ({ id: signal.id + 1, type }))} onReset={resetAcceptance}/>}
    </div>
  );
}
