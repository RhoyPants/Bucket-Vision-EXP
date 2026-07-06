"use client";

import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { usePermissions } from "@/app/lib/usePermissions";
import { getPermissionRouteForPath } from "@/app/lib/pagePermissionRoutes";
import { useAppSelector } from "@/app/redux/hook";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);
  const loading = useAppSelector((state) => state.auth.loading);
  const { canView, permissionsBootstrapped } = usePermissions();

  const route = useMemo(() => getPermissionRouteForPath(pathname), [pathname]);
  const hasStoredToken =
    typeof window !== "undefined" && Boolean(localStorage.getItem("token"));
  const hasToken = Boolean(token) || hasStoredToken;

  useEffect(() => {
    if (!hasToken && route) {
      router.replace("/");
    }
  }, [hasToken, route, router]);

  if (!route) {
    return <>{children}</>;
  }

  if (!hasToken || loading || !permissionsBootstrapped) {
    return (
      <Box sx={{ display: "grid", minHeight: "55vh", placeItems: "center" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!canView(route.key)) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Stack spacing={2} sx={{ maxWidth: 560 }}>
          <Alert severity="error">
            You do not have permission to view {route.name}.
          </Alert>
          <Typography sx={{ color: "#64748b" }}>
            Please contact your administrator if you need access to this page.
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.replace("/personalDashboard")}
            sx={{ alignSelf: "flex-start", textTransform: "none" }}
          >
            Back to Dashboard
          </Button>
        </Stack>
      </Box>
    );
  }

  return <>{children}</>;
}
