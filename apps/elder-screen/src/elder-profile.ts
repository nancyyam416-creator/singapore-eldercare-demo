export interface ElderEmergencyContact {
  name: string;
  relationship: string;
  maskedPhone: string;
}

export interface ElderProfileSnapshot {
  name: string;
  birthDate?: string;
  projectCommunity?: string;
  address?: string;
  emergencyContact?: ElderEmergencyContact;
}

export interface FamilyRelationshipSnapshot {
  id: string;
  displayName: string;
  relationship: string;
  avatar: string;
  weatherUserId: string;
  active: boolean;
}

// L2 统一 Mock：仅保留当前老人端激活流程和家庭关系中已经存在的数据。
export const elderProfileMock: ElderProfileSnapshot = {
  name: "王建国",
  projectCommunity: "清华园社区养老服务项目",
  address: "清华园社区 · 12号楼 · **01室",
};

export const familyRelationshipMocks: FamilyRelationshipSnapshot[] = [
  {
    id: "daughter",
    displayName: "女儿小敏",
    relationship: "女儿",
    avatar: "https://picsum.photos/seed/xiaomin/240/240",
    weatherUserId: "daughter-xiaomin",
    active: true,
  },
  {
    id: "son",
    displayName: "儿子小刚",
    relationship: "儿子",
    avatar: "https://picsum.photos/seed/xiaogang/240/240",
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

export const getActiveFamilyRelationshipCount = () => getActiveFamilyRelationships().length;
