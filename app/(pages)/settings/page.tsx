"use client";

import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Paper,
} from "@mui/material";
import { useState } from "react";
import Roles from "./components/Roles";
import Layout from "@/app/components/shared/Layout";
import Users from "./components/Users";
import UserRelations from "./components/UserRelations";
import UserProfile from "./components/UserProfile";
import ApprovalFlowsList from "./components/ApprovalFlowsList";
import ProjectApprovalManagement from "./components/ProjectApprovalManagement";
import Modules from "./components/Modules";

type TabType = "profile" | "roles" | "users" | "relations" | "approvals" | "projectApprovals" | "modules";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  return (
    <Layout>
      <Box display="flex" height="100%" sx={{ background: "#f4f6f8" }}>
        {/* 🔹 SIDEBAR */}
        <Paper
          elevation={0}
          sx={{
            width: 240,
            borderRight: "1px solid #e0e0e0",
            p: 2,
            background: "#fff",
          }}
        >
          <Typography fontWeight={700} mb={2}>
            Settings
          </Typography>

          <List>
            <ListItemButton
              selected={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            >
              <ListItemText primary="My Profile" />
            </ListItemButton>

            <ListItemButton
              selected={activeTab === "roles"}
              onClick={() => setActiveTab("roles")}
            >
              <ListItemText primary="Roles" />
            </ListItemButton>

            <ListItemButton
              selected={activeTab === "users"}
              onClick={() => setActiveTab("users")}
            >
              <ListItemText primary="Users" />
            </ListItemButton>

            <ListItemButton
              selected={activeTab === "relations"}
              onClick={() => setActiveTab("relations")}
            >
              <ListItemText primary="User Relations" />
            </ListItemButton>

            <ListItemButton
              selected={activeTab === "approvals"}
              onClick={() => setActiveTab("approvals")}
            >
              <ListItemText primary="Approval Flows" />
            </ListItemButton>

            <ListItemButton
              selected={activeTab === "projectApprovals"}
              onClick={() => setActiveTab("projectApprovals")}
            >
              <ListItemText primary="Project Approvals" />
            </ListItemButton>

            <ListItemButton
              selected={activeTab === "modules"}
              onClick={() => setActiveTab("modules")}
            >
              <ListItemText primary="Modules" />
            </ListItemButton>
          </List>
        </Paper>

        {/* 🔹 CONTENT */}
        <Paper
          elevation={0}
          sx={{ 
            width: `calc(100% - 240px)`,
            borderRight: "1px solid #e0e0e0",
            p: 2,
            ml: 2,
            background: "#fff",
          }}
        >
          <Box flex={1} p={3}>
            {activeTab === "profile" && <UserProfile />}
            {activeTab === "roles" && <Roles />}
            {activeTab === "users" && <Users />}
            {activeTab === "relations" && <UserRelations />}
            {activeTab === "approvals" && <ApprovalFlowsList />}
            {activeTab === "projectApprovals" && <ProjectApprovalManagement />}
            {activeTab === "modules" && <Modules />}
          </Box>
        </Paper>
      </Box>
    </Layout>
  );
}
