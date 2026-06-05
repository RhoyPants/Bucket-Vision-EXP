"use client";

import { AppBar, Toolbar, Typography, Box, Avatar, Menu, MenuItem, Divider } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { logout } from "@/app/redux/slices/authSlice";

// Map exact routes to display titles
const routeTitleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
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
  "/dashboard": "View overall project performance and key metrics",
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
  return routeTitleMap[pathname] || "Dashboard";
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

  // Get user initials
  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

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
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #e8e7e2",
        paddingX: 3,
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: 64, justifyContent: "space-between" }}>
        {/* Left: Page Title & Description */}
        <Box>
          <Typography
            sx={{
              color: "#210e64",
              fontWeight: 600,
              fontSize: "1.5rem",
              fontFamily: "var(--font-ftsterling)",
              letterSpacing: "-0.5px",
              mt: 1,
            }}
          >
            {pageTitle}
          </Typography>
          <Typography
            sx={{
              color: "#6b7280",
              fontSize: "0.875rem",
              fontWeight: 400,

            }}
          >
            {pageDescription}
          </Typography>
        </Box>

        {/* Right: User Avatar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
          }}
          onClick={handleAvatarClick}
        >
          <Box sx={{ textAlign: "right" }}>
            {isHydrated ? (
              <>
                <Typography
                  sx={{
                    color: "#210e64",
                    fontWeight: 500,
                    fontSize: "0.9rem",
                  }}
                >
                  {user?.name || "User"}
                </Typography>
                <Typography
                  sx={{
                    color: "#888",
                    fontSize: "0.75rem",
                  }}
                >
                  {user?.email || "user@example.com"}
                </Typography>
              </>
            ) : (
              <>
                <Typography
                  sx={{
                    color: "#210e64",
                    fontWeight: 500,
                    fontSize: "0.9rem",
                  }}
                >
                  User
                </Typography>
                <Typography
                  sx={{
                    color: "#888",
                    fontSize: "0.75rem",
                  }}
                >
                  user@example.com
                </Typography>
              </>
            )}
          </Box>

          <Avatar
            sx={{
              bgcolor: "#6366f1",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.9rem",
              width: 40,
              height: 40,
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              },
            }}
          >
            {userInitials}
          </Avatar>
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
              mt: 1,
              minWidth: 250,
              borderRadius: 2,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
              overflow: "visible",
              border: "1px solid #e8e7e2",
            },
          }}
        >
          {/* User Info Header */}
          <Box sx={{ px: 2, py: 1.5 }}>
            {isHydrated ? (
              <>
                <Typography sx={{ fontWeight: 600, color: "#210e64" }}>
                  {user?.name || "User"}
                </Typography>
                <Typography sx={{ fontSize: "0.85rem", color: "#888" }}>
                  {user?.email || "user@example.com"}
                </Typography>
              </>
            ) : (
              <>
                <Typography sx={{ fontWeight: 600, color: "#210e64" }}>
                  User
                </Typography>
                <Typography sx={{ fontSize: "0.85rem", color: "#888" }}>
                  user@example.com
                </Typography>
              </>
            )}
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Menu Items */}
          <MenuItem
            onClick={handleProfile}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              py: 1,
              px: 2,
              color: "#210e64",
              "&:hover": {
                backgroundColor: "#f5f3ff",
              },
            }}
          >
            <PersonIcon sx={{ fontSize: "1.2rem" }} />
            <Typography>My Profile</Typography>
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          {/* Logout */}
          <MenuItem
            onClick={handleLogout}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              py: 1,
              px: 2,
              color: "#ef4444",
              "&:hover": {
                backgroundColor: "#fee2e2",
              },
            }}
          >
            <LogoutIcon sx={{ fontSize: "1.2rem" }} />
            <Typography>Logout</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
