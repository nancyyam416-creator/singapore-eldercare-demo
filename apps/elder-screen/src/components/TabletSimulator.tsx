import React, { useState, useEffect, useRef } from "react";

interface TabletSimulatorProps {
  children: React.ReactNode;
}

const TABLET_WIDTH = 1920;
const TABLET_HEIGHT = 1200;

const getFitScale = (width: number, height: number) => {
  if (width <= 0 || height <= 0) return 1;
  return Math.min(width / TABLET_WIDTH, height / TABLET_HEIGHT);
};

export default function TabletSimulator({ children }: TabletSimulatorProps) {
  const [scale, setScale] = useState(() => (
    typeof window === "undefined" ? 1 : getFitScale(window.innerWidth, window.innerHeight)
  ));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) {
        setScale(1);
        return;
      }

      setScale(getFitScale(containerRef.current.clientWidth, containerRef.current.clientHeight));
    };

    window.addEventListener("resize", handleResize);
    const timer = setTimeout(handleResize, 100);

    const observer = new ResizeObserver(() => {
      handleResize();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tablet-preview-viewport relative w-screen h-screen bg-[#F5F2EB] flex items-center justify-center overflow-hidden select-none font-sans"
    >
      <div
        style={{
          width: `${TABLET_WIDTH * scale}px`,
          height: `${TABLET_HEIGHT * scale}px`,
        }}
        className="tablet-preview-frame relative overflow-hidden bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] select-none shrink-0"
      >
        <div
          style={{
            width: `${TABLET_WIDTH}px`,
            height: `${TABLET_HEIGHT}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          className="tablet-preview-artboard absolute top-0 left-0"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
