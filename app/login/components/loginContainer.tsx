"use client";

import { useAppDispatch } from "@/app/redux/hook";
import { login } from "@/app/redux/controllers/loginController";
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

  return <LoginForm onSubmit={handleLogin} loading={loading} />;
}