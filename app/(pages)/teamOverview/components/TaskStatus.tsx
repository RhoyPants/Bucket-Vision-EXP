import { Box, Paper, Typography, LinearProgress } from "@mui/material";

const statusData = [
  { name: "Liam", value: 85 },
  { name: "Fiona", value: 78 },
  { name: "James", value: 82 },
  { name: "Michael", value: 88 },
  { name: "Glivia", value: 90 },
  { name: "Grace", value: 87 },
];

export default function TaskStatus() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 6px 18px rgba(15,15,15,0.03)",
        backgroundColor: "#fff",
      }}
    >
      <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 2 }}>Task Status Breakdown</Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
        {statusData.map((item) => (
          <Box key={item.name}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2">{item.name}</Typography>
              <Typography variant="body2">{item.value}%</Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={item.value}
              sx={{
                height: 9,
                borderRadius: 3,
                "& .MuiLinearProgress-bar": { borderRadius: 3, backgroundColor: "#4B2E83" },
                backgroundColor: "rgba(75,46,131,0.12)",
              }}
            />
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
