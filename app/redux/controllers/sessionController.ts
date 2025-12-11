import axios from "@/app/lib/axios";
import { aes_int_encrypt, aes_int_decrypt } from "@/app/lib/encryptdecrypt";
import { setUser } from "../slices/authSlice";
import { DataArray } from "@mui/icons-material";

export const loadUserSession = (sessionToken: string, jwtToken: string) => {
  console.log({ sessionToken: sessionToken, jwtToken: jwtToken });

  return async (dispatch: any) => {
    try {
      // Encrypt session token for payload
      const encryptedPayload = aes_int_encrypt(
        JSON.stringify({ session: sessionToken })
      );

      // Call backend
      const res = await axios.post(
        "/user/get_session",
        { data: encryptedPayload },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      // Decrypt backend response
      const decryptedText = aes_int_decrypt(res.data.data);
      const user = JSON.parse(decryptedText);

      dispatch(setUser(user));

      return user;
    } catch (err) {
      console.error("SESSION LOAD FAILED:", err);
      throw err;
    }
  };
};
