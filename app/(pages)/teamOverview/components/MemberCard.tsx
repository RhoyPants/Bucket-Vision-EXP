import { Box, Paper, Typography, Button } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

interface MemberProps {
  name: string;
  role: string;
  project: string;
  current: string;
  status: string;
}

export default function MemberCard({
  name,
  role,
  project,
  current,
  status,
}: MemberProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: 2.25,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 6px 18px rgba(15,15,15,0.03)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#fff",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            bgcolor: "grey.200",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AccountCircleIcon sx={{ fontSize: 72, color: "grey.600" }} />
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 800 }}>{name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {role}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{ mt: 1.75, fontSize: 13, color: "text.primary", lineHeight: 1.5 }}
      >
        <Typography variant="body2">
          <strong>Project:</strong> {project}
        </Typography>
        <Typography variant="body2">
          <strong>Current:</strong> {current}
        </Typography>
        <Typography variant="body2">
          <strong>Status:</strong> {status}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button
          variant="contained"
          size="small"
          sx={{
            backgroundColor: "#4B2E83",
            "&:hover": { backgroundColor: "#3f2566" },
            textTransform: "none",
            fontWeight: 500,
            py: 1,
          }}
        >
          View
        </Button>
      </Box>
    </Paper>
  );
}
