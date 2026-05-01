"use client";

import { AppBar, Toolbar, Typography, Box, Avatar, Menu, MenuItem, Divider } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { logout } from "@/app/redux/slices/authSlice";

// Map routes to display titles
const routeTitleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/sprintManagement": "Sprint Management",
  "/taskboard": "Task Board",
  "/teamOverview": "Team Overview",
  "/projects": "Projects",
  "/reports": "Reports",
  "/settings": "Settings",
};

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
  const pageTitle = routeTitleMap[pathname] || "Dashboard";

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
        {/* Left: Page Title */}
        <Typography
          sx={{
            color: "#210e64",
            fontWeight: 600,
            fontSize: "1.5rem",
            fontFamily: "var(--font-ftsterling)",
            letterSpacing: "-0.5px",
          }}
        >
          {pageTitle}
        </Typography>

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
