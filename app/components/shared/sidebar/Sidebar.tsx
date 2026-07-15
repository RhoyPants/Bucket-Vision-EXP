"use client";

import { Box, Drawer, IconButton, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import ViewKanbanOutlinedIcon from "@mui/icons-material/ViewKanbanOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import DraftsOutlinedIcon from "@mui/icons-material/DraftsOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

import SidebarItem from "./SidebarItem";
import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePermissions } from "@/app/lib/usePermissions";
import { getMyApprovals, getMyRequests } from "@/app/api-service/projectService";

const drawerWidth = 240;
const collapsedDrawerWidth = 80;
const sidebarCollapsedStorageKey = "bv-sidebar-collapsed";
const settingsTabs = [
  { key: "profile", label: "My Profile", permissionKey: "settings_profile" },
  { key: "roles", label: "Roles", permissionKey: "settings_roles" },
  { key: "users", label: "Users", permissionKey: "settings_users" },
  { key: "userRequests", label: "User Requests", permissionKey: "settings_user_requests" },
  { key: "relations", label: "User Relations", permissionKey: "settings_user_relations" },
  { key: "approvals", label: "Approval Flows", permissionKey: "settings_approval_flows" },
  { key: "projectApprovals", label: "Project Approvals", permissionKey: "settings_project_approvals" },
  { key: "modules", label: "Modules", permissionKey: "settings_modules" },
  { key: "businessUnits", label: "Business Units", permissionKey: "settings_business_units" },
] as const;

const mainNavItems = [
  { label: "Personal Dashboard", href: "/personalDashboard", permissionKey: "personal_dashboard", icon: <SpaceDashboardOutlinedIcon /> },
  { label: "Projects", href: "/projects", permissionKey: "projects", icon: <FolderOpenOutlinedIcon /> },
  { label: "My Requests", href: "/myRequests", permissionKey: "my_requests", icon: <SendOutlinedIcon /> },
  { label: "My Approvals", href: "/myApprovals", permissionKey: "my_approvals", icon: <FactCheckOutlinedIcon /> },
  { label: "Sprint Management", href: "/sprintManagement", permissionKey: "sprint_management", icon: <AssignmentTurnedInOutlinedIcon /> },
  { label: "Task Board", href: "/taskboard", permissionKey: "task_board", icon: <ViewKanbanOutlinedIcon /> },
  { label: "Team Overview", href: "/teamOverview", permissionKey: "team_overview", icon: <GroupsOutlinedIcon /> },
  { label: "My Drafts", href: "/myDrafts", permissionKey: "my_drafts", icon: <DraftsOutlinedIcon /> },
  { label: "Reports", href: "/reports", permissionKey: "reports", icon: <AssessmentOutlinedIcon /> },
] as const;

const subscribeToHydration = (onStoreChange: () => void) => {
  const timer = window.setTimeout(onStoreChange, 0);
  return () => window.clearTimeout(timer);
};

const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { canView } = usePermissions();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(true);
  const [notificationCounts, setNotificationCounts] = useState({
    approvals: 0,
    needsRevision: 0,
  });
  const allowedSettingsTabs = hydrated
    ? settingsTabs.filter((tab) => canView(tab.permissionKey))
    : [];
  const canViewSettings = hydrated
    ? canView("settings") || allowedSettingsTabs.length > 0
    : false;
  const canViewApprovals = hydrated && canView("my_approvals");
  const canViewRequests = hydrated && canView("my_requests");
  const handleToggle = () => setMobileOpen((prev) => !prev);
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
    if (!hydrated) return;

    let cancelled = false;

    const loadNotificationCounts = () => {
      Promise.all([
        canViewApprovals
          ? getMyApprovals({ page: 1, limit: 1 })
          : Promise.resolve(null),
        canViewRequests
          ? getMyRequests({ page: 1, limit: 1, status: "NEEDS_REVISION" })
          : Promise.resolve(null),
      ])
        .then(([approvals, requests]) => {
          if (cancelled) return;
          setNotificationCounts({
            approvals: getResponseTotal(approvals),
            needsRevision: getResponseTotal(requests),
          });
        })
        .catch((error) => {
          if (!cancelled) console.warn("Unable to load sidebar notification counts:", error);
        });
    };

    loadNotificationCounts();
    const refreshTimer = window.setInterval(loadNotificationCounts, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [canViewApprovals, canViewRequests, hydrated]);

  const currentWidth = collapsed ? collapsedDrawerWidth : drawerWidth;
  const settingsTab = searchParams.get("tab") || "profile";
  const isOnSettings = pathname === "/settings";
  const showSettingsSubmenu = isOnSettings && !collapsed && settingsMenuOpen && allowedSettingsTabs.length > 0;

  const sidebarContent = (
    <Box
      sx={{
        width: currentWidth,
        background: "linear-gradient(180deg, #0F123D 0%, #090C2C 100%)",
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
        <Image
          src="/images/GVI_LOGO_DARK.png"
          width={130}
          height={42}
          priority
          alt="GVI Logo"
          style={{
            display: "block",
            width: collapsed ? 42 : 130,
            height: "auto",
            filter: "brightness(0) invert(1)",
          }}
        />
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
          .filter((item) => hydrated && canView(item.permissionKey))
          .map((item) => (
            <SidebarItem
              key={item.permissionKey}
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
      {/* MOBILE HAMBURGER BUTTON */}
      <IconButton
        onClick={handleToggle}
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          top: 15,
          left: 15,
          zIndex: 1301,
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* MOBILE DRAWER */}
      <Drawer
        open={mobileOpen}
        onClose={handleToggle}
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
