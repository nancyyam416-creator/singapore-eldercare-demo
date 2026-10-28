// 外壳同步自老人小程序端 AcceptanceWorkbench；业务场景通过 children 保留。
import React, { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, GripHorizontal, PanelRightOpen, MousePointerClick, RotateCcw } from 'lucide-react';
import './acceptance-shell.css';
const margin = 8;
const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum);
export function AcceptanceShell({ children, portalUrl, contextKey, onReset }: { children: React.ReactNode; portalUrl: string; contextKey: string; onReset: () => void }) {
  const initialPosition = () => ({ x: Math.max(margin, window.innerWidth - 60), y: 18 });
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const shellRef = useRef<HTMLDivElement>(null);
  const movedRef = useRef(false);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number; width: number; height: number } | null>(null);

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
  }, [open, contextKey]);

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
    const panelWidth = Math.min(300, window.innerWidth - margin * 2);
    const panelHeight = Math.min(640, window.innerHeight - margin * 2);
    const nextX = position.x > window.innerWidth / 2 ? window.innerWidth - panelWidth - margin : position.x;
    const nextY = position.y > window.innerHeight / 2 ? position.y + 52 - panelHeight : position.y;
    setPosition({ x: clamp(nextX, margin, window.innerWidth - panelWidth - margin), y: clamp(nextY, margin, window.innerHeight - panelHeight - margin) });
    setOpen(true);
  };

  return createPortal(
    <div ref={shellRef} className={`acceptance-console ${open ? 'is-open' : ''}`} style={{ left: Math.round(position.x), top: Math.round(position.y) }}>
      {!open ? <button className="acceptance-trigger" type="button" aria-label="展开交互验收台，可拖动" title="交互验收台" aria-expanded="false" onKeyDown={moveWithKeyboard} onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onClick={openPanel}><span className="acceptance-trigger-icon"><PanelRightOpen /></span></button> :
      <div className="acceptance-frame">
        <div role="button" tabIndex={0} aria-label="拖动验收台，方向键微调" className="acceptance-handle" onKeyDown={moveWithKeyboard} onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}><GripHorizontal />拖动工具栏</div>
        <section className="acceptance-panel" aria-label="交互验收台">
          <header className="acceptance-panel-header">
            <div className="acceptance-collapse"><span><MousePointerClick /><strong>交互验收台</strong></span><small>用于切换页面场景，验收不同交互状态</small></div>
            <button className="acceptance-header-reset" type="button" onClick={() => setOpen(false)}><PanelRightOpen />收起</button>
          </header>
          <div className="child-acceptance-body">{children}</div>
          <footer><button className="acceptance-reset" type="button" onClick={onReset}><RotateCcw />恢复固定基线</button><button type="button" onClick={() => { setPosition(initialPosition()); requestAnimationFrame(clampCurrentPosition); }}>恢复面板位置</button><a className="acceptance-portal-link" href={portalUrl}><ArrowLeft />返回 U2G智慧养老</a></footer>
        </section>
      </div>}
    </div>, document.body
  );
}
