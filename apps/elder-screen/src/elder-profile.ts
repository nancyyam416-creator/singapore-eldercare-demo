import { formatSingaporeAddress } from "./singapore-address";

export interface ElderEmergencyContact {
  name: string;
  relationship: string;
  maskedPhone: string;
}

export const elderGenderOptions = ["男", "女", "未填写"] as const;
export type ElderGender = (typeof elderGenderOptions)[number];

export interface ElderProfileSnapshot {
  id?: string;
  name: string;
  phone?: string;
  gender?: ElderGender;
  communityId?: string;
  birthDate?: string;
  projectCommunity?: string;
  address?: string;
  streetAddress?: string;
  unit?: string;
  buildingName?: string;
  postalCode?: string;
  emergencyContact?: ElderEmergencyContact;
}

export interface FamilyRelationshipSnapshot {
  id: string;
  displayName: string;
  relationship: string;
  avatar: string;
  maskedPhone?: string;
  weatherUserId: string;
  active: boolean;
}

// L2 统一 Mock：仅保留当前老人端激活流程和家庭关系中已经存在的数据。
const elderProfileAddress = {
  streetAddress: "12 Ang Mo Kio Avenue 3",
  unit: "#08-21",
  buildingName: "Grandeur 8",
  postalCode: "560123",
};

export const elderProfileMock: ElderProfileSnapshot = {
  id: "elder-wang-jianguo",
  name: "王建国",
  phone: "+65 8603 2918",
  communityId: "COM-001",
  projectCommunity: "清华园社区养老服务项目",
  ...elderProfileAddress,
  address: formatSingaporeAddress(elderProfileAddress),
};

export const getElderProfileAddressSummary = (profile: ElderProfileSnapshot) => (
  formatSingaporeAddress(profile) || profile.address?.trim() || ""
);

export const familyRelationshipMocks: FamilyRelationshipSnapshot[] = [
  {
    id: "daughter",
    displayName: "女儿小敏",
    relationship: "女儿",
    avatar: "https://picsum.photos/seed/xiaomin/240/240",
    maskedPhone: "138 **** 5201",
    weatherUserId: "daughter-xiaomin",
    active: true,
  },
  {
    id: "son",
    displayName: "儿子小刚",
    relationship: "儿子",
    avatar: "https://picsum.photos/seed/xiaogang/240/240",
    maskedPhone: "139 **** 6618",
    weatherUserId: "son-xiaogang",
    active: true,
  },
];

export const getActiveFamilyRelationships = () => Array.from(
  new Map(
    familyRelationshipMocks
      .filter((relationship) => relationship.active)
      .map((relationship) => [relationship.id, relationship]),
  ).values(),
);

export const getFamilyRelationshipById = (relationshipId?: string) => relationshipId
  ? familyRelationshipMocks.find((relationship) => relationship.id === relationshipId)
  : undefined;

export const getActiveFamilyRelationshipCount = () => getActiveFamilyRelationships().length;
