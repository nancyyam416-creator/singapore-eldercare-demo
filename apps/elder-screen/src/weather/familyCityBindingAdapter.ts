import { elderProfileMock, familyRelationshipMocks } from "../elder-profile";
import {
  readFamilyCity,
  subscribeFamilyCity,
  type FamilyCityPreference,
} from "../../../产品理解/90 原型与Mock素材/mock/家人城市共享";

export interface LocalFamilyCityIdentity {
  ownerUserId: string;
  elderId: string;
  weatherUserId: string;
}

export interface AuthorizedFamilyCity {
  identity: LocalFamilyCityIdentity;
  preference: FamilyCityPreference | null;
  authorized: boolean;
}

// L3 本地演示的两端身份桥接：只用稳定 ID 找到同一位家人。
// 这组映射本身不授权；下方仍会校验当前老人以及中控现有家庭关系是否有效。
export const localFamilyCityIdentityMap: readonly LocalFamilyCityIdentity[] = [{
  ownerUserId: "child-current",
  elderId: "elder-wang-jianguo",
  weatherUserId: "daughter-xiaomin",
}];

export function resolveAuthorizedFamilyCity(
  identity: LocalFamilyCityIdentity,
  relationStatus: "active" | "unbound",
): AuthorizedFamilyCity {
  const isCurrentElder = elderProfileMock.id === identity.elderId;
  const hasActiveRelationship = familyRelationshipMocks.some((relationship) => (
    relationship.weatherUserId === identity.weatherUserId && relationship.active
  ));
  const authorized = relationStatus === "active" && isCurrentElder && hasActiveRelationship;

  return {
    identity,
    authorized,
    preference: authorized ? readFamilyCity(identity.ownerUserId) : null,
  };
}

export const subscribeAuthorizedFamilyCity = subscribeFamilyCity;
