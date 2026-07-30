import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  UserPlus, 
  Trash2, 
  Check, 
  X, 
  Video, 
  Users,
  AlertTriangle,
  MessageSquare,
  History,
  Send,
  Square
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FamilyMessage } from "../types";

// Define the Contact interface
export interface Contact {
  id: string;
  name: string;
  avatar: string;
  role: string;
  relation: string;
  bgGrad: string;
  phone?: string;
  category?: 'family' | 'care' | 'community' | 'service';
  priority?: string;
  isCustom?: boolean;
}

interface ContactsPageProps {
  isOpen: boolean;
  onClose: () => void;
  messages: FamilyMessage[];
  onAddMessage: (message: FamilyMessage) => void;
  onMarkRead: (messageId: string) => void;
}

interface InteractionRecord {
  id: string;
  type: string;
  title: string;
  detail: string;
  time: string;
  result: string;
}

// Preset avatars list for senior-friendly choosing
const PRESET_AVATARS = [
  { id: "xiaomin", label: "女儿", url: "https://picsum.photos/seed/xiaomin/250/250", emoji: "👧" },
  { id: "xiaogang", label: "儿子", url: "https://picsum.photos/seed/xiaogang/250/250", emoji: "👦" },
  { id: "xiaoxuan", label: "孙女", url: "https://picsum.photos/seed/xiaoxuan/250/250", emoji: "👵" },
  { id: "xiaoyu", label: "孙子", url: "https://picsum.photos/seed/xiaoyu/250/250", emoji: "👶" },
  { id: "nurse", label: "社区医生/护士", url: "https://picsum.photos/seed/nurse/250/250", emoji: "👩‍⚕️" },
  { id: "neighbor", label: "老邻居", url: "https://picsum.photos/seed/neighbor/250/250", emoji: "👴" },
];

const GRADIENT_PRESETS = [
  "from-[#FDF3F5] to-[#FFF0F2]", // soft pink
  "from-[#F3F9FD] to-[#EBF5FC]", // soft blue
  "from-[#F3FDF7] to-[#ECFCF1]", // soft green
  "from-[#FFF9F3] to-[#FEF2E4]", // soft orange
];

export default function ContactsPage({ isOpen, onClose, messages, onAddMessage, onMarkRead }: ContactsPageProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [callState, setCallState] = useState<'idle' | 'dialing' | 'connected'>('idle');
  const [callMode, setCallMode] = useState<'voice' | 'video'>('video');
  const [selectedThreadContactId, setSelectedThreadContactId] = useState("default-1");
  const [playingThreadMessageId, setPlayingThreadMessageId] = useState<string | null>(null);
  const [interactionRecords, setInteractionRecords] = useState<InteractionRecord[]>([
    {
      id: "interaction-1",
      type: "留言查看",
      title: "查看女儿小敏的语音留言",
      detail: "来源：家庭留言 · 联系人：女儿小敏",
      time: "今天 10:20",
      result: "已读结果已同步给子女端"
    },
    {
      id: "interaction-2",
      type: "家人问候",
      title: "儿子小刚发来文字问候",
      detail: "来源：家庭留言 · 联系人：儿子小刚",
      time: "昨天 19:30",
      result: "留言已查看"
    },
    {
      id: "interaction-3",
      type: "主动联系",
      title: "视频联系女儿小敏",
      detail: "来源：联系人列表 · 联系人：女儿小敏",
      time: "昨天 09:12",
      result: "通话 08分32秒"
    }
  ]);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [messageContact, setMessageContact] = useState<Contact | null>(null);
  const [messageRecordingState, setMessageRecordingState] = useState<'idle' | 'recording' | 'ready' | 'sent'>('idle');
  const [messageRecordingSeconds, setMessageRecordingSeconds] = useState(0);
  const messageRecordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Form State for Adding Contact
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactRelation, setNewContactRelation] = useState("女儿");
  const [selectedAvatarId, setSelectedAvatarId] = useState("xiaomin");

  // Voice Recording Overlay States (matching homepage style)
  const [showVoiceInputModal, setShowVoiceInputModal] = useState(false);
  const [isRecordingName, setIsRecordingName] = useState(false);
  const [recordingNameSuccess, setRecordingNameSuccess] = useState(false);
  const [voiceNameResult, setVoiceNameResult] = useState("");
  const voiceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Deletion confirmation state
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ringTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice Input Simulation for Name
  const startVoiceInputName = () => {
    setShowVoiceInputModal(true);
    setIsRecordingName(true);
    setRecordingNameSuccess(false);
    setVoiceNameResult("");

    if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);

    voiceTimeoutRef.current = setTimeout(() => {
      setIsRecordingName(false);
      setRecordingNameSuccess(true);
      const voicePresetNames = [
        "二女儿阿珍",
        "大儿子阿强",
        "孙女萱萱",
        "孙子小雨",
        "王医生",
        "隔壁老李",
        "外孙小杰"
      ];
      const randomName = voicePresetNames[Math.floor(Math.random() * voicePresetNames.length)];
      setVoiceNameResult(randomName);
    }, 2500);
  };

  const cancelVoiceInputName = () => {
    if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
    setIsRecordingName(false);
    setRecordingNameSuccess(false);
    setShowVoiceInputModal(false);
  };

  const confirmVoiceName = () => {
    setNewContactName(voiceNameResult);
    setShowVoiceInputModal(false);
    setRecordingNameSuccess(false);
  };

  // Demo data mirrors contacts synchronized from family bindings and backend configuration.
  useEffect(() => {
    loadDefaultContacts();
    return () => {
      if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
    };
  }, []);

  const loadDefaultContacts = () => {
    const defaults: Contact[] = [
      {
        id: "default-1",
        name: "女儿小敏",
        avatar: "https://picsum.photos/seed/xiaomin/250/250",
        role: "",
        relation: "女儿",
        phone: "138 **** 5201",
        category: "family",
        priority: "首要联系人",
        bgGrad: "from-[#FDF3F5] to-[#FFF0F2]"
      },
      {
        id: "default-2",
        name: "儿子小刚",
        avatar: "https://picsum.photos/seed/xiaogang/250/250",
        role: "",
        relation: "儿子",
        phone: "139 **** 6618",
        category: "family",
        priority: "家庭联系人",
        bgGrad: "from-[#F3F9FD] to-[#EBF5FC]"
      },
      {
        id: "default-3",
        name: "专属健康管家 · 王护士",
        avatar: "https://picsum.photos/seed/nurse/250/250",
        role: "",
        relation: "社区医护",
        phone: "010-6258 1200",
        category: "care",
        priority: "健康联系人",
        bgGrad: "from-[#F3FDF7] to-[#ECFCF1]"
      },
      {
        id: "default-4",
        name: "生活顾问 · 陈老师",
        avatar: "https://picsum.photos/seed/adviser-chen/250/250",
        role: "",
        relation: "专属顾问",
        phone: "136 **** 2088",
        category: "care",
        priority: "服务联系人",
        bgGrad: "from-[#FFF9F3] to-[#FEF2E4]"
      },
      {
        id: "default-5",
        name: "清华园社区服务站",
        avatar: "https://picsum.photos/seed/community-center/250/250",
        role: "",
        relation: "社区联系人",
        phone: "010-6258 8890",
        category: "community",
        priority: "工作时间可联系",
        bgGrad: "from-[#F3FDF7] to-[#ECFCF1]"
      },
      {
        id: "default-6",
        name: "助老服务调度中心",
        avatar: "https://picsum.photos/seed/care-service-center/250/250",
        role: "",
        relation: "服务联系人",
        phone: "400-820-1234",
        category: "service",
        priority: "订单与上门服务",
        bgGrad: "from-[#F3F9FD] to-[#EBF5FC]"
      }
    ];
    setContacts(defaults);
    localStorage.setItem("elder_contacts", JSON.stringify(defaults));
  };

  // Save contacts whenever they change
  const saveContacts = (updatedList: Contact[]) => {
    setContacts(updatedList);
    localStorage.setItem("elder_contacts", JSON.stringify(updatedList));
  };

  // Call duration counter
  useEffect(() => {
    if (callState === 'connected') {
      durationTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      setCallDuration(0);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [callState]);

  const startCall = (contact: Contact, mode: 'voice' | 'video') => {
    setSelectedContact(contact);
    setCallMode(mode);
    setCallState('dialing');
    setInteractionRecords((records) => [
      {
        id: `interaction-${Date.now()}`,
        type: "主动联系",
        title: `${mode === 'video' ? '视频' : '语音'}联系${contact.name}`,
        detail: `来源：联系人列表 · 联系人：${contact.name}`,
        time: "刚刚",
        result: "已发起，等待接听"
      },
      ...records
    ]);
    
    // Simulate auto-connecting after 3 seconds
    ringTimerRef.current = setTimeout(() => {
      setCallState('connected');
    }, 3000);
  };

  const endCall = () => {
    if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    setCallState('idle');
    setSelectedContact(null);
    setCallDuration(0);
  };

  const openLeaveMessage = (contact: Contact) => {
    setMessageContact(contact);
    setMessageRecordingState('idle');
    setMessageRecordingSeconds(0);
  };

  const startLeaveMessageRecording = () => {
    setMessageRecordingState('recording');
    setMessageRecordingSeconds(0);
    if (messageRecordingTimerRef.current) clearInterval(messageRecordingTimerRef.current);
    messageRecordingTimerRef.current = setInterval(() => {
      setMessageRecordingSeconds((seconds) => seconds + 1);
    }, 1000);
  };

  const stopLeaveMessageRecording = () => {
    if (messageRecordingTimerRef.current) clearInterval(messageRecordingTimerRef.current);
    setMessageRecordingState('ready');
    setMessageRecordingSeconds((seconds) => Math.max(seconds, 1));
  };

  const sendLeaveMessage = () => {
    if (!messageContact) return;
    onAddMessage({
      id: `contact-message-${Date.now()}`,
      sender: "您 (我)",
      recipient: messageContact.name,
      avatar: "https://picsum.photos/seed/grandfather/120/120",
      type: "voice",
      content: `给${messageContact.name}的语音留言`,
      duration: Math.max(messageRecordingSeconds, 1),
      timestamp: "刚刚",
      played: true
    });
    setMessageRecordingState('sent');
    setInteractionRecords((records) => [
      {
        id: `interaction-${Date.now()}`,
        type: "主动留言",
        title: `给${messageContact.name}发送语音留言`,
        detail: `来源：联系人列表 · 联系人：${messageContact.name}`,
        time: "刚刚",
        result: "已发送，等待对方查看"
      },
      ...records
    ]);
  };

  const closeLeaveMessage = () => {
    if (messageRecordingTimerRef.current) clearInterval(messageRecordingTimerRef.current);
    setMessageContact(null);
    setMessageRecordingState('idle');
    setMessageRecordingSeconds(0);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Add contact handler
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;

    const chosenAvatar = PRESET_AVATARS.find(a => a.id === selectedAvatarId)?.url || PRESET_AVATARS[0].url;
    const randomGrad = GRADIENT_PRESETS[contacts.length % GRADIENT_PRESETS.length];

    const newContact: Contact = {
      id: `custom-${Date.now()}`,
      name: newContactName,
      avatar: chosenAvatar,
      role: "", // Removed role as requested
      relation: newContactRelation,
      phone: "号码待后台同步",
      category: "family",
      bgGrad: randomGrad,
      isCustom: true
    };

    const updated = [...contacts, newContact];
    saveContacts(updated);

    // Reset form states
    setNewContactName("");
    setNewContactRelation("女儿");
    setSelectedAvatarId("xiaomin");
    setShowAddForm(false);
  };

  // Delete contact handler
  const handleDeleteContact = (id: string) => {
    const updated = contacts.filter(c => c.id !== id);
    saveContacts(updated);
    setDeletingContactId(null);
  };

  if (!isOpen) return null;

  const selectedThreadContact = contacts.find((contact) => contact.id === selectedThreadContactId) || contacts[0];
  const selectedThreadMessages = selectedThreadContact
    ? messages.filter((message) => message.sender === selectedThreadContact.name || (message.sender === "您 (我)" && message.recipient === selectedThreadContact.name))
    : [];
  const selectedThreadRecords = selectedThreadContact
    ? interactionRecords.filter((record) => record.detail.includes(`联系人：${selectedThreadContact.name}`))
    : [];

  const playThreadMessage = (message: FamilyMessage) => {
    setPlayingThreadMessageId(message.id);
    onMarkRead(message.id);
    setTimeout(() => setPlayingThreadMessageId(null), 2400);
  };

  return (
    <div className="fixed inset-0 bg-[#F5F2EB] z-50 flex flex-col justify-between select-none font-sans overflow-hidden">
      
      {/* ----------------- TITLE HEADER BAR ----------------- */}
      <div className="h-[140px] bg-white border-b-2 border-[#EBE6DD] px-10 flex items-center justify-between shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={onClose}
            className="flex items-center gap-2.5 px-6 py-4 bg-[#FAF8F5] hover:bg-[#EAF6EF] border-2 border-[#EBE6DD] hover:border-[#C3E6D2] rounded-2xl text-[#256f4f] font-black text-[22px] transition-all cursor-pointer shadow-sm active:scale-95"
            id="contacts-back-btn"
          >
            <ArrowLeft className="w-7 h-7 stroke-[3]" />
            <span>返回首页</span>
          </button>
          
          <div className="h-10 w-0.5 bg-gray-200" />
          
          <div>
            <h1 className="text-4xl font-black text-[#1C2C24] tracking-wide">
              联系人与留言
            </h1>
            <p className="text-gray-500 font-bold text-lg mt-1">
              联系家人和服务人员，查看和发送家庭留言
            </p>
          </div>
        </div>
      </div>

      {/* ----------------- MAIN LAYOUT WINDOW ----------------- */}
      <div className="flex-1 min-h-0 overflow-hidden p-8 relative">
        <AnimatePresence>
          {callState === 'idle' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="h-full min-h-0 max-w-[1700px] mx-auto flex flex-col"
            >
              <div className="grid grid-cols-[390px_minmax(0,1fr)] gap-6 h-full min-h-0">
                <aside className="bg-white border-2 border-[#EBE6DD] rounded-[28px] shadow-sm overflow-hidden flex flex-col min-h-0">
                  <div className="p-5 border-b-2 border-[#F0ECE5] shrink-0">
                    <h2 className="text-2xl font-black text-[#1C2C24] flex items-center gap-2"><Users className="w-7 h-7 text-[#14533C]" />联系人</h2>
                    <p className="text-gray-500 font-bold mt-1">选择联系人查看全部沟通记录</p>
                  </div>

                  <div className="flex-1 min-h-0 p-3 space-y-2 overflow-y-auto">
                    {contacts.map((contact) => {
                      const contactMessages = messages.filter((message) => message.sender === contact.name || (message.sender === "您 (我)" && message.recipient === contact.name));
                      const contactUnread = contactMessages.filter((message) => message.sender === contact.name && !message.played).length;
                      return (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => setSelectedThreadContactId(contact.id)}
                          className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 text-left transition-all ${selectedThreadContact?.id === contact.id ? 'bg-[#EAF6EF] border-[#78B897] shadow-sm' : 'bg-white border-transparent hover:bg-[#FAF8F5]'}`}
                        >
                          <div className="relative shrink-0">
                            <img src={contact.avatar} alt={contact.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-[19px] font-black text-[#1C2C24] truncate">{contact.name}</h3>
                              {contactUnread > 0 && <span className="min-w-7 h-7 px-2 rounded-full bg-red-500 text-white text-sm font-black flex items-center justify-center">{contactUnread}</span>}
                            </div>
                            <p className="text-gray-500 font-bold mt-1 truncate">{contactMessages.length > 0 ? `${contactMessages.length} 条留言记录` : contact.relation}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                {selectedThreadContact && (
                  <section className="bg-white border-2 border-[#EBE6DD] rounded-[28px] shadow-sm overflow-hidden flex flex-col min-h-0" aria-label={`${selectedThreadContact.name}的聊天记录`}>
                    <div className="p-5 border-b-2 border-[#F0ECE5] flex items-center gap-5 bg-white shrink-0">
                      <div className="relative">
                        <img src={selectedThreadContact.avatar} alt={selectedThreadContact.name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" referrerPolicy="no-referrer" />
                        <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h2 className="text-3xl font-black text-[#1C2C24]">{selectedThreadContact.name}</h2>
                          <span className="px-3 py-1 rounded-lg bg-[#EAF6EF] text-[#14533C] text-sm font-black">{selectedThreadContact.relation}</span>
                        </div>
                        <p className="text-emerald-700 font-black mt-2">当前可联系 · {selectedThreadContact.phone}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => startCall(selectedThreadContact, 'voice')} className="px-5 py-4 rounded-2xl bg-white border-2 border-[#C3E6D2] text-[#14533C] text-[17px] font-black flex items-center gap-2"><Phone className="w-5 h-5" />语音通话</button>
                        <button type="button" onClick={() => startCall(selectedThreadContact, 'video')} className="px-5 py-4 rounded-2xl bg-[#14533C] text-white text-[17px] font-black flex items-center gap-2 shadow-md"><Video className="w-5 h-5" />视频通话</button>
                      </div>
                    </div>

                    <div className="px-6 py-3 bg-[#F7F5F0] border-b border-[#EBE6DD] flex items-center justify-center shrink-0">
                      <span className="px-4 py-1.5 rounded-full bg-white border border-[#E5E0D7] text-gray-500 font-black text-sm">
                        聊天记录 · 共 {selectedThreadMessages.length + selectedThreadRecords.length} 条
                      </span>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6 bg-[#F4F1EA] space-y-6">
                      {(selectedThreadMessages.length > 0 || selectedThreadRecords.length > 0) && (
                        <div className="flex items-center justify-center">
                          <span className="px-4 py-1.5 rounded-full bg-black/5 text-gray-500 text-sm font-black">今天</span>
                        </div>
                      )}
                      {selectedThreadMessages.length === 0 && selectedThreadRecords.length === 0 && (
                        <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center">
                          <div className="w-20 h-20 rounded-full bg-[#EAF6EF] text-[#14533C] flex items-center justify-center"><MessageSquare className="w-10 h-10" /></div>
                          <h3 className="text-2xl font-black text-[#1C2C24] mt-5">还没有聊天内容</h3>
                          <p className="text-gray-500 font-bold mt-2">点击下方按钮，给TA留一段语音</p>
                        </div>
                      )}

                      {selectedThreadMessages.map((message) => {
                        const isMine = message.sender === "您 (我)";
                        return (
                          <div key={message.id} className={`flex items-end gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
                            {!isMine && (
                              <img src={selectedThreadContact.avatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0" referrerPolicy="no-referrer" />
                            )}
                            <div className={`max-w-[72%] rounded-[22px] p-5 shadow-sm ${isMine ? 'bg-[#BFE8CC] rounded-br-md' : 'bg-white rounded-bl-md border border-[#E8E2D9]'}`}>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-black text-[#1C2C24]">{isMine ? '我' : message.sender}</span>
                                <span className="text-gray-500 text-sm font-bold">{message.timestamp}</span>
                                {!isMine && <span className={`px-2 py-0.5 rounded-md text-xs font-black ${message.played ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-600'}`}>{message.played ? '已读' : '未读'}</span>}
                              </div>
                              <p className="text-[18px] font-bold text-gray-700 leading-relaxed">{message.content}</p>
                              {message.type === 'voice' && (
                                <button type="button" onClick={() => playThreadMessage(message)} className="mt-4 min-w-[210px] px-5 py-3 rounded-2xl bg-[#14533C] text-white font-black flex items-center justify-between gap-4">
                                  <Volume2 className="w-5 h-5" />{playingThreadMessageId === message.id ? '正在播放…' : `播放语音 ${message.duration || 0}秒`}
                                </button>
                              )}
                            </div>
                            {isMine && (
                              <div className="w-12 h-12 rounded-full bg-[#14533C] text-white border-2 border-white shadow-sm flex items-center justify-center font-black shrink-0">我</div>
                            )}
                          </div>
                        );
                      })}

                      {selectedThreadRecords.map((record) => (
                        <div key={record.id} className="flex items-center justify-center py-1">
                          <div className="px-5 py-2.5 rounded-full bg-black/5 text-[#6F685F] font-bold flex items-center gap-2 text-sm">
                            <History className="w-5 h-5" />{record.time} · {record.title} · {record.result}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-white border-t-2 border-[#EBE6DD] shrink-0">
                      <button
                        type="button"
                        onClick={() => openLeaveMessage(selectedThreadContact)}
                        className="w-full h-[72px] rounded-[24px] bg-[#14533C] hover:bg-[#0E3D2B] text-white text-[21px] font-black flex items-center justify-center gap-3 shadow-md active:scale-[0.99] transition-all"
                      >
                        <Mic className="w-7 h-7" />
                        点击录制语音留言
                      </button>
                    </div>
                  </section>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {messageContact && (
          <div className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-sm flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-[720px] bg-white rounded-[36px] border-2 border-[#EBE6DD] shadow-2xl p-8 text-center relative"
              role="dialog"
              aria-label={`给${messageContact.name}留言`}
            >
              <button
                type="button"
                onClick={closeLeaveMessage}
                className="absolute top-5 right-5 w-12 h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200"
                aria-label="关闭留言窗口"
              >
                <X className="w-7 h-7" />
              </button>

              <img src={messageContact.avatar} alt={messageContact.name} className="w-28 h-28 rounded-full object-cover border-4 border-[#EAF6EF] shadow-md mx-auto" />
              <h2 className="text-3xl font-black text-[#1C2C24] mt-5">给{messageContact.name}留言</h2>
              <p className="text-lg font-bold text-gray-500 mt-2">录一段语音，对方会在手机端收到提醒</p>

              <div className="mt-7 rounded-[28px] bg-[#FAF8F5] border-2 border-[#EBE6DD] p-7">
                {messageRecordingState === 'idle' && (
                  <button
                    type="button"
                    onClick={startLeaveMessageRecording}
                    className="w-full py-6 rounded-3xl bg-[#14533C] text-white text-2xl font-black flex items-center justify-center gap-3 shadow-lg active:scale-[0.98]"
                  >
                    <Mic className="w-8 h-8" />点击开始录音
                  </button>
                )}

                {messageRecordingState === 'recording' && (
                  <div>
                    <div className="flex items-end justify-center gap-2 h-16 mb-4" aria-label="正在录音">
                      {[3, 7, 5, 9, 6, 10, 4, 8, 5].map((height, index) => (
                        <span key={index} className="w-3 rounded-full bg-red-500 animate-pulse" style={{ height: `${height * 5}px` }} />
                      ))}
                    </div>
                    <p className="text-2xl font-black text-red-600 mb-5">正在录音 {messageRecordingSeconds} 秒</p>
                    <button
                      type="button"
                      onClick={stopLeaveMessageRecording}
                      className="w-full py-5 rounded-3xl bg-red-500 text-white text-2xl font-black flex items-center justify-center gap-3 shadow-lg"
                    >
                      <Square className="w-7 h-7 fill-current" />录好了
                    </button>
                  </div>
                )}

                {messageRecordingState === 'ready' && (
                  <div>
                    <div className="flex items-center justify-center gap-3 text-[#14533C] text-2xl font-black mb-6">
                      <Volume2 className="w-8 h-8" />语音已录好 · {messageRecordingSeconds} 秒
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" onClick={startLeaveMessageRecording} className="py-5 rounded-2xl bg-white border-2 border-[#C3E6D2] text-[#14533C] text-xl font-black">重新录音</button>
                      <button type="button" onClick={sendLeaveMessage} className="py-5 rounded-2xl bg-[#14533C] text-white text-xl font-black flex items-center justify-center gap-2 shadow-md">
                        <Send className="w-6 h-6" />发送留言
                      </button>
                    </div>
                  </div>
                )}

                {messageRecordingState === 'sent' && (
                  <div className="py-3">
                    <div className="w-20 h-20 rounded-full bg-[#EAF6EF] text-[#14533C] flex items-center justify-center mx-auto">
                      <Check className="w-11 h-11 stroke-[3]" />
                    </div>
                    <p className="text-3xl font-black text-[#14533C] mt-5">留言发送成功</p>
                    <p className="text-lg font-bold text-gray-500 mt-2">{messageContact.name}收到后会提醒您</p>
                    <button type="button" onClick={closeLeaveMessage} className="mt-6 px-10 py-4 rounded-2xl bg-[#14533C] text-white text-xl font-black">完成</button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- ADD CONTACT MODAL DRAWER OVERLAY ----------------- */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 select-none font-sans animate-fade-in">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-2 border-[#EBE6DD] rounded-[36px] p-8 max-w-2xl w-full text-left shadow-2xl relative"
            >
              <button
                onClick={() => setShowAddForm(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer transition-all"
              >
                <X className="w-8 h-8" />
              </button>

              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-3xl font-black text-[#1C2C24]">添加新联系人</h3>
                <p className="text-gray-500 font-bold mt-1 text-sm">填写下方信息即可创建，头像提供一键极简选择：</p>
              </div>

              <form onSubmit={handleAddContact} className="flex flex-col gap-6">
                {/* 1. Name Input with Voice Interaction */}
                <div>
                  <label className="block text-lg font-black text-gray-800 mb-2">联系人姓名</label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      required
                      maxLength={15}
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      placeholder="语音输入姓名，或在此输入..."
                      className="flex-1 p-4.5 border-2 border-gray-200 rounded-2xl text-xl font-bold bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder-gray-400 shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={startVoiceInputName}
                      className="flex items-center gap-2.5 px-7 bg-[#EAF6EF] hover:bg-[#C3E6D2] text-[#256f4f] border-2 border-[#C3E6D2] hover:border-[#256f4f] rounded-2xl transition-all duration-300 active:scale-95 cursor-pointer font-black text-xl"
                    >
                      <Mic className="w-6.5 h-6.5 stroke-[2.5]" />
                      <span>点击说话</span>
                    </button>
                  </div>
                </div>

                {/* 2. Relation Select (Full Width - Title/Remark removed) */}
                <div>
                  <label className="block text-lg font-black text-gray-800 mb-2">关系类别</label>
                  <select
                    value={newContactRelation}
                    onChange={(e) => setNewContactRelation(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl text-xl font-bold bg-gray-50 outline-none transition-all focus:border-emerald-500"
                  >
                    <option value="女儿">女儿 👧</option>
                    <option value="儿子">儿子 👦</option>
                    <option value="孙女">孙女 👵</option>
                    <option value="孙子">孙子 👶</option>
                    <option value="医生">社区医护 👩‍⚕️</option>
                    <option value="邻居">邻居好友 👴</option>
                    <option value="其他">其他家人 📁</option>
                  </select>
                </div>

                {/* 3. Avatar Preset Grid (Labels removed under avatars) */}
                <div>
                  <label className="block text-lg font-black text-gray-800 mb-2">选择照片头像</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3.5 mt-2">
                    {PRESET_AVATARS.map((preset) => {
                      const isSelected = selectedAvatarId === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => setSelectedAvatarId(preset.id)}
                          className={`flex items-center justify-center p-2 rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? "border-emerald-500 bg-emerald-50 scale-105 shadow-sm" 
                              : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-full border border-gray-200 object-cover"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mt-4 border-t border-gray-100 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xl rounded-2xl transition-all cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="py-4 bg-[#256f4f] hover:bg-[#1c533c] text-white font-extrabold text-xl rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-6 h-6 stroke-[3]" />
                    <span>确认保存</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- VOICE INPUT MATCHING OVERLAY MODAL ----------------- */}
      <AnimatePresence>
        {showVoiceInputModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-8 select-none font-sans">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FAF8F5] border-2 border-[#EBE6DD] rounded-[36px] p-8 max-w-xl w-full text-center shadow-2xl relative"
            >
              <button
                type="button"
                onClick={cancelVoiceInputName}
                className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-[26px] font-black text-[#1C2C24] mb-3">语音输入联系人姓名</h3>
              <p className="text-base font-bold text-gray-500 mb-6">按下红色录音按钮，对准屏幕直接说出姓名：</p>

              <div className="flex flex-col items-center justify-center my-8">
                {isRecordingName ? (
                  <div className="relative w-32 h-32 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                    <div className="absolute inset-0 rounded-full bg-red-400/20 blur animate-ping" />
                    <button type="button" className="w-24 h-24 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg border-4 border-white">
                      <div className="w-8 h-8 bg-white rounded" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startVoiceInputName}
                    className="w-28 h-28 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xl border-4 border-white transform transition-transform active:scale-95 cursor-pointer mb-6"
                  >
                    <Mic className="w-11 h-11 text-white fill-current" />
                  </button>
                )}

                {isRecordingName && (
                  <div className="text-red-600 font-extrabold text-lg flex flex-col items-center gap-3">
                    <div className="flex items-center gap-1.5 animate-pulse">
                      <span>● 正在录制您的语音...</span>
                    </div>
                    {/* Simulated Waveform lines */}
                    <div className="flex justify-center items-center gap-1 mt-2 h-6 w-48">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-red-500 rounded-full animate-bounce"
                          style={{
                            height: `${Math.floor(Math.random() * 20) + 4}px`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {!isRecordingName && !recordingNameSuccess && (
                  <span className="text-base font-black text-gray-700">点击按钮开始说话录音</span>
                )}

                {recordingNameSuccess && (
                  <div className="w-full">
                    <span className="text-emerald-700 font-black text-lg block mb-3">识别成功！已为您自动转换成文字：</span>
                    <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500 text-[22px] font-black text-emerald-800 leading-relaxed text-center shadow-inner">
                      "{voiceNameResult}"
                    </div>
                    <div className="flex gap-4 mt-8">
                      <button
                        type="button"
                        onClick={startVoiceInputName}
                        className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-black rounded-xl cursor-pointer transition-all"
                      >
                        重新录音
                      </button>
                      <button
                        type="button"
                        onClick={confirmVoiceName}
                        className="flex-1 py-4 bg-[#256f4f] hover:bg-[#1c533c] text-white text-lg font-black rounded-xl cursor-pointer shadow-md transition-all"
                      >
                        确认使用该姓名
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- CALL OVERLAY WINDOW ----------------- */}
      <AnimatePresence>
        {callState !== 'idle' && selectedContact && (
          <div className="fixed inset-0 bg-slate-950 z-[999] flex flex-col justify-between p-10 text-white select-none font-sans animate-fade-in">
            {/* Top Info Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[22px] font-black tracking-wider">
                  {callState === 'dialing'
                    ? `正在发起${callMode === 'video' ? '视频' : '语音'}通话...`
                    : `${callMode === 'video' ? '视频' : '语音'}通话已接通`}
                </span>
              </div>
              {callState === 'connected' && (
                <span className="text-3xl font-black font-mono tracking-widest bg-black/50 px-6 py-2.5 rounded-2xl border border-white/10">
                  通话时间 {formatDuration(callDuration)}
                </span>
              )}
            </div>

            {/* Center Video Area */}
            <div className="flex-1 flex items-center justify-center relative my-8 rounded-[36px] overflow-hidden bg-black border-2 border-white/10 shadow-2xl">
              {/* Contact portrait or video */}
              <img
                src={selectedContact.avatar}
                alt={callMode === 'video' ? `${selectedContact.name}的视频画面` : `${selectedContact.name}的头像`}
                referrerPolicy="no-referrer"
                className={`transition-all duration-700 ${
                  callMode === 'video'
                    ? 'w-full h-full object-cover opacity-90'
                    : 'w-64 h-64 rounded-full object-cover border-8 border-white/20 shadow-2xl'
                }`}
                style={callState === 'connected' ? {} : { filter: 'blur(4px) brightness(0.6)' }}
              />

              {callState === 'connected' && callMode === 'voice' && (
                <div className="absolute bottom-20 text-center">
                  <h3 className="text-4xl font-black">{selectedContact.name}</h3>
                  <p className="text-xl font-bold text-emerald-300 mt-3">正在使用免提语音通话</p>
                </div>
              )}

              {/* Dialing Pulse Overlay */}
              {callState === 'dialing' && (
                <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center gap-6">
                  <div className="w-36 h-36 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 animate-pulse">
                    <img
                      src={selectedContact.avatar}
                      alt="Contact avatar"
                      referrerPolicy="no-referrer"
                      className="w-26 h-26 rounded-full border-2 border-white object-cover"
                    />
                  </div>
                  <h3 className="text-4xl font-black">{selectedContact.name}</h3>
                  <span className="text-emerald-400 font-extrabold text-2xl animate-pulse tracking-wide">呼叫中，请稍候...</span>
                </div>
              )}

              {/* Local Video Picture-in-Picture Preview (Right corner) */}
              {callState === 'connected' && callMode === 'video' && (
                <div className="absolute bottom-8 right-8 w-56 h-76 rounded-3xl border-2 border-white/50 shadow-2xl bg-slate-800 overflow-hidden z-20">
                  <div className="w-full h-full relative flex items-center justify-center">
                    <img
                      src="https://picsum.photos/seed/grandfather/150/200"
                      alt="Local Video Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 inset-x-3 bg-black/60 py-1.5 rounded-xl text-center text-sm font-black tracking-wide border border-white/10">
                      您 (我的画面)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Call Controls panel */}
            <div className="flex items-center justify-center gap-12 bg-slate-900/60 backdrop-blur-md px-12 py-6 rounded-3xl border border-white/10 mx-auto max-w-2xl w-full">
              {/* Mute Button */}
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              >
                {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                <span className="text-xs font-black">{isMuted ? '已静音' : '静音'}</span>
              </button>

              {/* Hangup Button */}
              <button
                type="button"
                onClick={endCall}
                className="w-28 h-28 rounded-full bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center gap-1.5 shadow-2xl border-4 border-white/20 transform transition-all active:scale-95 cursor-pointer"
              >
                <PhoneOff className="w-10 h-10 fill-current" />
                <span className="text-base font-black mt-1">挂断通话</span>
              </button>

              {/* Speaker Button */}
              <button
                type="button"
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${!isSpeakerOn ? 'bg-amber-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              >
                {!isSpeakerOn ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
                <span className="text-xs font-black">{isSpeakerOn ? '免提开启' : '听筒模式'}</span>
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
