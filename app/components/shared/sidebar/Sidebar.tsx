"use client";

import { Box, Drawer, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import SidebarItem from "./SidebarItem";
import { useEffect, useMemo, useState } from "react";
import { logout } from "@/app/redux/slices/authSlice";
import { useAppDispatch } from "@/app/redux/hook";
import router from "next/router";
import { getMyApprovals } from "@/app/api-service/projectService";

const drawerWidth = 240;

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);

  const handleToggle = () => setMobileOpen((prev) => !prev);

  const handleLogout = async () => {
    router.push("/"); // navigate to root (login)
    dispatch(logout()); // no need to await a plain reducer
  };

  useEffect(() => {
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

  const sidebarContent = (
    <Box
      sx={{
        width: drawerWidth,
        backgroundColor: "#e8e7e2",
        height: "100%",
        paddingTop: 3,
        paddingX: 1,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        borderRight: "1px solid #d6d5cf",
      }}
    >
      {/* LOGO */}
      <Box sx={{ padding: 2, marginBottom: 2 }}>
        <img
          src="/images/GVI_LOGO_DARK.png"
          onClick={handleLogout}
          width={150}
          alt="GVI Logo"
        />
      </Box>

      {/* MENU */}
      <SidebarItem label="Dashboard" href="/dashboard" />
      <SidebarItem label="Personal Dashboard" href="/personalDashboard" />
      <SidebarItem label="Sprint Management" href="/sprintManagement" />
      <SidebarItem label="Task Board" href="/taskboard" />
      <SidebarItem label="Team Overview" href="/teamOverview" />
      <SidebarItem label="Projects" href="/projects" />
      <SidebarItem label="My Requests" href="/myRequests" />
      <SidebarItem label="My Approvals" href="/myApprovals" badgeCount={approvalBadgeCount} />
      <SidebarItem label="My Drafts" href="/myDrafts" />
      <SidebarItem label="Reports" href="/reports" />
      <SidebarItem label="Settings" href="/settings" />
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
          width: drawerWidth,
          height: "100vh",
          position: "sticky",
          top: 0,
        }}
      >
        {sidebarContent}
      </Box>
    </>
  );
}
