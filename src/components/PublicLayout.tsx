import { Menu, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useSiteContent } from "../context/SiteContentContext";
import { ContactDialog } from "./ContactDialog";
import { Logo } from "./Logo";

export function PublicLayout() {
  const { content } = useSiteContent();
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const hasContact = Boolean(content.contactQrUrl || content.personalContactQrUrl);

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <Logo />
          <nav className={menuOpen ? "site-nav is-open" : "site-nav"} aria-label="主导航">
            <NavLink to="/" onClick={() => setMenuOpen(false)}>首页</NavLink>
            <NavLink to="/services" onClick={() => setMenuOpen(false)}>服务方向</NavLink>
            <NavLink to="/apply" onClick={() => setMenuOpen(false)}>代理报名</NavLink>
            {hasContact && (
              <button type="button" className="nav-contact" onClick={() => { setContactOpen(true); setMenuOpen(false); }}>
                <MessageCircle size={17} />咨询服务
              </button>
            )}
          </nav>
          <button type="button" className="mobile-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "关闭菜单" : "打开菜单"}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main><Outlet /></main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <Logo />
            <p>{content.slogan}</p>
          </div>
          <div className="footer-links">
            <Link to="/services">服务方向</Link>
            <Link to="/apply">代理报名</Link>
            <Link to="/privacy">隐私说明</Link>
          </div>
          <p className="company-line">{content.companyName}</p>
        </div>
      </footer>

      <div className="mobile-action-bar">
        <Link className="button primary" to="/apply">申请成为校园代理</Link>
        {hasContact && (
          <button type="button" className="button secondary compact" onClick={() => setContactOpen(true)} aria-label="咨询校园服务">
            <MessageCircle size={19} />
          </button>
        )}
      </div>

      {hasContact && (
        <ContactDialog
          open={contactOpen}
          onClose={() => setContactOpen(false)}
          enterpriseQrUrl={content.contactQrUrl}
          enterpriseLabel={content.contactLabel}
          personalQrUrl={content.personalContactQrUrl}
          personalLabel={content.personalContactLabel}
        />
      )}
    </div>
  );
}
