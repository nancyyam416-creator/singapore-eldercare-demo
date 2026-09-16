export type MockVoiceKey =
  | "message-snowman"
  | "message-call-later"
  | "message-fruit"
  | "message-cold"
  | "album-card"
  | "album-piano"
  | "album-birthday"
  | "album-mid-autumn"
  | "album-flower"
  | "album-walk"
  | "album-mountain"
  | "heart-family"
  | "reply-received"
  | "contact-switched"
  | "calling-family"
  | "missed-call"
  | "recording-start"
  | "recording-sent"
  | "medication-upcoming"
  | "daily-upcoming"
  | "medication-complete"
  | "daily-complete"
  | "all-complete"
  | "reminder-added"
  | "speech-guide"
  | "service-booked"
  | "security-reading"
  | "generic-feedback";

interface SpeakTextOptions {
  fallbackKey?: MockVoiceKey;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

const normalize = (content: string) => content.replace(/[\s“”‘’！!，,。.?？、：:；;]/g, "");

const exactVoiceMap = new Map<string, MockVoiceKey>([
  [normalize("爸，这是昨天下雪拍的照片"), "message-snowman"],
  [normalize("爸，我晚一点再给您打电话。"), "message-call-later"],
  [normalize("冰箱里有切好的水果，记得吃一点。"), "message-fruit"],
  [normalize("爸，今天下午有冷空气降温，记得多加一件外套哦。周六我煲了黑鱼汤带杰杰去看您！"), "message-cold"],
  [normalize("小雅画了一张贺卡送给爷爷，祝您每天都开心！"), "album-card"],
  [normalize("小杰参加学校钢琴比赛了，他说下次要弹给爷爷听。"), "album-piano"],
  [normalize("这是上个月寿宴的大合影，四世同堂，大家都笑得特别开心。"), "album-birthday"],
  [normalize("去年中秋大家一起赏月，小雅还给爷爷留了一块蛋黄月饼。"), "album-mid-autumn"],
  [normalize("阳台上的绣球花开了，颜色和您以前种的一样漂亮。"), "album-flower"],
  [normalize("周末带孩子们去公园散步了，下次我们陪您一起去。"), "album-walk"],
  [normalize("整理旧照片时看到这张山顶日出，想起您以前常讲的旅行故事。"), "album-mountain"],
]);

const resolveVoiceKey = (content: string): MockVoiceKey => {
  const normalized = normalize(content);
  const exact = exactVoiceMap.get(normalized);
  if (exact) return exact;
  if (normalized.startsWith("已切换到")) return "contact-switched";
  if (normalized.startsWith("正在呼叫")) return "calling-family";
  if (normalized.includes("可能在忙")) return "missed-call";
  if (normalized.includes("开始给") && normalized.includes("录制")) return "recording-start";
  if (normalized.includes("语音已发送") || normalized.includes("语音留言已经发送")) return "recording-sent";
  if (normalized.includes("已告诉") && normalized.includes("我收到了")) return "reply-received";
  if (normalized.includes("喜欢这")) return "heart-family";
  if (normalized.includes("用药提醒") || normalized.includes("服药时间")) return "medication-upcoming";
  if (normalized.includes("日常提醒") || normalized.includes("日常事项")) return "daily-upcoming";
  if (normalized.includes("服药已打卡") || normalized.includes("用药已完成")) return "medication-complete";
  if (normalized.includes("事项已确认") || normalized.includes("事项已经完成")) return "daily-complete";
  if (normalized.includes("全部完成")) return "all-complete";
  if (normalized.includes("提醒已经添加")) return "reminder-added";
  if (normalized.includes("开始说话") || normalized.includes("用说话添加提醒")) return "speech-guide";
  if (normalized.includes("预约成功")) return "service-booked";
  if (normalized.includes("安全资讯") || normalized.includes("诈骗")) return "security-reading";
  return "generic-feedback";
};

export const stopSpeech = () => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  activeUtterance = null;
};

export const pauseSpeech = () => {
  if (activeAudio && !activeAudio.paused) {
    activeAudio.pause();
    return;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.pause();
  }
};

export const resumeSpeech = () => {
  if (activeAudio?.paused) {
    void activeAudio.play();
    return;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.resume();
  }
};

export const speakText = (content: string, options: SpeakTextOptions = {}) => {
  if (typeof window === "undefined") return { mode: "none" as const, stop: stopSpeech };
  stopSpeech();

  const speechEngine = (window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
  const Utterance = (window as Window & { SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance }).SpeechSynthesisUtterance;
  if (speechEngine && Utterance) {
    const utterance = new Utterance(content);
    utterance.lang = "zh-CN";
    utterance.rate = options.rate ?? 0.86;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;
    utterance.onstart = () => options.onStart?.();
    utterance.onend = () => {
      if (activeUtterance === utterance) activeUtterance = null;
      options.onEnd?.();
    };
    utterance.onerror = () => {
      if (activeUtterance === utterance) activeUtterance = null;
      playFallback(content, options);
    };
    activeUtterance = utterance;
    speechEngine.speak(utterance);
    return { mode: "tts" as const, stop: stopSpeech };
  }

  return playFallback(content, options);
};

const playFallback = (content: string, options: SpeakTextOptions) => {
  const voiceKey = options.fallbackKey ?? resolveVoiceKey(content);
  const audio = new Audio(`./assets/voice/${voiceKey}.wav`);
  audio.preload = "auto";
  audio.volume = options.volume ?? 1;
  audio.onplay = () => options.onStart?.();
  audio.onended = () => {
    if (activeAudio === audio) activeAudio = null;
    options.onEnd?.();
  };
  audio.onerror = () => {
    if (activeAudio === audio) activeAudio = null;
    options.onError?.();
  };
  activeAudio = audio;
  void audio.play().catch(() => {
    if (activeAudio === audio) activeAudio = null;
    options.onError?.();
  });
  return { mode: "audio" as const, stop: stopSpeech };
};
