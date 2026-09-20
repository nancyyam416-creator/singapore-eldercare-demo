import { AlertTriangle, Building2, CheckCircle2, MessageSquareText, Mic, Pause, Play, RefreshCw, Search, Send, Square, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export const serviceCommunicationFixture = [
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
    staffUnreadReplyCount: 1,
    messages: [
      { messageId: "MSG-001", sender: "staff", type: "text", content: "王叔叔您好，请记得在晚饭后测量一次血压。", sentAt: "昨天 18:20", deliveryStatus: "delivered", elderViewedAt: "今天 08:45", replyToMessageId: null },
      { messageId: "MSG-002", sender: "staff", type: "audio", duration: "00:18", sentAt: "今天 09:10", deliveryStatus: "delivered", elderViewedAt: "今天 10:25", replyToMessageId: null },
      { messageId: "MSG-003", sender: "elderly", type: "audio", duration: "00:12", sentAt: "今天 10:31", deliveryStatus: "delivered", elderViewedAt: null, replyToMessageId: "MSG-002" },
      { messageId: "MSG-004", sender: "elderly", type: "text", content: "好的，我晚上会按时测量血压。", sentAt: "今天 10:32", deliveryStatus: "delivered", elderViewedAt: null, replyToMessageId: "MSG-001" },
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
    staffUnreadReplyCount: 0,
    messages: [
      { messageId: "MSG-101", sender: "staff", type: "text", content: "本周四下午有健康讲座，欢迎参加。", sentAt: "今天 09:45", deliveryStatus: "delivered", elderViewedAt: null, replyToMessageId: null },
      { messageId: "MSG-102", sender: "staff", type: "audio", duration: "00:22", sentAt: "昨天 16:08", deliveryStatus: "failed", elderViewedAt: null, replyToMessageId: null },
    ],
  },
];

const statusOptions = ["全部状态", "未查看", "已查看", "已回复"];

function ContactAvatar({ type }) {
  return <span className={`service-contact-avatar ${type === "服务机构" ? "organization" : "person"}`}>{type === "服务机构" ? <Building2 size={20}/> : <UserRound size={20}/>}</span>;
}

function MessageStatus({ message }) {
  if (message.sender === "elderly") return <span className="service-message-status elderly-reply">老人回复</span>;
  if (message.deliveryStatus === "failed") return <span className="service-message-status failed"><AlertTriangle size={12}/>发送失败</span>;
  if (message.deliveryStatus === "sending") return <span className="service-message-status sending">发送中…</span>;
  return <span className="service-message-status"><CheckCircle2 size={12}/>{message.elderViewedAt ? "老人已查看" : "已送达"}</span>;
}

function getConversationStatus(conversation) {
  if (conversation.messages.some((message) => message.sender === "elderly")) return "已回复";
  if (conversation.messages.some((message) => message.sender === "staff" && message.elderViewedAt)) return "已查看";
  return "未查看";
}

export function ServiceCommunicationPage({ projectId, communityName }) {
  const [conversations, setConversations] = useState(serviceCommunicationFixture);
  const [selectedId, setSelectedId] = useState("CONV-STATION-001");
  const [query, setQuery] = useState("");
  const [elderlyFilter, setElderlyFilter] = useState("全部老人");
  const [contactType, setContactType] = useState("全部类型");
  const [status, setStatus] = useState("全部状态");
  const [draft, setDraft] = useState("");
  const [voiceStage, setVoiceStage] = useState("idle");
  const [playingId, setPlayingId] = useState("");
  const localMessageSequence = useRef(1);

  const scopedConversations = useMemo(() => conversations.filter((item) => item.projectId === projectId), [conversations, projectId]);
  const elderlyOptions = useMemo(() => ["全部老人", ...new Set(scopedConversations.map((item) => item.elderlyName))], [scopedConversations]);
  const filteredConversations = useMemo(() => scopedConversations.filter((item) => {
    const keyword = query.trim().toLowerCase();
    const matchesKeyword = !keyword || [item.elderlyName, item.contactName, item.staffName, item.lastMessage].some((value) => String(value || "").toLowerCase().includes(keyword));
    return matchesKeyword
      && (elderlyFilter === "全部老人" || item.elderlyName === elderlyFilter)
      && (contactType === "全部类型" || item.contactType === contactType)
      && (status === "全部状态" || getConversationStatus(item) === status);
  }), [scopedConversations, query, elderlyFilter, contactType, status]);

  useEffect(() => {
    if (!scopedConversations.some((item) => item.id === selectedId)) setSelectedId(scopedConversations[0]?.id || "");
  }, [projectId, scopedConversations, selectedId]);

  const selected = scopedConversations.find((item) => item.id === selectedId);

  const selectConversation = (id) => {
    setSelectedId(id);
    setVoiceStage("idle");
    setConversations((items) => items.map((item) => item.id === id && item.staffUnreadReplyCount
      ? { ...item, staffUnreadReplyCount: 0 }
      : item));
  };

  const appendOutgoing = (message) => {
    if (!selected) return;
    setConversations((items) => items.map((item) => item.id === selected.id ? {
      ...item,
      lastMessage: message.type === "audio" ? `语音留言 ${message.duration}` : message.content,
      lastMessageAt: "刚刚",
      messages: [...item.messages, message],
    } : item));
    window.setTimeout(() => setConversations((items) => items.map((item) => item.id === selected.id ? {
      ...item,
      messages: item.messages.map((entry) => entry.messageId === message.messageId ? { ...entry, deliveryStatus: "delivered" } : entry),
    } : item)), 650);
  };

  const createLocalMessageId = () => {
    const messageId = `MSG-LOCAL-${String(localMessageSequence.current).padStart(3, "0")}`;
    localMessageSequence.current += 1;
    return messageId;
  };

  const sendText = () => {
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    appendOutgoing({ messageId: createLocalMessageId(), sender: "staff", type: "text", content, sentAt: "刚刚", deliveryStatus: "sending", elderViewedAt: null, replyToMessageId: null });
  };

  const sendVoice = () => {
    setVoiceStage("sending");
    const message = { messageId: createLocalMessageId(), sender: "staff", type: "audio", duration: "00:12", sentAt: "刚刚", deliveryStatus: "sending", elderViewedAt: null, replyToMessageId: null };
    appendOutgoing(message);
    window.setTimeout(() => setVoiceStage("idle"), 700);
  };

  const retryMessage = (messageId) => {
    if (!selected) return;
    setConversations((items) => items.map((item) => item.id === selected.id ? { ...item, messages: item.messages.map((message) => message.messageId === messageId ? { ...message, deliveryStatus: "sending" } : message) } : item));
    window.setTimeout(() => setConversations((items) => items.map((item) => item.id === selected.id ? { ...item, messages: item.messages.map((message) => message.messageId === messageId ? { ...message, deliveryStatus: "delivered" } : message) } : item)), 650);
  };

  const playMessage = (messageId) => {
    if (playingId === messageId) {
      setPlayingId("");
      return;
    }
    setPlayingId(messageId);
    window.setTimeout(() => setPlayingId((current) => current === messageId ? "" : current), 1200);
  };

  const hasActiveFilters = Boolean(query.trim()) || elderlyFilter !== "全部老人" || contactType !== "全部类型" || status !== "全部状态";
  const resetFilters = () => {
    setQuery("");
    setElderlyFilter("全部老人");
    setContactType("全部类型");
    setStatus("全部状态");
  };

  return <>
    <div className="page-heading"><div><h1>服务沟通</h1><p>管理{communityName}服务人员与老人之间的文字及语音留言</p></div></div>
    <section className="panel service-communication-panel">
      <div className="service-conversation-sidebar">
        <div className="service-conversation-filters">
          <div className="service-filter-heading"><b>筛选会话</b><button type="button" disabled={!hasActiveFilters} onClick={resetFilters}>清除</button></div>
          <div className="input-wrap"><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索老人或服务联系人"/></div>
          <div className="service-filter-row">
            <label className="service-filter-elder"><span>老人</span><select className="select-control" aria-label="老人筛选" value={elderlyFilter} onChange={(event) => setElderlyFilter(event.target.value)}>{elderlyOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>联系人</span><select className="select-control" aria-label="联系人类型筛选" value={contactType} onChange={(event) => setContactType(event.target.value)}><option value="全部类型">全部联系人</option><option>个人服务人员</option><option>服务机构</option></select></label>
            <label><span>沟通状态</span><select className="select-control" aria-label="沟通状态筛选" value={status} onChange={(event) => setStatus(event.target.value)}>{statusOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
        </div>
        <div className="service-conversation-count">共 {filteredConversations.length} 个会话</div>
        <div className="service-conversation-list">
          {filteredConversations.map((item) => <button key={item.id} className={selectedId === item.id ? "active" : ""} onClick={() => selectConversation(item.id)}>
            <ContactAvatar type={item.contactType}/>
            <span className="service-conversation-copy"><span><b>{item.elderlyName}</b><time>{item.lastMessageAt}</time></span><strong>{item.contactType === "个人服务人员" ? `${item.staffName} · ${item.contactName}` : item.contactName}</strong><small>{item.lastMessage}</small></span>
            {item.staffUnreadReplyCount > 0 && <em>{item.staffUnreadReplyCount}</em>}
          </button>)}
          {!filteredConversations.length && <div className="service-conversation-empty"><MessageSquareText size={27}/><b>暂无会话</b><span>{scopedConversations.length ? "没有符合当前筛选条件的会话" : "当前社区尚无服务沟通记录"}</span></div>}
        </div>
      </div>

      <div className="service-conversation-main">
        {selected ? <>
          <header className="service-chat-header">
            <div className="service-chat-person"><span className="service-contact-avatar person"><UserRound size={20}/></span><span><h3>{selected.elderlyName}</h3><p>与老人的服务沟通 · {selected.elderlyPhone}</p></span></div>
          </header>
          <div className="service-message-timeline">
            <div className="service-message-date">最近沟通</div>
            {selected.messages.map((message) => <div key={message.messageId} className={`service-message-row ${message.sender}`}>
              <div className={`service-message-bubble ${message.type}`}>
                {message.type === "text" ? <p>{message.content}</p> : <button className="service-audio-message" onClick={() => playMessage(message.messageId)}>{playingId === message.messageId ? <Pause size={16}/> : <Play size={16}/>}<span>{playingId === message.messageId ? "播放中…" : message.sender === "elderly" ? "老人语音回复" : "语音留言"}</span><b>{message.duration}</b></button>}
                <div className="service-message-meta"><time>{message.sentAt}</time><MessageStatus message={message}/>{message.deliveryStatus === "failed" && <button onClick={() => retryMessage(message.messageId)}><RefreshCw size={12}/>重试</button>}</div>
              </div>
            </div>)}
          </div>
          <footer className="service-message-composer">
            {voiceStage === "idle" && <>
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendText(); } }} placeholder="输入给老人的留言内容"/>
              <div><button className="secondary-button" onClick={() => setVoiceStage("recording")}><Mic size={15}/>录制语音</button><button className="primary-button" disabled={!draft.trim()} onClick={sendText}><Send size={15}/>发送文字</button></div>
            </>}
            {voiceStage === "recording" && <div className="service-voice-recorder recording"><span><i/><b>正在录制语音</b><small>00:08</small></span><button className="primary-button" onClick={() => setVoiceStage("review")}><Square size={14}/>完成录制</button></div>}
            {voiceStage === "review" && <div className="service-voice-recorder review"><span><button onClick={() => playMessage("voice-draft")} className="service-voice-preview">{playingId === "voice-draft" ? <Pause size={15}/> : <Play size={15}/>}</button><b>语音留言</b><small>00:12</small></span><div><button className="secondary-button" onClick={() => setVoiceStage("idle")}>取消</button><button className="primary-button" onClick={sendVoice}><Send size={14}/>确认发送</button></div></div>}
            {voiceStage === "sending" && <div className="service-voice-recorder sending"><span><i/><b>语音留言发送中…</b></span></div>}
          </footer>
        </> : <div className="service-chat-empty"><MessageSquareText size={34}/><h3>请选择服务会话</h3><p>选择左侧会话后查看留言与老人回复。</p></div>}
      </div>
    </section>
  </>;
}
