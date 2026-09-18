export interface CommunityStaffMock {
  id: string;
  communityId: string;
  displayName: string;
  englishName?: string;
  role: string;
  phoneNumber: string;
  email?: string;
  serviceTimeSlots: string[];
  photoIndex?: 0 | 1 | 2;
  enabled: boolean;
  displayOrder: number;
}

export const communityStaffMocks: CommunityStaffMock[] = [
  {
    id: "staff-001",
    communityId: "PRJ-001",
    displayName: "林美玲",
    englishName: "Mei Ling Lim",
    role: "社区服务负责人",
    phoneNumber: "6123 8876",
    email: "meiling.lim@community.sg",
    serviceTimeSlots: ["每周一 20:00–22:00"],
    photoIndex: 0,
    enabled: true,
    displayOrder: 1,
  },
  {
    id: "staff-002",
    communityId: "PRJ-001",
    displayName: "阿南·拉詹",
    englishName: "Anand Rajan",
    role: "社区联络员",
    phoneNumber: "9193 6717",
    serviceTimeSlots: ["每周一 19:30–21:30"],
    photoIndex: 1,
    enabled: true,
    displayOrder: 2,
  },
  {
    id: "staff-003",
    communityId: "PRJ-001",
    displayName: "诺拉·哈桑",
    englishName: "Nora Hassan",
    role: "长者服务协调员",
    phoneNumber: "9339 0533",
    email: "nora.hassan@community.sg",
    serviceTimeSlots: [
      "每周一 19:00–22:00",
      "每月第二、第四个周六 09:30–12:00",
    ],
    photoIndex: 2,
    enabled: true,
    displayOrder: 3,
  },
  {
    id: "staff-004",
    communityId: "PRJ-001",
    displayName: "陈志明",
    role: "社区活动联络人",
    phoneNumber: "6908 2216",
    serviceTimeSlots: ["周二、周四 09:00–12:00"],
    enabled: true,
    displayOrder: 4,
  },
];

export const getActiveCommunityStaff = (communityId = "PRJ-001") => (
  communityStaffMocks
    .filter((person) => person.communityId === communityId && person.enabled)
    .sort((first, second) => first.displayOrder - second.displayOrder)
);
