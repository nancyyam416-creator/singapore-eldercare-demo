import React, { useState } from "react";
import { speakText } from "../audio/speech";
import { 
  CalendarRange, 
  ShieldAlert, 
  HandPlatter, 
  Wrench, 
  ShieldCheck, 
  Heart, 
  Landmark, 
  X, 
  Check, 
  Timer, 
  MapPin, 
  PhoneCall, 
  Award, 
  AlertTriangle,
  Flame,
  UtensilsCrossed,
  Sparkles,
  ChevronRight,
  Camera,
  Bell,
  Music,
  Tv2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  MessageCircle,
  Share2,
  Disc,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  List
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CommunityActivity, AntiScamTip } from "../types";

interface CommunityPanelProps {
  activities: CommunityActivity[];
  scamTips: AntiScamTip[];
  onRegisterActivity: (id: string) => void;
  activeTab?: 'activity' | 'services' | 'scam';
  setActiveTab?: (val: 'activity' | 'services' | 'scam') => void;
  selectedModule?: 'courses' | 'services' | 'scam' | null;
  setSelectedModule?: (val: 'courses' | 'services' | 'scam' | null) => void;
  onFocusSchedule?: () => void;
  onStartCall?: (contactName: string) => void;
  onOpenAlbum?: () => void;
  externalService?: 'meal' | 'clean' | 'repair' | null;
  onClearExternalService?: () => void;
  externalActiveApp?: 'tiktok' | 'music' | 'tv' | null;
  onClearExternalActiveApp?: () => void;
}

export default function CommunityPanel({
  activities,
  scamTips,
  onRegisterActivity,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
  selectedModule: propSelectedModule,
  setSelectedModule: propSelectedModuleSetter,
  onFocusSchedule,
  onStartCall,
  onOpenAlbum,
  externalService,
  onClearExternalService,
  externalActiveApp,
  onClearExternalActiveApp,
}: CommunityPanelProps) {
  const [localActiveTab, setLocalActiveTab] = useState<'activity' | 'services' | 'scam'>('activity');
  const [localSelectedModule, setLocalSelectedModule] = useState<'courses' | 'services' | 'scam' | null>(null);

  const activeTab = propActiveTab ?? localActiveTab;
  const setActiveTab = propSetActiveTab ?? setLocalActiveTab;
  const selectedModule = propSelectedModule ?? localSelectedModule;
  const setSelectedModule = propSelectedModuleSetter ?? setLocalSelectedModule;

  // Sync external service and active app selections
  React.useEffect(() => {
    if (externalService) {
      setSelectedService(externalService);
      if (onClearExternalService) onClearExternalService();
    }
  }, [externalService]);

  React.useEffect(() => {
    if (externalActiveApp) {
      setActiveApp(externalActiveApp);
      if (externalActiveApp === 'tiktok') setIsTikTokPlaying(true);
      if (externalActiveApp === 'tv') setIsTvPlaying(true);
      if (externalActiveApp === 'music') setIsMusicPlaying(true);
      if (onClearExternalActiveApp) onClearExternalActiveApp();
    }
  }, [externalActiveApp]);

  const [bookingStatus, setBookingStatus] = useState<string | null>(null);

  // Secondary module states
  const [selectedActivity, setSelectedActivity] = useState<CommunityActivity | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null); // 'meal' | 'clean' | 'repair'
  const [selectedScamTip, setSelectedScamTip] = useState<AntiScamTip | null>(null);

  // States for interactive booking options
  const [mealOption, setMealOption] = useState<string>("B"); // A, B, C
  const [mealNote, setMealNote] = useState<string>("少盐少油，饭煮软一些");
  const [mealTime, setMealTime] = useState<string>("11:30 - 12:00");
  const [paymentMethod, setPaymentMethod] = useState<string>("card"); // card, child

  const [cleanItem, setCleanItem] = useState<string>("日常保洁");
  const [cleanDuration, setCleanDuration] = useState<number>(2);
  const [selectedCleaner, setSelectedCleaner] = useState<string>("张玉梅");

  const [repairCategory, setRepairCategory] = useState<string>("水管漏水/地漏堵塞");
  const [repairUrgency, setRepairUrgency] = useState<string>("极其紧急");
  const [repairNote, setRepairNote] = useState<string>("水龙头一直漏水，地面积水");

  // State for anti-scam interaction
  const [scamUserChoice, setScamUserChoice] = useState<'pending' | 'success' | 'warn'>('pending');

  // --- Quick Apps States ---
  const [activeApp, setActiveApp] = useState<'tiktok' | 'music' | 'tv' | null>(null);

  // --- Music App State ---
  const [currentSongIdx, setCurrentSongIdx] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(80);
  const [musicProgress, setMusicProgress] = useState(25);
  const [danceSpeed, setDanceSpeed] = useState<"1.0x" | "1.2x" | "1.5x">("1.0x");
  const [showLyricsList, setShowLyricsList] = useState(true);

  // --- TikTok App State ---
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [isTikTokPlaying, setIsTikTokPlaying] = useState(true);
  const [tiktokLikes, setTiktokLikes] = useState([1204, 3409, 892]);
  const [tiktokLiked, setTiktokLiked] = useState([false, false, false]);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  // --- TV App State ---
  const [currentChannelIdx, setCurrentChannelIdx] = useState(0);
  const [isTvPlaying, setIsTvPlaying] = useState(true);
  const [tvVolume, setTvVolume] = useState(70);
  const [tvMuted, setTvMuted] = useState(false);

  // Songs Data
  const songs = [
    {
      title: "《甜蜜蜜》",
      singer: "邓丽君",
      tag: "怀旧金曲 🎙️",
      cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=60",
      lyrics: [
        "甜蜜蜜，你笑得甜蜜蜜",
        "好像花儿开在春风里",
        "开在春风里...",
        "在哪里，在哪里见过你",
        "你的笑容这样熟悉",
        "我一时想不起",
        "啊，在梦里！"
      ]
    },
    {
      title: "《茉莉花》",
      singer: "经典民歌",
      tag: "优美民乐 🌸",
      cover: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&auto=format&fit=crop&q=60",
      lyrics: [
        "好一朵美丽的茉莉花",
        "好一朵美丽的茉莉花",
        "芬芳美丽满枝桠",
        "又香又白人人夸",
        "让我来将你摘下",
        "送给别人家",
        "茉莉花呀茉莉花..."
      ]
    },
    {
      title: "《梁祝 - 协奏曲》",
      singer: "经典小提琴",
      tag: "古典音乐 🎻",
      cover: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&auto=format&fit=crop&q=60",
      lyrics: [
        "【轻柔悠扬的弦乐渐入】",
        "彩蝶翩翩起舞，诉说着千古爱情",
        "化作琴声，穿透岁月的安宁",
        "执子之手，与子偕老",
        "梁山伯与祝英台，浪漫回响...",
        "【进入欢快如歌的快板段落】"
      ]
    }
  ];

  // TikTok Videos Data
  const videos = [
    {
      title: "老顽童爷爷分享：清晨养生拍手操！",
      author: "@王爷爷健康生活",
      avatar: "https://picsum.photos/seed/wang/100/100",
      cover: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&auto=format&fit=crop&q=80",
      tag: "养生拍手 👏",
      hearts: "1.2万",
      desc: "每天坚持拍手三分钟，活动关节，通经活络，越活越年轻！快跟老王一起练起来吧！",
    },
    {
      title: "惊喜！孙子瞒着奶奶偷偷坐高铁回家过年",
      author: "@温馨百姓故事",
      avatar: "https://picsum.photos/seed/happyfamily/100/100",
      cover: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=500&auto=format&fit=crop&q=80",
      tag: "合家欢乐 ❤️",
      hearts: "3.4万",
      desc: "奶奶一回头惊喜得抱住孙子直流眼泪，这就是人间最美的重逢。祝全天下的老人家身体健康！",
    },
    {
      title: "戏曲名段：名角精选《智取威虎山》唱段",
      author: "@国剧戏曲国潮",
      avatar: "https://picsum.photos/seed/opera/100/100",
      cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=80",
      tag: "经典国粹 🎭",
      hearts: "8933",
      desc: "今日分享甘洒热血写春秋！名家金声玉振，中气十足，精神抖擞！",
    }
  ];

  // TV Channels Data
  const channels = [
    {
      name: "CCTV-1 综合频道",
      playingNow: "《新闻联播》 每日要闻汇总",
      cover: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80",
      isLive: true,
      time: "19:00 - 19:30"
    },
    {
      name: "CCTV-11 戏曲频道",
      playingNow: "经典京剧选段：《沙家浜》一日长征",
      cover: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&auto=format&fit=crop&q=80",
      isLive: true,
      time: "18:30 - 20:00"
    },
    {
      name: "CCTV-15 音乐频道",
      playingNow: "怀旧金曲音乐会：老歌合唱团",
      cover: "https://images.unsplash.com/photo-1487180142328-054b783fc471?w=800&auto=format&fit=crop&q=80",
      isLive: true,
      time: "19:30 - 21:00"
    },
    {
      name: "社区广播电台",
      playingNow: "智能讲堂：如何一眼识破老年保健品理财骗局",
      cover: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80",
      isLive: false,
      time: "随时收听"
    }
  ];

  // Auto progression simulated states
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isMusicPlaying) {
      timer = setInterval(() => {
        setMusicProgress((prev) => {
          if (prev >= 100) {
            setCurrentSongIdx((sIdx) => (sIdx + 1) % songs.length);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isMusicPlaying, currentSongIdx]);

  // Double tap heart simulation for TikTok
  const handleTiktokDoubleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newHeart = { id: Date.now(), x, y };
    setFloatingHearts((prev) => [...prev, newHeart]);

    if (!tiktokLiked[currentVideoIdx]) {
      const updatedLiked = [...tiktokLiked];
      updatedLiked[currentVideoIdx] = true;
      setTiktokLiked(updatedLiked);

      const updatedLikes = [...tiktokLikes];
      updatedLikes[currentVideoIdx] += 1;
      setTiktokLikes(updatedLikes);
    }

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1000);
  };

  const handleTiktokLikeBtn = () => {
    const updatedLiked = [...tiktokLiked];
    const isLiked = !updatedLiked[currentVideoIdx];
    updatedLiked[currentVideoIdx] = isLiked;
    setTiktokLiked(updatedLiked);

    const updatedLikes = [...tiktokLikes];
    updatedLikes[currentVideoIdx] += isLiked ? 1 : -1;
    setTiktokLikes(updatedLikes);
  };

  const triggerServiceBooking = (serviceName: string, detailMsg: string) => {
    setBookingStatus(`您的“${serviceName}”预约已成功提交！${detailMsg}`);
    setSelectedService(null); // close detail
    setTimeout(() => {
      setBookingStatus(null);
    }, 8000); // clear after 8s
  };

  const openServiceModal = (type: string) => {
    setSelectedService(type);
  };

  const getCourseDetails = (id: string) => {
    const detailsMap: Record<string, { syllabus: string[]; instructor: string; audience: string; attendees: string[] }> = {
      "act-1": {
        syllabus: [
          "第一节：太极剑入门基本步法与握剑姿势 (15分钟)",
          "第二节：第一至四式基本招式（起势、劈剑、回抽）拆解演练 (35分钟)",
          "第三节：全套慢速带练与夏日呼吸吐纳调节 (25分钟)",
          "第四节：自由交流，资深太极大师现场一句话对动作纠错 (15分钟)"
        ],
        instructor: "张建国 (市武术协会常务理事、太极拳国家六段)",
        audience: "55岁以上，有无太极基础皆可，请穿宽松运动鞋服",
        attendees: ["刘大爷 (1号楼)", "张阿姨 (5号楼)", "周叔叔 (12号楼)", "王奶奶 (3号楼)"]
      },
      "act-2": {
        syllabus: [
          "第一节：如何屏蔽手机里的流氓广告弹窗与自动扣费暗号 (20分钟)",
          "第二节：实战拆解：微信面对面教您识别“AI换脸换声”骗局 (25分钟)",
          "第三节：手把手安装“国家反诈中心”并开启实时防范保护功能 (15分钟)",
          "第四节：社区网格员现场答疑与手机安全功能检测 (15分钟)"
        ],
        instructor: "王警官 (海淀分局反诈支队一级警司、社区网警)",
        audience: "全体社区长者居民，建议携带平日高频使用的智能手机",
        attendees: ["马阿姨 (3号楼)", "赵大爷 (7号楼)", "李奶奶 (9号楼)"]
      },
      "act-3": {
        syllabus: [
          "第一节：伏天“温水清补”：如何做到科学祛湿、消暑热不伤胃 (25分钟)",
          "第二节：针对三高慢性病长者的夏季膳食禁忌与药膳搭配 (35分钟)",
          "第三节：现场药膳品鉴：慢熬无沙百合莲子羹与温润红豆粥 (15分钟)",
          "第四节：主任医师舌苔简易问诊与夏日居家养生指导意见 (15分钟)"
        ],
        instructor: "李国华 (省中医院老年内科主任医师、客座教授)",
        audience: "注重日常脾胃调理、关注膳食养生的长者及家属",
        attendees: ["钱阿姨 (4号楼)", "孙大爷 (6号楼)", "杨叔叔 (2号楼)"]
      }
    };
    return detailsMap[id] || {
      syllabus: ["第一节：基础入门讲解 (30分钟)", "第二节：实操演示与提问 (40分钟)"],
      instructor: "社区志愿者骨干",
      audience: "全体社区老年居民",
      attendees: ["王阿姨", "李大爷"]
    };
  };

  return (
    <div className="flex flex-col w-[600px] h-full bg-[#FAF8F5] p-5 select-none overflow-hidden shrink-0 border-r border-[#EBE6DD]" id="community-panel">
      
      {/* SECTION Header: Tsinghua Garden Community Service Hub */}
      <div className="flex items-center justify-between border-b border-[#EBE6DD] pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#EAF6EF] flex items-center justify-center text-[#256f4f]">
            <Landmark className="w-6.5 h-6.5" />
          </div>
          <div className="text-left font-sans">
            <h2 className="text-2xl font-black text-[#1C2C24] tracking-wide">社区便利综合大厅</h2>
            <span className="text-[12px] font-bold text-[#256f4f] tracking-wider block mt-0.5">
              清华园社区 · 贴心便利服务
            </span>
          </div>
        </div>
        <span className="text-xs bg-amber-50 text-amber-700 font-extrabold px-2.5 py-1 rounded-md border border-amber-200 animate-pulse">
          {selectedModule === null ? "💡 极简操作界面 · 点击图标模块进入" : "💡 点击卡片 or 按钮进入二级详情"}
        </span>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-0 bg-white border border-[#EBE6DD] rounded-2xl p-4.5 shadow-sm relative overflow-hidden">
        
        {selectedModule === null ? (
          <div className="flex-1 flex flex-col justify-between min-h-0 animate-fade-in py-1">
            <div className="space-y-4">
              
              {/* SECTION 1: SYSTEM QUICK SHORTS */}
              <div className="text-left">
                <span className="text-sm font-extrabold uppercase tracking-wider text-[#256f4f] bg-[#EAF6EF] px-3 py-1 rounded-md border border-[#C3E6D2] inline-block mb-3">
                  ⚡ 常用工具快捷
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      if (onOpenAlbum) onOpenAlbum();
                    }}
                    className="flex items-center gap-3.5 p-3.5 bg-[#FAF9F6] hover:bg-blue-50/30 border-2 border-[#EBE6DD] hover:border-blue-400 rounded-xl transition-all duration-300 transform active:scale-[0.97] cursor-pointer text-left group shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-all">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[19px] font-black text-[#1C2C24] block leading-tight">📷 电子相册</span>
                      <span className="text-xs font-bold text-gray-500 mt-0.5 block">播放全屏幻灯片</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (onStartCall) onStartCall("小明");
                    }}
                    className="flex items-center gap-3.5 p-3.5 bg-[#FAF9F6] hover:bg-emerald-50/30 border-2 border-[#EBE6DD] hover:border-[#256f4f] rounded-xl transition-all duration-300 transform active:scale-[0.97] cursor-pointer text-left group shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-lg bg-[#EAF6EF] text-[#256f4f] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-all">
                      <PhoneCall className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[19px] font-black text-[#1C2C24] block leading-tight">📞 呼叫家人</span>
                      <span className="text-xs font-bold text-gray-500 mt-0.5 block">直拨家人视频电话</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (onFocusSchedule) onFocusSchedule();
                    }}
                    className="flex items-center gap-3.5 p-3.5 bg-[#FAF9F6] hover:bg-amber-50/30 border-2 border-[#EBE6DD] hover:border-amber-500 rounded-xl transition-all duration-300 transform active:scale-[0.97] cursor-pointer text-left group shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-all">
                      <Bell className="w-6 h-6 animate-swing" style={{ transformOrigin: "top center" }} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[19px] font-black text-[#1C2C24] block leading-tight">🔔 日程提醒</span>
                      <span className="text-xs font-bold text-gray-500 mt-0.5 block">高亮药盒提醒日程</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedModule('services');
                      setActiveTab('services');
                    }}
                    className="flex items-center gap-3.5 p-3.5 bg-[#FAF9F6] hover:bg-indigo-50/30 border-2 border-[#EBE6DD] hover:border-indigo-500 rounded-xl transition-all duration-300 transform active:scale-[0.97] cursor-pointer text-left group shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-all">
                      <HandPlatter className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[19px] font-black text-[#1C2C24] block leading-tight">👵 养老服务</span>
                      <span className="text-xs font-bold text-gray-500 mt-0.5 block">助餐送餐与维修日常</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* SECTION 2: COMMUNITY SERVICE PORTALS */}
              <div className="text-left">
                <span className="text-sm font-extrabold uppercase tracking-wider text-[#256f4f] bg-[#EAF6EF] px-3 py-1 rounded-md border border-[#C3E6D2] inline-block mb-3">
                  🏡 社区签约服务
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setSelectedModule('courses');
                      setActiveTab('activity');
                    }}
                    className="flex items-center gap-3.5 p-3.5 bg-[#FAF9F6] hover:bg-teal-50/30 border-2 border-[#EBE6DD] hover:border-teal-500 rounded-xl transition-all duration-300 transform active:scale-[0.97] cursor-pointer text-left group shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-all">
                      <CalendarRange className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[19px] font-black text-[#1C2C24] block leading-tight">🎓 社区课程</span>
                      <span className="text-xs font-bold text-gray-500 mt-0.5 block">报名太极拳中医讲座</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedModule('scam');
                      setActiveTab('scam');
                    }}
                    className="flex items-center gap-3.5 p-3.5 bg-[#FAF9F6] hover:bg-rose-50/30 border-2 border-[#EBE6DD] hover:border-rose-500 rounded-xl transition-all duration-300 transform active:scale-[0.97] cursor-pointer text-left group shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-all">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[19px] font-black text-[#1C2C24] block leading-tight">🛡️ 防诈课堂</span>
                      <span className="text-xs font-bold text-gray-500 mt-0.5 block">防诈骗来电情景模拟</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* SECTION 3: THIRD PARTY ENTERTAINMENT HUB */}
              <div className="text-left">
                <span className="text-sm font-extrabold uppercase tracking-wider text-[#256f4f] bg-[#EAF6EF] px-3 py-1 rounded-md border border-[#C3E6D2] inline-block mb-3">
                  🎉 老友娱乐生活
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setActiveApp('tiktok');
                      setIsTikTokPlaying(true);
                    }}
                    className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-stone-900 to-stone-800 hover:from-black hover:to-stone-900 border-2 border-stone-800 hover:border-rose-500 rounded-xl transition-all duration-300 transform active:scale-[0.95] cursor-pointer shadow-md group"
                  >
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-all mb-1.5">
                      <span className="text-xl">🎬</span>
                    </div>
                    <span className="text-[16px] font-black text-white leading-none">抖音短视频</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveApp('tv');
                      setIsTvPlaying(true);
                    }}
                    className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-zinc-900 to-zinc-800 hover:from-black hover:to-zinc-900 border-2 border-zinc-800 hover:border-blue-500 rounded-xl transition-all duration-300 transform active:scale-[0.95] cursor-pointer shadow-md group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-all mb-1.5">
                      <Tv2 className="w-5.5 h-5.5" />
                    </div>
                    <span className="text-[16px] font-black text-white leading-none">电视直播间</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveApp('music');
                      setIsMusicPlaying(true);
                    }}
                    className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-amber-950/90 to-amber-900/90 hover:from-amber-950 hover:to-amber-900 border-2 border-amber-900/80 hover:border-amber-500 rounded-xl transition-all duration-300 transform active:scale-[0.95] cursor-pointer shadow-md group"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-all mb-1.5">
                      <Music className="w-5.5 h-5.5" />
                    </div>
                    <span className="text-[16px] font-black text-white leading-none">养生音乐盒</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
            {/* Secondary view Header block */}
            <div className="flex items-center justify-between border-b border-[#EBE6DD] pb-3.5 mb-4 shrink-0">
              <button
                onClick={() => setSelectedModule(null)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-base font-black text-gray-700 transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
                <span>返回大厅</span>
              </button>
              <span className="text-[20px] font-black text-[#1C2C24] flex items-center gap-2">
                {selectedModule === 'courses' && "🎓 社区精彩课程预约"}
                {selectedModule === 'services' && "👵 社区居家养老预约"}
                {selectedModule === 'scam' && "🛡️ 安全防诈模拟课堂"}
              </span>
            </div>

            {/* List Contents container */}
            <div className="flex-1 overflow-y-auto pr-1 text-left custom-scroll min-h-0 space-y-4">
              
              {/* Module: Courses list */}
              {selectedModule === 'courses' && (
                <div className="space-y-4">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      onClick={() => setSelectedActivity(act)}
                      className="flex flex-col p-5 bg-[#FAF8F5] border-2 border-[#EBE6DD]/60 hover:border-brand-green rounded-2xl animate-fade-in gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)] cursor-pointer transition-all active:scale-[0.99] relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-amber-800 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded">
                          {act.tag}
                        </span>
                        <span className="text-sm text-brand-green font-black flex items-center gap-1 group-hover:underline">
                          点击进入详情教室 <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                      <h4 className="text-[26px] font-black text-[#1C2C24] leading-tight tracking-wide pr-8">
                        {act.title}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[18px] font-black text-gray-500 flex items-center gap-1">
                          <MapPin className="w-4.5 h-4.5 text-gray-400" />
                          {act.location}
                        </span>
                        
                        {act.registered ? (
                          <div className="flex items-center gap-2 text-[#256f4f] bg-[#EAF6EF] border border-[#C3E6D2] px-5 py-2.5 rounded-xl text-[16px] font-black select-none">
                            <ShieldCheck className="w-5 h-5" />
                            <span>已成功预约</span>
                          </div>
                        ) : (
                          <span className="text-[16px] font-black text-brand-green bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
                            余位 {act.spotsLeft} 名
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Module: Services list */}
              {selectedModule === 'services' && (
                <div className="space-y-4.5">
                  {bookingStatus && (
                    <div className="p-4 bg-[#EAF6EF] border border-[#C3E6D2] text-emerald-800 rounded-2xl text-[18px] leading-relaxed font-black animate-fade-in mb-2 flex gap-3 items-start shadow-sm">
                      <ShieldCheck className="w-6 h-6 shrink-0 text-[#256f4f] mt-0.5" />
                      <p>{bookingStatus}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3.5">
                    <button
                      onClick={() => openServiceModal("meal")}
                      className="flex flex-col items-center p-5 bg-[#FAF8F5] border-2 border-[#EBE6DD] hover:border-brand-green hover:bg-emerald-50/10 rounded-2xl transition-all duration-300 transform active:scale-95 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
                    >
                      <div className="w-14 h-14 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 shadow-inner">
                        <HandPlatter className="w-7 h-7 animate-bounce" style={{ animationDuration: '3s' }} />
                      </div>
                      <span className="text-[20px] font-black text-[#1C2C24]">助餐订餐</span>
                      <span className="text-xs text-emerald-600 font-extrabold mt-1.5 flex items-center gap-0.5">
                        一键预定 🍱
                      </span>
                    </button>

                    <button
                      onClick={() => openServiceModal("clean")}
                      className="flex flex-col items-center p-5 bg-[#FAF8F5] border-2 border-[#EBE6DD] hover:border-brand-green hover:bg-emerald-50/10 rounded-2xl transition-all duration-300 transform active:scale-95 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
                    >
                      <div className="w-14 h-14 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3 shadow-inner">
                        <Heart className="w-7 h-7" />
                      </div>
                      <span className="text-[20px] font-black text-[#1C2C24]">家政清洁</span>
                      <span className="text-xs text-emerald-600 font-extrabold mt-1.5 flex items-center gap-0.5">
                        挑选阿姨 🧹
                      </span>
                    </button>

                    <button
                      onClick={() => openServiceModal("repair")}
                      className="flex flex-col items-center p-5 bg-[#FAF8F5] border-2 border-[#EBE6DD] hover:border-brand-green hover:bg-emerald-50/10 rounded-2xl transition-all duration-300 transform active:scale-95 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
                    >
                      <div className="w-14 h-14 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 shadow-inner">
                        <Wrench className="w-7 h-7" />
                      </div>
                      <span className="text-[20px] font-black text-[#1C2C24]">水电报修</span>
                      <span className="text-xs text-emerald-600 font-extrabold mt-1.5 flex items-center gap-0.5">
                        极速呼叫 🔧
                      </span>
                    </button>
                  </div>

                  {/* Guarantee description inside subview */}
                  <div className="bg-[#FAF7F2] border border-[#EBE6DD] rounded-2xl p-5 mt-3 shadow-sm">
                    <h5 className="text-[18px] font-black text-brand-green mb-1.5 flex items-center gap-1">
                      <span>💡 社区签约服务机构保障说明:</span>
                    </h5>
                    <p className="text-base text-gray-600 leading-relaxed font-semibold">
                      所有上门服务人员均经过清华园街道办事处双重实名资质审核、体检合格并统一投保，服务费用支持中控屏“老人保障卡”一键划扣，安全省心无忧。
                    </p>
                  </div>
                </div>
              )}

              {/* Module: Scam alerts list */}
              {selectedModule === 'scam' && (
                <div className="space-y-4">
                  {scamTips.map((tip) => (
                    <div
                      key={tip.id}
                      onClick={() => {
                        setSelectedScamTip(tip);
                        setScamUserChoice('pending');
                      }}
                      className="p-5 rounded-2xl border-2 border-[#EBE6DD] bg-[#FAF8F5] hover:border-brand-green transition-all cursor-pointer animate-fade-in relative group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-7 h-7 text-amber-600" />
                          <h4 className="text-[24px] font-black tracking-wide leading-tight text-[#1C2C24]">
                            {tip.title}
                          </h4>
                        </div>
                      </div>
                      <p className="text-[17px] font-bold leading-relaxed pl-9 text-gray-600">
                        {tip.description.slice(0, 75)}...
                      </p>
                      <div className="mt-3.5 pl-9 flex items-center justify-between">
                        <span className="text-sm text-brand-green font-black flex items-center gap-1 group-hover:underline">
                          🎭 进入模拟案例防诈剧场
                        </span>
                        <span className="text-xs text-gray-400 font-extrabold">{tip.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- SECONDARY VIEW: 1. Course Details Overlay ----------------- */}
        <AnimatePresence>
          {selectedActivity && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="absolute inset-0 bg-white z-40 flex flex-col p-5 select-none"
              id="course-detail-overlay"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#EBE6DD] pb-4 mb-4">
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#E5DFD5]/60 hover:bg-[#D0C9BC] rounded-xl text-[18px] font-black text-gray-700 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                  <span>返回列表</span>
                </button>
                <span className="text-sm font-black text-amber-800 bg-amber-500/10 px-3 py-1 rounded">
                  {selectedActivity.tag}
                </span>
              </div>

              {/* Scroll Content */}
              <div className="flex-1 overflow-y-auto custom-scroll pr-1 space-y-5 text-left">
                {/* Course Title */}
                <div>
                  <h3 className="text-[30px] font-black text-[#1C2C24] leading-tight tracking-wide">
                    {selectedActivity.title}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    <span className="text-base font-bold text-gray-500 flex items-center gap-1 bg-[#FAF8F5] border border-[#EBE6DD] px-3 py-1.5 rounded-lg">
                      <Timer className="w-4.5 h-4.5 text-gray-400" />
                      时间：{selectedActivity.time}
                    </span>
                    <span className="text-base font-bold text-gray-500 flex items-center gap-1 bg-[#FAF8F5] border border-[#EBE6DD] px-3 py-1.5 rounded-lg">
                      <MapPin className="w-4.5 h-4.5 text-gray-400" />
                      教室：{selectedActivity.location}
                    </span>
                  </div>
                </div>

                {/* Instructor */}
                <div className="p-4 bg-[#EAF6EF]/40 border border-[#C3E6D2] rounded-xl flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-green text-white font-black flex items-center justify-center text-lg shrink-0 shadow-md">
                    师
                  </div>
                  <div>
                    <p className="text-[18px] font-black text-brand-green">主讲老师：</p>
                    <p className="text-base text-gray-700 font-bold mt-0.5">
                      {getCourseDetails(selectedActivity.id).instructor}
                    </p>
                  </div>
                </div>

                {/* Course Outline (Syllabus) */}
                <div className="space-y-3">
                  <h4 className="text-[22px] font-black text-[#1C2C24] flex items-center gap-1.5">
                    <span className="text-brand-green">📖</span>
                    <span>课程教学大纲与环节：</span>
                  </h4>
                  <div className="bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl p-4 space-y-3 shadow-inner">
                    {getCourseDetails(selectedActivity.id).syllabus.map((item, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-[18px] text-gray-700 font-bold leading-normal">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suitable Group */}
                <div>
                  <h4 className="text-[20px] font-black text-[#1C2C24]">🎯 适合对象与提示：</h4>
                  <p className="text-base text-gray-600 font-bold mt-1.5 bg-stone-50 p-3 rounded-lg border border-[#EBE6DD]/60">
                    {getCourseDetails(selectedActivity.id).audience}
                  </p>
                </div>

                {/* Other Registered Neighbors */}
                <div>
                  <h4 className="text-[20px] font-black text-[#1C2C24] mb-2">👥 社区已报名邻居 ({getCourseDetails(selectedActivity.id).attendees.length}人)：</h4>
                  <div className="flex flex-wrap gap-2">
                    {getCourseDetails(selectedActivity.id).attendees.map((name, i) => (
                      <span key={i} className="px-3.5 py-1.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg border border-gray-200">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="border-t border-[#EBE6DD] pt-4 mt-4 shrink-0 flex gap-4">
                {selectedActivity.registered ? (
                  <div className="flex-1 flex items-center justify-center gap-2 bg-[#EAF6EF] border border-[#C3E6D2] rounded-xl py-4.5 text-[22px] font-black text-[#256f4f] shadow-inner">
                    <ShieldCheck className="w-7 h-7" />
                    <span>您已经预约成功 (提前预留专属座位)</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onRegisterActivity(selectedActivity.id);
                      const updated = { ...selectedActivity, registered: true };
                      setSelectedActivity(updated);
                      // Trigger audio confirm message
                      speakText(`报名成功。您已成功预约：${selectedActivity.title}，我们将提前为您预留教室座位。`, {
                        fallbackKey: "activity-registered",
                      });
                    }}
                    className="flex-1 py-4.5 bg-brand-green hover:bg-brand-green-hover text-white text-[22px] font-black rounded-xl shadow-lg border border-emerald-700/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-6.5 h-6.5" />
                    <span>一键锁定座位 (余位 {selectedActivity.spotsLeft} 个)</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----------------- SECONDARY VIEW: 2. Elderly Booking Details Overlay ----------------- */}
        <AnimatePresence>
          {selectedService && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="absolute inset-0 bg-white z-40 flex flex-col p-5 select-none"
              id="service-booking-overlay"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#EBE6DD] pb-4 mb-4 shrink-0">
                <button
                  onClick={() => setSelectedService(null)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#E5DFD5]/60 hover:bg-[#D0C9BC] rounded-xl text-[18px] font-black text-gray-700 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                  <span>返回服务</span>
                </button>
                <span className="text-[22px] font-black text-[#1C2C24]">
                  {selectedService === 'meal' && "🍱 暖心长者食堂预约助餐"}
                  {selectedService === 'clean' && "🧹 社区家政爱心清洁派单"}
                  {selectedService === 'repair' && "🔧 便民水电家电急速报修"}
                </span>
              </div>

              {/* Scroll Form Content */}
              <div className="flex-1 overflow-y-auto custom-scroll pr-1 space-y-4 text-left min-h-0">
                
                {/* 1. MEAL FLOW */}
                {selectedService === 'meal' && (
                  <div className="space-y-4">
                    <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                      今日清华园老年食堂精选套餐
                    </span>
                    
                    {/* Meal Choices */}
                    <div className="space-y-3">
                      {[
                        {
                          id: "A",
                          name: "【A餐】清蒸鲈鱼无刺套餐 (健康低脂)",
                          desc: "清蒸无刺鲈鱼 + 虾皮炒冬瓜 + 蒜蓉嫩时蔬 + 燕麦糙米饭 + 慢熬香菇鸡汤",
                          price: "社区补贴价：15元"
                        },
                        {
                          id: "B",
                          name: "【B餐】养生山药排骨套餐 (温补健脾)",
                          desc: "清炖香排骨 + 清炒山药木耳 + 翡翠豆腐 + 杂粮红豆饭 + 银耳红枣枸杞汤",
                          price: "社区补贴价：18元"
                        },
                        {
                          id: "C",
                          name: "【C餐】滑鸡泥南瓜软烂套餐 (易咀嚼好消化)",
                          desc: "生滚滑鸡片 + 慢煮南瓜泥 + 番茄炒鸡蛋 + 高纤养胃小米粥 + 手作粗粮发糕",
                          price: "社区补贴价：12元"
                        }
                      ].map((meal) => (
                        <div
                          key={meal.id}
                          onClick={() => setMealOption(meal.id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            mealOption === meal.id
                              ? "bg-amber-50/40 border-amber-500 shadow-md scale-[1.01]"
                              : "bg-stone-50/60 border-[#EBE6DD] hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[19px] font-black text-[#1C2C24]">{meal.name}</span>
                            <span className="text-[16px] font-black text-amber-700 bg-amber-100/50 px-2.5 py-0.5 rounded border border-amber-300">
                              {meal.price}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-gray-500 mt-1.5 leading-relaxed">{meal.desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* Deliver Time */}
                    <div className="space-y-2">
                      <label className="text-base font-black text-gray-700 block">🚚 配送上门时间段选择：</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["11:00 - 11:30", "11:30 - 12:00", "12:00 - 12:30"].map((time) => (
                          <button
                            key={time}
                            onClick={() => setMealTime(time)}
                            className={`py-3.5 rounded-xl text-base font-black border-2 cursor-pointer transition-all ${
                              mealTime === time
                                ? "bg-brand-green text-white border-brand-green shadow"
                                : "bg-white border-[#EBE6DD] hover:border-brand-green/40 text-gray-600"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Special Notes for elderly */}
                    <div className="space-y-2">
                      <label className="text-base font-black text-gray-700 block">🧂 口味和配送特殊嘱托 (大字方便录入)：</label>
                      <div className="flex flex-wrap gap-2">
                        {["少盐少油，饭煮软一些", "不要辣椒和花椒", "放到门口保温箱即可", "请送进屋放在餐桌上"].map((note) => (
                          <button
                            key={note}
                            onClick={() => setMealNote(note)}
                            className={`px-3 py-2 text-sm font-bold rounded-lg border-2 cursor-pointer transition-all ${
                              mealNote === note
                                ? "bg-amber-100 border-amber-400 text-amber-900"
                                : "bg-stone-50 border-stone-200 text-gray-600 hover:border-stone-300"
                            }`}
                          >
                            {note}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payment methods */}
                    <div className="space-y-2">
                      <label className="text-base font-black text-gray-700 block">💳 支付与扣款方式：</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setPaymentMethod("card")}
                          className={`p-3 rounded-xl border-2 text-left flex justify-between items-center cursor-pointer transition-all ${
                            paymentMethod === "card"
                              ? "bg-emerald-50 border-brand-green shadow-sm"
                              : "bg-white border-gray-200 text-gray-500"
                          }`}
                        >
                          <div>
                            <span className="text-[18px] font-black text-[#1C2C24] block">社区长者专属卡一键划扣</span>
                            <span className="text-xs text-gray-500 font-bold mt-0.5 block">享用政府老龄用餐全额补贴</span>
                          </div>
                          {paymentMethod === "card" && <Check className="w-5.5 h-5.5 text-brand-green shrink-0" />}
                        </button>
                        <button
                          onClick={() => setPaymentMethod("child")}
                          className={`p-3 rounded-xl border-2 text-left flex justify-between items-center cursor-pointer transition-all ${
                            paymentMethod === "child"
                              ? "bg-emerald-50 border-brand-green shadow-sm"
                              : "bg-white border-gray-200 text-gray-500"
                          }`}
                        >
                          <div>
                            <span className="text-[18px] font-black text-[#1C2C24] block">发送微信通知儿女代付</span>
                            <span className="text-xs text-gray-500 font-bold mt-0.5 block">微信群发账单，自动付款</span>
                          </div>
                          {paymentMethod === "child" && <Check className="w-5.5 h-5.5 text-brand-green shrink-0" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. CLEAN FLOW */}
                {selectedService === 'clean' && (
                  <div className="space-y-4">
                    <span className="text-xs font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                      清华园金牌爱心家政库 (实名认证，健康在档)
                    </span>

                    {/* Service Type Selection */}
                    <div className="space-y-2">
                      <label className="text-base font-black text-gray-700 block">🧹 挑选服务项目：</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["日常保洁", "深度厨房去重油污", "长者舒心沐浴协助"].map((item) => (
                          <button
                            key={item}
                            onClick={() => setCleanItem(item)}
                            className={`py-3 rounded-xl text-sm font-black border-2 cursor-pointer transition-all ${
                              cleanItem === item
                                ? "bg-teal-500 text-white border-teal-500 shadow"
                                : "bg-white border-[#EBE6DD] text-gray-600 hover:border-teal-400/40"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Housekeeper Profiles */}
                    <div className="space-y-2.5">
                      <label className="text-base font-black text-gray-700 block">👩 挑选爱心家政阿姨（点击选择）：</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            name: "张玉梅",
                            rating: "5.0 ★",
                            exp: "15年老经验",
                            desc: "拖地干净无尘，为人憨厚亲切，擅长精细收纳。"
                          },
                          {
                            name: "李红霞",
                            rating: "4.9 ★",
                            exp: "8年服务资质",
                            desc: "干活速度极快，做事细心，懂得老年餐烹调调理。"
                          }
                        ].map((cleaner) => (
                          <div
                            key={cleaner.name}
                            onClick={() => setSelectedCleaner(cleaner.name)}
                            className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedCleaner === cleaner.name
                                ? "bg-teal-50/50 border-teal-500 shadow-sm"
                                : "bg-white border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-black text-[#1C2C24]">{cleaner.name} 阿姨</span>
                              <span className="text-xs font-black text-teal-700 bg-teal-100/50 px-2.5 py-0.5 rounded">
                                {cleaner.rating} | {cleaner.exp}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-gray-500 mt-1.5 leading-relaxed">{cleaner.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Clean duration */}
                    <div className="space-y-2">
                      <label className="text-base font-black text-gray-700 block">⏰ 服务时长选择：</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[2, 3, 4].map((hours) => (
                          <button
                            key={hours}
                            onClick={() => setCleanDuration(hours)}
                            className={`py-3.5 rounded-xl text-base font-black border-2 cursor-pointer transition-all ${
                              cleanDuration === hours
                                ? "bg-teal-600 text-white border-teal-600 shadow"
                                : "bg-white border-[#EBE6DD] hover:border-teal-400/40 text-gray-600"
                            }`}
                          >
                            {hours} 小时
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 font-extrabold mt-1">
                        💡 提示：按政府居家养老助残补贴，每小时仅需自付 10 元（原价 45 元）。
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. REPAIR FLOW */}
                {selectedService === 'repair' && (
                  <div className="space-y-4">
                    <span className="text-xs font-black text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200 animate-pulse">
                      🔴 社区便民维修站 24小时极速值班热线已开启
                    </span>

                    {/* Repair Category */}
                    <div className="space-y-2">
                      <label className="text-base font-black text-gray-700 block">🔧 挑选报修项目：</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["水管漏水/地漏堵塞", "电路故障/电灯不亮", "燃气排查/电器失灵"].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setRepairCategory(cat)}
                            className={`py-3 rounded-xl text-xs font-black border-2 cursor-pointer transition-all ${
                              repairCategory === cat
                                ? "bg-blue-600 text-white border-blue-600 shadow"
                                : "bg-white border-[#EBE6DD] hover:border-blue-400/40 text-gray-600"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Urgency Level */}
                    <div className="space-y-2">
                      <label className="text-base font-black text-gray-700 block">🚨 紧急状态评估：</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            setRepairUrgency("极其紧急");
                            setRepairNote("漏水极其严重，地面积水很深！");
                          }}
                          className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all flex items-center justify-between ${
                            repairUrgency === "极其紧急"
                              ? "bg-red-50 border-red-500 shadow-sm"
                              : "bg-white border-gray-200 text-gray-500"
                          }`}
                        >
                          <div>
                            <span className="text-[18px] font-black text-red-600 flex items-center gap-1">
                              <Flame className="w-4 h-4 animate-bounce" />
                              极其紧急 (30分钟上门)
                            </span>
                            <span className="text-xs text-gray-500 font-bold block mt-0.5">水管爆裂、全屋断电等突发隐患</span>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setRepairUrgency("普通预约");
                            setRepairNote("水龙头渗水，需上门更换皮垫");
                          }}
                          className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all flex items-center justify-between ${
                            repairUrgency === "普通预约"
                              ? "bg-blue-50 border-blue-500 shadow-sm"
                              : "bg-white border-gray-200 text-gray-500"
                          }`}
                        >
                          <div>
                            <span className="text-[18px] font-black text-blue-700">
                              今日普通报修
                            </span>
                            <span className="text-xs text-gray-500 font-bold block mt-0.5">不影响安全，今日内抽空上门</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Input note */}
                    <div className="space-y-2">
                      <label className="text-base font-black text-gray-700 block">✍️ 报修具体故障说明：</label>
                      <div className="flex flex-wrap gap-2">
                        {["厨房水龙头滴水严重", "卫生间电灯闪烁不亮", "燃气灶打火困难", "房间插座漏电闪火花"].map((txt) => (
                          <button
                            key={txt}
                            onClick={() => setRepairNote(txt)}
                            className={`px-3 py-2 text-sm font-bold rounded-lg border-2 cursor-pointer transition-all ${
                              repairNote === txt
                                ? "bg-blue-100 border-blue-400 text-blue-900"
                                : "bg-stone-50 border-stone-200 text-gray-600 hover:border-stone-300"
                            }`}
                          >
                            {txt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Bottom Action Bar */}
              <div className="border-t border-[#EBE6DD] pt-4 mt-4 shrink-0">
                <button
                  onClick={() => {
                    let serviceName = "";
                    let detailMsg = "";
                    if (selectedService === 'meal') {
                      serviceName = "长者午餐助餐";
                      detailMsg = `已预订 A餐/B餐 营养套餐，将在今天 ${mealTime} 由食堂爱心骑手配送上门。将通过老人家属保障卡扣除！同时已向儿女发送微信提示通知。`;
                    } else if (selectedService === 'clean') {
                      serviceName = "爱心家政清洁";
                      detailMsg = `金牌家政“${selectedCleaner}阿姨”已接单！服务时长 ${cleanDuration}小时，正在核对居家地址。师傅将于预约时间准时上门，提供优质清扫服务！`;
                    } else if (selectedService === 'repair') {
                      serviceName = `极速便民报修 - ${repairCategory}`;
                      detailMsg = `维修班李师傅已携带工具包出发！等级【${repairUrgency}】，预计30分钟内（11:00左右）赶到您家中帮您加急排查抢修，请保持中控屏开机、注意开门！`;
                    }

                    triggerServiceBooking(serviceName, detailMsg);

                    // Voice announcement
                    speakText("预约成功！我们已把您的需求安排妥当，请您在家里安心等待。", {
                      fallbackKey: "service-booked",
                    });
                  }}
                  className="w-full py-4.5 bg-brand-green hover:bg-brand-green-hover text-white text-[22px] font-black rounded-xl shadow-lg border border-emerald-700/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-7 h-7" />
                  <span>一键确认，发起贴心服务预约</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----------------- SECONDARY VIEW: 3. Anti-Scam Classroom Simulator Overlay ----------------- */}
        <AnimatePresence>
          {selectedScamTip && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="absolute inset-0 bg-white z-40 flex flex-col p-5 select-none"
              id="scam-simulator-overlay"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#EBE6DD] pb-4 mb-4 shrink-0">
                <button
                  onClick={() => {
                    setSelectedScamTip(null);
                    setScamUserChoice('pending');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#E5DFD5]/60 hover:bg-[#D0C9BC] rounded-xl text-[18px] font-black text-gray-700 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                  <span>退出剧场</span>
                </button>
                <span className="text-[20px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded border border-rose-200">
                  🎭 社区防诈互动模拟剧场
                </span>
              </div>

              {/* Scroll Case Content */}
              <div className="flex-1 overflow-y-auto custom-scroll pr-1 space-y-4 text-left min-h-0">
                {/* Title and Intro */}
                <div>
                  <span className="text-xs font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    新型养老诈骗案例剖析
                  </span>
                  <h3 className="text-[25px] font-black text-red-900 leading-snug mt-1.5">
                    【实战演练】{selectedScamTip.title}
                  </h3>
                </div>

                {/* Simulated Scam Phone Scene Dialogue */}
                <div className="bg-stone-900 text-stone-100 rounded-2xl p-4.5 border-4 border-stone-800 relative overflow-hidden shadow-inner font-mono">
                  <div className="absolute top-2.5 right-3 px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-black tracking-widest animate-pulse">
                    模拟来电 DIAL IN
                  </div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-stone-800 text-xs text-stone-500">
                    <PhoneCall className="w-4 h-4 text-red-500 animate-pulse" />
                    <span>未知骚扰来电：+86 (010) 9553-XXXX</span>
                  </div>

                  <div className="space-y-3.5 text-base leading-relaxed">
                    <p className="text-stone-300 font-bold">
                      <span className="text-red-400 font-black">【骗子说】：</span>
                      {selectedScamTip.id === 'tip-1' && (
                        `“您好，我是北京市社保总局稽查专员。您的社保账户涉嫌巨额跨省骗保，涉嫌洗黑钱犯罪！如果你在24小时内不把个人全部存款转入我们的『国家社保核查安全账户』，我们会立刻通报检察院抓捕您，还要冻结您的全部养老金！快拿上存折下楼转账，千万不要告诉儿女，因为这是国家机密！”`
                      )}
                      {selectedScamTip.id === 'tip-2' && (
                        `“喂，大爷吗？今天在咱们社区大院后街有‘长寿养生大讲堂’，只要来就免费领5斤纯正东北大米和1盒精选鸡蛋！我们还有特邀北京神医，独家讲解能包治百病、延寿二十年的最新高科技深海鱼油。现在投资理财一万元，下个月保证返您两千利息，名额抢手，赶紧来啊！”`
                      )}
                      {selectedScamTip.id === 'tip-3' && (
                        `“（突发紧急短信）：爸！我是小刚，我的手机掉水里坏了。我现在出门出车祸把路人撞成骨折重伤了，人家抓着我不让走！医院急需5万元手术保证金，不给钱他们就要报警拘留我！我现在在护士手机上给您发信息，急急急！赶紧往这个农行账户转汇5万，千万别打电话，我嗓子哑了说不出话！”`
                      )}
                    </p>
                  </div>
                </div>

                {/* Option selection */}
                {scamUserChoice === 'pending' && (
                  <div className="space-y-3.5 pt-2">
                    <h4 className="text-[20px] font-black text-[#1C2C24]">💡 面对突发情况，您应当采取哪种做法？</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left Choice - Trap */}
                      <button
                        onClick={() => {
                          setScamUserChoice('warn');
                          speakText("千万别相信！这是骗局，不要听信对方转汇任何资金。", {
                            fallbackKey: "security-reading",
                          });
                        }}
                        className="p-5 bg-red-50 border-2 border-red-200 hover:border-red-500 rounded-xl text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between"
                      >
                        <span className="text-[20px] font-black text-red-900 block mb-2">选项 A：深信不疑</span>
                        <p className="text-[16px] font-bold text-red-800 leading-relaxed">
                          心里慌张害怕，按照骗子说的话，带上银行卡不跟任何人商量，马上下楼寻找ATM柜员机按指令转账。
                        </p>
                        <span className="text-xs text-red-500 font-extrabold mt-3.5 block">
                          🔴 点击测试此选择
                        </span>
                      </button>

                      {/* Right Choice - Smart */}
                      <button
                        onClick={() => {
                          setScamUserChoice('success');
                          speakText("恭喜您识破了骗局，做得很好。", {
                            fallbackKey: "security-reading",
                          });
                        }}
                        className="p-5 bg-emerald-50 border-2 border-emerald-200 hover:border-brand-green rounded-xl text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between"
                      >
                        <span className="text-[20px] font-black text-brand-green block mb-2">选项 B：智慧识破</span>
                        <p className="text-[16px] font-bold text-brand-green leading-relaxed">
                          绝对不听，当场挂断电话！并在中控屏微信核实儿女或拨打社区民警王警官电话进行面对面查证。
                        </p>
                        <span className="text-xs text-brand-green font-extrabold mt-3.5 block">
                          🟢 点击测试此选择
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive Feedback Box */}
                {scamUserChoice === 'warn' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 bg-red-100 border-4 border-red-500 text-red-900 rounded-2xl shadow-lg text-left space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-10 h-10 text-red-600 animate-bounce" />
                      <h4 className="text-[26px] font-black">⚠️ 极其危险！这是100%欺诈陷阱！</h4>
                    </div>
                    <p className="text-[18px] font-black leading-relaxed">
                      公检法及社保部门【绝无安全账户】，也绝不通过微信或电话要求转账！遇到所谓的“秘密案情”或“住院代付”，一定要当即挂断，联系子女确认！
                    </p>
                    <button
                      onClick={() => setScamUserChoice('pending')}
                      className="mt-3.5 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[16px] font-black rounded-lg cursor-pointer transition-all shadow"
                    >
                      重新选择，重试防诈答题
                    </button>
                  </motion.div>
                )}

                {scamUserChoice === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 bg-emerald-100 border-4 border-emerald-500 text-emerald-900 rounded-2xl shadow-lg text-left space-y-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <Award className="w-11 h-11 text-amber-500 animate-bounce" />
                      <h4 className="text-[28px] font-black text-brand-green">🎉 恭喜您！金钟罩防诈成功！</h4>
                    </div>
                    <p className="text-[19px] font-black leading-relaxed">
                      您真棒，防诈意识无懈可击！您刚刚成功化解了针对长辈的巨额资金骗局，守住了自己的养老血汗钱。儿女和老伴要是知道了，肯定有一万个安心和骄傲！
                    </p>
                    <div className="inline-flex items-center gap-2 bg-[#FAF8F5] border border-emerald-300 px-4 py-2 rounded-xl text-emerald-800 font-black">
                      🏅 获得勋章：清华园社区 · 黄金防诈荣誉卫士
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Bottom footer */}
              <div className="border-t border-[#EBE6DD] pt-4 mt-4 shrink-0">
                <button
                  onClick={() => {
                    setSelectedScamTip(null);
                    setScamUserChoice('pending');
                  }}
                  className="w-full py-4.5 bg-brand-green hover:bg-brand-green-hover text-white text-[20px] font-black rounded-xl shadow-lg border border-emerald-700/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-5.5 h-5.5" />
                  <span>我已经完全掌握，返回安全讲堂</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----------------- DYNAMIC ENTERTAINMENT OVERLAYS ----------------- */}
        <AnimatePresence>
          {/* 1. TikTok Short Video App */}
          {activeApp === 'tiktok' && (
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="absolute inset-0 bg-black z-50 flex flex-col p-5 select-none text-white font-sans"
              id="tiktok-player-overlay"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 shrink-0">
                <button
                  onClick={() => {
                    setActiveApp(null);
                    setIsTikTokPlaying(false);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-[18px] font-black text-white transition-all cursor-pointer"
                >
                  <X className="w-5.5 h-5.5" />
                  <span>退出抖音</span>
                </button>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-red-500 rounded-full text-xs font-black animate-pulse">
                  <span>● 正在播放暖心老友视频</span>
                </div>
              </div>

              {/* Player layout */}
              <div className="flex-1 flex gap-5 min-h-0">
                {/* Left: Video & Controls */}
                <div 
                  onClick={(e) => {
                    handleTiktokDoubleClick(e);
                    setIsTikTokPlaying(!isTikTokPlaying);
                  }}
                  className="flex-1 bg-stone-900 rounded-3xl relative overflow-hidden flex items-center justify-center cursor-pointer group"
                >
                  <img 
                    src={videos[currentVideoIdx].cover} 
                    alt="cover" 
                    className={`w-full h-full object-cover transition-all duration-700 ${isTikTokPlaying ? 'scale-105' : 'scale-100 filter brightness-75'}`} 
                    referrerPolicy="no-referrer"
                  />

                  {/* Absolute Center Play/Pause button */}
                  {!isTikTokPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-xl animate-scale-up">
                        <Play className="w-10 h-10 fill-current translate-x-1" />
                      </div>
                    </div>
                  )}

                  {/* Double tap floating hearts */}
                  {floatingHearts.map((h) => (
                    <motion.div
                      key={h.id}
                      initial={{ scale: 0, opacity: 1, y: 0 }}
                      animate={{ scale: 1.5, opacity: 0, y: -120, rotate: Math.random() * 40 - 20 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ left: h.x - 24, top: h.y - 24 }}
                      className="absolute text-red-500 text-5xl pointer-events-none drop-shadow-lg z-30"
                    >
                      ❤️
                    </motion.div>
                  ))}

                  {/* Bottom title & Author details overlaid on video */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6 text-left flex flex-col justify-end pt-20">
                    <span className="text-sm font-black text-rose-400 bg-rose-500/20 px-3 py-1 rounded-md border border-rose-500/30 inline-block w-max mb-2">
                      {videos[currentVideoIdx].tag}
                    </span>
                    <h3 className="text-[22px] font-black text-white leading-snug">
                      {videos[currentVideoIdx].title}
                    </h3>
                    <p className="text-sm font-bold text-gray-300 mt-1">
                      {videos[currentVideoIdx].author}
                    </p>
                    <p className="text-base text-gray-200 mt-2 leading-relaxed font-semibold">
                      {videos[currentVideoIdx].desc}
                    </p>

                    {/* Progress slider bar */}
                    <div className="w-full mt-5 bg-white/20 h-2.5 rounded-full relative overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all duration-300"
                        style={{ width: isTikTokPlaying ? '65%' : '40%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Panel: Likes & Interaction & Selector list */}
                <div className="w-[280px] shrink-0 flex flex-col justify-between h-full bg-stone-900 rounded-3xl border border-white/10 p-5">
                  {/* Action buttons */}
                  <div className="space-y-4">
                    <span className="text-sm font-extrabold text-gray-400 block border-b border-white/10 pb-2 mb-3">
                      互动操作
                    </span>
                    <button 
                      onClick={() => {
                        const updatedLiked = [...tiktokLiked];
                        updatedLiked[currentVideoIdx] = !updatedLiked[currentVideoIdx];
                        setTiktokLiked(updatedLiked);
                        
                        // Speak out
                        speakText(updatedLiked[currentVideoIdx] ? "感谢您的点赞，祝您天天开心！" : "已取消点赞");
                      }}
                      className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 p-3.5 rounded-2xl transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className={`w-7 h-7 ${tiktokLiked[currentVideoIdx] ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                        <span className="text-base font-black">点赞视频</span>
                      </div>
                      <span className="text-sm font-bold text-gray-400">
                        {tiktokLiked[currentVideoIdx] ? '已点赞' : '赞一个'}
                      </span>
                    </button>

                    <button 
                      onClick={() => {
                        speakText("感谢分享，已完成转发。");
                      }}
                      className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 p-3.5 rounded-2xl transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Share2 className="w-7 h-7 text-emerald-400" />
                        <span className="text-base font-black">分享给儿女</span>
                      </div>
                      <span className="text-sm font-bold text-gray-400">一键转发</span>
                    </button>
                  </div>

                  {/* Browser playlist selector */}
                  <div className="flex-1 flex flex-col min-h-0 pt-6">
                    <span className="text-sm font-extrabold text-gray-400 block border-b border-white/10 pb-2 mb-3">
                      更多推荐视频 ({videos.length}个)
                    </span>
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scroll">
                      {videos.map((vid, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setCurrentVideoIdx(idx);
                            setIsTikTokPlaying(true);
                          }}
                          className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all flex items-center gap-3 ${
                            currentVideoIdx === idx 
                              ? "bg-rose-500/10 border-rose-500" 
                              : "bg-white/5 border-transparent hover:bg-white/10"
                          }`}
                        >
                          <img 
                            src={vid.cover} 
                            alt="thumb" 
                            className="w-12 h-12 rounded-lg object-cover shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <span className="text-sm font-black text-white block truncate">{vid.title}</span>
                            <span className="text-xs font-bold text-gray-400 block mt-0.5">{vid.author}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Footer */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={() => {
                        setCurrentVideoIdx((idx) => (idx - 1 + videos.length) % videos.length);
                        setIsTikTokPlaying(true);
                      }}
                      className="py-3 bg-white/10 hover:bg-white/15 active:scale-95 text-base font-black rounded-xl cursor-pointer text-center"
                    >
                      上一个
                    </button>
                    <button
                      onClick={() => {
                        setCurrentVideoIdx((idx) => (idx + 1) % videos.length);
                        setIsTikTokPlaying(true);
                      }}
                      className="py-3 bg-[#E11D48] hover:bg-rose-600 active:scale-95 text-base font-black rounded-xl cursor-pointer text-center"
                    >
                      下一个
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. TV Live Show App */}
          {activeApp === 'tv' && (
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="absolute inset-0 bg-stone-950 z-50 flex flex-col p-5 select-none text-white font-sans"
              id="tv-player-overlay"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 shrink-0">
                <button
                  onClick={() => {
                    setActiveApp(null);
                    setIsTvPlaying(false);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-[18px] font-black text-white transition-all cursor-pointer"
                >
                  <X className="w-5.5 h-5.5" />
                  <span>退出电视</span>
                </button>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-500 rounded-full text-xs font-black animate-pulse">
                  <span>● 央视高清电视信号已接通</span>
                </div>
              </div>

              {/* Player Layout */}
              <div className="flex-1 flex gap-5 min-h-0">
                {/* Left Side: TV Screen Display */}
                <div className="flex-1 bg-black rounded-3xl relative overflow-hidden flex flex-col shadow-2xl">
                  {/* Video block */}
                  <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                    <img 
                      src={channels[currentChannelIdx].cover} 
                      alt="tv" 
                      className={`w-full h-full object-cover transition-all duration-700 ${isTvPlaying ? 'scale-105' : 'scale-100 filter brightness-50'}`} 
                      referrerPolicy="no-referrer"
                    />

                    {/* TV Station identification tag */}
                    <div className="absolute top-5 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-[20px] font-black tracking-wider text-white">
                      {channels[currentChannelIdx].name}
                    </div>

                    {/* Pulse Live Badge */}
                    {channels[currentChannelIdx].isLive && (
                      <div className="absolute top-5 right-6 flex items-center gap-2 bg-red-600 px-4 py-2 rounded-xl text-sm font-black tracking-widest animate-pulse shadow-md">
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                        <span>高清直播 LIVE</span>
                      </div>
                    )}

                    {/* Play center trigger */}
                    {!isTvPlaying && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <button 
                          onClick={() => setIsTvPlaying(true)}
                          className="w-24 h-24 rounded-full bg-blue-500/80 hover:bg-blue-600 text-white flex items-center justify-center shadow-2xl border-4 border-white/35 transition-all transform active:scale-95"
                        >
                          <Play className="w-11 h-11 fill-current translate-x-1" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bottom custom TV controls */}
                  <div className="bg-stone-900 border-t border-white/10 p-5 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setIsTvPlaying(!isTvPlaying)}
                        className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white cursor-pointer transition-all"
                      >
                        {isTvPlaying ? <Pause className="w-5.5 h-5.5" /> : <Play className="w-5.5 h-5.5 fill-current" />}
                      </button>

                      <div className="text-left">
                        <span className="text-[17px] font-black block">{channels[currentChannelIdx].playingNow}</span>
                        <span className="text-xs font-bold text-gray-400 block mt-0.5">节目时间：{channels[currentChannelIdx].time}</span>
                      </div>
                    </div>

                    {/* TV volume controllers */}
                    <div className="flex items-center gap-3.5 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                      <button 
                        onClick={() => setTvMuted(!tvMuted)}
                        className="text-gray-300 hover:text-white cursor-pointer"
                      >
                        {tvMuted ? <VolumeX className="w-5.5 h-5.5 text-red-400" /> : <Volume2 className="w-5.5 h-5.5" />}
                      </button>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={tvMuted ? 0 : tvVolume}
                        onChange={(e) => {
                          setTvVolume(Number(e.target.value));
                          setTvMuted(false);
                        }}
                        className="w-28 accent-blue-500 h-1.5 cursor-pointer rounded-lg bg-gray-600"
                      />
                      <span className="text-xs font-bold w-7 text-right">
                        {tvMuted ? '静音' : `${tvVolume}%`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Program guide list */}
                <div className="w-[320px] shrink-0 bg-stone-900 border border-white/10 rounded-3xl p-5 flex flex-col justify-between h-full">
                  <div className="flex-1 flex flex-col min-h-0">
                    <span className="text-base font-black text-gray-400 block border-b border-white/10 pb-2.5 mb-3.5">
                      📺 电视台节目列表
                    </span>

                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scroll text-left">
                      {channels.map((chan, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setCurrentChannelIdx(idx);
                            setIsTvPlaying(true);
                          }}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                            currentChannelIdx === idx 
                              ? "bg-blue-500/10 border-blue-500 text-white" 
                              : "bg-white/5 border-transparent hover:bg-white/10 text-gray-300"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[17px] font-black">{chan.name}</span>
                            {chan.isLive && (
                              <span className="text-[10px] font-black text-red-400 border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 rounded animate-pulse">
                                直播中
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-gray-400 mt-2 line-clamp-1 group-hover:text-white">
                            {chan.playingNow}
                          </p>
                          <span className="text-xs text-gray-500 font-extrabold block mt-1.5">
                            时段：{chan.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Channel direct dial helper panel for elderly */}
                  <div className="bg-white/5 rounded-2xl p-4.5 border border-white/10 mt-4 text-left">
                    <h5 className="text-[15px] font-black text-blue-400 mb-1">👵 助老电视指南</h5>
                    <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                      点击卡片即可秒速切台。中控音箱已与电视音量联动，可用大字滚轮随时调大声音！
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. Retro Nostalgic Music Box App */}
          {activeApp === 'music' && (
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="absolute inset-0 bg-gradient-to-br from-[#2D1B11] to-[#120B07] z-50 flex flex-col p-5 select-none text-[#F4EBE1] font-sans"
              id="music-player-overlay"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#F4EBE1]/10 pb-4 mb-4 shrink-0">
                <button
                  onClick={() => {
                    setActiveApp(null);
                    setIsMusicPlaying(false);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-white/15 hover:bg-white/20 rounded-full text-[18px] font-black text-[#F4EBE1] transition-all cursor-pointer"
                >
                  <X className="w-5.5 h-5.5" />
                  <span>退出音乐盒</span>
                </button>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-600 rounded-full text-xs font-black animate-pulse">
                  <span>● 养生复古留声机运行中</span>
                </div>
              </div>

              {/* Player layout */}
              <div className="flex-1 flex gap-6 min-h-0">
                {/* Left Side: Vinyl Record Player */}
                <div className="flex-1 bg-black/40 border border-amber-900/40 rounded-3xl p-6 flex flex-col justify-between items-center shadow-inner relative">
                  {/* Decorative Speaker grille mesh */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.4))] pointer-events-none" />

                  {/* Header Title details */}
                  <div className="text-center shrink-0 z-10">
                    <span className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 rounded">
                      {songs[currentSongIdx].tag}
                    </span>
                    <h3 className="text-[28px] font-black text-[#F4EBE1] mt-2 tracking-wide leading-none">
                      {songs[currentSongIdx].title}
                    </h3>
                    <p className="text-base text-amber-200 mt-1.5 font-bold">
                      演唱：{songs[currentSongIdx].singer}
                    </p>
                  </div>

                  {/* Vinyl Record mockup circle */}
                  <div className="relative my-4 flex items-center justify-center shrink-0">
                    {/* Retro Tonearm styling overlay */}
                    <div 
                      className="absolute top-[-20px] right-[40px] w-24 h-40 origin-top-left transition-transform duration-1000 z-20 pointer-events-none"
                      style={{ 
                        transform: isMusicPlaying ? 'rotate(15deg)' : 'rotate(-10deg)',
                      }}
                    >
                      {/* Drawing a simple metal needle stylus using svg */}
                      <svg width="100" height="160" viewBox="0 0 100 160" fill="none">
                        <path d="M10 10 C 30 10, 40 40, 40 80 L 40 140 L 25 155" stroke="#EBE0C5" strokeWidth="4" strokeLinecap="round" />
                        <circle cx="10" cy="10" r="10" fill="#9C8B64" />
                        <rect x="20" y="145" width="10" height="10" rx="2" fill="#D2B57B" />
                      </svg>
                    </div>

                    {/* Outer shining wooden outer casing ring */}
                    <div className="w-68 h-68 rounded-full bg-stone-900 border-[8px] border-[#3E2516] flex items-center justify-center shadow-2xl relative overflow-hidden">
                      {/* Vinyl spin disc */}
                      <div 
                        className={`w-full h-full rounded-full bg-[repeating-radial-gradient(circle,_#111_0px,_#111_4px,_#1F1F1F_5px,_#111_6px)] flex items-center justify-center relative ${
                          isMusicPlaying ? 'animate-spin' : ''
                        }`}
                        style={{ animationDuration: '8s' }}
                      >
                        {/* Center Cover sticker */}
                        <div className="w-24 h-24 rounded-full border-4 border-stone-950 overflow-hidden bg-amber-100 relative">
                          <img 
                            src={songs[currentSongIdx].cover} 
                            alt="disc" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          {/* Pin-hole center spindle */}
                          <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-white border border-stone-800 shadow" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Media Timeline Slider */}
                  <div className="w-full max-w-lg space-y-2 z-10 shrink-0">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-200">
                      <span>已播放 {Math.floor(musicProgress / 30)}:{String(musicProgress % 30 * 2).padStart(2, '0')}</span>
                      <span>总长 3:20</span>
                    </div>
                    <div className="w-full bg-amber-900/30 border border-amber-900/20 h-3 rounded-full relative overflow-hidden">
                      <div 
                        className="bg-amber-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${musicProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Media controls bar */}
                  <div className="flex items-center gap-6 z-10 shrink-0 mt-2">
                    <button
                      onClick={() => {
                        setCurrentSongIdx((idx) => (idx - 1 + songs.length) % songs.length);
                        setMusicProgress(0);
                      }}
                      className="w-13 h-13 rounded-full bg-[#3E2516] hover:bg-[#51301C] text-[#F4EBE1] flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                    >
                      <ChevronLeft className="w-6.5 h-6.5" />
                    </button>

                    <button
                      onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                      className="w-18 h-18 rounded-full bg-amber-500 hover:bg-amber-600 text-stone-950 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-lg border-4 border-stone-900/60"
                    >
                      {isMusicPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current translate-x-0.5" />}
                    </button>

                    <button
                      onClick={() => {
                        setCurrentSongIdx((idx) => (idx + 1) % songs.length);
                        setMusicProgress(0);
                      }}
                      className="w-13 h-13 rounded-full bg-[#3E2516] hover:bg-[#51301C] text-[#F4EBE1] flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                    >
                      <ChevronRight className="w-6.5 h-6.5" />
                    </button>
                  </div>
                </div>

                {/* Right Side: Lyrics Scrolling & Songs Library */}
                <div className="w-[340px] shrink-0 bg-stone-950/70 border border-amber-900/30 rounded-3xl p-5 flex flex-col justify-between h-full">
                  
                  {/* Playlist selection */}
                  <div className="space-y-3 shrink-0">
                    <span className="text-sm font-black text-amber-400 block border-b border-white/10 pb-2 text-left">
                      🎵 暖心曲库 ({songs.length}首)
                    </span>
                    <div className="space-y-1.5">
                      {songs.map((song, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setCurrentSongIdx(i);
                            setMusicProgress(0);
                            setIsMusicPlaying(true);
                          }}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                            currentSongIdx === i 
                              ? "bg-amber-500/10 border-amber-500 text-amber-300" 
                              : "bg-white/5 border-transparent hover:bg-white/10 text-gray-300"
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="text-[17px] font-black block truncate">{song.title}</span>
                            <span className="text-xs font-bold text-gray-400 block mt-0.5">{song.singer}</span>
                          </div>
                          {currentSongIdx === i && isMusicPlaying && (
                            <Disc className="w-5.5 h-5.5 text-amber-400 animate-spin" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lyrics section */}
                  <div className="flex-1 flex flex-col min-h-0 pt-4.5">
                    <span className="text-xs font-extrabold text-amber-400/60 block text-left mb-2">
                      🎙️ 经典同步大歌词：
                    </span>
                    <div className="flex-1 overflow-y-auto bg-[#1C110A] border border-[#3E2516] rounded-2xl p-4 text-center flex flex-col justify-center space-y-4 custom-scroll">
                      {songs[currentSongIdx].lyrics.slice(0, 5).map((lyric, index) => {
                        // Highlight the middle lines
                        const isCurrent = index === 2;
                        return (
                          <p 
                            key={index} 
                            className={`transition-all duration-300 font-black ${
                              isCurrent 
                                ? 'text-amber-300 text-[20px] scale-105' 
                                : 'text-amber-100/40 text-base font-semibold'
                            }`}
                          >
                            {lyric}
                          </p>
                        );
                      })}
                    </div>
                  </div>

                  {/* Workout/Dance Speed Control Box */}
                  <div className="bg-[#1C110A] border border-amber-900/30 rounded-2xl p-3.5 text-left mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-amber-400 block">💃 晨练拍手伴舞变速</span>
                      <span className="text-[11px] text-gray-400 block mt-0.5">自调伴奏速度，跟节奏晨练更得劲</span>
                    </div>
                    <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                      {(["1.0x", "1.2x", "1.5x"] as const).map((speed) => (
                        <button
                          key={speed}
                          onClick={() => {
                            setDanceSpeed(speed);
                            speakText(`伴奏速度已切换至 ${speed}`);
                          }}
                          className={`px-2.5 py-1 text-xs font-black rounded-md cursor-pointer transition-all ${
                            danceSpeed === speed 
                              ? 'bg-amber-500 text-stone-950 font-black' 
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {speed}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
