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
    date: "2026-10-29",
    terminals: [
      {
        name: "管理后台",
        items: ["新增服务咨询拨打记录，补充筛选、拨打结果、供应商电话、来源终端和辅助预约状态", "天气关怀话术按 QWeather 分类分组，并修复表格内容重叠"],
      },
      {
        name: "老人中控屏",
        items: ["在线求助统一为在线协助，通过网络电话连接呼叫中心", "简化确认流程，补充可观察状态、通话浮窗和挂断操作"],
      },
      {
        name: "老人移动端",
        items: ["恢复五个底部导航入口，提醒事项移入“我的”", "服务预约改为电话咨询优先，支持辅助预约和等待电话确认"],
      },
      {
        name: "子女移动端",
        items: ["整体优化“我的”页面的信息层级与操作布局"],
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
