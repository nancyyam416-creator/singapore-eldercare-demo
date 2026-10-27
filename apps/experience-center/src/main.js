import "./styles.css";
import { experienceEntries } from "./entry-config";

const icons = {
  desktop: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>`,
  screen: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4" width="19" height="14" rx="2.5"/><path d="M8 21h8M12 18v3"/><circle cx="7" cy="9" r="1.3"/><path d="M10.5 9H18M6 13h12"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10 5h4M11 19h2"/></svg>`,
  family: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10 5h4M11 19h2"/><path d="M12 15.5s-3-1.7-3-3.7a1.7 1.7 0 0 1 3-1.1 1.7 1.7 0 0 1 3 1.1c0 2-3 3.7-3 3.7Z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
};

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
    <section class="intro"><span class="eyebrow">INTERACTIVE PROTOTYPE</span><h1>U2G智慧养老</h1><p>选择终端进入交互界面</p></section>
    <section class="entry-grid" aria-label="四端产品入口">${experienceEntries.map(entryCard).join("")}</section>
  </main>
</div>`;
