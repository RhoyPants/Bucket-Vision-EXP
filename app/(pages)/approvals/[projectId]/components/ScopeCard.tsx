import { Card, Box, Typography, LinearProgress, Stack, Divider } from "@mui/material";
import { Scope } from "./types";
import TaskRow from "./TaskRow";

interface ScopeCardProps {
  scope: Scope;
}

export default function ScopeCard({ scope }: ScopeCardProps) {
  return (
    <Card
      sx={{
        mb: 3,
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        overflow: "hidden",
        bgcolor: "#ffffff",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        },
      }}
    >
      {/* SCOPE HEADER */}
      <Box sx={{ p: 2.5, bgcolor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}
        >
          <Box>
            <Typography fontWeight={700} fontSize={16} sx={{ color: "#1f2937", mb: 0.5 }}>
              {scope.name}
            </Typography>
            {scope.description && (
              <Typography variant="caption" sx={{ color: "#6b7280", display: "block" }}>
                {scope.description}
              </Typography>
            )}
          </Box>
          {scope.budgetAllocated !== undefined && (
            <Box sx={{ textAlign: "right", flexShrink: 0 }}>
              <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "block", mb: 0.25 }}>
                Budget
              </Typography>
              <Typography fontWeight={700} fontSize={14} sx={{ color: "#1f2937" }}>
                ₱{(scope.budgetAllocated || 0).toLocaleString()}
              </Typography>
            </Box>
          )}
        </Box>

        {/* PROGRESS */}
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
            <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600 }}>
              Overall Progress
            </Typography>
            <Typography variant="caption" sx={{ color: "#1f2937", fontWeight: 700 }}>
              {scope.progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={scope.progress}
            sx={{
              height: 8,
              borderRadius: 1,
              bgcolor: "#e5e7eb",
              "& .MuiLinearProgress-bar": {
                borderRadius: 1,
                background: "linear-gradient(90deg, #3b82f6 0%, #1e40af 100%)",
              },
            }}
          />
        </Box>
      </Box>

      {/* TASKS */}
      {scope.tasks && scope.tasks.length > 0 ? (
        <Box sx={{ p: 2.5 }}>
          <Stack spacing={0}>
            {scope.tasks.map((task, idx) => (
              <Box key={task.id}>
                <TaskRow task={task} />
                {idx < scope.tasks.length - 1 && <Divider sx={{ my: 1.5 }} />}
              </Box>
            ))}
          </Stack>
        </Box>
      ) : (
        <Box sx={{ p: 2.5, textAlign: "center" }}>
          <Typography variant="caption" sx={{ color: "#9ca3af" }}>
            No tasks defined
          </Typography>
        </Box>
      )}
    </Card>
  );
}
