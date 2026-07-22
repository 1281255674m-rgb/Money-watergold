import { BarChart3, CheckCircle2, Clock3, FileText, MessageCircle, MousePointerClick } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getAdminToken } from "../../lib/adminSession";
import { STATUS_LABELS } from "../../lib/labels";
import type { DashboardStats } from "../../types";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getDashboard(getAdminToken()).then(setStats).catch((requestError) => setError(requestError instanceof Error ? requestError.message : "数据加载失败"));
  }, []);

  if (error) return <div className="admin-error">{error}</div>;
  if (!stats) return <div className="admin-loading">正在加载数据…</div>;

  const statItems = [
    { label: "页面访问", value: stats.pageViews, icon: BarChart3 },
    { label: "咨询点击", value: stats.consultationClicks, icon: MessageCircle },
    { label: "开始报名", value: stats.applicationStarts, icon: MousePointerClick },
    { label: "完成报名", value: stats.applicationSubmits, icon: FileText },
  ];
  const maxSource = Math.max(...stats.sourceBreakdown.map((item) => item.count), 1);
  const maxSchool = Math.max(...stats.schoolBreakdown.map((item) => item.count), 1);

  return (
    <>
      <div className="admin-page-heading"><div><p className="eyebrow">数据概览</p><h1>校园招募进展</h1></div><div className="conversion-box"><span>访问报名转化率</span><strong>{stats.conversionRate}%</strong></div></div>
      <div className="admin-stat-grid">
        {statItems.map(({ label, value, icon: Icon }) => <div className="admin-stat" key={label}><Icon size={21} /><span>{label}</span><strong>{value}</strong></div>)}
      </div>
      <div className="status-summary">
        <div><Clock3 size={18} /><span>{STATUS_LABELS.pending}</span><strong>{stats.statusCounts.pending}</strong></div>
        <div><CheckCircle2 size={18} /><span>{STATUS_LABELS.approved}</span><strong>{stats.statusCounts.approved}</strong></div>
        <div><FileText size={18} /><span>{STATUS_LABELS.not_suitable}</span><strong>{stats.statusCounts.not_suitable}</strong></div>
      </div>
      <div className="admin-dashboard-grid">
        <section className="admin-panel"><div className="admin-panel-head"><h2>来源渠道</h2><span>报名数</span></div><div className="bar-list">{stats.sourceBreakdown.length ? stats.sourceBreakdown.map((item) => <div className="bar-row" key={item.name}><span>{item.name}</span><div><i style={{ width: `${(item.count / maxSource) * 100}%` }} /></div><strong>{item.count}</strong></div>) : <p className="empty-text">暂无报名数据</p>}</div></section>
        <section className="admin-panel"><div className="admin-panel-head"><h2>学校分布</h2><span>报名数</span></div><div className="bar-list">{stats.schoolBreakdown.length ? stats.schoolBreakdown.map((item) => <div className="bar-row" key={item.name}><span>{item.name}</span><div><i style={{ width: `${(item.count / maxSchool) * 100}%` }} /></div><strong>{item.count}</strong></div>) : <p className="empty-text">暂无报名数据</p>}</div></section>
      </div>
      <section className="admin-panel recent-panel"><div className="admin-panel-head"><h2>最近报名</h2><a href="/admin/applications">查看全部</a></div>{stats.recentApplications.length ? <div className="recent-list">{stats.recentApplications.map((record) => <div key={record.id}><span>{record.school}</span><span>{record.grade}</span><span className={`status-badge ${record.status}`}>{STATUS_LABELS[record.status]}</span><time>{new Date(record.createdAt).toLocaleDateString("zh-CN")}</time></div>)}</div> : <p className="empty-text">第一份报名提交后会显示在这里。</p>}</section>
    </>
  );
}
