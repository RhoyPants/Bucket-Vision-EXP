"use client";

import {
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Typography,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/app/redux/hook";
import { getProjects } from "@/app/redux/controllers/projectController";

// Helper function to determine user's role in a project (from new API structure)
const getUserRoleInProject = (project: any, userId: string) => {
  const roles: string[] = [];

  // Check via projectMembers array with role field
  if (project.projectMembers && Array.isArray(project.projectMembers)) {
    const member = project.projectMembers.find((m: any) => m.userId === userId);
    if (member) {
      if (member.role === "OWNER") roles.push("owner");
      if (member.role === "SUB_OWNER") roles.push("subowner");
      if (member.role === "MEMBER") roles.push("member");
    }
  }

  // Fallback: Check if ownerId property exists
  if (project.ownerId === userId && !roles.includes("owner")) {
    roles.push("owner");
  }

  return roles;
};

// Helper function to filter projects by user's role
const filterProjectsByRole = (projects: any[], userId: string, role: "owner" | "subowner" | "member") => {
  return projects.filter((project) => {
    const roles = getUserRoleInProject(project, userId);
    return roles.includes(role);
  });
};

// Component to display projects in a role section
const ProjectSection = ({
  title,
  projects,
  roleColor,
  roleBgColor,
  loading,
  user,
  viewType,
}: {
  title: string;
  projects: any[];
  roleColor: string;
  roleBgColor: string;
  loading: boolean;
  user: any;
  viewType: "card" | "table";
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box mb={5}>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
        <Chip
          label={projects.length}
          size="small"
          sx={{
            bgcolor: roleBgColor,
            color: roleColor,
            fontWeight: 600,
          }}
        />
      </Box>

      {projects.length > 0 ? viewType === "card" ? (
        // 🔹 CARD VIEW
        <Grid container spacing={2}>
          {projects.map((project: any) => (
            <Grid
              size={{ xs: 12, sm: 6, md: 4 }}
              key={project.id || project.project_id}
            >
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: "1px solid #e8e7e2",
                  height: "100%",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    border: "1px solid #d6d5cf",
                  },
                  transition: "all 0.2s",
                }}
              >
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>
                    {project.name || project.project_name}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="#888"
                    sx={{ display: "block", mb: 1.5 }}
                  >
                    {project.ref_no}
                  </Typography>

                  {project.description && (
                    <Typography variant="body2" color="#666" sx={{ mb: 1.5 }}>
                      {project.description.substring(0, 80)}
                      {project.description.length > 80 ? "..." : ""}
                    </Typography>
                  )}

                  <Box display="flex" gap={1} flexWrap="wrap" mb={1.5}>
                    {(() => {
                      const roles = getUserRoleInProject(project, user.id);
                      const roleConfig: Record<
                        string,
                        { label: string; bgcolor: string; color: string }
                      > = {
                        owner: {
                          label: "Owner",
                          bgcolor: "#e0e7ff",
                          color: "#4f46e5",
                        },
                        subowner: {
                          label: "Subowner",
                          bgcolor: "#fce7f3",
                          color: "#ee0b9a",
                        },
                        member: {
                          label: "Member",
                          bgcolor: "#dbeafe",
                          color: "#0369a1",
                        },
                      };

                      return roles.map((role) => (
                        <Chip
                          key={role}
                          label={roleConfig[role].label}
                          size="small"
                          sx={{
                            bgcolor: roleConfig[role].bgcolor,
                            color: roleConfig[role].color,
                            fontWeight: 600,
                          }}
                        />
                      ));
                    })()}
                  </Box>

                  <Typography variant="caption" color="#888" sx={{ display: "block", mb: 1 }}>
                    Members ({project.projectMembers?.length || 0})
                  </Typography>

                  <Box display="flex" flexWrap="wrap" gap={0.5} mb={1.5}>
                    {project.projectMembers?.slice(0, 3).map((member: any) => (
                      <Avatar
                        key={member.id}
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: "0.75rem",
                          bgcolor: "#6366f1",
                        }}
                        title={member.user?.name || member.name}
                      >
                        {(member.user?.name || member.name)?.charAt(0) || "M"}
                      </Avatar>
                    ))}
                    {project.projectMembers && project.projectMembers.length > 3 && (
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: "0.75rem",
                          bgcolor: "#cbd5e1",
                          color: "#333",
                        }}
                      >
                        +{project.projectMembers.length - 3}
                      </Avatar>
                    )}
                  </Box>

                  {project.status && (
                    <Chip
                      label={project.status}
                      size="small"
                      sx={{
                        bgcolor:
                          project.status === "active"
                            ? "#dcfce7"
                            : "#fee2e2",
                        color:
                          project.status === "active"
                            ? "#166534"
                            : "#991b1b",
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        // 🔹 TABLE VIEW
        <TableContainer component={Paper} sx={{ border: "1px solid #e8e7e2" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f5f3ff" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "#210e64" }}>
                  Project Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#210e64" }}>
                  Ref.No
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#210e64" }}>
                  Your Role
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#210e64" }}>
                  Members
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#210e64" }}>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project: any) => (
                <TableRow
                  key={project.id || project.project_id}
                  sx={{
                    "&:hover": { bgcolor: "#f9f8ff" },
                    borderBottom: "1px solid #e8e7e2",
                  }}
                >
                  <TableCell>
                    <Typography fontWeight={600}>
                      {project.name || project.project_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="#888">
                      {project.ref_no}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {(() => {
                        const roles = getUserRoleInProject(project, user.id);
                        const roleConfig: Record<
                          string,
                          { label: string; bgcolor: string; color: string }
                        > = {
                          owner: {
                            label: "Owner",
                            bgcolor: "#e0e7ff",
                            color: "#4f46e5",
                          },
                          subowner: {
                            label: "Subowner",
                            bgcolor: "#fce7f3",
                            color: "#ee0b9a",
                          },
                          member: {
                            label: "Member",
                            bgcolor: "#dbeafe",
                            color: "#0369a1",
                          },
                        };

                        return roles.map((role) => (
                          <Chip
                            key={role}
                            label={roleConfig[role].label}
                            size="small"
                            sx={{
                              bgcolor: roleConfig[role].bgcolor,
                              color: roleConfig[role].color,
                              fontWeight: 600,
                            }}
                          />
                        ));
                      })()}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box display="flex" gap={0.5}>
                        {project.projectMembers?.slice(0, 2).map((member: any) => (
                          <Avatar
                            key={member.id}
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: "0.7rem",
                              bgcolor: "#6366f1",
                            }}
                            title={member.user?.name || member.name}
                          >
                            {(member.user?.name || member.name)?.charAt(0) || "M"}
                          </Avatar>
                        ))}
                      </Box>
                      <Typography variant="body2" color="#888">
                        {project.projectMembers?.length || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {project.status && (
                      <Chip
                        label={project.status}
                        size="small"
                        sx={{
                          bgcolor:
                            project.status === "active"
                              ? "#dcfce7"
                              : "#fee2e2",
                          color:
                            project.status === "active"
                              ? "#166534"
                              : "#991b1b",
                        }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="#888">
            You have no {title.toLowerCase()}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default function UserProfile() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { projects, loading } = useAppSelector((state) => state.project);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [viewType, setViewType] = useState<"card" | "table">("card");

  useEffect(() => {
    if (projects.length === 0) {
      console.log("Fetching projects..."); // Debug log
      dispatch(getProjects() as any);
    } else {
      console.log("Projects loaded:", projects); // Debug log
    }
  }, []);

  useEffect(() => {
    // Filter projects where user is a member, owner, or subowner
    if (projects && projects.length > 0 && user) {
      console.log("Current user ID:", user.id); // Debug log
      console.log("All projects:", projects); // Debug log
      
      const filtered = projects.filter((project: any) => {
        const isMember = project.projectMembers?.some((member: any) => {
          console.log("Checking member:", member.userId, "against user:", user.id);
          return member.userId === user.id;
        });
        const isOwner = project.ownerId === user.id;
        
        console.log(`Project ${project.name}: isMember=${isMember}, isOwner=${isOwner}`);
        
        return isMember || isOwner;
      });
      
      console.log("Filtered projects:", filtered); // Debug log
      setUserProjects(filtered);
    }
  }, [projects, user]);

  if (!user) {
    return <Typography>Loading user information...</Typography>;
  }

  const userInitials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <Box
      sx={{
        height: "100%",
        maxHeight: "calc(100vh - 200px)",
        overflowY: "auto",
        overflowX: "hidden",
        paddingRight: "8px",
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-track": {
          background: "#f5f3ff",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb": {
          background: "#d0c4e8",
          borderRadius: "4px",
          "&:hover": {
            background: "#b8acd4",
          },
        },
      }}
    >
      {/* 🔹 HEADER */}
      <Typography variant="h5" fontWeight={700} mb={3}>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* 🔹 USER INFO CARD */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="flex-start" gap={2} mb={3}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: "#6366f1",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "1.5rem",
                  }}
                >
                  {userInitials}
                </Avatar>

                <Box flex={1}>
                  <Typography variant="h6" fontWeight={700}>
                    {user.name}
                  </Typography>
                  <Typography variant="body2" color="#888" sx={{ mb: 1 }}>
                    {user.email}
                  </Typography>

                  <Box display="flex" gap={1} flexWrap="wrap">
                    {user.role && (
                      <Chip
                        label={user.role}
                        size="small"
                        sx={{
                          bgcolor: "#f5f3ff",
                          color: "#210e64",
                          fontWeight: 600,
                        }}
                      />
                    )}
                    {user.isActive && (
                      <Chip
                        label="Active"
                        size="small"
                        sx={{
                          bgcolor: "#dcfce7",
                          color: "#166534",
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* 📋 PROFILE DETAILS */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
                  Account Details
                </Typography>

                <Box mb={1.5}>
                  <Typography variant="caption" color="#888">
                    User ID
                  </Typography>
                  <Typography variant="body2">{user.id}</Typography>
                </Box>

                <Box mb={1.5}>
                  <Typography variant="caption" color="#888">
                    Role
                  </Typography>
                  <Typography variant="body2">{user.role || "N/A"}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="#888">
                    Status
                  </Typography>
                  <Typography variant="body2">
                    {user.isActive ? "Active" : "Inactive"}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 🔹 STATISTICS */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={1} sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} mb={2}>
                Statistics
              </Typography>

              <Box
                display="grid"
                gridTemplateColumns="1fr 1fr"
                gap={2}
              >
                <Paper sx={{ p: 2, bgcolor: "#f5f3ff", border: "none" }}>
                  <Typography variant="caption" color="#888">
                    Total Projects
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="#210e64">
                    {userProjects.length}
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, bgcolor: "#fef3c7", border: "none" }}>
                  <Typography variant="caption" color="#888">
                    User ID
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {user.id.substring(0, 8)}...
                  </Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* 🔹 USER'S PROJECTS BY ROLE */}
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h5" fontWeight={700}>
            My Projects ({userProjects.length})
          </Typography>

          {/* VIEW TYPE TOGGLE */}
          <ToggleButtonGroup
            value={viewType}
            exclusive
            onChange={(event, newViewType) => {
              if (newViewType !== null) setViewType(newViewType);
            }}
            size="small"
            sx={{
              border: "1px solid #e8e7e2",
              borderRadius: 1,
            }}
          >
            <ToggleButton
              value="card"
              sx={{
                textTransform: "none",
                color: viewType === "card" ? "#fff" : "#210e64",
                backgroundColor: viewType === "card" ? "#210e64" : "transparent",
                "&.Mui-selected": {
                  backgroundColor: "#210e64",
                  color: "#fff",
                },
                "&:hover": {
                  backgroundColor: viewType === "card" ? "#210e64" : "#f5f3ff",
                },
              }}
            >
              Card View
            </ToggleButton>
            <ToggleButton
              value="table"
              sx={{
                textTransform: "none",
                color: viewType === "table" ? "#fff" : "#210e64",
                backgroundColor: viewType === "table" ? "#210e64" : "transparent",
                "&.Mui-selected": {
                  backgroundColor: "#210e64",
                  color: "#fff",
                },
                "&:hover": {
                  backgroundColor: viewType === "table" ? "#210e64" : "#f5f3ff",
                },
              }}
            >
              Table View
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* OWNER PROJECTS */}
        <ProjectSection
          title="Owner"
          projects={filterProjectsByRole(userProjects, user.id, "owner")}
          roleColor="#4f46e5"
          roleBgColor="#e0e7ff"
          loading={loading}
          user={user}
          viewType={viewType}
        />

        {/* SUBOWNER PROJECTS */}
        <ProjectSection
          title="Subowner"
          projects={filterProjectsByRole(userProjects, user.id, "subowner")}
          roleColor="#ee0b9a"
          roleBgColor="#fce7f3"
          loading={loading}
          user={user}
          viewType={viewType}
        />

        {/* MEMBER PROJECTS */}
        <ProjectSection
          title="Member"
          projects={filterProjectsByRole(userProjects, user.id, "member")}
          roleColor="#0369a1"
          roleBgColor="#dbeafe"
          loading={loading}
          user={user}
          viewType={viewType}
        />

        {/* NO PROJECTS MESSAGE */}
        {!loading && userProjects.length === 0 && (
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography color="#888">
              You are not a member of any projects yet
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
