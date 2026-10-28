import React, { useLayoutEffect, useRef, useState } from 'react';

// 只缩放桌面外壳：内部维持 450 × 1000 的既有逻辑尺寸。
export const PhonePreview: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const area = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const element = area.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setScale(Math.min(1, element.clientWidth / 450, element.clientHeight / 1000)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={area} className="phone-preview-area"><div className="phone-preview-footprint" style={{ '--preview-scale': scale } as React.CSSProperties}><div className="phone-preview-transform">{children}</div></div></div>;
};

// 验收台自身使用与老人端一致的固定浮层，右侧保留设备仿真区域。
export const PreviewTools: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="preview-tools-rail">{children}</div>;
