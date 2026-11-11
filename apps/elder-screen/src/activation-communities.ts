import serviceCatalog from "../../产品理解/90 原型与Mock素材/mock/统一服务目录.json";

export interface ActivationCommunityOption {
  id: string;
  projectId: string;
  name: string;
  address: string;
}

export const activationCommunityOptions: ActivationCommunityOption[] = serviceCatalog.communities
  .filter((community) => community.id && community.projectId && community.name)
  .map((community) => ({
    id: community.id,
    projectId: community.projectId,
    name: community.name,
    address: community.address,
  }));

export const getActivationCommunityById = (communityId?: string | null) => (
  activationCommunityOptions.find((community) => community.id === communityId)
);
