/// <reference types="vite/client" />

// 部署时通过 VITE_U2G_PORTAL_URL 配置聚合入口，未配置时使用本地入口。
export const U2G_PORTAL_URL = import.meta.env.VITE_U2G_PORTAL_URL?.trim() || 'http://localhost:53110/';
