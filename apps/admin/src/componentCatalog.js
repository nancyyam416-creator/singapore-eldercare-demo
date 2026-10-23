export const componentCategories = ["全部", "基础控件", "表单", "数据展示", "反馈", "导航", "Overlay"];

export const componentCatalog = [
  {
    id: "admin-drawer", name: "AdminDrawer", category: "Overlay", status: "stable", assetType: "public-component",
    maturity: "已稳定", scenarios: "新增、编辑、详情与长表单侧边层",
    rules: ["标题默认无副标题", "Header / Footer 固定", "Body 独立滚动", "Esc、遮罩和焦点管理统一"],
    support: ["标题", "Footer actions", "自定义宽度", "滚动锁定"],
    source: "src/AdminOverlay.jsx", spec: "《后台通用组件规范.md》#Drawer",
    migrated: ["社区人员", "休闲娱乐"], pending: ["老人档案", "提醒事项", "设备管理", "项目与社区", "内容与服务模块"],
  },
  {
    id: "admin-modal", name: "AdminModal", category: "Overlay", status: "pending", assetType: "public-style",
    maturity: "待沉淀", scenarios: "资源选择、参加意向、设备绑定等大型居中弹层",
    rules: ["代码库已有 modal-layer 公共样式", "尚未抽成 AdminModal 公共组件", "不得标记为已完成"],
    support: ["遮罩", "居中容器", "现有业务 Modal"], source: "src/styles.css (.modal-layer)", spec: "《后台通用组件规范.md》#Modal-与-Confirm",
    migrated: [], pending: ["推荐资源选择", "老人选择", "活动参加意向", "平板绑定"],
  },
  {
    id: "admin-confirm", name: "AdminConfirm", category: "Overlay", status: "migrating", assetType: "public-component",
    maturity: "迁移中", scenarios: "停用、删除、下架、撤回、作废、解绑、解除关系、取消",
    rules: ["标题只写动作和对象", "支持多条影响与补充提示", "提交期间防重复并禁止关闭", "失败后保留弹窗和错误"],
    support: ["default / warning / danger", "loading", "error", "Promise", "焦点环"], source: "src/AdminOverlay.jsx", spec: "《后台通用组件规范.md》#Modal-与-Confirm",
    migrated: ["用户停用", "角色删除", "提醒删除", "传感器解绑", "娱乐入口停用/删除"], pending: ["App.jsx 其余 9 处旧确认弹窗"],
  },
  {
    id: "single-image-upload", name: "SingleImageUpload", category: "表单", status: "stable", assetType: "public-component",
    maturity: "已稳定", scenarios: "单张图标、封面或人员照片上传",
    rules: ["未上传时整体可点击/拖拽", "已上传使用固定 1:1 预览", "错误位固定不跳动", "文件限制由业务层传入"],
    support: ["点击上传", "拖拽", "预览", "替换", "删除", "错误"], source: "src/SingleImageUpload.jsx", spec: "《后台通用组件规范.md》#单图上传",
    migrated: ["休闲娱乐"], pending: ["社区人员照片", "社区活动封面"],
  },
  {
    id: "form-layout", name: "表单字段 / 分组布局", category: "表单", status: "stable", assetType: "public-style",
    maturity: "已稳定", scenarios: "抽屉与页面内的结构化表单", rules: ["form-section 分组", "form-row 仅用于相关短字段", "间距使用 --admin-* tokens"],
    support: ["单列", "双列", "必填", "错误", "帮助文本"], source: "src/styles.css (.form-section / .form-row)", spec: "《后台通用组件规范.md》#表单", migrated: ["后台通用表单"], pending: ["个别业务自定义字段间距"],
  },
  {
    id: "filter-bar", name: "搜索筛选区", category: "表单", status: "stable", assetType: "public-style",
    maturity: "已稳定", scenarios: "管理列表关键字、状态和分类筛选", rules: ["容器使用 filters", "操作区使用 filter-actions", "查询 primary，重置 secondary"],
    support: ["搜索", "select", "日期", "查询/重置"], source: "src/styles.css (.filters / .filter-actions)", spec: "《后台通用组件规范.md》#表格搜索区与分页", migrated: ["多数管理列表"], pending: ["少量局部搜索区样式对齐"],
  },
  {
    id: "table-status", name: "表格及状态标签", category: "数据展示", status: "migrating", assetType: "public-style",
    maturity: "迁移中", scenarios: "宽表扫读、粘性操作列与业务状态", rules: ["表格放入 table-scroll", "操作列使用 sticky-right", "状态颜色按语义映射"],
    support: ["水平滚动", "粘性操作列", "success / warning / danger / neutral"], source: "src/styles.css (table / .status-tag)", spec: "《后台通用组件规范.md》#按钮状态标签与空状态", migrated: ["多数管理列表"], pending: ["抽取 AdminStatusTag", "清理各文件局部 StatusTag"],
  },
  {
    id: "empty-state", name: "空状态", category: "反馈", status: "pending", assetType: "public-style",
    maturity: "待沉淀", scenarios: "列表无数据、筛选无结果和模块无配置", rules: ["代码库已有多类空状态样式", "需说明原因与下一步", "尚未抽成 AdminEmptyState"],
    support: ["empty-state", "empty-table-state", "业务局部空状态"], source: "src/styles.css (*empty-state)", spec: "《后台通用组件规范.md》#按钮状态标签与空状态", migrated: [], pending: ["抽取 AdminEmptyState", "统一文案层级和间距"],
  },
  {
    id: "pagination", name: "分页", category: "导航", status: "pending", assetType: "public-style",
    maturity: "待沉淀", scenarios: "管理列表结果摘要、每页条数和页码切换", rules: ["已有 pagination 公共样式", "不制造可点击假页码", "尚未抽成 AdminPagination"],
    support: ["数量摘要", "每页条数", "页码外观"], source: "src/styles.css (.pagination)", spec: "《后台通用组件规范.md》#表格搜索区与分页", migrated: [], pending: ["抽取 AdminPagination", "对接真实分页数据"],
  },
  {
    id: "button-hierarchy", name: "按钮层级", category: "基础控件", status: "stable", assetType: "public-style",
    maturity: "已稳定", scenarios: "页面主操作、次操作、危险操作和表格行操作", rules: ["同一区域只保留一个主操作", "危险操作必须文字明确", "不用颜色代替语义"],
    support: ["primary", "secondary", "danger", "danger-outline", "table-action"], source: "src/styles.css (*-button / .table-action)", spec: "《后台通用组件规范.md》#按钮状态标签与空状态", migrated: ["后台全局"], pending: ["少量业务自定义按钮语义清理"],
  },
];

export const componentStatusMeta = {
  stable: { label: "已稳定", tone: "success" },
  migrating: { label: "迁移中", tone: "warning" },
  pending: { label: "待处理", tone: "neutral" },
};

export const componentAssetTypeMeta = {
  "public-component": "已抽成公共组件",
  "public-style": "已有公共样式",
};
