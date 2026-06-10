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

import SidebarItem from "./SidebarItem";
import { useEffect, useMemo, useState } from "react";
import { getMyApprovals } from "@/app/api-service/projectService";

const drawerWidth = 240;
const collapsedDrawerWidth = 80;
const sidebarCollapsedStorageKey = "bv-sidebar-collapsed";

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
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
      try {
        const items = await getMyApprovals();
        setApprovalQueue(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error("Failed to load my approvals count:", error);
      }
    };

    fetchApprovalQueue();
  }, []);

  const approvalBadgeCount = useMemo(() => {
    const forReview = approvalQueue.filter((p: any) => p?.status === "FOR_REVIEW").length;
    const forApproval = approvalQueue.filter((p: any) => p?.status === "FOR_APPROVAL").length;
    const total = forReview + forApproval;

    return total;
  }, [approvalQueue]);

  const currentWidth = collapsed ? collapsedDrawerWidth : drawerWidth;

  const sidebarContent = (
    <Box
      sx={{
        width: currentWidth,
        background: "linear-gradient(180deg, #0F123D 0%, #090C2C 100%)",
        height: "100%",
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
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <SidebarItem label="Personal Dashboard" href="/personalDashboard" icon={<SpaceDashboardOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="Sprint Management" href="/sprintManagement" icon={<AssignmentTurnedInOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="Task Board" href="/taskboard" icon={<ViewKanbanOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="Team Overview" href="/teamOverview" icon={<GroupsOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="Projects" href="/projects" icon={<FolderOpenOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="My Requests" href="/myRequests" icon={<SendOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="My Approvals" href="/myApprovals" badgeCount={approvalBadgeCount} icon={<FactCheckOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="My Drafts" href="/myDrafts" icon={<DraftsOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="Reports" href="/reports" icon={<AssessmentOutlinedIcon />} collapsed={collapsed} />
        <SidebarItem label="Settings" href="/settings" icon={<SettingsOutlinedIcon />} collapsed={collapsed} />
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
          color: "rgba(241, 241, 252, 0.85)",
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
