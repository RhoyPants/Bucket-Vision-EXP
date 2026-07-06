"use client";

import {
  Box,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Suspense, useMemo } from "react";
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
  permissionKey: string;
  requiredAction?: "view" | "update";
}

const NAV_ITEMS: NavItem[] = [
  { id: "profile", label: "My Profile", permissionKey: "settings_profile" },
  {
    id: "roles",
    label: "Roles",
    permissionKey: "settings_roles",
    requiredAction: "view",
  },
  {
    id: "users",
    label: "Users",
    permissionKey: "settings_users",
    requiredAction: "view",
  },
  {
    id: "userRequests",
    label: "User Requests",
    permissionKey: "settings_user_requests",
    requiredAction: "view",
  },
  {
    id: "relations",
    label: "User Relations",
    permissionKey: "settings_user_relations",
    requiredAction: "view",
  },
  {
    id: "approvals",
    label: "Approval Flows",
    permissionKey: "settings_approval_flows",
    requiredAction: "view",
  },
  {
    id: "projectApprovals",
    label: "Project Approvals",
    permissionKey: "settings_project_approvals",
    requiredAction: "view",
  },
  {
    id: "modules",
    label: "Modules",
    permissionKey: "settings_modules",
    requiredAction: "view",
  },
  {
    id: "businessUnits",
    label: "Business Units",
    permissionKey: "settings_business_units",
    requiredAction: "view",
  },
];

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const { canView } = usePermissions();

  const allowedTabs = useMemo(
    () =>
      NAV_ITEMS.filter((item) => canView(item.permissionKey)).map((item) => item.id),
    [canView]
  );
  const tabParam = searchParams.get("tab") as TabType | null;
  const activeTab = tabParam && allowedTabs.includes(tabParam) ? tabParam : allowedTabs[0];

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <UserProfile />;
      case "roles":
        return (
          <Guard
            permissionKey="settings_roles"
            action="view"
            fallback={
              <Alert severity="error">
                You don&apos;t have permission to view roles.
              </Alert>
            }
          >
            <Roles />
          </Guard>
        );
      case "users":
        return (
          <Guard
            permissionKey="settings_users"
            action="view"
            fallback={
              <Alert severity="error">
                You don&apos;t have permission to view users.
              </Alert>
            }
          >
            <Users />
          </Guard>
        );
      case "relations":
        return (
          <Guard
            permissionKey="settings_user_relations"
            action="view"
            fallback={
              <Alert severity="error">
                You don&apos;t have permission to view user relations.
              </Alert>
            }
          >
            <UserRelations />
          </Guard>
        );
      case "approvals":
        return (
          <Guard
            permissionKey="settings_approval_flows"
            action="view"
            fallback={
              <Alert severity="error">
                You don&apos;t have permission to view approval flows.
              </Alert>
            }
          >
            <ApprovalFlowsList />
          </Guard>
        );
      case "projectApprovals":
        return (
          <Guard
            permissionKey="settings_project_approvals"
            action="view"
            fallback={
              <Alert severity="error">
                You don&apos;t have permission to view project approvals.
              </Alert>
            }
          >
            <ProjectApprovalManagement />
          </Guard>
        );
      case "modules":
        return (
          <Guard
            permissionKey="settings_modules"
            action="view"
            fallback={
              <Alert severity="error">
                You don&apos;t have permission to view modules.
              </Alert>
            }
          >
            <Modules />
          </Guard>
        );
      case "businessUnits":
        return (
          <Guard
            permissionKey="settings_business_units"
            action="view"
            fallback={
              <Alert severity="error">
                You don&apos;t have permission to view business units.
              </Alert>
            }
          >
            <BusinessUnits />
          </Guard>
        );
      case "userRequests":
        return (
          <Guard
            permissionKey="settings_user_requests"
            action="view"
            fallback={
              <Alert severity="error">
                You don&apos;t have permission to manage user requests.
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
