import { useEffect, useState } from "react";
import { Check, CircleX, Headphones, Minimize2, PhoneCall, PhoneOff, RefreshCw, UserRoundCheck, X } from "lucide-react";
import {
  createEmergencyAssistanceEvent,
  onlineAssistanceCompletionResult,
  type EmergencyAcceptanceScenario,
  type EmergencyAssistanceEvent,
  type EmergencyAssistanceStatus,
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
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setRetryCount(0);
    setStage(getInitialStage(event));
  }, [isOpen, scenario]);

  useEffect(() => {
    if (!isOpen || stage !== "contacting" || !event || scenario === "waiting") return;
    const timer = window.setTimeout(() => {
      if (scenario === "no-answer" && retryCount === 0) {
        onEventChange({ ...event, status: "未接通", callCenter: { ...event.callCenter, status: "未接通", answeredAt: "" } });
        setStage("failed");
        return;
      }
      onEventChange({ ...event, status: "处理中", callCenter: { ...event.callCenter, status: "已接听", answeredAt: "2026-07-28 09:42:24" } });
      setStage("connected");
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [event, isOpen, onEventChange, retryCount, scenario, stage]);

  if (!isOpen) return null;

  const createEvent = () => {
    onEventChange(createEmergencyAssistanceEvent(scenario, "待接听"));
    setStage("contacting");
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
    setRetryCount((count) => count + 1);
    onEventChange({ ...event, status: "待接听", callCenter: { ...event.callCenter, status: "待接听" } });
    setStage("contacting");
  };

  const hangUpCall = () => {
    if (!event) return;
    onEventChange({
      ...event,
      status: "已完成",
      callCenter: { ...event.callCenter, status: "已完成" },
      completedAt: "2026-07-28 10:06:35",
      resultSummary: onlineAssistanceCompletionResult.summary,
      resultNote: onlineAssistanceCompletionResult.note,
    });
    onDismiss();
  };

  if (stage === "confirm") {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#071018]/85 p-8 backdrop-blur-md select-none">
        <section className="w-full max-w-[760px] overflow-hidden rounded-[34px] border-2 border-[#D86A5C] bg-[#F9F7F2] text-[#192B25] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="assistance-confirm-title">
          <div className="flex flex-col items-center px-12 pb-11 pt-10 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#FCE9E5] text-[#C2473B]"><PhoneCall className="h-12 w-12" aria-hidden="true" /></div>
            <p className="mb-2 text-[18px] font-black text-[#A43E35]">在线协助</p>
            <h2 id="assistance-confirm-title" className="text-[38px] font-black tracking-tight">是否立即连接乐龄呼叫中心？</h2>
            <p className="mt-5 max-w-[620px] text-[22px] font-bold leading-relaxed text-[#52635C]">有事情需要帮忙，或遇到问题需要协助，都可以联系乐龄呼叫中心。</p>
            <button type="button" onClick={createEvent} className="mt-9 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#C93F34] py-6 text-[26px] font-black text-white shadow-lg transition active:scale-[0.98]"><PhoneCall className="h-7 w-7" />连接呼叫中心</button>
            <button type="button" onClick={onDismiss} className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#D8D5CE] bg-white py-5 text-[22px] font-black text-[#46554F] transition active:scale-[0.98]"><X className="h-6 w-6" />取消</button>
          </div>
        </section>
      </div>
    );
  }

  const presentation = {
    contacting: { icon: PhoneCall, eyebrow: "正在连接", title: "正在连接乐龄呼叫中心", description: "请稍候，接通后工作人员会和您说话。", tone: "text-[#F2C96D] bg-[#392F1B] border-[#7A632D]" },
    connected: { icon: UserRoundCheck, eyebrow: "已接听", title: "乐龄呼叫中心已接听", description: "工作人员已经在线，可以直接和他说话。", tone: "text-[#79D5AC] bg-[#143328] border-[#2B795A]" },
    failed: { icon: PhoneOff, eyebrow: "暂未接通", title: "暂时没有接通", description: "您可以重新连接，也可以先返回首页。", tone: "text-[#F28B82] bg-[#3A2020] border-[#8B4141]" },
    cancelled: { icon: CircleX, eyebrow: "已取消", title: "已取消连接", description: "这次没有继续联系，需要时可以重新打开在线协助。", tone: "text-[#B8C9D5] bg-[#253240] border-[#486174]" },
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
                <span className="block text-[15px] font-bold text-[#8EA4B4]">正在联系</span>
                <strong className="mt-1 block text-[21px] font-black text-white">乐龄呼叫中心</strong>
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
            <button type="button" onClick={cancelConnection} className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#486174] bg-[#172A39] py-5 text-[22px] font-black transition active:scale-[0.98]"><X className="h-6 w-6" />取消连接</button>
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
