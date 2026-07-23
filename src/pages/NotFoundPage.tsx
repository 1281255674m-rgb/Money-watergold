import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return <main className="not-found"><img src="/logo-mark.svg" alt="颢行科技" /><p className="eyebrow">404</p><h1>页面不存在</h1><Link className="button primary" to="/"><ArrowLeft size={18} />返回首页</Link></main>;
}
