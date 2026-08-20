import { apiRequest, tokenStore } from "./api";

export type Role = "teacher" | "hod";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
};

type AuthResponse = { token: string; user: User };

export const authService = {
  async signup(input: { name: string; email: string; password: string; role: Role }) {
    const data = await apiRequest<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: input,
      auth: false,
    });
    tokenStore.set(data.token);
    return data.user;
  },

  async login(input: { email: string; password: string }) {
    const data = await apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: input,
      auth: false,
    });
    tokenStore.set(data.token);
    return data.user;
  },

  me: () => apiRequest<User>("/api/auth/me"),

  logout: () => tokenStore.clear(),
};
