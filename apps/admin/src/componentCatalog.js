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
    id: "detail-drawer-layout", name: "详情抽屉内容布局", category: "Overlay", status: "stable", assetType: "public-style",
    maturity: "已稳定", scenarios: "版本、设备、任务与配置等只读详情抽屉",
    rules: ["摘要区只突出一个核心对象与状态", "属性网格按宽度使用两至三列", "说明信息只使用一块浅底承载区", "关联记录使用紧凑表格", "Footer 由 AdminDrawer 固定，不随正文滚动", "禁止渐变、插画和多层装饰卡片"],
    support: ["摘要卡", "属性网格", "浅底说明", "紧凑表格", "固定 Footer"], source: "src/styles.css (.admin-detail-*)", spec: "《后台通用组件规范.md》#详情抽屉内容布局",
    migrated: ["平板 OTA 升级"], pending: ["其他详情型抽屉"],
  },
  {
    id: "admin-modal", name: "AdminModal", category: "Overlay", status: "stable", assetType: "public-component",
    maturity: "已稳定", scenarios: "资源选择、参加意向、设备绑定等居中弹层",
    rules: ["Header、Body、Footer 分区固定", "标题左对齐，关闭按钮固定右上", "Body 默认 24px 内边距", "Footer 操作右对齐"],
    support: ["标题", "关闭按钮", "Body", "Footer actions", "焦点管理"], source: "src/AdminOverlay.jsx", spec: "《后台通用组件规范.md》#Modal-与-Confirm",
    migrated: ["重置密码结果"], pending: ["推荐资源选择", "老人选择", "活动参加意向", "平板绑定"],
  },
  {
    id: "compact-result-modal", name: "紧凑型结果弹窗", category: "Overlay", status: "stable", assetType: "public-style",
    maturity: "已稳定", scenarios: "临时密码、生成结果、一次性凭证等短结果展示",
    rules: ["弹窗宽度 440px", "Body 使用 24px 内边距", "结果值在左、复制按钮在右", "提示文字与结果框间距 12px", "Footer 只保留一个右对齐主按钮"],
    support: ["只读结果值", "复制操作", "辅助提示", "唯一主按钮"], source: "src/styles.css (.admin-result-*)", spec: "《后台通用组件规范.md》#紧凑型结果弹窗",
    migrated: ["平台用户重置密码", "社区用户重置密码"], pending: ["其他一次性结果场景"],
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
    id: "table-status", name: "标准数据表格", category: "数据展示", status: "stable", assetType: "public-style",
    maturity: "已稳定", scenarios: "平台端与社区端的业务列表、宽表和只读记录",
    rules: ["默认密度以社区人员列表为基准", "表头 50px、数据行 76px、单元格横向 18px", "主副文本间距 4px且垂直居中", "表格放入 table-scroll，操作列使用 sticky-right", "只有抽屉小表格使用 compact 变体"],
    support: ["普通文本", "主副文本", "头像信息", "状态标签", "纯文字操作", "空状态", "Footer / 分页", "compact"], source: "src/styles.css (--admin-table-* / .admin-compact-table)", spec: "《后台通用组件规范.md》#标准数据表格", migrated: ["管理后台全部业务表格"], pending: ["抽取 AdminStatusTag", "清理各文件局部 StatusTag"],
  },
  {
    id: "permission-matrix", name: "PermissionMatrix", category: "数据展示", status: "stable", assetType: "public-component",
    maturity: "已稳定", scenarios: "角色逐菜单配置查看、新增、编辑、删除、导出等操作权限",
    rules: ["单列纵向排列，分组标题位于卡片外", "每个菜单使用标题行、分隔线和操作行组成的通栏卡片", "只渲染菜单真实支持的操作", "禁止全部菜单权限总控条", "内置角色、只读和权限不足状态不允许修改"],
    support: ["单列菜单卡片", "菜单分组", "菜单全选 / 半选", "真实操作项", "内部滚动", "固定保存区", "只读 / 禁用", "内置角色保护", "权限不足"], source: "src/PermissionMatrix.jsx", spec: "《后台通用组件规范.md》#权限矩阵",
    migrated: ["后台组件中心", "平台角色管理", "社区角色管理"], pending: ["其他新增角色授权页面"],
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
    maturity: "已稳定", scenarios: "页面主操作、次操作、危险操作和表格行操作", rules: ["同一区域只保留一个主操作", "危险操作必须文字明确", "表格同一操作列只使用纯文字", "普通操作主色、危险操作危险色，点击区域和 disabled 状态统一"],
    support: ["primary", "secondary", "danger", "danger-outline", "table-action", "table-action danger", "disabled"], source: "src/styles.css (*-button / .table-action)", spec: "《后台通用组件规范.md》#按钮状态标签与空状态", migrated: ["后台全局", "用户管理操作列"], pending: ["少量业务自定义按钮语义清理"],
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
