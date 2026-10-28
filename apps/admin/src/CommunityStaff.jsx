import { ArrowDown, ArrowUp, Plus, Trash2, Upload, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminConfirm, AdminDrawer } from "./AdminOverlay";

export const initialCommunityStaff = [
  {
    id: "STF-001", projectId: "PRJ-001", photo: "", displayName: "林国强", englishName: "Lim Kok Keong", role: "社区事务顾问",
    phones: ["+65 6773 3273"], email: "kokkeong.lim@u2g.sg",
    serviceLocations: [
      { serviceHours: "每周一 20:00–22:00" },
      { serviceHours: "每月第一个周六 10:00–12:00" },
    ], displayOrder: 1, updatedAt: "2026-09-15 09:30",
  },
  {
    id: "STF-002", projectId: "PRJ-001", photo: "", displayName: "王美娟", englishName: "Joan Ong", role: "社区服务负责人",
    phones: ["+65 9193 6717"], email: "",
    serviceLocations: [{ serviceHours: "每周一 19:30–21:30（公共假期除外）" }],
    displayOrder: 2, updatedAt: "2026-09-14 16:20",
  },
  {
    id: "STF-003", projectId: "PRJ-001", photo: "", displayName: "陈志明", englishName: "Tan Zhi Ming", role: "乐龄活动协调员",
    phones: ["+65 9339 0533"], email: "zhiming.tan@u2g.sg",
    serviceLocations: [
      { serviceHours: "每周一 19:00–22:00" },
      { serviceHours: "每周三 14:00–17:00" },
    ], displayOrder: 3, updatedAt: "2026-09-13 11:10",
  },
  {
    id: "STF-004", projectId: "PRJ-001", photo: "", displayName: "李慧敏", englishName: "Lee Hui Min", role: "社区关怀联络员",
    phones: ["+65 6273 2288"], email: "huimin.lee@u2g.sg",
    serviceLocations: [{ serviceHours: "每月第二、第四个周一 18:30–20:30" }],
    displayOrder: 4, updatedAt: "2026-09-12 10:45",
  },
  {
    id: "STF-005", projectId: "PRJ-002", photo: "", displayName: "黄志伟", englishName: "Ng Chee Wei", role: "社区服务联系人",
    phones: ["+65 6258 1902"], email: "",
    serviceLocations: [{ serviceHours: "每周二 18:00–20:00" }],
    displayOrder: 1, updatedAt: "2026-09-11 15:00",
  },
];

function StaffAvatar({ record, size = "normal" }) {
  return record.photo ? <img className={`community-staff-avatar ${size}`} src={record.photo} alt={`${record.displayName}照片`}/> : <span className={`community-staff-avatar default ${size}`}><UserRound size={size === "large" ? 34 : 22}/></span>;
}

export function CommunityStaffPage({ records, communityName, onCreate, onEdit, onDelete, onMove }) {
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const orderedRecords = useMemo(() => [...records].sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id)), [records]);
  const rows = useMemo(() => records
    .filter((record) => {
      const keyword = query.trim().toLowerCase();
      return !keyword || [record.displayName, record.englishName, record.role, ...record.phones, record.email, ...record.serviceLocations.map((location) => location.serviceHours)].some((value) => String(value || "").toLowerCase().includes(keyword));
    })
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id)), [records, query]);
  const reset = () => { setDraftQuery(""); setQuery(""); };

  return <>
    <div className="page-heading"><div><h1>社区人员</h1><p>管理{communityName}面向老人展示的社区人员与社区服务联系人名录</p></div><button className="primary-button" onClick={onCreate}><Plus size={16}/>新增人员</button></div>
    <section className="panel management-panel community-staff-panel">
      <div className="filters community-staff-filters">
        <label><span>关键字</span><input value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") setQuery(draftQuery); }} placeholder="姓名、职务、电话或服务时间"/></label>
        <div className="filter-actions"><button className="primary-button" onClick={() => setQuery(draftQuery)}>查询</button><button className="secondary-button" onClick={reset}>重置</button></div>
      </div>
      <div className="table-scroll"><table className="community-staff-table"><thead><tr><th>人员</th><th>职务 / 身份</th><th>联系电话</th><th>服务时间</th><th>展示顺序</th><th>更新时间</th><th className="sticky-right">操作</th></tr></thead><tbody>
        {rows.map((record) => <tr key={record.id}>
          <td><div className="community-staff-person"><StaffAvatar record={record}/><span><b>{record.displayName}</b>{record.englishName && <small>{record.englishName}</small>}</span></div></td>
          <td>{record.role || <span className="muted-text">未填写</span>}</td>
          <td><b>{record.phones[0]}</b></td>
          <td><div className="stacked-cell"><b>{record.serviceLocations.length} 个时段</b><small>{record.serviceLocations[0]?.serviceHours || "暂无服务时间"}</small></div></td>
          <td><div className="staff-order-control"><button aria-label="上移" disabled={orderedRecords[0]?.id === record.id} onClick={() => onMove(record.id, -1)}><ArrowUp size={14}/></button><b>{record.displayOrder}</b><button aria-label="下移" disabled={orderedRecords.at(-1)?.id === record.id} onClick={() => onMove(record.id, 1)}><ArrowDown size={14}/></button></div></td>
          <td>{record.updatedAt}</td>
          <td className="sticky-right"><button className="table-action" onClick={() => onEdit(record)}>编辑</button><button className="table-action danger-text" onClick={() => setDeleteTarget(record)}>删除</button></td>
        </tr>)}
        {!rows.length && <tr><td colSpan="7"><div className="empty-table-state"><UserRound size={28}/><b>暂无社区人员</b><span>{records.length ? "没有符合当前筛选条件的人员" : `当前${communityName}尚未配置社区人员`}</span></div></td></tr>}
      </tbody></table></div>
      <div className="pagination"><span>当前社区共 {records.length} 位</span></div>
    </section>
    {deleteTarget && <AdminConfirm title={`删除社区人员“${deleteTarget.displayName}”？`} description="删除后该人员将不再在老人端展示。" confirmLabel="确认删除" danger onClose={() => setDeleteTarget(null)} onConfirm={() => { onDelete(deleteTarget.id); setDeleteTarget(null); }}/>} 
  </>;
}

const blankLocation = () => ({ serviceHours: "" });

export function CommunityStaffDrawer({ record, currentProject, nextDisplayOrder = 1, onClose, onSave }) {
  const [form, setForm] = useState(() => record ? { ...record, phones: [record.phones[0] || ""], serviceLocations: record.serviceLocations.map((item) => ({ ...item })) } : {
    projectId: currentProject?.id || "", photo: "", displayName: "", englishName: "", role: "", phones: [""], email: "", serviceLocations: [blankLocation()], displayOrder: nextDisplayOrder,
  });
  const [errors, setErrors] = useState({});
  const update = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: "" })); };
  const updatePhone = (value) => update("phones", [value]);
  const updateLocation = (index, key, value) => update("serviceLocations", form.serviceLocations.map((location, locationIndex) => locationIndex === index ? { ...location, [key]: value } : location));
  const chooseLocalImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) return setErrors((current) => ({ ...current, photo: "仅支持 JPG、PNG 或 WebP 格式" }));
    if (file.size > 2 * 1024 * 1024) return setErrors((current) => ({ ...current, photo: "图片大小不能超过 2MB" }));
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const image = new Image();
      image.onload = () => {
        if (image.naturalWidth < 400 || image.naturalHeight < 400) return setErrors((current) => ({ ...current, photo: "图片尺寸过小，请上传不低于 400×400px 的照片" }));
        update("photo", dataUrl);
      };
      image.onerror = () => setErrors((current) => ({ ...current, photo: "图片无法读取，请重新选择" }));
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };
  const submit = () => {
    const nextErrors = {};
    if (!form.displayName.trim()) nextErrors.displayName = "请输入显示姓名";
    const phones = [String(form.phones[0] || "").trim()].filter(Boolean);
    if (!phones.length) nextErrors.phones = "请填写联系电话";
    const locations = form.serviceLocations.map((location) => ({ serviceHours: location.serviceHours.trim() })).filter((location) => location.serviceHours);
    if (!locations.length) nextErrors.serviceLocations = "请至少填写一组服务时间";
    if (!Number.isInteger(Number(form.displayOrder)) || Number(form.displayOrder) < 1) nextErrors.displayOrder = "展示顺序需为大于 0 的整数";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = "请输入正确的邮箱地址";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ ...form, displayName: form.displayName.trim(), englishName: form.englishName.trim(), role: form.role.trim(), phones, email: form.email.trim(), serviceLocations: locations, displayOrder: Number(form.displayOrder) });
  };

  return <AdminDrawer
    title={record ? "编辑社区人员" : "新增社区人员"}
    className="community-staff-drawer"
    onClose={onClose}
    footer={<><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={submit}>保存人员</button></>}
  >
      <div className="form-section community-staff-photo-section"><h3>人员照片</h3><div className="staff-photo-editor"><StaffAvatar record={form} size="large"/><div><b>{form.photo ? "已上传人员照片" : "未上传时使用默认头像"}</b><p>上传本地照片，未上传时使用默认头像</p><ul className="staff-photo-rules"><li>支持 JPG、PNG、WebP</li><li>建议 1:1 方形且不低于 400×400px</li><li>文件大小不超过 2MB</li></ul><div className="staff-photo-actions"><label className="secondary-button"><Upload size={14}/>上传照片<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseLocalImage}/></label>{form.photo && <button type="button" className="text-button" onClick={() => update("photo", "")}>移除照片</button>}</div>{errors.photo && <small className="field-error">{errors.photo}</small>}</div></div></div>
      <div className="form-section"><h3>基础信息</h3><label><span>显示姓名 *</span><input value={form.displayName} onChange={(event) => update("displayName", event.target.value)} placeholder="请输入老人端展示姓名"/>{errors.displayName && <small className="field-error">{errors.displayName}</small>}</label><div className="form-row"><label><span>英文名</span><input value={form.englishName} onChange={(event) => update("englishName", event.target.value)} placeholder="选填"/></label><label><span>职务 / 身份</span><input value={form.role} onChange={(event) => update("role", event.target.value)} placeholder="例如：社区服务负责人"/></label></div><label><span>邮箱</span><input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="选填；未填写时老人端不展示邮箱行"/>{errors.email && <small className="field-error">{errors.email}</small>}</label></div>
      <div className="form-section"><h3>联系电话 *</h3><label><input value={form.phones[0] || ""} onChange={(event) => updatePhone(event.target.value)} placeholder="例如：+65 6273 2288"/>{errors.phones && <small className="field-error">{errors.phones}</small>}</label></div>
      <div className="form-section staff-repeat-section"><div className="form-section-heading"><div><h3>服务时间 *</h3><p>人员默认服务当前社区，只需维护对外服务时间</p></div><button type="button" className="secondary-button" onClick={() => update("serviceLocations", [...form.serviceLocations, blankLocation()])}><Plus size={14}/>添加时间</button></div>{form.serviceLocations.map((location, index) => <section className="staff-location-card" key={`location-${index}`}><div className="staff-location-heading"><b>服务时间 {index + 1}</b><button type="button" aria-label="移除服务时间" disabled={form.serviceLocations.length === 1} onClick={() => update("serviceLocations", form.serviceLocations.filter((_, locationIndex) => locationIndex !== index))}><Trash2 size={15}/></button></div><label><span>时间说明</span><input value={location.serviceHours} onChange={(event) => updateLocation(index, "serviceHours", event.target.value)} placeholder="例如：每周一 19:00–21:00"/></label></section>)}{errors.serviceLocations && <small className="field-error">{errors.serviceLocations}</small>}</div>
      <div className="form-section"><h3>展示设置</h3><label><span>展示顺序 *</span><input type="number" min="1" step="1" value={form.displayOrder} onChange={(event) => update("displayOrder", Number(event.target.value))}/>{errors.displayOrder && <small className="field-error">{errors.displayOrder}</small>}</label></div>
  </AdminDrawer>;
}
