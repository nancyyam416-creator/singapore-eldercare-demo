/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  FileText, 
  MessageSquare, 
  Check, 
  AlertCircle, 
  Info,
  Loader,
  Brain,
  ChevronRight,
  Smile,
  ArrowRight,
  User
} from 'lucide-react';
import { Medication, HealthStats, ActivityLog, ChatMessage } from '../types';

interface H5AiAdvisorTabProps {
  parentProfile: typeof import('../data/mockData').initialParentProfile;
  healthStats: HealthStats;
  medications: Medication[];
  activities: ActivityLog[];
}

// Custom Markdown-to-HTML formatter to render Gemini output cleanly in React 19 without dependency bloat
const renderMarkdown = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    let cleanLine = line.trim();
    if (!cleanLine) return <div key={idx} className="h-2" />;

    // Headers like ### or ##
    if (cleanLine.startsWith('###') || cleanLine.startsWith('##') || cleanLine.startsWith('#')) {
      const level = cleanLine.match(/^#+/)?.[0].length || 2;
      const headerText = cleanLine.replace(/^#+\s*/, '');
      const bolded = parseBold(headerText);
      return (
        <h5 key={idx} className="font-extrabold text-xs text-slate-800 mt-4 mb-2 flex items-center gap-1">
          <span className="w-1 h-3 rounded bg-blue-600 block shrink-0" />
          {bolded}
        </h5>
      );
    }

    // Bullet points like - or *
    if (cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
      const bulletText = cleanLine.replace(/^[-*]\s*/, '');
      const bolded = parseBold(bulletText);
      return (
        <li key={idx} className="text-3xs text-slate-600 list-disc ml-3.5 my-1.5 leading-relaxed">
          {bolded}
        </li>
      );
    }

    // Number list like 1.
    if (/^\d+\.\s+/.test(cleanLine)) {
      const listText = cleanLine.replace(/^\d+\.\s*/, '');
      const bolded = parseBold(listText);
      const numMatch = cleanLine.match(/^(\d+)\./);
      const num = numMatch ? numMatch[1] : '1';
      return (
        <div key={idx} className="flex gap-1.5 my-2">
          <span className="text-4xs font-extrabold bg-blue-50 text-blue-600 w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            {num}
          </span>
          <p className="text-3xs text-slate-600 leading-relaxed flex-1">{bolded}</p>
        </div>
      );
    }

    // Paragraph
    return (
      <p key={idx} className="text-3xs text-slate-600 leading-relaxed my-1.5">
        {parseBold(cleanLine)}
      </p>
    );
  });
};

// Simple bold parser helper
const parseBold = (text: string) => {
  const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-extrabold text-slate-800 bg-blue-50/50 px-1 rounded">{part}</strong>;
    }
    return part;
  });
};

export const H5AiAdvisorTab: React.FC<H5AiAdvisorTabProps> = ({
  parentProfile,
  healthStats,
  medications,
  activities,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'report' | 'consult'>('report');
  
  // Health Report State
  const [reportText, setReportText] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Consult Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `您好！我是您的智能照护顾问。
我已经读取了您长辈 **${parentProfile.name}**（${parentProfile.age}岁，${parentProfile.conditions}）在中控屏端同步过来的今天实时身体体征、用药打卡和活动轨迹数据。

请问有什么我可以帮您分析和指导的吗？您也可以直接点击下方的问题卡片直接向我提问：`,
      timestamp: new Date().toTimeString().slice(0, 5)
    }
  ]);
  const [userInput, setUserInput] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quick Suggestion Chips
  const promptChips = [
    "长辈漏服降压药，会有严重后果吗？",
    "长辈今天心率有异常波动吗？怎么调理？",
    "老人在洗手间经常滑倒，该怎么防护？",
    "针对他的糖尿病，推荐商城里的什么晚餐？"
  ];

  // 1. Fetch AI Health Report on mount or subtab switch
  const fetchReport = async (force: boolean = false) => {
    if (reportText && !force) return;
    setIsGeneratingReport(true);
    setReportError(null);

    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentProfile,
          healthStats,
          medications,
          activities
        })
      });

      const data = await response.json();
      if (data.success) {
        setReportText(data.text);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.warn('Failed to call server Gemini API. Falling back to high-fidelity simulated report.', err);
      // Fallback premium mock report in case GEMINI_API_KEY is not configured
      setTimeout(() => {
        const takenCount = medications.filter(m => m.status === 'taken').length;
        const totalCount = medications.length;
        const fallbackText = `
### 👨‍⚕️ 长辈健康体征现状分析
今日长辈 **${parentProfile.name}** 体征整体平稳。当前心率 **${healthStats.heartRate}** 次/分，处于正常心率区间。今日睡眠时长为 **${healthStats.sleepHours}** 小时，睡眠质量为【良好】，长辈中午也进行了短时间的卧室午休。今日步行总量为 **${healthStats.steps}** 步，达到了每日运动目标 ${healthStats.stepsTarget} 步的 **${Math.round((healthStats.steps/healthStats.stepsTarget)*100)}%**，运动负荷良好，属于安全中度有氧范围。

### 💊 药物服用依从性报告
今天长辈的用药完成率为 **${takenCount}/${totalCount}**：
1. **上午降压药**（苯磺酸氨氯地平片）于 **08:12** 在中控屏确认完成，服药时效合规。
2. **中午降糖药**（盐酸二甲双胍缓释片）于 **12:45** 随午餐按时服用完成。
3. **下午/晚上阿司匹林肠溶片** 当前为 **【待服用】** 状态。请长辈在晚饭后 19:00 - 20:30 期间配合温水完成吞服。建议您通过H5一键下发服药提示音。

### 🚨 行动轨迹与居家安全建议
中控雷达监测长辈今天在 **【客厅】** 和 **【厨房】** 活动时间较长。
- **洗手间地滑隐患**：长辈位置频繁在卧室、洗手间流转。建议重点关注洗手间地面干燥。
- **饮食热量关怀**：长辈血糖偏高。今天晚餐建议以粗粮和高纤维膳食为主，避免高脂多盐。

### 🛒 推荐子女关怀照护方案
根据张叔叔轻度膝关节退化与糖尿病状况，建议关注：
- **【卫生间防摔扶手安装服务】**（商城热销）：在马桶和淋浴区增设不锈钢防滑把手，能显著减少 70% 的起立跌倒隐患。
- **【专业长辈上门助浴服务】**（安心推荐）：由于老人家关节退化行动不便，助浴服务由双人专业护理员安全洗头擦身体，保障清洁与安全。
`;
        setReportText(fallbackText);
      }, 1000);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'report') {
      fetchReport();
    }
  }, [activeSubTab, healthStats.steps, healthStats.heartRate, medications]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSendingMessage]);

  // 2. Chat Send message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || userInput;
    if (!textToSend.trim() || isSendingMessage) return;

    // Add User Message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toTimeString().slice(0, 5)
    };

    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsSendingMessage(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          parentProfile,
          healthStats,
          medications
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-ai`,
          sender: 'ai',
          text: data.text,
          timestamp: new Date().toTimeString().slice(0, 5)
        }]);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.warn('Failed to call server chat API. Running high-fidelity local specialist agent fallback.', err);
      // Fallback response generator based on questions
      setTimeout(() => {
        let reply = '';
        if (textToSend.includes('降压药') || textToSend.includes('漏服')) {
          reply = `您好！针对长辈漏服 **阿司匹林肠溶片** 的疑问：
          
阿司匹林作为抗血小板药物，主要用于预防心脑血管栓塞，通常要求每日固定时间服用。
          
- **漏服处理建议**：如果长辈在发现漏服时，距离原本计划服药时间（19:00）不超过12小时（即在明早7点前），可以立即按原剂量补服。如果已经接近明天的服药时间，则**切勿双倍剂量服用**，按明天正常时间继续服用一片即可。
- **健康关怀干预**：我已经给长辈中控屏端下发了语音服药提醒。如果您不放心，可以通过商城预订 **【三甲名医远程视频问诊】** 服务，由在线医生为他提供慢性病调药与用药咨询。`;
        } else if (textToSend.includes('心率') || textToSend.includes('体征')) {
          reply = `关于长辈的心率体征监测分析：
          
当前长辈静止心率为 **${healthStats.heartRate}** 次/分，处于 60 - 100 的完美安全范围内。
          
- **之前的心率波动分析**：今日曾在散步活动后录得心率 95 次/分，属于安全正常的生理代偿。
- **健康注意事项**：长辈患有高血压，心率突然飙升至115bpm以上通常暗示情绪激动、饮浓茶、或者体位变动过快（直立性低血压）。
- **建议防护**：商城里的 **【一键式紧急无线SOS呼救呼叫器】** 随身佩戴，一旦感到头晕心慌，老人一键即可直拨子女，强烈建议安装。`;
        } else if (textToSend.includes('滑倒') || textToSend.includes('摔')) {
          reply = `卫生间滑倒防护是居家适老化改造的重中之重！长辈患有轻度膝关节退化，起立与蹲下时膝盖受力很大，极易由于站立不稳滑倒：
          
建议立即进行以下几步防护改造：
1. **安装马桶/淋浴房扶手**：老人家需要手部借力。建议立即订购我们商城的 **【卫生间高强度防摔安全扶手安装】** 服务，专业打孔，单个承受200kg垂直拉力。
2. **铺设浴室防滑胶垫**：洗澡时必须穿防滑拖鞋，铺防滑垫。
3. **增加陪伴**：如果子女工作繁忙，可在洗澡时间订购 **【专业长辈上门助浴服务】**，由两名资深护理员双人协助老人家完成安全舒服的洗澡。`;
        } else {
          reply = `收到您的问题！作为张叔叔的智能照护管家，根据他当前的状况：

- 血压药与血糖药在早、中已经按时服用。
- 晚上阿司匹林正在等待服药提醒。
- 长辈当前定位处于：**【${healthStats.location}】**，心率 ${healthStats.heartRate}bpm，情况一切稳定。

对于您问到的 **"${textToSend}"**。建议多鼓励老人每天多喝温开水，保持大便通畅，避免由于排便用力过大引起血压急剧变化。如果您需要专业的居家看护或生活膳食送餐服务，可随时在商城下订，养老管家会全套帮您安排妥当！`;
        }

        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-ai`,
          sender: 'ai',
          text: reply,
          timestamp: new Date().toTimeString().slice(0, 5)
        }]);
      }, 1200);
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50" id="h5-ai-advisor-tab">
      {/* Mini Toggle Subtabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl mx-4 mb-3 border border-slate-200 shrink-0">
        <button
          onClick={() => setActiveSubTab('report')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-colors flex items-center justify-center gap-1 cursor-pointer ${activeSubTab === 'report' ? 'bg-white text-blue-600 shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileText size={14} />
          今日健康分析简报
        </button>
        <button
          onClick={() => setActiveSubTab('consult')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-colors flex items-center justify-center gap-1 cursor-pointer ${activeSubTab === 'consult' ? 'bg-white text-blue-600 shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <MessageSquare size={14} />
          1对1智能照护咨询
        </button>
      </div>

      {/* ================= SUBTAB 1: HEALTH REPORT ================= */}
      {activeSubTab === 'report' && (
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs p-4 space-y-3 relative overflow-hidden animate-scale-in">
            <div className="absolute top-0 right-0 bg-blue-500/10 text-blue-600 rounded-bl-2xl px-2.5 py-1 text-4xs font-black flex items-center gap-1">
              <Sparkles size={10} className="animate-pulse" />
              Gemini 3.5 AI 实时研判
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <Brain size={16} />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-800">全屋中控数据综合研判</h4>
                <p className="text-5xs text-slate-400 font-extrabold uppercase">已对长辈心率、智能药盒及中控轨迹进行多维融合分析</p>
              </div>
            </div>

            {isGeneratingReport ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader size={24} className="text-blue-600 animate-spin" />
                <p className="text-4xs text-slate-400 font-bold animate-pulse">正在提取中控传感器与智能药盒数据，AI融合研判中...</p>
              </div>
            ) : (
              <div className="prose max-w-none border-t border-slate-50 pt-3">
                {renderMarkdown(reportText)}
                
                <div className="flex gap-1.5 mt-5 pt-3 border-t border-dashed border-slate-100">
                  <button
                    onClick={() => fetchReport(true)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-3xs font-extrabold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Loader size={12} />
                    重新生成
                  </button>
                  <button
                    onClick={() => setActiveSubTab('consult')}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-3xs font-extrabold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-3xs cursor-pointer"
                  >
                    在线咨询AI专家
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SUBTAB 2: AI CONSULT CHAT ================= */}
      {activeSubTab === 'consult' && (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.sender === 'user' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-150 text-blue-600 border-slate-200'}`}>
                  {msg.sender === 'user' ? <User size={14} /> : <Brain size={14} />}
                </div>

                {/* Msg Bubble */}
                <div className={`max-w-[75%] space-y-1`}>
                  <div className={`rounded-2xl p-3 shadow-3xs ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                    <div className="text-3xs whitespace-pre-line leading-relaxed font-semibold">
                      {msg.sender === 'user' ? msg.text : renderMarkdown(msg.text)}
                    </div>
                  </div>
                  <span className={`text-5xs text-slate-400 block ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            
            {isSendingMessage && (
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-blue-600 flex items-center justify-center shrink-0">
                  <Loader size={14} className="animate-spin" />
                </div>
                <div className="bg-slate-50 rounded-2xl rounded-tl-none p-3 shadow-3xs border border-slate-100 max-w-[70%]">
                  <div className="flex items-center gap-1.5 text-3xs text-slate-400 animate-pulse">
                    <span>智能照护顾问正在综合分析体征数据并撰写建议...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick prompt suggestions */}
          <div className="bg-slate-50 border-t border-slate-100 p-2.5 space-y-1.5 shrink-0">
            <span className="text-5xs text-slate-400 font-extrabold px-1 flex items-center gap-1 uppercase tracking-wider">
              <Smile size={10} className="text-blue-600" />
              快捷咨询卡片
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {promptChips.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p)}
                  disabled={isSendingMessage}
                  className="bg-white hover:bg-blue-50/50 border border-slate-200 text-slate-600 hover:text-blue-600 text-4xs py-1.5 px-3 rounded-full whitespace-nowrap shrink-0 transition-colors cursor-pointer font-bold"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Chat input box */}
          <div className="border-t border-slate-100 p-3 bg-white shrink-0">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isSendingMessage}
                placeholder="咨询长辈慢病管理、药物漏服或安防改造..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-600 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!userInput.trim() || isSendingMessage}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white px-3.5 py-2 rounded-xl transition-colors flex items-center justify-center shrink-0 shadow-3xs cursor-pointer"
              >
                <Send size={14} className={isSendingMessage ? 'animate-pulse' : ''} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
