import { Box, Typography, Stack, Alert } from "@mui/material";
import { StructuredViewProps, getCompareTheme } from "./types";
import ScopeCard from "./ScopeCard";
import { formatBudget } from "@/app/utils/formatters";

export default function StructuredView({ project, compareMode }: StructuredViewProps) {
  if (!project.scopes || project.scopes.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Alert severity="info">No project structure available</Alert>
      </Box>
    );
  }

  const budgetAllocation = Number(project.totalBudget || 0);
  const allocatedBudget = project.scopes.reduce(
    (total, scope) => total + Number(scope.budgetAllocated || 0),
    0
  );
  const budgetVariance = budgetAllocation - allocatedBudget;

  return (
    <Stack spacing={0}>
      {/* HEADER */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: "#1f2937", mb: 1 }}>
          📊 Project Structure
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280" }}>
          {project.name} — {project.scopes.length} scope{project.scopes.length !== 1 ? "s" : ""}
        </Typography>
      </Box>

      {project.totalBudget !== undefined && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
            mb: 2.5,
            border: "1px solid #cbd5e1",
            borderRadius: 1.5,
            overflow: "hidden",
            bgcolor: "#f8fafc",
            "& > * + *": {
              borderTop: { xs: "1px solid #cbd5e1", sm: 0 },
              borderLeft: { xs: 0, sm: "1px solid #cbd5e1" },
            },
          }}
        >
          {[
            { label: "Budget allocation", value: budgetAllocation },
            { label: "Allocated budget", value: allocatedBudget },
            { label: "Budget variance", value: Math.abs(budgetVariance) },
          ].map((item) => (
            <Box key={item.label} sx={{ p: 1.5 }}>
              <Typography sx={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" }}>
                {item.label}
              </Typography>
              <Typography sx={{ mt: 0.25, color: item.label === "Budget variance" ? budgetVariance < 0 ? "#dc2626" : budgetVariance === 0 ? "#15803d" : "#1e3a8a" : "#111827", fontSize: 14, fontWeight: 800 }}>
                {item.label === "Budget variance"
                  ? budgetVariance === 0
                    ? "Balanced"
                    : `${formatBudget(item.value, true)} ${budgetVariance < 0 ? "over allocation" : "under allocation"}`
                  : formatBudget(item.value, true)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* SCOPES LIST */}
      <Box>
        {project.scopes.map((scope) => (
          <ScopeCard
            key={scope.id}
            scope={scope}
            theme={compareMode ? getCompareTheme(scope.changeStatus) : undefined}
          />
        ))}
      </Box>
    </Stack>
  );
}
