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

const categoryName = new Map(catalog.categories.map((item) => [item.code, item.name]));

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

export const unifiedServiceIdAliases = Object.fromEntries(unifiedServiceCatalog.flatMap((service) => (
  (service.legacyServiceIds || []).map((legacyId) => [legacyId, service.id])
)));
export const resolveUnifiedServiceId = (serviceId) => unifiedServiceIdAliases[serviceId] || serviceId;
export const getUnifiedServiceById = (serviceId) => unifiedServiceCatalog.find((service) => service.id === resolveUnifiedServiceId(serviceId));

export const unifiedServiceCategories = catalog.categories;
export const unifiedCommunities = catalog.communities;
export const unifiedElderProfiles = catalog.elderProfiles;
export const unifiedCommunityById = Object.fromEntries(catalog.communities.map((community) => [community.id, community]));
export const unifiedCommunityIdByProjectId = Object.fromEntries(catalog.communities.map((community) => [community.projectId, community.id]));
export const getUnifiedCommunityName = (communityId) => unifiedCommunityById[communityId]?.name || "社区未设置";
