"use client";

import { Box, Drawer, IconButton } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';

import SidebarItem from "./SidebarItem";
import { useState } from "react";

const drawerWidth = 240;

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggle = () => setMobileOpen((prev) => !prev);

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
        <img src="/images/GVI_LOGO_DARK.png" width={150} alt="GVI Logo" />
      </Box>

      {/* MENU */}
      <SidebarItem label="Dashboard" href="/dashboard" />
      <SidebarItem label="Task Board" href="/taskboard" />
      <SidebarItem label="Team Overview" href="/pages/team" />
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
