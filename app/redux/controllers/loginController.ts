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
      const encryptedData = aes_int_encrypt(JSON.stringify(userData));
      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      dispatch(setLoading(true));
      dispatch(setError(null));

      const res = await axios.post(`/user/loginUser`, {
        data: encryptedData,
      });

      // Save token
      // if (typeof window !== "undefined") {
      //   localStorage.setItem("token", res.data.token);
      // }
      const decryptedDataset = aes_int_decrypt(res.data);
      dispatch(setUser(decryptedDataset));
      const parsedData = JSON.parse(decryptedDataset);
      return parsedData;
    } catch (err: any) {
      const message = err.response?.data?.message || "Login failed";
      dispatch(setError(message));
      throw new Error(message);
    } finally {
      dispatch(setLoading(false));
    }
  };
};
