import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const FIXED_PORT = 53112;
const portArgumentIndex = process.argv.findIndex(
  (argument) => argument === '--port' || argument.startsWith('--port='),
);
const requestedPortArgument = portArgumentIndex >= 0
  ? process.argv[portArgumentIndex] === '--port'
    ? process.argv[portArgumentIndex + 1]
    : process.argv[portArgumentIndex].split('=')[1]
  : undefined;

if (requestedPortArgument && Number(requestedPortArgument) !== FIXED_PORT) {
  throw new Error(`老人中控屏固定使用端口 ${FIXED_PORT}，禁止通过命令行改为 ${requestedPortArgument}。`);
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: FIXED_PORT,
      strictPort: true,
      // The Express middleware preview must not open Vite's default HMR port.
      hmr: false,
      ws: false as const,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      host: '0.0.0.0',
      port: FIXED_PORT,
      strictPort: true,
    },
  };
});
