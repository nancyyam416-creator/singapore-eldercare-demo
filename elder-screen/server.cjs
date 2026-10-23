var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_node_http = require("node:http");
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var httpServer = (0, import_node_http.createServer)(app);
var PORT = 53112;
app.use(import_express.default.json());
var apiKey = process.env.GEMINI_API_KEY;
var aiClient = null;
function getAiClient() {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined. Using mock simulator modes.");
    } else {
      aiClient = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
  }
  return aiClient;
}
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }
  const client = getAiClient();
  if (!client) {
    const mockResponses = [
      "\u60A8\u597D\uFF01\u6211\u662F\u60A8\u7684\u667A\u80FD\u751F\u6D3B\u52A9\u7406\u5C0FU\u3002\u4ECA\u5929\u611F\u89C9\u600E\u4E48\u6837\uFF1F\u522B\u5FD8\u4E86\u6309\u65F6\u559D\u4E9B\u6E29\u5F00\u6C34\uFF0C\u4FDD\u6301\u8EAB\u4F53\u6C34\u5206\u54E6\u3002",
      "\u65E9\u4E0A\u597D\uFF01\u6211\u5DF2\u7ECF\u4E3A\u60A8\u6838\u5BF9\u8FC7\u4ECA\u5929\u7684\u5065\u5EB7\u65E5\u7A0B\uFF0C\u4ECA\u5929\u4E0A\u534810\u70B9\u5728\u793E\u533A\u6D3B\u52A8\u4E2D\u5FC3\u6709\u592A\u6781\u5065\u8EAB\u8BFE\uFF0C\u8BB0\u5F97\u53BB\u8212\u5C55\u7B4B\u9AA8\u5440\u3002",
      "\u597D\u7684\uFF0C\u5C0FU\u6536\u5230\u5566\u3002\u6211\u4F1A\u4E00\u76F4\u5B88\u5019\u5728\u60A8\u7684\u4E2D\u63A7\u5C4F\u4E0A\uFF0C\u6709\u4EFB\u4F55\u7591\u95EE\u6216\u9700\u8981\uFF0C\u968F\u65F6\u70B9\u51FB\u5C4F\u5E55\u6216\u5927\u58F0\u53EB\u6211\u3002",
      "\u4ECA\u5929\u5916\u9762\u7684\u9633\u5149\u975E\u5E38\u67D4\u548C\uFF0C\u7A7A\u6C14\u6307\u6570\u4E5F\u5F88\u597D\u3002\u5982\u679C\u8EAB\u4F53\u611F\u89C9\u8212\u9002\uFF0C\u53BB\u5C0F\u533A\u7684\u7EFF\u8272\u8FDE\u5ECA\u6563\u6563\u6B65\uFF0C\u6652\u6652\u592A\u9633\u5BF9\u9AA8\u9ABC\u5F88\u6709\u597D\u5904\u5462\u3002",
      "\u836F\u7BB1\u91CC\u7684\u7528\u836F\u8BA1\u5212\u6211\u90FD\u5E2E\u60A8\u8BB0\u7740\u5462\u3002\u4E0B\u53481\u70B9\u949F\u7684\u65F6\u5019\uFF0C\u8BB0\u5F97\u670D\u7528\u90A3\u4E00\u9897\u4FDD\u62A4\u5FC3\u810F\u7684\u836F\u7269\u54E6\uFF0C\u6E29\u6C34\u9001\u670D\u6700\u5B89\u5FC3\u3002"
    ];
    const randomIndex = Math.floor(Math.random() * mockResponses.length);
    return res.json({ text: mockResponses[randomIndex] });
  }
  try {
    const systemInstruction = "You are '\u5C0FU' (Little U), a smart, extremely friendly, and highly compassionate home care companion for elderly users on the U2G Smart Home Platform. You interact directly with an elder user through a wall-mounted tablet or central screen. Speak in clear, polite, warm, and highly comforting Chinese (\u7B80\u4F53\u4E2D\u6587). Keep your answers warm, supportive, and extremely easy to understand (usually 2-3 sentences max) with simple, elder-friendly vocabulary. When asked about pills, health guidelines, weather, or basic chatting, always show profound care, patience, and warmth.";
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Gemini server-side call failed: " + error.message });
  }
});
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: {
        middlewareMode: { server: httpServer },
        hmr: { server: httpServer }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`U2G Full-stack Server running at http://0.0.0.0:${PORT}`);
  });
  httpServer.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`[\u7AEF\u53E3\u5360\u7528] \u8001\u4EBA\u4E2D\u63A7\u5C4F\u56FA\u5B9A\u4F7F\u7528 ${PORT}\uFF0C\u8BF7\u5148\u91CA\u653E\u8BE5\u7AEF\u53E3\uFF0C\u4E0D\u5141\u8BB8\u81EA\u52A8\u5207\u6362\u7AEF\u53E3\u3002`);
    } else {
      console.error("Failed to start elderly control screen server:", error);
    }
    process.exit(1);
  });
}
start();
//# sourceMappingURL=server.cjs.map
