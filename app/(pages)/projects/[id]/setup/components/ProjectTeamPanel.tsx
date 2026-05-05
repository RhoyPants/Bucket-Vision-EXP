"use client";

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  Button,
  IconButton,
  Chip,
  Paper,
  Tooltip,
  Skeleton,
  Checkbox,
} from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  getProjectMembers,
  removeProjectMember,
  assignProjectMembers,
  updateProjectMemberRole,
} from "@/app/redux/controllers/projectMemberController";
import { getUsers } from "@/app/redux/controllers/userController";
import { getProjectById } from "@/app/redux/controllers/projectController";

import AssignSubOwnerSelect from "@/app/components/shared/selectors/AssignSubOwnerSelect";
import AssignMemberSelect from "@/app/components/shared/selectors/AssignMemberSelect";

import { useEffect, useMemo, useState } from "react";

interface ProjectTeamPanelProps {
  projectId: string;
}

export default function ProjectTeamPanel({
  projectId,
}: ProjectTeamPanelProps) {
  const dispatch = useAppDispatch();

  const { projectMembers, loading, error } = useAppSelector(
    (state) => state.projectMembers
  );

  const { users = [], loading: usersLoading } = useAppSelector(
    (state) => state.user
  );

  const { fullProject } = useAppSelector((state) => state.project);

  const [removing, setRemoving] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const [selectedForRemoval, setSelectedForRemoval] = useState<Set<string>>(new Set());
  const [optimisticMembers, setOptimisticMembers] = useState<any>({
    owner: [],
    subOwners: [],
    members: [],
  });

  // =========================
  // FETCH
  // =========================
  useEffect(() => {
    if (projectId) {
      dispatch(getProjectMembers(projectId) as any);
      dispatch(getProjectById(projectId) as any);
    }
  }, [projectId, dispatch]);

  useEffect(() => {
    if (!users.length) {
      dispatch(getUsers() as any);
    }
  }, [dispatch, users.length]);

  // =========================
  // 🔥 NORMALIZED ASSIGNED USERS (FIX BUG)
  // =========================
  const assignedUsers = useMemo(() => {
    const all = [
      ...(projectMembers.owner || []),
      ...(projectMembers.subOwners || []),
      ...(projectMembers.members || []),
    ];

    return all.map((u: any) => ({
      id: u.userId || u.user?.id || u.id,
    }));
  }, [projectMembers]);

  // =========================
  // 🔥 GET OWNER USER DETAILS
  // =========================
  const ownerUser = useMemo(() => {
    if (!fullProject?.ownerId || !users.length) return null;
    return users.find((u: any) => u.id === fullProject.ownerId);
  }, [fullProject?.ownerId, users]);

  // =========================
  // HANDLERS
  // =========================
  const handleAddMultipleMembers = async (
    users: any[],
    role: "SUB_OWNER" | "MEMBER"
  ) => {
    try {
      const userIds = users.map((u) => u.id);

      // 🔥 OPTIMISTIC UPDATE
      setOptimisticMembers((prev: any) => {
        const key = role === "SUB_OWNER" ? "subOwners" : "members";
        return {
          ...prev,
          [key]: [...(prev[key] || []), ...users.map((u) => ({ ...u, projectRole: role }))],
        };
      });

      await dispatch(
        assignProjectMembers(projectId, userIds, role) as any
      );

      setAssignSuccess(
        `${users.length} ${role === "SUB_OWNER" ? "Sub-Owner" : "Member"}${users.length > 1 ? "s" : ""} added successfully`
      );
      setOptimisticMembers({
        owner: [],
        subOwners: [],
        members: [],
      });

      // Refresh
      dispatch(getProjectMembers(projectId) as any);

      setTimeout(() => setAssignSuccess(null), 2000);
    } catch (err) {
      console.error("Error adding members:", err);
      setOptimisticMembers({
        owner: [],
        subOwners: [],
        members: [],
      });
    }
  };

  const handleRemove = async (userIds: string | string[]) => {
    try {
      // Normalize to array
      const ids = Array.isArray(userIds) ? userIds : [userIds];

      // 🔥 OPTIMISTIC UPDATE
      setRemoving(ids[0]); // Show loading for first one
      setOptimisticMembers((prev: any) => ({
        ...prev,
        owner: prev.owner?.filter((m: any) => !ids.includes(m.userId || m.id)),
        subOwners: prev.subOwners?.filter((m: any) => !ids.includes(m.userId || m.id)),
        members: prev.members?.filter((m: any) => !ids.includes(m.userId || m.id)),
      }));

      await dispatch(removeProjectMember(projectId, ids) as any);

      // Clear selection
      setSelectedForRemoval(new Set());

      setAssignSuccess(
        `${ids.length} member${ids.length > 1 ? "s" : ""} removed successfully`
      );

      // Refresh
      dispatch(getProjectMembers(projectId) as any);

      setTimeout(() => setAssignSuccess(null), 2000);
    } catch (err) {
      console.error("Error removing member:", err);
      setOptimisticMembers({
        owner: [],
        subOwners: [],
        members: [],
      });
    } finally {
      setRemoving(null);
    }
  };

  // 🔄 TOGGLE MEMBER ROLE
  const handleToggleRole = async (userId: string, currentRole: string) => {
    try {
      setToggling(userId);
      const newRole = currentRole === "SUB_OWNER" ? "MEMBER" : "SUB_OWNER";

      await dispatch(
        updateProjectMemberRole(projectId, userId, newRole) as any
      );

      setAssignSuccess(
        `Member role changed to ${newRole === "SUB_OWNER" ? "Sub-Owner" : "Member"}`
      );

      // Refresh
      dispatch(getProjectMembers(projectId) as any);

      setTimeout(() => setAssignSuccess(null), 2000);
    } catch (err) {
      console.error("Error toggling role:", err);
    } finally {
      setToggling(null);
    }
  };

  // Use optimistic data if available (has actual members), otherwise use real data
  const displayMembers =
    optimisticMembers &&
    (optimisticMembers.owner?.length ||
      optimisticMembers.subOwners?.length ||
      optimisticMembers.members?.length)
      ? optimisticMembers
      : projectMembers;

  // =========================
  // TABLE ROW
  // =========================
  const MemberRow = ({
    members,
    title,
    icon: Icon,
  }: {
    members?: any[];
    title: string;
    icon?: any;
  }) => {
    if (!members || members.length === 0) return null;

    const getUserId = (m: any) => m.userId || m.user?.id || m.id;
    const getName = (m: any) => m.name || m.user?.name || "Unnamed";
    const getRole = (m: any) => m.user?.role?.name || "No role";

    // Count selected in this section
    const selectedInSection = members.filter((m) =>
      selectedForRemoval.has(getUserId(m))
    );

    const toggleSelection = (userId: string) => {
      const newSet = new Set(selectedForRemoval);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      setSelectedForRemoval(newSet);
    };

    const selectAll = () => {
      const newSet = new Set(selectedForRemoval);
      members.forEach((m) => {
        newSet.add(getUserId(m));
      });
      setSelectedForRemoval(newSet);
    };

    const deselectAll = () => {
      const newSet = new Set(selectedForRemoval);
      members.forEach((m) => {
        newSet.delete(getUserId(m));
      });
      setSelectedForRemoval(newSet);
    };

    const handleBatchRemove = () => {
      const idsToRemove = Array.from(selectedInSection.map((m) => getUserId(m)));
      if (idsToRemove.length > 0) {
        handleRemove(idsToRemove);
      }
    };

    return (
      <Paper
        sx={{
          mb: 2,
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          },
        }}
      >
        {/* HEADER */}
        <Box
          display="flex"
          alignItems="center"
          px={2.5}
          py={1.5}
          sx={{
            bgcolor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          }}
        >
          {Icon && <Icon sx={{ mr: 1.5, fontSize: 20 }} />}
          <Typography fontWeight={600} flex={1}>
            {title}
          </Typography>
          <Chip
            label={members.length}
            size="small"
            sx={{
              bgcolor: "rgba(255,255,255,0.3)",
              color: "white",
              fontWeight: 600,
            }}
          />
        </Box>

        {/* MEMBERS LIST */}
        <Box>
          {members.map((member, idx) => {
            const uid = getUserId(member);
            const name = getName(member);
            const isSelected = selectedForRemoval.has(uid);
            const isRemoving = removing === uid;

            return (
              <Box
                key={uid}
                display="flex"
                alignItems="center"
                px={2.5}
                py={1.3}
                sx={{
                  borderBottom: idx < members.length - 1 ? "1px solid #f0f0f0" : "none",
                  transition: "all 0.2s ease",
                  bgcolor: isSelected ? "rgba(102, 126, 234, 0.08)" : "transparent",
                  opacity: isRemoving ? 0.5 : 1,
                  "&:hover": {
                    bgcolor: isSelected ? "rgba(102, 126, 234, 0.12)" : "#fafbfc",
                  },
                }}
              >
                {/* CHECKBOX */}
                <Checkbox
                  size="small"
                  checked={isSelected}
                  onChange={() => toggleSelection(uid)}
                  disabled={isRemoving}
                  sx={{
                    mr: 1,
                  }}
                />

                {/* AVATAR + NAME */}
                <Box flex={1} display="flex" alignItems="center" gap={1.5}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      fontSize: 16,
                      fontWeight: 600,
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                  >
                    {name?.[0]?.toUpperCase()}
                  </Avatar>

                  <Box flex={1}>
                    <Typography fontSize={14} fontWeight={500}>
                      {name}
                    </Typography>
                    <Typography fontSize={12} color="textSecondary">
                      {getRole(member)}
                    </Typography>
                  </Box>
                </Box>

                {/* ROLE BADGE */}
                <Chip
                  label={member.projectRole || title}
                  size="small"
                  sx={{
                    mr: 1,
                    bgcolor:
                      title === "Owners"
                        ? "#fef3c7"
                        : title === "Sub Owners"
                          ? "#dbeafe"
                          : "#e0f2fe",
                    color:
                      title === "Owners"
                        ? "#d97706"
                        : title === "Sub Owners"
                          ? "#0284c7"
                          : "#0369a1",
                    fontWeight: 600,
                  }}
                />

                {/* TOGGLE ROLE BUTTON (for LEADER users only) */}
                {getRole(member)?.toLowerCase() === "leader" && title !== "Owners" && (
                  <Tooltip
                    title={`Change to ${title === "Sub Owners" ? "Member" : "Sub-Owner"}`}
                  >
                    <Button
                      size="small"
                      onClick={() => handleToggleRole(uid, title === "Sub Owners" ? "SUB_OWNER" : "MEMBER")}
                      disabled={toggling === uid}
                      sx={{
                        textTransform: "none",
                        fontSize: 11,
                        mr: 1,
                        color: "#667eea",
                        border: "1px solid #667eea",
                        "&:hover": {
                          bgcolor: "rgba(102, 126, 234, 0.1)",
                        },
                      }}
                    >
                      {toggling === uid ? (
                        <CircularProgress size={14} sx={{ mr: 0.5 }} />
                      ) : title === "Sub Owners" ? (
                        "To Member"
                      ) : (
                        "To Sub-Owner"
                      )}
                    </Button>
                  </Tooltip>
                )}

                {/* QUICK DELETE BUTTON */}
                <Tooltip title="Remove member">
                  <IconButton
                    size="small"
                    onClick={() => handleRemove(uid)}
                    disabled={isRemoving || selectedForRemoval.size > 0}
                    sx={{
                      color: "error.main",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "error.lighter",
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          })}
        </Box>

        {/* BATCH DELETE SECTION */}
        {selectedInSection.length > 0 && (
          <Box
            sx={{
              bgcolor: "rgba(239, 68, 68, 0.05)",
              borderTop: "1px solid rgba(239, 68, 68, 0.2)",
              px: 2.5,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography fontSize={14} fontWeight={500} color="error">
              {selectedInSection.length} member{selectedInSection.length > 1 ? "s" : ""} selected
            </Typography>

            <Box display="flex" gap={1}>
              {selectedInSection.length < members.length && (
                <Button
                  size="small"
                  onClick={selectAll}
                  sx={{
                    textTransform: "none",
                    fontSize: 12,
                    color: "error.main",
                  }}
                >
                  Select All
                </Button>
              )}

              {selectedInSection.length > 0 && (
                <Button
                  size="small"
                  onClick={deselectAll}
                  sx={{
                    textTransform: "none",
                    fontSize: 12,
                  }}
                >
                  Deselect
                </Button>
              )}

              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={handleBatchRemove}
                disabled={loading || selectedInSection.length === 0}
                startIcon={<DeleteIcon />}
                sx={{
                  textTransform: "none",
                  fontSize: 12,
                }}
              >
                Remove {selectedInSection.length}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    );
  };

  // =========================
  // RENDER
  // =========================
  return (
    <Box>
      {/* HEADER */}
      <Box display="flex" alignItems="center" gap={1.5} mb={3}>
        <GroupOutlinedIcon sx={{ fontSize: 28, color: "#667eea" }} />
        <Typography fontWeight={700} fontSize={20}>
          Project Team
        </Typography>
        <Typography color="textSecondary" fontSize={14}>
          ({(displayMembers?.owner?.length || 0) + (displayMembers?.subOwners?.length || 0) + (displayMembers?.members?.length || 0)} members)
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {assignSuccess && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          ✨ {assignSuccess}
        </Alert>
      )}

      {/* ADD MEMBER SECTION */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          border: "1px solid rgba(102, 126, 234, 0.1)",
          boxShadow: "0 4px 15px rgba(102, 126, 234, 0.1)",
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
          <PersonAddOutlinedIcon sx={{ fontSize: 22, color: "#667eea" }} />
          <Typography fontSize={16} fontWeight={600}>
            Add Team Members
          </Typography>
        </Box>

        {usersLoading ? (
          <Box display="flex" gap={2}>
            <Skeleton variant="rectangular" width={200} height={42} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={200} height={42} sx={{ borderRadius: 1 }} />
          </Box>
        ) : (
          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
            gap={2}
          >
            <AssignSubOwnerSelect
              members={users}
              assignedUsers={assignedUsers}
              onSelectMultiple={(selectedUsers) => {
                if (selectedUsers.length > 0) {
                  handleAddMultipleMembers(selectedUsers, "SUB_OWNER");
                }
              }}
              loading={usersLoading}
            />

            <AssignMemberSelect
              members={users}
              assignedUsers={assignedUsers}
              onSelectMultiple={(selectedUsers) => {
                if (selectedUsers.length > 0) {
                  handleAddMultipleMembers(selectedUsers, "MEMBER");
                }
              }}
              loading={usersLoading}
            />
          </Box>
        )}
      </Paper>

      {/* MEMBERS LIST */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress size={40} />
        </Box>
      ) : (
        <>
          {/* PROJECT CREATOR/OWNER */}
          {ownerUser ? (
            <Paper
              sx={{
                mb: 2,
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                },
              }}
            >
              {/* HEADER */}
              <Box
                display="flex"
                alignItems="center"
                px={2.5}
                py={1.5}
                sx={{
                  bgcolor: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                  color: "white",
                }}
              >
                <GroupOutlinedIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography fontWeight={600} flex={1}>
                  Project Creator
                </Typography>
                <Chip
                  label="Owner"
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.3)",
                    color: "white",
                    fontWeight: 600,
                  }}
                />
              </Box>

              {/* CREATOR INFO */}
              <Box
                display="flex"
                alignItems="center"
                px={2.5}
                py={1.5}
                sx={{
                  "&:hover": {
                    bgcolor: "#fafbfc",
                  },
                }}
              >
                <Box flex={1} display="flex" alignItems="center" gap={1.5}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      fontSize: 16,
                      fontWeight: 600,
                      background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                    }}
                  >
                    {ownerUser?.name?.[0]?.toUpperCase()}
                  </Avatar>

                  <Box flex={1}>
                    <Typography fontSize={14} fontWeight={500}>
                      {ownerUser?.name || "Unknown"}
                    </Typography>
                    <Typography fontSize={12} color="textSecondary">
                      {ownerUser?.email || "No email"}
                    </Typography>
                  </Box>
                </Box>

                {/* ROLE BADGE */}
                <Chip
                  label="Creator"
                  size="small"
                  sx={{
                    bgcolor: "#fef3c7",
                    color: "#d97706",
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Paper>
          ) : null}

          {displayMembers.owner && displayMembers.owner.length > 0 && (
            <MemberRow members={displayMembers.owner} title="Owners" icon={GroupOutlinedIcon} />
          )}
          {displayMembers.subOwners && displayMembers.subOwners.length > 0 && (
            <MemberRow
              members={displayMembers.subOwners}
              title="Sub Owners"
              icon={GroupOutlinedIcon}
            />
          )}
          {displayMembers.members && displayMembers.members.length > 0 && (
            <MemberRow
              members={displayMembers.members}
              title="Members"
              icon={GroupOutlinedIcon}
            />
          )}

          {!displayMembers.owner &&
            !displayMembers.subOwners &&
            !displayMembers.members && (
              <Paper
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: 2,
                  bgcolor: "#f9fafb",
                }}
              >
                <GroupOutlinedIcon
                  sx={{ fontSize: 48, color: "#d1d5db", mb: 1 }}
                />
                <Typography color="textSecondary" fontSize={14}>
                  No team members assigned yet. Add your first member above!
                </Typography>
              </Paper>
            )}
        </>
      )}
    </Box>
  );
}