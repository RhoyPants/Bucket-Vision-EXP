export interface PagePermissionRoute {
  key: string;
  name: string;
  path: string;
}

export const protectedPageRoutes: PagePermissionRoute[] = [
  { key: "personal_dashboard", name: "Personal Dashboard", path: "/personalDashboard" },
  { key: "projects", name: "Projects", path: "/projects" },
  { key: "project_setup", name: "Project Setup", path: "/projects/:id/setup" },
  { key: "approval_review", name: "Approval Review", path: "/approvals/:projectId" },
  { key: "my_requests", name: "My Requests", path: "/myRequests" },
  { key: "my_approvals", name: "My Approvals", path: "/myApprovals" },
  { key: "my_drafts", name: "My Drafts", path: "/myDrafts" },
  { key: "sprint_management", name: "Sprint Management", path: "/sprintManagement" },
  { key: "task_board", name: "Task Board", path: "/taskboard" },
  { key: "team_overview", name: "Team Overview", path: "/teamOverview" },
  { key: "reports", name: "Reports", path: "/reports" },
  { key: "daily_reports", name: "Daily Reports", path: "/reports/daily" },
  { key: "weekly_reports", name: "Weekly Reports", path: "/reports/weekly" },
  { key: "project_calendar", name: "Project Calendar", path: "/projectCalendar" },
  { key: "project_timeline", name: "Project Timeline", path: "/projectTimeline" },
  { key: "versioning", name: "Versioning", path: "/versioning" },
  { key: "settings", name: "Settings", path: "/settings" },
];

const normalizePathname = (pathname: string) =>
  pathname.replace(/\/+$/, "") || "/";

const routePatternToRegExp = (path: string) => {
  const pattern = normalizePathname(path)
    .split("/")
    .map((segment) =>
      segment.startsWith(":")
        ? "[^/]+"
        : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    .join("/");

  return new RegExp(`^${pattern}$`);
};

export function getPermissionRouteForPath(
  pathname: string
): PagePermissionRoute | null {
  const normalizedPathname = normalizePathname(pathname);

  return (
    protectedPageRoutes.find((route) =>
      routePatternToRegExp(route.path).test(normalizedPathname)
    ) || null
  );
}
