const AUTH_URL = "https://functions.poehali.dev/a5f60dec-92c0-48d2-976c-2c0c26006806";

const TOKEN_KEY = "pulse_session_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path: string, method: string, body?: object) {
  const token = getToken();
  const res = await fetch(`${AUTH_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Session-Token": token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}

export const authApi = {
  register: (payload: { username: string; email: string; password: string; display_name: string }) =>
    request("/register", "POST", payload),

  login: (payload: { login: string; password: string }) =>
    request("/login", "POST", payload),

  logout: () => request("/logout", "POST"),

  me: () => request("/me", "GET"),

  updateMe: (payload: { display_name?: string; status_text?: string }) =>
    request("/me", "PUT", payload),
};

export type UserProfile = {
  id: number;
  username: string;
  display_name: string;
  avatar_letter: string;
  avatar_color: string;
  status_text: string;
  email: string;
  is_online: boolean;
};
