import { loginRequest } from "@/app/api-service/authService";

export const loginController = {
  async login(email: string, password: string) {
    const data = await loginRequest(email, password);
    return data; // backend returns { user, token }
  },
};
