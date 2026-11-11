import { Fragment, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  CircleHelp,
  Eye,
  EyeOff,
  LockKeyhole,
  LoaderCircle,
  MapPinned,
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
  createActivationBindingPayload,
  normalizeActivationProfile,
  type ActivationAcceptanceScenario,
  type ActivationBindingPayload,
  type ActivationContractState,
  type ActivationLookupStatus,
  type ActivationProfileDraft,
} from "../activation-contract";
import { activationCommunityOptions, getActivationCommunityById } from "../activation-communities";
import "./activation-flow.css";

type ActivationStep = "wifi" | "profile" | "success";
type ActivationProfileField = "name" | "phone" | "gender" | "communityId" | "postalCode" | "streetAddress";
type ActivationProfileErrors = Partial<Record<ActivationProfileField, string>>;

interface ActivationFlowProps {
  onComplete: () => void;
  scenario: ActivationAcceptanceScenario;
  contractState: ActivationContractState;
  resetSignal: number;
  onLookupResolved: (status: Exclude<ActivationLookupStatus, "idle">, profile?: ActivationProfileDraft) => void;
  onBindingSubmitted: (profile: ActivationBindingPayload) => void;
}

const progressSteps = [
  { key: "wifi", label: "连接无线网络" },
  { key: "profile", label: "填写个人信息" },
  { key: "success", label: "绑定完成" },
] as const;

const profileFieldNames: ActivationProfileField[] = ["name", "phone", "gender", "communityId", "postalCode", "streetAddress"];
const activationGenderOptions = ["男", "女"] as const;

const validateProfile = (profile: ActivationProfileDraft, deviceProjectId: string | null): ActivationProfileErrors => {
  const errors: ActivationProfileErrors = {};
  if (!profile.name.trim()) errors.name = "请填写姓名";
  if (!profile.phone.trim()) errors.phone = "请填写联系电话";
  else if (!/^\d{8}$/.test(profile.phone)) errors.phone = "请输入 8 位新加坡电话号码";
  if (!profile.gender) errors.gender = "请选择性别";
  if (!profile.communityId) errors.communityId = "请选择所属社区";
  else {
    const community = getActivationCommunityById(profile.communityId);
    if (!community) errors.communityId = "所选社区当前不可用，请重新选择";
    else if (deviceProjectId && community.projectId !== deviceProjectId) errors.communityId = "该设备已归属其他项目，请联系服务人员处理";
  }
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

export default function ActivationFlow({ scenario, contractState, resetSignal, onLookupResolved, onBindingSubmitted, onComplete }: ActivationFlowProps) {
  const [step, setStep] = useState<ActivationStep>("wifi");
  const [selectedWifiId, setSelectedWifiId] = useState<string | null>(null);
  const [wifiPassword, setWifiPassword] = useState("");
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [isConnectingWifi, setIsConnectingWifi] = useState(false);
  const [wifiError, setWifiError] = useState(false);
  const [lookupError, setLookupError] = useState(false);
  const [profile, setProfile] = useState<ActivationProfileDraft>(() => ({ ...activationScenarioDefinitions[scenario].profile }));
  const [touchedProfileFields, setTouchedProfileFields] = useState<Set<ActivationProfileField>>(() => getInitialTouchedFields(scenario));
  const [showHelp, setShowHelp] = useState(false);
  const [bindingError, setBindingError] = useState(false);

  const currentStepIndex = progressSteps.findIndex((item) => item.key === step);

  useEffect(() => {
    const scenarioDefinition = activationScenarioDefinitions[scenario];
    setStep(scenarioDefinition.entry);
    setSelectedWifiId(null);
    setWifiPassword("");
    setShowWifiPassword(false);
    setIsConnectingWifi(false);
    setWifiError(false);
    setLookupError(false);
    setProfile({ ...scenarioDefinition.profile });
    setTouchedProfileFields(getInitialTouchedFields(scenario));
    setShowHelp(false);
    setBindingError(false);
  }, [resetSignal, scenario]);

  const connectWifi = () => {
    if (!selectedWifiId || !wifiPassword.trim() || isConnectingWifi) return;

    setIsConnectingWifi(true);
    setWifiError(false);
    window.setTimeout(() => {
      setIsConnectingWifi(false);
      if (scenario === "lookupFailure" && !lookupError) {
        setLookupError(true);
        onLookupResolved("failed");
        return;
      }
      const lookupStatus = scenario === "boundProfile" ? "bound" : "unbound";
      const nextProfile = { ...activationScenarioDefinitions[scenario].profile };
      setProfile(nextProfile);
      onLookupResolved(lookupStatus, lookupStatus === "bound" ? nextProfile : undefined);
      setStep("profile");
    }, 850);
  };

  const selectWifiNetwork = (networkId: string) => {
    if (isConnectingWifi || selectedWifiId === networkId) return;
    setSelectedWifiId(networkId);
    setWifiPassword("");
    setShowWifiPassword(false);
    setWifiError(false);
  };

  const profileErrors = validateProfile(profile, contractState.device.projectId);
  const isProfileValid = Object.keys(profileErrors).length === 0;

  const updateProfile = (field: keyof ActivationProfileDraft, value: string) => {
    const nextValue = field === "phone"
      ? value.replace(/\D/g, "").slice(0, 8)
      : field === "postalCode"
        ? value.replace(/\D/g, "").slice(0, 6)
        : value;
    setProfile((current) => ({ ...current, [field]: nextValue }));
    if (field === "name" || field === "phone" || field === "gender" || field === "communityId" || field === "postalCode" || field === "streetAddress") {
      setTouchedProfileFields((current) => new Set(current).add(field));
    }
    setBindingError(false);
  };

  const showProfileError = (field: ActivationProfileField) => touchedProfileFields.has(field) ? profileErrors[field] : undefined;

  const submitProfile = () => {
    setTouchedProfileFields(new Set(profileFieldNames));
    if (!isProfileValid) return;
    const normalizedProfile = normalizeActivationProfile(profile);
    setProfile(normalizedProfile);
    if (scenario === "bindingFailure") {
      setBindingError(true);
      return;
    }
    const bindingPayload = createActivationBindingPayload(normalizedProfile);
    if (!bindingPayload) return;
    onBindingSubmitted(bindingPayload);
    setStep("success");
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
              <p>完成首次设置后，即可使用提醒、联系家人与社区服务。</p>
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
                      aria-describedby={wifiError ? "activation-wifi-error" : lookupError ? "activation-lookup-error" : undefined}
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
                  {lookupError && <p id="activation-lookup-error" role="alert"><b>!</b>网络已连接，但暂时无法查询 SN 绑定关系，请重试。</p>}
                  {!selectedWifiId && !wifiError && !lookupError && <p className="is-hint"><Wifi aria-hidden="true" />请先从上方选择一个无线网络</p>}
                  {selectedWifiId && !wifiPassword.trim() && !wifiError && !lookupError && <p className="is-hint"><LockKeyhole aria-hidden="true" />请输入密码后连接</p>}
                </div>

                <button
                  type="button"
                  className="activation-primary-action"
                  disabled={!selectedWifiId || !wifiPassword.trim() || isConnectingWifi}
                  onClick={connectWifi}
                >
                  {isConnectingWifi ? <><LoaderCircle className="is-spinning" aria-hidden="true" />正在上报并查询，请稍候</> : lookupError ? "重新查询绑定关系" : "连接无线网络"}
                </button>
              </section>
            )}

            {step === "profile" && (
              <section className="activation-step activation-step--profile">
                <span className="activation-step__eyebrow">完善使用资料</span>
                <h2>填写个人信息</h2>
                <p>请填写姓名、性别、联系电话、所属社区和居住地址，方便后续为您提供服务。</p>
                <div className="activation-profile-form">
                  <label className="activation-form-field">
                    <span>姓名 *</span>
                    <span className="activation-form-input"><UserRound aria-hidden="true" /><input value={profile.name} onChange={(event) => updateProfile("name", event.target.value)} onBlur={() => setTouchedProfileFields((current) => new Set(current).add("name"))} aria-invalid={Boolean(showProfileError("name"))} aria-describedby={showProfileError("name") ? "activation-name-error" : undefined} placeholder="请输入姓名" /></span>
                    {showProfileError("name") && <small id="activation-name-error" role="alert">{showProfileError("name")}</small>}
                  </label>

                  <div className="activation-form-field">
                    <span id="activation-gender-label">性别 *</span>
                    <div className={`activation-gender-toggle${showProfileError("gender") ? " is-invalid" : ""}`} role="radiogroup" aria-labelledby="activation-gender-label" aria-describedby={showProfileError("gender") ? "activation-gender-error" : undefined}>
                      {activationGenderOptions.map((gender) => <button key={gender} type="button" role="radio" aria-checked={profile.gender === gender} className={profile.gender === gender ? "is-active" : ""} onClick={() => {
                        updateProfile("gender", gender);
                        setTouchedProfileFields((current) => new Set(current).add("gender"));
                      }}>{gender}</button>)}
                    </div>
                    {showProfileError("gender") && <small id="activation-gender-error" role="alert">{showProfileError("gender")}</small>}
                  </div>

                  <label className="activation-form-field">
                    <span>联系电话 *</span>
                    <span className="activation-form-input activation-form-input--phone"><Phone aria-hidden="true" /><b>+65</b><input inputMode="numeric" value={profile.phone} onChange={(event) => updateProfile("phone", event.target.value)} onBlur={() => setTouchedProfileFields((current) => new Set(current).add("phone"))} aria-invalid={Boolean(showProfileError("phone"))} aria-describedby={showProfileError("phone") ? "activation-phone-error" : undefined} placeholder="8位电话号码" /></span>
                    {showProfileError("phone") && <small id="activation-phone-error" role="alert">{showProfileError("phone")}</small>}
                  </label>

                  <label className="activation-form-field">
                    <span>所属社区 *</span>
                    <span className="activation-form-input"><MapPinned aria-hidden="true" /><select value={profile.communityId} onChange={(event) => updateProfile("communityId", event.target.value)} onBlur={() => setTouchedProfileFields((current) => new Set(current).add("communityId"))} aria-invalid={Boolean(showProfileError("communityId"))} aria-describedby={showProfileError("communityId") ? "activation-community-error" : undefined}>
                      <option value="">请选择社区</option>
                      {activationCommunityOptions.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}
                    </select></span>
                    {showProfileError("communityId") && <small id="activation-community-error" role="alert">{showProfileError("communityId")}</small>}
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

                  <label className="activation-form-field">
                    <span>单元号（选填）</span>
                    <span className="activation-form-input"><MapPin aria-hidden="true" /><input value={profile.unit} onChange={(event) => updateProfile("unit", event.target.value)} onBlur={() => setProfile((current) => normalizeActivationProfile(current))} placeholder="例如：#08-21" /></span>
                  </label>

                  <label className="activation-form-field">
                    <span>楼栋名称（选填）</span>
                    <span className="activation-form-input"><MapPin aria-hidden="true" /><input value={profile.buildingName ?? ""} onChange={(event) => updateProfile("buildingName", event.target.value)} placeholder="例如：Grandeur 8" /></span>
                  </label>
                </div>

                {bindingError && <p className="activation-binding-error" role="alert"><b>!</b>资料暂时无法保存，已为您保留填写内容，请稍后重试。</p>}

                <div className="activation-step__actions">
                  <button type="button" onClick={() => setStep("wifi")}><ArrowLeft aria-hidden="true" />返回配网</button>
                  <button type="button" className="is-primary" disabled={!isProfileValid} onClick={submitProfile}>提交个人信息</button>
                </div>
              </section>
            )}
            {step === "success" && (
              <section className="activation-step activation-step--success">
                <span className="activation-step__status-icon"><Check aria-hidden="true" /></span>
                <h2>设置完成</h2>
                <p>{contractState.elderly.name || profile.name}，欢迎使用 U2G 高龄智慧服务。</p>
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
            <h2 id="activation-help-title">无法完成设置？</h2>
            <p>请先检查无线网密码。若网络已连接但暂时无法查询绑定关系，请稍后重试。</p>
            <div className="activation-help-device"><span>联系服务人员时，请告知平板 SN</span><strong>{contractState.device.sn}</strong></div>
            <button type="button" className="activation-primary-action" onClick={() => setShowHelp(false)}>我知道了</button>
          </section>
        </div>
      )}

    </div>
  );
}
