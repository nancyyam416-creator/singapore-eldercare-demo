import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const FIXED_PORT = 53113;
const portArgumentIndex = process.argv.findIndex(
  (argument) => argument === "--port" || argument.startsWith("--port="),
);
const requestedPortArgument = portArgumentIndex >= 0
  ? process.argv[portArgumentIndex] === "--port"
    ? process.argv[portArgumentIndex + 1]
    : process.argv[portArgumentIndex].split("=")[1]
  : undefined;

if (requestedPortArgument && Number(requestedPortArgument) !== FIXED_PORT) {
  throw new Error(`管理后台固定使用端口 ${FIXED_PORT}，禁止通过命令行改为 ${requestedPortArgument}。`);
}

export default defineConfig({
  base: "./",
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    port: FIXED_PORT,
    strictPort: true,
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  preview: {
    host: "0.0.0.0",
    port: FIXED_PORT,
    strictPort: true,
  },
  plugins: [react()],
});
