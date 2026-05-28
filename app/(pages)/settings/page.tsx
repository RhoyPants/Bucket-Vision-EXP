"use client";

import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Paper,
  Alert,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";
import Roles from "./components/Roles";
import Layout from "@/app/components/shared/Layout";
import Users from "./components/Users";
import UserRelations from "./components/UserRelations";
import UserProfile from "./components/UserProfile";
import ApprovalFlowsList from "./components/ApprovalFlowsList";
import ProjectApprovalManagement from "./components/ProjectApprovalManagement";
import Modules from "./components/Modules";
import BusinessUnits from "./components/BusinessUnits";
import Guard from "@/app/components/shared/Guard";
import { usePermissions } from "@/app/lib/usePermissions";

type TabType = "profile" | "roles" | "users" | "relations" | "approvals" | "projectApprovals" | "modules" | "businessUnits";

interface NavItem {
  id: TabType;
  label: string;
  requiredModule?: "SETTINGS";
  requiredAction?: "UPDATE" | "READ";
}

const NAV_ITEMS: NavItem[] = [
  { id: "profile", label: "My Profile" },
  { id: "roles", label: "Roles", requiredModule: "SETTINGS", requiredAction: "UPDATE" },
  { id: "users", label: "Users", requiredModule: "SETTINGS", requiredAction: "UPDATE" },
  { id: "relations", label: "User Relations", requiredModule: "SETTINGS", requiredAction: "READ" },
  { id: "approvals", label: "Approval Flows", requiredModule: "SETTINGS", requiredAction: "READ" },
  { id: "projectApprovals", label: "Project Approvals", requiredModule: "SETTINGS", requiredAction: "UPDATE" },
  { id: "modules", label: "Modules", requiredModule: "SETTINGS", requiredAction: "UPDATE" },
  { id: "businessUnits", label: "Business Units", requiredModule: "SETTINGS", requiredAction: "READ" },
];

function SettingsSidebar({ activeTab, onTabChange, onClose }: { activeTab: TabType; onTabChange: (tab: TabType) => void; onClose?: () => void }) {
  const { can } = usePermissions();

  return (
    <Box sx={{ overflowY: "auto" }}>
      <Typography fontWeight={700} mb={3} sx={{ px: 2, pt: 1 }}>
        Settings
      </Typography>

      <List sx={{ gap: 1, display: "flex", flexDirection: "column" }}>
        {NAV_ITEMS.map((item) => {
          const hasAccess = !item.requiredModule || can(item.requiredModule, item.requiredAction || "READ");

          if (!hasAccess) return null;


          return (
            <ListItemButton
              key={item.id}
              selected={activeTab === item.id}
              onClick={() => {
                onTabChange(item.id);
                onClose?.();
              }}
              sx={{
                mb: 1,
                borderRadius: 1,
                "&.Mui-selected": {
                  backgroundColor: "rgba(75, 46, 131, 0.08)",
                  borderLeft: "3px solid #4B2E83",
                  fontWeight: 600,
                },
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <ListItemText primary={item.label} primaryTypographyProps={{ sx: { fontSize: "0.95rem" } }} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <UserProfile />;
      case "roles":
        return (
          <Guard module="SETTINGS" action="UPDATE" fallback={<Alert severity="error">You don't have permission to manage roles.</Alert>}>
            <Roles />
          </Guard>
        );
      case "users":
        return (
          <Guard module="SETTINGS" action="UPDATE" fallback={<Alert severity="error">You don't have permission to manage users.</Alert>}>
            <Users />
          </Guard>
        );
      case "relations":
        return (
          <Guard module="SETTINGS" action="READ" fallback={<Alert severity="error">You don't have permission to view user relations.</Alert>}>
            <UserRelations />
          </Guard>
        );
      case "approvals":
        return (
          <Guard module="SETTINGS" action="READ" fallback={<Alert severity="error">You don't have permission to view approval flows.</Alert>}>
            <ApprovalFlowsList />
          </Guard>
        );
      case "projectApprovals":
        return (
          <Guard module="SETTINGS" action="UPDATE" fallback={<Alert severity="error">You don't have permission to manage project approvals.</Alert>}>
            <ProjectApprovalManagement />
          </Guard>
        );
      case "modules":
        return (
          <Guard module="SETTINGS" action="UPDATE" fallback={<Alert severity="error">You don't have permission to manage modules.</Alert>}>
            <Modules />
          </Guard>
        );
      case "businessUnits":
        return (
          <Guard module="SETTINGS" action="READ" fallback={<Alert severity="error">You don't have permission to view business units.</Alert>}>
            <BusinessUnits />
          </Guard>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          height: "100%",
          background: "#f4f6f8",
          gap: { xs: 0, md: 0 },
        }}
      >
        {/* 🔹 MOBILE DRAWER (xs screens) */}
        {isMobile && (
          <Drawer
            anchor="left"
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            PaperProps={{
              sx: {
                width: 260,
                mt: "64px",
                height: "calc(100% - 64px)",
              },
            }}
          >
            <SettingsSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onClose={() => setMobileDrawerOpen(false)}
            />
          </Drawer>
        )}

        {/* 🔹 SIDEBAR */}
        <Paper
          elevation={0}
          sx={{
            display: { xs: "none", md: "block" },
            width: { md: 240 },
            borderRight: "1px solid #e0e0e0",
            p: 2,
            background: "#fff",
            overflowY: "auto",
            maxHeight: "100%",
            flexShrink: 0,
          }}
        >
          <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </Paper>

        {/* 🔹 CONTENT */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #e0e0e0",
            background: "#fff",
            overflowY: "auto",
            maxHeight: "100%",
          }}
        >
          {/* Mobile Header with Menu Button */}
          {isMobile && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                borderBottom: "1px solid #e0e0e0",
                background: "#fff",
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                Settings
              </Typography>
              <IconButton onClick={() => setMobileDrawerOpen(true)} size="small">
                <MenuIcon />
              </IconButton>
            </Box>
          )}

          <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, flex: 1, overflowY: "auto" }}>
            {renderContent()}
          </Box>
        </Paper>
      </Box>
    </Layout>
  );
}
