import { Box, Button, TextField, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getEngagedUsers } from "@/app/redux/controllers/projectMemberController";
import AssignUsersSelect from "@/app/components/shared/selectors/AssignUsersSelect";
import { useEffect, useMemo } from "react";

interface SubtaskFormProps {
  taskId: string;
  projectId?: string;
  subtaskInputs: Record<string, any>;
  setSubtaskInputs: (inputs: any) => void;
  members?: any[];  // kept for backward compatibility
  onAddSubtask: (taskId: string) => void;
}

export default function SubtaskForm({
  taskId,
  projectId,
  subtaskInputs,
  setSubtaskInputs,
  members,
  onAddSubtask,
}: SubtaskFormProps) {
  const dispatch = useAppDispatch();
  const { engagedUsers } = useAppSelector((state) => state.projectMembers);
  const { fullProject } = useAppSelector((state) => state.project);
  const { users = [] } = useAppSelector((state) => state.user);

  // Load engaged users if projectId is provided
  useEffect(() => {
    if (projectId) {
      dispatch(getEngagedUsers(projectId) as any);
    }
  }, [projectId, dispatch]);

  const isOpen = subtaskInputs[taskId]?.open;

  // 🔥 Include owner with engaged users
  const assignableUsers = useMemo(() => {
    const userIds = new Set(engagedUsers.map((u: any) => u.id || u.userId));
    
    // Get owner user object
    if (fullProject?.ownerId && users.length > 0) {
      const ownerUser = users.find((u: any) => u.id === fullProject.ownerId);
      if (ownerUser && !userIds.has(ownerUser.id)) {
        return [ownerUser, ...engagedUsers];
      }
    }
    
    return engagedUsers;
  }, [engagedUsers, fullProject?.ownerId, users]);

  return (
    <Box
      sx={{
        minWidth: 220,
        borderRadius: "20px",
        border: "2px dashed #2b6f89",
        p: 2,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fafafa",
      }}
    >
      {!isOpen ? (
        <Box
          textAlign="center"
          sx={{ cursor: "pointer" }}
          onClick={() =>
            setSubtaskInputs((prev: any) => ({
              ...prev,
              [taskId]: { open: true },
            }))
          }
        >
          <Typography fontSize={30}>+</Typography>
          <Typography fontSize={12}>Add Subtask</Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={1} width="100%">
          <TextField
            size="small"
            placeholder="Title"
            value={subtaskInputs[taskId]?.title || ""}
            onChange={(e) =>
              setSubtaskInputs((prev: any) => ({
                ...prev,
                [taskId]: {
                  ...prev[taskId],
                  title: e.target.value,
                },
              }))
            }
          />

          <TextField
            size="small"
            placeholder="Budget"
            type="number"
            value={subtaskInputs[taskId]?.budgetAllocated || ""}
            onChange={(e) =>
              setSubtaskInputs((prev: any) => ({
                ...prev,
                [taskId]: {
                  ...prev[taskId],
                  budgetAllocated: e.target.value,
                },
              }))
            }
          />

          <AssignUsersSelect
            members={assignableUsers}
            projectId={projectId}
            value={subtaskInputs[taskId]?.users || []}
            onChange={(users) =>
              setSubtaskInputs((prev: any) => ({
                ...prev,
                [taskId]: {
                  ...prev[taskId],
                  users,
                },
              }))
            }
          />

          <TextField
            size="small"
            type="date"
            value={subtaskInputs[taskId]?.projectedStartDate || ""}
            onChange={(e) =>
              setSubtaskInputs((prev: any) => ({
                ...prev,
                [taskId]: {
                  ...prev[taskId],
                  projectedStartDate: e.target.value,
                },
              }))
            }
          />

          <TextField
            size="small"
            type="date"
            value={subtaskInputs[taskId]?.projectedEndDate || ""}
            onChange={(e) =>
              setSubtaskInputs((prev: any) => ({
                ...prev,
                [taskId]: {
                  ...prev[taskId],
                  projectedEndDate: e.target.value,
                },
              }))
            }
          />

          <Box display="flex" gap={1}>
            <Button
              size="small"
              variant="contained"
              onClick={() => onAddSubtask(taskId)}
            >
              Save
            </Button>

            <Button
              size="small"
              onClick={() =>
                setSubtaskInputs((prev: any) => ({
                  ...prev,
                  [taskId]: {},
                }))
              }
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
