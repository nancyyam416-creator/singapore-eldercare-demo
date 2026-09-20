import { ChevronDown, FlaskConical, GripHorizontal, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const VIEWPORT_MARGIN = 8;
const DRAG_THRESHOLD = 5;

const acceptanceHierarchy = [
  { id: "workbench", label: "工作台", modules: [{ id: "overview", label: "运营概览", objectLabel: "页面整体" }] },
  { id: "elder-service", label: "老人服务", modules: [
    { id: "elderly", label: "老人档案" }, { id: "relations", label: "亲属档案" }, { id: "reminders", label: "提醒事项" },
    { id: "emergencyHelp", label: "紧急求助" }, { id: "familyAlbums", label: "家庭相册" },
  ] },
  { id: "content", label: "运营内容", modules: [
    { id: "recommendations", label: "推荐策略" }, { id: "services", label: "预约服务" },
  ] },
  { id: "community-life", label: "社区生活", modules: [
    { id: "communityAnnouncements", label: "社区公告" }, { id: "lifeInformation", label: "生活资讯" },
    { id: "alertItems", label: "警惕事项" }, { id: "activities", label: "社区活动" }, { id: "communityStaff", label: "社区人员" },
  ] },
  { id: "device-data", label: "设备与数据", modules: [
    { id: "tabletDevices", label: "平板设备" }, { id: "sensorDevices", label: "房间活动传感器" },
    { id: "activity", label: "房间活动" }, { id: "weatherLocations", label: "天气位置" }, { id: "careScripts", label: "关怀话术" },
  ] },
  { id: "system", label: "系统管理", modules: [
    { id: "projects", label: "项目与社区" }, { id: "accounts", label: "账号与角色" },
    { id: "logs", label: "操作日志" }, { id: "settings", label: "基础配置" },
  ] },
];

const overviewScenarios = [
  { value: "normal", label: "正常", description: "展示完整指标、待关注线索与趋势数据。", status: "默认" },
  { value: "noAttention", label: "暂无待关注", description: "待关注指标和列表为空。", status: "空状态" },
  { value: "partial", label: "部分来源失败", description: "提醒来源失败，其他模块继续展示。", status: "部分失败" },
  { value: "allFailed", label: "全部来源失败", description: "指标不以 0 代替失败数据。", status: "失败" },
  { value: "stale", label: "数据过旧", description: "展示固定的过期更新时间与警示。", status: "边界" },
  { value: "noProject", label: "当前账号无项目", description: "展示无数据权限的页面级空状态。", status: "权限" },
];

const recommendationScenarios = [
  { value: "normal", label: "正常排期", description: "按启用状态、生效时间与展示顺序展示当前排期。", status: "默认" },
  { value: "empty", label: "今日暂无内容", description: "今日没有可展示推荐，日历和右侧预览展示空状态。", status: "空状态" },
];

const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);
const findContext = (moduleId) => {
  const page = acceptanceHierarchy.find((item) => item.modules.some((module) => module.id === moduleId)) || acceptanceHierarchy[0];
  return { page, module: page.modules.find((item) => item.id === moduleId) || page.modules[0] };
};

export function AcceptanceWorkbench({ activeModuleId, overviewScenario, recommendationScenario, overlayOpen = false, onModuleChange, onOverviewScenarioChange, onRecommendationScenarioChange, onActivationFailure, onReset }) {
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
      : [];
  const scenarioValue = selectedModule.id === "recommendations" ? recommendationScenario : overviewScenario;
  const currentScenario = scenarioOptions.find((item) => item.value === scenarioValue) || scenarioOptions[0];
  const hasScenarios = scenarioOptions.length > 0;
  const hasActions = selectedModule.id === "tabletDevices";

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

            {hasScenarios ? <section className="acceptance-scenario-section"><div className="acceptance-section-title"><span>页面场景</span><em>{currentScenario.status}</em></div><div className="acceptance-select-wrap"><select aria-label="页面场景" value={scenarioValue} onChange={(event) => selectedModule.id === "recommendations" ? onRecommendationScenarioChange(event.target.value) : onOverviewScenarioChange(event.target.value)}>{scenarioOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select><ChevronDown size={14}/></div><p>{currentScenario.description}</p></section> : <section className="acceptance-empty-section"><b>页面场景</b><p>当前模块使用默认数据与状态。</p></section>}

            {hasActions && <section className="acceptance-action-section"><div className="acceptance-section-title"><span>一次性动作</span><em>平板激活</em></div><p>打开待使用激活码弹窗后，可重复注入失败结果。</p><div className="acceptance-actions"><button onClick={() => onActivationFailure("code_invalid")}>激活码错误</button><button onClick={() => onActivationFailure("offline")}>网络异常</button></div></section>}
          </div>
          <footer><button onClick={onReset}><RefreshCw size={14}/>重置页面状态</button></footer>
        </aside>
      )}
    </div>
  );
}
