/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 53111;

app.use(express.json());

// Helper for lazy loading Gemini API safely
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (aiClient) return aiClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error('GEMINI_API_KEY is not configured in environment variables or Secrets panel.');
  }

  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return aiClient;
}

// 1. Health Report Analysis Endpoint using Gemini
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { parentProfile, healthStats, medications, activities } = req.body;

    const client = getGeminiClient();

    const prompt = `
你是一位专业的智能化养老与老年健康照护专家。请根据以下从“智能家居中控屏”同步的长辈实时健康、用药及活动数据，为他的子女写一份简明扼要、富有温情、实用性强的“长辈24小时健康照护与分析简报”。

【长辈基本信息】
- 称呼/性别：${parentProfile?.name || '老人家'} / ${parentProfile?.gender || '保密'}
- 年龄：${parentProfile?.age || '75'}岁
- 既往慢性病：${parentProfile?.conditions || '高血压、轻度糖尿病'}

【今日实时体征数据】
- 心率：${healthStats?.heartRate} 次/分 (当前状态：${healthStats?.heartRateStatus === 'normal' ? '正常' : '异常波动'})
- 今日步数：${healthStats?.steps} / 目标 ${healthStats?.stepsTarget} 步
- 睡眠时长：${healthStats?.sleepHours} 小时 (睡眠质量：${healthStats?.sleepQuality})
- 智能定位：当前处于【${healthStats?.location}】

【今日服药合规率】
${JSON.stringify(medications, null, 2)}

【中控屏最近行动记录】
${JSON.stringify(activities?.slice(-10), null, 2)}

请结合以上客观数据生成分析（语言为中文，使用Markdown格式）：
1. **健康现状速览**（总结心率、睡眠、运动量，判断今日体征状态）
2. **用药依从性评估**（指出有哪些药漏服/迟服，或者是否全部按时完成，并给出温馨关怀建议）
3. **安全与行动照护建议**（结合定位、活动记录等，提示子女需要注意的安全防范，如洗手间防滑、深夜起身等）
4. **智能推荐服务**（若有异常或照护需求，可智能引导子女商城购买相关护理服务如：专业助浴、医生在线问诊、防摔扶手安装等，说明推荐原因）

请保持语气温暖、体贴、专业，控制在300字左右。
`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error('Gemini Analyze API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取AI分析报告失败，请检查GEMINI_API_KEY配置。'
    });
  }
});

// 2. Chat with AI Consultant Endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, parentProfile, healthStats, medications } = req.body;

    const client = getGeminiClient();

    // Prepare conversation history
    const geminiContents = [];

    // System context to inject
    const systemInstruction = `
你叫“孝心通 - 智能照护管家”，是一位专业的长辈健康照护专家及老年慢性病管理顾问。
你正在帮助长辈的子女，解答关于其父母健康状况、服药指南、日常生活关怀、及老年安全防护等问题。

【当前照护长辈基本信息】
- 称呼：${parentProfile?.name || '长辈'}
- 年龄：${parentProfile?.age || '75'}
- 状况：${parentProfile?.conditions || '高血压、轻度糖尿病'}
- 实时体征：心率 ${healthStats?.heartRate}次/分，今日步数 ${healthStats?.steps}步，当前位置：${healthStats?.location}
- 用药合规：${JSON.stringify(medications)}

【规则】
1. 始终使用热情温暖、极其体贴且专业的语气回答。
2. 结合上方长辈的实时数据来给出针对性的、接地气的建议（例如：如果老人当前在洗手间，或者漏服了药物，可适度提醒子女）。
3. 推荐切实可行的照护手段，并在适当时候建议商城里的服务（如：送餐、助浴、医生门诊、防滑改造等），但千万不要有推销感，而是作为关怀和支持建议。
4. 解答要条理清晰，使用Markdown排版。
`;

    // Map conversation logs
    const historyParts = messages.map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // Generate response
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: historyParts,
      config: {
        systemInstruction,
      }
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error('Gemini Chat API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI管家暂时无法回答，请检查GEMINI_API_KEY配置。'
    });
  }
});

// Vite & Static assets configuration
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[端口占用] 子女手机端固定使用 ${PORT}，请先释放该端口，不允许自动切换端口。`);
    } else {
      console.error('Failed to start child mobile server:', error);
    }
    process.exit(1);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
