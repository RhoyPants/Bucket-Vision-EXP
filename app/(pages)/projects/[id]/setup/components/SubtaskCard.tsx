import { Box, Button, TextField, Typography } from "@mui/material";
import AssignUsersSelect from "@/app/components/shared/selectors/AssignUsersSelect";

interface SubtaskCardProps {
  sub: any;
  taskId: string;
  isEditing: boolean;
  subtaskInputs: Record<string, any>;
  setSubtaskInputs: (inputs: any) => void;
  members: any[];
  onUpdate: (subId: string, taskId: string) => void;
  onDelete: (subId: string, taskId: string) => void;
  onEdit: () => void;
}

export default function SubtaskCard({
  sub,
  taskId,
  isEditing,
  subtaskInputs,
  setSubtaskInputs,
  members,
  onUpdate,
  onDelete,
  onEdit,
}: SubtaskCardProps) {
  if (!isEditing) {
    return (
      <Box
        sx={{
          minWidth: 220,
          borderRadius: "20px",
          p: 2,
          backgroundColor: "#f9f9f9",
          border: "2px solid #2b6f89",
          flexShrink: 0,
        }}
      >
        <Typography fontWeight={600}>{sub.title}</Typography>

        <Typography fontSize={13}>
          ₱{sub.budgetAllocated} ({sub.budgetPercent?.toFixed(2)}%)
        </Typography>

        <Box fontSize={12} color="gray" mt={1}>
          Start:{" "}
          {sub.projectedStartDate
            ? new Date(sub.projectedStartDate).toLocaleDateString()
            : "-"}
          <br />
          End:{" "}
          {sub.projectedEndDate
            ? new Date(sub.projectedEndDate).toLocaleDateString()
            : "-"}
        </Box>

        {/* ACTIONS */}
        <Box mt={1} display="flex" gap={1}>
          <Button size="small" onClick={onEdit}>
            Edit
          </Button>

          <Button size="small" color="error" onClick={() => onDelete(sub.id, taskId)}>
            Delete
          </Button>
        </Box>
      </Box>
    );
  }

  // Edit Mode
  return (
    <Box
      sx={{
        minWidth: 220,
        borderRadius: "20px",
        p: 2,
        backgroundColor: "#f9f9f9",
        border: "2px solid #2b6f89",
        flexShrink: 0,
      }}
    >
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
          members={members}
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
            onClick={() => onUpdate(sub.id, taskId)}
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
    </Box>
  );
}
