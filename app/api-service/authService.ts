import api from "@/app/lib/axios";
import axios from "@/app/lib/axios";

export async function loginRequest(email: string, password: string) {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
}
export const getUserSession = async () => {
  const token = localStorage.getItem("token");
  const sessionToken = localStorage.getItem("session_token");

  if (!token || !sessionToken) throw new Error("Missing token");

  const res = await axios.post(
    "/user/get_session",
    { data: sessionToken },    // MUST be exactly like Postman
    {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    }
  );

  return res.data; // decrypted user data returned by backend
};