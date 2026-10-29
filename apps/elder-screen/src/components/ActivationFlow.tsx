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
  MapPin,
  Phone,
  ShieldCheck,
  TabletSmartphone,
  UserRound,
  Wifi,
  X,
} from "lucide-react";
import {
  activationScenarioDefinitions,
  formatActivationAddress,
  formatActivationPhone,
  getActivationAttemptError,
  type ActivationAcceptanceScenario,
  type ActivationContractState,
  type ActivationError,
  type ActivationProfileDraft,
} from "../activation-contract";
import "./activation-flow.css";

type ActivationStep = "wifi" | "code" | "profile" | "confirm" | "syncing" | "success";
type ActivationProfileField = "name" | "phone" | "postalCode" | "streetAddress";
type ActivationProfileErrors = Partial<Record<ActivationProfileField, string>>;

interface ActivationFlowProps {
  onComplete: () => void;
  scenario: ActivationAcceptanceScenario;
  contractState: ActivationContractState;
  resetSignal: number;
  onActivationCommitted: (profile: ActivationProfileDraft) => void;
}

const errorMessages: Record<Exclude<ActivationError, null>, string> = {
  invalid: "激活码不正确，请检查后重新输入。",
};

const progressSteps = [
  { key: "wifi", label: "连接无线网络" },
  { key: "code", label: "输入激活码" },
  { key: "profile", label: "填写个人信息" },
  { key: "confirm", label: "确认信息" },
  { key: "syncing", label: "正在准备" },
  { key: "success", label: "完成" },
] as const;

const profileFieldNames: ActivationProfileField[] = ["name", "phone", "postalCode", "streetAddress"];

const validateProfile = (profile: ActivationProfileDraft): ActivationProfileErrors => {
  const errors: ActivationProfileErrors = {};
  if (!profile.name.trim()) errors.name = "请填写姓名";
  if (!profile.phone.trim()) errors.phone = "请填写联系电话";
  else if (!/^\d{8}$/.test(profile.phone)) errors.phone = "请输入 8 位新加坡电话号码";
  if (!profile.postalCode.trim()) errors.postalCode = "请填写邮政编码";
  else if (!/^\d{6}$/.test(profile.postalCode)) errors.postalCode = "请输入 6 位数字邮政编码";
  if (!profile.streetAddress.trim()) errors.streetAddress = "请填写楼栋或街道地址";
  return errors;
};

const getInitialTouchedFields = (scenario: ActivationAcceptanceScenario) => {
  if (scenario === "requiredMissing") return new Set<ActivationProfileField>(profileFieldNames);
  if (scenario === "phoneInvalid") return new Set<ActivationProfileField>(["phone"]);
  if (scenario === "postalInvalid") return new Set<ActivationProfileField>(["postalCode"]);
  return new Set<ActivationProfileField>();
};

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
  const [profile, setProfile] = useState<ActivationProfileDraft>(() => ({ ...activationScenarioDefinitions[scenario].profile }));
  const [touchedProfileFields, setTouchedProfileFields] = useState<Set<ActivationProfileField>>(() => getInitialTouchedFields(scenario));
  const [showHelp, setShowHelp] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const onActivationCommittedRef = useRef(onActivationCommitted);
  const profileRef = useRef(profile);

  const currentStepIndex = progressSteps.findIndex((item) => item.key === step);
  const syncItems = useMemo(
    () => ["绑定老人档案", "绑定当前平板", "准备首页服务"],
    [],
  );

  useEffect(() => {
    onActivationCommittedRef.current = onActivationCommitted;
  }, [onActivationCommitted]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    const scenarioDefinition = activationScenarioDefinitions[scenario];
    setStep(scenarioDefinition.entry);
    setSelectedWifiId(null);
    setWifiPassword("");
    setShowWifiPassword(false);
    setIsConnectingWifi(false);
    setWifiError(false);
    setCode(scenarioDefinition.code);
    setIsChecking(false);
    setError(null);
    setProfile({ ...scenarioDefinition.profile });
    setTouchedProfileFields(getInitialTouchedFields(scenario));
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
      onActivationCommittedRef.current(profileRef.current);
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
      const nextError = getActivationAttemptError(code);
      if (!nextError) {
        setStep("profile");
        return;
      }
      setError(nextError);
    }, 850);
  };

  const profileErrors = validateProfile(profile);
  const isProfileValid = Object.keys(profileErrors).length === 0;

  const updateProfile = (field: keyof ActivationProfileDraft, value: string) => {
    const nextValue = field === "phone"
      ? value.replace(/\D/g, "").slice(0, 8)
      : field === "postalCode"
        ? value.replace(/\D/g, "").slice(0, 6)
        : value;
    setProfile((current) => ({ ...current, [field]: nextValue }));
    if (field === "name" || field === "phone" || field === "postalCode" || field === "streetAddress") {
      setTouchedProfileFields((current) => new Set(current).add(field));
    }
  };

  const showProfileError = (field: ActivationProfileField) => touchedProfileFields.has(field) ? profileErrors[field] : undefined;

  const continueToConfirmation = () => {
    setTouchedProfileFields(new Set(profileFieldNames));
    if (!isProfileValid) return;
    setStep("confirm");
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

            {step === "profile" && (
              <section className="activation-step activation-step--profile">
                <span className="activation-step__eyebrow">激活码验证成功</span>
                <h2>填写个人信息</h2>
                <p>请填写您的联系信息和居住地址，带 * 的内容必须填写。</p>

                <div className="activation-profile-form">
                  <label className="activation-form-field">
                    <span>姓名 *</span>
                    <span className="activation-form-input"><UserRound aria-hidden="true" /><input value={profile.name} onChange={(event) => updateProfile("name", event.target.value)} onBlur={() => setTouchedProfileFields((current) => new Set(current).add("name"))} aria-invalid={Boolean(showProfileError("name"))} aria-describedby={showProfileError("name") ? "activation-name-error" : undefined} placeholder="请输入姓名" /></span>
                    {showProfileError("name") && <small id="activation-name-error" role="alert">{showProfileError("name")}</small>}
                  </label>

                  <label className="activation-form-field">
                    <span>联系电话 *</span>
                    <span className="activation-form-input activation-form-input--phone"><Phone aria-hidden="true" /><b>+65</b><input inputMode="numeric" value={profile.phone} onChange={(event) => updateProfile("phone", event.target.value)} onBlur={() => setTouchedProfileFields((current) => new Set(current).add("phone"))} aria-invalid={Boolean(showProfileError("phone"))} aria-describedby={showProfileError("phone") ? "activation-phone-error" : undefined} placeholder="8位电话号码" /></span>
                    {showProfileError("phone") && <small id="activation-phone-error" role="alert">{showProfileError("phone")}</small>}
                  </label>

                  <label className="activation-form-field">
                    <span>国家 / 地区</span>
                    <span className="activation-form-input"><MapPin aria-hidden="true" /><select value={profile.country} disabled aria-label="国家或地区"><option value="新加坡">新加坡</option></select></span>
                  </label>

                  <label className="activation-form-field">
                    <span>邮政编码 *</span>
                    <span className="activation-form-input"><MapPin aria-hidden="true" /><input inputMode="numeric" value={profile.postalCode} onChange={(event) => updateProfile("postalCode", event.target.value)} onBlur={() => setTouchedProfileFields((current) => new Set(current).add("postalCode"))} aria-invalid={Boolean(showProfileError("postalCode"))} aria-describedby={showProfileError("postalCode") ? "activation-postal-error" : undefined} placeholder="6位邮政编码" /></span>
                    {showProfileError("postalCode") && <small id="activation-postal-error" role="alert">{showProfileError("postalCode")}</small>}
                  </label>

                  <label className="activation-form-field activation-form-field--wide">
                    <span>楼栋 / 街道地址 *</span>
                    <span className="activation-form-input"><MapPin aria-hidden="true" /><input value={profile.streetAddress} onChange={(event) => updateProfile("streetAddress", event.target.value)} onBlur={() => setTouchedProfileFields((current) => new Set(current).add("streetAddress"))} aria-invalid={Boolean(showProfileError("streetAddress"))} aria-describedby={showProfileError("streetAddress") ? "activation-address-error" : undefined} placeholder="例如：12 Ang Mo Kio Avenue 3" /></span>
                    {showProfileError("streetAddress") && <small id="activation-address-error" role="alert">{showProfileError("streetAddress")}</small>}
                  </label>

                  <label className="activation-form-field activation-form-field--wide">
                    <span>单元号（选填）</span>
                    <span className="activation-form-input"><MapPin aria-hidden="true" /><input value={profile.unit} onChange={(event) => updateProfile("unit", event.target.value)} placeholder="例如：#08-21" /></span>
                  </label>
                </div>

                <div className="activation-step__actions">
                  <button type="button" onClick={() => setStep("code")}><ArrowLeft aria-hidden="true" />返回</button>
                  <button type="button" className="is-primary" disabled={!isProfileValid} onClick={continueToConfirmation}>下一步：确认信息</button>
                </div>
              </section>
            )}

            {step === "confirm" && (
              <section className="activation-step activation-step--confirm">
                <span className="activation-step__eyebrow">个人信息已填写</span>
                <h2>请确认您的信息</h2>
                <p>请仔细核对，确认后将与当前平板绑定。</p>

                <div className="activation-confirm-card">
                  <div><span><UserRound aria-hidden="true" />姓名</span><strong>{profile.name}</strong></div>
                  <div><span><Phone aria-hidden="true" />联系电话</span><strong>{formatActivationPhone(profile.phone)}</strong></div>
                  <div className="is-wide"><span><MapPin aria-hidden="true" />居住地址</span><strong>{formatActivationAddress(profile)}</strong></div>
                </div>

                <div className="activation-step__actions">
                  <button type="button" onClick={() => setStep("profile")}><ArrowLeft aria-hidden="true" />返回修改</button>
                  <button type="button" className="is-primary" onClick={() => setStep("syncing")}>确认无误，开始绑定</button>
                </div>
              </section>
            )}
            {step === "syncing" && (
              <section className="activation-step activation-step--syncing">
                <span className="activation-step__status-icon"><LoaderCircle className="is-spinning" aria-hidden="true" /></span>
                <h2>正在为您准备</h2>
                <p>正在绑定您的档案与当前平板，请稍候。</p>
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
                <p>{contractState.elderly.name || profile.name}，欢迎使用 U2G 高龄智慧服务。</p>
                <div className="activation-success-profile">
                  <span><UserRound aria-hidden="true" /></span>
                  <div><small>已绑定老人档案</small><strong>{contractState.elderly.name || profile.name}</strong><p>{contractState.elderly.addressSummary || formatActivationAddress(profile)}</p></div>
                </div>
                <div className="activation-success-list">
                  {["老人档案已绑定", "当前平板已绑定", "首页服务已准备"].map((item) => (
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
