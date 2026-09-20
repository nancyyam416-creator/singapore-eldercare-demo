export interface EntertainmentContentMock {
  id: string;
  projectId: string;
  name: string;
  targetUrl: string;
  enabled: boolean;
  displayOrder: number;
}

export const ENTERTAINMENT_CONTENT_MOCKS: EntertainmentContentMock[] = [
  {
    id: "ENT-001",
    projectId: "PRJ-001",
    name: "YouTube",
    targetUrl: "https://www.youtube.com/",
    enabled: true,
    displayOrder: 1,
  },
  {
    id: "ENT-002",
    projectId: "PRJ-001",
    name: "Spotify",
    targetUrl: "https://open.spotify.com/",
    enabled: true,
    displayOrder: 2,
  },
  {
    id: "ENT-003",
    projectId: "PRJ-001",
    name: "MeRadio",
    targetUrl: "https://www.melisten.sg/radio",
    enabled: true,
    displayOrder: 3,
  },
  {
    id: "ENT-005",
    projectId: "PRJ-002",
    name: "大巴窑怀旧金曲",
    targetUrl: "https://www.youtube.com/watch?v=u2g-toa-payoh-music",
    enabled: true,
    displayOrder: 1,
  },
];

export const getEntertainmentContentById = (contentId: string) => (
  ENTERTAINMENT_CONTENT_MOCKS.find((content) => content.id === contentId)
);

export const getActiveEntertainmentContentsForProject = (projectId: string) => (
  ENTERTAINMENT_CONTENT_MOCKS
    .filter((content) => content.projectId === projectId && content.enabled)
    .sort((first, second) => first.displayOrder - second.displayOrder)
);
