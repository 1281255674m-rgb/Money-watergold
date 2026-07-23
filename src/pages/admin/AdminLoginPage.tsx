import { LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { getAdminToken, setAdminToken } from "../../lib/adminSession";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (getAdminToken()) return <Navigate to="/admin/dashboard" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = await api.adminLogin(password);
      setAdminToken(token);
      navigate("/admin/dashboard", { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-brand"><img src="/logo-horizontal-light.svg" alt="颢行科技" /><p>校园代理管理后台</p></div>
      <form className="admin-login-form" onSubmit={submit}>
        <div className="login-icon"><LockKeyhole size={24} /></div>
        <h1>管理员登录</h1>
        <p>仅授权管理员可以访问报名信息。</p>
        <label className="field"><span>管理员密码</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required autoFocus /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="button primary" type="submit" disabled={loading}>{loading ? "正在验证…" : "登录后台"}</button>
      </form>
    </main>
  );
}
