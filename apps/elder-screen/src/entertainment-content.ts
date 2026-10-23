import youtubeIcon from "./entertainment-youtube.svg";
import spotifyIcon from "./entertainment-spotify.svg";
import meRadioIcon from "./entertainment-meradio.svg";

export interface EntertainmentContentMock {
  id: string;
  name: string;
  description: string;
  iconData: string;
  targetUrl: string;
  enabled: boolean;
  displayOrder: number;
}

const STORAGE_KEY = "u2g-leisure-entertainment-entries-v4";

export const ENTERTAINMENT_CONTENT_MOCKS: EntertainmentContentMock[] = [
  {
    id: "ENT-001",
    name: "YouTube",
    description: "观看精选视频与生活内容",
    iconData: youtubeIcon,
    targetUrl: "https://www.youtube.com/",
    enabled: true,
    displayOrder: 1,
  },
  {
    id: "ENT-002",
    name: "Spotify",
    description: "收听音乐、播客与怀旧歌曲",
    iconData: spotifyIcon,
    targetUrl: "https://open.spotify.com/",
    enabled: true,
    displayOrder: 2,
  },
  {
    id: "ENT-003",
    name: "MeRadio",
    description: "收听新加坡本地广播节目",
    iconData: meRadioIcon,
    targetUrl: "https://www.melisten.sg/radio",
    enabled: true,
    displayOrder: 3,
  },
];

const readEntertainmentContents = (): EntertainmentContentMock[] => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    if (!Array.isArray(saved)) return ENTERTAINMENT_CONTENT_MOCKS;
    return saved.map((entry) => {
      const preset = ENTERTAINMENT_CONTENT_MOCKS.find((item) => item.id === entry.id);
      const invalidLegacyIcon = !entry.iconData || entry.iconData.includes("/@fs/") || entry.iconData.includes("/assets/entertainment-");
      return { id: entry.id, name: entry.name, description: entry.description, iconData: preset && invalidLegacyIcon ? preset.iconData : entry.iconData, targetUrl: entry.entryUrl, enabled: entry.enabled, displayOrder: entry.displayOrder };
    });
  } catch {
    return ENTERTAINMENT_CONTENT_MOCKS;
  }
};

export const getEntertainmentContentById = (contentId: string) => (
  readEntertainmentContents().find((content) => content.id === contentId)
);

export const getActiveEntertainmentContentsForProject = (_projectId: string) => (
  readEntertainmentContents()
    .filter((content) => content.enabled)
    .sort((first, second) => first.displayOrder - second.displayOrder)
);
