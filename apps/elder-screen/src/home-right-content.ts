import { getEntertainmentContentById } from "./entertainment-content";

export type HomeRecommendationKind = "security" | "community" | "service" | "entertainment";

export interface HomeRecommendationConfig {
  contentId: string;
  kind: HomeRecommendationKind;
  title: string;
  subtitle?: string;
  targetUrl?: string;
  applicableAudiences: string[];
  effectiveAt: string;
  expiresAt: string;
  enabled: boolean;
  displayOrder: number;
  publishedAt: string;
  displayDurationMs: number;
}

export interface RecommendationRuntimeState {
  viewed: boolean;
}

const entertainmentRecommendationContent = getEntertainmentContentById("ENT-002");

export const HOME_RECOMMENDATION_CONFIGS: HomeRecommendationConfig[] = [
  {
    contentId: "REC-SAFE-001",
    kind: "security",
    title: "诈骗电话怎么防？",
    subtitle: "按一下听警官说",
    applicableAudiences: ["elder", "living-alone"],
    effectiveAt: "2026-01-01T00:00:00+08:00",
    expiresAt: "2027-12-31T23:59:59+08:00",
    enabled: true,
    displayOrder: 10,
    publishedAt: "2026-08-18T09:30:00+08:00",
    displayDurationMs: 8_000,
  },
  {
    contentId: "REC-ACTIVITY-003",
    kind: "community",
    title: "明天社区剪纸活动",
    subtitle: "按一下查看并报名",
    applicableAudiences: ["elder"],
    effectiveAt: "2026-01-01T00:00:00+08:00",
    expiresAt: "2027-12-31T23:59:59+08:00",
    enabled: true,
    displayOrder: 3,
    publishedAt: "2026-08-19T08:00:00+08:00",
    displayDurationMs: 8_000,
  },
  {
    contentId: "REC-010",
    kind: "entertainment",
    title: entertainmentRecommendationContent?.name ?? "Spotify",
    targetUrl: entertainmentRecommendationContent?.targetUrl,
    applicableAudiences: ["elder"],
    effectiveAt: "2026-01-01T00:00:00+08:00",
    expiresAt: "2027-12-31T23:59:59+08:00",
    enabled: true,
    displayOrder: 20,
    publishedAt: "2026-08-17T19:00:00+08:00",
    displayDurationMs: 8_000,
  },
];

export const sortRecommendationConfigs = (configs: HomeRecommendationConfig[]) => [...configs].sort((first, second) => {
  if (first.displayOrder !== second.displayOrder) return first.displayOrder - second.displayOrder;
  const publishDifference = new Date(first.publishedAt).getTime() - new Date(second.publishedAt).getTime();
  if (publishDifference !== 0) return publishDifference;
  return first.contentId.localeCompare(second.contentId);
});

export const getEligibleRecommendationConfigs = (
  configs: HomeRecommendationConfig[],
  now: Date,
  audience: string,
  runtime: Record<string, RecommendationRuntimeState>,
) => sortRecommendationConfigs(configs.filter((config) => {
  const state = runtime[config.contentId];
  const nowTime = now.getTime();
  return config.enabled
    && config.applicableAudiences.includes(audience)
    && new Date(config.effectiveAt).getTime() <= nowTime
    && new Date(config.expiresAt).getTime() >= nowTime
    && !state?.viewed;
}));

export const createRecommendationRuntime = (): Record<string, RecommendationRuntimeState> => Object.fromEntries(
  HOME_RECOMMENDATION_CONFIGS.map((config) => [config.contentId, {
    viewed: false,
  }]),
);
