"use client";

import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Roles from "./components/Roles";
import Layout from "@/app/components/shared/Layout";
import Users from "./components/Users";
import UserRelations from "./components/UserRelations";
import UserProfile from "./components/UserProfile";
import ApprovalFlowsList from "./components/ApprovalFlowsList";
import ProjectApprovalManagement from "./components/ProjectApprovalManagement";
import Modules from "./components/Modules";
import BusinessUnits from "./components/BusinessUnits";
import UserRequests from "@/app/(pages)/settings/components/UserRequestsPanel";
import Guard from "@/app/components/shared/Guard";
import { usePermissions } from "@/app/lib/usePermissions";

type TabType =
  | "profile"
  | "roles"
  | "users"
  | "relations"
  | "approvals"
  | "projectApprovals"
  | "modules"
  | "businessUnits"
  | "userRequests";

interface NavItem {
  id: TabType;
  label: string;
  requiredModule?: "SETTINGS" | "USERS";
  requiredAction?: "UPDATE" | "READ";
}

const NAV_ITEMS: NavItem[] = [
  { id: "profile", label: "My Profile" },
  {
    id: "roles",
    label: "Roles",
    requiredModule: "SETTINGS",
    requiredAction: "UPDATE",
  },
  {
    id: "users",
    label: "Users",
    requiredModule: "SETTINGS",
    requiredAction: "UPDATE",
  },
  {
    id: "userRequests",
    label: "User Requests",
    requiredModule: "USERS",
    requiredAction: "READ",
  },
  {
    id: "relations",
    label: "User Relations",
    requiredModule: "SETTINGS",
    requiredAction: "READ",
  },
  {
    id: "approvals",
    label: "Approval Flows",
    requiredModule: "SETTINGS",
    requiredAction: "READ",
  },
  {
    id: "projectApprovals",
    label: "Project Approvals",
    requiredModule: "SETTINGS",
    requiredAction: "UPDATE",
  },
  {
    id: "modules",
    label: "Modules",
    requiredModule: "SETTINGS",
    requiredAction: "UPDATE",
  },
  {
    id: "businessUnits",
    label: "Business Units",
    requiredModule: "SETTINGS",
    requiredAction: "READ",
  },
];

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  const allowedTabs = useMemo(() => NAV_ITEMS.map((item) => item.id), []);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (!tabParam) {
      setActiveTab("profile");
      return;
    }

    if (allowedTabs.includes(tabParam as TabType)) {
      setActiveTab(tabParam as TabType);
      return;
    }

    setActiveTab("profile");
  }, [allowedTabs, searchParams]);

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <UserProfile />;
      case "roles":
        return (
          <Guard
            module="SETTINGS"
            action="UPDATE"
            fallback={
              <Alert severity="error">
                You don't have permission to manage roles.
              </Alert>
            }
          >
            <Roles />
          </Guard>
        );
      case "users":
        return (
          <Guard
            module="SETTINGS"
            action="UPDATE"
            fallback={
              <Alert severity="error">
                You don't have permission to manage users.
              </Alert>
            }
          >
            <Users />
          </Guard>
        );
      case "relations":
        return (
          <Guard
            module="SETTINGS"
            action="READ"
            fallback={
              <Alert severity="error">
                You don't have permission to view user relations.
              </Alert>
            }
          >
            <UserRelations />
          </Guard>
        );
      case "approvals":
        return (
          <Guard
            module="SETTINGS"
            action="READ"
            fallback={
              <Alert severity="error">
                You don't have permission to view approval flows.
              </Alert>
            }
          >
            <ApprovalFlowsList />
          </Guard>
        );
      case "projectApprovals":
        return (
          <Guard
            module="SETTINGS"
            action="UPDATE"
            fallback={
              <Alert severity="error">
                You don't have permission to manage project approvals.
              </Alert>
            }
          >
            <ProjectApprovalManagement />
          </Guard>
        );
      case "modules":
        return (
          <Guard
            module="SETTINGS"
            action="UPDATE"
            fallback={
              <Alert severity="error">
                You don't have permission to manage modules.
              </Alert>
            }
          >
            <Modules />
          </Guard>
        );
      case "businessUnits":
        return (
          <Guard
            module="SETTINGS"
            action="READ"
            fallback={
              <Alert severity="error">
                You don't have permission to view business units.
              </Alert>
            }
          >
            <BusinessUnits />
          </Guard>
        );
      case "userRequests":
        return (
          <Guard
            module="USERS"
            action="READ"
            fallback={
              <Alert severity="error">
                You don't have permission to manage user requests.
              </Alert>
            }
          >
            <UserRequests />
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
          flexDirection: "column",
          minHeight: "100%",
          background: "#f4f6f8",
          gap: 0,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            overflowY: "auto",
            maxHeight: "100%",
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, flex: 1, overflowY: "auto" }}>
            {renderContent()}
          </Box>
        </Paper>
      </Box>
    </Layout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            background: "#f4f6f8",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
