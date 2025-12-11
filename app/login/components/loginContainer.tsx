"use client";

import { useAppDispatch } from "@/app/redux/hook";
import { loginUser } from "@/app/redux/controllers/loginController";
import { loadUserSession } from "@/app/redux/controllers/sessionController";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LoginForm from "./loginForm";

export default function LoginContainer() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoading(true);

      // 1️⃣ LOGIN
      const loginData = await dispatch(loginUser({ email, password }));

      const jwt = loginData.Token;
      const sessionToken = loginData.session_token;

      localStorage.setItem("token", jwt);
      localStorage.setItem("session_token", sessionToken);

      // 2️⃣ GET USER SESSION (controller handles AES + axios)
      await dispatch(loadUserSession(sessionToken, jwt));

      // 3️⃣ REDIRECT
      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return <LoginForm onSubmit={handleLogin} loading={loading} />;
}
