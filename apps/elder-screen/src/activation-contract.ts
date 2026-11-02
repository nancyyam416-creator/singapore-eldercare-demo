import tabletActivationMock from "../../产品理解/90 原型与Mock素材/mock/设备激活跨端统一Mock.json";
import { elderProfileMock, type ElderGender } from "./elder-profile";

export type ActivationAcceptanceScenario =
  | "normal"
  | "snUnregistered"
  | "requiredMissing"
  | "phoneInvalid"
  | "postalInvalid"
  | "completedBinding";

export interface ActivationProfileDraft {
  name: string;
  phone: string;
  gender: ElderGender | "";
  country: "新加坡";
  postalCode: string;
  streetAddress: string;
  unit: string;
}

export type ActivationScenarioEntry = "wifi" | "device" | "profile" | "success";

export interface ActivationContractState {
  contractVersion: string;
  device: {
    id: string;
    sn: string;
    model: string;
    registered: boolean;
    status: string;
    boundElderlyId: string | null;
  };
  elderly: {
    id: string;
    name: string;
    phone: string;
    gender: ElderGender | "";
    country: string;
    postalCode: string;
    streetAddress: string;
    unit: string;
    addressSummary: string;
    communityId: string | null;
    projectCommunity: string | null;
    currentTabletId: string | null;
  };
  completedAt: string | null;
}

const defaultProfile: ActivationProfileDraft = {
  name: elderProfileMock.name,
  phone: elderProfileMock.phone?.replace(/\D/g, "").slice(-8) ?? "",
  gender: "",
  country: "新加坡",
  postalCode: "560123",
  streetAddress: "12 Ang Mo Kio Avenue 3",
  unit: "#08-21",
};

export const activationScenarioDefinitions: Record<ActivationAcceptanceScenario, {
  label: string;
  description: string;
  entry: ActivationScenarioEntry;
  profile: ActivationProfileDraft;
}> = {
  normal: {
    label: "正常绑定",
    description: "连接无线网络后填写个人信息，完成首次设置。",
    entry: "wifi",
    profile: defaultProfile,
  },
  snUnregistered: {
    label: "平板 SN 未登记",
    description: "联网后未找到当前平板 SN，阻止继续并提示联系工作人员。",
    entry: "device",
    profile: defaultProfile,
  },
  requiredMissing: {
    label: "必填项缺失",
    description: "姓名、性别、联系电话、邮政编码和街道地址为空，就地显示必填提示。",
    entry: "profile",
    profile: { name: "", phone: "", gender: "", country: "新加坡", postalCode: "", streetAddress: "", unit: "" },
  },
  phoneInvalid: {
    label: "电话格式错误",
    description: "联系电话不是 8 位数字，表单保留输入并禁止提交。",
    entry: "profile",
    profile: { ...defaultProfile, gender: "男", phone: "8123456" },
  },
  postalInvalid: {
    label: "邮编格式错误",
    description: "邮政编码不是 6 位数字，表单保留输入并禁止提交。",
    entry: "profile",
    profile: { ...defaultProfile, gender: "男", postalCode: "56012" },
  },
  completedBinding: {
    label: "绑定完成",
    description: "首次设置已完成，可直接开始使用。",
    entry: "success",
    profile: { ...defaultProfile, gender: "男" },
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

const createElderlyContractProfile = (profile: ActivationProfileDraft) => ({
  id: elderProfileMock.id ?? tabletActivationMock.elderlyId,
  name: profile.name.trim(),
  phone: formatActivationPhone(profile.phone),
  gender: profile.gender,
  country: profile.country,
  postalCode: profile.postalCode,
  streetAddress: profile.streetAddress.trim(),
  unit: profile.unit.trim(),
  addressSummary: formatActivationAddress(profile),
  communityId: elderProfileMock.communityId ?? null,
  projectCommunity: elderProfileMock.projectCommunity ?? null,
  currentTabletId: null as string | null,
});

export const createInitialActivationContractState = (registered = true): ActivationContractState => ({
  contractVersion: tabletActivationMock.contractVersion,
  device: {
    id: tabletActivationMock.deviceId,
    sn: tabletActivationMock.deviceSn,
    model: tabletActivationMock.deviceModel,
    registered,
    status: registered ? "已登记，待绑定" : "未登记",
    boundElderlyId: null,
  },
  elderly: {
    ...createElderlyContractProfile({ name: "", phone: "", gender: "", country: "新加坡", postalCode: "", streetAddress: "", unit: "" }),
    communityId: null,
    projectCommunity: null,
  },
  completedAt: null,
});

export const completeActivationContractState = (
  profile: ActivationProfileDraft = activationScenarioDefinitions.completedBinding.profile,
): ActivationContractState => {
  const elderly = createElderlyContractProfile(profile);
  return {
    contractVersion: tabletActivationMock.contractVersion,
    device: {
      id: tabletActivationMock.deviceId,
      sn: tabletActivationMock.deviceSn,
      model: tabletActivationMock.deviceModel,
      registered: true,
      status: "已绑定",
      boundElderlyId: elderly.id,
    },
    elderly: {
      ...elderly,
      currentTabletId: tabletActivationMock.deviceId,
    },
    completedAt: tabletActivationMock.completedAt,
  };
};
