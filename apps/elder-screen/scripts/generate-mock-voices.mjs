import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const outputDirectory = fileURLToPath(new URL("../public/assets/voice/", import.meta.url));
const temporaryDirectory = fileURLToPath(new URL("../.voice-tmp/", import.meta.url));

const voices = {
  "message-snowman": "爸，这是昨天下雪拍的照片。",
  "message-call-later": "爸，我晚一点再给您打电话。",
  "message-fruit": "冰箱里有切好的水果，记得吃一点。",
  "message-cold": "爸，今天下午有冷空气降温，记得多加一件外套哦。周六我煲了黑鱼汤，带杰杰去看您。",
  "album-card": "小雅画了一张贺卡送给爷爷，祝您每天都开心。",
  "album-piano": "小杰参加学校钢琴比赛了，他说下次要弹给爷爷听。",
  "album-birthday": "这是上个月寿宴的大合影，四世同堂，大家都笑得特别开心。",
  "album-mid-autumn": "去年中秋大家一起赏月，小雅还给爷爷留了一块蛋黄月饼。",
  "album-flower": "阳台上的绣球花开了，颜色和您以前种的一样漂亮。",
  "album-walk": "周末带孩子们去公园散步了，下次我们陪您一起去。",
  "album-mountain": "整理旧照片时看到这张山顶日出，想起您以前常讲的旅行故事。",
  "heart-family": "已告诉家人您喜欢这张照片。",
  "reply-received": "已告诉女儿，我收到了。",
  "weather-care": "女儿，你那里今天有雨，照顾好自己，出门记得带伞，有空给家里回句话。",
  "weather-sent": "已给女儿发送天气关怀。",
  "weather-already": "今天已经给女儿发送过天气关怀了。",
  "contact-switched": "已经切换到这位联系人。",
  "calling-family": "正在呼叫家人，请稍候。",
  "missed-call": "家人可能在忙，要不要给她留个语音。",
  "recording-start": "开始录制语音留言。",
  "recording-sent": "语音留言已经发送。",
  "medication-upcoming": "马上到服药时间了，请查看屏幕上的药品和剂量。",
  "daily-upcoming": "马上有一件日常事项，请查看屏幕上的提醒内容。",
  "medication-complete": "服药已打卡，已通知家人。做得很好，请安心休息。",
  "daily-complete": "事项已经完成并记录。做得很好，请慢慢来，注意安全。",
  "all-complete": "今天的提醒事项已经全部完成，真棒。",
  "reminder-added": "提醒已经添加，到时间我会大声提醒您。",
  "speech-guide": "点一下开始说话，然后说完整一句提醒内容。",
  "activity-registered": "报名成功，活动开始前会提醒您。",
  "service-booked": "预约成功，我们已经记录您的服务需求。",
  "security-reading": "开始为您朗读安全资讯，请注意听。",
  "generic-feedback": "操作已完成。",
};

mkdirSync(outputDirectory, { recursive: true });
mkdirSync(temporaryDirectory, { recursive: true });

for (const [key, text] of Object.entries(voices)) {
  const aiffPath = join(temporaryDirectory, `${key}.aiff`);
  const wavPath = join(outputDirectory, `${key}.wav`);
  execFileSync("/usr/bin/say", ["-v", "Tingting", "-r", "165", "-o", aiffPath, text]);
  execFileSync("/usr/bin/afconvert", ["-f", "WAVE", "-d", "LEI16@22050", aiffPath, wavPath]);
}

if (existsSync(temporaryDirectory)) rmSync(temporaryDirectory, { recursive: true, force: true });
console.log(`Generated ${Object.keys(voices).length} mock voice files.`);
