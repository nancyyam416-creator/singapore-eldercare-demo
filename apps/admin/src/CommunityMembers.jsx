import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, RefreshCw, Search, UserRound, X } from "lucide-react";
import { AdminConfirm } from "./AdminOverlay";

export const communityMembersStorageKey = "u2g-users-v2";
export const roleStorageKey = "u2g-roles-v1";

const communityRole = (projectId, suffix, name, description, isAdmin = false) => ({
  id: `ROLE-${projectId}-${suffix}`, projectId, level: "社区", name, description, status: "已启用", isAdmin, isBuiltIn: true,
  menuPermissions: isAdmin ? ["运营概览", "老人档案", "亲属档案", "紧急协助", "服务沟通", "推荐策略", "预约服务", "社区公告", "生活资讯", "警惕事项", "社区活动", "社区人员", "设备管理", "房间活动", "用户管理", "角色管理"] : ["运营概览", "老人档案", "服务沟通", "推荐策略", "预约服务", "社区公告", "生活资讯", "社区活动"],
  operationPermissions: isAdmin ? ["查看", "新增", "编辑", "启停"] : ["查看", "新增", "编辑"], dataScope: "当前社区", projectIds: [projectId],
});

export const createCommunityRoles = (projectId) => [
  communityRole(projectId, "ADMIN", "社区管理员", "管理当前社区用户及全部日常运营能力。", true),
  communityRole(projectId, "OPS", "社区运营员", "负责当前社区老人、内容、服务与设备的日常运营。"),
];

export const initialRoles = [
  { id: "ROLE-PLATFORM-ADMIN", projectId: "", level: "平台", name: "平台管理员", description: "维护平台项目、公共能力、用户与角色。", status: "已启用", isAdmin: true, isBuiltIn: true, menuPermissions: ["平台总览", "项目与社区", "用户管理", "角色管理", "关怀话术", "休闲娱乐", "操作日志"], operationPermissions: ["查看", "新增", "编辑", "启停"], dataScope: "全平台", projectIds: [] },
  { id: "ROLE-PLATFORM-OPS", projectId: "", level: "平台", name: "平台运营员", description: "维护平台公共内容和日常运营配置。", status: "已启用", isAdmin: false, isBuiltIn: false, menuPermissions: ["平台总览", "项目与社区", "关怀话术", "休闲娱乐"], operationPermissions: ["查看", "新增", "编辑"], dataScope: "全平台", projectIds: [] },
  ...["PRJ-001", "PRJ-002", "PRJ-003", "PRJ-004"].flatMap(createCommunityRoles),
];

export const initialCommunityMembers = [
  { id: "USR-001", projectId: "", name: "赵亚男", username: "platform.admin", phone: "+65 9000 1001", email: "platform.admin@u2g.sg", roleId: "ROLE-PLATFORM-ADMIN", status: "已启用", lastLogin: "今天 10:26" },
  { id: "USR-002", projectId: "", name: "平台运营", username: "platform.ops", phone: "+65 9000 1002", email: "platform.ops@u2g.sg", roleId: "ROLE-PLATFORM-OPS", status: "已启用", lastLogin: "今天 09:40" },
  { id: "USR-003", projectId: "PRJ-001", name: "王淑芬", username: "hongshan.admin", phone: "+65 6123 8801", email: "wang.shufen@u2g.sg", roleId: "ROLE-PRJ-001-ADMIN", status: "已启用", lastLogin: "今天 09:18" },
  { id: "USR-004", projectId: "PRJ-001", name: "赵亚男", username: "hongshan.ops", phone: "+65 9123 6208", email: "zhao.yanan@u2g.sg", roleId: "ROLE-PRJ-001-OPS", status: "已启用", lastLogin: "今天 10:26" },
  { id: "USR-005", projectId: "PRJ-002", name: "陈志伟", username: "toa.admin", phone: "+65 6258 1902", email: "chen.zhiwei@u2g.sg", roleId: "ROLE-PRJ-002-ADMIN", status: "已启用", lastLogin: "昨天 17:42" },
  { id: "USR-006", projectId: "PRJ-002", name: "林慧仪", username: "toa.ops", phone: "+65 9018 3321", email: "lin.huiyi@u2g.sg", roleId: "ROLE-PRJ-002-OPS", status: "已启用", lastLogin: "2026-10-20 14:05" },
  { id: "USR-007", projectId: "PRJ-003", name: "林美芳", username: "queenstown.admin", phone: "+65 6472 3306", email: "lin.meifang@u2g.sg", roleId: "ROLE-PRJ-003-ADMIN", status: "已启用", lastLogin: "今天 08:36" },
  { id: "USR-008", projectId: "PRJ-003", name: "周文杰", username: "queenstown.ops", phone: "+65 8890 7136", email: "", roleId: "ROLE-PRJ-003-OPS", status: "已停用", lastLogin: "2026-10-12 11:20" },
  { id: "USR-009", projectId: "PRJ-004", name: "黄国民", username: "amk.admin", phone: "+65 6456 9208", email: "huang.guomin@u2g.sg", roleId: "ROLE-PRJ-004-ADMIN", status: "已启用", lastLogin: "昨天 09:52" },
  { id: "USR-010", projectId: "PRJ-004", name: "李慧敏", username: "amk.ops", phone: "+65 8227 1645", email: "li.huimin@u2g.sg", roleId: "ROLE-PRJ-004-OPS", status: "已启用", lastLogin: "2026-10-21 16:10" },
];

export function readCommunityMembers() { try { const saved = JSON.parse(window.localStorage.getItem(communityMembersStorageKey) || "null"); return Array.isArray(saved) ? saved : initialCommunityMembers; } catch { return initialCommunityMembers; } }
export function readRoles() { try { const saved = JSON.parse(window.localStorage.getItem(roleStorageKey) || "null"); return (Array.isArray(saved) ? saved : initialRoles).map((role) => ({ ...role, menuPermissions: role.id === "ROLE-PLATFORM-ADMIN" ? [...platformMenus] : role.menuPermissions.filter((menu) => menu !== "基础配置"), operationPermissions: role.id === "ROLE-PLATFORM-ADMIN" ? [...operations] : role.operationPermissions, ...(role.id === "ROLE-PLATFORM-ADMIN" ? { isAdmin: true, isBuiltIn: true, status: "已启用" } : {}), ...(role.id === "ROLE-PLATFORM-OPS" ? { isAdmin: false, isBuiltIn: false } : {}), ...(!role.projectId ? { dataScope: "全平台", projectIds: [] } : {}) })); } catch { return initialRoles; } }

function StatusTag({ children }) { return <span className={`status-tag ${children === "已启用" ? "success" : "neutral"}`}>{children}</span>; }
const getRole = (roles, id) => roles.find((role) => role.id === id);
const getScopeName = (user, projects) => user.projectId ? projects.find((project) => project.id === user.projectId)?.name || "社区已移除" : "全平台";

function UserDrawer({ user, scopeMode, fixedAdminRole = false, currentProject, projects, roles, allUsers, onClose, onSave }) {
  const fixedProjectId = scopeMode === "platform" ? "" : currentProject.id;
  const initialProjectId = fixedProjectId ?? user?.projectId ?? "";
  const availableRoles = roles.filter((role) => role.status === "已启用" && role.projectId === initialProjectId);
  const fixedAdminRoleId = fixedAdminRole ? roles.find((role) => role.projectId === initialProjectId && role.isAdmin)?.id || "" : "";
  const [form, setForm] = useState({ name: user?.name || "", username: user?.username || "", phone: user?.phone || "+65 ", email: user?.email || "", projectId: initialProjectId, roleId: fixedAdminRoleId || user?.roleId || availableRoles[0]?.id || "", status: user?.status || "已启用" });
  const [errors, setErrors] = useState({});
  const roleOptions = roles.filter((role) => role.status === "已启用" && role.projectId === form.projectId);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const changeProject = (projectId) => { const firstRole = roles.find((role) => role.status === "已启用" && role.projectId === projectId); setForm((current) => ({ ...current, projectId, roleId: firstRole?.id || "" })); };
  const submit = () => {
    const nextErrors = {}; const username = form.username.trim();
    if (!form.name.trim()) nextErrors.name = "请输入姓名";
    if (!username) nextErrors.username = "请输入账号名"; else if (allUsers.some((item) => item.id !== user?.id && item.username.toLowerCase() === username.toLowerCase())) nextErrors.username = "该账号名已存在，请更换";
    if (!/^\+65\s?\d{8}$/.test(form.phone.trim())) nextErrors.phone = "请输入 +65 开头的 8 位手机号";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = "请输入正确的邮箱地址";
    if (!form.roleId) nextErrors.roleId = "请选择关联角色";
    const previousRole = getRole(roles, user?.roleId); const otherEnabledAdmins = allUsers.filter((item) => item.id !== user?.id && item.projectId === user?.projectId && item.status === "已启用" && getRole(roles, item.roleId)?.isAdmin);
    if (previousRole?.isAdmin && user?.status === "已启用" && !otherEnabledAdmins.length && (form.status !== "已启用" || !getRole(roles, form.roleId)?.isAdmin || form.projectId !== user.projectId)) nextErrors.roleId = "该范围至少需要保留一位已启用管理员";
    setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    onSave({ ...user, ...form, name: form.name.trim(), username, phone: form.phone.trim(), email: form.email.trim() });
  };
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer member-drawer" role="dialog" aria-modal="true" aria-label={user ? "编辑用户" : "新增用户"}><header><h2>{user ? "编辑用户" : "新增用户"}</h2><button className="icon-button" aria-label="关闭" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="form-section"><h3>账号资料</h3><div className="form-row"><label><span>姓名 *</span><input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="请输入姓名"/>{errors.name && <small className="field-error">{errors.name}</small>}</label><label><span>账号名 *</span><input value={form.username} onChange={(event) => update("username", event.target.value)} placeholder="请输入登录账号"/>{errors.username && <small className="field-error">{errors.username}</small>}</label></div><div className="form-row"><label><span>手机号 *</span><input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+65 9123 4567"/>{errors.phone && <small className="field-error">{errors.phone}</small>}</label><label><span>邮箱（选填）</span><input value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="name@example.com"/>{errors.email && <small className="field-error">{errors.email}</small>}</label></div>{!fixedAdminRole && <><h3>关联角色</h3><label><span>关联角色 *</span><select className="select-control form-select-native" value={form.roleId} onChange={(event) => update("roleId", event.target.value)}>{roleOptions.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>{errors.roleId && <small className="field-error">{errors.roleId}</small>}</label></>}<label><span>账号状态 *</span><select className="select-control form-select-native" value={form.status} onChange={(event) => update("status", event.target.value)}><option>已启用</option><option>已停用</option></select></label></div></div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={submit}>保存用户</button></footer></aside></div>;
}

export function UserManagementPage({ scopeMode, fixedAdminRole = false, embedded = false, currentProject, projects, roles, users, onBack, onSave, onToggle }) {
  const [query, setQuery] = useState(""); const [projectId, setProjectId] = useState(scopeMode === "community" ? currentProject.id : "全部范围"); const [roleId, setRoleId] = useState("全部角色"); const [status, setStatus] = useState("全部状态"); const [editing, setEditing] = useState(undefined); const [toggleTarget, setToggleTarget] = useState(null);
  useEffect(() => { if (scopeMode === "community") { setProjectId(currentProject.id); setRoleId("全部角色"); } }, [currentProject?.id, scopeMode]);
  const scopedUsers = users.filter((user) => (scopeMode === "platform" || user.projectId === currentProject.id) && (!fixedAdminRole || getRole(roles, user.roleId)?.isAdmin));
  const roleOptions = roles.filter((role) => scopeMode === "platform" ? (projectId === "全部范围" || role.projectId === projectId) : role.projectId === currentProject.id);
  const filtered = scopedUsers.filter((user) => `${user.name}${user.username}${user.phone}${user.email}`.toLowerCase().includes(query.trim().toLowerCase()) && (projectId === "全部范围" || user.projectId === projectId) && (roleId === "全部角色" || user.roleId === roleId) && (status === "全部状态" || user.status === status));
  const isProtected = (user) => getRole(roles, user.roleId)?.isAdmin && user.status === "已启用" && scopedUsers.filter((item) => item.projectId === user.projectId && item.status === "已启用" && getRole(roles, item.roleId)?.isAdmin).length === 1;
  const requestToggle = (user) => user.status === "已停用" ? onToggle(user.id) : !isProtected(user) && setToggleTarget(user);
  return <>{!embedded && <div className="page-heading member-page-heading"><div>{onBack && <button className="back-link" onClick={onBack}><ArrowLeft size={15}/>返回项目与社区</button>}<h1>{onBack ? `${currentProject.name} · 成员管理` : "用户管理"}</h1><p>{fixedAdminRole ? `仅管理${currentProject.name}的社区管理员账号` : `仅管理${currentProject.name}范围内的后台用户`}</p></div><button className="primary-button" onClick={() => setEditing(null)}><Plus size={16}/>{fixedAdminRole ? "新增成员" : "新增用户"}</button></div>}<section className={`panel management-panel member-management-panel ${embedded ? "embedded-member-panel" : ""}`}>{embedded && <div className="embedded-member-toolbar"><div><b>{currentProject.name}</b></div><button className="primary-button" onClick={() => setEditing(null)}><Plus size={16}/>新增成员</button></div>}<div className="filters member-filters"><label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="姓名、手机号、账号或邮箱"/></div></label>{!fixedAdminRole && <label><span>关联角色</span><select className="select-control filter-select" value={roleId} onChange={(event) => setRoleId(event.target.value)}><option>全部角色</option>{roleOptions.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>}<label><span>账号状态</span><select className="select-control filter-select" value={status} onChange={(event) => setStatus(event.target.value)}><option>全部状态</option><option>已启用</option><option>已停用</option></select></label><div className="filter-actions"><button className="primary-button"><Search size={15}/>查询</button><button className="secondary-button" onClick={() => { setQuery(""); setRoleId("全部角色"); setStatus("全部状态"); }}><RefreshCw size={15}/>重置</button></div></div><div className="table-scroll"><table className="member-table"><thead><tr><th>姓名 / 账号</th><th>联系方式</th><th>关联角色</th><th>状态</th><th>最近登录</th><th className="sticky-right">操作</th></tr></thead><tbody>{filtered.map((user) => { const role = getRole(roles, user.roleId); const protectedUser = isProtected(user); return <tr key={user.id}><td><div className="project-name-cell member-name-cell"><span><UserRound size={17}/></span><div><b>{user.name}</b><small>{user.username}</small></div></div></td><td><div className="stacked-cell"><b>{user.phone}</b><small>{user.email || "未填写邮箱"}</small></div></td><td>{role?.name || "角色已停用"}</td><td><StatusTag>{user.status}</StatusTag></td><td>{user.lastLogin || "从未登录"}</td><td className="sticky-right"><button className="table-action" onClick={() => setEditing(user)}>编辑</button><button className={`table-action ${user.status === "已启用" ? "danger-text" : ""}`} disabled={protectedUser} title={protectedUser ? "该社区至少保留一位已启用管理员" : ""} onClick={() => requestToggle(user)}>{user.status === "已启用" ? "停用" : "启用"}</button></td></tr>; })}{!filtered.length && <tr><td colSpan="6"><div className="table-empty-state">当前筛选条件下暂无用户</div></td></tr>}</tbody></table></div><div className="pagination"><span>当前展示 {filtered.length} 条数据</span></div></section>{editing !== undefined && <UserDrawer user={editing} scopeMode={scopeMode} fixedAdminRole={fixedAdminRole} currentProject={currentProject} projects={projects} roles={roles} allUsers={users} onClose={() => setEditing(undefined)} onSave={(user) => { onSave(user); setEditing(undefined); }}/>} {toggleTarget && <AdminConfirm className="nested-modal-layer" title={`停用“${toggleTarget.name}”账号？`} description="停用后，该用户将无法继续登录当前社区，用户记录仍会保留。" confirmLabel="确认停用" onClose={() => setToggleTarget(null)} onConfirm={() => { onToggle(toggleTarget.id); setToggleTarget(null); }}/>}</>;
}

export function CommunityMembersPage({ onClose, ...props }) { return <div className="drawer-layer member-management-layer"><button className="drawer-backdrop" aria-label="关闭成员管理" onClick={onClose}/><aside className="drawer member-management-drawer" role="dialog" aria-modal="true" aria-label={`${props.currentProject.name}成员管理`}><header><div><h2>成员管理</h2></div><button className="icon-button" aria-label="关闭" onClick={onClose}><X size={19}/></button></header><div className="drawer-body member-management-drawer-body"><UserManagementPage {...props} scopeMode="community" fixedAdminRole embedded/></div><footer><button className="secondary-button" onClick={onClose}>关闭</button></footer></aside></div>; }

function RoleDrawer({ role, scopeMode, currentProject, projects, roles, onClose, onSave }) {
  const [form, setForm] = useState({ name: role?.name || "", description: role?.description || "", projectId: scopeMode === "community" ? currentProject.id : role?.projectId ?? "", status: role?.status || "已启用" }); const [errors, setErrors] = useState({});
  const submit = () => { const nextErrors = {}; if (!form.name.trim()) nextErrors.name = "请输入角色名称"; else if (roles.some((item) => item.id !== role?.id && item.projectId === form.projectId && item.name.trim().toLowerCase() === form.name.trim().toLowerCase())) nextErrors.name = "当前范围已存在同名角色"; setErrors(nextErrors); if (Object.keys(nextErrors).length) return; onSave({ ...role, ...form, name: form.name.trim(), description: form.description.trim(), level: form.projectId ? "社区" : "平台", dataScope: form.projectId ? "当前社区" : role?.dataScope || "指定社区", projectIds: form.projectId ? [form.projectId] : role?.projectIds || [], menuPermissions: role?.menuPermissions || [], operationPermissions: role?.operationPermissions || ["查看"], isAdmin: role?.isAdmin || false, isBuiltIn: role?.isBuiltIn || false }); };
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer member-drawer"><header><h2>{role ? "编辑角色" : "新增角色"}</h2><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="form-section"><h3>角色信息</h3><label><span>角色名称 *</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="请输入角色名称"/>{errors.name && <small className="field-error">{errors.name}</small>}</label><label><span>角色说明（选填）</span><textarea rows="3" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="说明该角色负责的工作"/></label><div className="form-row"><label><span>角色范围 *</span>{scopeMode === "platform" ? <select className="select-control form-select-native" value={form.projectId} disabled={role?.isBuiltIn} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))}><option value="">平台角色</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}角色</option>)}</select> : <input disabled value={currentProject.name}/>}</label><label><span>角色状态 *</span><select className="select-control form-select-native" value={form.status} disabled={role?.isAdmin} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option>已启用</option><option>已停用</option></select></label></div></div></div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={submit}>保存角色</button></footer></aside></div>;
}

const platformMenus = ["平台总览", "项目与社区", "用户管理", "角色管理", "关怀话术", "休闲娱乐", "操作日志"];
const communityMenus = ["运营概览", "老人档案", "亲属档案", "紧急协助", "服务沟通", "推荐策略", "预约服务", "社区公告", "生活资讯", "警惕事项", "社区活动", "社区人员", "设备管理", "房间活动", "用户管理", "角色管理"];
const operations = ["查看", "新增", "编辑", "启停"];

function RoleDeleteDialog({ role, users, onClose, onConfirm }) {
  const referencedUsers = users.filter((user) => user.roleId === role.id);
  return <AdminConfirm className="nested-modal-layer" title={referencedUsers.length ? `暂时无法删除“${role.name}”` : `删除“${role.name}”？`} description={referencedUsers.length ? `当前有 ${referencedUsers.length} 位用户正在使用该角色，请先在用户管理中调整这些用户的角色。` : "删除后该角色及其权限配置无法恢复。"} cancelLabel={referencedUsers.length ? "我知道了" : "取消"} confirmLabel="确认删除" onClose={onClose} onConfirm={referencedUsers.length ? undefined : () => onConfirm(role.id)}/>;
}

export function RoleManagementPage({ scopeMode, currentProject, projects, roles, users, onSave, onToggle, onDelete }) {
  const scopedRoles = roles.filter((role) => scopeMode === "platform" || role.projectId === currentProject.id); const [selectedId, setSelectedId] = useState(scopedRoles[0]?.id || ""); const [editing, setEditing] = useState(undefined); const [draft, setDraft] = useState(null); const [deleteTarget, setDeleteTarget] = useState(null);
  useEffect(() => { const next = scopedRoles.find((role) => role.id === selectedId) || scopedRoles[0]; setSelectedId(next?.id || ""); setDraft(next ? { ...next, menuPermissions: [...next.menuPermissions], operationPermissions: [...next.operationPermissions], projectIds: [...next.projectIds] } : null); }, [currentProject?.id, roles, scopeMode, selectedId]);
  const selected = draft; const menuOptions = selected?.projectId ? communityMenus : platformMenus; const toggleArray = (field, value) => setDraft((current) => ({ ...current, [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value] }));
  return <><div className="page-heading"><div><h1>角色管理</h1><p>{scopeMode === "platform" ? "维护平台角色的菜单与操作权限" : `维护${currentProject.name}角色的菜单与操作权限`}</p></div><button className="primary-button" onClick={() => setEditing(null)}><Plus size={16}/>新增角色</button></div><div className="role-management-grid"><section className="panel role-list-panel"><div className="panel-title"><div><h3>{scopeMode === "platform" ? "平台角色" : "当前社区角色"}</h3></div></div><div className="role-list">{scopedRoles.map((role) => <button key={role.id} className={role.id === selectedId ? "active" : ""} onClick={() => setSelectedId(role.id)}><b>{role.name}</b><span className="role-list-meta"><StatusTag>{role.status}</StatusTag></span></button>)}</div></section><section className="panel role-detail-panel">{selected ? <><div className="panel-title role-detail-heading"><div><h3>{selected.name}</h3></div><div><button className="secondary-button" onClick={() => setEditing(selected)}>编辑信息</button><button className="secondary-button" disabled={selected.isAdmin} onClick={() => onToggle(selected.id)}>{selected.status === "已启用" ? "停用" : "启用"}</button><button className="danger-outline-button" disabled={selected.isBuiltIn} title={selected.isBuiltIn ? "内置角色不可删除" : ""} onClick={() => setDeleteTarget(selected)}>删除</button></div></div><div className="role-permission-body"><section><h4>菜单权限</h4><div className="permission-check-grid">{menuOptions.map((menu) => <label key={menu}><input type="checkbox" checked={selected.menuPermissions.includes(menu)} onChange={() => toggleArray("menuPermissions", menu)}/><span>{menu}</span></label>)}</div></section><section><h4>操作权限</h4><div className="permission-check-grid compact">{operations.map((operation) => <label key={operation}><input type="checkbox" checked={selected.operationPermissions.includes(operation)} onChange={() => toggleArray("operationPermissions", operation)}/><span>{operation}</span></label>)}</div></section></div><footer className="role-save-footer"><button className="primary-button" onClick={() => onSave(selected)}>保存权限配置</button></footer></> : <div className="table-empty-state">暂无可配置角色</div>}</section></div>{editing !== undefined && <RoleDrawer role={editing} scopeMode={scopeMode} currentProject={currentProject} projects={projects} roles={roles} onClose={() => setEditing(undefined)} onSave={(role) => { onSave(role); setEditing(undefined); }}/>} {deleteTarget && <RoleDeleteDialog role={deleteTarget} users={users} onClose={() => setDeleteTarget(null)} onConfirm={(id) => { onDelete(id); setDeleteTarget(null); }}/>}</>;
}

function PlatformUserDrawer({ user, roles, allUsers, onClose, onSave }) {
  const platformRoles = roles.filter((role) => !role.projectId && role.status === "已启用");
  const [form, setForm] = useState({
    name: user?.name || "",
    username: user?.username || "",
    phone: user?.phone || "+65 ",
    email: user?.email || "",
    roleId: user?.roleId || platformRoles[0]?.id || "",
    status: user?.status || "已启用",
  });
  const [errors, setErrors] = useState({});
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = () => {
    const nextErrors = {};
    const username = form.username.trim();
    if (!form.name.trim()) nextErrors.name = "请输入姓名";
    if (!username) nextErrors.username = "请输入账号名";
    else if (allUsers.some((item) => item.id !== user?.id && item.username.toLowerCase() === username.toLowerCase())) nextErrors.username = "该账号名已存在，请更换";
    if (!/^\+65\s?\d{8}$/.test(form.phone.trim())) nextErrors.phone = "请输入 +65 开头的 8 位手机号";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = "请输入正确的邮箱地址";
    if (!form.roleId) nextErrors.roleId = "请选择平台角色";
    const previousRole = getRole(roles, user?.roleId);
    const otherEnabledAdmins = allUsers.filter((item) => item.id !== user?.id && !item.projectId && item.status === "已启用" && getRole(roles, item.roleId)?.isAdmin);
    if (previousRole?.isAdmin && user?.status === "已启用" && !otherEnabledAdmins.length && (form.status !== "已启用" || !getRole(roles, form.roleId)?.isAdmin)) nextErrors.roleId = "平台至少需要保留一位已启用管理员";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ ...user, ...form, projectId: "", name: form.name.trim(), username, phone: form.phone.trim(), email: form.email.trim() });
  };
  return (
    <div className="drawer-layer">
      <button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/>
      <aside className="drawer member-drawer" role="dialog" aria-modal="true" aria-label={user ? "编辑平台用户" : "新增平台用户"}>
        <header><h2>{user ? "编辑平台用户" : "新增平台用户"}</h2><button className="icon-button" aria-label="关闭" onClick={onClose}><X size={19}/></button></header>
        <div className="drawer-body"><div className="form-section">
          <h3>账号资料</h3>
          <div className="form-row"><label><span>姓名 *</span><input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="请输入姓名"/>{errors.name && <small className="field-error">{errors.name}</small>}</label><label><span>账号名 *</span><input value={form.username} onChange={(event) => update("username", event.target.value)} placeholder="请输入登录账号"/>{errors.username && <small className="field-error">{errors.username}</small>}</label></div>
          <div className="form-row"><label><span>手机号 *</span><input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+65 9123 4567"/>{errors.phone && <small className="field-error">{errors.phone}</small>}</label><label><span>邮箱（选填）</span><input value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="name@example.com"/>{errors.email && <small className="field-error">{errors.email}</small>}</label></div>
          <h3>平台角色</h3>
          <label><span>关联角色 *</span><select className="select-control form-select-native" value={form.roleId} onChange={(event) => update("roleId", event.target.value)}>{platformRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>{errors.roleId && <small className="field-error">{errors.roleId}</small>}</label>
          <label><span>账号状态 *</span><select className="select-control form-select-native" value={form.status} onChange={(event) => update("status", event.target.value)}><option>已启用</option><option>已停用</option></select></label>
        </div></div>
        <footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={submit}>保存用户</button></footer>
      </aside>
    </div>
  );
}

export function PlatformUserManagementPage({ roles, users, onSave, onToggle }) {
  const [query, setQuery] = useState("");
  const [roleId, setRoleId] = useState("全部角色");
  const [status, setStatus] = useState("全部状态");
  const [editing, setEditing] = useState(undefined);
  const [toggleTarget, setToggleTarget] = useState(null);
  const platformRoles = roles.filter((role) => !role.projectId);
  const platformUsers = users.filter((user) => !user.projectId);
  const filtered = platformUsers.filter((user) => `${user.name}${user.username}${user.phone}${user.email}`.toLowerCase().includes(query.trim().toLowerCase()) && (roleId === "全部角色" || user.roleId === roleId) && (status === "全部状态" || user.status === status));
  const isProtected = (user) => getRole(roles, user.roleId)?.isAdmin && user.status === "已启用" && platformUsers.filter((item) => item.status === "已启用" && getRole(roles, item.roleId)?.isAdmin).length === 1;
  const requestToggle = (user) => user.status === "已停用" ? onToggle(user.id) : !isProtected(user) && setToggleTarget(user);
  return <><div className="page-heading member-page-heading"><div><h1>平台用户管理</h1><p>管理大平台用户、平台角色与账号状态，不包含社区用户</p></div><button className="primary-button" onClick={() => setEditing(null)}><Plus size={16}/>新增平台用户</button></div><section className="panel management-panel member-management-panel"><div className="filters member-filters"><label><span>关键字</span><div className="input-wrap"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="姓名、手机号、账号或邮箱"/></div></label><label><span>平台角色</span><select className="select-control filter-select" value={roleId} onChange={(event) => setRoleId(event.target.value)}><option>全部角色</option>{platformRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><label><span>账号状态</span><select className="select-control filter-select" value={status} onChange={(event) => setStatus(event.target.value)}><option>全部状态</option><option>已启用</option><option>已停用</option></select></label><div className="filter-actions"><button className="primary-button"><Search size={15}/>查询</button><button className="secondary-button" onClick={() => { setQuery(""); setRoleId("全部角色"); setStatus("全部状态"); }}><RefreshCw size={15}/>重置</button></div></div><div className="table-scroll"><table className="member-table platform-user-table"><thead><tr><th>姓名 / 账号</th><th>联系方式</th><th>平台角色</th><th>状态</th><th>最近登录</th><th className="sticky-right">操作</th></tr></thead><tbody>{filtered.map((user) => { const role = getRole(roles, user.roleId); const protectedUser = isProtected(user); return <tr key={user.id}><td><div className="project-name-cell member-name-cell"><span><UserRound size={17}/></span><div><b>{user.name}</b><small>{user.username}</small></div></div></td><td><div className="stacked-cell"><b>{user.phone}</b><small>{user.email || "未填写邮箱"}</small></div></td><td>{role?.name || "角色已停用"}</td><td><StatusTag>{user.status}</StatusTag></td><td>{user.lastLogin || "从未登录"}</td><td className="sticky-right"><button className="table-action" onClick={() => setEditing(user)}>编辑</button><button className={`table-action ${user.status === "已启用" ? "danger-text" : ""}`} disabled={protectedUser} title={protectedUser ? "平台至少保留一位已启用管理员" : ""} onClick={() => requestToggle(user)}>{user.status === "已启用" ? "停用" : "启用"}</button></td></tr>; })}</tbody></table></div><div className="pagination"><span>当前展示 {filtered.length} 条数据</span></div></section>{editing !== undefined && <PlatformUserDrawer user={editing} roles={roles} allUsers={users} onClose={() => setEditing(undefined)} onSave={(user) => { onSave(user); setEditing(undefined); }}/>} {toggleTarget && <AdminConfirm title={`停用“${toggleTarget.name}”账号？`} description="停用后，该用户将无法继续登录平台管理端，用户记录仍会保留。" confirmLabel="确认停用" onClose={() => setToggleTarget(null)} onConfirm={() => { onToggle(toggleTarget.id); setToggleTarget(null); }}/>}</>;
}

function PlatformRoleDrawer({ role, roles, onClose, onSave }) {
  const [form, setForm] = useState({ name: role?.name || "", description: role?.description || "" });
  const [errors, setErrors] = useState({});
  const submit = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "请输入角色名称";
    else if (roles.some((item) => item.id !== role?.id && !item.projectId && item.name.trim().toLowerCase() === form.name.trim().toLowerCase())) nextErrors.name = "已存在同名平台角色";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ ...role, ...form, status: "已启用", projectId: "", level: "平台", name: form.name.trim(), description: form.description.trim(), dataScope: "全平台", projectIds: [], menuPermissions: role?.menuPermissions || [], operationPermissions: role?.operationPermissions || ["查看"], isAdmin: role?.isAdmin || false, isBuiltIn: role?.isBuiltIn || false });
  };
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer member-drawer"><header><h2>{role ? "编辑平台角色" : "新增平台角色"}</h2><button className="icon-button" onClick={onClose}><X size={19}/></button></header><div className="drawer-body"><div className="form-section"><h3>角色信息</h3><label><span>角色名称 *</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="请输入角色名称"/>{errors.name && <small className="field-error">{errors.name}</small>}</label><label><span>角色说明（选填）</span><textarea rows="3" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="说明该平台角色负责的工作"/></label></div></div><footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={submit}>保存角色</button></footer></aside></div>;
}

export function PlatformRoleManagementPage({ roles, users, onSave, onDelete }) {
  const platformRoles = roles.filter((role) => !role.projectId);
  const [selectedId, setSelectedId] = useState(platformRoles[0]?.id || "");
  const [editing, setEditing] = useState(undefined);
  const [draft, setDraft] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  useEffect(() => {
    const next = platformRoles.find((role) => role.id === selectedId) || platformRoles[0];
    setSelectedId(next?.id || "");
    setDraft(next ? { ...next, menuPermissions: [...next.menuPermissions], operationPermissions: [...next.operationPermissions], projectIds: [] } : null);
  }, [roles, selectedId]);
  const toggleArray = (field, value) => setDraft((current) => ({ ...current, [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value] }));
  return <><div className="page-heading"><div><h1>平台角色管理</h1><p>仅维护大平台角色的菜单权限和操作权限</p></div><button className="primary-button" onClick={() => setEditing(null)}><Plus size={16}/>新增平台角色</button></div><div className="role-management-grid"><section className="panel role-list-panel"><div className="panel-title"><div><h3>平台角色</h3></div></div><div className="role-list">{platformRoles.map((role) => <button key={role.id} className={role.id === selectedId ? "active" : ""} onClick={() => setSelectedId(role.id)}><b>{role.name}</b><span className="role-list-meta"><StatusTag>{role.status}</StatusTag></span></button>)}</div></section><section className="panel role-detail-panel">{draft ? <><div className="panel-title role-detail-heading"><div><h3>{draft.name}</h3></div>{!draft.isAdmin && <div><button className="secondary-button" onClick={() => setEditing(draft)}>编辑信息</button><button className="danger-outline-button" onClick={() => setDeleteTarget(draft)}>删除</button></div>}</div><div className="role-permission-body"><section><h4>菜单权限</h4><div className="permission-check-grid">{platformMenus.map((menu) => <label key={menu}><input type="checkbox" disabled={draft.isAdmin} checked={draft.menuPermissions.includes(menu)} onChange={() => toggleArray("menuPermissions", menu)}/><span>{menu}</span></label>)}</div></section><section><h4>操作权限</h4><div className="permission-check-grid compact">{operations.map((operation) => <label key={operation}><input type="checkbox" disabled={draft.isAdmin} checked={draft.operationPermissions.includes(operation)} onChange={() => toggleArray("operationPermissions", operation)}/><span>{operation}</span></label>)}</div></section></div>{!draft.isAdmin && <footer className="role-save-footer"><button className="primary-button" onClick={() => onSave({ ...draft, status: "已启用", projectId: "", dataScope: "全平台", projectIds: [] })}>保存权限配置</button></footer>}</> : <div className="table-empty-state">暂无平台角色</div>}</section></div>{editing !== undefined && <PlatformRoleDrawer role={editing} roles={roles} onClose={() => setEditing(undefined)} onSave={(role) => { onSave(role); setEditing(undefined); }}/>} {deleteTarget && <RoleDeleteDialog role={deleteTarget} users={users} onClose={() => setDeleteTarget(null)} onConfirm={(id) => { onDelete(id); setDeleteTarget(null); }}/>}</>;
}
