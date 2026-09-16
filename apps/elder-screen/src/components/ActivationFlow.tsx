import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleHelp,
  LoaderCircle,
  QrCode,
  ShieldCheck,
  TabletSmartphone,
  UserRound,
  Wifi,
  X,
} from "lucide-react";
import { elderProfileMock } from "../elder-profile";

type ActivationStep = "code" | "identity" | "syncing" | "success";
type ActivationError = "invalid" | "used" | "revoked" | "deviceMismatch" | "network" | "alreadyBound" | "identity" | null;

interface ActivationFlowProps {
  onComplete: () => void;
}

const elderProfile = {
  name: elderProfileMock.name,
  community: elderProfileMock.projectCommunity ?? "未完善",
  address: elderProfileMock.address ?? "未完善",
  avatar: elderProfileMock.name.slice(0, 1),
};

const currentDeviceId = "U2G-TAB-2026-031";

const errorMessages: Record<Exclude<ActivationError, null>, string> = {
  invalid: "激活码不正确，请检查后重新输入。",
  used: "该激活码已经使用，请联系服务人员确认设备。",
  revoked: "该激活码已作废，请联系服务人员重新生成。",
  deviceMismatch: "该激活码不属于当前设备，请核对设备编号后重试。",
  network: "当前网络连接异常，请检查网络后重试。",
  alreadyBound: "这台设备已经绑定使用人，无需重复激活。",
  identity: "请检查激活码，或联系服务人员确认老人档案。",
};

const progressSteps = [
  { key: "code", label: "激活设备" },
  { key: "identity", label: "确认使用人" },
  { key: "syncing", label: "同步信息" },
  { key: "success", label: "完成" },
] as const;

export default function ActivationFlow({ onComplete }: ActivationFlowProps) {
  const [step, setStep] = useState<ActivationStep>("code");
  const [code, setCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<ActivationError>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);

  const currentStepIndex = progressSteps.findIndex((item) => item.key === step);
  const syncItems = useMemo(
    () => ["使用人基础信息", "提醒与日程", "首页与服务配置"],
    [],
  );

  useEffect(() => {
    if (step !== "syncing") return;

    setSyncedCount(0);
    const timers = syncItems.map((_, index) =>
      window.setTimeout(() => setSyncedCount(index + 1), 500 + index * 520),
    );
    const finishTimer = window.setTimeout(() => setStep("success"), 2850);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(finishTimer);
    };
  }, [step, syncItems]);

  const updateCode = (value: string) => {
    setCode(value.replace(/\D/g, "").slice(0, 6));
    setError(null);
  };

  const checkActivationCode = (submittedCode = code) => {
    if (submittedCode.length !== 6 || isChecking) return;

    setIsChecking(true);
    setError(null);
    window.setTimeout(() => {
      setIsChecking(false);
      if (submittedCode === "628315") {
        setStep("identity");
        return;
      }
      if (submittedCode === "222222") setError("used");
      else if (submittedCode === "333333") setError("revoked");
      else if (submittedCode === "444444") setError("deviceMismatch");
      else if (submittedCode === "000000") setError("network");
      else if (submittedCode === "555555") setError("alreadyBound");
      else setError("invalid");
    }, 850);
  };

  const handleSimulatedScan = () => {
    const scannedCode = "628315";
    setCode(scannedCode);
    setShowScanner(false);
    window.setTimeout(() => checkActivationCode(scannedCode), 120);
  };

  return (
    <div className="w-full h-full bg-[#F5F2EB] text-[#1C2C24] flex flex-col overflow-hidden">
      <header className="h-[112px] px-14 bg-white border-b-2 border-[#E7E1D7] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#14533C] text-white flex items-center justify-center">
            <TabletSmartphone className="w-8 h-8" />
          </div>
          <div>
            <div className="text-[25px] font-black leading-tight">U2G 高龄智慧服务</div>
            <div className="text-[16px] font-bold text-gray-500 mt-1">首次使用设置</div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-[#EAF6EF] text-[#14533C] rounded-2xl text-[17px] font-black">
            <Wifi className="w-5 h-5" />
            网络已连接
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="h-13 px-5 bg-white border-2 border-[#DCD6CC] rounded-2xl text-[17px] font-black flex items-center gap-2 hover:border-[#14533C] transition-colors"
          >
            <CircleHelp className="w-5 h-5" />
            需要帮助
          </button>
        </div>
      </header>

      <main className="flex-1 px-20 py-10 flex flex-col min-h-0">
        <nav aria-label="激活进度" className="w-full max-w-[1120px] mx-auto mb-8 shrink-0">
          <div className="flex items-start">
            {progressSteps.map((item, index) => {
              const completed = index < currentStepIndex;
              const active = index === currentStepIndex;
              return (
                <React.Fragment key={item.key}>
                  <div className="w-[170px] flex flex-col items-center gap-2">
                    <div
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-[19px] font-black ${
                        completed
                          ? "bg-[#14533C] border-[#14533C] text-white"
                          : active
                            ? "bg-white border-[#14533C] text-[#14533C]"
                            : "bg-[#ECE8E0] border-[#D7D1C7] text-gray-500"
                      }`}
                    >
                      {completed ? <Check className="w-6 h-6" /> : index + 1}
                    </div>
                    <span className={`text-[16px] font-black ${active || completed ? "text-[#14533C]" : "text-gray-500"}`}>
                      {item.label}
                    </span>
                  </div>
                  {index < progressSteps.length - 1 && (
                    <div className={`h-1 flex-1 mt-6 rounded-full ${index < currentStepIndex ? "bg-[#14533C]" : "bg-[#D7D1C7]"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </nav>

        <section className="w-full max-w-[1160px] mx-auto flex-1 min-h-0 bg-white border-2 border-[#E1DBD1] rounded-[32px] shadow-[0_16px_40px_rgba(56,45,29,0.08)] overflow-hidden flex">
          <aside className="w-[340px] bg-[#EAF6EF] border-r-2 border-[#D6E9DD] p-9 flex flex-col justify-between">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-white text-[#14533C] flex items-center justify-center mb-7 shadow-sm">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <h2 className="text-[27px] font-black leading-snug">安全绑定您的专属平板</h2>
              <p className="text-[18px] font-bold text-gray-600 leading-relaxed mt-5">
                激活由安装人员、家人或服务顾问协助完成，老人不需要注册账号，也不需要记住密码。
              </p>
            </div>
            <div className="bg-white/80 border border-[#CDE2D5] rounded-2xl px-5 py-4">
              <div className="text-[15px] font-bold text-gray-500">当前设备编号</div>
              <div className="text-[19px] font-black text-[#1C2C24] mt-1 tracking-wide">{currentDeviceId}</div>
            </div>
          </aside>

          <div className="flex-1 p-11 flex items-center justify-center min-w-0">
            {step === "code" && (
              <div className="w-full max-w-[650px]">
                <span className="text-[16px] font-black text-[#256F4F]">设备首次使用</span>
                <h1 className="text-[38px] font-black mt-2">欢迎使用 U2G 高龄智慧服务</h1>
                <p className="text-[20px] font-bold text-gray-600 mt-4 leading-relaxed">
                  请由安装人员、家人或服务顾问输入6位激活码，完成设备激活。
                </p>

                <label className="block mt-8">
                  <span className="text-[18px] font-black">6位激活码</span>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    value={code}
                    onChange={(event) => updateCode(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") checkActivationCode();
                    }}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "activation-error" : undefined}
                    placeholder="请输入6位数字"
                    className={`mt-3 w-full h-[90px] px-8 bg-[#FAF8F5] border-[3px] rounded-2xl text-center text-[42px] font-black tracking-[0.45em] outline-none transition-colors placeholder:text-[22px] placeholder:tracking-normal placeholder:text-gray-400 ${
                      error ? "border-[#C84B45]" : "border-[#DCD6CC] focus:border-[#14533C]"
                    }`}
                  />
                </label>

                <div className="min-h-[54px] pt-3">
                  {error && (
                    <p id="activation-error" role="alert" className="text-[17px] font-black text-[#B73F39] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#FBE8E6] flex items-center justify-center">!</span>
                      {errorMessages[error]}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={code.length !== 6 || isChecking}
                  onClick={() => checkActivationCode()}
                  className="w-full h-[68px] rounded-2xl bg-[#14533C] hover:bg-[#0E3D2B] disabled:bg-gray-300 disabled:text-gray-500 text-white text-[22px] font-black flex items-center justify-center gap-3 transition-colors"
                >
                  {isChecking ? (
                    <>
                      <LoaderCircle className="w-6 h-6 animate-spin" />
                      正在验证设备信息，请稍候……
                    </>
                  ) : (
                    "确认激活"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="w-full h-[62px] mt-4 rounded-2xl border-2 border-[#B8D9C7] text-[#14533C] text-[20px] font-black flex items-center justify-center gap-3 hover:bg-[#F2FAF5] transition-colors"
                >
                  <QrCode className="w-6 h-6" />
                  扫描二维码激活
                </button>
              </div>
            )}

            {step === "identity" && (
              <div className="w-full max-w-[670px] text-center">
                <span className="text-[16px] font-black text-[#256F4F]">激活码验证成功</span>
                <h1 className="text-[38px] font-black mt-2">请确认使用人</h1>
                <p className="text-[19px] font-bold text-gray-600 mt-3">请核对以下信息，避免绑定到错误的使用人。</p>

                <div className="mt-8 bg-[#FAF8F5] border-2 border-[#E1DBD1] rounded-[28px] p-8 flex items-center gap-7 text-left">
                  <div className="w-28 h-28 rounded-full bg-[#DCEEE4] border-4 border-white shadow-md text-[#14533C] flex items-center justify-center text-[40px] font-black shrink-0">
                    {elderProfile.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h2 className="text-[32px] font-black">{elderProfile.name}</h2>
                      <span className="px-3 py-1.5 bg-[#EAF6EF] text-[#14533C] rounded-full text-[15px] font-black">使用人</span>
                    </div>
                    <p className="text-[19px] font-black text-gray-700 mt-3">{elderProfile.community}</p>
                    <p className="text-[17px] font-bold text-gray-500 mt-2">{elderProfile.address}</p>
                  </div>
                </div>

                <p className="text-[17px] font-bold text-gray-600 leading-relaxed mt-6">
                  此激活码仅用于绑定当前设备 {currentDeviceId} 与 {elderProfile.name}。确认后将同步该使用人的提醒和服务信息。
                </p>
                <div className="flex gap-4 mt-7">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("code");
                      setError("identity");
                    }}
                    className="w-[220px] h-[68px] rounded-2xl border-2 border-[#DCD6CC] text-gray-700 text-[20px] font-black flex items-center justify-center gap-2 hover:bg-gray-50"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    信息不正确
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("syncing")}
                    className="flex-1 h-[68px] rounded-2xl bg-[#14533C] hover:bg-[#0E3D2B] text-white text-[22px] font-black"
                  >
                    确认绑定
                  </button>
                </div>
              </div>
            )}

            {step === "syncing" && (
              <div className="w-full max-w-[650px] text-center">
                <div className="w-24 h-24 rounded-full bg-[#EAF6EF] text-[#14533C] flex items-center justify-center mx-auto">
                  <LoaderCircle className="w-12 h-12 animate-spin" />
                </div>
                <h1 className="text-[38px] font-black mt-7">正在准备您的平板</h1>
                <p className="text-[20px] font-bold text-gray-600 mt-4">正在同步您的提醒、家人和服务信息，请稍候……</p>
                <div className="mt-8 grid grid-cols-2 gap-4 text-left">
                  {syncItems.map((item, index) => {
                    const completed = index < syncedCount;
                    return (
                      <div key={item} className={`h-[72px] px-5 rounded-2xl border-2 flex items-center gap-3 ${completed ? "bg-[#F2FAF5] border-[#B8D9C7]" : "bg-[#FAF8F5] border-[#E1DBD1]"}`}>
                        {completed ? (
                          <CheckCircle2 className="w-6 h-6 text-[#14533C] shrink-0" />
                        ) : (
                          <LoaderCircle className="w-6 h-6 text-gray-400 animate-spin shrink-0" />
                        )}
                        <span className="text-[17px] font-black">{item}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[15px] font-bold text-gray-500 mt-7">同步期间请保持平板开机，不需要进行其他操作。</p>
              </div>
            )}

            {step === "success" && (
              <div className="w-full max-w-[650px] text-center">
                <div className="w-24 h-24 rounded-full bg-[#14533C] text-white flex items-center justify-center mx-auto shadow-lg">
                  <Check className="w-12 h-12" />
                </div>
                <h1 className="text-[40px] font-black mt-7">设备激活成功</h1>
                <p className="text-[21px] font-bold text-gray-600 mt-3">{elderProfile.name}，欢迎使用 U2G 高龄智慧服务。</p>
                <div className="mt-7 border-y-2 border-[#EEE9E1] py-6 grid grid-cols-3 gap-4">
                  {["使用人信息已同步", "提醒日程已同步", "首页服务已同步"].map((item) => (
                    <div key={item} className="flex flex-col items-center gap-2 text-[#14533C]">
                      <CheckCircle2 className="w-7 h-7" />
                      <span className="text-[16px] font-black">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 px-5 py-4 rounded-2xl bg-[#FAF8F5] border-2 border-[#E1DBD1] text-[18px] font-black text-gray-700">
                  暂无已绑定家人，可进入“通讯录”邀请家人
                </div>
                <p className="text-[17px] font-bold text-gray-600 mt-6">以后打开平板将直接进入首页，不需要再次输入激活码。</p>
                <button
                  type="button"
                  onClick={onComplete}
                  className="w-full h-[72px] mt-7 rounded-2xl bg-[#14533C] hover:bg-[#0E3D2B] text-white text-[23px] font-black"
                >
                  进入首页
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {showScanner && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-10">
          <div className="w-[620px] bg-white rounded-[30px] p-9 text-center shadow-2xl relative">
            <button type="button" onClick={() => setShowScanner(false)} aria-label="关闭扫码" className="absolute top-5 right-5 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <X className="w-6 h-6" />
            </button>
            <div className="w-20 h-20 rounded-2xl bg-[#EAF6EF] text-[#14533C] flex items-center justify-center mx-auto">
              <QrCode className="w-11 h-11" />
            </div>
            <h2 className="text-[31px] font-black mt-6">扫描后台生成的二维码</h2>
            <p className="text-[18px] font-bold text-gray-600 mt-3">请将二维码放入取景框内，系统会自动识别。</p>
            <div className="w-[280px] h-[220px] mx-auto mt-6 border-[5px] border-[#14533C] rounded-3xl bg-[#F5F2EB] flex items-center justify-center">
              <QrCode className="w-28 h-28 text-gray-400" />
            </div>
            <button type="button" onClick={handleSimulatedScan} className="w-full h-[66px] mt-7 rounded-2xl bg-[#14533C] text-white text-[21px] font-black">
              模拟扫描成功
            </button>
            <p className="text-[14px] font-bold text-gray-500 mt-3">当前为 Demo 演示，点击按钮模拟读取二维码。</p>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-10">
          <div className="w-[680px] bg-white rounded-[30px] p-10 shadow-2xl relative">
            <button type="button" onClick={() => setShowHelp(false)} aria-label="关闭帮助" className="absolute top-5 right-5 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <X className="w-6 h-6" />
            </button>
            <div className="w-16 h-16 rounded-2xl bg-[#EAF6EF] text-[#14533C] flex items-center justify-center">
              <CircleHelp className="w-9 h-9" />
            </div>
            <h2 className="text-[31px] font-black mt-6">无法激活？</h2>
            <p className="text-[19px] font-bold text-gray-600 leading-relaxed mt-4">
              请联系安装人员、家人或服务顾问，在后台确认老人档案并重新生成激活码。
            </p>
            <div className="mt-6 bg-[#FAF8F5] border-2 border-[#E1DBD1] rounded-2xl p-5">
              <div className="text-[17px] font-black">Demo 演示激活码</div>
              <div className="text-[16px] font-bold text-gray-600 mt-2 leading-relaxed">
                正常流程：628315　网络异常：000000<br />
                已使用：222222　已作废：333333<br />
                设备不匹配：444444　设备已绑定：555555
              </div>
            </div>
            <button type="button" onClick={() => setShowHelp(false)} className="w-full h-[64px] mt-7 rounded-2xl bg-[#14533C] text-white text-[20px] font-black">
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
