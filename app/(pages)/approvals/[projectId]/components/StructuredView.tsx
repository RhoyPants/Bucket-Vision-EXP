import { Box, Typography, Stack, Alert } from "@mui/material";
import { StructuredViewProps } from "./types";
import ScopeCard from "./ScopeCard";

export default function StructuredView({ project }: StructuredViewProps) {
  if (!project.scopes || project.scopes.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Alert severity="info">No project structure available</Alert>
      </Box>
    );
  }

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

      {/* SCOPES LIST */}
      <Box>
        {project.scopes.map((scope) => (
          <ScopeCard key={scope.id} scope={scope} />
        ))}
      </Box>
    </Stack>
  );
}
