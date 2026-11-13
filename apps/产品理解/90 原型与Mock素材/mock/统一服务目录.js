import serviceLightingImage from "./assets/services/service-lighting.svg";
import serviceCircuitImage from "./assets/services/service-circuit.svg";
import serviceFaucetImage from "./assets/services/service-faucet.svg";
import servicePipeImage from "./assets/services/service-pipe.svg";
import serviceLockImage from "./assets/services/service-lock.svg";
import serviceFurnitureImage from "./assets/services/service-furniture.svg";
import serviceLightingDetailImage from "./assets/services/service-lighting-detail.svg";
import serviceCircuitDetailImage from "./assets/services/service-circuit-detail.svg";
import serviceFaucetDetailImage from "./assets/services/service-faucet-detail.svg";
import servicePipeDetailImage from "./assets/services/service-pipe-detail.svg";
import serviceLockDetailImage from "./assets/services/service-lock-detail.svg";
import serviceFurnitureDetailImage from "./assets/services/service-furniture-detail.svg";
import catalog from "./统一服务目录.json";

const serviceImages = {
  "srv-electric-1": { coverImage: serviceLightingImage, detailImages: [serviceLightingDetailImage, serviceCircuitDetailImage] },
  "srv-electric-2": { coverImage: serviceCircuitImage, detailImages: [serviceCircuitDetailImage] },
  "srv-water-1": { coverImage: serviceFaucetImage, detailImages: [serviceFaucetDetailImage, servicePipeDetailImage] },
  "srv-water-2": { coverImage: servicePipeImage, detailImages: [servicePipeDetailImage] },
  "srv-basic-1": { coverImage: serviceLockImage, detailImages: [serviceLockDetailImage] },
  "srv-basic-2": { coverImage: serviceFurnitureImage, detailImages: [serviceFurnitureDetailImage] },
};

const normalizeCategory = (category, index) => ({
  ...category,
  id: category.id || `SC-${String(category.code || index + 1).toUpperCase()}`,
  code: category.code || `category-${index + 1}`,
  description: category.description || "",
  displayOrder: Number(category.displayOrder ?? category.order ?? index + 1),
  status: category.status === "disabled" || category.status === "已停用" ? "disabled" : "enabled",
  updatedAt: category.updatedAt || catalog.categorySettings?.updatedAt || "",
});

export const unifiedServiceCategorySettings = {
  enabled: Boolean(catalog.categorySettings?.enabled),
  updatedAt: catalog.categorySettings?.updatedAt || "",
};

export const unifiedServiceCategories = catalog.categories.map(normalizeCategory)
  .sort((a, b) => a.displayOrder - b.displayOrder || a.code.localeCompare(b.code));

const categoryName = new Map(unifiedServiceCategories.map((item) => [item.code, item.name]));

const normalizeServiceItems = (service) => {
  if (Array.isArray(service.serviceItems) && service.serviceItems.length) {
    return service.serviceItems.map((item, index) => ({
      id: item.id || `${service.id}-item-${index + 1}`,
      legacyServiceId: item.legacyServiceId || "",
      name: item.name || `服务内容 ${index + 1}`,
      content: item.content || "",
      priceText: item.priceText || "",
    }));
  }
  return [{
    id: `${service.id}-item-1`,
    legacyServiceId: service.id,
    name: service.name,
    content: service.serviceContent || "",
    priceText: service.priceRange || "",
  }];
};

export const unifiedServiceCatalog = catalog.services.map((service) => {
  const serviceItems = normalizeServiceItems(service);
  const categoryCode = service.categoryId || service.category || "";
  return {
    ...service,
    legacyServiceIds: service.legacyServiceIds || [],
    status: service.status === "disabled" ? "disabled" : "enabled",
    displayOrder: Number(service.displayOrder || 999),
    categoryId: categoryCode || null,
    categoryCode,
    category: categoryCode ? categoryName.get(categoryCode) || "" : "",
    serviceItems,
    serviceContent: serviceItems.map((item) => item.content).filter(Boolean).join("\n"),
    priceRange: [...new Set(serviceItems.map((item) => item.priceText).filter(Boolean))].join(" / "),
    precautions: Array.isArray(service.precautions) ? service.precautions.join("\n") : service.precautions || "",
    ...serviceImages[service.id],
  };
}).sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));

const isServiceAvailableInCommunity = (service, communityId) => {
  if (service.status !== "enabled") return false;
  if (!communityId || service.coverageMode === "all") return true;
  return Array.isArray(service.coverageCommunityIds) && service.coverageCommunityIds.includes(communityId);
};

export const resolveUnifiedServiceDirectory = ({
  communityId = "",
  settings = unifiedServiceCategorySettings,
  categories = unifiedServiceCategories,
  services = unifiedServiceCatalog,
} = {}) => {
  const availableServices = services
    .filter((service) => isServiceAvailableInCommunity(service, communityId))
    .slice()
    .sort((a, b) => Number(a.displayOrder || 999) - Number(b.displayOrder || 999) || a.name.localeCompare(b.name));
  const categoryEnabled = Boolean(settings?.enabled);
  if (!categoryEnabled) return { categoryEnabled, categories: [], groups: [], services: availableServices };
  const enabledCategories = categories
    .filter((category) => category.status === "enabled")
    .slice()
    .sort((a, b) => Number(a.displayOrder || 999) - Number(b.displayOrder || 999) || a.name.localeCompare(b.name));
  const groups = enabledCategories
    .map((category) => ({ ...category, services: availableServices.filter((service) => service.categoryId === category.code || service.categoryCode === category.code) }))
    .filter((category) => category.services.length > 0);
  return { categoryEnabled, categories: groups.map(({ services: _services, ...category }) => category), groups, services: groups.flatMap((group) => group.services) };
};

export const unifiedServiceDirectoryRuntimeStorageKey = "u2g-unified-service-directory-runtime-v1";
export const unifiedServiceDirectoryBridgeMessage = "u2g-unified-service-directory-runtime";

export const defaultUnifiedServiceDirectoryContract = {
  version: catalog.version,
  categorySettings: unifiedServiceCategorySettings,
  categories: unifiedServiceCategories,
  services: unifiedServiceCatalog,
};

const normalizeRuntimeContract = (contract = {}) => ({
  version: contract.version || catalog.version,
  categorySettings: { ...unifiedServiceCategorySettings, ...(contract.categorySettings || {}) },
  categories: (Array.isArray(contract.categories) ? contract.categories : unifiedServiceCategories).map(normalizeCategory),
  services: (Array.isArray(contract.services) ? contract.services : unifiedServiceCatalog).map((service) => {
    const serviceItems = normalizeServiceItems(service);
    const categoryCode = service.categoryId || service.categoryCode || service.category || "";
    return {
      ...service,
      categoryId: categoryCode || null,
      categoryCode,
      category: categoryCode ? categoryName.get(categoryCode) || service.categoryName || service.category || "" : "",
      status: service.status === "disabled" || service.status === "停用" ? "disabled" : "enabled",
      displayOrder: Number(service.displayOrder || 999),
      serviceItems,
    };
  }),
});

export const readUnifiedServiceDirectoryRuntime = () => {
  if (typeof window === "undefined") return defaultUnifiedServiceDirectoryContract;
  try {
    const saved = window.localStorage.getItem(unifiedServiceDirectoryRuntimeStorageKey);
    return saved ? normalizeRuntimeContract(JSON.parse(saved)) : defaultUnifiedServiceDirectoryContract;
  } catch {
    return defaultUnifiedServiceDirectoryContract;
  }
};

export const writeUnifiedServiceDirectoryRuntime = (contract) => {
  const normalized = normalizeRuntimeContract(contract);
  if (typeof window === "undefined") return normalized;
  window.localStorage.setItem(unifiedServiceDirectoryRuntimeStorageKey, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(unifiedServiceDirectoryBridgeMessage, { detail: normalized }));
  return normalized;
};

const isLocalPreviewHost = () => typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const defaultBridgeUrl = () => isLocalPreviewHost() ? `${window.location.protocol}//${window.location.hostname}:53113/service-directory-bridge.html` : "";

export const subscribeUnifiedServiceDirectoryRuntime = (callback, { bridgeUrl = defaultBridgeUrl() } = {}) => {
  if (typeof window === "undefined" || typeof callback !== "function") return () => {};
  const bridgeOrigin = bridgeUrl ? new URL(bridgeUrl, window.location.href).origin : "";
  let lastPayload = "";
  const emit = (contract) => {
    const normalized = normalizeRuntimeContract(contract);
    const payload = JSON.stringify(normalized);
    if (payload === lastPayload) return;
    lastPayload = payload;
    callback(normalized);
  };
  const onStorage = (event) => {
    if (event.key !== unifiedServiceDirectoryRuntimeStorageKey || !event.newValue) return;
    try { emit(JSON.parse(event.newValue)); } catch { /* ignore invalid external payload */ }
  };
  const onCustomEvent = (event) => emit(event.detail);
  const onMessage = (event) => {
    if (event.data?.type !== unifiedServiceDirectoryBridgeMessage || !event.data.contract || (bridgeOrigin && event.origin !== bridgeOrigin)) return;
    emit(event.data.contract);
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(unifiedServiceDirectoryBridgeMessage, onCustomEvent);
  window.addEventListener("message", onMessage);
  emit(readUnifiedServiceDirectoryRuntime());
  let bridge = null;
  if (bridgeUrl && bridgeOrigin !== window.location.origin) {
    bridge = document.createElement("iframe");
    bridge.hidden = true;
    bridge.setAttribute("aria-hidden", "true");
    bridge.src = bridgeUrl;
    bridge.addEventListener("load", () => bridge?.contentWindow?.postMessage({ type: `${unifiedServiceDirectoryBridgeMessage}:read` }, bridgeOrigin));
    document.body.appendChild(bridge);
  }
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(unifiedServiceDirectoryBridgeMessage, onCustomEvent);
    window.removeEventListener("message", onMessage);
    bridge?.remove();
  };
};

export const unifiedServiceIdAliases = Object.fromEntries(unifiedServiceCatalog.flatMap((service) => (
  (service.legacyServiceIds || []).map((legacyId) => [legacyId, service.id])
)));
export const resolveUnifiedServiceId = (serviceId) => unifiedServiceIdAliases[serviceId] || serviceId;
export const getUnifiedServiceById = (serviceId) => unifiedServiceCatalog.find((service) => service.id === resolveUnifiedServiceId(serviceId));

export const unifiedCommunities = catalog.communities;
export const unifiedElderProfiles = catalog.elderProfiles;
export const unifiedCommunityById = Object.fromEntries(catalog.communities.map((community) => [community.id, community]));
export const unifiedCommunityIdByProjectId = Object.fromEntries(catalog.communities.map((community) => [community.projectId, community.id]));
export const getUnifiedCommunityName = (communityId) => unifiedCommunityById[communityId]?.name || "社区未设置";
