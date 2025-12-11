import { Paper, Typography, Grid } from "@mui/material";

export default function TeamRoles() {
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
      <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 2 }}>Team Roles and Department</Typography>

      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
            Team Members: <span style={{ fontWeight: 400 }}>6</span>
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
            UI/UX Designers: <span style={{ fontWeight: 400 }}>2</span>
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
            QA Team: <span style={{ fontWeight: 400 }}>1</span>
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Project Managers: <span style={{ fontWeight: 400 }}>3</span>
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ mb: 0.75 }}>
            • Emma completed the Login Module
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.75 }}>
            • James resolved 12 bugs this week
          </Typography>
          <Typography variant="body2">• Fiona finished the UX Workshop</Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}
