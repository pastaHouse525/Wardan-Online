const TOKEN_KEY = "wardan_admin_token";

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAdminLoggedIn(): boolean {
  return !!getAdminToken();
}

function base() {
  return import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
}

export async function adminLogin(
  email: string,
  password: string
): Promise<{ accessToken: string; user: { id: string; email: string } }> {
  const res = await fetch(`${base()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "فشل تسجيل الدخول");
  }
  return res.json();
}

export async function adminLogout() {
  const token = getAdminToken();
  if (token) {
    await fetch(`${base()}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  clearAdminToken();
}

/** Returns a one-time recovery link for password reset (admin tool). */
export async function requestPasswordReset(
  email: string
): Promise<{ link: string | null }> {
  const res = await fetch(`${base()}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "فشل طلب إعادة التعيين");
  }
  return res.json();
}

export async function checkSetupStatus(): Promise<{ configured: boolean }> {
  const res = await fetch(`${base()}/api/admin/setup/status`);
  if (!res.ok) return { configured: true }; // safe default
  return res.json();
}

export async function runFirstTimeSetup(
  email: string,
  password: string
): Promise<void> {
  const res = await fetch(`${base()}/api/admin/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "فشل إعداد الإدارة");
  }
}

export async function inviteAdmin(
  email: string,
  password: string
): Promise<void> {
  const token = getAdminToken();
  const res = await fetch(`${base()}/api/admin/users/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "فشلت الدعوة");
  }
}

export async function changeAdminPassword(newPassword: string): Promise<void> {
  const token = getAdminToken();
  const res = await fetch(`${base()}/api/admin/users/change-password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "فشل تغيير كلمة المرور");
  }
}

/** Authenticated fetch helper — clears token and throws on 401. */
export async function authFetch(
  path: string,
  method = "GET",
  body?: object
): Promise<Response> {
  const token = getAdminToken();
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    clearAdminToken();
    window.location.href = `${base()}/admin/login`;
    throw new Error("Session expired");
  }
  return res;
}
