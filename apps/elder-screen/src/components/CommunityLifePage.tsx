import { Fragment, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronRight,
  CircleAlert,
  Loader2,
  Mic,
  Megaphone,
  MessageCircle,
  MessageSquareText,
  Newspaper,
  Plus,
  Quote,
  RefreshCcw,
  Send,
  ShieldAlert,
  Sparkles,
  Square,
  X,
  type LucideIcon,
} from "lucide-react";
import SecondaryPageHeader from "./SecondaryPageHeader";
import type { AntiScamTip, CommunityActivity } from "../types";
import "./community-life-page.css";

export type CommunityLifeAcceptanceScenario =
  | "default"
  | "empty"
  | "load-failure"
  | "topic-normal"
  | "topic-elder"
  | "topic-backend"
  | "topic-standalone"
  | "topic-reference"
  | "topic-no-comments"
  | "topic-multiple-comments"
  | "topic-reference-expired"
  | "topic-closed"
  | "topic-publish-failure"
  | "topic-comment-failure"
  | "topic-empty"
  | "topic-load-failure";

type CommunityInfoCategory = "announcement" | "life-info";
type CommunityLifeCategory = CommunityInfoCategory | "topic" | "activity" | "alert";

interface CommunityLifePageProps {
  isOpen: boolean;
  onClose: () => void;
  activities: CommunityActivity[];
  alerts: AntiScamTip[];
  alertReadIds: string[];
  onOpenActivity: (activityId: string) => void;
  onOpenAlert: (alertId: string) => void;
  acceptanceScenario?: CommunityLifeAcceptanceScenario;
}

interface CommunityCategoryDefinition {
  id: CommunityLifeCategory;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}

interface CommunityInfoItem {
  id: string;
  category: CommunityInfoCategory;
  title: string;
  summary: string;
  source: string;
  publishAt: string;
  coverUrl?: string;
  body: string[];
}

interface CommunityTopicReference {
  infoId: string;
  title: string;
  summary: string;
  source: string;
  snapshotBody: string[];
  isAvailable: boolean;
}

interface CommunityTopicComment {
  id: string;
  author: string;
  publishAt: string;
  content: string;
}

interface CommunityTopic {
  id: string;
  title: string;
  body: string;
  initiator: string;
  initiatorType: "community" | "elder" | "backend";
  publishAt: string;
  status: "open" | "closed";
  reference?: CommunityTopicReference;
  comments: CommunityTopicComment[];
}

type VoiceCaptureState = "idle" | "listening" | "processing" | "ready";

const categories: CommunityCategoryDefinition[] = [
  { id: "announcement", label: "社区公告", description: "社区通知与设施安排", icon: Megaphone, tone: "cyan" },
  { id: "life-info", label: "生活资讯", description: "饮食、健康与居家知识", icon: Newspaper, tone: "green" },
  { id: "topic", label: "社区话题", description: "看话题、说想法、留评论", icon: MessageSquareText, tone: "blue" },
  { id: "activity", label: "社区活动", description: "查看活动并表达参加意向", icon: Sparkles, tone: "purple" },
  { id: "alert", label: "警惕事项", description: "防诈骗与居家安全提示", icon: ShieldAlert, tone: "amber" },
];

const communityInfoItems: CommunityInfoItem[] = [
  {
    id: "announcement-lift",
    category: "announcement",
    title: "本周三上午进行电梯例行检查",
    summary: "上午 09:00—11:00 检查，期间请使用东侧电梯。",
    source: "安心到家社区服务中心",
    publishAt: "今天 08:30",
    coverUrl: "https://loremflickr.com/720/480/elevator,building?lock=41",
    body: [
      "本周三上午 09:00—11:00，物业将对西侧电梯进行例行安全检查。检查期间，西侧电梯暂停使用。",
      "需要出行的居民请使用东侧电梯。行动不便、需要协助的居民，可以提前联系社区服务站。",
    ],
  },
  {
    id: "announcement-clinic",
    category: "announcement",
    title: "周五便民测量血压服务时间调整",
    summary: "本周五服务时间调整为下午 14:00—16:00。",
    source: "安心到家社区服务中心",
    publishAt: "昨天 16:20",
    coverUrl: "https://loremflickr.com/720/480/blood-pressure,health?lock=42",
    body: [
      "本周五便民测量血压服务调整到下午 14:00—16:00，地点仍在社区一楼健康服务角。",
      "到场后请按工作人员引导排队，不需要提前报名。",
    ],
  },
  {
    id: "life-summer-water",
    category: "life-info",
    title: "天气炎热，少量多次补水更舒适",
    summary: "不要等到口渴再喝水，外出时记得随身带水。",
    source: "社区健康服务站",
    publishAt: "今天 09:10",
    coverUrl: "https://loremflickr.com/720/480/drinking-water,senior?lock=43",
    body: [
      "天气炎热时，可以少量多次补充温水。一次不需要喝得太急，避免引起身体不适。",
      "外出前带好饮用水，尽量避开正午高温时段。如有医生特别交代需要限制饮水，请遵照医生建议。",
    ],
  },
  {
    id: "life-home-light",
    category: "life-info",
    title: "夜间起身先开灯，减少跌倒风险",
    summary: "床边保留容易触及的灯，通道上不要堆放杂物。",
    source: "社区居家安全小组",
    publishAt: "周一 10:00",
    coverUrl: "https://loremflickr.com/720/480/night-light,home?lock=44",
    body: [
      "夜间起身时，请先在床边坐稳，再打开照明。确认没有头晕后再慢慢站起来。",
      "卧室到卫生间的通道要保持畅通，地面有水时及时擦干。",
    ],
  },
];

const baseTopics: CommunityTopic[] = [
  {
    id: "topic-garden",
    title: "社区花园秋季想增加哪些植物？",
    body: "大家平时喜欢哪些花草？社区想在秋季补充一批好打理的植物，欢迎留下想法。",
    initiator: "社区园艺工作组",
    initiatorType: "community",
    publishAt: "今天 10:30",
    status: "open",
    reference: {
      infoId: "life-home-light",
      title: "夜间起身先开灯，减少跌倒风险",
      summary: "床边保留容易触及的灯，通道上不要堆放杂物。",
      source: "社区居家安全小组",
      snapshotBody: communityInfoItems.find((item) => item.id === "life-home-light")?.body ?? [],
      isAvailable: true,
    },
    comments: [
      { id: "comment-garden-1", author: "李奶奶", publishAt: "今天 10:46", content: "我喜欢桂花，闻起来很舒服。" },
      { id: "comment-garden-2", author: "王建国（我）", publishAt: "今天 10:52", content: "也可以留一块地种点葱和青菜。" },
    ],
  },
  {
    id: "topic-canteen",
    title: "长者食堂下月菜单想怎么调整？",
    body: "我们想减少过咸菜品，增加软烂和小份菜选择。大家有喜欢的菜可以留言。",
    initiator: "社区服务后台",
    initiatorType: "backend",
    publishAt: "昨天 11:40",
    status: "open",
    comments: [],
  },
  {
    id: "topic-elder-walk",
    title: "傍晚散步的时候一起结个伴",
    body: "我一般傍晚五点多在楼下慢走，有时间的邻居可以一起走走。",
    initiator: "王建国（我）",
    initiatorType: "elder",
    publishAt: "周一 17:05",
    status: "closed",
    comments: [
      { id: "comment-walk-1", author: "陈爷爷", publishAt: "周一 17:18", content: "我也是这个时间，天气好就一起。" },
    ],
  },
];

const cloneTopics = (topics: CommunityTopic[]) => topics.map((topic) => ({
  ...topic,
  reference: topic.reference ? {
    ...topic.reference,
    snapshotBody: [...topic.reference.snapshotBody],
  } : undefined,
  comments: topic.comments.map((comment) => ({ ...comment })),
}));

const referenceFromInfo = (item: CommunityInfoItem): CommunityTopicReference => ({
  infoId: item.id,
  title: item.title,
  summary: item.summary,
  source: item.source,
  snapshotBody: [...item.body],
  isAvailable: true,
});

const summarizeTopicTitle = (content: string, reference?: CommunityTopicReference) => {
  if (reference) return `聊聊“${reference.title}”`;
  const normalized = content.trim().replace(/\s+/g, " ");
  const firstSentence = normalized.split(/[。！？!?]/)[0]?.trim() || normalized;
  if (!firstSentence) return "我想和大家聊聊";
  return firstSentence.length > 18 ? `${firstSentence.slice(0, 18)}…` : firstSentence;
};

export default function CommunityLifePage({
  isOpen,
  onClose,
  activities,
  alerts,
  alertReadIds,
  onOpenActivity,
  onOpenAlert,
  acceptanceScenario = "default",
}: CommunityLifePageProps) {
  const [selectedCategory, setSelectedCategory] = useState<CommunityLifeCategory>("announcement");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [topics, setTopics] = useState<CommunityTopic[]>(() => cloneTopics(baseTopics));
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [isTopicComposerOpen, setIsTopicComposerOpen] = useState(false);
  const [composerReference, setComposerReference] = useState<CommunityTopicReference | undefined>();
  const [topicBodyDraft, setTopicBodyDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [topicVoiceState, setTopicVoiceState] = useState<VoiceCaptureState>("idle");
  const [topicTextEditing, setTopicTextEditing] = useState(false);
  const [commentVoiceState, setCommentVoiceState] = useState<VoiceCaptureState>("idle");
  const [commentTextEditing, setCommentTextEditing] = useState(false);
  const [publishState, setPublishState] = useState<"idle" | "submitting" | "error">("idle");
  const [commentState, setCommentState] = useState<"idle" | "submitting" | "error">("idle");
  const [readIds, setReadIds] = useState<string[]>([]);
  const [retrySucceeded, setRetrySucceeded] = useState(false);

  const effectiveScenario = (acceptanceScenario === "load-failure" || acceptanceScenario === "topic-load-failure") && retrySucceeded
    ? (acceptanceScenario === "topic-load-failure" ? "topic-normal" : "default")
    : acceptanceScenario;

  const selectedItem = useMemo(
    () => communityInfoItems.find((item) => item.id === selectedItemId) ?? null,
    [selectedItemId],
  );
  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedTopicId) ?? null,
    [selectedTopicId, topics],
  );
  const isGenericEmpty = effectiveScenario === "empty";
  const isGenericLoadFailure = effectiveScenario === "load-failure";
  const isTopicEmpty = effectiveScenario === "topic-empty";
  const isTopicLoadFailure = effectiveScenario === "topic-load-failure";
  const visibleInfoItems = !isGenericEmpty && !isGenericLoadFailure
    ? communityInfoItems.filter((item) => item.category === selectedCategory)
    : [];
  const visibleCount = selectedCategory === "activity"
    ? activities.length
    : selectedCategory === "alert"
      ? alerts.length
      : selectedCategory === "topic"
        ? (isTopicEmpty || isTopicLoadFailure ? 0 : topics.length)
      : visibleInfoItems.length;
  const categoryDefinition = categories.find((item) => item.id === selectedCategory) ?? categories[0];

  useEffect(() => {
    if (!isOpen) {
      setSelectedItemId(null);
      setSelectedTopicId(null);
      setIsTopicComposerOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setRetrySucceeded(false);
    const nextTopics = cloneTopics(baseTopics);
    if (acceptanceScenario === "topic-reference-expired") {
      nextTopics[0] = {
        ...nextTopics[0],
        reference: nextTopics[0].reference ? { ...nextTopics[0].reference, isAvailable: false } : undefined,
      };
    }
    if (acceptanceScenario === "topic-elder") {
      nextTopics[2] = { ...nextTopics[2], status: "open" };
    }
    setTopics(nextTopics);
    setSelectedItemId(null);
    setSelectedTopicId(null);
    setIsTopicComposerOpen(false);
    setComposerReference(undefined);
    setTopicBodyDraft("");
    setCommentDraft("");
    setTopicVoiceState("idle");
    setTopicTextEditing(false);
    setCommentVoiceState("idle");
    setCommentTextEditing(false);
    setPublishState("idle");
    setCommentState("idle");

    if (acceptanceScenario.startsWith("topic-")) {
      setSelectedCategory("topic");
      if (acceptanceScenario === "topic-elder" || acceptanceScenario === "topic-closed") setSelectedTopicId("topic-elder-walk");
      if (acceptanceScenario === "topic-backend" || acceptanceScenario === "topic-no-comments") setSelectedTopicId("topic-canteen");
      if (["topic-normal", "topic-multiple-comments", "topic-reference-expired", "topic-comment-failure"].includes(acceptanceScenario)) {
        setSelectedTopicId("topic-garden");
      }
      if (acceptanceScenario === "topic-standalone" || acceptanceScenario === "topic-publish-failure") {
        setTopicBodyDraft("傍晚散步时这里有些暗，想问问大家是不是也有同样的感受。");
        setIsTopicComposerOpen(true);
        setTopicVoiceState("ready");
      }
      if (acceptanceScenario === "topic-reference") {
        const info = communityInfoItems.find((item) => item.id === "life-summer-water");
        if (info) setComposerReference(referenceFromInfo(info));
        setTopicBodyDraft("这篇资讯提醒要少量多次补水，想听听大家平时都怎么安排。");
        setIsTopicComposerOpen(true);
        setTopicVoiceState("ready");
      }
      if (acceptanceScenario === "topic-comment-failure") {
        setCommentDraft("我也觉得这个建议很好。");
        setCommentVoiceState("ready");
      }
    } else {
      setSelectedCategory("announcement");
    }
  }, [acceptanceScenario]);

  if (!isOpen) return null;

  const chooseCategory = (category: CommunityLifeCategory) => {
    setSelectedItemId(null);
    setSelectedTopicId(null);
    setIsTopicComposerOpen(false);
    setSelectedCategory(category);
  };

  const openItem = (item: CommunityInfoItem) => {
    setSelectedItemId(item.id);
    setReadIds((current) => current.includes(item.id) ? current : [...current, item.id]);
  };

  const openTopicComposer = (reference?: CommunityTopicReference) => {
    setComposerReference(reference);
    setTopicBodyDraft("");
    setPublishState("idle");
    setTopicVoiceState("idle");
    setTopicTextEditing(false);
    setIsTopicComposerOpen(true);
  };

  const startTopicVoice = () => {
    setTopicBodyDraft("");
    setPublishState("idle");
    setTopicTextEditing(false);
    setTopicVoiceState("listening");
  };

  const finishTopicVoice = () => {
    setTopicVoiceState("processing");
    window.setTimeout(() => {
      setTopicBodyDraft(composerReference
        ? "我听完这篇资讯觉得很实用，想问问大家平时都是怎么做的。"
        : "我一般傍晚五点左右下楼走一走，想问问有没有邻居愿意一起散步？");
      setTopicVoiceState("ready");
    }, 650);
  };

  const startCommentVoice = () => {
    setCommentDraft("");
    setCommentState("idle");
    setCommentTextEditing(false);
    setCommentVoiceState("listening");
  };

  const finishCommentVoice = () => {
    setCommentVoiceState("processing");
    window.setTimeout(() => {
      setCommentDraft("我也觉得这个建议很好，天气合适的时候可以一起参加。");
      setCommentVoiceState("ready");
    }, 550);
  };

  const publishTopic = async () => {
    const topicBody = topicBodyDraft.trim();
    if (!topicBody || publishState === "submitting") return;
    setPublishState("submitting");
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    if (acceptanceScenario === "topic-publish-failure") {
      setPublishState("error");
      return;
    }
    const newTopic: CommunityTopic = {
      id: `topic-elder-${Date.now()}`,
      title: summarizeTopicTitle(topicBody, composerReference),
      body: topicBody,
      initiator: "王建国（我）",
      initiatorType: "elder",
      publishAt: "刚刚",
      status: "open",
      reference: composerReference,
      comments: [],
    };
    setTopics((current) => [newTopic, ...current]);
    setSelectedTopicId(newTopic.id);
    setIsTopicComposerOpen(false);
    setPublishState("idle");
    setTopicVoiceState("idle");
    setTopicTextEditing(false);
  };

  const submitComment = async () => {
    if (!selectedTopic || selectedTopic.status === "closed" || !commentDraft.trim() || commentState === "submitting") return;
    setCommentState("submitting");
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    if (acceptanceScenario === "topic-comment-failure") {
      setCommentState("error");
      return;
    }
    const nextComment: CommunityTopicComment = {
      id: `comment-${Date.now()}`,
      author: "王建国（我）",
      publishAt: "刚刚",
      content: commentDraft.trim(),
    };
    setTopics((current) => current.map((topic) => topic.id === selectedTopic.id
      ? { ...topic, comments: [...topic.comments, nextComment] }
      : topic));
    setCommentDraft("");
    setCommentState("idle");
    setCommentVoiceState("idle");
    setCommentTextEditing(false);
  };

  const openReferencedInfo = (reference: CommunityTopicReference) => {
    if (!reference.isAvailable) return;
    setSelectedTopicId(null);
    setSelectedCategory("life-info");
    setSelectedItemId(reference.infoId);
    setReadIds((current) => current.includes(reference.infoId) ? current : [...current, reference.infoId]);
  };

  const CategoryIcon = categoryDefinition.icon;

  return (
    <main className="community-life-page" aria-label="社区生活">
      <SecondaryPageHeader
        title="社区生活"
        icon={<Sparkles aria-hidden="true" />}
        onBack={onClose}
        actions={<span className="community-life-trust"><BadgeCheck aria-hidden="true" />内容由社区发布</span>}
      />

      <div className="community-life-layout">
        <nav className="community-life-categories" aria-label="社区生活分类">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = category.id === selectedCategory;
            return (
              <button
                key={category.id}
                type="button"
                className={isActive ? "is-active" : ""}
                data-tone={category.tone}
                onClick={() => chooseCategory(category.id)}
              >
                <span><Icon aria-hidden="true" /></span>
                <strong>{category.label}</strong>
                <small>{category.description}</small>
                <ChevronRight aria-hidden="true" />
              </button>
            );
          })}
        </nav>

        <section className="community-life-content" aria-labelledby="community-life-section-title">
          <header>
            <div>
              <CategoryIcon aria-hidden="true" />
              <h2 id="community-life-section-title">{categoryDefinition.label}</h2>
            </div>
            <div className="community-life-content__actions">
              {selectedCategory === "topic" && (
                <button className="community-life-create" type="button" onClick={() => openTopicComposer()}>
                  <Plus aria-hidden="true" />发起话题
                </button>
              )}
              <span>{visibleCount} 条内容</span>
            </div>
          </header>

          {(isGenericLoadFailure || (selectedCategory === "topic" && isTopicLoadFailure)) ? (
            <div className="community-life-state is-error" role="alert">
              <CircleAlert aria-hidden="true" />
              <h3>内容暂时没有加载出来</h3>
              <p>请稍后再试，其他功能不受影响。</p>
              <button type="button" onClick={() => setRetrySucceeded(true)}>
                <RefreshCcw aria-hidden="true" />重新加载
              </button>
            </div>
          ) : (isGenericEmpty || (selectedCategory === "topic" && isTopicEmpty)) ? (
            <div className="community-life-state">
              <Newspaper aria-hidden="true" />
              <h3>当前暂无内容</h3>
              <p>社区发布新内容后，会在这里展示。</p>
              {selectedCategory === "topic"
                ? <button type="button" onClick={() => openTopicComposer()}><Plus aria-hidden="true" />发起第一个话题</button>
                : <button type="button" onClick={onClose}>返回首页</button>}
            </div>
          ) : selectedCategory === "topic" ? (
            <div className="community-topic-list">
              {topics.map((topic) => (
                <button key={topic.id} type="button" className="community-topic-card" onClick={() => setSelectedTopicId(topic.id)}>
                  <span className="community-topic-card__icon"><MessageCircle aria-hidden="true" /></span>
                  <span className="community-topic-card__copy">
                    <span className="community-topic-card__meta">
                      <small>{topic.initiator} · {topic.publishAt}</small>
                      {topic.status === "closed" && <em>话题已关闭</em>}
                    </span>
                    <strong>{topic.title}</strong>
                    <p>{topic.body}</p>
                    {topic.reference && (
                      <span className="community-topic-card__reference"><Quote aria-hidden="true" />引用资讯：{topic.reference.title}</span>
                    )}
                  </span>
                  <span className="community-topic-card__count"><MessageSquareText aria-hidden="true" />{topic.comments.length} 条评论</span>
                  <ChevronRight aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <div className="community-life-info-list">
              {selectedCategory === "activity" ? activities.map((activity) => {
                const statusLabel = activity.status === "cancelled"
                    ? "已取消"
                    : activity.status === "ended"
                      ? "已结束"
                      : activity.status === "ongoing"
                        ? "活动进行中"
                        : "可查看";
                const liveLabel = activity.liveEnabled
                  ? activity.liveStatus === "live"
                    ? "直播中"
                    : activity.liveStatus === "ended"
                      ? "直播已结束"
                      : activity.scheduledLiveStartAt
                        ? `预计${activity.scheduledLiveStartAt}开播`
                        : "直播未开始"
                  : null;
                return (
                  <button key={activity.id} type="button" onClick={() => onOpenActivity(activity.id)}>
                    <span className={`community-life-info-list__media${activity.imageUrl ? " has-cover" : ""}`}>
                      <CategoryIcon aria-hidden="true" />
                      {activity.imageUrl && <img src={activity.imageUrl} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />}
                    </span>
                    <span className="community-life-info-list__copy">
                      <span><small>{activity.tag}</small><span className="community-life-info-list__activity-statuses"><em className={activity.status === "cancelled" || activity.status === "ended" ? "is-unavailable" : ""}>{statusLabel}</em>{liveLabel && <em className="is-live">{liveLabel}</em>}</span></span>
                      <strong>{activity.title}</strong>
                      <p>{activity.description ?? "查看活动介绍与参加方式。"}</p>
                      <small>{activity.time} · {activity.location}</small>
                    </span>
                    <ChevronRight aria-hidden="true" />
                  </button>
                );
              }) : selectedCategory === "alert" ? alerts.map((alert) => {
                const hasRead = alertReadIds.includes(alert.id);
                return (
                  <button key={alert.id} type="button" onClick={() => onOpenAlert(alert.id)}>
                    <span className={`community-life-info-list__media${alert.coverUrl ? " has-cover" : ""}`}>
                      <CategoryIcon aria-hidden="true" />
                      {alert.coverUrl && <img src={alert.coverUrl} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />}
                    </span>
                    <span className="community-life-info-list__copy">
                      <span>
                        <small>{alert.source}</small>
                        {hasRead ? <em>已查看</em> : <span className="community-life-info-list__badge">待查看</span>}
                      </span>
                      <strong>{alert.title}</strong>
                      <p>{alert.summary ?? alert.description}</p>
                      <small>{alert.category}</small>
                    </span>
                    <ChevronRight aria-hidden="true" />
                  </button>
                );
              }) : visibleInfoItems.map((item) => {
                const hasRead = readIds.includes(item.id);
                return (
                  <button key={item.id} type="button" onClick={() => openItem(item)}>
                    <span className={`community-life-info-list__media${item.coverUrl ? " has-cover" : ""}`}>
                      <CategoryIcon aria-hidden="true" />
                      {item.coverUrl && <img src={item.coverUrl} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />}
                    </span>
                    <span className="community-life-info-list__copy">
                      <span><small>{item.source}</small>{hasRead ? <em>已查看</em> : <b>新内容</b>}</span>
                      <strong>{item.title}</strong>
                      <p>{item.summary}</p>
                      <small>{item.publishAt}</small>
                    </span>
                    <ChevronRight aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {selectedItem && (
        <section className="community-life-detail" role="dialog" aria-modal="true" aria-label={`查看${categoryDefinition.label}：${selectedItem.title}`}>
          <header>
            <button type="button" onClick={() => setSelectedItemId(null)}><X aria-hidden="true" />收起</button>
            <strong>{categoryDefinition.label}</strong>
          </header>
          <article>
            <div className="community-life-detail__meta">
              <span><BadgeCheck aria-hidden="true" />已查看</span>
              <small>{selectedItem.source} · {selectedItem.publishAt}</small>
            </div>
            <h2>{selectedItem.title}</h2>
            <p className="community-life-detail__summary">{selectedItem.summary}</p>
            <div className="community-life-detail__body">
              {selectedItem.body.map((paragraph, index) => (
                <Fragment key={paragraph}>
                  <p>{paragraph}</p>
                  {index === 0 && selectedItem.coverUrl && (
                    <img
                      className="community-life-detail__inline-image"
                      src={selectedItem.coverUrl}
                      alt=""
                      onError={(event) => { event.currentTarget.hidden = true; }}
                    />
                  )}
                </Fragment>
              ))}
              {selectedItem.body.length === 0 && selectedItem.coverUrl && (
                <img
                  className="community-life-detail__inline-image"
                  src={selectedItem.coverUrl}
                  alt=""
                  onError={(event) => { event.currentTarget.hidden = true; }}
                />
              )}
            </div>
            {selectedItem.category === "life-info" && (
              <button className="community-life-detail__quote-action" type="button" onClick={() => openTopicComposer(referenceFromInfo(selectedItem))}>
                <Quote aria-hidden="true" />引用整篇资讯发起话题
              </button>
            )}
          </article>
        </section>
      )}

      {isTopicComposerOpen && (
        <section className="community-topic-composer" role="dialog" aria-modal="true" aria-label="发起社区话题">
          <header>
            <button type="button" onClick={() => setIsTopicComposerOpen(false)}><X aria-hidden="true" />收起</button>
            <strong>发起话题</strong>
          </header>
          <div className="community-topic-composer__panel">
            <div className="community-topic-composer__heading">
              <Mic aria-hidden="true" />
              <div><h2>点一下，把想说的话告诉大家</h2><p>系统会整理成文字，您确认后才会发布。</p></div>
            </div>
            {composerReference && (
              <div className="community-topic-reference is-composer">
                <span><Quote aria-hidden="true" />引用整篇生活资讯</span>
                <strong>{composerReference.title}</strong>
                <p>{composerReference.summary}</p>
                <small>{composerReference.source}</small>
              </div>
            )}
            <div className={`community-topic-voice is-${topicVoiceState}`}>
              {topicVoiceState === "idle" && (
                <>
                  <button className="community-topic-voice__main" type="button" onClick={startTopicVoice}>
                    <Mic aria-hidden="true" />点一下开始说话
                  </button>
                  <p className="community-topic-voice__hint">不用一直按住，说完后再点“说完了”</p>
                </>
              )}
              {topicVoiceState === "listening" && (
                <>
                  <div className="community-topic-voice__status" role="status">
                    <span className="community-topic-voice__wave" aria-hidden="true"><i /><i /><i /><i /><i /></span>
                    <strong>正在听您说…</strong>
                  </div>
                  <button className="community-topic-voice__main is-stop" type="button" onClick={finishTopicVoice}>
                    <Square aria-hidden="true" />我说完了
                  </button>
                </>
              )}
              {topicVoiceState === "processing" && (
                <div className="community-topic-voice__status" role="status">
                  <Loader2 className="is-spinning" aria-hidden="true" /><strong>正在整理您的话…</strong>
                </div>
              )}
              {topicVoiceState === "ready" && (
                <>
                  <div className="community-topic-voice__preview">
                    <small>请确认这段话</small>
                    <p>{topicBodyDraft}</p>
                  </div>
                  <div className="community-topic-voice__secondary">
                    <button type="button" onClick={startTopicVoice}><Mic aria-hidden="true" />重新说一遍</button>
                    <button type="button" onClick={() => setTopicTextEditing((current) => !current)}>修改文字</button>
                  </div>
                </>
              )}
            </div>
            {topicVoiceState === "ready" && topicTextEditing && (
              <div className="community-topic-voice__editor">
                <label>
                  <span>想说的话</span>
                  <textarea value={topicBodyDraft} onChange={(event) => setTopicBodyDraft(event.target.value)} maxLength={300} />
                </label>
              </div>
            )}
            {publishState === "error" && <p className="community-topic-error" role="alert">发布失败，内容已经保留，请再试一次。</p>}
            <div className="community-topic-composer__actions">
              <button type="button" onClick={() => setIsTopicComposerOpen(false)}>取消</button>
              <button type="button" disabled={topicVoiceState !== "ready" || !topicBodyDraft.trim() || publishState === "submitting"} onClick={publishTopic}>
                {publishState === "submitting" ? <><Loader2 className="is-spinning" aria-hidden="true" />正在发布</> : <><Send aria-hidden="true" />确认发布</>}
              </button>
            </div>
          </div>
        </section>
      )}

      {selectedTopic && (
        <section className="community-topic-detail" role="dialog" aria-modal="true" aria-label={`社区话题：${selectedTopic.title}`}>
          <header>
            <button type="button" onClick={() => setSelectedTopicId(null)}><X aria-hidden="true" />收起</button>
            <strong>社区话题</strong>
          </header>
          <div className="community-topic-detail__scroll">
            <article className="community-topic-detail__article">
              <div className="community-topic-detail__meta">
                <span>{selectedTopic.initiator}</span><small>{selectedTopic.publishAt}</small>
                {selectedTopic.status === "closed" && <em>话题已关闭</em>}
              </div>
              <h2>{selectedTopic.title}</h2>
              <p>{selectedTopic.body}</p>
              {selectedTopic.reference && (
                <button
                  type="button"
                  className={`community-topic-reference${selectedTopic.reference.isAvailable ? "" : " is-unavailable"}`}
                  onClick={() => openReferencedInfo(selectedTopic.reference!)}
                  disabled={!selectedTopic.reference.isAvailable}
                >
                  <span><Quote aria-hidden="true" />引用生活资讯</span>
                  <strong>{selectedTopic.reference.title}</strong>
                  <p>{selectedTopic.reference.summary}</p>
                  <small>{selectedTopic.reference.isAvailable ? "查看原文" : "原资讯已失效，以上为发布时快照"}</small>
                </button>
              )}
            </article>
            <section className="community-topic-comments" aria-label="话题评论">
              <header><div><MessageSquareText aria-hidden="true" /><h3>大家的评论</h3></div><span>{selectedTopic.comments.length} 条</span></header>
              {selectedTopic.comments.length === 0 ? (
                <div className="community-topic-comments__empty"><MessageCircle aria-hidden="true" /><p>还没有评论，欢迎留下第一句话。</p></div>
              ) : (
                <div className="community-topic-comments__list">
                  {selectedTopic.comments.map((comment) => (
                    <article key={comment.id}>
                      <div><strong>{comment.author}</strong><small>{comment.publishAt}</small></div>
                      <p>{comment.content}</p>
                    </article>
                  ))}
                </div>
              )}
              {selectedTopic.status === "closed" ? (
                <p className="community-topic-closed"><CircleAlert aria-hidden="true" />话题已关闭，可以查看历史评论，但不能再发表评论。</p>
              ) : (
                <div className="community-topic-comment-form">
                  <h4><Mic aria-hidden="true" />说说您的想法</h4>
                  <div className={`community-topic-voice is-comment is-${commentVoiceState}`}>
                    {commentVoiceState === "idle" && (
                      <button className="community-topic-voice__main" type="button" onClick={startCommentVoice}>
                        <Mic aria-hidden="true" />点一下说评论
                      </button>
                    )}
                    {commentVoiceState === "listening" && (
                      <>
                        <div className="community-topic-voice__status" role="status">
                          <span className="community-topic-voice__wave" aria-hidden="true"><i /><i /><i /><i /><i /></span>
                          <strong>正在听您说…</strong>
                        </div>
                        <button className="community-topic-voice__main is-stop" type="button" onClick={finishCommentVoice}>
                          <Square aria-hidden="true" />我说完了
                        </button>
                      </>
                    )}
                    {commentVoiceState === "processing" && (
                      <div className="community-topic-voice__status" role="status">
                        <Loader2 className="is-spinning" aria-hidden="true" /><strong>正在整理您的评论…</strong>
                      </div>
                    )}
                    {commentVoiceState === "ready" && (
                      <>
                        <div className="community-topic-voice__preview">
                          <small>请确认评论内容</small>
                          <p>{commentDraft}</p>
                        </div>
                        <div className="community-topic-voice__secondary">
                          <button type="button" onClick={startCommentVoice}><Mic aria-hidden="true" />重新说一遍</button>
                          <button type="button" onClick={() => setCommentTextEditing((current) => !current)}>修改文字</button>
                        </div>
                      </>
                    )}
                  </div>
                  {commentVoiceState === "ready" && commentTextEditing && (
                    <textarea id="community-topic-comment" value={commentDraft} onChange={(event) => { setCommentDraft(event.target.value); setCommentState("idle"); }} maxLength={200} />
                  )}
                  <button type="button" disabled={commentVoiceState !== "ready" || !commentDraft.trim() || commentState === "submitting"} onClick={submitComment}>
                    {commentState === "submitting" ? <Loader2 className="is-spinning" aria-hidden="true" /> : <Send aria-hidden="true" />}确认发表
                  </button>
                  {commentState === "error" && <p className="community-topic-error" role="alert">评论发送失败，文字已经保留，请重试。</p>}
                </div>
              )}
            </section>
          </div>
        </section>
      )}
    </main>
  );
}
