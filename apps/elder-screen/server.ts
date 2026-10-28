import express from "express";
import { createServer as createHttpServer } from "node:http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createHttpServer(app);
const PORT = 53112;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined. Using mock simulator modes.");
    } else {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// API endpoint for chatbot companion
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const client = getAiClient();
  if (!client) {
    // If API key is missing, provide a friendly simulated AI response for smooth local/preview review
    const mockResponses = [
      "您好！我是您的智能生活助理小U。今天感觉怎么样？别忘了按时喝些温开水，保持身体水分哦。",
      "早上好！我已经为您核对过今天的健康日程，今天上午10点在社区活动中心有太极健身课，记得去舒展筋骨呀。",
      "好的，小U收到啦。我会一直守候在您的中控屏上，有任何疑问或需要，随时点击屏幕或大声叫我。",
      "今天外面的阳光非常柔和，空气指数也很好。如果身体感觉舒适，去小区的绿色连廊散散步，晒晒太阳对骨骼很有好处呢。",
      "药箱里的用药计划我都帮您记着呢。下午1点钟的时候，记得服用那一颗保护心脏的药物哦，温水送服最安心。"
    ];
    const randomIndex = Math.floor(Math.random() * mockResponses.length);
    return res.json({ text: mockResponses[randomIndex] });
  }

  try {
    const systemInstruction = 
      "You are '小U' (Little U), a smart, extremely friendly, and highly compassionate home care companion for elderly users on the U2G Smart Home Platform. " +
      "You interact directly with an elder user through a wall-mounted tablet or central screen. " +
      "Speak in clear, polite, warm, and highly comforting Chinese (简体中文). Keep your answers warm, supportive, and extremely easy to understand (usually 2-3 sentences max) with simple, elder-friendly vocabulary. " +
      "When asked about pills, health guidelines, weather, or basic chatting, always show profound care, patience, and warmth.";

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Gemini server-side call failed: " + error.message });
  }
});

// Configure Vite middleware or static files
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: { server: httpServer },
        hmr: { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`U2G Full-stack Server running at http://0.0.0.0:${PORT}`);
  });

  httpServer.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`[端口占用] 老人中控屏固定使用 ${PORT}，请先释放该端口，不允许自动切换端口。`);
    } else {
      console.error("Failed to start elderly control screen server:", error);
    }
    process.exit(1);
  });
}

start();
