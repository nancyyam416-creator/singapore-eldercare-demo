const DEFAULT_U2G_PORTAL_URL = (import.meta.env.DEV ? 'http://localhost:53110/' : '/singapore-eldercare-demo/');

export const U2G_PORTAL_URL = import.meta.env.VITE_U2G_PORTAL_URL?.trim() || DEFAULT_U2G_PORTAL_URL;
export const ACCEPTANCE_WORKBENCH_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_ACCEPTANCE_WORKBENCH === 'true';
