import { useEffect, useState } from "react";
import { Check, CircleX, Headphones, Minimize2, PhoneCall, PhoneOff, RefreshCw, UserRoundCheck, X } from "lucide-react";
import {
  createEmergencyAssistanceEvent,
  emergencyCallSequenceAssumption,
  emergencyCallCenterTarget,
  getEmergencyScenarioTargets,
  onlineAssistanceCompletionResult,
  type EmergencyAcceptanceScenario,
  type EmergencyAssistanceEvent,
  type EmergencyAssistanceStatus,
  type EmergencyCallAttempt,
  type EmergencyCallTarget,
} from "../emergency-assistance";

export type { EmergencyAcceptanceScenario } from "../emergency-assistance";

type AssistanceStage = "confirm" | "contacting" | "connected" | "failed" | "cancelled";

interface EmergencyModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  scenario?: EmergencyAcceptanceScenario;
  event: EmergencyAssistanceEvent | null;
  onEventChange: (event: EmergencyAssistanceEvent | null) => void;
}

const getInitialStage = (event: EmergencyAssistanceEvent | null): AssistanceStage => {
  if (!event) return "confirm";
  if (event.status === "已取消") return "cancelled";
  if (event.status === "待接听") return "contacting";
  if (event.status === "未接通" || event.status === "待回拨") return "failed";
  return "connected";
};

const getAssistanceStatusLabel = (status: EmergencyAssistanceStatus | undefined) => {
  if (status === "待接听") return "正在连接";
  if (status === "未接通" || status === "待回拨") return "暂未接通";
  if (status === "已取消") return "已取消";
  if (status === "处理中" || status === "需跟进" || status === "已完成") return "已接听";
  return "准备连接";
};

export default function EmergencyModal({ isOpen, onDismiss, scenario = "normal-connected", event, onEventChange }: EmergencyModalProps) {
  const [stage, setStage] = useState<AssistanceStage>("confirm");
  const [orderedTargets, setOrderedTargets] = useState<EmergencyCallTarget[]>([]);
  const [activeTargetIndex, setActiveTargetIndex] = useState(0);
  const [activeTargetType, setActiveTargetType] = useState<"contact" | "call-center">("call-center");

  useEffect(() => {
    if (!isOpen) return;
    const targets = event?.callRoute?.orderedTargets ?? getEmergencyScenarioTargets(scenario);
    const activeId = event?.callRoute?.activeTargetType === "call-center" ? emergencyCallCenterTarget.id : event?.callRoute?.activeContactId;
    const activeIndex = Math.max(0, targets.findIndex((target) => target.id === activeId));
    setOrderedTargets(targets);
    setActiveTargetIndex(activeIndex);
    setActiveTargetType(event?.callRoute?.activeTargetType ?? targets[0]?.targetType ?? "call-center");
    setStage(getInitialStage(event));
  }, [isOpen, scenario]);

  if (!isOpen) return null;

  const activeTarget = orderedTargets[activeTargetIndex] ?? emergencyCallCenterTarget;
  const activeTargetName = activeTarget.name;

  const createEvent = () => {
    const nextEvent = createEmergencyAssistanceEvent(scenario, "待接听", orderedTargets);
    onEventChange(nextEvent);
    setActiveTargetIndex(0);
    setActiveTargetType(orderedTargets[0]?.targetType ?? "call-center");
    setStage("contacting");
  };

  const updateRoute = (current: EmergencyAssistanceEvent, updates: Partial<EmergencyAssistanceEvent["callRoute"]>) => ({
    ...current,
    callRoute: { ...current.callRoute, ...updates },
  });

  const connectCurrentTarget = () => {
    if (!event) return;
    const attempt: EmergencyCallAttempt = {
      targetId: activeTarget.id,
      targetName: activeTargetName,
      targetType: activeTargetType,
      result: "已接通",
    };
    const nextEvent = updateRoute(event, {
      attempts: [...event.callRoute.attempts, attempt],
      activeTargetType,
      activeTargetName,
      activeContactId: activeTargetType === "contact" ? activeTarget.id : null,
    });
    onEventChange({
      ...nextEvent,
      status: "处理中",
      callCenter: activeTargetType === "call-center"
        ? { ...nextEvent.callCenter, status: "已接听", answeredAt: "Mock 已接听" }
        : nextEvent.callCenter,
    });
    setStage("connected");
  };

  const markCurrentTargetUnanswered = () => {
    if (!event) return;
    const attempt: EmergencyCallAttempt = {
      targetId: activeTarget.id,
      targetName: activeTargetName,
      targetType: activeTargetType,
      result: "未接通",
    };
    const attempts = [...event.callRoute.attempts, attempt];
    if (activeTargetIndex < orderedTargets.length - 1) {
      const nextIndex = activeTargetIndex + 1;
      const nextTarget = orderedTargets[nextIndex];
      setActiveTargetIndex(nextIndex);
      setActiveTargetType(nextTarget.targetType);
      onEventChange({ ...updateRoute(event, { attempts, activeTargetType: nextTarget.targetType, activeTargetName: nextTarget.name, activeContactId: nextTarget.targetType === "contact" ? nextTarget.id : null }), status: "待接听" });
      return;
    }
    onEventChange({ ...updateRoute(event, { attempts }), status: "未接通", callCenter: activeTargetType === "call-center" ? { ...event.callCenter, status: "未接通", answeredAt: "" } : event.callCenter });
    setStage("failed");
  };

  const cancelConnection = () => {
    if (!event) return;
    onEventChange({
      ...event,
      status: "已取消",
      callCenter: { ...event.callCenter, status: "待接听", answeredAt: "" },
    });
    setStage("cancelled");
  };

  const retryContact = () => {
    if (!event) return;
    const firstTarget = orderedTargets[0] ?? emergencyCallCenterTarget;
    setActiveTargetIndex(0);
    setActiveTargetType(firstTarget.targetType);
    onEventChange({ ...updateRoute(event, { activeTargetType: firstTarget.targetType, activeTargetName: firstTarget.name, activeContactId: firstTarget.targetType === "contact" ? firstTarget.id : null }), status: "待接听", callCenter: { ...event.callCenter, status: "待接听" } });
    setStage("contacting");
  };

  const hangUpCall = () => {
    if (!event) return;
    onEventChange({
      ...event,
      status: "已完成",
      callCenter: activeTargetType === "call-center" ? { ...event.callCenter, status: "已完成" } : event.callCenter,
      completedAt: "2026-07-28 10:06:35",
      resultSummary: activeTargetType === "call-center" ? onlineAssistanceCompletionResult.summary : `${activeTargetName}已结束本次 Mock 通话`,
      resultNote: activeTargetType === "call-center" ? onlineAssistanceCompletionResult.note : "本记录仅用于 L2 交互验收，未发起真实呼叫。",
    });
    onDismiss();
  };

  if (stage === "confirm") {
    const firstTarget = orderedTargets[0] ?? emergencyCallCenterTarget;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#071018]/85 p-8 backdrop-blur-md select-none">
        <section className="w-full max-w-[860px] overflow-hidden rounded-[34px] border-2 border-[#D86A5C] bg-[#F9F7F2] text-[#192B25] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="assistance-confirm-title">
          <div className="flex max-h-[88vh] flex-col items-center overflow-y-auto px-12 pb-11 pt-9 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#FCE9E5] text-[#C2473B]"><PhoneCall className="h-10 w-10" aria-hidden="true" /></div>
            <p className="mb-2 text-[18px] font-black text-[#A43E35]">在线协助</p>
            <h2 id="assistance-confirm-title" className="text-[36px] font-black tracking-tight">{firstTarget.targetType === "call-center" ? "立即连接乐龄呼叫中心？" : `先联系${firstTarget.name}？`}</h2>
            <p className="mt-3 max-w-[680px] text-[20px] font-bold leading-relaxed text-[#52635C]">{`确认后将先进行 Mock 呼叫${firstTarget.name}。`}</p>
            {orderedTargets.length > 1 && <div className="mt-5 grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border-2 border-[#D8D5CE] bg-white p-4 text-left" aria-label="本次呼叫路径">
              <span className="rounded-xl bg-[#EDF7F1] px-4 py-3"><small className="block text-[13px] font-black text-[#66756E]">首先联系</small><strong className="mt-1 block text-[18px]">{firstTarget.name}</strong></span>
              <span className="text-[18px] font-black text-[#8A9690]">未接通后</span>
              <span className="rounded-xl bg-[#F3F5F2] px-4 py-3"><small className="block text-[13px] font-black text-[#66756E]">按已保存顺序继续</small><strong className="mt-1 block text-[18px]">依次联系后续对象</strong></span>
            </div>}
            <p className="mt-4 w-full rounded-xl border border-[#D6B46F] bg-[#FFF8E8] px-4 py-3 text-left text-[14px] font-bold leading-relaxed text-[#75551D]">{emergencyCallSequenceAssumption}</p>
            <button type="button" onClick={createEvent} className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#C93F34] py-5 text-[24px] font-black text-white shadow-lg transition active:scale-[0.98]"><PhoneCall className="h-7 w-7" />{`Mock 呼叫${firstTarget.name}`}</button>
            <button type="button" onClick={onDismiss} className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#D8D5CE] bg-white py-5 text-[22px] font-black text-[#46554F] transition active:scale-[0.98]"><X className="h-6 w-6" />取消</button>
          </div>
        </section>
      </div>
    );
  }

  const presentation = {
    contacting: { icon: PhoneCall, eyebrow: "Mock 呼叫中", title: `正在联系${activeTargetName}`, description: "请选择本次 Mock 呼叫的结果，不会发起真实电话。", tone: "text-[#F2C96D] bg-[#392F1B] border-[#7A632D]" },
    connected: { icon: UserRoundCheck, eyebrow: "Mock 已接听", title: `${activeTargetName}已接听`, description: "当前为 L2 交互原型状态，不会建立真实通话。", tone: "text-[#79D5AC] bg-[#143328] border-[#2B795A]" },
    failed: { icon: PhoneOff, eyebrow: "暂未接通", title: "暂时没有接通", description: "您可以重新连接，也可以先返回首页。", tone: "text-[#F28B82] bg-[#3A2020] border-[#8B4141]" },
    cancelled: { icon: CircleX, eyebrow: "已取消", title: "已取消连接", description: "这次没有继续联系，需要时可以重新打开在线协助。", tone: "text-[#B8C9D5] bg-[#253240] border-[#486174]" },
  }[stage];
  const StatusIcon = presentation.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#061018]/95 p-8 text-white backdrop-blur-md select-none">
      <section className="w-full max-w-[920px] overflow-hidden rounded-[34px] border-2 border-[#274558] bg-[#0D1B27] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="assistance-status-title">
        <header className="flex items-center justify-between border-b border-[#294052] px-8 py-5">
          <div className="flex items-center gap-3 text-[19px] font-black"><PhoneCall className="h-6 w-6 text-[#F06E62]" />在线协助</div>
          <span className="rounded-full border border-[#355267] bg-[#142534] px-4 py-2 text-[15px] font-black text-[#B8C9D5]">L2 Mock · {getAssistanceStatusLabel(event?.status)}</span>
        </header>
        <div className="px-10 pb-9 pt-10 text-center">
          <div className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 ${presentation.tone}`}><StatusIcon className={`h-14 w-14 ${stage === "contacting" ? "animate-pulse" : ""}`} /></div>
          <p className="mt-6 text-[18px] font-black text-[#7FCBA8]">{presentation.eyebrow}</p>
          <h2 id="assistance-status-title" className="mt-2 text-[40px] font-black tracking-tight">{presentation.title}</h2>
          <p className="mx-auto mt-4 max-w-[720px] text-[21px] font-bold leading-relaxed text-[#B9C7D0]">{presentation.description}</p>
          <div className="mx-auto mt-8 flex max-w-[620px] items-center justify-between gap-6 rounded-2xl border border-[#315066] bg-[#132433] px-6 py-5 text-left" aria-label="连接状态">
            <div className="flex items-center gap-4">
              <Headphones className="h-9 w-9 shrink-0 text-[#6AC79D]" />
              <div>
                <span className="block text-[15px] font-bold text-[#8EA4B4]">正在联系</span>
                <strong className="mt-1 block text-[21px] font-black text-white">{activeTargetName}</strong>
              </div>
            </div>
            <strong className="shrink-0 text-[20px] font-black text-[#79D5AC]">{getAssistanceStatusLabel(event?.status)}</strong>
          </div>
          {stage === "failed" ? (
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button type="button" onClick={retryContact} className="flex items-center justify-center gap-3 rounded-2xl bg-[#C9483D] py-5 text-[22px] font-black transition active:scale-[0.98]"><RefreshCw className="h-6 w-6" />重新连接</button>
              <button type="button" onClick={onDismiss} className="flex items-center justify-center gap-3 rounded-2xl border-2 border-[#385267] bg-[#172A39] py-5 text-[22px] font-black transition active:scale-[0.98]"><X className="h-6 w-6" />返回首页</button>
            </div>
          ) : stage === "contacting" ? (
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button type="button" onClick={connectCurrentTarget} className="flex items-center justify-center gap-3 rounded-2xl bg-[#197451] py-5 text-[21px] font-black transition active:scale-[0.98]"><UserRoundCheck className="h-6 w-6" />模拟已接通</button>
              <button type="button" onClick={markCurrentTargetUnanswered} className="flex items-center justify-center gap-3 rounded-2xl bg-[#C9483D] py-5 text-[21px] font-black transition active:scale-[0.98]"><PhoneOff className="h-6 w-6" />{activeTargetIndex < orderedTargets.length - 1 ? "未接通，呼叫下一位" : activeTargetType === "call-center" ? "模拟呼叫中心未接通" : "未接通，结束本次呼叫"}</button>
              <button type="button" onClick={cancelConnection} className="col-span-2 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#486174] bg-[#172A39] py-4 text-[20px] font-black transition active:scale-[0.98]"><X className="h-6 w-6" />取消连接</button>
              <p className="col-span-2 rounded-xl border border-[#6F6035] bg-[#2A2518] px-4 py-3 text-left text-[14px] font-bold leading-relaxed text-[#E3CD8D]">{emergencyCallSequenceAssumption}</p>
            </div>
          ) : stage === "connected" ? (
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button type="button" onClick={onDismiss} className="flex items-center justify-center gap-3 rounded-2xl bg-[#197451] py-5 text-[22px] font-black transition active:scale-[0.98]"><Minimize2 className="h-6 w-6" />缩小通话</button>
              <button type="button" onClick={hangUpCall} className="flex items-center justify-center gap-3 rounded-2xl bg-[#B82F2F] py-5 text-[22px] font-black transition active:scale-[0.98]"><PhoneOff className="h-6 w-6" />挂断通话</button>
            </div>
          ) : (
            <button type="button" onClick={onDismiss} className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#197451] py-5 text-[22px] font-black transition active:scale-[0.98]"><Check className="h-6 w-6" />返回首页</button>
          )}
        </div>
      </section>
    </div>
  );
}
