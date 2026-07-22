const TOKEN_KEY = "haohang-admin-token";

export function getAdminToken(): string {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}
