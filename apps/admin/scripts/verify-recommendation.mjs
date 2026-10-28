import fs from "node:fs/promises";

const endpoint = "http://127.0.0.1:9223";
const appUrl = "http://localhost:53113/";
const artifactDir = new URL("../artifacts/", import.meta.url);

await fs.mkdir(artifactDir, { recursive: true });

const target = await fetch(`${endpoint}/json/new?${encodeURIComponent(appUrl)}`, { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let sequence = 0;
const consoleErrors = [];

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
  if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text);
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
    const entry = message.params.entry;
    if (!String(entry.url || "").endsWith("/favicon.ico")) consoleErrors.push(`${entry.text}${entry.url ? ` (${entry.url})` : ""}`);
  }
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function call(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

const wait = (milliseconds = 250) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (expression) => {
  const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const clickByText = (text) => evaluate(`(() => {
  const node = [...document.querySelectorAll('button')].find((item) => item.textContent.trim().includes(${JSON.stringify(text)}));
  if (!node) return false;
  node.click();
  return true;
})()`);
const bodyText = () => evaluate("document.body.innerText");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const screenshot = async (name) => {
  const result = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await fs.writeFile(new URL(name, artifactDir), Buffer.from(result.data, "base64"));
};

await call("Page.enable");
await call("Runtime.enable");
await call("Log.enable");
await call("Emulation.setDeviceMetricsOverride", { width: 1960, height: 1200, deviceScaleFactor: 1, mobile: false });
await wait(1200);

assert(await clickByText("推荐策略"), "未找到推荐策略菜单");
await wait(400);
await evaluate(`document.querySelector('[aria-label="收起验收台"]')?.click()`);
await evaluate(`document.querySelector('.acceptance-console')?.style.setProperty('display', 'none')`);
await wait(100);
let text = await bodyText();
assert(text.includes("红山社区 · 配置当前社区"), "推荐策略未处于当前社区上下文");
assert(text.includes("当前生效顺序预览"), "缺少当前生效顺序预览");
assert(text.includes("明早一起练太极") && text.includes("雨天居家防滑提醒") && text.includes("怀旧金曲下午茶"), "正常排序预览内容不完整");
assert(!text.includes("AI语音\n") || text.includes("AI 语音不参与后台排序"), "AI语音被误加入推荐内容列表");
const orderBefore = await evaluate(`[...document.querySelectorAll('.recommendation-day-list b')].map((item) => item.textContent)`);
assert(JSON.stringify(orderBefore) === JSON.stringify(["明早一起练太极", "雨天居家防滑提醒", "怀旧金曲下午茶"]), `当前生效顺序不符合后台配置：${orderBefore.join("、")}`);
await screenshot("推荐策略-当前生效顺序-V11.png");

assert(await clickByText("内容管理"), "未找到内容管理页签");
await wait(250);
text = await bodyText();
for (const status of ["未生效", "已过期", "已停用", "达到展示上限", "冷却中"]) assert(text.includes(status), `缺少Mock状态：${status}`);
await screenshot("推荐策略-内容管理状态-V11.png");

await evaluate(`(() => { const row = [...document.querySelectorAll('.recommendation-table tbody tr')].find((item) => item.textContent.includes('REC-001')); row?.querySelector('[aria-label="下移"]')?.click(); return Boolean(row); })()`);
await wait(150);
assert(await clickByText("排期日历"), "无法返回排期日历");
await wait(150);
const orderAfter = await evaluate(`[...document.querySelectorAll('.recommendation-day-list b')].map((item) => item.textContent)`);
assert(JSON.stringify(orderBefore) !== JSON.stringify(orderAfter), "调整顺序后预览未即时更新");
await clickByText("内容管理");
await wait(100);
await evaluate(`(() => { const row = [...document.querySelectorAll('.recommendation-table tbody tr')].find((item) => item.textContent.includes('REC-001')); row?.querySelector('[aria-label="上移"]')?.click(); return Boolean(row); })()`);

const toggleResult = await evaluate(`(() => { const control = document.querySelector('[aria-label="明早一起练太极启用状态"]'); const before = control?.getAttribute('aria-checked'); control?.click(); return before; })()`);
await wait(100);
const toggleOff = await evaluate(`document.querySelector('[aria-label="明早一起练太极启用状态"]')?.getAttribute('aria-checked')`);
assert(toggleResult === "true" && toggleOff === "false", "启停交互未生效");
await evaluate(`document.querySelector('[aria-label="明早一起练太极启用状态"]')?.click()`);

await clickByText("排期日历");
await wait(100);
await evaluate(`(() => { const select = document.querySelector('.recommendation-preview-heading select'); select.value = '无可用内容'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
await wait(100);
text = await bodyText();
assert(text.includes("当前没有可展示的推荐内容") && text.includes("AI 语音不参与后台排序"), "无内容补位状态不完整");

await evaluate(`(() => { const select = document.querySelector('.recommendation-preview-heading select'); select.value = '正常排序'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
await wait(100);
await evaluate(`(() => { const select = document.querySelector('.community-context-select select'); select.value = 'PRJ-002'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
await wait(200);
await clickByText("推荐策略");
await wait(150);
text = await bodyText();
assert(text.includes("大巴窑社区 · 配置当前社区"), "社区切换后标题范围未更新");
await clickByText("内容管理");
await wait(100);
const toaPayohRows = await evaluate(`[...document.querySelectorAll('.recommendation-table tbody tr')].map((row) => row.innerText)`);
assert(toaPayohRows.length === 1 && toaPayohRows[0].includes("REC-004") && !toaPayohRows[0].includes("雨天居家防滑提醒"), `推荐内容发生跨社区串联：${toaPayohRows.join(" | ")}`);

await evaluate(`(() => { const select = document.querySelector('.community-context-select select'); select.value = 'PRJ-001'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
await wait(150);
await clickByText("推荐策略");
await wait(100);

assert(await clickByText("新增推荐内容"), "未找到新增推荐内容入口");
await wait(100);
text = await bodyText();
for (const field of ["内容类型", "适用老人 / 人群", "关联内容", "内容名称", "生效时间", "失效时间", "展示顺序", "单次展示时长", "每日展示上限", "冷却时间", "老人查看后", "启用状态"]) assert(text.includes(field), `新增抽屉缺少字段：${field}`);
assert(text.includes("红山社区老人") && !text.includes("大巴窑社区老人"), "新增抽屉的人群选项未按社区隔离");

socket.close();
await fetch(`${endpoint}/json/close/${target.id}`, { method: "GET" });

if (consoleErrors.length) throw new Error(`浏览器Console错误：${consoleErrors.join(" | ")}`);
const report = {
  http: 200,
  normalPreview: orderBefore,
  reorderedPreview: orderAfter,
  mockStates: ["未生效", "已过期", "已停用", "达到展示上限", "冷却中", "当前无可用推荐内容"],
  communityIsolation: true,
  drawerFields: true,
  consoleErrors,
};
await fs.writeFile(new URL("推荐策略-L2验证结果.json", artifactDir), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
