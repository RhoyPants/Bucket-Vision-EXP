"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppDispatch } from "@/app/redux/hook";
import { fetchCurrentUser } from "@/app/redux/controllers/authController";

export default function SessionInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  useEffect(() => {
    console.log("🔵 SessionInitializer: pathname =", pathname);

    // Skip auth checks on SSO callback page - let it process Microsoft response first
    if (pathname === "/sso/callback") {
      console.log("🟢 SessionInitializer: SKIPPING fetchCurrentUser on /sso/callback");
      return;
    }

    // Check if user is already logged in (token exists in localStorage)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      console.log("🔵 SessionInitializer: token exists =", !!token);
      if (token) {
        console.log("🔵 SessionInitializer: calling fetchCurrentUser");
        // Restore user data from backend
        dispatch(fetchCurrentUser() as any);
      }
    }
  }, [pathname, dispatch]); // Run when pathname changes

  return <>{children}</>;
}
