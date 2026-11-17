import { useEffect, useState } from "react";
import { Headphones, Minimize2, PhoneCall, PhoneOff, UserRoundCheck, X } from "lucide-react";
import {
  cancelEmergencyAssistance,
  createEmergencyAssistanceEvent,
  emergencyCallCenterTarget,
  getEmergencyScenarioTargets,
  onlineAssistanceCompletionResult,
  type EmergencyAcceptanceScenario,
  type EmergencyAssistanceEvent,
  type EmergencyAssistanceStatus,
  type EmergencyCallTarget,
} from "../emergency-assistance";

export type { EmergencyAcceptanceScenario } from "../emergency-assistance";

type AssistanceStage = "confirm" | "contacting" | "connected" | "failed";

interface EmergencyModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  scenario?: EmergencyAcceptanceScenario;
  event: EmergencyAssistanceEvent | null;
  onEventChange: (event: EmergencyAssistanceEvent | null) => void;
}

const getInitialStage = (event: EmergencyAssistanceEvent | null): AssistanceStage => {
  if (!event) return "confirm";
  if (event.status === "已取消") return "confirm";
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
  }, [event, isOpen, scenario]);

  if (!isOpen) return null;
  if (event?.status === "已取消") return null;

  const activeTarget = orderedTargets[activeTargetIndex] ?? emergencyCallCenterTarget;
  const activeTargetName = activeTarget.name;

  const createEvent = () => {
    const nextEvent = createEmergencyAssistanceEvent(scenario, "待接听", orderedTargets);
    onEventChange(nextEvent);
    setActiveTargetIndex(0);
    setActiveTargetType(orderedTargets[0]?.targetType ?? "call-center");
    setStage("contacting");
  };

  const cancelConnection = () => {
    if (!event) return;
    onEventChange(cancelEmergencyAssistance(event));
    onDismiss();
  };

  const hangUpCall = () => {
    if (!event) return;
    onEventChange({
      ...event,
      status: "已完成",
      callCenter: activeTargetType === "call-center" ? { ...event.callCenter, status: "已完成" } : event.callCenter,
      completedAt: "2026-07-28 10:06:35",
      resultSummary: activeTargetType === "call-center" ? onlineAssistanceCompletionResult.summary : `${activeTargetName}已结束本次通话`,
      resultNote: activeTargetType === "call-center" ? onlineAssistanceCompletionResult.note : "本次联系已结束。",
    });
    onDismiss();
  };

  if (stage === "confirm") {
    const firstTarget = orderedTargets[0] ?? emergencyCallCenterTarget;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#061018]/90 p-8 text-white backdrop-blur-md select-none">
        <section className="w-full max-w-[680px] overflow-hidden rounded-[30px] border-2 border-[#315066] bg-[#0D1B27] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="assistance-confirm-title">
          <div className="flex flex-col items-center px-10 pb-9 pt-10 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#6A3030] bg-[#351D20] text-[#F06E62]"><PhoneCall className="h-12 w-12" aria-hidden="true" /></div>
            <p className="mb-2 text-[18px] font-black text-[#F06E62]">在线协助</p>
            <h2 id="assistance-confirm-title" className="text-[38px] font-black tracking-tight">{`联系${firstTarget.name}？`}</h2>
            <div className="mt-9 grid w-full grid-cols-2 gap-4">
              <button type="button" onClick={createEvent} className="flex items-center justify-center gap-3 rounded-2xl bg-[#C9483D] py-5 text-[23px] font-black text-white shadow-lg transition active:scale-[0.98]"><PhoneCall className="h-7 w-7" />呼叫</button>
              <button type="button" onClick={onDismiss} className="flex items-center justify-center gap-3 rounded-2xl border-2 border-[#385267] bg-[#172A39] py-5 text-[23px] font-black text-white transition active:scale-[0.98]"><X className="h-7 w-7" />取消</button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const presentation = {
    contacting: { icon: PhoneCall, eyebrow: "呼叫中", title: `正在联系${activeTargetName}`, description: "正在尝试接通，请稍候。", tone: "text-[#F2C96D] bg-[#392F1B] border-[#7A632D]" },
    connected: { icon: UserRoundCheck, eyebrow: "已接听", title: `${activeTargetName}已接听`, description: "您可以继续通话，也可以缩小窗口返回首页。", tone: "text-[#79D5AC] bg-[#143328] border-[#2B795A]" },
    failed: { icon: PhoneOff, eyebrow: "暂未接通", title: "暂时没有接通", description: "您可以先返回首页，稍后重新发起在线协助。", tone: "text-[#F28B82] bg-[#3A2020] border-[#8B4141]" },
  }[stage];
  const StatusIcon = presentation.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#061018]/95 p-8 text-white backdrop-blur-md select-none">
      <section className="w-full max-w-[920px] overflow-hidden rounded-[34px] border-2 border-[#274558] bg-[#0D1B27] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="assistance-status-title">
        <header className="flex items-center justify-between border-b border-[#294052] px-8 py-5">
          <div className="flex items-center gap-3 text-[19px] font-black"><PhoneCall className="h-6 w-6 text-[#F06E62]" />在线协助</div>
          <span className="rounded-full border border-[#355267] bg-[#142534] px-4 py-2 text-[15px] font-black text-[#B8C9D5]">{getAssistanceStatusLabel(event?.status)}</span>
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
                <span className="block text-[15px] font-bold text-[#8EA4B4]">{stage === "contacting" ? "正在联系" : stage === "connected" ? "通话对象" : "最后联系"}</span>
                <strong className="mt-1 block text-[21px] font-black text-white">{activeTargetName}</strong>
              </div>
            </div>
            <strong className="shrink-0 text-[20px] font-black text-[#79D5AC]">{getAssistanceStatusLabel(event?.status)}</strong>
          </div>
          {event?.callRoute.attempts.length ? <div className="mx-auto mt-4 max-w-[620px] space-y-2 text-left" aria-label="本次联系进展">
            {event.callRoute.attempts.map((attempt, index) => <div key={`${attempt.targetId}-${index}`} className="flex items-center justify-between rounded-xl border border-[#294052] bg-[#101F2B] px-5 py-3 text-[17px] font-bold">
              <span>{attempt.targetName}</span>
              <strong className={attempt.result === "已接通" ? "text-[#79D5AC]" : "text-[#F28B82]"}>{attempt.result}</strong>
            </div>)}
          </div> : null}
          {stage === "failed" ? (
            <button type="button" onClick={onDismiss} className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#385267] bg-[#172A39] py-5 text-[22px] font-black transition active:scale-[0.98]"><X className="h-6 w-6" />返回首页</button>
          ) : stage === "contacting" ? (
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button type="button" onClick={onDismiss} className="flex items-center justify-center gap-3 rounded-2xl bg-[#197451] py-5 text-[21px] font-black transition active:scale-[0.98]"><Minimize2 className="h-6 w-6" />收起</button>
              <button type="button" onClick={cancelConnection} className="flex items-center justify-center gap-3 rounded-2xl border-2 border-[#486174] bg-[#172A39] py-5 text-[21px] font-black transition active:scale-[0.98]"><X className="h-6 w-6" />取消呼叫</button>
            </div>
          ) : stage === "connected" ? (
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button type="button" onClick={onDismiss} className="flex items-center justify-center gap-3 rounded-2xl bg-[#197451] py-5 text-[22px] font-black transition active:scale-[0.98]"><Minimize2 className="h-6 w-6" />缩小通话</button>
              <button type="button" onClick={hangUpCall} className="flex items-center justify-center gap-3 rounded-2xl bg-[#B82F2F] py-5 text-[22px] font-black transition active:scale-[0.98]"><PhoneOff className="h-6 w-6" />挂断通话</button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
