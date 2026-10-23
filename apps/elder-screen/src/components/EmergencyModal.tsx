import { useEffect, useState } from "react";
import { BellRing, Check, CheckCircle2, Clock3, Headphones, PhoneCall, RefreshCw, UserRoundCheck, UsersRound, X } from "lucide-react";
import {
  createEmergencyAssistanceEvent,
  type EmergencyAcceptanceScenario,
  type EmergencyAssistanceEvent,
  type EmergencyAssistanceStatus,
} from "../emergency-assistance";

export type { EmergencyAcceptanceScenario } from "../emergency-assistance";

type AssistanceStage = "confirm" | "contacting" | "connected" | "callback" | "processing" | "follow-up" | "completed";

interface EmergencyModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  scenario?: EmergencyAcceptanceScenario;
  event: EmergencyAssistanceEvent | null;
  onEventChange: (event: EmergencyAssistanceEvent | null) => void;
}

const getInitialStage = (event: EmergencyAssistanceEvent | null): AssistanceStage => {
  if (!event) return "confirm";
  if (event.status === "待接听") return "contacting";
  if (event.status === "未接通" || event.status === "待回拨") return "callback";
  if (event.status === "需跟进") return "follow-up";
  if (event.status === "已完成") return "completed";
  return "processing";
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
    if (!isOpen || stage !== "contacting" || !event) return;
    const timer = window.setTimeout(() => {
      if (scenario === "no-answer" && retryCount === 0) {
        onEventChange({ ...event, status: "待回拨", callCenter: { ...event.callCenter, status: "未接通", answeredAt: "" } });
        setStage("callback");
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

  const updateEventStatus = (status: EmergencyAssistanceStatus) => {
    if (!event) return;
    onEventChange({
      ...event,
      status,
      callCenter: { ...event.callCenter, status: status === "已完成" ? "已完成" : status === "需跟进" ? "需跟进" : "处理中" },
      completedAt: status === "已完成" ? "2026-07-28 10:06:35" : event.completedAt,
    });
  };

  const retryContact = () => {
    if (!event) return;
    setRetryCount((count) => count + 1);
    onEventChange({ ...event, status: "待接听", callCenter: { ...event.callCenter, status: "待接听" } });
    setStage("contacting");
  };

  const deliveredCount = event?.notifications.filter((item) => item.deliveryStatus === "已送达").length ?? 0;
  const failedCount = event?.notifications.filter((item) => item.deliveryStatus === "发送失败").length ?? 0;

  if (stage === "confirm") {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#071018]/85 p-8 backdrop-blur-md select-none">
        <section className="w-full max-w-[760px] overflow-hidden rounded-[34px] border-2 border-[#D86A5C] bg-[#F9F7F2] text-[#192B25] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="assistance-confirm-title">
          <div className="flex flex-col items-center px-12 pb-11 pt-10 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#FCE9E5] text-[#C2473B]"><PhoneCall className="h-12 w-12" aria-hidden="true" /></div>
            <p className="mb-2 text-[18px] font-black text-[#A43E35]">紧急协助</p>
            <h2 id="assistance-confirm-title" className="text-[38px] font-black tracking-tight">需要现在联系帮助吗？</h2>
            <p className="mt-5 max-w-[600px] text-[22px] font-bold leading-relaxed text-[#52635C]">将联系乐龄呼叫中心，并通知已绑定子女。</p>
            <div className="mt-8 grid w-full grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-[#D8E8E1] bg-[#EFF8F4] p-5 text-left">
                <Headphones className="mb-3 h-8 w-8 text-[#18704D]" /><strong className="block text-[20px] font-black">呼叫中心会接听</strong><span className="mt-1 block text-[16px] font-bold text-[#607169]">由工作人员了解情况并跟进</span>
              </div>
              <div className="rounded-2xl border-2 border-[#DCE4EE] bg-[#F2F6FA] p-5 text-left">
                <UsersRound className="mb-3 h-8 w-8 text-[#376A94]" /><strong className="block text-[20px] font-black">子女会同步知情</strong><span className="mt-1 block text-[16px] font-bold text-[#607169]">已绑定子女可配合后续处理</span>
              </div>
            </div>
            <button type="button" onClick={createEvent} className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#C93F34] py-6 text-[26px] font-black text-white shadow-lg transition active:scale-[0.98]"><PhoneCall className="h-7 w-7" />确认联系</button>
            <button type="button" onClick={onDismiss} className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#D8D5CE] bg-white py-5 text-[22px] font-black text-[#46554F] transition active:scale-[0.98]"><X className="h-6 w-6" />点错了，取消</button>
          </div>
        </section>
      </div>
    );
  }

  const presentation = {
    contacting: { icon: PhoneCall, eyebrow: "正在联系", title: "正在联系乐龄呼叫中心", description: "请稍候，工作人员接听后会与您说话。", tone: "text-[#F2C96D] bg-[#392F1B] border-[#7A632D]" },
    connected: { icon: UserRoundCheck, eyebrow: "已接通", title: "已接通，正在沟通", description: "请保持设备开启，工作人员正在了解您的情况。", tone: "text-[#79D5AC] bg-[#143328] border-[#2B795A]" },
    callback: { icon: Clock3, eyebrow: "暂未接通", title: "等待呼叫中心回拨", description: "这次联系暂时无人接听，您可以重新联系，也可等待回拨。", tone: "text-[#F2C96D] bg-[#392F1B] border-[#7A632D]" },
    processing: { icon: Headphones, eyebrow: "处理中", title: "呼叫中心正在处理", description: "本次协助已在跟进，请不要重复发起。", tone: "text-[#79D5AC] bg-[#143328] border-[#2B795A]" },
    "follow-up": { icon: BellRing, eyebrow: "需要后续跟进", title: "工作人员会继续联系您", description: "乐龄呼叫中心已记录情况，后续会再与您确认。", tone: "text-[#89C7F0] bg-[#152D40] border-[#326D96]" },
    completed: { icon: CheckCircle2, eyebrow: "已完成", title: "本次协助已完成", description: "呼叫中心已完成处理，您可以放心返回首页。", tone: "text-[#79D5AC] bg-[#143328] border-[#2B795A]" },
  }[stage];
  const StatusIcon = presentation.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#061018]/95 p-8 text-white backdrop-blur-md select-none">
      <section className="w-full max-w-[920px] overflow-hidden rounded-[34px] border-2 border-[#274558] bg-[#0D1B27] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="assistance-status-title">
        <header className="flex items-center justify-between border-b border-[#294052] px-8 py-5">
          <div className="flex items-center gap-3 text-[19px] font-black"><PhoneCall className="h-6 w-6 text-[#F06E62]" />紧急协助</div>
          <span className="rounded-full border border-[#355267] bg-[#142534] px-4 py-2 text-[15px] font-black text-[#B8C9D5]">{event?.status ?? "待接听"}</span>
        </header>
        <div className="px-10 pb-9 pt-10 text-center">
          <div className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 ${presentation.tone}`}><StatusIcon className={`h-14 w-14 ${stage === "contacting" ? "animate-pulse" : ""}`} /></div>
          <p className="mt-6 text-[18px] font-black text-[#7FCBA8]">{presentation.eyebrow}</p>
          <h2 id="assistance-status-title" className="mt-2 text-[40px] font-black tracking-tight">{presentation.title}</h2>
          <p className="mx-auto mt-4 max-w-[720px] text-[21px] font-bold leading-relaxed text-[#B9C7D0]">{presentation.description}</p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-left">
            <div className="rounded-2xl border border-[#315066] bg-[#132433] p-5">
              <div className="flex items-center gap-3 text-[18px] font-black"><Headphones className="h-6 w-6 text-[#6AC79D]" />乐龄呼叫中心</div>
              <p className="mt-2 text-[16px] font-bold text-[#AFC0CB]">{stage === "callback" ? "首次未接通，已进入待回拨" : stage === "contacting" ? "正在呼叫，请稍候" : "主要负责了解情况和后续处理"}</p>
            </div>
            <div className="rounded-2xl border border-[#315066] bg-[#132433] p-5">
              <div className="flex items-center gap-3 text-[18px] font-black"><UsersRound className="h-6 w-6 text-[#75B8E5]" />已同步通知子女</div>
              <p className="mt-2 text-[16px] font-bold text-[#AFC0CB]">{failedCount > 0 ? `${deliveredCount} 人已送达，${failedCount} 人暂未送达；不影响呼叫中心继续处理` : `${deliveredCount || 2} 人已收到通知，可配合后续处理`}</p>
            </div>
          </div>
          {stage === "callback" ? (
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button type="button" onClick={retryContact} className="flex items-center justify-center gap-3 rounded-2xl bg-[#C9483D] py-5 text-[22px] font-black transition active:scale-[0.98]"><RefreshCw className="h-6 w-6" />重新联系</button>
              <button type="button" onClick={onDismiss} className="flex items-center justify-center gap-3 rounded-2xl border-2 border-[#385267] bg-[#172A39] py-5 text-[22px] font-black transition active:scale-[0.98]"><Clock3 className="h-6 w-6" />返回首页等待回拨</button>
            </div>
          ) : stage === "processing" ? (
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button type="button" onClick={() => { updateEventStatus("需跟进"); setStage("follow-up"); }} className="flex items-center justify-center gap-3 rounded-2xl bg-[#197451] py-5 text-[22px] font-black transition active:scale-[0.98]"><RefreshCw className="h-6 w-6" />刷新处理进展</button>
              <button type="button" onClick={onDismiss} className="rounded-2xl border-2 border-[#385267] bg-[#172A39] py-5 text-[22px] font-black transition active:scale-[0.98]">返回首页</button>
            </div>
          ) : stage === "follow-up" ? (
            <button type="button" onClick={onDismiss} className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#197451] py-5 text-[22px] font-black transition active:scale-[0.98]"><Check className="h-6 w-6" />我知道了，返回首页</button>
          ) : stage === "completed" ? (
            <button type="button" onClick={onDismiss} className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#197451] py-5 text-[22px] font-black transition active:scale-[0.98]"><Check className="h-6 w-6" />返回首页</button>
          ) : stage === "connected" ? (
            <button type="button" onClick={onDismiss} className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#197451] py-5 text-[22px] font-black transition active:scale-[0.98]"><Check className="h-6 w-6" />我知道了，保持联络</button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
