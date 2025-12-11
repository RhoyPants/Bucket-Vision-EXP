import { Box, Paper, Typography } from "@mui/material";

interface StatCardProps {
  title: string;
  value: string | number;
  small?: boolean;
  icon?: React.ReactNode;
}

export default function StatCard({ title, value, small, icon }: StatCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: small ? 1.25 : 2,
        borderRadius: 2.5,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow:3,
        display: "flex",
        alignItems: small ? "center" : "flex-start",
        gap: 2,
        backgroundColor: "#E0DAE6",
      }}
    >
        
      {icon && <Box sx={{ fontSize: small ? 20 : 28, color: "#4B2E83" }}>{icon}</Box>}

      <Box>
        <Typography variant={small ? "caption" : "body2"} color="text.secondary" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant={small ? "h6" : "h5"} sx={{ fontWeight: 700, mt: 0.5 }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}
