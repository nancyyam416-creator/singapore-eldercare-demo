const localEntries = {
  admin: "http://localhost:53113/?acceptance",
  elderScreen: "http://localhost:53112/",
  elderMobile: "http://localhost:53114/",
  familyMobile: "http://localhost:53111/",
};

function configuredUrl(envName, fallback) {
  const value = import.meta.env[envName]?.trim();
  return value || fallback;
}

export const experienceEntries = [
  {
    id: "admin",
    order: "01",
    name: "管理后台",
    role: "平台管理员、社区运营人员",
    purpose: "统一管理老人档案、服务内容、平板设备与运营任务。",
    shape: "desktop",
    tone: "blue",
    url: configuredUrl("VITE_ADMIN_URL", localEntries.admin),
  },
  {
    id: "elder-screen",
    order: "02",
    name: "老人中控屏",
    role: "居家长者",
    purpose: "通过大屏查看提醒、联系家人、获取社区服务与日常关怀。",
    shape: "screen",
    tone: "green",
    url: configuredUrl("VITE_ELDER_SCREEN_URL", localEntries.elderScreen),
  },
  {
    id: "elder-mobile",
    order: "03",
    name: "老人移动端",
    role: "外出或移动场景下的长者",
    purpose: "在移动场景中快速使用常用服务、联系与个人信息功能。",
    shape: "phone",
    tone: "amber",
    url: configuredUrl("VITE_ELDER_MOBILE_URL", localEntries.elderMobile),
  },
  {
    id: "family-mobile",
    order: "04",
    name: "子女移动端",
    role: "长者子女与家庭成员",
    purpose: "远程了解长辈状态、保持家庭沟通并协同处理关怀事项。",
    shape: "phone",
    tone: "coral",
    url: configuredUrl("VITE_FAMILY_MOBILE_URL", localEntries.familyMobile),
  },
];
