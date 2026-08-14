import { Card, Box, Typography, LinearProgress, Stack, Divider } from "@mui/material";
import { Scope, CompareTheme, getCompareTheme } from "./types";
import TaskRow from "./TaskRow";
import { formatBudget, formatPercent } from "@/app/utils/formatters";

interface ScopeCardProps {
  scope: Scope;
  theme?: CompareTheme;
}

export default function ScopeCard({ scope, theme }: ScopeCardProps) {
  const ct = theme;
  const isModified = ct !== undefined && scope.changeStatus === "MODIFIED";
  const scopeBudget = Number(scope.budgetAllocated || 0);
  const taskTotal = (scope.tasks || []).reduce(
    (total, task) => total + Number(task.budgetAllocated || 0),
    0
  );
  const budgetVariance = scopeBudget - taskTotal;

  return (
    <Card
      sx={{
        mb: 3,
        border: ct ? `1px solid ${ct.border}` : "1px solid #e5e7eb",
        ...(isModified && { borderLeft: `4px solid ${ct!.accent}` }),
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        overflow: "hidden",
        bgcolor: ct ? ct.background : "#ffffff",
        transition: "all 0.2s",
        "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
      }}
    >
      {/* SCOPE HEADER */}
      <Box sx={{ p: 2.5, bgcolor: ct ? ct.background : "#ffffff", borderBottom: ct ? `1px solid ${ct.border}` : "1px solid #e5e7eb" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "start", columnGap: 3, mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700} fontSize={16} sx={{ color: ct ? ct.text : "#1f2937", mb: 0.5 }}>
              {scope.name}
            </Typography>
            {scope.description && (
              <Typography variant="caption" sx={{ color: "#6b7280", display: "block" }}>
                {scope.description}
              </Typography>
            )}
          </Box>
          <Box sx={{ textAlign: "right", flexShrink: 0 }}>
            <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "block", mb: 0.25 }}>
              Weight
            </Typography>
            <Typography fontWeight={700} fontSize={14} sx={{ color: "#1f2937" }}>
              {formatPercent(scope.budgetPercent)}
            </Typography>
          </Box>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 0.75, sm: 1.5 }}
          sx={{
            mb: 1.5,
            "& > * + *": {
              borderTop: { xs: "1px solid #e2e8f0", sm: 0 },
              borderLeft: { xs: 0, sm: "1px solid #cbd5e1" },
              pt: { xs: 0.75, sm: 0 },
              pl: { xs: 0, sm: 1.5 },
            },
          }}
        >
          <Typography sx={{ color: "#475569", fontSize: 12 }}>
            Allocated budget: <strong>{formatBudget(scopeBudget, true)}</strong>
          </Typography>
          <Typography sx={{ color: "#475569", fontSize: 12 }}>
            Total tasks: <strong>{formatBudget(taskTotal, true)}</strong>
          </Typography>
          <Typography sx={{ color: "#475569", fontSize: 12, fontWeight: 700 }}>
            Budget variance:{" "}
            <Box component="span" sx={{ color: budgetVariance < 0 ? "#dc2626" : budgetVariance === 0 ? "#15803d" : "#1e3a8a" }}>
              {budgetVariance === 0
                ? "Balanced"
                : `${formatBudget(Math.abs(budgetVariance), true)} ${budgetVariance < 0 ? "over allocation" : "under allocation"}`}
            </Box>
          </Typography>
        </Stack>

        {/* PROGRESS */}
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
            <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600 }}>Overall Progress</Typography>
            <Typography variant="caption" sx={{ color: "#1f2937", fontWeight: 700 }}>{formatPercent(scope.progress)}</Typography>
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
                background: ct ? ct.accent : "linear-gradient(90deg, #3b82f6 0%, #1e40af 100%)",
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
                <TaskRow
                  task={task}
                  theme={ct ? getCompareTheme(task.changeStatus) : undefined}
                />
                {idx < scope.tasks.length - 1 && <Divider sx={{ my: 1.5 }} />}
              </Box>
            ))}
          </Stack>
        </Box>
      ) : (
        <Box sx={{ p: 2.5, textAlign: "center" }}>
          <Typography variant="caption" sx={{ color: "#9ca3af" }}>No tasks defined</Typography>
        </Box>
      )}
    </Card>
  );
}
