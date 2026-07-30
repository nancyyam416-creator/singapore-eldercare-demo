import React, { useState, useEffect } from "react";
import { CheckCircle2, RefreshCw, ShieldAlert, XCircle, Siren, UserRoundCheck, WifiOff } from "lucide-react";

export type EmergencyAcceptanceScenario = "default" | "connected" | "call-failure";

interface EmergencyModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  scenario?: EmergencyAcceptanceScenario;
}

export default function EmergencyModal({ isOpen, onDismiss, scenario = "default" }: EmergencyModalProps) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!isOpen) return;
    setCountdown(10);

    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const isResultScenario = scenario !== "default";

  return (
    <div className="fixed inset-0 bg-red-950/95 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-8 select-none text-white font-sans animate-fade-in">
      
      {/* Heavy glowing warning beacons */}
      <div className="absolute top-10 left-10 flex items-center gap-3 bg-red-500/20 border border-red-500/30 px-6 py-3 rounded-full">
        <Siren className="w-6 h-6 text-red-400 animate-bounce" />
        <span className="text-sm font-black tracking-wide text-red-200">
          {scenario === "connected" ? "紧急求助已接通" : scenario === "call-failure" ? "紧急呼叫未成功" : "一键紧急救助响应中"}
        </span>
      </div>

      <div className="absolute top-10 right-10 flex items-center gap-3 bg-emerald-500/20 border border-emerald-500/30 px-6 py-3 rounded-full">
        <UserRoundCheck className="w-5 h-5 text-emerald-300" />
        <span className="text-sm font-bold tracking-wide text-emerald-200">
          {scenario === "connected" ? "救助人员正在处理" : scenario === "call-failure" ? "等待重新呼叫" : "安全守护专员已就绪"}
        </span>
      </div>

      <div className="max-w-[850px] w-full text-center flex flex-col items-center">
        
        {/* Pulsing Emergency Beacon Card */}
        <div className="relative w-32 h-32 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border-2 border-red-500/30 animate-sos-pulse">
          <ShieldAlert className="w-16 h-16 text-white" />
        </div>

        {/* Big Warning Texts */}
        <h2 className="text-5xl font-black tracking-wider mb-2">
          {scenario === "connected" ? "紧急呼叫已接通" : scenario === "call-failure" ? "紧急呼叫未成功" : "已触发一键紧急呼救"}
        </h2>
        <p className="text-red-200 text-lg font-bold tracking-wide max-w-[620px] mx-auto leading-relaxed">
          {scenario === "connected"
            ? "救助人员已收到您的求助，请保持设备开启并按照工作人员提示等待救援。"
            : scenario === "call-failure"
              ? "当前网络或呼叫服务异常，系统没有成功发出求助，请立即重新呼叫。"
              : "系统正在向您的家人和 120 急救中心发起紧急求助，请不要离开屏幕。"}
        </p>

        {/* First-call countdown, followed by an ongoing-call state */}
        <div
          className="my-10 font-sans flex flex-col items-center justify-center gap-4"
          role="status"
          aria-live="polite"
        >
          {scenario === "connected" ? (
            <>
              <CheckCircle2 className="h-14 w-14 text-emerald-300" aria-hidden="true" />
              <strong className="text-4xl font-black text-white tracking-wide">救助人员正在处理</strong>
              <span className="text-xl font-bold text-emerald-200">请保持通话并留在安全位置</span>
            </>
          ) : scenario === "call-failure" ? (
            <>
              <WifiOff className="h-14 w-14 text-amber-300" aria-hidden="true" />
              <strong className="text-4xl font-black text-white tracking-wide">求助尚未发出</strong>
              <span className="text-xl font-bold text-amber-200">请重新呼叫，或使用电话拨打 120</span>
            </>
          ) : countdown > 0 ? (
            <>
              <span className="text-xl font-bold text-red-200">首轮呼叫剩余</span>
              <div className="flex items-baseline justify-center gap-3">
                <strong className="text-8xl font-black text-white leading-none tabular-nums">
                  {countdown}
                </strong>
                <span className="text-3xl font-black text-red-200">秒</span>
              </div>
              <span className="text-xl font-bold text-red-200">正在呼叫，请稍候</span>
            </>
          ) : (
            <>
              <span className="relative flex h-10 w-10" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-70" />
                <span className="relative inline-flex h-10 w-10 rounded-full bg-red-400" />
              </span>
              <strong className="text-4xl font-black text-white tracking-wide">
                暂未接通，正在继续呼叫
              </strong>
              <span className="text-xl font-bold text-red-200">
                请不要离开，继续等待联系
              </span>
            </>
          )}
        </div>

        {/* Simple family notification status */}
        <div className="w-[620px] bg-black/40 border border-white/5 rounded-2xl px-6 py-5 mb-10 text-center">
          <p className="text-red-100 text-lg font-bold tracking-wide">
            {scenario === "connected"
              ? "救助正在处理中，请保持设备开启。"
              : scenario === "call-failure"
                ? "求助尚未发出，请不要关闭设备。"
                : "求助仍在进行，请保持设备开启。"}
          </p>
        </div>

        {/* Cancel Button - Large tactile safe touch box */}
        <button
          onClick={onDismiss}
          className="flex items-center justify-center gap-3.5 px-12 py-5 bg-white text-red-950 font-black text-xl rounded-2xl shadow-2xl hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
        >
          {scenario === "call-failure" ? <RefreshCw className="w-6 h-6 text-red-700" /> : <XCircle className="w-6 h-6 text-red-700" />}
          <span>{scenario === "call-failure" ? "返回并重新呼叫" : isResultScenario ? "完成并返回首页" : "误触，点击取消呼救"}</span>
        </button>

        {!isResultScenario && <span className="text-xs text-red-300 mt-4 tracking-wider">
          温馨提示：点击取消将向家人发送“误触报平安”短信，请放心点击。
        </span>}
      </div>

    </div>
  );
}
