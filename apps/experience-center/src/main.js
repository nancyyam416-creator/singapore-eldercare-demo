import "./styles.css";
import { experienceEntries } from "./entry-config";

const icons = {
  desktop: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>`,
  screen: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4" width="19" height="14" rx="2.5"/><path d="M8 21h8M12 18v3"/><circle cx="7" cy="9" r="1.3"/><path d="M10.5 9H18M6 13h12"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10 5h4M11 19h2"/></svg>`,
  family: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10 5h4M11 19h2"/><path d="M12 15.5s-3-1.7-3-3.7a1.7 1.7 0 0 1 3-1.1 1.7 1.7 0 0 1 3 1.1c0 2-3 3.7-3 3.7Z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  history: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`,
};

const updateDays = [
  {
    date: "2026-11-04",
    terminals: [
      { name: "子女移动端", items: ["首页老人卡片将“切换家人”合并到老人姓名区，通过下拉箭头进入选择，并保留独立的“查看手机位置”入口", "卡片明确区分“居家位置”和手机位置，切换家人后查看对应老人的位置共享状态"] },
    ],
  },
  {
    date: "2026-11-03",
    terminals: [
      { name: "管理后台", items: ["服务目录详情抽屉改为“服务详情 / 服务评价”双 Tab，默认展示详情，评价列表和空态独立呈现", "关闭重开或切换服务后恢复默认详情，并保留编辑服务和抽屉滚动操作", "社区端新增设备告警策略页面，集中展示并设置房间活动传感器的连续无活动策略"] },
      { name: "老人中控屏", items: ["特约服务目录展示真实评分摘要，服务详情改为“服务详情 / 服务评价”双 Tab，并按服务 ID 展示对应评价", "清理设备激活中“SN 未登记、需工作人员预登记”等旧提示，保留自动上报、资料回填和查询失败重试流程", "首页新增设置入口，支持在独立设置页调整家人与乐龄呼叫中心的在线协助呼叫顺序", "在线协助按保存顺序进行 Mock 呼叫，并在通话浮窗展示当前接听目标"] },
      { name: "老人移动端", items: ["服务列表展示共享平均分和评价数量，服务详情按服务 ID 展示评价内容、评价人和时间", "服务详情改为“详情 / 服务评价”双 Tab，无评价时展示单一空态，底部电话与家人协助操作保持固定", "“我的”新增位置共享 Mock，覆盖等待授权、共享中、权限拒绝和关闭共享状态"] },
      { name: "子女移动端", items: ["服务列表和详情接入共享评价聚合，按服务 ID 隔离统计并展示平均分、评价数量和评价内容", "服务详情改为“详情 / 服务评价”双 Tab，返回后重新打开服务默认展示详情", "老人信息卡新增“查看位置”，支持最近位置、上次位置、未共享和暂无记录四种 L2 Mock 状态"] },
    ],
  },
  {
    date: "2026-11-02",
    terminals: [
      { name: "管理后台", items: ["服务协助记录接入四端共享数据，统一展示待处理、处理中、家人处理完成、已取消和已失效状态", "平板设备改为自动上报 SN，展示绑定老人、待绑定、未归属项目和最近上报状态，移除登记、激活码及预登记入口"] },
      { name: "老人中控屏", items: ["特约服务固定保留“联系服务商”和“请家人帮忙”两个操作；再次提醒沿用同一记录和原 48 小时时限", "协助完成状态统一为“家人处理完成”，不再表示服务商已履约", "联网后自动上报 SN 并查询绑定关系：已绑定自动回填且可修改，未绑定手动填写，查询失败可重试；性别仅保留男、女"] },
      { name: "老人移动端", items: ["服务详情操作区固定在手机视口内，支持联系服务商、请家人帮忙及不同状态下的再次提醒", "结果页按待处理、处理中、家人处理完成、已取消和已失效展示对应操作，移除重复发起入口"] },
      { name: "子女移动端", items: ["服务协助统一使用“确认处理完成 / 家人处理完成”语义，并保留完成时间轴", "再次提醒沿用原协助记录和原 48 小时时限；修复共享记录容量限制，提醒时间可跨端回流", "服务目录验收场景补齐社区切换、分类停用、空列表和加载失败重试"] },
      { name: "入口界面", items: ["合并补充 11 月 2 日四端更新记录，统一展示本次可验证变更"] },
    ],
  },
  {
    date: "2026-10-30",
    terminals: [
      { name: "管理后台", items: ["平台端统一维护服务目录并配置适用社区；服务协助记录支持跨社区查看和筛选", "社区端仅展示当前社区服务协助记录，移除服务目录维护入口，并同步角色权限和页面路由兜底"] },
      { name: "老人中控屏", items: ["接入统一服务目录并按老人所属社区筛选，优化服务详情和参考价格展示（L3 Mock）", "联系服务商与请家人帮忙合并为操作区，通知家人后展示进度卡；电话通过弹窗展示"] },
      { name: "老人移动端", items: ["接入统一服务目录、社区范围和服务图片，缺失社区统一提示社区未设置（L3 Mock）", "服务详情突出参考价格，拨打服务电话与请家人帮忙固定在底部导航上方，滚动时保持可见"] },
      { name: "子女移动端", items: ["接入统一服务目录并按当前老人社区筛选，服务范围显示社区名称，详情首屏突出参考价格（L3 Mock）"] },
      { name: "入口界面", items: ["修复四端入口丢失项目路径导致的 404，生产入口改为相对当前站点路径"] },
    ],
  },
  {
    date: "2026-10-29",
    terminals: [
      {
        name: "管理后台",
        items: ["服务咨询记录支持预约结果待确认、已预约成功、暂未预约成功筛选及详情，展示子女确认信息（L3 Mock）", "天气关怀话术按 QWeather 分类分组，并修复表格内容重叠"],
      },
      {
        name: "老人中控屏",
        items: ["在线求助统一为在线协助，通过网络电话连接呼叫中心", "简化确认流程，补充可观察状态、通话浮窗和挂断操作", "设备激活新增个人资料填写、确认及电话和邮编校验，支持返回修改（L3 Mock）", "提醒弹窗增加关闭按钮，关闭不改变提醒状态；用药保留我已服药，日常及活动保留我知道了"],
      },
      {
        name: "老人移动端",
        items: ["恢复五个底部导航入口，提醒事项移入“我的”", "服务预约仅保留电话预约，新增营业时间、支持区域及预约进展展示（L3 Mock）"],
      },
      {
        name: "子女移动端",
        items: ["整体优化“我的”页面的信息层级与操作布局", "家庭留言新增服务预约通知与结果确认，支持未读、提交失败重试和处理后只读（L3 Mock，尚未接通跨端接口）"],
      },
      {
        name: "入口界面",
        items: ["补充 10 月 29 日四端更新记录", "修复线上四端入口及返回入口界面的链接，避免跳转到本地地址"],
      },
    ],
  },
  {
    date: "2026-10-28",
    terminals: [
      {
        name: "老人中控屏",
        items: ["设备激活支持先选择 Wi-Fi，再输入对应密码", "警惕事项详情精简不必要的操作入口"],
      },
      {
        name: "老人移动端",
        items: ["新增预约服务原型，支持服务分类、预约提交和记录查看", "补充社区活动与警惕事项展示"],
      },
      {
        name: "子女移动端",
        items: ["新增在线协助进度与未读状态展示"],
      },
      {
        name: "入口界面",
        items: ["新增按日期及终端分组的更新记录，最新日期置顶"],
      },
    ],
  },
  {
    date: "2026-10-27",
    terminals: [
      {
        name: "管理后台",
        items: ["升级包类型改为上传后自动识别", "新增升级描述，并优化表单校验反馈"],
      },
      {
        name: "入口界面",
        items: ["聚合管理后台、中控屏、老人移动端和子女移动端", "各终端支持返回 U2G 智慧养老入口"],
      },
    ],
  },
];

function updateDay(day, index) {
  const itemCount = day.terminals.reduce((total, terminal) => total + terminal.items.length, 0);
  return `<section class="update-day${index === 0 ? " is-latest" : ""}">
    <header class="update-day-header">
      <div><time datetime="${day.date}">${day.date}</time>${index === 0 ? "<b>最新</b>" : ""}</div>
      <span>${day.terminals.length} 个终端 · ${itemCount} 项优化</span>
    </header>
    <div class="update-terminal-list">${day.terminals.map(terminal => `<article class="update-terminal"><h3>${terminal.name}<span>${terminal.items.length} 项</span></h3><ul>${terminal.items.map(item => `<li>${item}</li>`).join("")}</ul></article>`).join("")}</div>
  </section>`;
}

const descriptions = {
  admin: "管理档案、设备与社区运营",
  "elder-screen": "居家查看提醒并连接家人与服务",
  "elder-mobile": "随时使用长者常用服务",
  "family-mobile": "远程了解长辈状态并协同关怀",
};

function entryCard(entry) {
  const iconName = entry.id === "family-mobile" ? "family" : entry.shape;
  return `<a class="entry-card tone-${entry.tone}" href="${entry.url}" target="_blank" rel="noopener noreferrer" aria-label="进入${entry.name}体验，将在新标签页打开">
    <span class="entry-number">${entry.order}</span>
    <span class="entry-icon" aria-hidden="true">${icons[iconName]}</span>
    <h2>${entry.name}</h2>
    <p>${descriptions[entry.id]}</p>
    <span class="entry-action">进入体验 ${icons.arrow}</span>
  </a>`;
}

document.querySelector("#app").innerHTML = `<div class="site-shell">
  <main class="content">
    <button class="update-trigger" type="button" aria-haspopup="dialog" aria-controls="update-drawer">
      <span class="update-trigger-icon">${icons.history}</span>
      <span>更新记录</span>
      <em>${updateDays.length}</em>
    </button>
    <section class="intro"><span class="eyebrow">INTERACTIVE PROTOTYPE</span><h1>U2G智慧养老</h1><p>选择终端进入交互界面</p></section>
    <section class="entry-grid" aria-label="四端产品入口">${experienceEntries.map(entryCard).join("")}</section>
  </main>
  <div class="update-layer" hidden>
    <button class="update-backdrop" type="button" aria-label="关闭更新记录"></button>
    <aside class="update-drawer" id="update-drawer" role="dialog" aria-modal="true" aria-labelledby="update-title">
      <header class="update-header"><div><span class="eyebrow">CHANGELOG</span><h2 id="update-title">更新记录</h2><p>按日期查看各终端最近完成的优化</p></div><button class="update-close" type="button" aria-label="关闭更新记录">${icons.close}</button></header>
      <div class="update-list">${updateDays.map(updateDay).join("")}</div>
    </aside>
  </div>
</div>`;

const updateLayer = document.querySelector(".update-layer");
const updateTrigger = document.querySelector(".update-trigger");
const updateCloseButtons = document.querySelectorAll(".update-close, .update-backdrop");

function closeUpdateRecords() {
  updateLayer.hidden = true;
  document.body.classList.remove("has-open-drawer");
  updateTrigger.focus();
}

function openUpdateRecords() {
  updateLayer.hidden = false;
  document.body.classList.add("has-open-drawer");
  document.querySelector(".update-close").focus();
}

updateTrigger.addEventListener("click", openUpdateRecords);
updateCloseButtons.forEach(button => button.addEventListener("click", closeUpdateRecords));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !updateLayer.hidden) closeUpdateRecords();
});
