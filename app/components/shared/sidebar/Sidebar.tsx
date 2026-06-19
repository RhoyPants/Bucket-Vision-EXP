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
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getMyApprovals } from "@/app/api-service/projectService";

const drawerWidth = 240;
const collapsedDrawerWidth = 80;
const sidebarCollapsedStorageKey = "bv-sidebar-collapsed";
const approvalsCacheStorageKey = "bv-my-approvals-cache";
const approvalsCacheTtlMs = 60 * 1000;
const settingsTabs = [
  { key: "profile", label: "My Profile" },
  { key: "roles", label: "Roles" },
  { key: "users", label: "Users" },
  { key: "userRequests", label: "User Requests" },
  { key: "relations", label: "User Relations" },
  { key: "approvals", label: "Approval Flows" },
  { key: "projectApprovals", label: "Project Approvals" },
  { key: "modules", label: "Modules" },
  { key: "businessUnits", label: "Business Units" },
] as const;

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);

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
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(sidebarCollapsedStorageKey);
      if (stored === "true") {
        setCollapsed(true);
      }
    }

    const fetchApprovalQueue = async () => {
      if (typeof window !== "undefined") {
        const cachedRaw = window.sessionStorage.getItem(approvalsCacheStorageKey);

        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw) as {
              ts: number;
              items: any[];
            };

            if (Date.now() - cached.ts < approvalsCacheTtlMs) {
              setApprovalQueue(Array.isArray(cached.items) ? cached.items : []);
              return;
            }
          } catch {
            // Ignore invalid cache and fetch fresh data.
          }
        }
      }

      try {
        const items = await getMyApprovals();
        const safeItems = Array.isArray(items) ? items : [];
        setApprovalQueue(safeItems);

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            approvalsCacheStorageKey,
            JSON.stringify({ ts: Date.now(), items: safeItems })
          );
        }
      } catch (error) {
        console.error("Failed to load my approvals count:", error);
      }
    };

    fetchApprovalQueue();
  }, []);

  useEffect(() => {
    if (pathname === "/settings") {
      setSettingsMenuOpen(true);
    }
  }, [pathname]);

  const approvalBadgeCount = useMemo(() => {
    const forReview = approvalQueue.filter((p: any) => p?.status === "FOR_REVIEW").length;
    const forApproval = approvalQueue.filter((p: any) => p?.status === "FOR_APPROVAL").length;
    const total = forReview + forApproval;

    return total;
  }, [approvalQueue]);

  const currentWidth = collapsed ? collapsedDrawerWidth : drawerWidth;
  const settingsTab = searchParams.get("tab") || "profile";
  const isOnSettings = pathname === "/settings";
  const showSettingsSubmenu = isOnSettings && !collapsed && settingsMenuOpen;

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
        <img src="/images/GVI_LOGO_DARK.png" width={collapsed ? 42 : 130} alt="GVI Logo" style={{ display: "block", filter: "brightness(0) invert(1)" }} />
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
        <SidebarItem label="Personal Dashboard" href="/personalDashboard" icon={<SpaceDashboardOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="Sprint Management" href="/sprintManagement" icon={<AssignmentTurnedInOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="Task Board" href="/taskboard" icon={<ViewKanbanOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="Team Overview" href="/teamOverview" icon={<GroupsOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="Projects" href="/projects" icon={<FolderOpenOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="My Requests" href="/myRequests" icon={<SendOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="My Approvals" href="/myApprovals" badgeCount={approvalBadgeCount} icon={<FactCheckOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="My Drafts" href="/myDrafts" icon={<DraftsOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="Reports" href="/reports" icon={<AssessmentOutlinedIcon />} collapsed={collapsed} />

        <Box
          onClick={() => {
            if (collapsed) {
              router.push("/settings?tab=profile");
              return;
            }

            if (!isOnSettings) {
              setSettingsMenuOpen(true);
              router.push("/settings?tab=profile");
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

          {!collapsed ? (
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

        {showSettingsSubmenu ? (
          <Box sx={{ ml: 1.5, mb: 1, mt: -0.25, pr: 0.75 }}>
            {settingsTabs.map((tab) => {
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
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            backgroundColor: "transparent",
          },
        }}
      >
        {sidebarContent}
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
