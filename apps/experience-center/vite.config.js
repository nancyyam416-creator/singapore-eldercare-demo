import { defineConfig } from "vite";

const fixedPort = 53110;

export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE_PATH || "/",
  server: {
    host: "0.0.0.0",
    port: fixedPort,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: fixedPort,
    strictPort: true,
  },
  plugins: [{
    name: "enforce-experience-hub-port",
    configResolved(config) {
      const configuredPort = command === "serve" ? config.server.port : config.preview.port;
      if (configuredPort !== fixedPort) throw new Error(`四端体验中心固定使用 ${fixedPort} 端口`);
    },
  }],
}));
