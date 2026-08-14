"use client";

import { Box, Drawer, IconButton, Tooltip, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ViewKanbanOutlinedIcon from "@mui/icons-material/ViewKanbanOutlined";
// import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import DraftsOutlinedIcon from "@mui/icons-material/DraftsOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
// import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";

import SidebarItem from "./SidebarItem";
import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePermissions } from "@/app/lib/usePermissions";
import { getMyApprovals, getMyRequests } from "@/app/api-service/projectService";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { setNotificationCounts } from "@/app/redux/slices/notificationCountSlice";

const drawerWidth = 240;
const collapsedDrawerWidth = 80;
const sidebarCollapsedStorageKey = "bv-sidebar-collapsed";
const settingsTabs: Array<{
  key: string;
  label: string;
  permissionKey: string;
  fallbackPermissionKey?: string;
}> = [
  { key: "profile", label: "My Profile", permissionKey: "settings_profile" },
  { key: "roles", label: "Roles", permissionKey: "settings_roles" },
  { key: "users", label: "Users", permissionKey: "settings_users" },
  { key: "userRequests", label: "User Requests", permissionKey: "settings_user_requests" },
  { key: "relations", label: "User Relations", permissionKey: "settings_user_relations" },
  { key: "approvals", label: "Approval Flows", permissionKey: "settings_approval_flows" },
  { key: "projectApprovals", label: "Project Approvals", permissionKey: "settings_project_approvals" },
  { key: "modules", label: "Modules", permissionKey: "settings_modules" },
  { key: "businessUnits", label: "Business Units", permissionKey: "settings_business_units" },
  { key: "projectMaintenance", label: "Project Maintenance", permissionKey: "settings_project_maintenance" },
  { key: "holidayMaintenance", label: "Holiday Maintenance", permissionKey: "settings_holiday_maintenance", fallbackPermissionKey: "admin" },
];

const mainNavItems = [
  { label: "Dashboard", href: "/dashboard", permissionKey: "dashboard", icon: <DashboardOutlinedIcon /> },
  { label: "Projects", href: "/projects", permissionKey: "projects", icon: <FolderOpenOutlinedIcon /> },
  { label: "My Requests", href: "/myRequests", permissionKey: "my_requests", icon: <SendOutlinedIcon /> },
  { label: "My Approvals", href: "/myApprovals", permissionKey: "my_approvals", icon: <FactCheckOutlinedIcon /> },
  { label: "Task Board", href: "/taskboard", permissionKey: "task_board", icon: <ViewKanbanOutlinedIcon /> },
  // Temporarily hidden while the module direction is being finalized.
  // { label: "Team Overview", href: "/teamOverview", permissionKey: "team_overview", icon: <GroupsOutlinedIcon /> },
  { label: "My Drafts", href: "/myDrafts", permissionKey: "my_drafts", icon: <DraftsOutlinedIcon /> },
  { label: "Cancelled Requests", href: "/cancelledRequests", permissionKey: "my_drafts", icon: <CancelOutlinedIcon /> },
  // Temporarily hidden while the module direction is being finalized.
  // { label: "Reports", href: "/reports", permissionKey: "reports", icon: <AssessmentOutlinedIcon /> },
] as const;

const subscribeToHydration = (onStoreChange: () => void) => {
  const timer = window.setTimeout(onStoreChange, 0);
  return () => window.clearTimeout(timer);
};

const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;
let notificationCountsRequest: Promise<[unknown, unknown]> | null = null;

const getResponseTotal = (response: unknown) => {
  if (!response || typeof response !== "object") return 0;

  const payload = response as {
    meta?: { total?: number };
    pagination?: { total?: number };
    total?: number;
    data?: { meta?: { total?: number }; pagination?: { total?: number }; total?: number };
  };

  return (
    payload.meta?.total ??
    payload.pagination?.total ??
    payload.total ??
    payload.data?.meta?.total ??
    payload.data?.pagination?.total ??
    payload.data?.total ??
    0
  );
};

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { canView, permissionsBootstrapped } = usePermissions();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(true);
  const notificationCounts = useAppSelector((state) => state.notificationCounts);
  const allowedSettingsTabs = hydrated
    ? settingsTabs.filter(
        (tab) =>
          canView(tab.permissionKey) ||
          Boolean(tab.fallbackPermissionKey && canView(tab.fallbackPermissionKey)),
      )
    : [];
  const canViewSettings = hydrated
    ? canView("settings") || allowedSettingsTabs.length > 0
    : false;
  const canViewApprovals = hydrated && canView("my_approvals");
  const canViewRequests = hydrated && canView("my_requests");
  const handleToggle = () => setMobileOpen((prev) => !prev);
  const handleMobileClose = () => setMobileOpen(false);
  const handleCollapseToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(sidebarCollapsedStorageKey, String(next));
      }
      return next;
    });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCollapsed(window.localStorage.getItem(sidebarCollapsedStorageKey) === "true");
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!hydrated || !permissionsBootstrapped || notificationCounts.initialized) return;

    let cancelled = false;

    notificationCountsRequest = notificationCountsRequest || Promise.all([
        canViewApprovals
          ? getMyApprovals({ page: 1, limit: 1 })
          : Promise.resolve(null),
        canViewRequests
          ? getMyRequests({ page: 1, limit: 1, status: "NEEDS_REVISION" })
          : Promise.resolve(null),
      ]).finally(() => {
        notificationCountsRequest = null;
      });

    notificationCountsRequest
        .then(([approvals, requests]) => {
          if (cancelled) return;
          dispatch(setNotificationCounts({
            approvals: getResponseTotal(approvals),
            needsRevision: getResponseTotal(requests),
          }));
        })
        .catch((error) => {
          if (!cancelled) console.warn("Unable to load sidebar notification counts:", error);
        });

    return () => {
      cancelled = true;
    };
  }, [canViewApprovals, canViewRequests, dispatch, hydrated, notificationCounts.initialized, permissionsBootstrapped]);

  const currentWidth = collapsed ? collapsedDrawerWidth : drawerWidth;
  const settingsTab = searchParams.get("tab") || "profile";
  const isOnSettings = pathname === "/settings";
  const showSettingsSubmenu = isOnSettings && !collapsed && settingsMenuOpen && allowedSettingsTabs.length > 0;

  const sidebarContent = (
    <Box
      sx={{
        width: currentWidth,
        background: "#110947",
        height: "100vh",
        overflow: "hidden",
        pt: 3,
        px: collapsed ? 1 : 1.5,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo Section */}
      <Box sx={{ height: 30, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", px: 1.5, mb: 5 }}>
        {collapsed ? (
          <Box
            sx={{
              width: 44,
              height: 44,
              minWidth: 44,
              maxWidth: 44,
              flex: "0 0 44px",
              aspectRatio: "1 / 1",
              boxSizing: "border-box",
              display: "grid",
              placeItems: "center",
              bgcolor: "#FFFFFF",
              borderRadius: "999px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.75)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            }}
          >
            <Box component="img" src="/favicon.ico" alt="Global Visions Holdings" sx={{ display: "block", width: 34, height: 34, objectFit: "contain" }} />
          </Box>
        ) : (
          <Image
            src="/images/LOGO.png"
            width={130}
            height={42}
            priority
            alt="GVI Logo"
            style={{ display: "block", width: 130, height: "auto"}}
          />
        )}
      </Box>

      {/* Menu */}
      <Box
        tabIndex={0}
        aria-label="Sidebar menu"
        onKeyDown={(event) => {
          const step = 56;

          if (event.key === "ArrowDown") {
            event.preventDefault();
            event.currentTarget.scrollBy({ top: step, behavior: "smooth" });
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            event.currentTarget.scrollBy({ top: -step, behavior: "smooth" });
          } else if (event.key === "PageDown") {
            event.preventDefault();
            event.currentTarget.scrollBy({ top: event.currentTarget.clientHeight * 0.8, behavior: "smooth" });
          } else if (event.key === "PageUp") {
            event.preventDefault();
            event.currentTarget.scrollBy({ top: -(event.currentTarget.clientHeight * 0.8), behavior: "smooth" });
          } else if (event.key === "Home") {
            event.preventDefault();
            event.currentTarget.scrollTo({ top: 0, behavior: "smooth" });
          } else if (event.key === "End") {
            event.preventDefault();
            event.currentTarget.scrollTo({ top: event.currentTarget.scrollHeight, behavior: "smooth" });
          }
        }}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
          outline: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
          "&:focus-visible": {
            boxShadow: "inset 0 0 0 2px rgba(148, 163, 184, 0.35)",
            borderRadius: "8px",
          },
        }}
      >
        {mainNavItems
          .filter((item) => hydrated && (!item.permissionKey || canView(item.permissionKey)))
          .map((item) => (
            <SidebarItem
              key={item.href}
              label={item.label}
              href={item.href}
              icon={item.icon}
              collapsed={collapsed}
              badgeCount={
                item.href === "/myApprovals"
                  ? notificationCounts.approvals
                  : item.href === "/myRequests"
                    ? notificationCounts.needsRevision
                    : undefined
              }
            />
          ))}

        {canViewSettings ? (
        <Box
          onClick={() => {
            if (collapsed) {
              router.push("/settings?tab=profile");
              return;
            }

            if (!isOnSettings) {
              setSettingsMenuOpen(true);
              router.push(`/settings?tab=${allowedSettingsTabs[0]?.key || "profile"}`);
              return;
            }

            setSettingsMenuOpen((prev) => !prev);
          }}
          sx={{
            position: "relative",
            height: "48px",
            px: collapsed ? "4px" : "16px",
            mb: "8px",
            borderRadius: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            backgroundColor: isOnSettings ? "#1F2A6B" : "transparent",
            color: "#F8FAFC",
            transition: "background-color 0.2s ease, box-shadow 0.2s ease",
            boxShadow: isOnSettings ? "0 0 0 1px rgba(255,255,255,.05)" : "none",
            "&:hover": {
              backgroundColor: "#18225B",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mr: collapsed ? 0 : "12px",
                color: "#F8FAFC",
                opacity: 1,
                "& .MuiSvgIcon-root": {
                  fontSize: 20,
                },
              }}
            >
              <SettingsOutlinedIcon />
            </Box>

            <Typography
              fontSize="15px"
              fontWeight={500}
              sx={{
                display: collapsed ? "none" : "block",
                color: "inherit",
                fontFamily: "var(--font-ftsterling)",
                lineHeight: 1,
              }}
            >
              Settings
            </Typography>
          </Box>

          {!collapsed && allowedSettingsTabs.length > 0 ? (
            <ExpandMoreRoundedIcon
              sx={{
                fontSize: 18,
                transform: settingsMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
                opacity: 0.9,
              }}
            />
          ) : null}
        </Box>
        ) : null}

        {showSettingsSubmenu ? (
          <Box sx={{ ml: 1.5, mb: 1, mt: -0.25, pr: 0.75 }}>
            {allowedSettingsTabs.map((tab) => {
              const isActive = settingsTab === tab.key;

              return (
                <Box
                  key={tab.key}
                  onClick={() => router.push(`/settings?tab=${tab.key}`)}
                  sx={{
                    minHeight: 38,
                    px: 1.75,
                    mb: 0.5,
                    borderRadius: "10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: isActive ? "#2B3788" : "transparent",
                    "&:hover": {
                      backgroundColor: isActive ? "#2B3788" : "rgba(255,255,255,0.10)",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      color: isActive ? "#FFFFFF !important" : "#CBD5E1 !important",
                      fontSize: 13.5,
                      fontWeight: isActive ? 700 : 600,
                      lineHeight: 1.25,
                      fontFamily: "var(--font-ftsterling)",
                    }}
                  >
                    {tab.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        ) : null}
      </Box>

      {/* Collapse */}
      <Box
        onClick={handleCollapseToggle}
        sx={{
          height: 48,
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 0.5,
          px: 2,
          color: "#E2E8F0",
          cursor: "pointer",
          mb: 1,
          "&:hover": { backgroundColor: "#18225B" },
        }}
      >
        {collapsed ? <ChevronRightIcon sx={{ fontSize: 20 }} /> : <ChevronLeftIcon sx={{ fontSize: 20 }} />}
        {!collapsed ? <Typography sx={{ fontSize: 15, fontWeight: 500 }}>Collapse</Typography> : null}
      </Box>
    </Box>
  );

  return (
    <>
      {/* MOBILE COMPANY MARK / NAVIGATION BUTTON */}
      <Tooltip title="Show navigation" placement="right">
        <IconButton
          onClick={handleToggle}
          aria-label="Show main navigation"
          aria-expanded={mobileOpen}
          sx={{
            display: mobileOpen ? "none" : { xs: "inline-flex", md: "none" },
            position: "fixed",
            top: 10,
            left: 12,
            zIndex: 1301,
            width: 40,
            height: 40,
            p: 0.5,
            bgcolor: "#FFFFFF",
            border: "1px solid #D8D4E2",
            boxShadow: "0 2px 8px rgba(17, 9, 71, 0.14)",
            "&:hover": { bgcolor: "#F5F3FF" },
          }}
        >
          <Box component="img" src="/favicon.ico" alt="" sx={{ width: 30, height: 30, objectFit: "contain" }} />
        </IconButton>
      </Tooltip>

      {/* MOBILE DRAWER */}
      <Drawer
        open={mobileOpen}
        onClose={handleMobileClose}
        variant="temporary"
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            backgroundColor: "transparent",
          },
        }}
      >
        {mobileOpen ? sidebarContent : null}
      </Drawer>

      {/* DESKTOP SIDEBAR (fixed) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          width: currentWidth,
          height: "100vh",
          position: "sticky",
          top: 0,
          transition: "width 0.25s ease",
        }}
      >
        {sidebarContent}
      </Box>
    </>
  );
}
