import { Link } from "react-router-dom";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand-logo" to="/" aria-label="返回浩航科技首页">
      <img src={compact ? "/logo-mark.svg" : "/logo-horizontal.svg"} alt="浩航科技" />
    </Link>
  );
}
