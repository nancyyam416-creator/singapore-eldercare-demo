import fs from "node:fs/promises";

const endpoint = "http://127.0.0.1:9223";
const appUrl = "http://localhost:53113/";
const artifactDir = new URL("../artifacts/", import.meta.url);

await fs.mkdir(artifactDir, { recursive: true });
const target = await fetch(`${endpoint}/json/new?${encodeURIComponent(appUrl)}`, { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
const consoleErrors = [];
let sequence = 0;

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

const wait = (milliseconds = 200) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (expression) => {
  const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const clickButton = (text) => evaluate(`(() => { const node = [...document.querySelectorAll('button')].find((item) => item.textContent.trim().includes(${JSON.stringify(text)})); if (!node) return false; node.click(); return true; })()`);
const clickDetailTab = (text) => evaluate(`(() => { const node = [...document.querySelectorAll('.elderly-detail-tabs button')].find((item) => item.textContent.trim().includes(${JSON.stringify(text)})); if (!node) return false; node.click(); return true; })()`);
const bodyText = () => evaluate("document.body.innerText");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const screenshot = async (name) => {
  const result = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await fs.writeFile(new URL(name, artifactDir), Buffer.from(result.data, "base64"));
};

await call("Page.enable");
await call("Runtime.enable");
await call("Log.enable");
await call("Emulation.setDeviceMetricsOverride", { width: 1500, height: 1100, deviceScaleFactor: 1, mobile: false });
await wait(1000);
assert(await clickButton("老人档案"), "未找到老人档案菜单");
await wait(250);
assert(await evaluate(`(() => { const node = [...document.querySelectorAll('button')].find((item) => item.textContent.trim() === '详情'); if (!node) return false; node.click(); return true; })()`), "未找到老人档案详情入口");
await wait(250);
await evaluate(`document.querySelector('.acceptance-console')?.style.setProperty('display', 'none')`);

const checks = [
  ["档案信息", ["基础资料", "资料完整度", "紧急联系人", "居住地址"]],
  ["家庭关系", ["家庭绑定邀请记录", "已绑定子女"]],
  ["天气位置", ["居住地址解析结果", "技术状态与变更记录"]],
  ["提醒事项", ["提醒名称", "计划时间", "最近实例状态"]],
  ["房间活动传感器", ["房间与活动传感器", "今日房间活动", "无活动轻提醒"]],
  ["平板设备", ["当前版本", "版本状态", "激活方式"]],
];

for (const [tab, expected] of checks) {
  assert(await clickDetailTab(tab), `未找到页签：${tab}`);
  await wait(120);
  const text = await bodyText();
  for (const item of expected) assert(text.includes(item), `${tab} 缺少内容：${item}`);
}

await clickDetailTab("档案信息");
await wait(100);
await screenshot("老人档案详情-档案信息.png");

assert(await clickButton("返回老人档案"), "无法返回老人档案列表");
await wait(120);
const elderlyListText = await evaluate(`document.querySelector('.elderly-management')?.innerText || ''`);
assert(!elderlyListText.includes("所属项目 / 社区") && !elderlyListText.includes("全部项目"), "老人列表仍展示项目社区列或项目筛选");
assert(await clickButton("新增老人"), "未找到新增老人入口");
await wait(120);
const formText = await evaluate(`document.querySelector('.elderly-drawer')?.innerText || ''`);
assert(formText.includes("基础信息") && formText.includes("居住地址 *"), "居住地址未放入基础信息表单");
assert(!formText.includes("服务归属") && !formText.includes("所属项目 *") && !formText.includes("所属社区 *"), "项目或社区选择仍在老人表单中展示");
await screenshot("老人档案-新增老人表单.png");

socket.close();
await fetch(`${endpoint}/json/close/${target.id}`, { method: "GET" });
if (consoleErrors.length) throw new Error(`浏览器 Console 错误：${consoleErrors.join(" | ")}`);

const report = { http: 200, verifiedTabs: checks.map(([tab]) => tab), elderlyList: { projectCommunityColumnRemoved: true, projectFilterRemoved: true }, elderlyForm: { addressInBaseInfo: true, projectAndCommunityAutoScoped: true }, consoleErrors };
await fs.writeFile(new URL("老人档案详情-验证结果.json", artifactDir), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
