import { ArrowDown, ArrowUp, Plus, Trash2, Upload, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";

const createPortrait = (background, shirt, skin, hair) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="24" fill="${background}"/>
    <circle cx="80" cy="62" r="29" fill="${skin}"/>
    <path d="M50 57c2-25 17-38 32-38 20 0 31 16 30 39-12-3-20-12-25-22-8 12-20 20-37 21Z" fill="${hair}"/>
    <path d="M35 153c4-39 21-57 45-57s42 18 45 57H35Z" fill="${shirt}"/>
    <path d="M66 91c3 8 8 12 14 12 7 0 12-4 15-12" fill="none" stroke="#b87562" stroke-width="3" stroke-linecap="round"/>
    <circle cx="68" cy="64" r="2.5" fill="#374151"/><circle cx="93" cy="64" r="2.5" fill="#374151"/>
  </svg>
`)}`;

export const staffPortraits = {
  blue: createPortrait("#e5efff", "#4f7dd9", "#f0bc9d", "#27354d"),
  coral: createPortrait("#fff0eb", "#e27b61", "#e8b08f", "#3a2a27"),
  green: createPortrait("#e7f6ef", "#4f9f7e", "#e9b89b", "#34302f"),
};

export const initialCommunityStaff = [
  {
    id: "STF-001", projectId: "PRJ-001", photo: staffPortraits.blue, displayName: "林国强", englishName: "Lim Kok Keong", role: "社区事务顾问",
    phones: ["+65 6773 3273", "+65 8029 9610"], email: "kokkeong.lim@u2g.sg",
    serviceLocations: [
      { serviceHours: "每周一 20:00–22:00" },
      { serviceHours: "每月第一个周六 10:00–12:00" },
    ], displayOrder: 1, enabled: true, updatedAt: "2026-09-15 09:30",
  },
  {
    id: "STF-002", projectId: "PRJ-001", photo: staffPortraits.coral, displayName: "王美娟", englishName: "Joan Ong", role: "社区服务负责人",
    phones: ["+65 9193 6717"], email: "",
    serviceLocations: [{ serviceHours: "每周一 19:30–21:30（公共假期除外）" }],
    displayOrder: 2, enabled: true, updatedAt: "2026-09-14 16:20",
  },
  {
    id: "STF-003", projectId: "PRJ-001", photo: "", displayName: "陈志明", englishName: "Tan Zhi Ming", role: "乐龄活动协调员",
    phones: ["+65 9339 0533", "+65 6258 1072"], email: "zhiming.tan@u2g.sg",
    serviceLocations: [
      { serviceHours: "每周一 19:00–22:00" },
      { serviceHours: "每周三 14:00–17:00" },
    ], displayOrder: 3, enabled: true, updatedAt: "2026-09-13 11:10",
  },
  {
    id: "STF-004", projectId: "PRJ-001", photo: staffPortraits.green, displayName: "李慧敏", englishName: "Lee Hui Min", role: "社区关怀联络员",
    phones: ["+65 6273 2288"], email: "huimin.lee@u2g.sg",
    serviceLocations: [{ serviceHours: "每月第二、第四个周一 18:30–20:30" }],
    displayOrder: 4, enabled: false, updatedAt: "2026-09-12 10:45",
  },
  {
    id: "STF-005", projectId: "PRJ-002", photo: staffPortraits.green, displayName: "黄志伟", englishName: "Ng Chee Wei", role: "社区服务联系人",
    phones: ["+65 6258 1902"], email: "",
    serviceLocations: [{ serviceHours: "每周二 18:00–20:00" }],
    displayOrder: 1, enabled: true, updatedAt: "2026-09-11 15:00",
  },
];

function StaffAvatar({ record, size = "normal" }) {
  return record.photo ? <img className={`community-staff-avatar ${size}`} src={record.photo} alt={`${record.displayName}照片`}/> : <span className={`community-staff-avatar default ${size}`}><UserRound size={size === "large" ? 34 : 22}/></span>;
}

export function CommunityStaffPage({ records, communityName, onCreate, onEdit, onToggle, onMove }) {
  const [draftFilters, setDraftFilters] = useState({ query: "", status: "全部状态" });
  const [filters, setFilters] = useState({ query: "", status: "全部状态" });
  const rows = useMemo(() => records
    .filter((record) => {
      const keyword = filters.query.trim().toLowerCase();
      const matchesQuery = !keyword || [record.displayName, record.englishName, record.role, ...record.phones, record.email, ...record.serviceLocations.map((location) => location.serviceHours)].some((value) => String(value || "").toLowerCase().includes(keyword));
      const matchesStatus = filters.status === "全部状态" || (filters.status === "已启用" ? record.enabled : !record.enabled);
      return matchesQuery && matchesStatus;
    })
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id)), [records, filters]);
  const reset = () => { const next = { query: "", status: "全部状态" }; setDraftFilters(next); setFilters(next); };

  return <>
    <div className="page-heading"><div><h1>社区人员</h1><p>管理{communityName}面向老人展示的社区人员与社区服务联系人名录</p></div><button className="primary-button" onClick={onCreate}><Plus size={16}/>新增人员</button></div>
    <section className="panel management-panel community-staff-panel">
      <div className="filters community-staff-filters">
        <label><span>关键字</span><input value={draftFilters.query} onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") setFilters(draftFilters); }} placeholder="姓名、职务、电话或服务时间"/></label>
        <label><span>启用状态</span><select className="select-control filter-select" value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}><option>全部状态</option><option>已启用</option><option>已停用</option></select></label>
        <div className="filter-actions"><button className="primary-button" onClick={() => setFilters(draftFilters)}>查询</button><button className="secondary-button" onClick={reset}>重置</button></div>
      </div>
      <div className="table-toolbar"><div><span className="result-count">共 {rows.length} 位人员</span><span className="toolbar-hint">仅已启用人员会按展示顺序出现在老人端</span></div></div>
      <div className="table-scroll"><table className="community-staff-table"><thead><tr><th>人员</th><th>职务 / 身份</th><th>联系电话</th><th>服务时间</th><th>启用状态</th><th>展示顺序</th><th>更新时间</th><th className="sticky-right">操作</th></tr></thead><tbody>
        {rows.map((record) => <tr key={record.id}>
          <td><div className="community-staff-person"><StaffAvatar record={record}/><span><b>{record.displayName}</b>{record.englishName && <small>{record.englishName}</small>}</span></div></td>
          <td>{record.role || <span className="muted-text">未填写</span>}</td>
          <td><div className="stacked-cell"><b>{record.phones[0]}</b>{record.phones.length > 1 && <small>另有 {record.phones.length - 1} 个电话</small>}</div></td>
          <td><div className="stacked-cell"><b>{record.serviceLocations.length} 个时段</b><small>{record.serviceLocations[0]?.serviceHours || "暂无服务时间"}</small></div></td>
          <td><button type="button" role="switch" aria-checked={record.enabled} aria-label={`${record.displayName}启用状态`} className={`strategy-status-switch ${record.enabled ? "active" : ""}`} onClick={() => onToggle(record.id)}><i/><span>{record.enabled ? "启用" : "停用"}</span></button></td>
          <td><div className="staff-order-control"><button aria-label="上移" onClick={() => onMove(record.id, -1)}><ArrowUp size={14}/></button><b>{record.displayOrder}</b><button aria-label="下移" onClick={() => onMove(record.id, 1)}><ArrowDown size={14}/></button></div></td>
          <td>{record.updatedAt}</td>
          <td className="sticky-right"><button className="table-action" onClick={() => onEdit(record)}>编辑</button></td>
        </tr>)}
        {!rows.length && <tr><td colSpan="8"><div className="empty-table-state"><UserRound size={28}/><b>暂无社区人员</b><span>{records.length ? "没有符合当前筛选条件的人员" : `当前${communityName}尚未配置社区人员`}</span></div></td></tr>}
      </tbody></table></div>
      <div className="pagination"><span>当前社区共 {records.length} 位，已启用 {records.filter((record) => record.enabled).length} 位</span><span>社区人员不创建后台账号，也不配置系统权限</span></div>
    </section>
  </>;
}

const blankLocation = () => ({ serviceHours: "" });

export function CommunityStaffDrawer({ record, currentProject, nextDisplayOrder = 1, onClose, onSave }) {
  const [form, setForm] = useState(() => record ? { ...record, phones: [...record.phones], serviceLocations: record.serviceLocations.map((item) => ({ ...item })) } : {
    projectId: currentProject?.id || "", photo: "", displayName: "", englishName: "", role: "", phones: [""], email: "", serviceLocations: [blankLocation()], displayOrder: nextDisplayOrder, enabled: true,
  });
  const [errors, setErrors] = useState({});
  const update = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: "" })); };
  const updatePhone = (index, value) => update("phones", form.phones.map((phone, phoneIndex) => phoneIndex === index ? value : phone));
  const updateLocation = (index, key, value) => update("serviceLocations", form.serviceLocations.map((location, locationIndex) => locationIndex === index ? { ...location, [key]: value } : location));
  const chooseLocalImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("photo", String(reader.result || ""));
    reader.readAsDataURL(file);
  };
  const submit = () => {
    const nextErrors = {};
    if (!form.displayName.trim()) nextErrors.displayName = "请输入显示姓名";
    const phones = form.phones.map((phone) => phone.trim()).filter(Boolean);
    if (!phones.length) nextErrors.phones = "请至少填写一个联系电话";
    const locations = form.serviceLocations.map((location) => ({ serviceHours: location.serviceHours.trim() })).filter((location) => location.serviceHours);
    if (!locations.length) nextErrors.serviceLocations = "请至少填写一组服务时间";
    if (!Number.isInteger(Number(form.displayOrder)) || Number(form.displayOrder) < 1) nextErrors.displayOrder = "展示顺序需为大于 0 的整数";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = "请输入正确的邮箱地址";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ ...form, displayName: form.displayName.trim(), englishName: form.englishName.trim(), role: form.role.trim(), phones, email: form.email.trim(), serviceLocations: locations, displayOrder: Number(form.displayOrder) });
  };

  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="关闭" onClick={onClose}/><aside className="drawer community-staff-drawer" role="dialog" aria-modal="true" aria-label={record ? "编辑社区人员" : "新增社区人员"}>
    <header><div><h2>{record ? "编辑社区人员" : "新增社区人员"}</h2><p>{currentProject?.community} · 面向当前社区老人展示，不创建登录账号</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></header>
    <div className="drawer-body">
      <div className="form-section community-staff-photo-section"><h3>人员照片</h3><div className="staff-photo-editor"><StaffAvatar record={form} size="large"/><div><b>{form.photo ? "已选择人员照片" : "未上传时使用默认头像"}</b><p>L2 原型可选择预设 Mock 图片或本地图片预览</p><div className="staff-photo-actions">{Object.entries(staffPortraits).map(([key, photo]) => <button key={key} type="button" className={form.photo === photo ? "selected" : ""} onClick={() => update("photo", photo)}><img src={photo} alt="Mock 人员照片"/></button>)}<label className="secondary-button"><Upload size={14}/>本地图片<input type="file" accept="image/*" onChange={chooseLocalImage}/></label>{form.photo && <button type="button" className="text-button" onClick={() => update("photo", "")}>移除照片</button>}</div></div></div></div>
      <div className="form-section"><h3>基础信息</h3><label><span>显示姓名 *</span><input value={form.displayName} onChange={(event) => update("displayName", event.target.value)} placeholder="请输入老人端展示姓名"/>{errors.displayName && <small className="field-error">{errors.displayName}</small>}</label><div className="form-row"><label><span>英文名</span><input value={form.englishName} onChange={(event) => update("englishName", event.target.value)} placeholder="选填"/></label><label><span>职务 / 身份</span><input value={form.role} onChange={(event) => update("role", event.target.value)} placeholder="例如：社区服务负责人"/></label></div><label><span>邮箱</span><input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="选填；未填写时老人端不展示邮箱行"/>{errors.email && <small className="field-error">{errors.email}</small>}</label></div>
      <div className="form-section staff-repeat-section"><div className="form-section-heading"><div><h3>联系电话 *</h3><p>至少一个，可继续添加多个号码</p></div><button type="button" className="secondary-button" onClick={() => update("phones", [...form.phones, ""])}><Plus size={14}/>添加电话</button></div>{form.phones.map((phone, index) => <div className="staff-repeat-row" key={`phone-${index}`}><input value={phone} onChange={(event) => updatePhone(index, event.target.value)} placeholder="例如：+65 6273 2288"/><button type="button" aria-label="移除电话" disabled={form.phones.length === 1} onClick={() => update("phones", form.phones.filter((_, phoneIndex) => phoneIndex !== index))}><Trash2 size={15}/></button></div>)}{errors.phones && <small className="field-error">{errors.phones}</small>}</div>
      <div className="form-section staff-repeat-section"><div className="form-section-heading"><div><h3>服务时间 *</h3><p>人员默认服务当前社区，只需维护对外服务时间</p></div><button type="button" className="secondary-button" onClick={() => update("serviceLocations", [...form.serviceLocations, blankLocation()])}><Plus size={14}/>添加时间</button></div>{form.serviceLocations.map((location, index) => <section className="staff-location-card" key={`location-${index}`}><div className="staff-location-heading"><b>服务时间 {index + 1}</b><button type="button" aria-label="移除服务时间" disabled={form.serviceLocations.length === 1} onClick={() => update("serviceLocations", form.serviceLocations.filter((_, locationIndex) => locationIndex !== index))}><Trash2 size={15}/></button></div><label><span>时间说明</span><input value={location.serviceHours} onChange={(event) => updateLocation(index, "serviceHours", event.target.value)} placeholder="例如：每周一 19:00–21:00"/></label></section>)}{errors.serviceLocations && <small className="field-error">{errors.serviceLocations}</small>}</div>
      <div className="form-section"><h3>展示设置</h3><label><span>展示顺序 *</span><input type="number" min="1" step="1" value={form.displayOrder} onChange={(event) => update("displayOrder", Number(event.target.value))}/>{errors.displayOrder && <small className="field-error">{errors.displayOrder}</small>}</label><div className="staff-enabled-options"><button type="button" className={form.enabled ? "selected" : ""} onClick={() => update("enabled", true)}><b>启用</b><span>按展示顺序出现在老人端</span></button><button type="button" className={!form.enabled ? "selected" : ""} onClick={() => update("enabled", false)}><b>停用</b><span>保留配置，老人端不展示</span></button></div></div>
    </div>
    <footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={submit}>保存人员</button></footer>
  </aside></div>;
}
