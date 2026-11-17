import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, GripHorizontal, PanelRightOpen, MousePointerClick } from 'lucide-react';
import './acceptance-workbench.css';

export type AcceptancePageId = 'home' | 'family' | 'reminders' | 'activities' | 'services' | 'profile';
export type AcceptanceModuleId =
  | 'home-schedule'
  | 'home-family'
  | 'family-album'
  | 'family-messages'
  | 'reminder-today'
  | 'reminder-rules'
  | 'activity-list'
  | 'activity-detail'
  | 'community-alerts'
  | 'service-list'
  | 'service-detail'
  | 'service-records'
  | 'profile-guardians'
  | 'profile-binding'
  | 'profile-location';

type ScenarioOption = { value: string; label: string; description: string; status: string };
type ActionOption = { id: string; label: string };
type AcceptanceObject = { id: string; label: string; scenarios: ScenarioOption[]; actions?: ActionOption[] };
type AcceptanceModule = { id: AcceptanceModuleId; label: string; scenarios?: ScenarioOption[]; objects?: AcceptanceObject[]; actions?: ActionOption[] };
type AcceptancePage = { id: AcceptancePageId; label: string; modules: AcceptanceModule[] };

const pages: AcceptancePage[] = [
  { id: 'home', label: '首页', modules: [
    { id: 'home-schedule', label: '今日安排', scenarios: [
      { value: 'default', label: '默认安排', description: '展示已完成、超时、即将开始和稍后提醒。', status: '正常' },
      { value: 'completed', label: '全部完成', description: '四项安排均显示为已完成。', status: '成功' },
      { value: 'empty', label: '暂无安排', description: '今日没有用药或活动安排。', status: '空状态' },
    ], actions: [{ id: 'open-reminders', label: '进入提醒页' }] },
    { id: 'home-family', label: '家人动态摘要', scenarios: [
      { value: 'default', label: '有动态', description: '展示家人分享和留言入口。', status: '正常' },
      { value: 'empty', label: '暂无动态', description: '首页摘要显示暂无家人分享。', status: '空状态' },
    ], actions: [{ id: 'open-family', label: '进入家庭页' }] },
  ] },
  { id: 'family', label: '家庭', modules: [
    { id: 'family-album', label: '家庭相册', scenarios: [
      { value: 'default', label: '已有影像', description: '展示固定的照片与视频列表。', status: '正常' },
      { value: 'empty', label: '暂无影像', description: '相册为空，保留正式发布入口。', status: '空状态' },
    ], actions: [{ id: 'open-photo', label: '打开发布相册' }] },
    { id: 'family-messages', label: '家人留言', scenarios: [
      { value: 'default', label: '已绑定家人', description: '先选择家人，再进入该家人的独立留言会话。', status: '正常' },
      { value: 'empty', label: '暂无留言', description: '家人列表正常，进入会话后展示无留言状态。', status: '空状态' },
      { value: 'no_family', label: '暂无家人', description: '尚未绑定家人，无法发起留言。', status: '空状态' },
    ], actions: [{ id: 'start-family-voice', label: '开始录音留言' }] },
  ] },
  { id: 'reminders', label: '提醒', modules: [
    { id: 'reminder-today', label: '今天', scenarios: [
      { value: 'default', label: '有待完成', description: '展示固定的已完成与待完成提醒。', status: '正常' },
      { value: 'completed', label: '全部完成', description: '当天提醒均标记为已完成。', status: '成功' },
      { value: 'empty', label: '今日为空', description: '当天没有生成提醒实例。', status: '空状态' },
    ], actions: [{ id: 'open-reminder', label: '打开新增提醒' }] },
    { id: 'reminder-rules', label: '全部提醒', scenarios: [
      { value: 'default', label: '已有规则', description: '展示启用与停用的提醒规则。', status: '正常' },
      { value: 'empty', label: '暂无规则', description: '提醒规则列表为空。', status: '空状态' },
    ], actions: [{ id: 'open-reminder', label: '打开新增提醒' }] },
  ] },
  { id: 'activities', label: '社区', modules: [
    { id: 'activity-list', label: '活动列表', scenarios: [
      { value: 'default', label: '近期活动', description: '展示与老人平板端一致的三项社区活动。', status: '正常' },
      { value: 'empty', label: '暂无活动', description: '近期没有可报名活动。', status: '空状态' },
    ], actions: [{ id: 'open-first-activity', label: '进入首项活动' }] },
    { id: 'activity-detail', label: '活动详情', scenarios: [
      { value: 'default', label: '尚未选择', description: '展示活动详情和参加操作。', status: '正常' },
      { value: 'interested', label: '我想参加', description: '展示老人已选择“我想参加”。', status: '已选择' },
      { value: 'submission_failure', label: '提交失败', description: '保留老人当前选择并允许重新提交。', status: '可重试' },
    ] },
    { id: 'community-alerts', label: '警惕事项', scenarios: [
      { value: 'default', label: '未读列表', description: '展示与老人平板端一致的三条警惕事项。', status: '未读' },
      { value: 'detail', label: '事项详情', description: '打开详情后记录已阅读，并可朗读正文。', status: '已阅读' },
    ], actions: [{ id: 'open-first-alert', label: '打开首项详情' }] },
  ] },
  { id: 'services', label: '特约服务', modules: [
    { id: 'service-list', label: '服务列表', scenarios: [
      { value: 'default', label: '默认', description: '展示当前社区可用服务、明细数量与参考价格区间。', status: '正常' },
      { value: 'category_off', label: '分类关闭', description: '不展示分类入口、标签或导航，全部有效服务按后台顺序平铺。', status: '平铺' },
      { value: 'category_on', label: '分类开启', description: '展示后台启用且已关联服务的分类，分类与服务均按后台顺序排列。', status: '分类展示' },
      { value: 'empty', label: '暂无服务', description: '当前社区没有可展示的服务，呈现正式空状态。', status: '空状态' },
    ] },
    { id: 'service-detail', label: '服务详情', scenarios: [
      { value: 'detail', label: '图文服务详情', description: '展示头图、服务内容、注意事项、详情图和完整服务信息。', status: '正常' },
      { value: 'family_inquiry', label: '家人询问预约结果', description: '仅在子女明确询问后展示，并标明询问人；普通拨号不会自动弹出问题。', status: '待答复' },
    ] },
    { id: 'service-records', label: '协助记录', objects: [
      { id: 'contact', label: '我的联系记录', scenarios: [
        { value: 'record_contact_unasked', label: '未询问', description: '仅记录老人拨打过服务电话，不附加任何待处理含义。', status: '已记录' },
        { value: 'record_contact_inquiry', label: '待答复', description: '家人明确询问预约结果，突出询问人并提供三种答复。', status: '待答复' },
        { value: 'record_contact_answered', label: '已答复', description: '展示老人实际答复结果，本场景为暂时不需要。', status: '已答复' },
      ] },
      { id: 'family-help', label: '请家人帮忙', scenarios: [
        { value: 'record_family_pending', label: '待处理', description: '已通知绑定家人，等待家人开始联系。', status: '待处理' },
        { value: 'record_family_handling', label: '处理中', description: '家人正在联系服务商。', status: '处理中' },
        { value: 'record_family_handled', label: '已处理', description: '家人已完成协助，可在真实列表中验收评价入口。', status: '已处理' },
        { value: 'record_family_expired', label: '已失效', description: '家人未在 48 小时内处理，历史保留且可重新发起。', status: '已失效' },
      ] },
    ] },
  ] },
  { id: 'profile', label: '我的', modules: [
    { id: 'profile-guardians', label: '家庭守护人', scenarios: [
      { value: 'default', label: '已有守护人', description: '展示已连线的女儿和儿子。', status: '正常' },
      { value: 'empty', label: '暂无守护人', description: '守护人列表为空，保留家人绑定确认入口。', status: '空状态' },
    ], actions: [{ id: 'open-binding', label: '打开绑定确认' }] },
    { id: 'profile-binding', label: '家人绑定确认', scenarios: [
      { value: 'pending', label: '等待确认', description: '展示申请人和确认操作。', status: '待处理' },
      { value: 'success', label: '绑定成功', description: '展示绑定成功结果。', status: '成功' },
      { value: 'rejected', label: '已拒绝', description: '展示老人手机端拒绝申请的结果。', status: '已处理' },
      { value: 'tablet-approved', label: '平板已同意', description: '展示申请已由老人平板端同意，手机端不可重复处理。', status: '已同步' },
      { value: 'tablet-rejected', label: '平板已拒绝', description: '展示申请已由老人平板端拒绝，手机端不可重复处理。', status: '已同步' },
      { value: 'network', label: '网络失败', description: '展示可重试的网络失败结果。', status: '可重试' },
      { value: 'expired', label: '申请失效', description: '展示申请已失效结果。', status: '失败' },
    ] },
    { id: 'profile-location', label: '位置共享', scenarios: [
      { value: 'prompt', label: '等待授权', description: '展示 Mock 权限选择，不读取真实定位。', status: '待授权' },
      { value: 'sharing', label: '共享中', description: '展示模拟位置和最近一次前台上报时间。', status: '共享中' },
      { value: 'denied', label: '已拒绝', description: '展示权限被拒绝后的重新选择入口。', status: '未授权' },
      { value: 'off', label: '已关闭', description: '保留最近一次 Mock 上报记录，可重新开启。', status: '已关闭' },
    ], actions: [{ id: 'open-location', label: '打开位置共享' }] },
  ] },
];

type Props = {
  portalUrl: string;
  pageId: AcceptancePageId;
  moduleId: AcceptanceModuleId;
  onContextChange: (pageId: AcceptancePageId, moduleId: AcceptanceModuleId) => void;
  onScenarioChange: (pageId: AcceptancePageId, moduleId: AcceptanceModuleId, scenario: string) => void;
  onAction: (action: string) => void;
};

const margin = 8;
const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum);

export default function AcceptanceWorkbench({ portalUrl, pageId, moduleId, onContextChange, onScenarioChange, onAction }: Props) {
  const initialPosition = () => ({ x: Math.max(margin, window.innerWidth - 60), y: 18 });
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [scenarioByModule, setScenarioByModule] = useState<Record<string, string>>({});
  const [objectByModule, setObjectByModule] = useState<Partial<Record<AcceptanceModuleId, string>>>({});
  const shellRef = useRef<HTMLDivElement>(null);
  const closedPositionRef = useRef(initialPosition());
  const movedRef = useRef(false);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number; width: number; height: number } | null>(null);

  const currentPage = pages.find(page => page.id === pageId) ?? pages[0];
  const currentModule = currentPage.modules.find(module => module.id === moduleId) ?? currentPage.modules[0];
  const currentObject = currentModule.objects?.find(item => item.id === objectByModule[currentModule.id]) ?? currentModule.objects?.[0];
  const currentScenarios = currentObject?.scenarios ?? currentModule.scenarios ?? [];
  const scenarioKey = `${currentModule.id}:${currentObject?.id ?? 'module'}`;
  const currentScenarioValue = scenarioByModule[scenarioKey] ?? currentScenarios[0].value;
  const currentScenario = currentScenarios.find(item => item.value === currentScenarioValue) ?? currentScenarios[0];

  const clampCurrentPosition = () => {
    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition(current => ({
      x: clamp(current.x, margin, Math.max(margin, window.innerWidth - rect.width - margin)),
      y: clamp(current.y, margin, Math.max(margin, window.innerHeight - rect.height - margin)),
    }));
  };

  useEffect(() => {
    window.addEventListener('resize', clampCurrentPosition);
    return () => window.removeEventListener('resize', clampCurrentPosition);
  });

  useEffect(() => {
    requestAnimationFrame(clampCurrentPosition);
  }, [open, pageId, moduleId]);

  const beginDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) return;
    movedRef.current = false;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: position.x, originY: position.y, width: rect.width, height: rect.height };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) >= 5) movedRef.current = true;
    setPosition({
      x: clamp(drag.originX + dx, margin, Math.max(margin, window.innerWidth - drag.width - margin)),
      y: clamp(drag.originY + dy, margin, Math.max(margin, window.innerHeight - drag.height - margin)),
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
  };

  const moveWithKeyboard = (event: React.KeyboardEvent<HTMLElement>) => {
    const offsets: Record<string, [number, number]> = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition(current => ({
      x: clamp(current.x + offset[0], margin, Math.max(margin, window.innerWidth - rect.width - margin)),
      y: clamp(current.y + offset[1], margin, Math.max(margin, window.innerHeight - rect.height - margin)),
    }));
  };

  const openPanel = () => {
    if (movedRef.current) { movedRef.current = false; return; }
    closedPositionRef.current = position;
    const panelWidth = Math.min(300, window.innerWidth - margin * 2);
    const panelHeight = Math.min(640, window.innerHeight - margin * 2);
    const nextX = position.x > window.innerWidth / 2 ? window.innerWidth - panelWidth - margin : position.x;
    const nextY = position.y > window.innerHeight / 2 ? position.y + 52 - panelHeight : position.y;
    setPosition({ x: clamp(nextX, margin, window.innerWidth - panelWidth - margin), y: clamp(nextY, margin, window.innerHeight - panelHeight - margin) });
    setOpen(true);
  };

  const closePanel = () => {
    setOpen(false);
    setPosition(closedPositionRef.current);
  };

  const selectPage = (nextPageId: AcceptancePageId) => {
    const nextPage = pages.find(page => page.id === nextPageId) ?? pages[0];
    const nextModule = nextPage.modules[0];
    const nextScenarios = nextModule.objects?.[0]?.scenarios ?? nextModule.scenarios ?? [];
    const nextScenario = nextScenarios[0].value;
    onContextChange(nextPage.id, nextModule.id);
    onScenarioChange(nextPage.id, nextModule.id, nextScenario);
  };

  const selectModule = (nextModuleId: AcceptanceModuleId) => {
    const nextModule = currentPage.modules.find(module => module.id === nextModuleId) ?? currentPage.modules[0];
    const nextObject = nextModule.objects?.[0];
    if (nextObject) setObjectByModule(current => ({ ...current, [nextModule.id]: nextObject.id }));
    const nextScenarios = nextObject?.scenarios ?? nextModule.scenarios ?? [];
    const nextScenario = nextScenarios[0].value;
    onContextChange(currentPage.id, nextModule.id);
    onScenarioChange(currentPage.id, nextModule.id, nextScenario);
  };

  const shellStyle = useMemo(() => ({ left: Math.round(position.x), top: Math.round(position.y) }), [position]);

  return createPortal(
    <div ref={shellRef} className={`acceptance-console ${open ? 'is-open' : ''}`} style={shellStyle}>
      {!open ? <button className="acceptance-trigger" type="button" aria-label="展开交互验收台，可拖动" title="交互验收台" aria-expanded="false" onKeyDown={moveWithKeyboard} onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onClick={openPanel}><span className="acceptance-trigger-icon"><PanelRightOpen /></span></button> :
      <div className="acceptance-frame">
        <div role="button" tabIndex={0} aria-label="拖动验收台，方向键微调" className="acceptance-handle" onKeyDown={moveWithKeyboard} onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}><GripHorizontal />拖动工具栏</div>
        <section className="acceptance-panel" aria-label="交互验收台">
          <header className="acceptance-panel-header">
            <div className="acceptance-collapse"><span><MousePointerClick /><strong>交互验收台</strong></span><small>用于切换页面场景，验收不同交互状态</small></div>
            <button className="acceptance-header-reset" type="button" onClick={closePanel}><PanelRightOpen />收起</button>
          </header>
          <div className="acceptance-body">
            <label>一级页面<select value={currentPage.id} onChange={event => selectPage(event.target.value as AcceptancePageId)}>{pages.map(page => <option key={page.id} value={page.id}>{page.label}</option>)}</select></label>
            <label>二级模块<select value={currentModule.id} onChange={event => selectModule(event.target.value as AcceptanceModuleId)}>{currentPage.modules.map(module => <option key={module.id} value={module.id}>{module.label}</option>)}</select></label>
            {currentModule.objects && currentObject && <label>三级对象<select value={currentObject.id} onChange={event => { const nextObject = currentModule.objects?.find(item => item.id === event.target.value) ?? currentModule.objects?.[0]; if (!nextObject) return; setObjectByModule(current => ({ ...current, [currentModule.id]: nextObject.id })); onScenarioChange(currentPage.id, currentModule.id, nextObject.scenarios[0].value); }}>{currentModule.objects.map(object => <option key={object.id} value={object.id}>{object.label}</option>)}</select></label>}
            <div className="acceptance-section">
              <span className="acceptance-label">验收场景</span>
              <div className="acceptance-options">{currentScenarios.map(scenario => <button type="button" key={scenario.value} className={scenario.value === currentScenario.value ? 'active' : ''} onClick={() => { setScenarioByModule(current => ({ ...current, [scenarioKey]: scenario.value })); onScenarioChange(currentPage.id, currentModule.id, scenario.value); }}>{scenario.label}</button>)}</div>
              <div className="acceptance-description"><b>{currentScenario.status}</b><p>{currentScenario.description}</p></div>
            </div>
            {!!(currentObject?.actions ?? currentModule.actions)?.length && <div className="acceptance-section"><span className="acceptance-label">一次性动作</span><div className="acceptance-actions">{(currentObject?.actions ?? currentModule.actions)!.map(action => <button type="button" key={action.id} onClick={() => onAction(action.id)}>{action.label}</button>)}</div></div>}
          </div>
          <footer><a className="acceptance-portal-link" href={portalUrl}><ArrowLeft />返回 U2G智慧养老</a></footer>
        </section>
      </div>}
    </div>,
    document.body,
  );
}
