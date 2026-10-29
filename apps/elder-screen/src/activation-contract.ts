import tabletActivationMock from "../../产品理解/90 原型与Mock素材/mock/设备激活跨端统一Mock.json";

export type ActivationAcceptanceScenario =
  | "normal"
  | "requiredMissing"
  | "phoneInvalid"
  | "postalInvalid"
  | "returnEdit"
  | "completedBinding";

export type ActivationError = "invalid" | null;

export interface ActivationProfileDraft {
  name: string;
  phone: string;
  country: "新加坡";
  postalCode: string;
  streetAddress: string;
  unit: string;
}

export type ActivationScenarioEntry = "wifi" | "profile" | "confirm" | "success";

export interface ActivationContractState {
  contractVersion: string;
  activationCode: {
    value: string;
    status: string;
    reusable: boolean;
  };
  device: {
    id: string;
    sn: string;
    model: string;
    status: string;
    boundElderlyId: string | null;
  };
  elderly: {
    id: string;
    name: string;
    phone: string;
    country: string;
    postalCode: string;
    streetAddress: string;
    unit: string;
    addressSummary: string;
    currentTabletId: string | null;
  };
  completedAt: string | null;
}

export const activationScenarioDefinitions: Record<ActivationAcceptanceScenario, {
  label: string;
  description: string;
  code: string;
  entry: ActivationScenarioEntry;
  profile: ActivationProfileDraft;
}> = {
  normal: {
    label: "正常激活",
    description: "从连接无线网络开始，完整演示填写资料、确认和绑定。",
    code: tabletActivationMock.scenarioCodes.success,
    entry: "wifi",
    profile: {
      name: tabletActivationMock.elderlyName,
      phone: "81234567",
      country: "新加坡",
      postalCode: "560123",
      streetAddress: "12 Ang Mo Kio Avenue 3",
      unit: "#08-21",
    },
  },
  requiredMissing: {
    label: "必填项缺失",
    description: "姓名、联系电话、邮政编码和街道地址为空，就地显示必填提示。",
    code: tabletActivationMock.scenarioCodes.success,
    entry: "profile",
    profile: { name: "", phone: "", country: "新加坡", postalCode: "", streetAddress: "", unit: "" },
  },
  phoneInvalid: {
    label: "电话格式错误",
    description: "联系电话不是 8 位数字，表单保留输入并禁止继续。",
    code: tabletActivationMock.scenarioCodes.success,
    entry: "profile",
    profile: { name: tabletActivationMock.elderlyName, phone: "8123456", country: "新加坡", postalCode: "560123", streetAddress: "12 Ang Mo Kio Avenue 3", unit: "#08-21" },
  },
  postalInvalid: {
    label: "邮编格式错误",
    description: "邮政编码不是 6 位数字，表单保留输入并禁止继续。",
    code: tabletActivationMock.scenarioCodes.success,
    entry: "profile",
    profile: { name: tabletActivationMock.elderlyName, phone: "81234567", country: "新加坡", postalCode: "56012", streetAddress: "12 Ang Mo Kio Avenue 3", unit: "#08-21" },
  },
  returnEdit: {
    label: "返回修改",
    description: "确认页展示完整资料，可返回上一步修改并再次确认。",
    code: tabletActivationMock.scenarioCodes.success,
    entry: "confirm",
    profile: { name: tabletActivationMock.elderlyName, phone: "81234567", country: "新加坡", postalCode: "560123", streetAddress: "12 Ang Mo Kio Avenue 3", unit: "#08-21" },
  },
  completedBinding: {
    label: "完成绑定",
    description: "完成页显示老人姓名和地址摘要，Mock 契约已绑定当前平板。",
    code: tabletActivationMock.scenarioCodes.success,
    entry: "success",
    profile: { name: tabletActivationMock.elderlyName, phone: "81234567", country: "新加坡", postalCode: "560123", streetAddress: "12 Ang Mo Kio Avenue 3", unit: "#08-21" },
  },
};

export const formatActivationPhone = (phone: string) => phone.length === 8
  ? `+65 ${phone.slice(0, 4)} ${phone.slice(4)}`
  : `+65 ${phone}`;

export const formatActivationAddress = (profile: ActivationProfileDraft) => [
  profile.streetAddress.trim(),
  profile.unit.trim(),
  profile.country,
  profile.postalCode.trim(),
].filter(Boolean).join(" · ");

export const createInitialActivationContractState = (): ActivationContractState => ({
  contractVersion: tabletActivationMock.contractVersion,
  activationCode: {
    value: tabletActivationMock.activationCode,
    status: tabletActivationMock.states.generated.activationCodeStatus,
    reusable: true,
  },
  device: {
    id: tabletActivationMock.deviceId,
    sn: tabletActivationMock.deviceSn,
    model: tabletActivationMock.deviceModel,
    status: tabletActivationMock.states.generated.deviceStatus,
    boundElderlyId: tabletActivationMock.states.generated.deviceBoundElderlyId,
  },
  elderly: {
    id: tabletActivationMock.elderlyId,
    name: tabletActivationMock.elderlyName,
    phone: "",
    country: "新加坡",
    postalCode: "",
    streetAddress: "",
    unit: "",
    addressSummary: "",
    currentTabletId: tabletActivationMock.states.generated.elderlyCurrentTabletId,
  },
  completedAt: null,
});

export const completeActivationContractState = (
  profile: ActivationProfileDraft = activationScenarioDefinitions.normal.profile,
): ActivationContractState => ({
  contractVersion: tabletActivationMock.contractVersion,
  activationCode: {
    value: tabletActivationMock.activationCode,
    status: tabletActivationMock.states.completed.activationCodeStatus,
    reusable: tabletActivationMock.states.completed.activationCodeReusable,
  },
  device: {
    id: tabletActivationMock.deviceId,
    sn: tabletActivationMock.deviceSn,
    model: tabletActivationMock.deviceModel,
    status: tabletActivationMock.states.completed.deviceStatus,
    boundElderlyId: tabletActivationMock.states.completed.deviceBoundElderlyId,
  },
  elderly: {
    id: tabletActivationMock.elderlyId,
    name: profile.name.trim(),
    phone: formatActivationPhone(profile.phone),
    country: profile.country,
    postalCode: profile.postalCode,
    streetAddress: profile.streetAddress.trim(),
    unit: profile.unit.trim(),
    addressSummary: formatActivationAddress(profile),
    currentTabletId: tabletActivationMock.states.completed.elderlyCurrentTabletId,
  },
  completedAt: tabletActivationMock.completedAt,
});

export const getActivationAttemptError = (
  code: string,
): ActivationError => {
  return code === tabletActivationMock.activationCode ? null : "invalid";
};
