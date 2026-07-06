"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { fetchCurrentUser } from "@/app/redux/controllers/authController";
import { restoreSession } from "@/app/redux/slices/authSlice";

const publicPaths = new Set([
  "/",
  "/pending-access",
  "/sso/callback",
  "/sso/pending",
  "/sso/register",
  "/sso/rejected",
]);

export default function SessionInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const token = useAppSelector((state) => state.auth.token);
  const permissionsBootstrapped = useAppSelector(
    (state) => state.auth.permissionsBootstrapped
  );
  const bootstrappedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  useEffect(() => {
    if (publicPaths.has(pathname)) return;

    if (typeof window !== "undefined") {
      const currentToken = token || localStorage.getItem("token");

      if (!currentToken || bootstrappedTokenRef.current === currentToken) {
        return;
      }

      if (permissionsBootstrapped && token === currentToken) {
        bootstrappedTokenRef.current = currentToken;
        return;
      }

      bootstrappedTokenRef.current = currentToken;
      fetchCurrentUser()(dispatch).catch((error: unknown) => {
        bootstrappedTokenRef.current = null;
        console.error("Failed to bootstrap session permissions:", error);
      });
    }
  }, [pathname, dispatch, token, permissionsBootstrapped]);

  return <>{children}</>;
}
