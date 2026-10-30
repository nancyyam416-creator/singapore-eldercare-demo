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
  "srv-electric-1": { coverImage: serviceLightingImage, detailImages: [serviceLightingDetailImage] },
  "srv-electric-2": { coverImage: serviceCircuitImage, detailImages: [serviceCircuitDetailImage] },
  "srv-water-1": { coverImage: serviceFaucetImage, detailImages: [serviceFaucetDetailImage] },
  "srv-water-2": { coverImage: servicePipeImage, detailImages: [servicePipeDetailImage] },
  "srv-basic-1": { coverImage: serviceLockImage, detailImages: [serviceLockDetailImage] },
  "srv-basic-2": { coverImage: serviceFurnitureImage, detailImages: [serviceFurnitureDetailImage] },
};

const categoryName = new Map(catalog.categories.map((item) => [item.code, item.name]));

export const unifiedServiceCatalog = catalog.services.map((service) => ({
  ...service,
  categoryCode: service.category,
  category: categoryName.get(service.category),
  precautions: service.precautions.join("\n"),
  ...serviceImages[service.id],
}));

export const unifiedServiceCategories = catalog.categories;
export const unifiedCommunities = catalog.communities;
export const unifiedElderProfiles = catalog.elderProfiles;
export const unifiedCommunityById = Object.fromEntries(catalog.communities.map((community) => [community.id, community]));
export const unifiedCommunityIdByProjectId = Object.fromEntries(catalog.communities.map((community) => [community.projectId, community.id]));
export const getUnifiedCommunityName = (communityId) => unifiedCommunityById[communityId]?.name || "社区未设置";
