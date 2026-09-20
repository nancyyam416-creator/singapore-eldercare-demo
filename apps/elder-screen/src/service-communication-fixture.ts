export type ServiceFixtureMessage = {
  id: string;
  sender: "staff" | "elderly";
  type: "text" | "audio";
  content?: string;
  duration?: string;
  sentAt: string;
  deliveryStatus: "sending" | "failed" | "delivered";
  elderViewedAt: string | null;
  replyToMessageId?: string;
};

export type ServiceConversationFixture = {
  id: string;
  projectId: string;
  elderlyId: string;
  elderlyName: string;
  elderlyPhone: string;
  contactType: "个人服务人员" | "服务机构";
  contactName: string;
  staffName: string;
  contactPhone: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  conversationStatus: "未查看" | "已查看" | "已回复";
  messages: ServiceFixtureMessage[];
};

// 与管理后台 src/ServiceCommunication.jsx 的固定验收数据保持一致。
export const SERVICE_COMMUNICATION_FIXTURES: ServiceConversationFixture[] = [
  {
    id: "CONV-CARE-001",
    projectId: "PRJ-001",
    elderlyId: "SG-E-WANG-001",
    elderlyName: "王建国",
    elderlyPhone: "+65 8603 2918",
    contactType: "个人服务人员",
    contactName: "专属健康管家",
    staffName: "林佳慧",
    contactPhone: "+65 6273 2288",
    lastMessage: "好的，我晚上会按时测量血压。",
    lastMessageAt: "今天 10:32",
    unreadCount: 0,
    conversationStatus: "已回复",
    messages: [
      { id: "MSG-001", sender: "staff", type: "text", content: "王叔叔您好，请记得在晚饭后测量一次血压。", sentAt: "昨天 18:20", deliveryStatus: "delivered", elderViewedAt: "今天 08:45" },
      { id: "MSG-002", sender: "staff", type: "audio", duration: "00:18", sentAt: "今天 09:10", deliveryStatus: "delivered", elderViewedAt: "今天 10:25" },
      { id: "MSG-003", sender: "elderly", type: "audio", duration: "00:12", sentAt: "今天 10:31", deliveryStatus: "delivered", elderViewedAt: null, replyToMessageId: "MSG-002" },
      { id: "MSG-004", sender: "elderly", type: "text", content: "好的，我晚上会按时测量血压。", sentAt: "今天 10:32", deliveryStatus: "delivered", elderViewedAt: null, replyToMessageId: "MSG-001" },
    ],
  },
  {
    id: "CONV-STATION-001",
    projectId: "PRJ-001",
    elderlyId: "SG-E-WANG-001",
    elderlyName: "王建国",
    elderlyPhone: "+65 8603 2918",
    contactType: "服务机构",
    contactName: "社区服务站",
    staffName: "",
    contactPhone: "+65 6123 8801",
    lastMessage: "本周四下午有健康讲座，欢迎参加。",
    lastMessageAt: "今天 09:45",
    unreadCount: 1,
    conversationStatus: "未查看",
    messages: [
      { id: "MSG-101", sender: "staff", type: "text", content: "本周四下午有健康讲座，欢迎参加。", sentAt: "今天 09:45", deliveryStatus: "delivered", elderViewedAt: null },
      { id: "MSG-102", sender: "staff", type: "audio", duration: "00:22", sentAt: "昨天 16:08", deliveryStatus: "failed", elderViewedAt: null },
    ],
  },
];

export const secondsFromDuration = (duration?: string) => {
  if (!duration) return undefined;
  const [minutes, seconds] = duration.split(":").map(Number);
  return minutes * 60 + seconds;
};
