import axios from "@/app/lib/axios";
import { setUser, setError, setLoading } from "../slices/authSlice";
import { aes_int_decrypt, aes_int_encrypt } from "@/app/lib/encryptdecrypt";

interface LoginPayload {
  email: string;
  password: string;
}

export const loginUser = (userData: LoginPayload) => {
  return async (dispatch: any) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      // Encrypt login payload
      const encryptedData = aes_int_encrypt(JSON.stringify(userData));

      const res = await axios.post(`/user/loginUser`, {
        data: encryptedData,
      });

      // FIX: decrypt the correct field
      const decryptedText = aes_int_decrypt(res.data.data);

      const parsedData = JSON.parse(decryptedText);

      // Save user in redux
      dispatch(setUser(parsedData));

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("token", parsedData.Token);
        localStorage.setItem("session_token", parsedData.session_token);
        localStorage.setItem("expires_at", parsedData.expires_at);
      }

      return parsedData; // IMPORTANT
    } catch (err: any) {
      const message = err.response?.data?.message || "Login failed";
      dispatch(setError(message));
      throw new Error(message);
    } finally {
      dispatch(setLoading(false));
    }
  };
};