import { AlertTriangle, Download, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../lib/api";
import { getAdminToken } from "../../lib/adminSession";
import { labelInterests, STATUS_LABELS, STATUS_OPTIONS } from "../../lib/labels";
import type { ApplicationFilters, ApplicationRecord, ApplicationStatus } from "../../types";

const emptyFilters: ApplicationFilters = { query: "", school: "", grade: "", status: "", interest: "", source: "", startDate: "", endDate: "" };

export function AdminApplicationsPage() {
  const [records, setRecords] = useState<ApplicationRecord[]>([]);
  const [filters, setFilters] = useState<ApplicationFilters>(emptyFilters);
  const [selected, setSelected] = useState<ApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const detailDialog = useRef<HTMLDialogElement>(null);
  const token = getAdminToken();

  const load = async () => {
    setLoading(true);
    try { setRecords(await api.listApplications(token, filters)); setError(""); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "名单加载失败"); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [filters]);
  useEffect(() => {
    if (selected && !detailDialog.current?.open) detailDialog.current?.showModal();
    if (!selected && detailDialog.current?.open) detailDialog.current?.close();
  }, [selected]);

  const schools = useMemo(() => [...new Set(records.map((record) => record.school))].sort(), [records]);
  const sources = useMemo(() => [...new Set(records.map((record) => record.source))].sort(), [records]);

  const updateSelected = async (changes: { status?: ApplicationStatus; adminNotes?: string }) => {
    if (!selected) return;
    try {
      const updated = await api.updateApplication(token, selected.id, changes);
      setSelected(updated);
      setRecords((items) => items.map((item) => item.id === updated.id ? updated : item));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "更新失败"); }
  };

  const removeSelected = async () => {
    if (!selected || !window.confirm("确定删除这一条报名记录吗？此操作无法撤销。")) return;
    try {
      await api.deleteApplication(token, selected.id);
      setSelected(null);
      await load();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "删除失败"); }
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = records.map((record) => ({
      报名编号: record.id,
      代理编号: record.agentCode || "",
      学校: record.school,
      年级: record.grade,
      微信号: record.wechatId,
      备用手机号: record.phone || "",
      感兴趣业务: labelInterests(record.interests),
      想法与建议: record.ideas || "",
      来源: record.source,
      状态: STATUS_LABELS[record.status],
      疑似重复: record.duplicateSuspected ? "是" : "否",
      管理员备注: record.adminNotes,
      报名时间: new Date(record.createdAt).toLocaleString("zh-CN"),
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "校园代理报名");
    XLSX.writeFile(workbook, `颢行科技-校园代理报名-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <>
      <div className="admin-page-heading"><div><p className="eyebrow">报名名单</p><h1>代理申请管理</h1></div><button className="button secondary" type="button" onClick={() => void exportExcel()} disabled={!records.length}><Download size={17} />导出 Excel</button></div>
      <section className="filter-panel">
        <label className="search-field"><Search size={18} /><input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="搜索学校、微信号、手机号或代理编号" /></label>
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as ApplicationStatus | "" })}><option value="">全部状态</option>{STATUS_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
        <select value={filters.school} onChange={(event) => setFilters({ ...filters, school: event.target.value })}><option value="">全部学校</option>{schools.map((school) => <option key={school}>{school}</option>)}</select>
        <select value={filters.source} onChange={(event) => setFilters({ ...filters, source: event.target.value })}><option value="">全部来源</option>{sources.map((source) => <option key={source}>{source}</option>)}</select>
        <button type="button" onClick={() => setFilters(emptyFilters)}>清除筛选</button>
      </section>
      {error && <div className="admin-error">{error}</div>}
      <section className="data-panel">
        <div className="data-panel-head"><span>共 {records.length} 条</span><span>点击行查看详情</span></div>
        {loading ? <div className="admin-loading">正在加载名单…</div> : records.length ? (
          <div className="table-scroll"><table className="applications-table"><thead><tr><th>学校</th><th>年级</th><th>微信号</th><th>来源</th><th>状态</th><th>报名时间</th></tr></thead><tbody>{records.map((record) => <tr key={record.id} onClick={() => setSelected(record)}><td><strong>{record.school}</strong>{record.duplicateSuspected && <span className="duplicate-note"><AlertTriangle size={14} />疑似重复</span>}</td><td>{record.grade}</td><td>{record.wechatId}</td><td>{record.source}</td><td><span className={`status-badge ${record.status}`}>{STATUS_LABELS[record.status]}</span></td><td>{new Date(record.createdAt).toLocaleDateString("zh-CN")}</td></tr>)}</tbody></table></div>
        ) : <div className="empty-state"><FileTextIcon /><h2>暂无匹配的报名</h2><p>调整筛选条件，或等待新的报名提交。</p></div>}
      </section>

      <dialog ref={detailDialog} className="application-detail-dialog" onClose={() => setSelected(null)}>
        {selected && <div className="application-detail">
          <div className="detail-head"><div><p className="eyebrow">报名详情</p><h2>{selected.school} · {selected.grade}</h2></div><button className="icon-button" type="button" onClick={() => setSelected(null)} aria-label="关闭"><X size={20} /></button></div>
          {selected.duplicateSuspected && <div className="duplicate-alert"><AlertTriangle size={18} />该微信号曾提交过报名，请核对后处理。</div>}
          <dl className="detail-grid"><div><dt>微信号</dt><dd>{selected.wechatId}</dd></div><div><dt>备用手机号</dt><dd>{selected.phone || "未填写"}</dd></div><div><dt>来源</dt><dd>{selected.source}</dd></div><div><dt>代理编号</dt><dd>{selected.agentCode || "审核通过后生成"}</dd></div><div className="full"><dt>感兴趣方向</dt><dd>{labelInterests(selected.interests)}</dd></div><div className="full"><dt>想法与建议</dt><dd>{selected.ideas || "未填写"}</dd></div></dl>
          <label className="field"><span>处理状态</span><select value={selected.status} onChange={(event) => void updateSelected({ status: event.target.value as ApplicationStatus })}>{STATUS_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label className="field"><span>管理员备注</span><textarea value={selected.adminNotes} onChange={(event) => setSelected({ ...selected, adminNotes: event.target.value })} onBlur={() => void updateSelected({ adminNotes: selected.adminNotes })} placeholder="记录沟通重点，仅后台可见" /></label>
          <div className="detail-actions"><button className="danger-button" type="button" onClick={() => void removeSelected()}><Trash2 size={17} />删除本条记录</button><button className="button primary" type="button" onClick={() => setSelected(null)}>完成</button></div>
        </div>}
      </dialog>
    </>
  );
}

function FileTextIcon() { return <span className="empty-icon">申</span>; }
