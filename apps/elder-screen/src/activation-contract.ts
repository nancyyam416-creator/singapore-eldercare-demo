import tabletActivationMock from "./data/tablet-activation-mock.json";

export type ActivationAcceptanceScenario =
  | "success"
  | "invalid"
  | "used"
  | "revoked"
  | "deviceMismatch"
  | "network"
  | "alreadyBound";

export type ActivationError = Exclude<ActivationAcceptanceScenario, "success"> | null;

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
    currentTabletId: string | null;
  };
  completedAt: string | null;
}

export const activationScenarioDefinitions: Record<ActivationAcceptanceScenario, {
  label: string;
  description: string;
  code: string;
}> = {
  success: {
    label: "正常激活",
    description: "完成后同步更新激活码、目标设备和老人当前平板。",
    code: tabletActivationMock.scenarioCodes.success,
  },
  invalid: {
    label: "激活码错误",
    description: "输入的六位码不存在或格式正确但无法匹配。",
    code: tabletActivationMock.scenarioCodes.invalid,
  },
  used: {
    label: "激活码已使用",
    description: "已完成激活的码不可再次使用。",
    code: tabletActivationMock.scenarioCodes.used,
  },
  revoked: {
    label: "激活码已作废",
    description: "后台作废的码不能继续建立设备关系。",
    code: tabletActivationMock.scenarioCodes.revoked,
  },
  deviceMismatch: {
    label: "设备不匹配",
    description: "激活码指定的目标设备不是当前平板。",
    code: tabletActivationMock.scenarioCodes.deviceMismatch,
  },
  network: {
    label: "网络异常",
    description: "提交时网络不可用，保留当前输入供用户重试。",
    code: tabletActivationMock.scenarioCodes.network,
  },
  alreadyBound: {
    label: "设备已激活",
    description: "当前平板已有有效绑定，不允许重复激活。",
    code: tabletActivationMock.scenarioCodes.alreadyBound,
  },
};

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
    currentTabletId: tabletActivationMock.states.generated.elderlyCurrentTabletId,
  },
  completedAt: null,
});

export const completeActivationContractState = (): ActivationContractState => ({
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
    name: tabletActivationMock.elderlyName,
    currentTabletId: tabletActivationMock.states.completed.elderlyCurrentTabletId,
  },
  completedAt: tabletActivationMock.completedAt,
});

export const getActivationAttemptError = (
  scenario: ActivationAcceptanceScenario,
  code: string,
  contractState: ActivationContractState,
): ActivationError => {
  if (contractState.activationCode.status === tabletActivationMock.states.completed.activationCodeStatus) return "used";
  if (scenario !== "success") return scenario;
  return code === tabletActivationMock.activationCode ? null : "invalid";
};

export const activationRepeatSubmissionMessage = tabletActivationMock.states.completed.repeatSubmissionMessage;
