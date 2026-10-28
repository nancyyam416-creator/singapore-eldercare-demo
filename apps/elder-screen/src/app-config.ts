const DEFAULT_U2G_PORTAL_URL = "http://localhost:53110/";

export const U2G_PORTAL_URL = import.meta.env.VITE_U2G_PORTAL_URL?.trim()
  || DEFAULT_U2G_PORTAL_URL;
