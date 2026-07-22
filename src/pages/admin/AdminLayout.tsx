import { BarChart3, FileText, Globe2, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "../../components/Logo";
import { clearAdminToken, getAdminToken } from "../../lib/adminSession";

export function AdminLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  if (!getAdminToken()) return <Navigate to="/admin/login" replace />;

  const logout = () => {
    clearAdminToken();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className={menuOpen ? "admin-sidebar is-open" : "admin-sidebar"}>
        <div className="admin-sidebar-head"><Logo compact /><button className="icon-button admin-menu-close" type="button" onClick={() => setMenuOpen(false)} aria-label="关闭菜单"><X size={20} /></button></div>
        <nav aria-label="后台导航">
          <NavLink to="/admin/dashboard" onClick={() => setMenuOpen(false)}><BarChart3 size={19} />数据概览</NavLink>
          <NavLink to="/admin/applications" onClick={() => setMenuOpen(false)}><FileText size={19} />报名名单</NavLink>
          <NavLink to="/admin/content" onClick={() => setMenuOpen(false)}><Globe2 size={19} />网站内容</NavLink>
        </nav>
        <button className="admin-logout" type="button" onClick={logout}><LogOut size={18} />退出登录</button>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar"><button type="button" className="icon-button admin-menu-open" onClick={() => setMenuOpen(true)} aria-label="打开菜单"><Menu size={21} /></button><div><strong>浩航科技</strong><span>单管理员后台</span></div><a href="/" target="_blank" rel="noreferrer">查看网站</a></header>
        <div className="admin-page"><Outlet /></div>
      </div>
    </div>
  );
}
