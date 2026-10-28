import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleHelp,
  Eye,
  EyeOff,
  LockKeyhole,
  LoaderCircle,
  ShieldCheck,
  TabletSmartphone,
  Wifi,
  X,
} from "lucide-react";
import { elderProfileMock } from "../elder-profile";
import {
  activationScenarioDefinitions,
  getActivationAttemptError,
  type ActivationAcceptanceScenario,
  type ActivationContractState,
  type ActivationError,
} from "../activation-contract";
import "./activation-flow.css";

type ActivationStep = "wifi" | "code" | "identity" | "syncing" | "success";

interface ActivationFlowProps {
  onComplete: () => void;
  scenario: ActivationAcceptanceScenario;
  contractState: ActivationContractState;
  resetSignal: number;
  onActivationCommitted: () => void;
}

const elderProfile = {
  name: elderProfileMock.name,
  community: elderProfileMock.projectCommunity ?? "未完善",
  address: elderProfileMock.address ?? "未完善",
  avatar: elderProfileMock.name.slice(0, 1),
};

const errorMessages: Record<Exclude<ActivationError, null>, string> = {
  invalid: "激活码不正确，请检查后重新输入。",
  used: "该激活码已经使用，请联系服务人员确认设备。",
  deviceMismatch: "激活码与这台平板不匹配，请让工作人员检查。",
  network: "当前网络连接异常，请检查网络后重试。",
};

const progressSteps = [
  { key: "wifi", label: "连接无线网络" },
  { key: "code", label: "输入激活码" },
  { key: "identity", label: "确认是您" },
  { key: "syncing", label: "正在准备" },
  { key: "success", label: "完成" },
] as const;

const availableWifiNetworks = [
  { id: "u2g-home-5g", name: "U2G-Home-5G", signal: "信号强", strength: 3 },
  { id: "living-room", name: "LivingRoom-WiFi", signal: "信号良好", strength: 2 },
  { id: "sg-home", name: "SG-Home", signal: "信号一般", strength: 1 },
] as const;

export default function ActivationFlow({ scenario, contractState, resetSignal, onActivationCommitted, onComplete }: ActivationFlowProps) {
  const [step, setStep] = useState<ActivationStep>("wifi");
  const [selectedWifiId, setSelectedWifiId] = useState<string | null>(null);
  const [wifiPassword, setWifiPassword] = useState("");
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [isConnectingWifi, setIsConnectingWifi] = useState(false);
  const [wifiError, setWifiError] = useState(false);
  const [code, setCode] = useState(activationScenarioDefinitions[scenario].code);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<ActivationError>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const onActivationCommittedRef = useRef(onActivationCommitted);

  const currentStepIndex = progressSteps.findIndex((item) => item.key === step);
  const syncItems = useMemo(
    () => ["您的个人信息", "提醒与日程", "首页与服务"],
    [],
  );

  useEffect(() => {
    onActivationCommittedRef.current = onActivationCommitted;
  }, [onActivationCommitted]);

  useEffect(() => {
    setStep("wifi");
    setSelectedWifiId(null);
    setWifiPassword("");
    setShowWifiPassword(false);
    setIsConnectingWifi(false);
    setWifiError(false);
    setCode(activationScenarioDefinitions[scenario].code);
    setIsChecking(false);
    setError(null);
    setShowHelp(false);
    setSyncedCount(0);
  }, [resetSignal, scenario]);

  useEffect(() => {
    if (step !== "syncing") return;

    setSyncedCount(0);
    const timers = syncItems.map((_, index) =>
      window.setTimeout(() => setSyncedCount(index + 1), 500 + index * 520),
    );
    const finishTimer = window.setTimeout(() => {
      onActivationCommittedRef.current();
      setStep("success");
    }, 2850);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(finishTimer);
    };
  }, [step, syncItems]);

  const updateCode = (value: string) => {
    setCode(value.replace(/\D/g, "").slice(0, 6));
    setError(null);
  };

  const connectWifi = () => {
    if (!selectedWifiId || !wifiPassword.trim() || isConnectingWifi) return;

    setIsConnectingWifi(true);
    setWifiError(false);
    window.setTimeout(() => {
      setIsConnectingWifi(false);
      if (scenario === "network") {
        setWifiError(true);
        return;
      }
      setStep("code");
    }, 850);
  };

  const selectWifiNetwork = (networkId: string) => {
    if (isConnectingWifi || selectedWifiId === networkId) return;
    setSelectedWifiId(networkId);
    setWifiPassword("");
    setShowWifiPassword(false);
    setWifiError(false);
  };

  const checkActivationCode = () => {
    if (code.length !== 6 || isChecking) return;

    setIsChecking(true);
    setError(null);
    window.setTimeout(() => {
      setIsChecking(false);
      const nextError = getActivationAttemptError(scenario, code, contractState);
      if (!nextError) {
        setStep("identity");
        return;
      }
      setError(nextError);
    }, 850);
  };

  return (
    <div className="activation-flow">
      <header className="activation-flow__header">
        <div className="activation-flow__brand">
          <span><TabletSmartphone aria-hidden="true" /></span>
          <div>
            <h1>设备激活</h1>
          </div>
        </div>
        <div className="activation-flow__header-actions">
          <button type="button" onClick={() => setShowHelp(true)}><CircleHelp aria-hidden="true" />需要帮助</button>
        </div>
      </header>

      <main className="activation-flow__main">
        <nav className="activation-progress" aria-label="激活进度">
          {progressSteps.map((item, index) => {
            const completed = index < currentStepIndex;
            const active = index === currentStepIndex;
            return (
              <Fragment key={item.key}>
                <div className={`${completed ? "is-completed" : ""} ${active ? "is-active" : ""}`}>
                  <i>{completed ? <Check aria-hidden="true" /> : index + 1}</i>
                  <span>{item.label}</span>
                </div>
                {index < progressSteps.length - 1 && <b className={index < currentStepIndex ? "is-completed" : ""} />}
              </Fragment>
            );
          })}
        </nav>

        <section className="activation-shell">
          <aside className="activation-shell__summary">
            <div>
              <span className="activation-shell__summary-icon"><ShieldCheck aria-hidden="true" /></span>
              <h2>开启您的智慧生活</h2>
              <p>完成激活后，可以看提醒、听家人留言，也能找到需要的服务。</p>
            </div>
          </aside>

          <div className="activation-shell__content">
            {step === "wifi" && (
              <section className="activation-step activation-step--wifi">
                <span className="activation-step__eyebrow">设备首次使用</span>
                <h2>连接无线网络</h2>
                <p>请先选择家中的无线网络，再输入密码。</p>

                <div className="activation-wifi-picker" aria-label="可用无线网络">
                  <div className="activation-wifi-picker__heading">
                    <span><Wifi aria-hidden="true" /><strong>可用无线网络</strong></span>
                    <small>请点击选择</small>
                  </div>
                  <div className="activation-wifi-list">
                    {availableWifiNetworks.map((network) => {
                      const selected = selectedWifiId === network.id;
                      return (
                        <button
                          key={network.id}
                          type="button"
                          className={selected ? "is-selected" : ""}
                          aria-pressed={selected}
                          disabled={isConnectingWifi}
                          onClick={() => selectWifiNetwork(network.id)}
                        >
                          <span className="activation-wifi-list__icon"><Wifi aria-hidden="true" /></span>
                          <span className="activation-wifi-list__name">
                            <strong>{network.name}</strong>
                            <small><LockKeyhole aria-hidden="true" />需要密码</small>
                          </span>
                          <span className="activation-wifi-list__signal" aria-label={network.signal}>
                            <i className={network.strength >= 1 ? "is-on" : ""} />
                            <i className={network.strength >= 2 ? "is-on" : ""} />
                            <i className={network.strength >= 3 ? "is-on" : ""} />
                            <small>{network.signal}</small>
                          </span>
                          <span className="activation-wifi-list__check" aria-hidden="true">{selected && <Check />}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className={`activation-password-field ${selectedWifiId ? "is-ready" : ""}`}>
                  <span>{selectedWifiId ? `输入 ${availableWifiNetworks.find((network) => network.id === selectedWifiId)?.name} 的密码` : "请先选择无线网络"}</span>
                  <span className="activation-password-input">
                    <input
                      type={showWifiPassword ? "text" : "password"}
                      autoComplete="current-password"
                      disabled={!selectedWifiId || isConnectingWifi}
                      value={wifiPassword}
                      onChange={(event) => {
                        setWifiPassword(event.target.value);
                        setWifiError(false);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") connectWifi();
                      }}
                      placeholder={selectedWifiId ? "请输入无线网密码" : "选择网络后可输入密码"}
                      aria-invalid={wifiError}
                      aria-describedby={wifiError ? "activation-wifi-error" : undefined}
                    />
                    <button
                      type="button"
                      disabled={!selectedWifiId || isConnectingWifi}
                      onClick={() => setShowWifiPassword((current) => !current)}
                      aria-label={showWifiPassword ? "隐藏无线网密码" : "显示无线网密码"}
                    >
                      {showWifiPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                  </span>
                </label>

                <div className="activation-error-slot">
                  {wifiError && <p id="activation-wifi-error" role="alert"><b>!</b>暂时无法连接无线网络，请检查密码后重试。</p>}
                  {!selectedWifiId && !wifiError && <p className="is-hint"><Wifi aria-hidden="true" />请先从上方选择一个无线网络</p>}
                  {selectedWifiId && !wifiPassword.trim() && !wifiError && <p className="is-hint"><LockKeyhole aria-hidden="true" />请输入密码后连接</p>}
                </div>

                <button
                  type="button"
                  className="activation-primary-action"
                  disabled={!selectedWifiId || !wifiPassword.trim() || isConnectingWifi}
                  onClick={connectWifi}
                >
                  {isConnectingWifi ? <><LoaderCircle className="is-spinning" aria-hidden="true" />正在连接，请稍候</> : "连接无线网络"}
                </button>
              </section>
            )}

            {step === "code" && (
              <section className="activation-step activation-step--code">
                <span className="activation-step__eyebrow">无线网络已连接</span>
                <h2>请输入激活码</h2>

                <div className="activation-device-status" aria-label="当前设备状态">
                  <div>
                    <TabletSmartphone aria-hidden="true" />
                    <span><small>当前设备编号</small><strong>{contractState.device.id}</strong></span>
                  </div>
                  <div>
                    <Wifi aria-hidden="true" />
                    <span><small>网络状态</small><strong>网络已连接</strong></span>
                  </div>
                </div>

                <label className="activation-code-field">
                  <span>6位激活码</span>
                  <span className="activation-code-input">
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
                    />
                    {!code && <span aria-hidden="true">请输入6位数字</span>}
                  </span>
                </label>

                <div className="activation-error-slot">
                  {error && <p id="activation-error" role="alert"><b>!</b>{errorMessages[error]}</p>}
                </div>

                <button
                  type="button"
                  className="activation-primary-action"
                  disabled={code.length !== 6 || isChecking}
                  onClick={checkActivationCode}
                >
                  {isChecking ? <><LoaderCircle className="is-spinning" aria-hidden="true" />正在验证，请稍候</> : "确认激活"}
                </button>
              </section>
            )}

            {step === "identity" && (
              <section className="activation-step activation-step--identity">
                <span className="activation-step__eyebrow">激活码验证成功</span>
                <h2>这是您的信息吗？</h2>
                <p>请看一下姓名和社区是否正确。</p>

                <div className="activation-profile-card">
                  <div className="activation-profile-card__avatar">{contractState.elderly.name.slice(0, 1)}</div>
                  <div>
                    <h3>{contractState.elderly.name}<span>本人</span></h3>
                    <strong>{elderProfile.community}</strong>
                    <p>{elderProfile.address}</p>
                  </div>
                </div>

                <div className="activation-step__actions">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("code");
                      setCode(activationScenarioDefinitions[scenario].code);
                      setError(null);
                    }}
                  >
                    <ArrowLeft aria-hidden="true" />返回
                  </button>
                  <button type="button" className="is-primary" onClick={() => setStep("syncing")}>是我，继续</button>
                </div>
              </section>
            )}

            {step === "syncing" && (
              <section className="activation-step activation-step--syncing">
                <span className="activation-step__status-icon"><LoaderCircle className="is-spinning" aria-hidden="true" /></span>
                <h2>正在为您准备</h2>
                <p>正在准备个人信息、提醒和首页服务，请稍候。</p>
                <div className="activation-sync-list">
                  {syncItems.map((item, index) => {
                    const completed = index < syncedCount;
                    return (
                      <div key={item} className={completed ? "is-completed" : ""}>
                        {completed ? <CheckCircle2 aria-hidden="true" /> : <LoaderCircle className="is-spinning" aria-hidden="true" />}
                        <span>{item}</span>
                      </div>
                    );
                  })}
                </div>
                <small>同步期间请保持平板开机，不需要进行其他操作。</small>
              </section>
            )}

            {step === "success" && (
              <section className="activation-step activation-step--success">
                <span className="activation-step__status-icon"><Check aria-hidden="true" /></span>
                <h2>设备激活成功</h2>
                <p>{contractState.elderly.name}，欢迎使用 U2G 高龄智慧服务。</p>
                <div className="activation-success-list">
                  {["个人信息已准备", "提醒日程已准备", "首页服务已准备"].map((item) => (
                    <div key={item}><CheckCircle2 aria-hidden="true" /><span>{item}</span></div>
                  ))}
                </div>
                <button type="button" className="activation-primary-action" onClick={onComplete}>开始使用</button>
              </section>
            )}
          </div>
        </section>
      </main>

      {showHelp && (
        <div className="activation-modal" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="activation-help-title">
            <button type="button" className="activation-modal__close" onClick={() => setShowHelp(false)} aria-label="关闭帮助"><X aria-hidden="true" /></button>
            <span className="activation-modal__icon"><CircleHelp aria-hidden="true" /></span>
            <h2 id="activation-help-title">无法激活？</h2>
            <p>请先检查无线网密码和激活码。如果仍然无法激活，请联系家人或服务人员处理。</p>
            <div className="activation-help-device"><span>联系服务人员时，请告知设备编号</span><strong>{contractState.device.id}</strong></div>
            <button type="button" className="activation-primary-action" onClick={() => setShowHelp(false)}>我知道了</button>
          </section>
        </div>
      )}

    </div>
  );
}
