import React, { useState, useEffect, useRef } from "react";

interface TabletSimulatorProps {
  children: React.ReactNode;
}

export default function TabletSimulator({ children }: TabletSimulatorProps) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) {
        setScale(1);
        return;
      }

      // Subtract 24px padding/margins to let it breathe nicely and avoid scrollbars
      const containerWidth = Math.max(100, containerRef.current.clientWidth - 24);
      const containerHeight = Math.max(100, containerRef.current.clientHeight - 24);

      const targetWidth = 1920;
      const targetHeight = 1200;

      const scaleX = containerWidth / targetWidth;
      const scaleY = containerHeight / targetHeight;
      const newScale = Math.min(scaleX, scaleY, 1.2); // Cap at 1.2 to prevent excessive upscaling

      setScale(newScale);
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
      className="relative w-screen h-screen bg-[#F5F2EB] flex items-center justify-center p-3 overflow-hidden select-none font-sans"
    >
      <div
        style={{
          width: `${1920 * scale}px`,
          height: `${1200 * scale}px`,
          transition: "width 0.25s ease-out, height 0.25s ease-out",
        }}
        className="relative overflow-hidden bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-2xl select-none shrink-0"
      >
        <div
          style={{
            width: "1920px",
            height: "1200px",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          className="absolute top-0 left-0"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
