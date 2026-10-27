import { Boxes, ChevronDown, FlaskConical, GripHorizontal, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const VIEWPORT_MARGIN = 8;
const DRAG_THRESHOLD = 5;

const acceptanceHierarchy = [
  { id: "workbench", label: "工作台", modules: [{ id: "overview", label: "运营概览", objectLabel: "页面整体" }] },
  { id: "elder-service", label: "老人服务", modules: [
    { id: "elderly", label: "老人档案" }, { id: "relations", label: "亲属档案" },
    { id: "emergencyHelp", label: "在线协助" }, { id: "familyAlbums", label: "家庭相册" },
  ] },
  { id: "content", label: "运营内容", modules: [
    { id: "recommendations", label: "推荐策略" }, { id: "services", label: "预约服务" },
  ] },
  { id: "community-life", label: "社区生活", modules: [
    { id: "communityAnnouncements", label: "社区公告" }, { id: "lifeInformation", label: "生活资讯" },
    { id: "alertItems", label: "警惕事项" }, { id: "activities", label: "社区活动" }, { id: "communityStaff", label: "社区人员" },
  ] },
  { id: "device-data", label: "设备与数据", modules: [
    { id: "tabletDevices", label: "平板设备" },
  ] },
  { id: "platform-public", label: "平台公共能力", modules: [
    { id: "careScripts", label: "关怀话术" },
    { id: "leisureEntertainment", label: "休闲娱乐", objectLabel: "页面整体" },
  ] },
  { id: "platform-device", label: "平台设备管理", modules: [
    { id: "platformTabletDevices", label: "平板设备" },
    { id: "tabletOta", label: "平板 OTA 升级" },
  ] },
  { id: "system", label: "系统管理", modules: [
    { id: "projects", label: "项目与社区" },
    { id: "userManagement", label: "用户管理" }, { id: "roleManagement", label: "角色管理" },
    { id: "logs", label: "操作日志" },
  ] },
];

const overviewScenarios = [
  { value: "normal", label: "正常", description: "展示纯展示指标与无活动、在线协助、房间传感器离线待办。", status: "默认" },
  { value: "noAttention", label: "暂无待处理", description: "待处理列表展示空状态，顶部快照指标不切换为错误结果。", status: "空状态" },
  { value: "partial", label: "部分来源失败", description: "待办来源部分失败，顶部快照指标保持纯展示。", status: "部分失败" },
  { value: "allFailed", label: "全部来源失败", description: "待处理模块展示失败态，顶部快照指标不随错误场景切换。", status: "失败" },
  { value: "stale", label: "数据过旧", description: "展示固定的过期更新时间与警示。", status: "边界" },
  { value: "noProject", label: "当前账号无项目", description: "展示无数据权限的页面级空状态。", status: "权限" },
];

const recommendationScenarios = [
  { value: "normal", label: "正常排期", description: "按启用状态、生效时间与展示顺序展示当前排期。", status: "默认" },
  { value: "empty", label: "今日暂无内容", description: "今日没有可展示推荐，日历和右侧预览展示空状态。", status: "空状态" },
];

const elderlyScenarios = [
  { value: "normal", label: "默认档案", description: "展示当前社区的老人档案列表。", status: "默认" },
  { value: "tabletUnbound", label: "平板未绑定", description: "无目标设备且无有效激活记录，展示绑定入口。", status: "空状态" },
  { value: "tabletPending", label: "平板待激活", description: "已指定设备并生成激活码，尚未完成激活。", status: "待处理" },
  { value: "tabletActivated", label: "平板已激活", description: "设备已绑定当前老人，展示在线状态与使用信息。", status: "成功" },
  { value: "tabletActivationFailed", label: "平板激活失败", description: "展示失败原因，并提供重新发起激活入口。", status: "失败" },
  { value: "unbindFailure", label: "解绑失败可重试", description: "首次解除失败，保留原绑定关系并提供重试入口。", status: "失败" },
];

const leisureEntertainmentScenarios = [
  { value: "normal", label: "正常列表", description: "按展示顺序展示 YouTube、Spotify 和 MeRadio。", status: "默认" },
  { value: "empty", label: "空列表", description: "平台尚未配置任何娱乐入口。", status: "空状态" },
  { value: "invalidUrl", label: "URL 格式错误", description: "YouTube 入口 URL 缺少 http/https 协议。", status: "校验失败" },
  { value: "whitelistNotCover", label: "白名单未覆盖", description: "YouTube 的入口 URL 未被自身白名单覆盖。", status: "校验失败" },
  { value: "duplicateEntry", label: "重复入口", description: "列表中存在同名且相同 URL 的重复入口。", status: "校验失败" },
  { value: "inactive", label: "停用状态", description: "Spotify 已停用，配置保留但不再供老人端和推荐引用。", status: "停用" },
  { value: "saveSuccess", label: "保存成功", description: "列表保持正常数据并展示保存成功反馈。", status: "成功" },
];

const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);
const findContext = (moduleId) => {
  const page = acceptanceHierarchy.find((item) => item.modules.some((module) => module.id === moduleId)) || acceptanceHierarchy[0];
  return { page, module: page.modules.find((item) => item.id === moduleId) || page.modules[0] };
};

export function AcceptanceWorkbench({ activeModuleId, overviewScenario, recommendationScenario, elderlyScenario, leisureEntertainmentScenario, overlayOpen = false, onModuleChange, onOverviewScenarioChange, onRecommendationScenarioChange, onElderlyScenarioChange, onLeisureEntertainmentScenarioChange, onReset }) {
  const shellRef = useRef(null);
  const dragStateRef = useRef(null);
  const dragMovedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(() => ({ x: Math.max(VIEWPORT_MARGIN, window.innerWidth - 322), y: Math.max(VIEWPORT_MARGIN, window.innerHeight - 430) }));
  const { page: selectedPage, module: selectedModule } = useMemo(() => findContext(activeModuleId), [activeModuleId]);
  const scenarioOptions = selectedModule.id === "overview"
    ? overviewScenarios
    : selectedModule.id === "recommendations"
      ? recommendationScenarios
      : selectedModule.id === "elderly"
        ? elderlyScenarios
        : selectedModule.id === "leisureEntertainment"
          ? leisureEntertainmentScenarios
      : [];
  const scenarioValue = selectedModule.id === "recommendations" ? recommendationScenario : selectedModule.id === "elderly" ? elderlyScenario : selectedModule.id === "leisureEntertainment" ? leisureEntertainmentScenario : overviewScenario;
  const currentScenario = scenarioOptions.find((item) => item.value === scenarioValue) || scenarioOptions[0];
  const hasScenarios = scenarioOptions.length > 0;

  const constrainPosition = useCallback((nextPosition, rect = shellRef.current?.getBoundingClientRect()) => {
    if (!rect) return nextPosition;
    return {
      x: clamp(nextPosition.x, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, window.innerWidth - rect.width - VIEWPORT_MARGIN)),
      y: clamp(nextPosition.y, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, window.innerHeight - rect.height - VIEWPORT_MARGIN)),
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPosition((current) => constrainPosition(current)));
    return () => window.cancelAnimationFrame(frame);
  }, [open, activeModuleId, constrainPosition]);

  useEffect(() => {
    if (overlayOpen) setOpen(false);
  }, [overlayOpen]);

  useEffect(() => {
    const handleResize = () => setPosition((current) => constrainPosition(current));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [constrainPosition]);

  const startDrag = (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragMovedRef.current = false;
    suppressClickRef.current = false;
    dragStateRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: rect.left, originY: rect.top, rect };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;
    if (Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD) dragMovedRef.current = true;
    if (!dragMovedRef.current) return;
    setPosition(constrainPosition({ x: state.originX + deltaX, y: state.originY + deltaY }, state.rect));
  };

  const endDrag = (event) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    suppressClickRef.current = dragMovedRef.current;
    dragStateRef.current = null;
  };

  const toggleOpen = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setOpen((value) => !value);
  };

  const changePage = (pageId) => {
    const nextPage = acceptanceHierarchy.find((item) => item.id === pageId) || acceptanceHierarchy[0];
    onModuleChange(nextPage.modules[0].id);
  };

  if (overlayOpen) return null;

  return (
    <div ref={shellRef} className={`acceptance-console ${open ? "is-open" : "is-collapsed"}`} style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}>
      {!open ? (
        <button className="acceptance-launcher" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onClick={toggleOpen}><FlaskConical size={17}/><span>场景切换</span></button>
      ) : (
        <aside className="acceptance-workbench" aria-label="场景切换工具">
          <header className="acceptance-drag-handle" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
            <div><GripHorizontal size={16}/><span><b>场景切换工具</b><small>拖动标题栏移动</small></span></div>
            <button onPointerDown={(event) => event.stopPropagation()} onClick={toggleOpen} aria-label="收起场景切换工具"><X size={16}/></button>
          </header>
          <div className="acceptance-body">
            <div className="acceptance-hierarchy">
              <label><span>一级页面</span><div className="acceptance-select-wrap"><select aria-label="一级页面" value={selectedPage.id} onChange={(event) => changePage(event.target.value)}>{acceptanceHierarchy.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select><ChevronDown size={14}/></div></label>
              <label><span>二级模块</span><div className="acceptance-select-wrap"><select aria-label="二级模块" value={selectedModule.id} onChange={(event) => onModuleChange(event.target.value)}>{selectedPage.modules.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select><ChevronDown size={14}/></div></label>
              {selectedModule.objectLabel && <div className="acceptance-object"><span>三级对象</span><b>{selectedModule.objectLabel}</b></div>}
            </div>

            {hasScenarios ? <section className="acceptance-scenario-section"><div className="acceptance-section-title"><span>页面场景</span><em>{currentScenario.status}</em></div><div className="acceptance-select-wrap"><select aria-label="页面场景" value={scenarioValue} onChange={(event) => selectedModule.id === "recommendations" ? onRecommendationScenarioChange(event.target.value) : selectedModule.id === "elderly" ? onElderlyScenarioChange(event.target.value) : selectedModule.id === "leisureEntertainment" ? onLeisureEntertainmentScenarioChange(event.target.value) : onOverviewScenarioChange(event.target.value)}>{scenarioOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select><ChevronDown size={14}/></div><p>{currentScenario.description}</p></section> : <section className="acceptance-empty-section"><b>页面场景</b><p>当前模块使用默认数据与状态。</p></section>}

          </div>
          <footer><a className="acceptance-component-center-link" href="?acceptance&component-center"><Boxes size={14}/>后台组件中心</a><button onClick={onReset}><RefreshCw size={14}/>重置页面状态</button></footer>
        </aside>
      )}
    </div>
  );
}
