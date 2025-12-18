import { aes_int_decrypt, aes_int_encrypt } from "@/app/lib/encryptdecrypt";
import axiosApi from "@/app/lib/axios";
import { AppDispatch } from "../store";

export const getUserById = (userId: string) => {
  return async () => {
    try {
      const payload = { user_id: userId };
      const encrypted = aes_int_encrypt(JSON.stringify(payload));

      const res = await axiosApi.post("/user/getUserById", {
        data: encrypted,
      });

      const decrypted = aes_int_decrypt(res.data.data);
      const user = JSON.parse(decrypted);

      // expected: { user_id, name, email, ... }
      return user;
    } catch (err) {
      console.error("❌ Error fetching user info:", err);
      return null;
    }
  };
};
