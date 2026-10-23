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
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
var import_meta = {};
import_dotenv.default.config();
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var app = (0, import_express.default)();
var PORT = 53111;
app.use(import_express.default.json());
var aiClient = null;
function getGeminiClient() {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is not configured in environment variables or Secrets panel.");
  }
  aiClient = new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  return aiClient;
}
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { parentProfile, healthStats, medications, activities } = req.body;
    const client = getGeminiClient();
    const prompt = `
\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u667A\u80FD\u5316\u517B\u8001\u4E0E\u8001\u5E74\u5065\u5EB7\u7167\u62A4\u4E13\u5BB6\u3002\u8BF7\u6839\u636E\u4EE5\u4E0B\u4ECE\u201C\u667A\u80FD\u5BB6\u5C45\u4E2D\u63A7\u5C4F\u201D\u540C\u6B65\u7684\u957F\u8F88\u5B9E\u65F6\u5065\u5EB7\u3001\u7528\u836F\u53CA\u6D3B\u52A8\u6570\u636E\uFF0C\u4E3A\u4ED6\u7684\u5B50\u5973\u5199\u4E00\u4EFD\u7B80\u660E\u627C\u8981\u3001\u5BCC\u6709\u6E29\u60C5\u3001\u5B9E\u7528\u6027\u5F3A\u7684\u201C\u957F\u8F8824\u5C0F\u65F6\u5065\u5EB7\u7167\u62A4\u4E0E\u5206\u6790\u7B80\u62A5\u201D\u3002

\u3010\u957F\u8F88\u57FA\u672C\u4FE1\u606F\u3011
- \u79F0\u547C/\u6027\u522B\uFF1A${parentProfile?.name || "\u8001\u4EBA\u5BB6"} / ${parentProfile?.gender || "\u4FDD\u5BC6"}
- \u5E74\u9F84\uFF1A${parentProfile?.age || "75"}\u5C81
- \u65E2\u5F80\u6162\u6027\u75C5\uFF1A${parentProfile?.conditions || "\u9AD8\u8840\u538B\u3001\u8F7B\u5EA6\u7CD6\u5C3F\u75C5"}

\u3010\u4ECA\u65E5\u5B9E\u65F6\u4F53\u5F81\u6570\u636E\u3011
- \u5FC3\u7387\uFF1A${healthStats?.heartRate} \u6B21/\u5206 (\u5F53\u524D\u72B6\u6001\uFF1A${healthStats?.heartRateStatus === "normal" ? "\u6B63\u5E38" : "\u5F02\u5E38\u6CE2\u52A8"})
- \u4ECA\u65E5\u6B65\u6570\uFF1A${healthStats?.steps} / \u76EE\u6807 ${healthStats?.stepsTarget} \u6B65
- \u7761\u7720\u65F6\u957F\uFF1A${healthStats?.sleepHours} \u5C0F\u65F6 (\u7761\u7720\u8D28\u91CF\uFF1A${healthStats?.sleepQuality})
- \u667A\u80FD\u5B9A\u4F4D\uFF1A\u5F53\u524D\u5904\u4E8E\u3010${healthStats?.location}\u3011

\u3010\u4ECA\u65E5\u670D\u836F\u5408\u89C4\u7387\u3011
${JSON.stringify(medications, null, 2)}

\u3010\u4E2D\u63A7\u5C4F\u6700\u8FD1\u884C\u52A8\u8BB0\u5F55\u3011
${JSON.stringify(activities?.slice(-10), null, 2)}

\u8BF7\u7ED3\u5408\u4EE5\u4E0A\u5BA2\u89C2\u6570\u636E\u751F\u6210\u5206\u6790\uFF08\u8BED\u8A00\u4E3A\u4E2D\u6587\uFF0C\u4F7F\u7528Markdown\u683C\u5F0F\uFF09\uFF1A
1. **\u5065\u5EB7\u73B0\u72B6\u901F\u89C8**\uFF08\u603B\u7ED3\u5FC3\u7387\u3001\u7761\u7720\u3001\u8FD0\u52A8\u91CF\uFF0C\u5224\u65AD\u4ECA\u65E5\u4F53\u5F81\u72B6\u6001\uFF09
2. **\u7528\u836F\u4F9D\u4ECE\u6027\u8BC4\u4F30**\uFF08\u6307\u51FA\u6709\u54EA\u4E9B\u836F\u6F0F\u670D/\u8FDF\u670D\uFF0C\u6216\u8005\u662F\u5426\u5168\u90E8\u6309\u65F6\u5B8C\u6210\uFF0C\u5E76\u7ED9\u51FA\u6E29\u99A8\u5173\u6000\u5EFA\u8BAE\uFF09
3. **\u5B89\u5168\u4E0E\u884C\u52A8\u7167\u62A4\u5EFA\u8BAE**\uFF08\u7ED3\u5408\u5B9A\u4F4D\u3001\u6D3B\u52A8\u8BB0\u5F55\u7B49\uFF0C\u63D0\u793A\u5B50\u5973\u9700\u8981\u6CE8\u610F\u7684\u5B89\u5168\u9632\u8303\uFF0C\u5982\u6D17\u624B\u95F4\u9632\u6ED1\u3001\u6DF1\u591C\u8D77\u8EAB\u7B49\uFF09
4. **\u667A\u80FD\u63A8\u8350\u670D\u52A1**\uFF08\u82E5\u6709\u5F02\u5E38\u6216\u7167\u62A4\u9700\u6C42\uFF0C\u53EF\u667A\u80FD\u5F15\u5BFC\u5B50\u5973\u5546\u57CE\u8D2D\u4E70\u76F8\u5173\u62A4\u7406\u670D\u52A1\u5982\uFF1A\u4E13\u4E1A\u52A9\u6D74\u3001\u533B\u751F\u5728\u7EBF\u95EE\u8BCA\u3001\u9632\u6454\u6276\u624B\u5B89\u88C5\u7B49\uFF0C\u8BF4\u660E\u63A8\u8350\u539F\u56E0\uFF09

\u8BF7\u4FDD\u6301\u8BED\u6C14\u6E29\u6696\u3001\u4F53\u8D34\u3001\u4E13\u4E1A\uFF0C\u63A7\u5236\u5728300\u5B57\u5DE6\u53F3\u3002
`;
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });
    res.json({ success: true, text: response.text });
  } catch (error) {
    console.error("Gemini Analyze API Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "\u83B7\u53D6AI\u5206\u6790\u62A5\u544A\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5GEMINI_API_KEY\u914D\u7F6E\u3002"
    });
  }
});
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages, parentProfile, healthStats, medications } = req.body;
    const client = getGeminiClient();
    const geminiContents = [];
    const systemInstruction = `
\u4F60\u53EB\u201C\u5B5D\u5FC3\u901A - \u667A\u80FD\u7167\u62A4\u7BA1\u5BB6\u201D\uFF0C\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u957F\u8F88\u5065\u5EB7\u7167\u62A4\u4E13\u5BB6\u53CA\u8001\u5E74\u6162\u6027\u75C5\u7BA1\u7406\u987E\u95EE\u3002
\u4F60\u6B63\u5728\u5E2E\u52A9\u957F\u8F88\u7684\u5B50\u5973\uFF0C\u89E3\u7B54\u5173\u4E8E\u5176\u7236\u6BCD\u5065\u5EB7\u72B6\u51B5\u3001\u670D\u836F\u6307\u5357\u3001\u65E5\u5E38\u751F\u6D3B\u5173\u6000\u3001\u53CA\u8001\u5E74\u5B89\u5168\u9632\u62A4\u7B49\u95EE\u9898\u3002

\u3010\u5F53\u524D\u7167\u62A4\u957F\u8F88\u57FA\u672C\u4FE1\u606F\u3011
- \u79F0\u547C\uFF1A${parentProfile?.name || "\u957F\u8F88"}
- \u5E74\u9F84\uFF1A${parentProfile?.age || "75"}
- \u72B6\u51B5\uFF1A${parentProfile?.conditions || "\u9AD8\u8840\u538B\u3001\u8F7B\u5EA6\u7CD6\u5C3F\u75C5"}
- \u5B9E\u65F6\u4F53\u5F81\uFF1A\u5FC3\u7387 ${healthStats?.heartRate}\u6B21/\u5206\uFF0C\u4ECA\u65E5\u6B65\u6570 ${healthStats?.steps}\u6B65\uFF0C\u5F53\u524D\u4F4D\u7F6E\uFF1A${healthStats?.location}
- \u7528\u836F\u5408\u89C4\uFF1A${JSON.stringify(medications)}

\u3010\u89C4\u5219\u3011
1. \u59CB\u7EC8\u4F7F\u7528\u70ED\u60C5\u6E29\u6696\u3001\u6781\u5176\u4F53\u8D34\u4E14\u4E13\u4E1A\u7684\u8BED\u6C14\u56DE\u7B54\u3002
2. \u7ED3\u5408\u4E0A\u65B9\u957F\u8F88\u7684\u5B9E\u65F6\u6570\u636E\u6765\u7ED9\u51FA\u9488\u5BF9\u6027\u7684\u3001\u63A5\u5730\u6C14\u7684\u5EFA\u8BAE\uFF08\u4F8B\u5982\uFF1A\u5982\u679C\u8001\u4EBA\u5F53\u524D\u5728\u6D17\u624B\u95F4\uFF0C\u6216\u8005\u6F0F\u670D\u4E86\u836F\u7269\uFF0C\u53EF\u9002\u5EA6\u63D0\u9192\u5B50\u5973\uFF09\u3002
3. \u63A8\u8350\u5207\u5B9E\u53EF\u884C\u7684\u7167\u62A4\u624B\u6BB5\uFF0C\u5E76\u5728\u9002\u5F53\u65F6\u5019\u5EFA\u8BAE\u5546\u57CE\u91CC\u7684\u670D\u52A1\uFF08\u5982\uFF1A\u9001\u9910\u3001\u52A9\u6D74\u3001\u533B\u751F\u95E8\u8BCA\u3001\u9632\u6ED1\u6539\u9020\u7B49\uFF09\uFF0C\u4F46\u5343\u4E07\u4E0D\u8981\u6709\u63A8\u9500\u611F\uFF0C\u800C\u662F\u4F5C\u4E3A\u5173\u6000\u548C\u652F\u6301\u5EFA\u8BAE\u3002
4. \u89E3\u7B54\u8981\u6761\u7406\u6E05\u6670\uFF0C\u4F7F\u7528Markdown\u6392\u7248\u3002
`;
    const historyParts = messages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: historyParts,
      config: {
        systemInstruction
      }
    });
    res.json({ success: true, text: response.text });
  } catch (error) {
    console.error("Gemini Chat API Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "AI\u7BA1\u5BB6\u6682\u65F6\u65E0\u6CD5\u56DE\u7B54\uFF0C\u8BF7\u68C0\u67E5GEMINI_API_KEY\u914D\u7F6E\u3002"
    });
  }
});
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false
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
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`[\u7AEF\u53E3\u5360\u7528] \u5B50\u5973\u624B\u673A\u7AEF\u56FA\u5B9A\u4F7F\u7528 ${PORT}\uFF0C\u8BF7\u5148\u91CA\u653E\u8BE5\u7AEF\u53E3\uFF0C\u4E0D\u5141\u8BB8\u81EA\u52A8\u5207\u6362\u7AEF\u53E3\u3002`);
    } else {
      console.error("Failed to start child mobile server:", error);
    }
    process.exit(1);
  });
}
setupServer().catch((err) => {
  console.error("Failed to start server:", err);
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
