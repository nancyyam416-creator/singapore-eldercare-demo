import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowLeft, Battery, Signal, Wifi } from 'lucide-react';

const DEVICE_WIDTH = 450;
const DEVICE_HEIGHT = 1000;

type MobileAppShellProps = {
  title: string;
  children: ReactNode;
  onBack?: () => void;
  backLabel?: string;
};

export default function MobileAppShell({ title, children, onBack, backLabel = '返回' }: MobileAppShellProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area) return;

    const updateScale = () => {
      if (window.matchMedia('(max-width: 639px)').matches) {
        setScale(1);
        return;
      }
      setScale(Math.min(1, area.clientWidth / DEVICE_WIDTH, area.clientHeight / DEVICE_HEIGHT));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(area);
    return () => observer.disconnect();
  }, []);

  return <div ref={areaRef} className="mobile-preview-area" style={{ '--device-scale': scale } as CSSProperties}>
    <div className="mobile-preview-footprint">
      <div className="mobile-preview-transform">
        <div className="mobile-device-frame">
          <div className="mobile-device-notch" aria-hidden="true"><i /></div>
          <div className="mobile-device-screen">
            <div className="mobile-status-bar" aria-label="设备状态">
              <strong>18:26</strong>
              <span><Signal /><b>5G</b><Wifi /><Battery /></span>
            </div>
            <header className="mobile-page-header">
              {onBack && <button className="mobile-header-back" onClick={onBack} aria-label={backLabel}><ArrowLeft /><span>返回</span></button>}
              <h1>{title}</h1>
            </header>
            {children}
            <div className="mobile-home-indicator" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  </div>;
}
