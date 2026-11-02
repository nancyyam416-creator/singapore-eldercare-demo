import tabletActivationMock from "../../产品理解/90 原型与Mock素材/mock/设备激活跨端统一Mock.json";
import { elderProfileMock, type ElderGender } from "./elder-profile";

export type ActivationAcceptanceScenario =
  | "normal"
  | "boundProfile"
  | "lookupFailure"
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

export type ActivationScenarioEntry = "wifi" | "profile" | "success";
export type ActivationLookupStatus = "idle" | "bound" | "unbound" | "failed";

export interface ActivationContractState {
  contractVersion: string;
  device: {
    id: string;
    sn: string;
    model: string;
    reported: boolean;
    lookupStatus: ActivationLookupStatus;
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
  name: "",
  phone: "",
  gender: "",
  country: "新加坡",
  postalCode: "",
  streetAddress: "",
  unit: "",
};

const boundProfile: ActivationProfileDraft = {
  name: elderProfileMock.name,
  phone: elderProfileMock.phone?.replace(/\D/g, "").slice(-8) ?? "86032918",
  gender: "男",
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
    label: "SN 未绑定用户",
    description: "联网后自动上报 SN；未查到绑定用户时，进入空白表单由老人手动填写。",
    entry: "wifi",
    profile: defaultProfile,
  },
  boundProfile: {
    label: "SN 已绑定用户",
    description: "联网后自动上报 SN；查到绑定用户时自动回填资料，老人仍可修改后提交。",
    entry: "wifi",
    profile: boundProfile,
  },
  lookupFailure: {
    label: "绑定关系查询失败",
    description: "联网成功但查询绑定关系失败时保留当前步骤并允许重试，不按未绑定处理。",
    entry: "wifi",
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
    profile: { ...boundProfile, phone: "8123456" },
  },
  postalInvalid: {
    label: "邮编格式错误",
    description: "邮政编码不是 6 位数字，表单保留输入并禁止提交。",
    entry: "profile",
    profile: { ...boundProfile, postalCode: "56012" },
  },
  completedBinding: {
    label: "绑定完成",
    description: "首次设置已完成，可直接开始使用。",
    entry: "success",
    profile: boundProfile,
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

export const createInitialActivationContractState = (): ActivationContractState => ({
  contractVersion: tabletActivationMock.contractVersion,
  device: {
    id: tabletActivationMock.deviceId,
    sn: tabletActivationMock.deviceSn,
    model: tabletActivationMock.deviceModel,
    reported: false,
    lookupStatus: "idle",
    status: "待联网后上报",
    boundElderlyId: null,
  },
  elderly: {
    ...createElderlyContractProfile({ name: "", phone: "", gender: "", country: "新加坡", postalCode: "", streetAddress: "", unit: "" }),
    communityId: null,
    projectCommunity: null,
  },
  completedAt: null,
});

export const applyActivationLookupResult = (
  current: ActivationContractState,
  lookupStatus: Exclude<ActivationLookupStatus, "idle">,
  profile?: ActivationProfileDraft,
): ActivationContractState => {
  const isBound = lookupStatus === "bound" && profile;
  const elderly = isBound ? createElderlyContractProfile(profile) : current.elderly;
  return {
    ...current,
    device: {
      ...current.device,
      reported: true,
      lookupStatus,
      status: lookupStatus === "failed" ? "SN 已上报，绑定查询失败" : lookupStatus === "bound" ? "SN 已上报，已绑定用户" : "SN 已上报，未绑定用户",
      boundElderlyId: isBound ? elderly.id : null,
    },
    elderly: isBound ? { ...elderly, currentTabletId: current.device.id } : current.elderly,
  };
};

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
      reported: true,
      lookupStatus: "bound",
      status: "SN 已上报，已绑定用户",
      boundElderlyId: elderly.id,
    },
    elderly: {
      ...elderly,
      currentTabletId: tabletActivationMock.deviceId,
    },
    completedAt: tabletActivationMock.completedAt,
  };
};
