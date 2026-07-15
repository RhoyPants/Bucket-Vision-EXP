"use client";

import { AppBar, Toolbar, Typography, Box, Avatar, Menu, MenuItem, Divider, IconButton } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { logout } from "@/app/redux/slices/authSlice";

// Map exact routes to display titles
const routeTitleMap: Record<string, string> = {
  "/sprintManagement": "Sprint Management",
  "/taskboard": "Task Board",
  "/teamOverview": "Team Overview",
  "/projects": "Projects",
  "/reports": "Reports",
  "/settings": "Settings",
  "/myApprovals": "My Approvals",
  "/myRequests": "My Requests",
  "/myDrafts": "My Drafts",
  "/projectCalendar": "Project Calendar",
  "/projectTimeline": "Project Timeline",
  "/personalDashboard": "Personal Dashboard",
  "/versioning": "Versioning",
  "/approvals": "Approvals",
};

// Map routes to descriptions
const routeDescriptionMap: Record<string, string> = {
  "/sprintManagement": "Plan and manage sprint cycles",
  "/taskboard": "Manage and track all assigned tasks and subtasks",
  "/teamOverview": "Overview of team members and their assignments",
  "/projects": "Manage all your projects and their status",
  "/reports": "Track and manage daily and weekly reports from your team",
  "/settings": "Configure system settings and user permissions",
  "/myApprovals": "Requests that need your review or approval decision",
  "/myRequests": "Track all project requests you've submitted and their approval status",
  "/myDrafts": "Draft projects saved by you and ready to continue",
  "/projectCalendar": "View and manage project timelines and task schedules",
  "/projectTimeline": "Visualize project timelines and dependencies",
  "/personalDashboard": "Customize and view your personal dashboard",
  "/versioning": "Manage project versions and track changes",
  "/approvals": "Review and manage project approval workflows",
};

function getPageTitle(pathname: string): string {
  // Handle dynamic/detail pages first
  if (pathname.startsWith("/approvals/")) return "Approval Review";
  if (pathname.startsWith("/projects/")) return "Project Details";
  if (pathname.startsWith("/reports/daily")) return "Daily Reports";
  if (pathname.startsWith("/reports/weekly")) return "Weekly Reports";

  // Exact map fallback
  return routeTitleMap[pathname] || "Bucket Vision";
}

function getPageDescription(pathname: string): string {
  // Handle dynamic/detail pages first
  if (pathname.startsWith("/approvals/")) return "Review and make approval decisions";
  if (pathname.startsWith("/projects/")) return "View and manage project details";
  if (pathname.startsWith("/reports/daily")) return "View daily report submissions";
  if (pathname.startsWith("/reports/weekly")) return "View weekly report submissions";

  // Exact map fallback
  return routeDescriptionMap[pathname] || "Welcome to Bucket Vision";
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Ensure hydration is complete before rendering user data
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Get page title from route
  const pageTitle = getPageTitle(pathname);
  const pageDescription = getPageDescription(pathname);

  // Use only the first letter from user name for avatar
  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    dispatch(logout());
    router.push("/");
  };

  const handleProfile = () => {
    handleMenuClose();
    router.push("/settings");
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: "72px",
          height: "72px",
          px: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: Page Title & Description */}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#111827",
              fontWeight: 700,
              fontSize: "24px",
              fontFamily: "var(--font-ftsterling)",
              lineHeight: 1.2,
            }}
          >
            {pageTitle}
          </Typography>
          <Typography
            sx={{
              color: "#6b7280",
              fontSize: "14px",
              fontWeight: 400,
              mt: 0.25,
            }}
          >
            {pageDescription}
          </Typography>
        </Box>

        {/* Right: Actions + Profile */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <IconButton sx={{ color: "#374151" }}>
            <HelpOutlineIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <Box
            onClick={handleAvatarClick}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              cursor: "pointer",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "#0f123d",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.85rem",
                width: 40,
                height: 40,
              }}
            >
              {isHydrated ? userInitial : "U"}
            </Avatar>

            <Box sx={{ minWidth: "fit-content" }}>
            {isHydrated ? (
              <Box>
                <Typography
                  sx={{
                    color: "#111827",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  {user?.name || "User"}
                </Typography>
                <Typography
                  sx={{
                    color: "#6b7280",
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
                >
                  {user?.role || "Project Manager"}
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography
                  sx={{
                    color: "#111827",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  User
                </Typography>
                <Typography
                  sx={{
                    color: "#6b7280",
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
                >
                  Project Manager
                </Typography>
              </Box>
            )}
          </Box>
          </Box>
        </Box>

        {/* User Menu Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 260,
              borderRadius: "12px",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.12)",
              overflow: "visible",
              border: "1px solid #f0f1f3",
              backgroundColor: "#ffffff",
            },
          }}
        >
          {/* User Info Header */}
          <Box sx={{ px: 3, py: 2, backgroundColor: "#f9fafb" }}>
            {isHydrated ? (
              <Box>
                <Typography sx={{ fontWeight: 700, color: "#1a0f3d", fontSize: "0.95rem" }}>
                  {user?.name || "User"}
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "4px" }}>
                  {user?.email || "user@example.com"}
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography sx={{ fontWeight: 700, color: "#1a0f3d", fontSize: "0.95rem" }}>
                  User
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "4px" }}>
                  user@example.com
                </Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 0.5, borderColor: "#f0f1f3" }} />

          {/* Menu Items */}
          <MenuItem
            onClick={handleProfile}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              py: 1.25,
              px: 3,
              color: "#1a0f3d",
              fontSize: "0.9rem",
              fontWeight: 500,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "#f5f6f8",
                color: "#6366f1",
              },
            }}
          >
            <PersonIcon sx={{ fontSize: "1.1rem" }} />
            <Typography>My Profile</Typography>
          </MenuItem>

          <Divider sx={{ my: 0.5, borderColor: "#f0f1f3" }} />

          {/* Logout */}
          <MenuItem
            onClick={handleLogout}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              py: 1.25,
              px: 3,
              color: "#dc2626",
              fontSize: "0.9rem",
              fontWeight: 500,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "#fef2f2",
                color: "#991b1b",
              },
            }}
          >
            <LogoutIcon sx={{ fontSize: "1.1rem" }} />
            <Typography>Logout</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
