import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const FIXED_PORT = 53114;
const portArgumentIndex = process.argv.findIndex(
  argument => argument === '--port' || argument.startsWith('--port='),
);
const requestedPortArgument = portArgumentIndex >= 0
  ? process.argv[portArgumentIndex] === '--port'
    ? process.argv[portArgumentIndex + 1]
    : process.argv[portArgumentIndex].split('=')[1]
  : undefined;

if (requestedPortArgument && Number(requestedPortArgument) !== FIXED_PORT) {
  throw new Error(`老人小程序端固定使用端口 ${FIXED_PORT}，禁止通过命令行改为 ${requestedPortArgument}。`);
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: FIXED_PORT,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: FIXED_PORT,
    strictPort: true,
  },
});
