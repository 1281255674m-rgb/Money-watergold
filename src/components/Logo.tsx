import { Link } from "react-router-dom";

interface LogoProps {
  compact?: boolean;
  brandName?: string;
  brandTagline?: string;
}

export function Logo({
  compact = false,
  brandName = "颢行科技",
  brandTagline = "HAOXING TECHNOLOGY",
}: LogoProps) {
  const displayName = brandName.trim() || "颢行科技";
  const displayTagline = brandTagline.trim();

  return (
    <Link
      className={compact ? "brand-logo compact" : "brand-logo"}
      to="/"
      aria-label={`返回${displayName}首页`}
      title={displayName}
    >
      <img src="/logo-mark.svg" alt="" aria-hidden="true" />
      {!compact && (
        <span className="brand-logo-copy">
          <strong>{displayName}</strong>
          {displayTagline && <small>{displayTagline}</small>}
        </span>
      )}
    </Link>
  );
}
