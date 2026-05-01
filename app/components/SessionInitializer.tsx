"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/app/redux/hook";
import { fetchCurrentUser } from "@/app/redux/controllers/authController";

export default function SessionInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check if user is already logged in (token exists in localStorage)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        // Restore user data from backend
        dispatch(fetchCurrentUser() as any);
      }
    }
  }, []); // Run once on mount

  return <>{children}</>;
}
