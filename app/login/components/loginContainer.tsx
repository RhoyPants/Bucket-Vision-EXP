"use client";

import { useAppDispatch } from "@/app/redux/hook";
import { login } from "@/app/redux/controllers/loginController";
import { loginWithMicrosoftRedirect } from "@/app/api-service/authService";
import { setError, setUser } from "@/app/redux/slices/authSlice";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LoginForm from "./loginForm";

const mapSsoErrorToStatus = (errorText: string) => {
  const msg = errorText.toLowerCase();
  if (msg.includes("no registered account")) return "register";
  if (msg.includes("inactive") || msg.includes("pending")) return "pending";
  if (msg.includes("denied")) return "denied";
  return "failed";
};

export default function LoginContainer() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoading(true);

      // 🔥 NEW LOGIN (JWT ONLY)
      await dispatch(login(email, password) as any);

      // 🔥 REDIRECT
      router.push("/projects");

    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setLoading(true);
      await loginWithMicrosoftRedirect();
    } catch (error: any) {
      console.error("Microsoft redirect login error:", error);
      const errorMsg = error?.message || "Microsoft login failed. Please try again.";
      dispatch(setError(errorMsg));
      router.push(`/?sso=${mapSsoErrorToStatus(errorMsg)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginForm
      onSubmit={handleLogin}
      onMicrosoftLogin={handleMicrosoftLogin}
      loading={loading}
    />
  );
}