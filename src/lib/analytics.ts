const SESSION_KEY = "haohang-anonymous-session";

export function getSessionId(): string {
  let value = sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

export function getSource(): string {
  const params = new URLSearchParams(window.location.search);
  const source = params.get("source")?.trim();
  if (source) {
    sessionStorage.setItem("haohang-source", source.slice(0, 60));
  }
  return sessionStorage.getItem("haohang-source") || "direct";
}
